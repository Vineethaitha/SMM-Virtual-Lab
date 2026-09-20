import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Response

from app.tcms_models import (
    Project, ProjectCreate, StudentInfo, Requirement, RequirementCreate,
    TestCase, TestCaseCreate, TestPlan, TestPlanCreate,
    TestRun, TestRunCreate, MetricsResult, TraceabilityMatrixResult,
    ComplianceCheckResponse, QuizQuestion, QuizSubmitRequest, QuizSubmitResponse,
    ReportDataResponse
)
from app import tcms_db
from app.tcms_engine import (
    calculate_metrics, build_traceability_matrix, generate_rule_verdicts,
    check_compliance, generate_improvement_recommendations
)

tcms_router = APIRouter(prefix="/tcms", tags=["Kiwi TCMS Engine"])

# Initialize DB on import
tcms_db.init_db()

# Load static quiz bank from JSON file
QUIZ_BANK_PATH = os.path.join(os.path.dirname(__file__), "..", "quiz_bank.json")
if os.path.exists(QUIZ_BANK_PATH):
    with open(QUIZ_BANK_PATH, "r", encoding="utf-8") as f:
        QUIZ_BANK_DATA = json.load(f)
        QUIZ_BANK = [QuizQuestion(**q) for q in QUIZ_BANK_DATA]
else:
    QUIZ_BANK = []


# --- PROJECTS ---

@tcms_router.get("/projects", response_model=List[Project])
def get_projects() -> List[Project]:
    return tcms_db.get_projects()


@tcms_router.post("/projects", response_model=Project)
def create_project(payload: ProjectCreate) -> Project:
    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    return tcms_db.create_project(
        project_id=project_id,
        name=payload.name,
        description=payload.description
    )


# --- STUDENT INFO ---

@tcms_router.post("/projects/{project_id}/student-info", response_model=StudentInfo)
def save_student_info(project_id: str, payload: StudentInfo) -> StudentInfo:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return tcms_db.save_student_info(project_id, payload)


@tcms_router.get("/projects/{project_id}/student-info", response_model=StudentInfo)
def get_student_info(project_id: str) -> StudentInfo:
    info = tcms_db.get_student_info(project_id)
    if not info:
        return StudentInfo(name="Student", registration_number="N/A")
    return info


# --- REQUIREMENTS ---

@tcms_router.get("/projects/{project_id}/requirements", response_model=List[Requirement])
def get_requirements(project_id: str) -> List[Requirement]:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return tcms_db.get_requirements(project_id)


@tcms_router.post("/projects/{project_id}/requirements", response_model=Requirement)
def create_requirement(project_id: str, payload: RequirementCreate) -> Requirement:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = tcms_db.get_requirements(project_id)
    req_id = payload.req_id or f"REQ-00{len(existing) + 1}"

    req = Requirement(
        id=f"req-{uuid.uuid4().hex[:8]}",
        project_id=project_id,
        req_id=req_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
    )
    return tcms_db.save_requirement(req)


@tcms_router.delete("/projects/{project_id}/requirements/{req_id}")
def delete_requirement(project_id: str, req_id: str):
    tcms_db.delete_requirement(project_id, req_id)
    return {"status": "deleted", "req_id": req_id}


# --- TEST CASES ---

@tcms_router.get("/projects/{project_id}/testcases", response_model=List[TestCase])
def get_test_cases(project_id: str) -> List[TestCase]:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return tcms_db.get_test_cases(project_id)


@tcms_router.post("/projects/{project_id}/testcases", response_model=TestCase)
def create_test_case(project_id: str, payload: TestCaseCreate) -> TestCase:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    existing = tcms_db.get_test_cases(project_id)
    tc_id = payload.tc_id or f"TC-00{len(existing) + 1}"

    tc = TestCase(
        id=f"tc-{uuid.uuid4().hex[:8]}",
        project_id=project_id,
        tc_id=tc_id,
        title=payload.title,
        tier=payload.tier,
        preconditions=payload.preconditions,
        steps=payload.steps,
        expected_result=payload.expected_result,
        priority=payload.priority,
        linked_requirement_ids=payload.linked_requirement_ids,
    )
    return tcms_db.save_test_case(tc)


@tcms_router.delete("/projects/{project_id}/testcases/{tc_id}")
def delete_test_case(project_id: str, tc_id: str):
    tcms_db.delete_test_case(project_id, tc_id)
    return {"status": "deleted", "tc_id": tc_id}


# --- TEST PLANS & RUNS ---

@tcms_router.get("/projects/{project_id}/testplans", response_model=List[TestPlan])
def get_test_plans(project_id: str) -> List[TestPlan]:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return tcms_db.get_test_plans(project_id)


@tcms_router.post("/projects/{project_id}/testplans", response_model=TestPlan)
def create_test_plan(project_id: str, payload: TestPlanCreate) -> TestPlan:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    plan = TestPlan(
        id=f"tp-{uuid.uuid4().hex[:8]}",
        project_id=project_id,
        name=payload.name,
        test_case_ids=payload.test_case_ids,
    )
    return tcms_db.save_test_plan(plan)


@tcms_router.post("/projects/{project_id}/testruns", response_model=TestRun)
def submit_test_run(project_id: str, payload: TestRunCreate) -> TestRun:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    run = TestRun(
        id=f"tr-{uuid.uuid4().hex[:8]}",
        project_id=project_id,
        test_plan_id=payload.test_plan_id,
        executed_at=datetime.now(timezone.utc).isoformat(),
        results=payload.results,
    )
    return tcms_db.save_test_run(run)


# --- METRICS, MATRIX, COMPLIANCE & REPORT ---

@tcms_router.get("/projects/{project_id}/metrics", response_model=MetricsResult)
def get_metrics(project_id: str) -> MetricsResult:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reqs = tcms_db.get_requirements(project_id)
    tcs = tcms_db.get_test_cases(project_id)
    runs = tcms_db.get_test_runs(project_id)

    return calculate_metrics(project_id, reqs, tcs, runs)


@tcms_router.get("/projects/{project_id}/matrix", response_model=TraceabilityMatrixResult)
def get_traceability_matrix(project_id: str) -> TraceabilityMatrixResult:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reqs = tcms_db.get_requirements(project_id)
    tcs = tcms_db.get_test_cases(project_id)

    return build_traceability_matrix(reqs, tcs)


@tcms_router.get("/projects/{project_id}/compliance", response_model=ComplianceCheckResponse)
def get_compliance(project_id: str) -> ComplianceCheckResponse:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reqs = tcms_db.get_requirements(project_id)
    tcs = tcms_db.get_test_cases(project_id)
    runs = tcms_db.get_test_runs(project_id)

    return check_compliance(project_id, reqs, tcs, runs)


@tcms_router.get("/projects/{project_id}/report", response_model=ReportDataResponse)
def get_report(project_id: str) -> ReportDataResponse:
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reqs = tcms_db.get_requirements(project_id)
    tcs = tcms_db.get_test_cases(project_id)
    runs = tcms_db.get_test_runs(project_id)

    student = tcms_db.get_student_info(project_id) or StudentInfo(name="Student", registration_number="N/A")
    metrics = calculate_metrics(project_id, reqs, tcs, runs)
    compliance = check_compliance(project_id, reqs, tcs, runs)
    recs = generate_improvement_recommendations(compliance, {})

    dummy_quiz = QuizSubmitResponse(
        score=0,
        total=len(QUIZ_BANK),
        percentage=0.0,
        topic_breakdown={},
        feedback=[]
    )

    return ReportDataResponse(
        student=student,
        project=project,
        quiz=dummy_quiz,
        compliance=compliance,
        metrics=metrics,
        improvement_recommendations=recs
    )


@tcms_router.get("/projects/{project_id}/report.pdf")
def download_pdf_report(project_id: str):
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    reqs = tcms_db.get_requirements(project_id)
    tcs = tcms_db.get_test_cases(project_id)
    runs = tcms_db.get_test_runs(project_id)
    student = tcms_db.get_student_info(project_id) or StudentInfo(name="Student", registration_number="N/A")

    metrics = calculate_metrics(project_id, reqs, tcs, runs)
    compliance = check_compliance(project_id, reqs, tcs, runs)
    recs = generate_improvement_recommendations(compliance, {})

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Virtual Lab Report - Experiment 2</title>
    <style>
        body {{ font-family: monospace, sans-serif; margin: 40px; color: #1e293b; background: #fff; }}
        h1 {{ border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 4px; }}
        .meta {{ font-size: 13px; margin-bottom: 20px; color: #475569; }}
        .section {{ margin-top: 24px; }}
        .section-title {{ font-weight: bold; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; }}
        ul {{ margin-top: 4px; padding-left: 20px; }}
        .pass {{ color: #15803d; }}
        .fail {{ color: #b91c1c; }}
    </style>
</head>
<body onload="window.print()">
    <h1>================= VIRTUAL LAB REPORT =================</h1>
    <div className="meta">
        <strong>Experiment 2:</strong> Test Case Management (Kiwi TCMS)<br>
        <strong>Student:</strong> {student.name} | <strong>Reg. No:</strong> {student.registration_number}<br>
        <strong>Project:</strong> {project.name} | <strong>Generated:</strong> {now_str}
    </div>
    <h1>=======================================================</h1>

    <div className="section">
        <div className="section-title">SECTION A — Knowledge Assessment (MCQ)</div>
        <p>Score: Completed in interactive lab dashboard</p>
    </div>

    <div className="section">
        <div className="section-title">SECTION B — Test Case Authoring Compliance</div>
        <p>[{'<span class="pass">✅</span>' if compliance.completeness.passed else '<span class="fail">❌</span>'}] Completeness — {compliance.completeness.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.traceability.passed else '<span class="fail">❌</span>'}] Traceability — {compliance.traceability.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.coverage.passed else '<span class="fail">❌</span>'}] Coverage — {compliance.coverage.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.tier_diversity.passed else '<span class="fail">❌</span>'}] Tier Diversity — {compliance.tier_diversity.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.execution_completeness.passed else '<span class="fail">❌</span>'}] Execution Complete — {compliance.execution_completeness.detail}</p>
        <p><strong>Overall Test Case Quality Score:</strong> {compliance.quality_score}/100</p>
    </div>

    <div className="section">
        <div className="section-title">SECTION C — Project Metrics Summary</div>
        <p>Requirement Coverage: {metrics.requirement_coverage_pct}% | Pass Rate: {metrics.pass_rate_pct}%</p>
        <p>Orphan Tests: {len(metrics.orphan_test_cases)} | Test Suite Maturity: {metrics.maturity_score}/100</p>
    </div>

    <div className="section">
        <div className="section-title">SECTION D — Areas for Improvement</div>
        <ul>
            {"".join(f"<li>{r}</li>" for r in recs)}
        </ul>
    </div>
    <h1>=======================================================</h1>
</body>
</html>"""

    return Response(content=html_content, media_type="text/html")


@tcms_router.post("/projects/{project_id}/reset")
def reset_project(project_id: str):
    project = tcms_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tcms_db.reset_project(project_id)
    return {"status": "reset", "project_id": project_id}


# --- QUIZ ENDPOINTS ---

@tcms_router.get("/quiz", response_model=List[QuizQuestion])
def get_quiz_questions() -> List[QuizQuestion]:
    return QUIZ_BANK


@tcms_router.post("/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(payload: QuizSubmitRequest) -> QuizSubmitResponse:
    score = 0
    total = len(QUIZ_BANK)

    topic_stats: Dict[str, Dict[str, int]] = {}
    feedback: List[Dict[str, Any]] = []

    for q in QUIZ_BANK:
        t = q.topic
        if t not in topic_stats:
            topic_stats[t] = {"correct": 0, "total": 0}
        topic_stats[t]["total"] += 1

        chosen = payload.answers.get(q.id)
        is_correct = chosen is not None and chosen.strip().lower() == q.answer.strip().lower()

        if is_correct:
            score += 1
            topic_stats[t]["correct"] += 1
            feedback.append({"id": q.id, "status": "correct", "message": f"Correct! {q.answer}"})
        else:
            feedback.append({"id": q.id, "status": "incorrect", "message": f"Incorrect. Correct answer: {q.answer}"})

    topic_breakdown: Dict[str, Dict[str, Any]] = {}
    for t, stat in topic_stats.items():
        pct = round(stat["correct"] / stat["total"] * 100.0, 1) if stat["total"] > 0 else 0.0
        topic_breakdown[t] = {
            "correct": stat["correct"],
            "total": stat["total"],
            "percentage": pct
        }

    pct_score = round(score / total * 100.0, 1)
    return QuizSubmitResponse(
        score=score,
        total=total,
        percentage=pct_score,
        topic_breakdown=topic_breakdown,
        feedback=feedback
    )
