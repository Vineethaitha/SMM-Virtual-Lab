from typing import List, Dict, Any, Optional
from app.tcms_models import (
    Requirement, TestCase, TestRun, MetricsResult, TraceabilityMatrixResult,
    ComplianceCheckResponse, ComplianceRuleResult
)

IMPROVEMENT_MAP: Dict[str, str] = {
    "completeness": "Some test cases are missing required fields. Review Procedure Step 3 and fill in preconditions, steps, and expected result for every test case.",
    "traceability": "You have orphan test cases not linked to any requirement. Go to Test Case Author and link each one.",
    "coverage": "Some requirements have zero test coverage. Add at least one test case per uncovered requirement (see Traceability Matrix).",
    "tier_diversity": "You haven't used all four testing tiers. Review Theory > Testing Tiers and add the missing tier(s).",
    "execution_completeness": "Some test cases were never executed. Run your Test Plan again and record a result for each one.",
    "traceability_topic": "Revisit Theory > Requirement Traceability Matrix — your quiz answers show gaps here.",
    "test_tiers_topic": "Revisit Theory > Testing Tiers — review functional vs negative vs boundary vs usability.",
    "kiwi_objects_topic": "Revisit Theory > Kiwi TCMS Object Model — review how Test Plan, Test Case, and Test Run relate.",
    "execution_model_topic": "Revisit Theory — a human tester decides Pass/Fail, not the tool itself.",
    "orphan_tests_topic": "Revisit Theory > Orphan Tests — review why unlinked test cases represent a QA smell.",
    "test_run_status_topic": "Revisit Theory — review what 'Blocked' status indicates during test execution.",
    "coverage_formula_topic": "Revisit Theory > Formulas — review how Requirement Coverage % is calculated.",
    "rtm_topic": "Revisit Theory > RTM — review how bidirectional traceability supports software audits.",
    "usability_tier_topic": "Revisit Theory > Testing Tiers — review usability tier test case design.",
}


def requirement_coverage(total_requirements: int, covered_requirements: int) -> Optional[float]:
    if total_requirements == 0:
        return None  # explicit "no data yet" state
    return round(covered_requirements / total_requirements * 100, 1)


def pass_rate(pass_count: int, total_results: int) -> Optional[float]:
    if total_results == 0:
        return None
    return round(pass_count / total_results * 100, 1)


def tier_diversity(distinct_tiers_used: int) -> float:
    return round(distinct_tiers_used / 4 * 100, 1)


def maturity_score(coverage: Optional[float], p_rate: Optional[float], t_diversity: float) -> float:
    return round(0.4 * (coverage or 0) + 0.3 * (p_rate or 0) + 0.3 * t_diversity, 1)


def calculate_metrics(
    project_id: str,
    requirements: List[Requirement],
    test_cases: List[TestCase],
    test_runs: List[TestRun],
) -> MetricsResult:
    total_reqs = len(requirements)

    valid_req_ids = {r.id for r in requirements}
    covered_req_ids = set()
    for tc in test_cases:
        for rid in tc.linked_requirement_ids:
            if rid in valid_req_ids:
                covered_req_ids.add(rid)

    covered_count = len(covered_req_ids)
    coverage_pct = requirement_coverage(total_reqs, covered_count)

    uncovered_reqs = [r for r in requirements if r.id not in covered_req_ids]
    orphan_tcs = [
        tc for tc in test_cases
        if not tc.linked_requirement_ids or not any(rid in valid_req_ids for rid in tc.linked_requirement_ids)
    ]

    tier_counts: Dict[str, int] = {
        "functional": 0,
        "negative": 0,
        "boundary_value": 0,
        "usability": 0,
    }
    for tc in test_cases:
        tier_counts[tc.tier] = tier_counts.get(tc.tier, 0) + 1

    distinct_tiers = sum(1 for count in tier_counts.values() if count > 0)
    t_diversity_pct = tier_diversity(distinct_tiers)

    latest_results: Dict[str, str] = {}
    for run in test_runs:
        for res in run.results:
            latest_results[res.test_case_id] = res.status

    pass_count = sum(1 for s in latest_results.values() if s == "Pass")
    fail_count = sum(1 for s in latest_results.values() if s == "Fail")
    blocked_count = sum(1 for s in latest_results.values() if s == "Blocked")
    total_executed = pass_count + fail_count + blocked_count

    p_rate_pct = pass_rate(pass_count, total_executed)
    m_score = maturity_score(coverage_pct, p_rate_pct, t_diversity_pct)

    return MetricsResult(
        project_id=project_id,
        total_requirements=total_reqs,
        total_test_cases=len(test_cases),
        covered_requirements_count=covered_count,
        requirement_coverage_pct=coverage_pct,
        total_executions=total_executed,
        pass_count=pass_count,
        fail_count=fail_count,
        blocked_count=blocked_count,
        pass_rate_pct=p_rate_pct,
        tier_distribution=tier_counts,
        tier_diversity_pct=t_diversity_pct,
        maturity_score=m_score,
        uncovered_requirements=uncovered_reqs,
        orphan_test_cases=orphan_tcs,
    )


def check_compliance(
    project_id: str,
    requirements: List[Requirement],
    test_cases: List[TestCase],
    test_runs: List[TestRun],
) -> ComplianceCheckResponse:
    has_test_cases = len(test_cases) > 0
    has_requirements = len(requirements) > 0
    has_test_runs = len(test_runs) > 0

    incomplete = [tc for tc in test_cases if not (tc.title and tc.preconditions and tc.steps and tc.expected_result)]
    passed_completeness = has_test_cases and len(incomplete) == 0
    rule_completeness = ComplianceRuleResult(
        passed=passed_completeness,
        detail=f"{len(incomplete)} test case(s) missing required fields" if has_test_cases else "No test cases created yet",
        failing_ids=[tc.tc_id for tc in incomplete] if has_test_cases else ["no_test_cases"]
    )

    orphans = [tc for tc in test_cases if not tc.linked_requirement_ids]
    passed_traceability = has_test_cases and len(orphans) == 0
    rule_traceability = ComplianceRuleResult(
        passed=passed_traceability,
        detail=f"{len(orphans)} orphan test case(s)" if has_test_cases else "No test cases created yet to evaluate traceability",
        failing_ids=[tc.tc_id for tc in orphans] if has_test_cases else ["no_test_cases"]
    )

    covered = {rid for tc in test_cases for rid in tc.linked_requirement_ids}
    uncovered = [r for r in requirements if r.id not in covered]
    passed_coverage = has_requirements and has_test_cases and len(uncovered) == 0
    rule_coverage = ComplianceRuleResult(
        passed=passed_coverage,
        detail=f"{len(uncovered)} requirement(s) uncovered" if has_requirements else "No requirements created yet to evaluate coverage",
        failing_ids=[r.req_id for r in uncovered] if has_requirements else ["no_requirements"]
    )

    all_tiers = {"functional", "negative", "boundary_value", "usability"}
    used_tiers = {tc.tier for tc in test_cases}
    missing_tiers = all_tiers - used_tiers
    passed_tier = has_test_cases and len(missing_tiers) == 0
    rule_tier_diversity = ComplianceRuleResult(
        passed=passed_tier,
        detail=f"Missing tier(s): {', '.join(sorted(missing_tiers)) or 'none'}" if has_test_cases else "No test cases created yet",
        failing_ids=list(sorted(missing_tiers)) if has_test_cases else ["no_test_cases"]
    )

    executed = {r.test_case_id for run in test_runs for r in run.results}
    unexecuted = [tc for tc in test_cases if tc.id not in executed]
    passed_execution = has_test_cases and has_test_runs and len(unexecuted) == 0
    rule_execution = ComplianceRuleResult(
        passed=passed_execution,
        detail=f"{len(unexecuted)} test case(s) never executed" if (has_test_cases and has_test_runs) else ("No test runs executed yet" if has_test_cases else "No test cases created yet to execute"),
        failing_ids=[tc.tc_id for tc in unexecuted] if (has_test_cases and has_test_runs) else ["no_executions"]
    )

    rules = [rule_completeness, rule_traceability, rule_coverage, rule_tier_diversity, rule_execution]
    passed_count = sum(1 for r in rules if r.passed)
    quality_score = round(passed_count / len(rules) * 100.0, 1)

    return ComplianceCheckResponse(
        completeness=rule_completeness,
        traceability=rule_traceability,
        coverage=rule_coverage,
        tier_diversity=rule_tier_diversity,
        execution_completeness=rule_execution,
        quality_score=quality_score
    )


def build_traceability_matrix(
    requirements: List[Requirement],
    test_cases: List[TestCase],
) -> TraceabilityMatrixResult:
    grid: Dict[str, Dict[str, bool]] = {}

    for req in requirements:
        grid[req.id] = {}
        for tc in test_cases:
            is_linked = req.id in tc.linked_requirement_ids
            grid[req.id][tc.id] = is_linked

    return TraceabilityMatrixResult(
        requirements=requirements,
        test_cases=test_cases,
        grid=grid,
    )


def generate_rule_verdicts(metrics: MetricsResult) -> Dict[str, str]:
    cov = metrics.requirement_coverage_pct
    if cov is None:
        cov_verdict = "No data yet — add requirements and test cases first."
    elif cov < 50.0:
        cov_verdict = "Poor — most requirements are unverified."
    elif cov < 80.0:
        cov_verdict = "Moderate — close remaining gaps before release."
    else:
        cov_verdict = "Strong — most requirements have test evidence."

    pr = metrics.pass_rate_pct
    if pr is None:
        pass_verdict = "No execution data yet — run a test plan to record pass/fail results."
    elif pr < 60.0:
        pass_verdict = "Critical Quality Concerns — High failure/block rate detected in current test runs."
    elif pr < 85.0:
        pass_verdict = "Acceptable — Moderate pass rate, but failing or blocked test cases need triage."
    else:
        pass_verdict = "High Stability — Most test cases passed successfully."

    mat = metrics.maturity_score
    if mat < 40.0:
        mat_verdict = "Initial Stage — Test suite needs more test cases across diverse tiers and linked requirements."
    elif mat < 75.0:
        mat_verdict = "Developing Suite — Good progress. Add negative/boundary tests and execute full test plans."
    else:
        mat_verdict = "Mature Suite — High coverage, balanced tier distribution, and strong pass rate."

    return {
        "coverage_verdict": cov_verdict,
        "pass_verdict": pass_verdict,
        "maturity_verdict": mat_verdict,
    }


def generate_improvement_recommendations(
    compliance: ComplianceCheckResponse,
    topic_breakdown: Optional[Dict[str, Dict[str, Any]]] = None
) -> List[str]:
    recommendations: List[str] = []

    if not compliance.completeness.passed:
        recommendations.append(IMPROVEMENT_MAP["completeness"])
    if not compliance.traceability.passed:
        recommendations.append(IMPROVEMENT_MAP["traceability"])
    if not compliance.coverage.passed:
        recommendations.append(IMPROVEMENT_MAP["coverage"])
    if not compliance.tier_diversity.passed:
        recommendations.append(IMPROVEMENT_MAP["tier_diversity"])
    if not compliance.execution_completeness.passed:
        recommendations.append(IMPROVEMENT_MAP["execution_completeness"])

    if topic_breakdown:
        for topic, data in topic_breakdown.items():
            pct = data.get("percentage", 100.0)
            if pct < 50.0:
                key = f"{topic}_topic"
                if key in IMPROVEMENT_MAP and IMPROVEMENT_MAP[key] not in recommendations:
                    recommendations.append(IMPROVEMENT_MAP[key])

    if not recommendations:
        recommendations.append("Excellent work! Your test suite meets all 5 compliance standards and quiz topics.")

    return recommendations
