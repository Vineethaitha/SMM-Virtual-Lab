import type { LabSection } from "@/lib/types";

export const NAV: { id: LabSection; label: string }[] = [
  { id: "aim", label: "Aim" },
  { id: "objective", label: "Objective" },
  { id: "theory", label: "Theory" },
  { id: "procedure", label: "Procedure" },
  { id: "simulation", label: "Simulation" },
  { id: "exercise", label: "Exercise" },
  { id: "results", label: "Results" },
  { id: "comparison", label: "Comparison" },
  { id: "conclusion", label: "Conclusion" },
];

export const COPY: Record<LabSection, { title: string; body: ReactNodeLike }> = {
  aim: {
    title: "Aim",
    body: [
      "Measure software size and structural complexity of Python source using static analysis in the browser.",
      "Learn how LOC, cyclomatic complexity, Halstead metrics, and the Maintainability Index describe quality — then improve a module and prove it with numbers.",
    ],
  },
  objective: {
    title: "Objective",
    body: [
      "Collect real LOC / SLOC / LLOC, per-function cyclomatic complexity, Halstead volume/difficulty/effort, and Maintainability Index.",
      "Identify high-complexity functions from the dashboard and CFG.",
      "Refactor nested decisions, re-analyze, and report before/after change with a structured 10-mark lab report.",
    ],
  },
  theory: {
    title: "Theory",
    body: [
      "LOC family: physical lines (LOC), source lines (SLOC), logical statements (LLOC). Size alone does not equal complexity.",
      "McCabe cyclomatic complexity: M = E − N + 2P. Each independent path through a function needs at least one test. Ranks A (1–5) through F (41+).",
      "Halstead: operators η1, N1 and operands η2, N2. Volume V = N log₂(η), difficulty D = (η1/2)×(N2/η2), effort E = D×V. Nested predicates inflate operator counts.",
      "Maintainability Index blends volume, CC, and SLOC onto a 0–100 scale. Higher MI is easier to maintain.",
      "A control-flow graph (CFG) makes McCabe visual: ENTRY, statements, decisions (true/false), loops (back-edges), RETURN, EXIT.",
    ],
  },
  procedure: {
    title: "Procedure",
    body: [
      "1. Open Simulation and load the sample (or paste your own Python). Code is never executed — only parsed.",
      "2. Click Analyze Code. Watch the pipeline, then stay on Simulation — the control-flow graph appears below the editor.",
      "3. Open Results for KPI cards, function table, and charts. Click a function to jump in the editor.",
      "4. Open Simulation, select a function CFG, and Step / Play. At decisions choose true or false (graph walk, not a Python VM).",
      "5. Save Baseline. Refactor nested if/elif chains (guard clauses, helpers). Analyze Again.",
      "6. Compare BEFORE → AFTER percentages. Complete Exercise questions. Generate the report.",
    ],
  },
  exercise: {
    title: "Exercise",
    body: ["Answer questions from the live analysis. Refactor, re-analyze, then compare."],
  },
  simulation: {
    title: "Interactive Simulation",
    body: [
      "The token follows CFG edges only. User code is never eval'd or run as a process.",
      "Play / Pause / Step / Reset. At diamonds, pick True or False. Loop nodes: True = enter body, False = exit loop.",
    ],
  },
  results: {
    title: "Results",
    body: ["Raw metrics for the current editor buffer. These values are computed in the browser, not hardcoded."],
  },
  analysis: {
    title: "Analysis",
    body: [
      "Which functions are highly complex, and why? How does LOC relate to CC? What do Halstead volume and effort say about review cost?",
    ],
  },
  comparison: {
    title: "Before / After Comparison",
    body: ["Save a baseline, refactor, analyze again. Percentages use the two real AnalysisResult payloads."],
  },
  conclusion: {
    title: "Conclusion",
    body: [
      "Size, path count, and operator/operand effort are complementary views of quality.",
      "Metrics guide refactoring: extract predicates, flatten nests, shrink vocabulary — then verify with a second analysis run.",
    ],
  },
};

type ReactNodeLike = string[];
