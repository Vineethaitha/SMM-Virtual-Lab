import pytest
from app.tcms_models import Requirement, TestCase, TestRun, TestRunResultItem
from app.tcms_engine import (
    calculate_metrics, check_compliance, build_traceability_matrix,
    generate_rule_verdicts, generate_improvement_recommendations
)


def test_calculate_metrics_empty_returns_none():
    metrics = calculate_metrics("proj-1", [], [], [])
    assert metrics.total_requirements == 0
    assert metrics.total_test_cases == 0
    assert metrics.requirement_coverage_pct is None  # explicit "no data yet"
    assert metrics.pass_rate_pct is None
    assert metrics.tier_diversity_pct == 0.0
    assert metrics.maturity_score == 0.0
    assert len(metrics.uncovered_requirements) == 0
    assert len(metrics.orphan_test_cases) == 0


def test_compliance_checker():
    req1 = Requirement(id="r1", project_id="p1", req_id="REQ-001", title="Auth", description="Desc", category="functional", priority="High")
    tc1 = TestCase(
        id="tc1", project_id="p1", tc_id="TC-001", title="Verify Auth",
        tier="functional", preconditions="DB active", steps=["Step 1"], expected_result="Success",
        priority="High", linked_requirement_ids=["r1"]
    )
    run1 = TestRun(
        id="tr1", project_id="p1", test_plan_id="tp1", executed_at="2026-09-13T10:00:00Z",
        results=[TestRunResultItem(test_case_id="tc1", status="Pass", notes="Ok")]
    )

    compliance = check_compliance("p1", [req1], [tc1], [run1])
    assert compliance.completeness.passed is True
    assert compliance.traceability.passed is True
    assert compliance.coverage.passed is True
    assert compliance.tier_diversity.passed is False  # Missing negative, boundary, usability
    assert compliance.execution_completeness.passed is True
    assert compliance.quality_score == 80.0

    recs = generate_improvement_recommendations(compliance, {})
    assert any("testing tiers" in r.lower() for r in recs)
