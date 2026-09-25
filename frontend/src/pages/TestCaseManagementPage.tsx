import { useState, useMemo } from "react";
import {
  ClipboardCheck, Target, Lightbulb, BookOpen, ListOrdered,
  Layers, Play, CheckCircle2, XCircle,
  Award, Plus, Trash2,
  Check, Ban, FolderPlus, ExternalLink,
  FileText, CheckSquare, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LabCard, LabFormula, LabInfoBox, LabStepList } from "@/components/lab/LabCard";
import { LabPageShell, type LabPageSection } from "@/components/layout/LabPageShell";
import { LabQuizCards } from "@/components/exercise/LabQuizCards";
import { ConclusionQuizGate } from "@/components/quiz/ConclusionQuizGate";
import {
  EXP2_TABS,
  EXP2_QUIZ_BANK,
  calculateLocalMetrics,
  checkLocalCompliance,
  type Exp2Project,
  type Exp2StudentInfo,
  type Exp2Requirement,
  type Exp2TestCase,
  type Exp2TestPlan,
  type Exp2TestRun,
  type Exp2MetricsResult,
  type Exp2Tab,
} from "@/data/exp2Data";

const EXP2_TAB_ICONS: Record<Exp2Tab, React.ComponentType<{ className?: string }>> = {
  aim: Target,
  objective: Lightbulb,
  theory: BookOpen,
  procedure: ListOrdered,
  exercise: Layers,
  simulation: Play,
  conclusion: Award,
};

const EXP2_SECTIONS: LabPageSection<Exp2Tab>[] = EXP2_TABS.map((tab) => ({
  ...tab,
  icon: EXP2_TAB_ICONS[tab.id],
}));

const EXP2_CONCLUSION_QUIZ = [
  {
    id: "c1",
    prompt: "A requirement with no linked test case is primarily a:",
    expected: "Traceability gap",
    explain: "Coverage is incomplete until at least one test case references that requirement id.",
    options: ["Passed run", "Traceability gap", "Blocked defect", "Usability theme"],
  },
  {
    id: "c2",
    prompt: "Which execution outcome means the case could not be finished because of an external blocker?",
    expected: "Blocked",
    explain: "Blocked is distinct from Fail: the test did not complete, so it is not evidence of a product defect yet.",
    options: ["Pass", "Fail", "Blocked", "Skip as passed"],
  },
  {
    id: "c3",
    prompt: "Why does this lab ask you to author both positive and negative cases?",
    expected: "To exercise expected success paths and invalid or boundary input",
    explain: "A suite of only happy-path cases under-measures requirement risk.",
    options: [
      "To exercise expected success paths and invalid or boundary input",
      "Because negative cases replace requirements",
      "To increase LOC in the report",
      "So the PDF can skip the metrics table",
    ],
  },
  {
    id: "c4",
    prompt: "Requirement-to-test coverage is complete only when:",
    expected: "Every requirement id is referenced by at least one test case",
    explain: "A matrix with empty requirement rows is a planned-test gap, not a passed suite.",
    options: [
      "Every requirement id is referenced by at least one test case",
      "At least one test has status Pass",
      "The suite has more than ten cases",
      "All cases are High priority",
    ],
  },
  {
    id: "c5",
    prompt: "Fail means:",
    expected: "The case ran to completion and the actual result did not match expected",
    explain: "Fail is evidence of a product or environment mismatch after execution finished.",
    options: [
      "The tester never started the case",
      "The case ran to completion and the actual result did not match expected",
      "The same as Blocked",
      "A missing requirement id",
    ],
  },
  {
    id: "c6",
    prompt: "A High priority case should typically be executed:",
    expected: "Before Low-priority cosmetic checks when time is short",
    explain: "Risk-based testing schedules high-impact paths first.",
    options: [
      "Only after the report is downloaded",
      "Before Low-priority cosmetic checks when time is short",
      "Never, because High means deferred",
      "Only if the requirement has no id",
    ],
  },
  {
    id: "c7",
    prompt: "Boundary-value cases are written to:",
    expected: "Probe edges of valid and invalid input ranges",
    explain: "Defects cluster at limits (min, max, off-by-one), not only at typical mid-range data.",
    options: [
      "Replace all functional cases",
      "Probe edges of valid and invalid input ranges",
      "Measure Halstead volume",
      "Count Likert scores",
    ],
  },
  {
    id: "c8",
    prompt: "One requirement may map to many tests because:",
    expected: "Happy path, negative, and boundary conditions often need separate cases",
    explain: "Traceability is many-to-many: one req, several techniques; one test may also cover several reqs.",
    options: [
      "IEEE forbids more than one test per requirement",
      "Happy path, negative, and boundary conditions often need separate cases",
      "Tests cannot mention requirement ids",
      "Coverage is computed only from LOC",
    ],
  },
  {
    id: "c9",
    prompt: "After a defect fix, the most relevant extra run is:",
    expected: "A regression set that re-checks previously passing related cases",
    explain: "Fixes can break nearby behaviour; regression protects the rest of the suite.",
    options: [
      "Deleting the failed case",
      "A regression set that re-checks previously passing related cases",
      "Changing the requirement text only",
      "Marking Blocked as Pass",
    ],
  },
  {
    id: "c10",
    prompt: "Pass rate alone is a weak quality claim if:",
    expected: "Many requirements still have zero linked cases or many cases are Blocked",
    explain: "A 100% pass on a tiny traced subset hides untested risk.",
    options: [
      "The PDF includes student names",
      "Many requirements still have zero linked cases or many cases are Blocked",
      "Priority labels exist",
      "The suite uses both functional and usability types",
    ],
  },
];

function Exp2Badge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const styles: Record<string, string> = {
    Pass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    Fail: "bg-rose-100 text-rose-800 border-rose-300",
    Blocked: "bg-amber-100 text-amber-800 border-amber-300",
    functional: "bg-blue-100 text-blue-800 border-blue-300",
    negative: "bg-rose-100 text-rose-800 border-rose-300",
    boundary_value: "bg-purple-100 text-purple-800 border-purple-300",
    usability: "bg-teal-100 text-teal-800 border-teal-300",
    High: "bg-rose-100 text-rose-800 border-rose-200",
    Med: "bg-amber-100 text-amber-800 border-amber-200",
    Low: "bg-sky-100 text-sky-800 border-sky-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-semibold tracking-wide capitalize",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        styles[status] ?? "bg-slate-100 text-slate-700 border-slate-300"
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}



function Exp2Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Ban className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ================================================================
// TAB CONTENT COMPONENTS
// ================================================================

function Exp2AimTab() {
  return (
    <div className="space-y-6">
      <LabCard title="Experiment Aim" icon={Target}>
        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            To understand, design, and practice <strong>Test Case Management and Requirement Traceability</strong> using
            an open test-management workflow inspired by <strong>Kiwi TCMS</strong>.
          </p>
          <p>
            You will author requirements, construct test cases across 4 testing tiers (functional, negative, boundary value, usability),
            build a bidirectional Requirement Traceability Matrix (RTM), execute test runs, and measure test suite quality metrics using
            deterministic pure-Python mathematical formulas.
          </p>
        </div>
      </LabCard>

      <LabInfoBox variant="info" title="Zero Artificial Intelligence / Pure Deterministic Engine">
        Every metric (Requirement Coverage %, Pass Rate %, Tier Diversity %, and Test Suite Maturity Score) is computed
        deterministically from your typed data using fixed formulas. No LLMs or chatbot generators are involved.
      </LabInfoBox>
    </div>
  );
}

function Exp2ObjectiveTab() {
  const objectives = [
    "Author real functional requirements for a project of your own choosing.",
    "Design test cases across all four testing tiers (Functional, Negative, Boundary Value, Usability).",
    "Build bidirectional traceability between requirements and test cases to eliminate coverage gaps.",
    "Execute a test run and record honest Pass, Fail, and Blocked outcomes.",
    "Interpret coverage %, pass rate %, tier diversity, and test-suite maturity score.",
    "Recognize the real Kiwi TCMS tool and map today's practice onto it.",
  ];

  return (
    <div className="space-y-6">
      <LabCard title="Learning Objectives" icon={Lightbulb}>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {objectives.map((obj, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </div>
              <p className="text-sm font-medium text-slate-700 leading-snug">{obj}</p>
            </div>
          ))}
        </div>
      </LabCard>
    </div>
  );
}

function Exp2TheoryTab() {
  return (
    <div className="space-y-6">
      <LabCard title="1. What is Test Case Management?" icon={BookOpen}>
        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            Kiwi TCMS is <strong>not</strong> a tool that executes code automatically. It is a filing system for QA work — where a testing team writes down <em>what</em> needs to be checked, tracks <em>whether</em> it was checked, and proves <em>nothing was skipped</em>. A human tester always performs the actual testing; the tool keeps the record straight.
          </p>

          <div className="grid gap-3 md:grid-cols-3 mt-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold text-slate-900 block text-xs mb-1">Requirement</span>
              <span className="text-xs text-slate-600">A thing the software is supposed to do.</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold text-slate-900 block text-xs mb-1">Test Case</span>
              <span className="text-xs text-slate-600">A written, repeatable recipe (Preconditions → Steps → Expected Result).</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="font-bold text-slate-900 block text-xs mb-1">Traceability</span>
              <span className="text-xs text-slate-600">Requirement linked to &ge;1 test case. Zero links = <strong>coverage gap</strong>.</span>
            </div>
          </div>
        </div>
      </LabCard>

      <LabCard title="2. Testing Tiers & Object Model" icon={Layers}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <h4 className="font-semibold text-blue-900 mb-1">Functional Tier (Happy Path)</h4>
            <p className="text-xs text-blue-800">Verifies expected behavior under valid inputs and standard user workflows.</p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4">
            <h4 className="font-semibold text-rose-900 mb-1">Negative Tier (Invalid Input)</h4>
            <p className="text-xs text-rose-800">Verifies graceful error handling when invalid or malicious inputs are submitted.</p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
            <h4 className="font-semibold text-purple-900 mb-1">Boundary Value Tier (Edges)</h4>
            <p className="text-xs text-purple-800">Tests extreme limits (min, max, off-by-one boundary conditions).</p>
          </div>
          <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
            <h4 className="font-semibold text-teal-900 mb-1">Usability Tier (UX & Accessibility)</h4>
            <p className="text-xs text-teal-800">Evaluates responsiveness, clarity of error messages, and touch accessibility.</p>
          </div>
        </div>
      </LabCard>

      <LabCard title="3. Coverage and maturity formulas">
        <p className="mb-3 text-sm leading-relaxed text-slate-600">
          Every score in this lab is computed from your authored requirements, test cases, and run
          results. No code is executed and no LLM is used.
        </p>
        <div className="mb-3 space-y-1.5">
          <LabFormula>Requirement Coverage % = (linked requirements / total requirements) × 100</LabFormula>
          <LabFormula>Pass Rate % = (passed tests / executed tests) × 100</LabFormula>
          <LabFormula>Maturity Score = completeness + traceability + coverage + diversity + execution</LabFormula>
          <p className="mt-2 text-xs text-slate-500">
            Linked requirements = requirements with at least one test case. Executed tests = cases with a
            Pass, Fail, or Blocked result. Completeness / diversity / execution are lab scoring parts that
            reward filled fields, mixed test tiers, and a finished run.
          </p>
        </div>
      </LabCard>

      <LabCard title="4. Tool Familiarization (Kiwi TCMS vs This Lab)" icon={ExternalLink}>
        <div className="space-y-4 text-sm text-slate-600">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">In this lab</th>
                  <th className="p-3">In real Kiwi TCMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                <tr><td className="p-3 font-sans">Requirement</td><td className="p-3">Product Requirement / Linked Issue</td></tr>
                <tr><td className="p-3 font-sans">Test Case (with tier)</td><td className="p-3">Test Case (with Category)</td></tr>
                <tr><td className="p-3 font-sans">Test Plan</td><td className="p-3">Test Plan</td></tr>
                <tr><td className="p-3 font-sans">Test Run (Pass/Fail/Blocked)</td><td className="p-3">Test Run / Test Execution</td></tr>
                <tr><td className="p-3 font-sans">Traceability Matrix</td><td className="p-3">Requirement-to-TestCase Linkage View</td></tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 text-white text-xs">
            <span>Explore real open-source Kiwi TCMS documentation:</span>
            <a
              href="https://kiwitcms.org"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-blue-400 hover:text-blue-300 underline"
            >
              Visit kiwitcms.org <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </LabCard>

      <LabInfoBox variant="warning" title="Note on Execution">
        This tool never runs your code. You, the human tester, decide Pass/Fail by reasoning through your own steps — exactly like real manual QA testing.
      </LabInfoBox>
    </div>
  );
}

function Exp2ProcedureTab() {
  const steps = [
    "Open Simulation → Create a New Project (name + description of software to test). Every project starts empty.",
    "Go to Requirements panel → Add each requirement your project should satisfy.",
    "Go to Test Cases panel → Add test cases (pick tier, write preconditions/steps/expected result, link to requirement).",
    "Repeat step 3 until every requirement has coverage and you've used all 4 tiers at least once.",
    "Open Traceability Matrix → check for red/unlinked rows and link anything missing.",
    "Open Compliance panel → review 5-rule checklist (Completeness, Traceability, Coverage, Tier Diversity, Execution).",
    "Create a Test Plan, add test cases to it, then Run it — mark Pass / Fail / Blocked.",
    "Go to Results → review computed Coverage %, Pass Rate %, and Tier Distribution.",
    "Go to Analysis → read your rule-based verdict.",
    "Go to Comparison → click Save Baseline, add test cases to close gaps, re-run, and compare BEFORE vs AFTER.",
    "Go to Exercise → complete 10-question MCQ quiz check.",
    "Go to Conclusion → enter Name and Registration Number, then generate your PDF report.",
  ];

  return (
    <div className="space-y-6">
      <LabCard title="Step-by-Step Procedure" icon={ListOrdered}>
        <LabStepList items={steps} variant="procedure" />
      </LabCard>
    </div>
  );
}

// ================================================================
// MAIN EXPERIMENT COMPONENT
// ================================================================

export function TestCaseManagementPage() {
  const [activeTab, setActiveTab] = useState<Exp2Tab>("aim");
  const [simulationSubTab, setSimulationSubTab] = useState<
    "projects" | "requirements" | "testcases" | "executor" | "matrix" | "compliance"
  >("projects");

  // State for Projects & active project ID (starts completely empty)
  const [projects, setProjects] = useState<Exp2Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");

  // Storage maps per project_id
  const [_studentInfoMap, _setStudentInfoMap] = useState<Record<string, Exp2StudentInfo>>({});
  const [requirementsMap, setRequirementsMap] = useState<Record<string, Exp2Requirement[]>>({});
  const [testCasesMap, setTestCasesMap] = useState<Record<string, Exp2TestCase[]>>({});
  const [_testPlansMap, setTestPlansMap] = useState<Record<string, Exp2TestPlan[]>>({});
  const [testRunsMap, setTestRunsMap] = useState<Record<string, Exp2TestRun[]>>({});

  // Baseline metrics snapshot
  const [_baselineMetrics, _setBaselineMetrics] = useState<Exp2MetricsResult | null>(null);

  // Modal states
  const [isAddReqOpen, setIsAddReqOpen] = useState(false);
  const [isAddTcOpen, setIsAddTcOpen] = useState(false);
  const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);

  // Form states
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  const [newReqId, setNewReqId] = useState("");
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqDesc, setNewReqDesc] = useState("");
  const [newReqCat, setNewReqCat] = useState<"functional" | "non-functional">("functional");
  const [newReqPri, _setNewReqPri] = useState<"High" | "Med" | "Low">("High");

  const [newTcId, setNewTcId] = useState("");
  const [newTcTitle, setNewTcTitle] = useState("");
  const [newTcTier, setNewTcTier] = useState<"functional" | "negative" | "boundary_value" | "usability">("functional");
  const [newTcPre, setNewTcPre] = useState("");
  const [newTcSteps, setNewTcSteps] = useState("");
  const [newTcExpected, setNewTcExpected] = useState("");
  const [newTcPri, _setNewTcPri] = useState<"High" | "Med" | "Low">("High");
  const [newTcLinkedReqs, setNewTcLinkedReqs] = useState<string[]>([]);

  // Executor execution state
  const [selectedPlanId, _setSelectedPlanId] = useState<string>("");
  const [executionState, setExecutionState] = useState<Record<string, { status: "Pass" | "Fail" | "Blocked"; notes: string }>>({});

  // Quiz state
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  const currentReqs = useMemo(
    () => activeProjectId ? (requirementsMap[activeProjectId] || []) : [],
    [requirementsMap, activeProjectId]
  );

  const currentTcs = useMemo(
    () => activeProjectId ? (testCasesMap[activeProjectId] || []) : [],
    [testCasesMap, activeProjectId]
  );

  const currentRuns = useMemo(
    () => activeProjectId ? (testRunsMap[activeProjectId] || []) : [],
    [testRunsMap, activeProjectId]
  );

  // Deterministic Metrics Calculation
  const currentMetrics = useMemo(
    () => calculateLocalMetrics(activeProjectId, currentReqs, currentTcs, currentRuns),
    [activeProjectId, currentReqs, currentTcs, currentRuns]
  );

  // Deterministic Compliance Checker Calculation
  const currentCompliance = useMemo(
    () => checkLocalCompliance(currentReqs, currentTcs, currentRuns),
    [currentReqs, currentTcs, currentRuns]
  );

  // Handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const proj: Exp2Project = {
      id: `proj-${Date.now()}`,
      name: newProjName,
      description: newProjDesc,
    };
    setProjects(prev => [...prev, proj]);
    setActiveProjectId(proj.id);
    setRequirementsMap(prev => ({ ...prev, [proj.id]: [] }));
    setTestCasesMap(prev => ({ ...prev, [proj.id]: [] }));
    setTestPlansMap(prev => ({ ...prev, [proj.id]: [] }));
    setTestRunsMap(prev => ({ ...prev, [proj.id]: [] }));
    setIsCreateProjOpen(false);
    setNewProjName("");
    setNewProjDesc("");
    setSimulationSubTab("requirements");
  };

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle.trim() || !activeProjectId) return;
    const req: Exp2Requirement = {
      id: `req-${Date.now()}`,
      project_id: activeProjectId,
      req_id: newReqId.trim() || `REQ-00${currentReqs.length + 1}`,
      title: newReqTitle,
      description: newReqDesc,
      category: newReqCat,
      priority: newReqPri,
    };
    setRequirementsMap(prev => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] || []), req],
    }));
    setIsAddReqOpen(false);
    setNewReqId("");
    setNewReqTitle("");
    setNewReqDesc("");
  };

  const handleDeleteRequirement = (reqId: string) => {
    if (!activeProjectId) return;
    setRequirementsMap(prev => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).filter(r => r.id !== reqId),
    }));
    setTestCasesMap(prev => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).map(tc => ({
        ...tc,
        linked_requirement_ids: tc.linked_requirement_ids.filter(id => id !== reqId),
      })),
    }));
  };

  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTcTitle.trim() || !activeProjectId) return;
    const tc: Exp2TestCase = {
      id: `tc-${Date.now()}`,
      project_id: activeProjectId,
      tc_id: newTcId.trim() || `TC-00${currentTcs.length + 1}`,
      title: newTcTitle,
      tier: newTcTier,
      preconditions: newTcPre,
      steps: newTcSteps.split("\n").filter(s => s.trim().length > 0),
      expected_result: newTcExpected,
      priority: newTcPri,
      linked_requirement_ids: newTcLinkedReqs,
    };
    setTestCasesMap(prev => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] || []), tc],
    }));

    setTestPlansMap(prev => {
      const plans = prev[activeProjectId] || [];
      if (plans.length === 0) {
        const defaultPlan: Exp2TestPlan = {
          id: `tp-${Date.now()}`,
          project_id: activeProjectId,
          name: `${activeProject?.name || "Project"} Default Test Plan`,
          test_case_ids: [tc.id],
        };
        return { ...prev, [activeProjectId]: [defaultPlan] };
      } else {
        const updated = plans.map((p, idx) => idx === 0 ? { ...p, test_case_ids: [...p.test_case_ids, tc.id] } : p);
        return { ...prev, [activeProjectId]: updated };
      }
    });

    setIsAddTcOpen(false);
    setNewTcId("");
    setNewTcTitle("");
    setNewTcPre("");
    setNewTcSteps("");
    setNewTcExpected("");
    setNewTcLinkedReqs([]);
  };

  const handleDeleteTestCase = (tcId: string) => {
    if (!activeProjectId) return;
    setTestCasesMap(prev => ({
      ...prev,
      [activeProjectId]: (prev[activeProjectId] || []).filter(tc => tc.id !== tcId),
    }));
  };

  const handleSubmitTestRun = () => {
    if (!activeProjectId) return;
    const results = Object.entries(executionState).map(([tcId, item]) => ({
      test_case_id: tcId,
      status: item.status,
      notes: item.notes,
    }));

    const run: Exp2TestRun = {
      id: `tr-${Date.now()}`,
      project_id: activeProjectId,
      test_plan_id: selectedPlanId || "default-plan",
      executed_at: new Date().toISOString(),
      results,
    };

    setTestRunsMap(prev => ({
      ...prev,
      [activeProjectId]: [...(prev[activeProjectId] || []), run],
    }));

    alert("Test run recorded into project database!");
  };

  return (
    <>
    <LabPageShell
      experimentNumber={2}
      title="Test Case Management (Kiwi TCMS)"
      subtitle="Author requirements, write test cases, execute a run, and measure coverage gaps in a test-management workflow."
      sections={EXP2_SECTIONS}
      activeSection={activeTab}
      onSectionChange={setActiveTab}
      badgeIcon={ClipboardCheck}
      headerAction={
        <Button
          size="sm"
          onClick={() => { setActiveTab("simulation"); setSimulationSubTab("projects"); setIsCreateProjOpen(true); }}
          className="h-8 gap-1.5 bg-white/15 text-xs text-white hover:bg-white/25"
        >
          <Plus className="h-3.5 w-3.5" />
          Create New Project
        </Button>
      }
    >
        <div className="space-y-6">
          {activeTab === "aim" && <Exp2AimTab />}
          {activeTab === "objective" && <Exp2ObjectiveTab />}
          {activeTab === "theory" && <Exp2TheoryTab />}
          {activeTab === "procedure" && <Exp2ProcedureTab />}

          {/* SIMULATION TAB */}
          {activeTab === "simulation" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSimulationSubTab("projects")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      simulationSubTab === "projects" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <FolderPlus className="h-4 w-4" /> 0. Project Picker
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationSubTab("requirements")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      simulationSubTab === "requirements" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <FileText className="h-4 w-4" /> 1. Requirements ({currentReqs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationSubTab("testcases")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      simulationSubTab === "testcases" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <Layers className="h-4 w-4" /> 2. Test Cases ({currentTcs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationSubTab("executor")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      simulationSubTab === "executor" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <Play className="h-4 w-4" /> 3. Run Executor
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationSubTab("matrix")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      simulationSubTab === "matrix" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <CheckSquare className="h-4 w-4" /> 4. Traceability Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationSubTab("compliance")}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      simulationSubTab === "compliance" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" /> 5. Compliance ({currentCompliance.quality_score}%)
                  </button>
                </div>
              </div>

              {/* Panel 0: Project Picker */}
              {simulationSubTab === "projects" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Project Picker</h3>
                      <p className="text-xs text-slate-500">Every project is created by you. There are zero pre-seeded sample projects.</p>
                    </div>
                    <Button onClick={() => setIsCreateProjOpen(true)} className="bg-blue-600 text-white text-xs gap-1.5">
                      <Plus className="h-4 w-4" /> Create New Project
                    </Button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                      <FolderPlus className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-700">No project created yet.</p>
                      <p className="text-xs text-slate-500 mt-1">Click "Create New Project" to enter your course project or GitHub repository name.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      {projects.map(p => (
                        <div
                          key={p.id}
                          onClick={() => setActiveProjectId(p.id)}
                          className={cn(
                            "cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between",
                            activeProjectId === p.id ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20" : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-blue-600 uppercase">Student Project</span>
                              {activeProjectId === p.id && <Check className="h-4 w-4 text-blue-600" />}
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                            <p className="mt-2 text-xs text-slate-600 line-clamp-2">{p.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                            <span>Reqs: {(requirementsMap[p.id] || []).length}</span>
                            <span>Tests: {(testCasesMap[p.id] || []).length}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Panel 1: Requirements Manager */}
              {simulationSubTab === "requirements" && (
                <div className="space-y-6">
                  {!activeProject ? (
                    <p className="text-sm text-slate-500">Create a project first in Project Picker.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Requirements Manager — {activeProject.name}</h3>
                          <p className="text-xs text-slate-500">Author product requirements to establish testing coverage.</p>
                        </div>
                        <Button onClick={() => setIsAddReqOpen(true)} className="bg-blue-600 text-white text-xs gap-1.5">
                          <Plus className="h-4 w-4" /> Add Requirement
                        </Button>
                      </div>

                      {currentReqs.length === 0 ? (
                        <p className="text-sm text-slate-500">No requirements created yet. Click "Add Requirement" to start.</p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                              <tr>
                                <th className="p-3.5">Req ID</th>
                                <th className="p-3.5">Title</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5">Priority</th>
                                <th className="p-3.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {currentReqs.map(req => (
                                <tr key={req.id}>
                                  <td className="p-3.5 font-mono font-bold text-blue-600">{req.req_id}</td>
                                  <td className="p-3.5 font-medium text-slate-900">{req.title}</td>
                                  <td className="p-3.5"><Exp2Badge status={req.category} size="sm" /></td>
                                  <td className="p-3.5"><Exp2Badge status={req.priority} size="sm" /></td>
                                  <td className="p-3.5 text-right">
                                    <button onClick={() => handleDeleteRequirement(req.id)} className="p-1 text-slate-400 hover:text-rose-600">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Panel 2: Test Case Author */}
              {simulationSubTab === "testcases" && (
                <div className="space-y-6">
                  {!activeProject ? (
                    <p className="text-sm text-slate-500">Create a project first in Project Picker.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Test Case Author — {activeProject.name}</h3>
                          <p className="text-xs text-slate-500">Design test cases across 4 tiers and link to requirements.</p>
                        </div>
                        <Button onClick={() => setIsAddTcOpen(true)} className="bg-blue-600 text-white text-xs gap-1.5">
                          <Plus className="h-4 w-4" /> Add Test Case
                        </Button>
                      </div>

                      {currentTcs.length === 0 ? (
                        <p className="text-sm text-slate-500">No test cases authored yet. Click "Add Test Case".</p>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                              <tr>
                                <th className="p-3.5">TC ID</th>
                                <th className="p-3.5">Title</th>
                                <th className="p-3.5">Testing Tier</th>
                                <th className="p-3.5">Linked Requirements</th>
                                <th className="p-3.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {currentTcs.map(tc => {
                                const linked = currentReqs.filter(r => tc.linked_requirement_ids.includes(r.id));
                                return (
                                  <tr key={tc.id}>
                                    <td className="p-3.5 font-mono font-bold text-blue-600">{tc.tc_id}</td>
                                    <td className="p-3.5 font-medium text-slate-900">{tc.title}</td>
                                    <td className="p-3.5"><Exp2Badge status={tc.tier} size="sm" /></td>
                                    <td className="p-3.5">
                                      {linked.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {linked.map(r => (
                                            <span key={r.id} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                                              {r.req_id}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-amber-600 font-semibold italic">Orphan Test (Unlinked)</span>
                                      )}
                                    </td>
                                    <td className="p-3.5 text-right">
                                      <button onClick={() => handleDeleteTestCase(tc.id)} className="p-1 text-slate-400 hover:text-rose-600">
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Panel 3: Run Executor */}
              {simulationSubTab === "executor" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Test Run Executor</h3>
                      <p className="text-xs text-slate-500">Record Pass/Fail/Blocked judgments as a human tester.</p>
                    </div>
                    <Button onClick={handleSubmitTestRun} className="bg-emerald-600 text-white text-xs gap-1.5">
                      <Play className="h-4 w-4" /> Submit Test Run
                    </Button>
                  </div>

                  {currentTcs.map(tc => (
                    <div key={tc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600">{tc.tc_id}</span>
                          <Exp2Badge status={tc.tier} size="sm" />
                          <h4 className="font-semibold text-sm text-slate-900">{tc.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500">Expected: {tc.expected_result}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                          {["Pass", "Fail", "Blocked"].map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setExecutionState(prev => ({
                                ...prev,
                                [tc.id]: { status: st as any, notes: prev[tc.id]?.notes || "" }
                              }))}
                              className={cn(
                                "px-3 py-1 rounded text-xs font-bold transition-all",
                                (executionState[tc.id]?.status || "Pass") === st ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Notes..."
                          value={executionState[tc.id]?.notes || ""}
                          onChange={e => setExecutionState(prev => ({
                            ...prev,
                            [tc.id]: { status: (prev[tc.id]?.status || "Pass") as any, notes: e.target.value }
                          }))}
                          className="w-36 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Panel 4: Traceability Matrix */}
              {simulationSubTab === "matrix" && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-slate-900">Requirement Traceability Matrix (RTM) Grid</h3>
                  {currentReqs.length === 0 || currentTcs.length === 0 ? (
                    <p className="text-sm text-slate-500">Add requirements and test cases to render grid.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-center text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <th className="p-3 text-left font-bold border-r border-slate-200">Requirement</th>
                            {currentTcs.map(tc => (
                              <th key={tc.id} className="p-3 font-mono font-bold text-blue-600 border-r border-slate-200">
                                {tc.tc_id}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentReqs.map(req => {
                            const isCovered = currentTcs.some(tc => tc.linked_requirement_ids.includes(req.id));
                            return (
                              <tr key={req.id} className={cn(!isCovered && "bg-rose-50/50")}>
                                <td className="p-3 text-left font-semibold text-slate-900 border-r border-slate-200 flex items-center justify-between">
                                  <span>{req.req_id}: {req.title}</span>
                                  {!isCovered && <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">UNCOVERED</span>}
                                </td>
                                {currentTcs.map(tc => {
                                  const isLinked = tc.linked_requirement_ids.includes(req.id);
                                  return (
                                    <td key={tc.id} className="p-3 border-r border-slate-200 font-bold">
                                      {isLinked ? <span className="text-emerald-600">✅</span> : <span className="text-slate-300">—</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Panel 5: Compliance Checker */}
              {simulationSubTab === "compliance" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">5-Rule Quality Compliance Checker</h3>
                      <p className="text-xs text-slate-500">Evaluates methodology compliance across 5 strict QA rules.</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-200">
                      Score: {currentCompliance.quality_score} / 100
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { key: "completeness", title: "1. Completeness", res: currentCompliance.completeness },
                      { key: "traceability", title: "2. Traceability", res: currentCompliance.traceability },
                      { key: "coverage", title: "3. Requirement Coverage", res: currentCompliance.coverage },
                      { key: "tier_diversity", title: "4. Tier Diversity", res: currentCompliance.tier_diversity },
                      { key: "execution_completeness", title: "5. Execution Completeness", res: currentCompliance.execution_completeness },
                    ].map(rule => (
                      <div key={rule.key} className={cn(
                        "rounded-xl border p-4 shadow-sm",
                        rule.res.passed ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-sm text-slate-900">{rule.title}</h4>
                          {rule.res.passed ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle2 className="h-3.5 w-3.5" /> PASSED
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              <XCircle className="h-3.5 w-3.5" /> FAILED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{rule.res.detail}</p>
                        {rule.res.failing_ids.length > 0 && (
                          <p className="mt-2 text-[11px] text-slate-500 font-mono">
                            Failing IDs: {rule.res.failing_ids.join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}



          {/* EXERCISE TAB */}
          {activeTab === "exercise" && (
            <div className="space-y-4">
              <LabCard title="Exercise" icon={Layers}>
                <p className="text-sm leading-relaxed text-slate-600">
                  Answer from the test-management simulation. Use Try Yourself, Check Answer, and Show Explanation on each card.
                </p>
              </LabCard>
              <LabQuizCards
                questions={EXP2_QUIZ_BANK.map((q) => ({
                  id: q.id,
                  prompt: `${q.prompt} (${q.topic})`,
                  expected: q.answer,
                  explain: `Expected: ${q.answer}.`,
                  options: q.options,
                }))}
                onStatusChange={(s) => {
                  if (s.allChecked) setQuizSubmitted(true);
                }}
              />
            </div>
          )}

          {/* CONCLUSION TAB */}
          {activeTab === "conclusion" && (
            <ConclusionQuizGate
              paragraphs={[
                "Requirement traceability, test-case authoring, and execution completeness were measured from the student-authored suite.",
                "A coverage gap remains wherever a requirement has no linked case. Blocked runs are not Fail evidence.",
              ]}
              questions={EXP2_CONCLUSION_QUIZ}
              quizTitle="Experiment 2 — Conclusion quiz"
              locked={!quizSubmitted || !activeProject}
              lockHint={
                !activeProject
                  ? "Create a project in Simulation first, then complete every question in the Exercise tab."
                  : "Complete every question in the Exercise tab, then return here to take the quiz."
              }
              originOptions={[
                { value: "own", label: "Own project" },
                { value: "sample", label: "Lab sample" },
                { value: "github", label: "GitHub project" },
              ]}
              footnote="Test Case Management (Exercise 2)."
              studentSeed={{ title: "Test Case Management (Kiwi TCMS)", origin: "own" }}
              onDownload={async (s, result) => {
                if (!activeProject) return;
                const { downloadUnifiedLabPdf } = await import("@/lib/reportPdf");
                await downloadUnifiedLabPdf({
                  experimentNumber: 2,
                  experimentTitle: "Test Case Management",
                  names: s.names,
                  regs: s.regs,
                  projectTitle: s.title,
                  origin: s.origin,
                  description: s.description,
                  toolNote: `Project ${activeProject.name}.`,
                  resultLines: [
                    `Requirements ${currentReqs.length}, test cases ${currentTcs.length}, maturity ${currentMetrics.maturity_score}/100.`,
                  ],
                  analysisLines: [
                    "Requirement traceability, test-case authoring, and execution completeness were measured from the student-authored suite.",
                  ],
                  conclusion:
                    "Requirement traceability, test-case authoring, and execution completeness were measured from the student-authored suite.",
                  quizScore: result.score,
                  quizTotal: result.total,
                });
              }}
            />
          )}
        </div>
    </LabPageShell>

      {/* Create Custom Project Modal */}
      <Exp2Modal isOpen={isCreateProjOpen} onClose={() => setIsCreateProjOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Course Project / GitHub Repo Name"
              value={newProjName}
              onChange={e => setNewProjName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-900"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of the software system scope..."
              value={newProjDesc}
              onChange={e => setNewProjDesc(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateProjOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 text-white">Create Project</Button>
          </div>
        </form>
      </Exp2Modal>

      {/* Add Requirement Modal */}
      <Exp2Modal isOpen={isAddReqOpen} onClose={() => setIsAddReqOpen(false)} title="Add Requirement">
        <form onSubmit={handleAddRequirement} className="space-y-4 text-xs">
          <div className="grid gap-4 grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Req ID</label>
              <input
                type="text"
                placeholder="e.g. REQ-001"
                value={newReqId}
                onChange={e => setNewReqId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select value={newReqCat} onChange={e => setNewReqCat(e.target.value as any)} className="w-full rounded-lg border border-slate-200 p-2">
                <option value="functional">Functional</option>
                <option value="non-functional">Non-Functional</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title</label>
            <input type="text" required placeholder="Title" value={newReqTitle} onChange={e => setNewReqTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea rows={2} placeholder="Description" value={newReqDesc} onChange={e => setNewReqDesc(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddReqOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 text-white">Save Requirement</Button>
          </div>
        </form>
      </Exp2Modal>

      {/* Add Test Case Modal */}
      <Exp2Modal isOpen={isAddTcOpen} onClose={() => setIsAddTcOpen(false)} title="Add Test Case">
        <form onSubmit={handleAddTestCase} className="space-y-4 text-xs">
          <div className="grid gap-4 grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">TC ID</label>
              <input type="text" placeholder="e.g. TC-001" value={newTcId} onChange={e => setNewTcId(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 font-mono" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Testing Tier</label>
              <select value={newTcTier} onChange={e => setNewTcTier(e.target.value as any)} className="w-full rounded-lg border border-slate-200 p-2">
                <option value="functional">Functional</option>
                <option value="negative">Negative</option>
                <option value="boundary_value">Boundary Value</option>
                <option value="usability">Usability</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title</label>
            <input type="text" required placeholder="Title" value={newTcTitle} onChange={e => setNewTcTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preconditions</label>
            <input type="text" placeholder="Preconditions" value={newTcPre} onChange={e => setNewTcPre(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Steps (One per line)</label>
            <textarea rows={3} placeholder="Steps" value={newTcSteps} onChange={e => setNewTcSteps(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 font-mono" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expected Result</label>
            <input type="text" placeholder="Expected result" value={newTcExpected} onChange={e => setNewTcExpected(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2" />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Link to Requirements</label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1 bg-slate-50">
              {currentReqs.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTcLinkedReqs.includes(r.id)}
                    onChange={e => {
                      if (e.target.checked) setNewTcLinkedReqs(prev => [...prev, r.id]);
                      else setNewTcLinkedReqs(prev => prev.filter(id => id !== r.id));
                    }}
                    className="text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="font-mono font-bold text-blue-700">{r.req_id}:</span>
                  <span>{r.title}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddTcOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 text-white">Save Test Case</Button>
          </div>
        </form>
      </Exp2Modal>
    </>
  );
}
