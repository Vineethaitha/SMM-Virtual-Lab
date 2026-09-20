from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

NodeType = Literal["entry", "block", "decision", "loop", "return", "exit"]
InsightSeverity = Literal["info", "warning", "critical"]
MetricFamily = Literal["loc", "cyclomatic", "halstead", "maintainability"]


class AnalyzeRequest(BaseModel):
    source: str = Field(..., min_length=1, max_length=50_000)


class LocMetrics(BaseModel):
    loc: int
    lloc: int
    sloc: int
    comments: int
    multi: int
    blank: int
    single_comments: int


class HalsteadMetrics(BaseModel):
    h1: float
    h2: float
    n1: float
    n2: float
    vocabulary: float
    length: float
    calculated_length: float
    volume: float
    difficulty: float
    effort: float
    time: float
    bugs: float


class FunctionMetrics(BaseModel):
    name: str
    qualified_name: str
    lineno: int
    end_lineno: int
    col_offset: int
    is_method: bool
    classname: Optional[str] = None
    cc: int
    rank: str
    loc: int
    nested_decision_depth: int
    is_complex: bool
    halstead: Optional[HalsteadMetrics] = None


class MaintainabilityMetrics(BaseModel):
    mi: float
    rank: str


class CfgNode(BaseModel):
    id: str
    type: NodeType
    label: str
    lineno: Optional[int] = None
    end_lineno: Optional[int] = None
    function: str
    condition: Optional[str] = None


class CfgEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[Literal["true", "false", "back"]] = None


class FunctionCfg(BaseModel):
    function: str
    nodes: list[CfgNode]
    edges: list[CfgEdge]


class Insight(BaseModel):
    severity: InsightSeverity
    title: str
    detail: str
    function: Optional[str] = None
    lineno: Optional[int] = None


class MetricExplanation(BaseModel):
    family: MetricFamily
    title: str
    what: str
    how: str
    meaning: str


class AnalysisResult(BaseModel):
    language: str = "python"
    loc: LocMetrics
    functions: list[FunctionMetrics]
    halstead: HalsteadMetrics
    maintainability: MaintainabilityMetrics
    cfgs: list[FunctionCfg]
    insights: list[Insight]
    explanations: list[MetricExplanation]


class SyntaxErrorDetail(BaseModel):
    message: str
    lineno: Optional[int] = None
    offset: Optional[int] = None
