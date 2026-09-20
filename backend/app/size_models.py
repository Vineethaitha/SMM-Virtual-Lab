from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SizeProjectCreate(BaseModel):
    name: str
    description: str
    project_type: str = "organic"  # organic | semi_detached | embedded
    language: str = "Python"        # Assembly | C | COBOL | C++ | Java | JavaScript | Python | Visual Basic


class SizeProject(BaseModel):
    id: str
    name: str
    description: str
    project_type: str = "organic"
    language: str = "Python"


class SizeStudentInfo(BaseModel):
    name: str
    registration_number: str


class FPComponentCreate(BaseModel):
    name: str
    type: str         # EI | EO | EQ | ILF | EIF
    complexity: str   # Low | Average | High


class FPComponent(BaseModel):
    id: str
    project_id: str
    name: str
    type: str
    complexity: str


class GSCRatingItem(BaseModel):
    characteristic_name: str
    rating: int  # 0 to 5


class GSCRatingsUpdate(BaseModel):
    ratings: List[GSCRatingItem]


class GSCRating(BaseModel):
    id: str
    project_id: str
    characteristic_name: str
    rating: int


class SizeSnapshotCreate(BaseModel):
    label: str


class SizeSnapshot(BaseModel):
    id: str
    project_id: str
    label: str
    ufp: int
    vaf: float
    afp: float
    kloc: float
    effort_pm: float
    time_months: float
    avg_team_size: Optional[float]
    created_at: str


class CocomoResult(BaseModel):
    effort_pm: float
    time_months: float
    avg_team_size: Optional[float]


class SizeMetricsResult(BaseModel):
    project_id: str
    total_components: int
    ufp: int
    tdi: int
    vaf: float
    afp: float
    loc_per_fp: int
    kloc: float
    cocomo: CocomoResult
    size_category: str
    consistency_note: str


class ComplianceRuleResult(BaseModel):
    passed: bool
    detail: str
    failing_ids: List[str] = Field(default_factory=list)


class SizeComplianceResponse(BaseModel):
    component_coverage: ComplianceRuleResult
    complexity_assigned: ComplianceRuleResult
    gsc_completeness: ComplianceRuleResult
    project_type_missing: ComplianceRuleResult
    language_missing: ComplianceRuleResult
    quality_score: float


class SizeQuizQuestion(BaseModel):
    id: str
    topic: str
    prompt: str
    options: List[str]
    answer: str


class SizeQuizSubmitRequest(BaseModel):
    answers: Dict[str, str]


class SizeQuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    topic_breakdown: Dict[str, Dict[str, Any]]
    feedback: List[Dict[str, Any]]


class SizeReportResponse(BaseModel):
    student: SizeStudentInfo
    project: SizeProject
    quiz: SizeQuizSubmitResponse
    compliance: SizeComplianceResponse
    metrics: SizeMetricsResult
    improvement_recommendations: List[str]
