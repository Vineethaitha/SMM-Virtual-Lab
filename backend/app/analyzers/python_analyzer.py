from __future__ import annotations

import ast
from typing import Optional

from app.analyzers.base import CodeAnalyzer
from app.cfg.builder import CfgBuilder
from app.engines.radon_engine import RadonEngine
from app.insights import explanations, generate_insights
from app.models import AnalysisResult, FunctionMetrics, HalsteadMetrics


class SyntaxAnalysisError(Exception):
    def __init__(self, message: str, lineno: Optional[int], offset: Optional[int]) -> None:
        super().__init__(message)
        self.message = message
        self.lineno = lineno
        self.offset = offset


class PythonAnalyzer(CodeAnalyzer):
    language = "python"

    def __init__(self) -> None:
        self.engine = RadonEngine()
        self.cfg = CfgBuilder()

    def analyze(self, source: str) -> AnalysisResult:
        try:
            tree = ast.parse(source)
        except SyntaxError as exc:
            raise SyntaxAnalysisError(
                exc.msg or "Syntax error",
                exc.lineno,
                exc.offset,
            ) from exc

        loc = self.engine.raw_metrics(source)
        cc_blocks = self.engine.cyclomatic(source)
        h_result = self.engine.halstead(source)
        module_h = self.engine.to_halstead_metrics(h_result.total)
        mi = self.engine.maintainability(source)
        cfgs = self.cfg.build(tree)

        h_by_fn = _index_halstead_functions(h_result, self.engine)
        depths = _nested_depths(tree)

        functions: list[FunctionMetrics] = []
        for block in cc_blocks:
            name = block.name
            qname = f"{block.classname}.{name}" if getattr(block, "classname", None) else name
            lineno = block.lineno
            end = getattr(block, "endline", None) or lineno
            depth = depths.get((name, lineno), _max_depth_in_range(tree, lineno, end))
            loc_fn = max(end - lineno + 1, 1)
            cc = int(block.complexity)
            rank = self.engine.rank_cc(cc)
            is_complex = cc >= 10 or depth >= 3 or rank in {"C", "D", "E", "F"}
            functions.append(
                FunctionMetrics(
                    name=name,
                    qualified_name=qname,
                    lineno=lineno,
                    end_lineno=end,
                    col_offset=getattr(block, "col_offset", 0) or 0,
                    is_method=bool(getattr(block, "is_method", False)),
                    classname=getattr(block, "classname", None),
                    cc=cc,
                    rank=rank,
                    loc=loc_fn,
                    nested_decision_depth=depth,
                    is_complex=is_complex,
                    halstead=h_by_fn.get((name, lineno)) or h_by_fn.get(name),
                )
            )

        insights = generate_insights(loc, functions, module_h, mi)
        return AnalysisResult(
            language=self.language,
            loc=loc,
            functions=functions,
            halstead=module_h,
            maintainability=mi,
            cfgs=cfgs,
            insights=insights,
            explanations=explanations(),
        )


def _index_halstead_functions(h_result, engine: RadonEngine) -> dict:
    indexed: dict = {}
    functions = getattr(h_result, "functions", None) or []
    for item in functions:
        report = None
        key: object = None
        if isinstance(item, tuple) and len(item) == 2:
            ident, report = item
            if isinstance(ident, tuple):
                key = (ident[0], ident[1]) if len(ident) >= 2 else ident[0]
            else:
                key = getattr(ident, "name", ident)
        else:
            name = getattr(item, "name", None)
            report = getattr(item, "report", item)
            lineno = getattr(item, "lineno", None)
            key = (name, lineno) if name and lineno else name
        if report is None or key is None:
            continue
        try:
            metrics = engine.to_halstead_metrics(report)
        except Exception:
            continue
        indexed[key] = metrics
        if isinstance(key, tuple):
            indexed[key[0]] = metrics
    return indexed


def _nested_depths(tree: ast.AST) -> dict[tuple[str, int], int]:
    depths: dict[tuple[str, int], int] = {}

    class Visitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
            depths[(node.name, node.lineno)] = _decision_depth(node.body)
            self.generic_visit(node)

        def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
            depths[(node.name, node.lineno)] = _decision_depth(node.body)
            self.generic_visit(node)

    Visitor().visit(tree)
    return depths


def _decision_depth(body: list[ast.stmt], current: int = 0) -> int:
    max_d = current
    for stmt in body:
        if isinstance(stmt, ast.If):
            max_d = max(max_d, current + 1)
            max_d = max(max_d, _decision_depth(stmt.body, current + 1))
            max_d = max(max_d, _decision_depth(stmt.orelse, current + 1))
        elif isinstance(stmt, (ast.For, ast.AsyncFor, ast.While)):
            max_d = max(max_d, current + 1)
            max_d = max(max_d, _decision_depth(stmt.body, current + 1))
            max_d = max(max_d, _decision_depth(stmt.orelse, current + 1))
        elif isinstance(stmt, ast.Try):
            max_d = max(max_d, _decision_depth(stmt.body, current))
            for h in stmt.handlers:
                max_d = max(max_d, current + 1)
                max_d = max(max_d, _decision_depth(h.body, current + 1))
        else:
            for child in ast.iter_child_nodes(stmt):
                if isinstance(child, ast.stmt):
                    max_d = max(max_d, _decision_depth([child], current))
    return max_d


def _max_depth_in_range(tree: ast.AST, start: int, end: int) -> int:
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if node.lineno == start:
                return _decision_depth(node.body)
    return 0
