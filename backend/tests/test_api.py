from fastapi.testclient import TestClient

from app.main import app
from tests.sample_code import SAMPLE

client = TestClient(app)


def test_analyze_endpoint():
    res = client.post("/api/v1/analyze", json={"source": SAMPLE})
    assert res.status_code == 200
    data = res.json()
    assert data["loc"]["loc"] > 0
    assert data["halstead"]["volume"] > 0
    assert data["cfgs"]


def test_syntax_400():
    res = client.post("/api/v1/analyze", json={"source": "def x(:\n  pass"})
    assert res.status_code == 400
