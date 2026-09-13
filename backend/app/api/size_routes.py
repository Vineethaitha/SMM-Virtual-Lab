import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Response

from app.size_models import (
    SizeProject, SizeProjectCreate, SizeStudentInfo, FPComponent, FPComponentCreate,
    GSCRating, GSCRatingsUpdate, SizeSnapshot, SizeSnapshotCreate,
    SizeMetricsResult, SizeComplianceResponse, SizeQuizQuestion, SizeQuizSubmitRequest,
    SizeQuizSubmitResponse, SizeReportResponse
)
from app import size_db
from app.size_engine import (
    calculate_all_size_metrics, check_size_compliance, generate_size_improvements
)

size_router = APIRouter(prefix="/size", tags=["Software Size Estimation Engine"])

# Initialize DB on import
size_db.init_db()

# Load static quiz bank from JSON file
QUIZ_BANK_PATH = os.path.join(os.path.dirname(__file__), "..", "size_quiz_bank.json")
if os.path.exists(QUIZ_BANK_PATH):
    with open(QUIZ_BANK_PATH, "r", encoding="utf-8") as f:
        QUIZ_BANK_DATA = json.load(f)
        QUIZ_BANK = [SizeQuizQuestion(**q) for q in QUIZ_BANK_DATA]
else:
    QUIZ_BANK = []


# --- PROJECTS ---

@size_router.get("/projects", response_model=List[SizeProject])
def get_projects() -> List[SizeProject]:
    return size_db.get_projects()


@size_router.post("/projects", response_model=SizeProject)
def create_project(payload: SizeProjectCreate) -> SizeProject:
    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    return size_db.create_project(
        project_id=project_id,
        name=payload.name,
        description=payload.description,
        project_type=payload.project_type,
        language=payload.language,
    )


# --- STUDENT INFO ---

@size_router.post("/projects/{project_id}/student-info", response_model=SizeStudentInfo)
def save_student_info(project_id: str, payload: SizeStudentInfo) -> SizeStudentInfo:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return size_db.save_student_info(project_id, payload)


@size_router.get("/projects/{project_id}/student-info", response_model=SizeStudentInfo)
def get_student_info(project_id: str) -> SizeStudentInfo:
    info = size_db.get_student_info(project_id)
    if not info:
        return SizeStudentInfo(name="Student", registration_number="N/A")
    return info


# --- FP COMPONENTS ---

@size_router.get("/projects/{project_id}/components", response_model=List[FPComponent])
def get_components(project_id: str) -> List[FPComponent]:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return size_db.get_components(project_id)


@size_router.post("/projects/{project_id}/components", response_model=FPComponent)
def create_component(project_id: str, payload: FPComponentCreate) -> FPComponent:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    comp = FPComponent(
        id=f"comp-{uuid.uuid4().hex[:8]}",
        project_id=project_id,
        name=payload.name,
        type=payload.type,
        complexity=payload.complexity,
    )
    return size_db.save_component(comp)


@size_router.delete("/projects/{project_id}/components/{comp_id}")
def delete_component(project_id: str, comp_id: str):
    size_db.delete_component(project_id, comp_id)
    return {"status": "deleted", "comp_id": comp_id}


# --- GSC RATINGS ---

@size_router.get("/projects/{project_id}/gsc", response_model=List[GSCRating])
def get_gsc_ratings(project_id: str) -> List[GSCRating]:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return size_db.get_gsc_ratings(project_id)


@size_router.post("/projects/{project_id}/gsc", response_model=List[GSCRating])
def update_gsc_ratings(project_id: str, payload: GSCRatingsUpdate) -> List[GSCRating]:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ratings_tuples = [(item.characteristic_name, item.rating) for item in payload.ratings]
    size_db.save_gsc_ratings(project_id, ratings_tuples)
    return size_db.get_gsc_ratings(project_id)


# --- METRICS & COMPLIANCE ---

@size_router.get("/projects/{project_id}/metrics", response_model=SizeMetricsResult)
def get_metrics(project_id: str) -> SizeMetricsResult:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    comps = size_db.get_components(project_id)
    gsc = size_db.get_gsc_ratings(project_id)

    return calculate_all_size_metrics(project, comps, gsc)


@size_router.get("/projects/{project_id}/compliance", response_model=SizeComplianceResponse)
def get_compliance(project_id: str) -> SizeComplianceResponse:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    comps = size_db.get_components(project_id)
    gsc = size_db.get_gsc_ratings(project_id)

    return check_size_compliance(project, comps, gsc)


# --- SNAPSHOT & COMPARE ---

@size_router.post("/projects/{project_id}/snapshot", response_model=SizeSnapshot)
def create_snapshot(project_id: str, payload: SizeSnapshotCreate) -> SizeSnapshot:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    comps = size_db.get_components(project_id)
    gsc = size_db.get_gsc_ratings(project_id)
    metrics = calculate_all_size_metrics(project, comps, gsc)

    snap = SizeSnapshot(
        id=f"snap-{uuid.uuid4().hex[:8]}",
        project_id=project_id,
        label=payload.label or "Baseline Snapshot",
        ufp=metrics.ufp,
        vaf=metrics.vaf,
        afp=metrics.afp,
        kloc=metrics.kloc,
        effort_pm=metrics.cocomo.effort_pm,
        time_months=metrics.cocomo.time_months,
        avg_team_size=metrics.cocomo.avg_team_size,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    return size_db.save_snapshot(snap)


@size_router.get("/projects/{project_id}/compare", response_model=List[SizeSnapshot])
def get_snapshots(project_id: str) -> List[SizeSnapshot]:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return size_db.get_snapshots(project_id)


# --- REPORT & REPORT PDF ---

@size_router.get("/projects/{project_id}/report", response_model=SizeReportResponse)
def get_report(project_id: str) -> SizeReportResponse:
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    comps = size_db.get_components(project_id)
    gsc = size_db.get_gsc_ratings(project_id)
    student = size_db.get_student_info(project_id) or SizeStudentInfo(name="Student", registration_number="N/A")

    metrics = calculate_all_size_metrics(project, comps, gsc)
    compliance = check_size_compliance(project, comps, gsc)
    recs = generate_size_improvements(compliance, {})

    dummy_quiz = SizeQuizSubmitResponse(
        score=0,
        total=len(QUIZ_BANK),
        percentage=0.0,
        topic_breakdown={},
        feedback=[]
    )

    return SizeReportResponse(
        student=student,
        project=project,
        quiz=dummy_quiz,
        compliance=compliance,
        metrics=metrics,
        improvement_recommendations=recs,
    )


@size_router.get("/projects/{project_id}/report.pdf")
def download_pdf_report(project_id: str):
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    comps = size_db.get_components(project_id)
    gsc = size_db.get_gsc_ratings(project_id)
    student = size_db.get_student_info(project_id) or SizeStudentInfo(name="Student", registration_number="N/A")

    metrics = calculate_all_size_metrics(project, comps, gsc)
    compliance = check_size_compliance(project, comps, gsc)
    recs = generate_size_improvements(compliance, {})

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Virtual Lab Report - Experiment 3</title>
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
        <strong>Experiment 3:</strong> Software Size Estimation (FPA & COCOMO)<br>
        <strong>Student:</strong> {student.name} | <strong>Reg. No:</strong> {student.registration_number}<br>
        <strong>Project:</strong> {project.name} ({project.project_type}, {project.language}) | <strong>Generated:</strong> {now_str}
    </div>
    <h1>=======================================================</h1>

    <div className="section">
        <div className="section-title">SECTION A — Knowledge Assessment (MCQ)</div>
        <p>Completed in interactive lab dashboard.</p>
    </div>

    <div className="section">
        <div className="section-title">SECTION B — Estimation Correctness Checklist</div>
        <p>[{'<span class="pass">✅</span>' if compliance.component_coverage.passed else '<span class="fail">❌</span>'}] Component Coverage — {compliance.component_coverage.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.complexity_assigned.passed else '<span class="fail">❌</span>'}] Complexity Assigned — {compliance.complexity_assigned.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.gsc_completeness.passed else '<span class="fail">❌</span>'}] GSC Completeness — {compliance.gsc_completeness.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.project_type_missing.passed else '<span class="fail">❌</span>'}] Project Type Selected — {compliance.project_type_missing.detail}</p>
        <p>[{'<span class="pass">✅</span>' if compliance.language_missing.passed else '<span class="fail">❌</span>'}] Language Selected — {compliance.language_missing.detail}</p>
        <p><strong>Overall Estimation Quality Score:</strong> {compliance.quality_score}/100</p>
    </div>

    <div className="section">
        <div className="section-title">SECTION C — Computed Estimates</div>
        <p>UFP: {metrics.ufp} | VAF: {metrics.vaf} | AFP: {metrics.afp}</p>
        <p>KLOC: {metrics.kloc} | Size Category: {metrics.size_category}</p>
        <p>Effort: {metrics.cocomo.effort_pm} person-months | Time: {metrics.cocomo.time_months} months | Team Size: {metrics.cocomo.avg_team_size} people</p>
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


@size_router.post("/projects/{project_id}/reset")
def reset_project(project_id: str):
    project = size_db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    size_db.reset_project(project_id)
    return {"status": "reset", "project_id": project_id}


# --- QUIZ ENDPOINTS ---

@size_router.get("/quiz", response_model=List[SizeQuizQuestion])
def get_quiz_questions() -> List[SizeQuizQuestion]:
    return QUIZ_BANK


@size_router.post("/quiz/submit", response_model=SizeQuizSubmitResponse)
def submit_quiz(payload: SizeQuizSubmitRequest) -> SizeQuizSubmitResponse:
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
    return SizeQuizSubmitResponse(
        score=score,
        total=total,
        percentage=pct_score,
        topic_breakdown=topic_breakdown,
        feedback=feedback
    )
