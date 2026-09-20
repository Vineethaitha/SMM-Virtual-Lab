export type NodeType = "entry" | "block" | "decision" | "loop" | "return" | "exit";

export interface LocMetrics {
  loc: number;
  lloc: number;
  sloc: number;
  comments: number;
  multi: number;
  blank: number;
  single_comments: number;
}

export interface HalsteadMetrics {
  h1: number;
  h2: number;
  n1: number;
  n2: number;
  vocabulary: number;
  length: number;
  calculated_length: number;
  volume: number;
  difficulty: number;
  effort: number;
  time: number;
  bugs: number;
}

export interface FunctionMetrics {
  name: string;
  qualified_name: string;
  lineno: number;
  end_lineno: number;
  col_offset: number;
  is_method: boolean;
  classname: string | null;
  cc: number;
  rank: string;
  loc: number;
  nested_decision_depth: number;
  is_complex: boolean;
  halstead: HalsteadMetrics | null;
}

export interface CfgNode {
  id: string;
  type: NodeType;
  label: string;
  lineno: number | null;
  end_lineno: number | null;
  function: string;
  condition: string | null;
}

export interface CfgEdge {
  id: string;
  source: string;
  target: string;
  label: "true" | "false" | "back" | null;
}

export interface FunctionCfg {
  function: string;
  nodes: CfgNode[];
  edges: CfgEdge[];
}

export interface Insight {
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  function: string | null;
  lineno: number | null;
}

export interface MetricExplanation {
  family: "loc" | "cyclomatic" | "halstead" | "maintainability";
  title: string;
  what: string;
  how: string;
  meaning: string;
}

export interface AnalysisResult {
  language: string;
  loc: LocMetrics;
  functions: FunctionMetrics[];
  halstead: HalsteadMetrics;
  maintainability: { mi: number; rank: string };
  cfgs: FunctionCfg[];
  insights: Insight[];
  explanations: MetricExplanation[];
}

export type LabSection =
  | "aim"
  | "objective"
  | "theory"
  | "procedure"
  | "exercise"
  | "simulation"
  | "results"
  | "analysis"
  | "comparison"
  | "conclusion";
