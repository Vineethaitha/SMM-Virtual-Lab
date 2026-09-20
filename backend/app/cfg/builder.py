from __future__ import annotations

import ast
from typing import Optional

from app.models import CfgEdge, CfgNode, FunctionCfg, NodeType


class CfgBuilder:
    """Build per-function control-flow graphs from Python AST. No execution."""

    def build(self, tree: ast.AST) -> list[FunctionCfg]:
        graphs: list[FunctionCfg] = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                graphs.append(self._build_function(node))
        return graphs

    def _build_function(self, fn: ast.FunctionDef | ast.AsyncFunctionDef) -> FunctionCfg:
        return _FunctionCfg(fn).build()


class _FunctionCfg:
    def __init__(self, fn: ast.FunctionDef | ast.AsyncFunctionDef) -> None:
        self.fn = fn
        self.function = fn.name
        self.nodes: list[CfgNode] = []
        self.edges: list[CfgEdge] = []
        self._seq = 0
        self.exit_id = ""

    def build(self) -> FunctionCfg:
        entry = self._node("entry", "ENTRY", self.fn.lineno, self.fn.lineno)
        exit_node = self._node("exit", "EXIT", self.fn.end_lineno, self.fn.end_lineno)
        self.exit_id = exit_node.id
        body_entry = self._sequence(self.fn.body, self.exit_id)
        self._edge(entry.id, body_entry)
        return FunctionCfg(function=self.function, nodes=self.nodes, edges=self._dedupe_edges())

    def _nid(self) -> str:
        self._seq += 1
        return f"{self.function}_{self._seq}"

    def _node(
        self,
        ntype: NodeType,
        label: str,
        lineno: Optional[int],
        end_lineno: Optional[int],
        condition: Optional[str] = None,
    ) -> CfgNode:
        node = CfgNode(
            id=self._nid(),
            type=ntype,
            label=label[:80],
            lineno=lineno,
            end_lineno=end_lineno or lineno,
            function=self.function,
            condition=condition,
        )
        self.nodes.append(node)
        return node

    def _edge(self, source: str, target: str, label: Optional[str] = None) -> None:
        if not source or not target or source == target:
            return
        self.edges.append(
            CfgEdge(
                id=f"e{len(self.edges) + 1}_{source}_{target}_{label or 'seq'}",
                source=source,
                target=target,
                label=label,  # type: ignore[arg-type]
            )
        )

    def _dedupe_edges(self) -> list[CfgEdge]:
        seen: set[tuple[str, str, Optional[str]]] = set()
        out: list[CfgEdge] = []
        for e in self.edges:
            key = (e.source, e.target, e.label)
            if key in seen:
                continue
            seen.add(key)
            out.append(e)
        return out

    def _sequence(self, stmts: list[ast.stmt], after: str) -> str:
        if not stmts:
            return after

        stmt = stmts[0]
        rest = stmts[1:]

        if isinstance(stmt, (ast.Return, ast.Raise)):
            node = self._block([stmt])
            self._edge(node.id, self.exit_id)
            return node.id

        if isinstance(stmt, ast.Break):
            node = self._block([stmt])
            self._edge(node.id, after)
            return node.id

        if isinstance(stmt, ast.Continue):
            node = self._block([stmt])
            self._edge(node.id, after)
            return node.id

        if isinstance(stmt, ast.If):
            return self._if(stmt, self._sequence(rest, after))

        if isinstance(stmt, (ast.For, ast.AsyncFor, ast.While)):
            return self._loop(stmt, self._sequence(rest, after))

        if isinstance(stmt, ast.Try):
            return self._try(stmt, self._sequence(rest, after))

        if isinstance(stmt, ast.Match):
            return self._match(stmt, self._sequence(rest, after))

        if isinstance(stmt, ast.With):
            return self._sequence(list(stmt.body) + rest, after)

        block_stmts = [stmt]
        j = 0
        while j < len(rest) and not _is_control(rest[j]) and not isinstance(
            rest[j], (ast.Return, ast.Raise, ast.Break, ast.Continue)
        ):
            block_stmts.append(rest[j])
            j += 1
        leftover = rest[j:]
        if leftover and isinstance(leftover[0], (ast.Return, ast.Raise)):
            block_stmts.append(leftover[0])
            leftover = leftover[1:]
            node = self._block(block_stmts)
            self._edge(node.id, self.exit_id)
            return node.id

        node = self._block(block_stmts)
        nxt = self._sequence(leftover, after)
        self._edge(node.id, nxt)
        return node.id

    def _block(self, stmts: list[ast.stmt]) -> CfgNode:
        labels = [_stmt_label(s) for s in stmts]
        label = "\n".join(labels) if labels else "pass"
        start = stmts[0].lineno
        end = stmts[-1].end_lineno or stmts[-1].lineno
        ntype: NodeType = (
            "return" if any(isinstance(s, (ast.Return, ast.Raise)) for s in stmts) else "block"
        )
        return self._node(ntype, label, start, end)

    def _if(self, stmt: ast.If, after: str) -> str:
        cond = _expr_label(stmt.test)
        decision = self._node(
            "decision",
            f"if {cond}",
            stmt.lineno,
            stmt.test.end_lineno or stmt.lineno,
            condition=cond,
        )
        true_entry = self._sequence(stmt.body, after)
        self._edge(decision.id, true_entry, "true")
        if stmt.orelse:
            if len(stmt.orelse) == 1 and isinstance(stmt.orelse[0], ast.If):
                false_entry = self._if(stmt.orelse[0], after)
            else:
                false_entry = self._sequence(stmt.orelse, after)
            self._edge(decision.id, false_entry, "false")
        else:
            self._edge(decision.id, after, "false")
        return decision.id

    def _loop(self, stmt: ast.For | ast.AsyncFor | ast.While, after: str) -> str:
        if isinstance(stmt, ast.While):
            cond = _expr_label(stmt.test)
            label = f"while {cond}"
            end = stmt.test.end_lineno or stmt.lineno
        else:
            target = _expr_label(stmt.target)
            iter_ = _expr_label(stmt.iter)
            cond = f"{target} in {iter_}"
            label = f"for {cond}"
            end = stmt.iter.end_lineno or stmt.lineno

        loop = self._node("loop", label, stmt.lineno, end, condition=cond)
        before = len(self.edges)
        body_entry = self._sequence(stmt.body, loop.id)
        for edge in self.edges[before:]:
            if edge.target == loop.id and edge.label is None:
                edge.label = "back"
        self._edge(loop.id, body_entry, "true")
        if stmt.orelse:
            else_entry = self._sequence(stmt.orelse, after)
            self._edge(loop.id, else_entry, "false")
        else:
            self._edge(loop.id, after, "false")
        return loop.id

    def _try(self, stmt: ast.Try, after: str) -> str:
        return self._sequence(stmt.body, after)

    def _match(self, stmt: ast.Match, after: str) -> str:
        cond = _expr_label(stmt.subject)
        decision = self._node(
            "decision",
            f"match {cond}",
            stmt.lineno,
            stmt.lineno,
            condition=cond,
        )
        for case in stmt.cases:
            entry = self._sequence(case.body, after)
            self._edge(decision.id, entry, "true")
        self._edge(decision.id, after, "false")
        return decision.id


def _is_control(stmt: ast.stmt) -> bool:
    return isinstance(
        stmt,
        (ast.If, ast.For, ast.AsyncFor, ast.While, ast.Try, ast.Match),
    )


def _stmt_label(stmt: ast.stmt) -> str:
    if isinstance(stmt, ast.Return):
        return f"return {_expr_label(stmt.value) if stmt.value else ''}".strip()
    if isinstance(stmt, ast.Raise):
        return "raise"
    if isinstance(stmt, ast.Assign):
        targets = ", ".join(_expr_label(t) for t in stmt.targets)
        return f"{targets} = {_expr_label(stmt.value)}"
    if isinstance(stmt, ast.AnnAssign):
        return f"{_expr_label(stmt.target)} = {_expr_label(stmt.value) if stmt.value else ''}"
    if isinstance(stmt, ast.AugAssign):
        return f"{_expr_label(stmt.target)} {type(stmt.op).__name__}= {_expr_label(stmt.value)}"
    if isinstance(stmt, ast.Expr):
        return _expr_label(stmt.value)
    if isinstance(stmt, ast.Pass):
        return "pass"
    if isinstance(stmt, ast.Break):
        return "break"
    if isinstance(stmt, ast.Continue):
        return "continue"
    return type(stmt).__name__


def _expr_label(node: Optional[ast.AST]) -> str:
    if node is None:
        return ""
    try:
        return ast.unparse(node)
    except Exception:
        return type(node).__name__
