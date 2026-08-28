from app.cfg.builder import CfgBuilder
import ast

from tests.sample_code import SAMPLE


def test_cfg_has_entry_exit_and_decisions():
    tree = ast.parse(SAMPLE)
    graphs = CfgBuilder().build(tree)
    by_fn = {g.function: g for g in graphs}
    g = by_fn["classify_score"]
    types = {n.type for n in g.nodes}
    assert "entry" in types
    assert "exit" in types
    assert "decision" in types
    labels = {e.label for e in g.edges}
    assert "true" in labels
    assert "false" in labels
    for node in g.nodes:
        if node.type != "exit":
            assert node.lineno is not None


def test_returns_go_to_exit_and_decisions_have_false():
    tree = ast.parse(SAMPLE)
    g = next(x for x in CfgBuilder().build(tree) if x.function == "classify_score")
    exit_id = next(n.id for n in g.nodes if n.type == "exit")
    for node in g.nodes:
        if node.type == "return":
            assert any(e.source == node.id and e.target == exit_id for e in g.edges), node.id
        outs = [e for e in g.edges if e.source == node.id]
        if node.type != "exit":
            assert outs, f"{node.id} has no outgoing edges"
        if node.type == "decision":
            labels = {e.label for e in outs}
            assert "true" in labels, node.label
            assert "false" in labels, node.label


def test_loop_cfg():
    tree = ast.parse(SAMPLE)
    g = next(x for x in CfgBuilder().build(tree) if x.function == "total_points")
    assert any(n.type == "loop" for n in g.nodes)
    assert any(e.label == "back" for e in g.edges)
    loop = next(n for n in g.nodes if n.type == "loop")
    labels = {e.label for e in g.edges if e.source == loop.id}
    assert "true" in labels
    assert "false" in labels
