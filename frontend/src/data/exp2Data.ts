// ================================================================
// Experiment 2 — Test Case Management (Kiwi TCMS)
// Purely deterministic engine (No LLM calls)
// ================================================================

export interface Exp2Project {
  id: string;
  name: string;
  description: string;
}

export interface Exp2StudentInfo {
  name: string;
  registration_number: string;
}

export interface Exp2Requirement {
  id: string;
  project_id: string;
  req_id: string;
  title: string;
  description: string;
  category: "functional" | "non-functional";
  priority: "High" | "Med" | "Low";
}

export interface Exp2TestCase {
  id: string;
  project_id: string;
  tc_id: string;
  title: string;
  tier: "functional" | "negative" | "boundary_value" | "usability";
  preconditions: string;
  steps: string[];
  expected_result: string;
  priority: "High" | "Med" | "Low";
  linked_requirement_ids: string[];
}

export interface Exp2TestPlan {
  id: string;
  project_id: string;
  name: string;
  test_case_ids: string[];
}

export interface Exp2TestRunResult {
  test_case_id: string;
  status: "Pass" | "Fail" | "Blocked";
  notes?: string;
}

export interface Exp2TestRun {
  id: string;
  project_id: string;
  test_plan_id: string;
  executed_at: string;
  results: Exp2TestRunResult[];
}

export interface Exp2MetricsResult {
  project_id: string;
  total_requirements: number;
  total_test_cases: number;
  covered_requirements_count: number;
  requirement_coverage_pct: number | null;
  total_executions: number;
  pass_count: number;
  fail_count: number;
  blocked_count: number;
  pass_rate_pct: number | null;
  tier_distribution: Record<string, number>;
  tier_diversity_pct: number;
  maturity_score: number;
  uncovered_requirements: Exp2Requirement[];
  orphan_test_cases: Exp2TestCase[];
}

export interface Exp2ComplianceRuleResult {
  passed: boolean;
  detail: string;
  failing_ids: string[];
}

export interface Exp2ComplianceCheckResponse {
  completeness: Exp2ComplianceRuleResult;
  traceability: Exp2ComplianceRuleResult;
  coverage: Exp2ComplianceRuleResult;
  tier_diversity: Exp2ComplianceRuleResult;
  execution_completeness: Exp2ComplianceRuleResult;
  quality_score: number;
}

export interface Exp2TraceabilityMatrixResult {
  requirements: Exp2Requirement[];
  test_cases: Exp2TestCase[];
  grid: Record<string, Record<string, boolean>>;
}

export interface Exp2QuizQuestion {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: string;
}

export interface Exp2QuizSubmitResponse {
  score: number;
  total: number;
  percentage: number;
  topic_breakdown: Record<string, { correct: number; total: number; percentage: number }>;
  feedback: { id: string; status: "correct" | "incorrect"; message: string }[];
}

export type Exp2Tab =
  | "aim"
  | "objective"
  | "theory"
  | "procedure"
  | "simulation"
  | "exercise"
  | "conclusion";

export const EXP2_TABS: { id: Exp2Tab; label: string }[] = [
  { id: "aim", label: "Aim" },
  { id: "objective", label: "Objective" },
  { id: "theory", label: "Theory" },
  { id: "procedure", label: "Procedure" },
  { id: "simulation", label: "Simulation" },
  { id: "exercise", label: "Exercise" },
  { id: "conclusion", label: "Conclusion" },
];

export const IMPROVEMENT_MAP: Record<string, string> = {
  completeness: "Some test cases are missing required fields. Review Procedure Step 3 and fill in preconditions, steps, and expected result for every test case.",
  traceability: "You have orphan test cases not linked to any requirement. Go to Test Case Author and link each one.",
  coverage: "Some requirements have zero test coverage. Add at least one test case per uncovered requirement (see Traceability Matrix).",
  tier_diversity: "You haven't used all four testing tiers. Review Theory > Testing Tiers and add the missing tier(s).",
  execution_completeness: "Some test cases were never executed. Run your Test Plan again and record a result for each one.",
  traceability_topic: "Revisit Theory > Requirement Traceability Matrix — your quiz answers show gaps here.",
  test_tiers_topic: "Revisit Theory > Testing Tiers — review functional vs negative vs boundary vs usability.",
  kiwi_objects_topic: "Revisit Theory > Kiwi TCMS Object Model — review how Test Plan, Test Case, and Test Run relate.",
  execution_model_topic: "Revisit Theory — a human tester decides Pass/Fail, not the tool itself.",
  orphan_tests_topic: "Revisit Theory > Orphan Tests — review why unlinked test cases represent a QA smell.",
  test_run_status_topic: "Revisit Theory — review what 'Blocked' status indicates during test execution.",
  coverage_formula_topic: "Revisit Theory > Formulas — review how Requirement Coverage % is calculated.",
  rtm_topic: "Revisit Theory > RTM — review how bidirectional traceability supports software audits.",
  usability_tier_topic: "Revisit Theory > Testing Tiers — review usability tier test case design.",
};

// ─── Pure Deterministic Math Engine (Client-Side Fallback) ──────

export function calculateLocalMetrics(
  project_id: string,
  requirements: Exp2Requirement[],
  test_cases: Exp2TestCase[],
  test_runs: Exp2TestRun[]
): Exp2MetricsResult {
  const total_requirements = requirements.length;
  const valid_req_ids = new Set(requirements.map(r => r.id));

  const covered_req_ids = new Set<string>();
  test_cases.forEach(tc => {
    tc.linked_requirement_ids.forEach(rid => {
      if (valid_req_ids.has(rid)) {
        covered_req_ids.add(rid);
      }
    });
  });

  const covered_count = covered_req_ids.size;
  const requirement_coverage_pct = total_requirements > 0
    ? Number(((covered_count / total_requirements) * 100).toFixed(1))
    : null;

  const uncovered_requirements = requirements.filter(r => !covered_req_ids.has(r.id));
  const orphan_test_cases = test_cases.filter(tc =>
    !tc.linked_requirement_ids || !tc.linked_requirement_ids.some(rid => valid_req_ids.has(rid))
  );

  const tier_distribution: Record<string, number> = {
    functional: 0,
    negative: 0,
    boundary_value: 0,
    usability: 0,
  };
  test_cases.forEach(tc => {
    tier_distribution[tc.tier] = (tier_distribution[tc.tier] || 0) + 1;
  });

  const distinct_tiers = Object.values(tier_distribution).filter(c => c > 0).length;
  const tier_diversity_pct = Number(((distinct_tiers / 4) * 100).toFixed(1));

  const latest_results: Record<string, "Pass" | "Fail" | "Blocked"> = {};
  test_runs.forEach(run => {
    run.results.forEach(res => {
      latest_results[res.test_case_id] = res.status;
    });
  });

  const pass_count = Object.values(latest_results).filter(s => s === "Pass").length;
  const fail_count = Object.values(latest_results).filter(s => s === "Fail").length;
  const blocked_count = Object.values(latest_results).filter(s => s === "Blocked").length;
  const total_executions = pass_count + fail_count + blocked_count;

  const pass_rate_pct = total_executions > 0
    ? Number(((pass_count / total_executions) * 100).toFixed(1))
    : null;

  const maturity_score = Number(
    (0.4 * (requirement_coverage_pct || 0) + 0.3 * (pass_rate_pct || 0) + 0.3 * tier_diversity_pct).toFixed(1)
  );

  return {
    project_id,
    total_requirements,
    total_test_cases: test_cases.length,
    covered_requirements_count: covered_count,
    requirement_coverage_pct,
    total_executions,
    pass_count,
    fail_count,
    blocked_count,
    pass_rate_pct,
    tier_distribution,
    tier_diversity_pct,
    maturity_score,
    uncovered_requirements,
    orphan_test_cases,
  };
}

export function checkLocalCompliance(
  requirements: Exp2Requirement[],
  test_cases: Exp2TestCase[],
  test_runs: Exp2TestRun[]
): Exp2ComplianceCheckResponse {
  const hasTestCases = test_cases.length > 0;
  const hasRequirements = requirements.length > 0;
  const hasTestRuns = test_runs.length > 0;

  const incomplete = test_cases.filter(tc => !(tc.title && tc.preconditions && tc.steps && tc.steps.length > 0 && tc.expected_result));
  const completeness = {
    passed: hasTestCases && incomplete.length === 0,
    detail: hasTestCases ? `${incomplete.length} test case(s) missing required fields` : "No test cases created yet",
    failing_ids: hasTestCases ? incomplete.map(tc => tc.tc_id) : ["no_test_cases"],
  };

  const orphans = test_cases.filter(tc => !tc.linked_requirement_ids || tc.linked_requirement_ids.length === 0);
  const traceability = {
    passed: hasTestCases && orphans.length === 0,
    detail: hasTestCases ? `${orphans.length} orphan test case(s)` : "No test cases created yet to evaluate traceability",
    failing_ids: hasTestCases ? orphans.map(tc => tc.tc_id) : ["no_test_cases"],
  };

  const covered = new Set<string>();
  test_cases.forEach(tc => tc.linked_requirement_ids.forEach(rid => covered.add(rid)));
  const uncovered = requirements.filter(r => !covered.has(r.id));
  const coverage = {
    passed: hasRequirements && hasTestCases && uncovered.length === 0,
    detail: hasRequirements ? `${uncovered.length} requirement(s) uncovered` : "No requirements created yet to evaluate coverage",
    failing_ids: hasRequirements ? uncovered.map(r => r.req_id) : ["no_requirements"],
  };

  const allTiers = new Set(["functional", "negative", "boundary_value", "usability"]);
  const usedTiers = new Set(test_cases.map(tc => tc.tier));
  const missingTiers = Array.from(allTiers).filter(t => !usedTiers.has(t as any));
  const tier_diversity = {
    passed: hasTestCases && missingTiers.length === 0,
    detail: hasTestCases ? `Missing tier(s): ${missingTiers.join(", ") || "none"}` : "No test cases created yet",
    failing_ids: hasTestCases ? missingTiers : ["no_test_cases"],
  };

  const executedTcIds = new Set<string>();
  test_runs.forEach(run => run.results.forEach(res => executedTcIds.add(res.test_case_id)));
  const unexecuted = test_cases.filter(tc => !executedTcIds.has(tc.id));
  const execution_completeness = {
    passed: hasTestCases && hasTestRuns && unexecuted.length === 0,
    detail: hasTestCases && hasTestRuns
      ? `${unexecuted.length} test case(s) never executed`
      : hasTestCases
      ? "No test runs executed yet"
      : "No test cases created yet to execute",
    failing_ids: hasTestCases && hasTestRuns ? unexecuted.map(tc => tc.tc_id) : ["no_executions"],
  };

  const rules = [completeness, traceability, coverage, tier_diversity, execution_completeness];
  const passedCount = rules.filter(r => r.passed).length;
  const quality_score = Number(((passedCount / rules.length) * 100).toFixed(1));

  return { completeness, traceability, coverage, tier_diversity, execution_completeness, quality_score };
}

export const EXP2_QUIZ_BANK: Exp2QuizQuestion[] = [
  {
    id: "q1",
    topic: "traceability",
    prompt: "A requirement with zero linked test cases is best described as a:",
    options: ["Orphan test", "Coverage gap", "Blocked run", "Boundary case"],
    answer: "Coverage gap"
  },
  {
    id: "q2",
    topic: "orphan_tests",
    prompt: "A test case not linked to any requirement is called a(n):",
    options: ["Coverage gap", "Orphan test", "Regression test", "Smoke test"],
    answer: "Orphan test"
  },
  {
    id: "q3",
    topic: "test_tiers",
    prompt: "Which tier checks behavior at minimum/maximum allowed input values?",
    options: ["Functional", "Negative", "Boundary Value", "Usability"],
    answer: "Boundary Value"
  },
  {
    id: "q4",
    topic: "test_tiers",
    prompt: "Testing invalid or malformed input belongs to which tier?",
    options: ["Functional", "Negative", "Boundary Value", "Usability"],
    answer: "Negative"
  },
  {
    id: "q5",
    topic: "kiwi_objects",
    prompt: "Which Kiwi TCMS object groups multiple test cases for a specific purpose (e.g. a sprint regression)?",
    options: ["Test Case", "Test Run", "Test Plan", "Requirement"],
    answer: "Test Plan"
  },
  {
    id: "q6",
    topic: "test_run_status",
    prompt: "A result of 'Blocked' means:",
    options: [
      "The test passed",
      "The test failed as expected",
      "The tester could not attempt the test due to an earlier issue",
      "The test was skipped on purpose"
    ],
    answer: "The tester could not attempt the test due to an earlier issue"
  },
  {
    id: "q7",
    topic: "coverage_formula",
    prompt: "8 requirements exist; 6 have at least one linked test case. Coverage is:",
    options: ["25%", "60%", "75%", "80%"],
    answer: "75%"
  },
  {
    id: "q8",
    topic: "execution_model",
    prompt: "Who determines whether a manual test Passes or Fails?",
    options: [
      "The test tool automatically",
      "An AI model",
      "The human tester, by performing the steps and recording the outcome",
      "The requirement author"
    ],
    answer: "The human tester, by performing the steps and recording the outcome"
  },
  {
    id: "q9",
    topic: "rtm",
    prompt: "The Requirement Traceability Matrix mainly helps answer:",
    options: [
      "How fast the code runs",
      "Whether every requirement has test coverage",
      "How many lines of code exist",
      "Who wrote which requirement"
    ],
    answer: "Whether every requirement has test coverage"
  },
  {
    id: "q10",
    topic: "usability_tier",
    prompt: "A test checking whether an error message is clear belongs to which tier?",
    options: ["Functional", "Boundary Value", "Negative", "Usability"],
    answer: "Usability"
  }
];
