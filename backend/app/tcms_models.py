from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str
    description: str


class Project(BaseModel):
    id: str
    name: str
    description: str


class StudentInfo(BaseModel):
    name: str
    registration_number: str


class RequirementCreate(BaseModel):
    req_id: Optional[str] = None
    title: str
    description: str
    category: str = "functional"  # functional | non-functional
    priority: str = "High"        # High | Med | Low


class Requirement(BaseModel):
    id: str
    project_id: str
    req_id: str
    title: str
    description: str
    category: str = "functional"
    priority: str = "High"


class TestCaseCreate(BaseModel):
    __test__ = False
    tc_id: Optional[str] = None
    title: str
    tier: str = "functional"     # functional | negative | boundary_value | usability
    preconditions: str = ""
    steps: List[str] = Field(default_factory=list)
    expected_result: str = ""
    priority: str = "High"
    linked_requirement_ids: List[str] = Field(default_factory=list)


class TestCase(BaseModel):
    __test__ = False
    id: str
    project_id: str
    tc_id: str
    title: str
    tier: str = "functional"
    preconditions: str = ""
    steps: List[str] = Field(default_factory=list)
    expected_result: str = ""
    priority: str = "High"
    linked_requirement_ids: List[str] = Field(default_factory=list)


class TestPlanCreate(BaseModel):
    __test__ = False
    name: str
    test_case_ids: List[str] = Field(default_factory=list)


class TestPlan(BaseModel):
    __test__ = False
    id: str
    project_id: str
    name: str
    test_case_ids: List[str] = Field(default_factory=list)


class TestRunResultItem(BaseModel):
    __test__ = False
    test_case_id: str
    status: str                  # Pass | Fail | Blocked
    notes: Optional[str] = ""


class TestRunCreate(BaseModel):
    __test__ = False
    test_plan_id: str
    results: List[TestRunResultItem] = Field(default_factory=list)


class TestRun(BaseModel):
    __test__ = False
    id: str
    project_id: str
    test_plan_id: str
    executed_at: str
    results: List[TestRunResultItem] = Field(default_factory=list)


class MetricsResult(BaseModel):
    project_id: str
    total_requirements: int
    total_test_cases: int
    covered_requirements_count: int
    requirement_coverage_pct: Optional[float] = None
    total_executions: int
    pass_count: int
    fail_count: int
    blocked_count: int
    pass_rate_pct: Optional[float] = None
    tier_distribution: Dict[str, int]
    tier_diversity_pct: float
    maturity_score: float
    uncovered_requirements: List[Requirement]
    orphan_test_cases: List[TestCase]


class TraceabilityMatrixResult(BaseModel):
    requirements: List[Requirement]
    test_cases: List[TestCase]
    grid: Dict[str, Dict[str, bool]]


class ComplianceRuleResult(BaseModel):
    passed: bool
    detail: str
    failing_ids: List[str] = Field(default_factory=list)


class ComplianceCheckResponse(BaseModel):
    completeness: ComplianceRuleResult
    traceability: ComplianceRuleResult
    coverage: ComplianceRuleResult
    tier_diversity: ComplianceRuleResult
    execution_completeness: ComplianceRuleResult
    quality_score: float


class QuizQuestion(BaseModel):
    id: str
    topic: str
    prompt: str
    options: List[str]
    answer: str


class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]  # question_id -> chosen_answer_string


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    topic_breakdown: Dict[str, Dict[str, Any]]
    feedback: List[Dict[str, Any]]


class ReportDataResponse(BaseModel):
    student: StudentInfo
    project: Project
    quiz: QuizSubmitResponse
    compliance: ComplianceCheckResponse
    metrics: MetricsResult
    improvement_recommendations: List[str]
