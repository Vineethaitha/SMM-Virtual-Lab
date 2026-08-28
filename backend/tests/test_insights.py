from app.analyzers.python_analyzer import PythonAnalyzer
from tests.sample_code import SAMPLE


def test_insights_mention_complexity():
    result = PythonAnalyzer().analyze(SAMPLE)
    titles = " ".join(i.title for i in result.insights)
    assert "complex" in titles.lower() or "complexity" in titles.lower()
    assert result.explanations
    families = {e.family for e in result.explanations}
    assert families == {"loc", "cyclomatic", "halstead", "maintainability"}
