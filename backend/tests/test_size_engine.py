import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.size_models import SizeProject, FPComponent, GSCRating
from app.size_engine import (
    compute_ufp, compute_vaf, compute_afp, compute_kloc, compute_cocomo,
    check_size_compliance, calculate_all_size_metrics
)

client = TestClient(app)


def test_compute_ufp():
    components = [
        FPComponent(id="1", project_id="p1", name="Login Form", type="EI", complexity="low"), # 3
        FPComponent(id="2", project_id="p1", name="Report Gen", type="EO", complexity="average"), # 5
        FPComponent(id="3", project_id="p1", name="User Query", type="EQ", complexity="high"), # 6
        FPComponent(id="4", project_id="p1", name="User DB Table", type="ILF", complexity="average"), # 10
        FPComponent(id="5", project_id="p1", name="External API Table", type="EIF", complexity="low"), # 5
    ]
    # Total UFP = 3 + 5 + 6 + 10 + 5 = 29
    assert compute_ufp(components) == 29


def test_compute_vaf():
    # 14 GSCs with rating 3 each -> sum = 42
    # VAF = 0.65 + (0.01 * 42) = 0.65 + 0.42 = 1.07
    ratings = [GSCRating(id=f"gsc-{i}", project_id="p1", characteristic_name=f"GSC_{i}", rating=3) for i in range(14)]
    assert compute_vaf(ratings) == (42, 1.07)


def test_compute_afp_and_kloc():
    ufp = 100.0
    vaf = 1.0
    afp = compute_afp(ufp, vaf)
    assert afp == 100.0

    # Java LOC/FP = 53
    # KLOC = (100 * 53) / 1000 = 5.3
    kloc_java = compute_kloc(afp, "Java")
    assert kloc_java == 5.3

    # Python LOC/FP = 42
    # KLOC = (100 * 42) / 1000 = 4.2
    kloc_py = compute_kloc(afp, "Python")
    assert kloc_py == 4.2



def test_compute_cocomo_organic():
    kloc = 10.0
    # Organic: a=2.4, b=1.05, c=2.5, d=0.38
    # Effort = 2.4 * (10.0 ** 1.05) = 2.4 * 11.22018 = 26.928
    # Time = 2.5 * (26.928 ** 0.38) = 2.5 * 3.4907 = 8.7268
    cocomo = compute_cocomo(kloc, "organic")
    assert cocomo.effort_pm == pytest.approx(26.9, rel=1e-1)
    assert cocomo.time_months == pytest.approx(8.7, rel=1e-1)
    assert cocomo.avg_team_size == pytest.approx(3.1, rel=1e-1)


def test_compliance_checker():
    proj = SizeProject(
        id="p1", name="Test System", description="", project_type="organic", language="Java"
    )
    # Empty components & zero ratings -> failed compliance
    comp = check_size_compliance(proj, [], [])
    assert comp.component_coverage.passed is False
    assert comp.gsc_completeness.passed is False
    assert comp.quality_score < 100


def test_api_endpoints():
    # 1. Create project
    res = client.post("/api/v1/size/projects", json={
        "name": "E-Commerce System",
        "description": "Virtual Store",
        "project_type": "organic",
        "language": "Python"
    })
    assert res.status_code == 200
    proj_data = res.json()
    proj_id = proj_data["id"]
    assert proj_data["name"] == "E-Commerce System"

    # 2. Add Component
    res_comp = client.post(f"/api/v1/size/projects/{proj_id}/components", json={
        "name": "User Registration",
        "type": "EI",
        "complexity": "average"
    })
    assert res_comp.status_code == 200

    # 3. Get Metrics
    res_metrics = client.get(f"/api/v1/size/projects/{proj_id}/metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    assert metrics["ufp"] == 4  # EI average = 4

    # 4. Get Quiz
    res_quiz = client.get("/api/v1/size/quiz")
    assert res_quiz.status_code == 200
    assert len(res_quiz.json()) == 10
