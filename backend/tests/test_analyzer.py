from app.analyzers.python_analyzer import PythonAnalyzer, SyntaxAnalysisError
from tests.sample_code import SAMPLE


def test_real_radon_metrics_not_empty():
    result = PythonAnalyzer().analyze(SAMPLE)
    assert result.loc.loc > 0
    assert result.loc.sloc > 0
    assert result.halstead.volume > 0
    assert result.halstead.effort > 0
    assert result.maintainability.mi >= 0
    names = {f.name for f in result.functions}
    assert "classify_score" in names
    assert "helper" in names
    classify = next(f for f in result.functions if f.name == "classify_score")
    helper = next(f for f in result.functions if f.name == "helper")
    assert classify.cc > helper.cc
    assert classify.is_complex


def test_syntax_error_reports_line():
    try:
        PythonAnalyzer().analyze("def broken(:\n    pass\n")
        raise AssertionError("expected SyntaxAnalysisError")
    except SyntaxAnalysisError as exc:
        assert exc.lineno is not None
        assert exc.message
