from pathlib import Path

FORBIDDEN = ("eval(", "exec(", "subprocess")


def test_analyzer_never_executes_user_code():
    root = Path(__file__).resolve().parents[1] / "app"
    offenders = []
    for path in root.rglob("*.py"):
        text = path.read_text()
        for token in FORBIDDEN:
            if token in text:
                offenders.append(f"{path}: {token}")
    assert offenders == []
