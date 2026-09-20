import React, { useState, useEffect } from "react";
import {
  Ruler,
  FolderPlus,
  Calculator,
  Sliders,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  BookOpen,
  Target,
  ListOrdered,
  HelpCircle,
  Award,
  Layers,
  Info,
  Save,
  RotateCcw
} from "lucide-react";

import { LabCard, LabFormula, LabStepList, LabThresholds } from "@/components/lab/LabCard";
import { LabPageShell, type LabPageSection } from "@/components/layout/LabPageShell";
import {
  ReportDownloadBar,
  ReportStudentFields,
} from "@/components/lab/ReportForm";

import {
  FPComponentItem,
  GSCRatingItem,
  SizeProjectItem,
  SizeStudentInfoItem,
  SizeMetricsResultItem,
  SizeComplianceResponseItem,
  SizeSnapshotItem,
  GSC_LIST,
  IFPUG_WEIGHTS,
  LOC_PER_FP,
  QUIZ_BANK,
  IMPROVEMENT_MAP,
  calcMetrics,
  calcCompliance
} from "@/data/exp3Data";
import {
  emptyBundle,
  initGscRatings,
  loadExp3State,
  newId,
  saveExp3State,
} from "@/lib/exp3Store";
import { downloadExp3Pdf } from "@/lib/reportPdf";

type Exp3Tab = "aim" | "objective" | "theory" | "procedure" | "simulation" | "exercise" | "conclusion";

const EXP3_SECTIONS: LabPageSection<Exp3Tab>[] = [
  { id: "aim", label: "Aim", icon: Target },
  { id: "objective", label: "Objective", icon: BookOpen },
  { id: "theory", label: "Theory", icon: Layers },
  { id: "procedure", label: "Procedure", icon: ListOrdered },
  { id: "simulation", label: "Simulation", icon: Calculator },
  { id: "exercise", label: "Exercise", icon: HelpCircle },
  { id: "conclusion", label: "Conclusion", icon: Award },
];

export function SoftwareSizeEstimationPage() {
  const [activeTab, setActiveTab] = useState<Exp3Tab>("aim");

  // Simulation sub-tabs: 0: picker, 1: fp_counter, 2: gsc_ratings, 3: cocomo_dashboard, 4: compliance
  const [simSubTab, setSimSubTab] = useState<number>(0);

  // --- STATE ---
  const [projects, setProjects] = useState<SizeProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // New Project Form
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjType, setNewProjType] = useState<"organic" | "semi_detached" | "embedded">("organic");
  const [newProjLang, setNewProjLang] = useState("Python");

  // Active Project Data
  const [components, setComponents] = useState<FPComponentItem[]>([]);
  const [gscRatings, setGscRatings] = useState<GSCRatingItem[]>([]);
  const [snapshots, setSnapshots] = useState<SizeSnapshotItem[]>([]);
  const [studentInfo, setStudentInfo] = useState<SizeStudentInfoItem>({ name: "", registration_number: "" });

  // New Component Form
  const [compName, setCompName] = useState("");
  const [compType, setCompType] = useState<"EI" | "EO" | "EQ" | "ILF" | "EIF">("EI");
  const [compComplexity, setCompComplexity] = useState<"low" | "average" | "high">("average");

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [topicStats, setTopicStats] = useState<Record<string, { correct: number; total: number; pct: number }>>({});

  // Active Project Object
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const state = loadExp3State();
    setProjects(state.projects);
    if (state.projects.length > 0) {
      const firstId = state.projects[0]!.id;
      setActiveProjectId(firstId);
      const bundle = state.byProject[firstId] ?? emptyBundle(firstId);
      setComponents(bundle.components);
      setGscRatings(bundle.gsc.length === 14 ? bundle.gsc : initGscRatings(firstId));
      setSnapshots(bundle.snapshots);
      if (bundle.student.name) setStudentInfo(bundle.student);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const byProject = { ...loadExp3State().byProject };
    for (const p of projects) {
      if (!byProject[p.id]) byProject[p.id] = emptyBundle(p.id);
    }
    if (activeProjectId) {
      byProject[activeProjectId] = {
        components,
        gsc: gscRatings,
        snapshots,
        student: studentInfo,
      };
    }
    saveExp3State({ projects, byProject });
  }, [hydrated, projects, activeProjectId, components, gscRatings, snapshots, studentInfo]);

  const selectProject = (id: string) => {
    const state = loadExp3State();
    if (activeProjectId) {
      state.byProject[activeProjectId] = {
        components,
        gsc: gscRatings,
        snapshots,
        student: studentInfo,
      };
      saveExp3State({ projects, byProject: state.byProject });
    }
    setActiveProjectId(id);
    const bundle = state.byProject[id] ?? emptyBundle(id);
    setComponents(bundle.components);
    setGscRatings(bundle.gsc.length === 14 ? bundle.gsc : initGscRatings(id));
    setSnapshots(bundle.snapshots);
    setStudentInfo(bundle.student);
  };

  // --- ACTIONS ---

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const created: SizeProjectItem = {
      id: newId("proj"),
      name: newProjName.trim(),
      description: newProjDesc.trim(),
      project_type: newProjType,
      language: newProjLang,
      created_at: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, created]);
    setActiveProjectId(created.id);
    setComponents([]);
    setGscRatings(initGscRatings(created.id));
    setSnapshots([]);
    setNewProjName("");
    setNewProjDesc("");
    setSimSubTab(1);
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !compName.trim()) return;

    const created: FPComponentItem = {
      id: newId("comp"),
      project_id: activeProjectId,
      name: compName.trim(),
      type: compType,
      complexity: compComplexity,
    };
    setComponents((prev) => [...prev, created]);
    setCompName("");
  };

  const handleDeleteComponent = (comp_id: string) => {
    if (!activeProjectId) return;
    setComponents((prev) => prev.filter((c) => c.id !== comp_id));
  };

  const handleUpdateGscRating = (characteristic_name: string, rating: number) => {
    let found = false;
    const updated = gscRatings.map((item) => {
      if (item.characteristic_name.toLowerCase() === characteristic_name.toLowerCase()) {
        found = true;
        return { ...item, rating };
      }
      return item;
    });
    if (!found) {
      updated.push({
        id: `gsc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        project_id: activeProjectId || "",
        characteristic_name,
        rating
      });
    }
    setGscRatings(updated);
  };

  const handleSaveSnapshot = () => {
    if (!activeProjectId || !activeProject) return;
    const label = `Snapshot ${snapshots.length + 1} (${new Date().toLocaleTimeString()})`;

    const currentMetrics = calcMetrics(activeProject, components, gscRatings);
    const snap: SizeSnapshotItem = {
      id: newId("snap"),
      project_id: activeProjectId,
      label,
      ufp: currentMetrics.ufp,
      vaf: currentMetrics.vaf,
      afp: currentMetrics.afp,
      kloc: currentMetrics.kloc,
      effort_pm: currentMetrics.cocomo.effort_pm,
      time_months: currentMetrics.cocomo.time_months,
      avg_team_size: currentMetrics.cocomo.avg_team_size,
      created_at: new Date().toISOString(),
    };
    setSnapshots((prev) => [...prev, snap]);
  };

  const handleResetProject = () => {
    if (!activeProjectId) return;
    if (!window.confirm("Are you sure you want to reset components and GSC ratings for this project?")) return;

    setComponents([]);
    setGscRatings(initGscRatings(activeProjectId));
    setSnapshots([]);
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let score = 0;
    const stats: Record<string, { correct: number; total: number; pct: number }> = {};

    QUIZ_BANK.forEach((q) => {
      const topic = q.topic;
      if (!stats[topic]) {
        stats[topic] = { correct: 0, total: 0, pct: 0 };
      }
      stats[topic].total += 1;

      const userAns = quizAnswers[q.id];
      if (userAns && userAns.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        score += 1;
        stats[topic].correct += 1;
      }
    });

    Object.keys(stats).forEach((t) => {
      stats[t].pct = Math.round((stats[t].correct / stats[t].total) * 100);
    });

    setQuizScore(score);
    setTopicStats(stats);
    setQuizSubmitted(true);
  };

  // Derived metrics
  const activeMetrics: SizeMetricsResultItem = activeProject
    ? calcMetrics(activeProject, components, gscRatings)
    : {
        project_id: "",
        total_components: 0,
        ufp: 0,
        tdi: 0,
        vaf: 0.65,
        afp: 0,
        loc_per_fp: 42,
        kloc: 0,
        cocomo: { effort_pm: 0, time_months: 0, avg_team_size: 0 },
        size_category: "Very Small",
        consistency_note: "Create a project to compute metrics."
      };

  const activeCompliance: SizeComplianceResponseItem = calcCompliance(activeProject, components, gscRatings);

  // Recommendations generator
  const getRecommendations = (): string[] => {
    const recs: string[] = [];
    if (!activeCompliance.component_coverage.passed) recs.push(IMPROVEMENT_MAP.component_coverage);
    if (!activeCompliance.complexity_assigned.passed) recs.push(IMPROVEMENT_MAP.complexity_assigned);
    if (!activeCompliance.gsc_completeness.passed) recs.push(IMPROVEMENT_MAP.gsc_completeness);
    if (!activeCompliance.project_type_missing.passed) recs.push(IMPROVEMENT_MAP.project_type_missing);
    if (!activeCompliance.language_missing.passed) recs.push(IMPROVEMENT_MAP.language_missing);

    if (quizSubmitted && topicStats) {
      Object.entries(topicStats).forEach(([t, data]) => {
        if (data.pct < 50) {
          const key = `${t}_topic`;
          if (IMPROVEMENT_MAP[key] && !recs.includes(IMPROVEMENT_MAP[key])) {
            recs.push(IMPROVEMENT_MAP[key]);
          }
        }
      });
    }

    if (recs.length === 0) {
      recs.push("Excellent work! Your software size estimation model satisfies all compliance rules and quiz topics.");
    }
    return recs;
  };

  return (
    <LabPageShell
      experimentNumber={3}
      title="Software Size Estimation"
      subtitle="Estimate software size with Function Point Analysis and the COCOMO Basic model, then relate estimates to measured KLOC."
      sections={EXP3_SECTIONS}
      activeSection={activeTab}
      onSectionChange={setActiveTab}
      badgeIcon={Ruler}
      headerAction={
        activeProject ? (
          <div className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs text-white">
            <div className="font-semibold">{activeProject.name}</div>
            <div className="text-white/70">
              {activeProject.project_type} · {activeProject.language}
            </div>
          </div>
        ) : undefined
      }
    >
        <div className="space-y-6">

          {/* 1. AIM TAB */}
          {activeTab === "aim" && (
            <LabCard title="Aim of the Experiment" icon={Target}>
              <p className="text-slate-600 leading-relaxed text-sm">
                To estimate the physical and functional size of a software application using{" "}
                <strong className="text-slate-900 font-semibold">Function Point Analysis (FPA)</strong> according to IFPUG guidelines,
                convert functional size into estimated Lines of Code (KLOC), and apply the{" "}
                <strong className="text-slate-900 font-semibold">COCOMO Basic Model</strong> to calculate development effort, duration,
                and optimal team size before implementation begins.
              </p>
            </LabCard>
          )}

          {/* 2. OBJECTIVE TAB */}
          {activeTab === "objective" && (
            <LabCard title="Learning Objectives" icon={BookOpen}>
              <LabStepList
                items={[
                  "Identify and categorize the 5 standard IFPUG Function Point components (EI, EO, EQ, ILF, EIF).",
                  "Assign Low, Average, or High complexity ratings to calculate Unadjusted Function Points (UFP).",
                  "Evaluate the 14 General System Characteristics (GSCs) to calculate the Value Adjustment Factor (VAF).",
                  "Derive Adjusted Function Points (AFP) and convert them to KLOC using language-specific LOC/FP ratios.",
                  "Apply COCOMO Basic equations to estimate Effort (person-months), Schedule (months), and Team Size.",
                  "Audit estimation completeness using a 5-rule automated compliance checker."
                ]}
                variant="objective"
              />
            </LabCard>
          )}

          {/* 3. THEORY TAB */}
          {activeTab === "theory" && (
            <div className="space-y-6">
              <LabCard title="1. Function Point Analysis (FPA)" icon={Layers}>
                <div className="space-y-4 text-sm text-slate-600">
                  <p>
                    Function Point Analysis measures software size based on user-visible functionality (inputs, outputs, data stores)
                    rather than raw implementation lines of code. It provides a technology-independent metric usable during early design.
                  </p>

                  {/* Table of 5 Components */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-sm text-left text-slate-700">
                      <thead className="bg-slate-50 text-slate-800 font-semibold uppercase text-xs border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Component Type</th>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Low</th>
                          <th className="px-4 py-3">Average</th>
                          <th className="px-4 py-3">High</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="px-4 py-3 font-semibold text-slate-900">External Input</td>
                          <td className="px-4 py-3 font-mono text-blue-600">EI</td>
                          <td className="px-4 py-3">Processes data coming from outside the application boundary (e.g., forms).</td>
                          <td className="px-4 py-3 font-semibold">3</td>
                          <td className="px-4 py-3 font-semibold">4</td>
                          <td className="px-4 py-3 font-semibold">6</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-slate-900">External Output</td>
                          <td className="px-4 py-3 font-mono text-blue-600">EO</td>
                          <td className="px-4 py-3">Generates derived data/reports sent outside the boundary.</td>
                          <td className="px-4 py-3 font-semibold">4</td>
                          <td className="px-4 py-3 font-semibold">5</td>
                          <td className="px-4 py-3 font-semibold">7</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-slate-900">External Inquiry</td>
                          <td className="px-4 py-3 font-mono text-blue-600">EQ</td>
                          <td className="px-4 py-3">Interactive data retrieval with simple input/output (e.g., search query).</td>
                          <td className="px-4 py-3 font-semibold">3</td>
                          <td className="px-4 py-3 font-semibold">4</td>
                          <td className="px-4 py-3 font-semibold">6</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-slate-900">Internal Logical File</td>
                          <td className="px-4 py-3 font-mono text-blue-600">ILF</td>
                          <td className="px-4 py-3">Maintained logical group of data inside system boundary (e.g., DB table).</td>
                          <td className="px-4 py-3 font-semibold">7</td>
                          <td className="px-4 py-3 font-semibold">10</td>
                          <td className="px-4 py-3 font-semibold">15</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-slate-900">External Interface File</td>
                          <td className="px-4 py-3 font-mono text-blue-600">EIF</td>
                          <td className="px-4 py-3">Referenced logical group of data maintained outside system boundary (e.g., API).</td>
                          <td className="px-4 py-3 font-semibold">5</td>
                          <td className="px-4 py-3 font-semibold">7</td>
                          <td className="px-4 py-3 font-semibold">10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </LabCard>

              {/* VAF & AFP Formulas */}
              <div className="grid gap-4 md:grid-cols-2">
                <LabCard title="Value Adjustment Factor (VAF)">
                  <p className="mb-3 text-sm text-slate-600">
                    TDI is the Total Degree of Influence from the 14 General System Characteristics (0 to 5 each).
                  </p>
                  <div className="mb-3">
                    <LabFormula>VAF = 0.65 + (0.01 × TDI)</LabFormula>
                  </div>
                  <LabThresholds
                    caption="Laboratory range:"
                    rows={[
                      { range: "0.65", label: "Minimum VAF", color: "bg-slate-100 text-slate-700" },
                      { range: "1.00", label: "Unadjusted", color: "bg-blue-100 text-blue-700" },
                      { range: "1.35", label: "Maximum VAF", color: "bg-amber-100 text-amber-700" },
                    ]}
                  />
                </LabCard>
                <LabCard title="Adjusted Function Points & KLOC">
                  <p className="mb-3 text-sm text-slate-600">
                    AFP scales unadjusted points by VAF. KLOC uses a language expansion factor.
                  </p>
                  <div className="space-y-1.5">
                    <LabFormula>AFP = UFP × VAF</LabFormula>
                    <LabFormula>KLOC = (AFP × LOC_per_FP) / 1000</LabFormula>
                  </div>
                </LabCard>
              </div>

              {/* COCOMO Basic */}
              <LabCard title="2. COCOMO Basic Model" icon={Gauge}>
                <p className="mb-3 text-sm text-slate-600">
                  Effort is in person-months. Schedule is in months. Team size is Effort / Time.
                </p>
                <div className="mb-3 space-y-1.5">
                  <LabFormula>Effort = a × (KLOC)^b</LabFormula>
                  <LabFormula>Time = c × (Effort)^d</LabFormula>
                  <LabFormula>Team Size = Effort / Time</LabFormula>
                </div>
                <LabThresholds
                  caption="Laboratory coefficients (COCOMO Basic):"
                  rows={[
                    { range: "Organic  a=2.4 b=1.05", label: "Small / experienced", color: "bg-emerald-100 text-emerald-700" },
                    { range: "Semi-detached  a=3.0 b=1.12", label: "Medium / mixed", color: "bg-blue-100 text-blue-700" },
                    { range: "Embedded  a=3.6 b=1.20", label: "Complex / rigid", color: "bg-amber-100 text-amber-700" },
                  ]}
                />
              </LabCard>
            </div>
          )}

          {/* 4. PROCEDURE TAB */}
          {activeTab === "procedure" && (
            <LabCard title="Step-by-Step Procedure" icon={ListOrdered}>
              <LabStepList
                items={[
                  "Navigate to Simulation > Sub-panel 0. Click 'Create New Project', enter project name, select target COCOMO mode (Organic / Semi-Detached / Embedded) and programming language.",
                  "Go to Sub-panel 1 (FP Counter). Add all user-facing components (EI, EO, EQ, ILF, EIF) and assign Low, Average, or High complexity. Watch Unadjusted Function Points (UFP) calculate live.",
                  "Go to Sub-panel 2 (GSC Ratings). Rate all 14 characteristics on a scale of 0 (No Influence) to 5 (Essential Influence). Observe TDI and VAF adjust automatically.",
                  "Go to Sub-panel 3 (Dashboard). Review computed AFP, KLOC, Effort (Person-Months), Schedule (Months), and Average Team Size. Save a baseline snapshot for comparison.",
                  "Go to Sub-panel 4 (Compliance Checker). Review the 5-rule quality audit to ensure zero missing parameters.",
                  "Attempt the 10-question Exercise quiz, lock in answers, then fill your name & registration number in Conclusion tab to print your official lab report."
                ]}
                variant="procedure"
              />
            </LabCard>
          )}

          {/* 5. SIMULATION TAB */}
          {activeTab === "simulation" && (
            <div className="space-y-6">
              {/* Sub-panel Navigation Bar */}
              <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm gap-1 overflow-x-auto">
                {[
                  { id: 0, label: "0. Project Picker", icon: FolderPlus },
                  { id: 1, label: "1. FP Counter", icon: Calculator },
                  { id: 2, label: "2. GSC Rating", icon: Sliders },
                  { id: 3, label: "3. KLOC & COCOMO", icon: Gauge },
                  { id: 4, label: "4. Compliance Audit", icon: CheckCircle2 }
                ].map((sub) => {
                  const Icon = sub.icon;
                  const isCurrent = simSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSimSubTab(sub.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
                        isCurrent
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {sub.label}
                    </button>
                  );
                })}
              </div>

              {/* Sub-panel 0: Project Picker */}
              {simSubTab === 0 && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Create Project Form */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FolderPlus className="w-5 h-5 text-blue-600" /> Create New Project
                    </h3>
                    <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                        <input
                          type="text"
                          required
                          value={newProjName}
                          onChange={(e) => setNewProjName(e.target.value)}
                          placeholder="e.g. Hospital Management System"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={newProjDesc}
                          onChange={(e) => setNewProjDesc(e.target.value)}
                          placeholder="Brief summary of application scope..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">COCOMO Project Type *</label>
                        <select
                          value={newProjType}
                          onChange={(e) => setNewProjType(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="organic">Organic (Small, familiar team, loose requirements)</option>
                          <option value="semi_detached">Semi-Detached (Medium size, mixed experience)</option>
                          <option value="embedded">Embedded (Complex, strict hardware/safety constraints)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Programming Language *</label>
                        <select
                          value={newProjLang}
                          onChange={(e) => setNewProjLang(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.keys(LOC_PER_FP).map((lang) => (
                            <option key={lang} value={lang}>
                              {lang} ({LOC_PER_FP[lang]} LOC/FP)
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Create & Start Estimation
                      </button>
                    </form>
                  </div>

                  {/* Project List */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" /> Active Estimation Projects
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">{projects.length} project(s) created</span>
                    </div>

                    {projects.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl space-y-3">
                        <FolderPlus className="w-10 h-10 text-slate-400 mx-auto" />
                        <div className="text-slate-600 text-sm font-medium">No estimation projects created yet.</div>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Fill in the form on the left to create your first project and begin Function Point Analysis.
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {projects.map((p) => {
                          const isSelected = p.id === activeProjectId;
                          return (
                            <div
                              key={p.id}
                              onClick={() => selectProject(p.id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-50/80 border-blue-500 text-slate-900 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-blue-700">{p.name}</span>
                                {isSelected && (
                                  <span className="px-2 py-0.5 text-[10px] bg-blue-600 text-white font-bold rounded-full">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                {p.description || "No description provided."}
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                                <span>Type: <strong className="text-slate-800">{p.project_type}</strong></span>
                                <span>Lang: <strong className="text-slate-800">{p.language}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-panel 1: Function Point Counter */}
              {simSubTab === 1 && (
                <div className="space-y-6">
                  {!activeProject ? (
                    <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
                      Please create or select an active project in Sub-panel 0 first.
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Add Component Form */}
                      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-blue-600" /> Add FP Component
                        </h3>
                        <form onSubmit={handleAddComponent} className="space-y-4 text-xs">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Component Name *</label>
                            <input
                              type="text"
                              required
                              value={compName}
                              onChange={(e) => setCompName(e.target.value)}
                              placeholder="e.g. User Login Form"
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Component Type *</label>
                            <select
                              value={compType}
                              onChange={(e) => setCompType(e.target.value as any)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="EI">External Input (EI)</option>
                              <option value="EO">External Output (EO)</option>
                              <option value="EQ">External Inquiry (EQ)</option>
                              <option value="ILF">Internal Logical File (ILF)</option>
                              <option value="EIF">External Interface File (EIF)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Complexity *</label>
                            <select
                              value={compComplexity}
                              onChange={(e) => setCompComplexity(e.target.value as any)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="low">Low</option>
                              <option value="average">Average</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Plus className="w-4 h-4" /> Add Component
                          </button>
                        </form>
                      </div>

                      {/* Component Table & Live UFP */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Component Breakdown</h3>
                            <p className="text-xs text-slate-500">{components.length} component(s) logged</p>
                          </div>
                          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-right">
                            <div className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Live UFP</div>
                            <div className="text-xl font-extrabold text-blue-700">{activeMetrics.ufp} FP</div>
                          </div>
                        </div>

                        {components.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl space-y-2">
                            <Calculator className="w-8 h-8 text-slate-400 mx-auto" />
                            <div className="text-slate-600 text-sm font-medium">No components added yet.</div>
                            <p className="text-xs text-slate-500">Add forms, reports, queries, and tables to calculate UFP.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-sm text-left text-slate-700">
                              <thead className="bg-slate-50 text-slate-800 font-semibold uppercase text-xs border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Component Name</th>
                                  <th className="px-4 py-3">Type</th>
                                  <th className="px-4 py-3">Complexity</th>
                                  <th className="px-4 py-3">Weight</th>
                                  <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {components.map((c) => {
                                  const cmplx = (c.complexity || "average").toLowerCase();
                                  const weight = IFPUG_WEIGHTS[c.type]?.[cmplx] || 4;
                                  return (
                                    <tr key={c.id} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                                      <td className="px-4 py-3 font-mono text-blue-600 font-semibold">{c.type}</td>
                                      <td className="px-4 py-3 capitalize">{c.complexity}</td>
                                      <td className="px-4 py-3 font-bold text-emerald-600">{weight} FP</td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          onClick={() => handleDeleteComponent(c.id)}
                                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                          title="Delete Component"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-panel 2: GSC Ratings */}
              {simSubTab === 2 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-blue-600" /> General System Characteristics (14 GSCs)
                      </h3>
                      <p className="text-xs text-slate-500">Rate each factor from 0 (No Influence) to 5 (Essential Influence)</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
                        <div className="text-[10px] text-slate-500 font-semibold">TDI (SUM)</div>
                        <div className="text-lg font-bold text-slate-800">{activeMetrics.tdi} / 70</div>
                      </div>
                      <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-right">
                        <div className="text-[10px] text-blue-600 font-bold">LIVE VAF</div>
                        <div className="text-lg font-extrabold text-blue-700">{activeMetrics.vaf}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {GSC_LIST.map((gsc, idx) => {
                      const currentRating = gscRatings.find((r) => r.characteristic_name.toLowerCase() === gsc.name.toLowerCase())?.rating ?? 0;
                      return (
                        <div key={gsc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-800">
                              {idx + 1}. {gsc.name}
                            </span>
                            <span className="font-bold text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              Rating: {currentRating}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">{gsc.desc}</p>
                          <div className="flex items-center gap-2 pt-1">
                            {[0, 1, 2, 3, 4, 5].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleUpdateGscRating(gsc.name, val)}
                                className={`flex-1 py-1 text-xs rounded font-semibold transition-all ${
                                  currentRating === val
                                    ? "bg-blue-600 text-white font-bold shadow-sm"
                                    : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-panel 3: Dashboard & Snapshots */}
              {simSubTab === 3 && (
                <div className="space-y-6">
                  {!activeProject ? (
                    <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
                      Select a project in Sub-panel 0 first.
                    </div>
                  ) : (
                    <>
                      {/* Live Metric Cards Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                          <div className="text-xs text-slate-500 font-semibold">Unadjusted FP (UFP)</div>
                          <div className="text-2xl font-extrabold text-slate-900">{activeMetrics.ufp} FP</div>
                          <div className="text-[11px] text-slate-400">From component counts</div>
                        </div>

                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                          <div className="text-xs text-slate-500 font-semibold">Value Adjustment (VAF)</div>
                          <div className="text-2xl font-extrabold text-blue-600">{activeMetrics.vaf}</div>
                          <div className="text-[11px] text-slate-400">0.65 + (0.01 × {activeMetrics.tdi})</div>
                        </div>

                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                          <div className="text-xs text-slate-500 font-semibold">Adjusted FP (AFP)</div>
                          <div className="text-2xl font-extrabold text-emerald-600">{activeMetrics.afp} FP</div>
                          <div className="text-[11px] text-slate-400">UFP × VAF</div>
                        </div>

                        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
                          <div className="text-xs text-slate-500 font-semibold">Estimated Size (KLOC)</div>
                          <div className="text-2xl font-extrabold text-amber-600">{activeMetrics.kloc} KLOC</div>
                          <div className="text-[11px] text-slate-400">{activeProject.language} ({activeMetrics.loc_per_fp} LOC/FP)</div>
                        </div>
                      </div>

                      {/* COCOMO Outputs Card */}
                      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-blue-600" /> COCOMO Basic Estimates ({activeProject.project_type})
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full">
                            Category: {activeMetrics.size_category}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                            <div className="text-xs text-slate-500 font-medium">Development Effort</div>
                            <div className="text-2xl font-black text-blue-700">{activeMetrics.cocomo.effort_pm}</div>
                            <div className="text-xs text-slate-400">Person-Months (PM)</div>
                          </div>

                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                            <div className="text-xs text-slate-500 font-medium">Development Schedule</div>
                            <div className="text-2xl font-black text-emerald-700">{activeMetrics.cocomo.time_months}</div>
                            <div className="text-xs text-slate-400">Calendar Months</div>
                          </div>

                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                            <div className="text-xs text-slate-500 font-medium">Average Team Size</div>
                            <div className="text-2xl font-black text-amber-700">{activeMetrics.cocomo.avg_team_size}</div>
                            <div className="text-xs text-slate-400">Full-Time Engineers</div>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{activeMetrics.consistency_note}</span>
                        </div>
                      </div>

                      {/* Snapshot Action & Comparison Table */}
                      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">Baseline Snapshots & Comparison</h3>
                            <p className="text-xs text-slate-500">Save snapshots to track estimation variations over time</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveSnapshot}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                              <Save className="w-4 h-4" /> Save Snapshot
                            </button>
                            <button
                              onClick={handleResetProject}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-4 h-4" /> Reset
                            </button>
                          </div>
                        </div>

                        {snapshots.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            No snapshots saved yet. Click "Save Snapshot" to record current estimates.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-xs text-left text-slate-700">
                              <thead className="bg-slate-50 text-slate-800 font-semibold uppercase border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Label</th>
                                  <th className="px-4 py-3">UFP</th>
                                  <th className="px-4 py-3">VAF</th>
                                  <th className="px-4 py-3">AFP</th>
                                  <th className="px-4 py-3">KLOC</th>
                                  <th className="px-4 py-3">Effort (PM)</th>
                                  <th className="px-4 py-3">Time (Months)</th>
                                  <th className="px-4 py-3">Team Size</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {snapshots.map((s) => (
                                  <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-900">{s.label}</td>
                                    <td className="px-4 py-3">{s.ufp}</td>
                                    <td className="px-4 py-3">{s.vaf}</td>
                                    <td className="px-4 py-3">{s.afp}</td>
                                    <td className="px-4 py-3">{s.kloc}</td>
                                    <td className="px-4 py-3">{s.effort_pm}</td>
                                    <td className="px-4 py-3">{s.time_months}</td>
                                    <td className="px-4 py-3">{s.avg_team_size}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Sub-panel 4: Compliance Checker */}
              {simSubTab === 4 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" /> Estimation Quality & Compliance Audit
                      </h3>
                      <p className="text-xs text-slate-500">Automated 5-rule completeness checklist</p>
                    </div>
                    <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-right">
                      <div className="text-[10px] text-blue-600 font-bold">QUALITY SCORE</div>
                      <div className="text-xl font-extrabold text-blue-700">{activeCompliance.quality_score} %</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { rule: "Component Coverage", data: activeCompliance.component_coverage },
                      { rule: "Complexity Assigned", data: activeCompliance.complexity_assigned },
                      { rule: "GSC Completeness (14 GSCs)", data: activeCompliance.gsc_completeness },
                      { rule: "Project Type Selected", data: activeCompliance.project_type_missing },
                      { rule: "Language Selected", data: activeCompliance.language_missing }
                    ].map((r, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          r.data.passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {r.data.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-xs text-slate-900">{r.rule}</div>
                            <div className="text-[11px] text-slate-600">{r.data.detail}</div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${r.data.passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          {r.data.passed ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Specific Recommendations */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-xs text-slate-900">Actionable Recommendations</h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                      {getRecommendations().map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. EXERCISE TAB */}
          {activeTab === "exercise" && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-blue-600" /> Knowledge Check & Self Assessment
                  </h2>
                  <p className="text-xs text-slate-500">10 static multiple-choice questions on size estimation</p>
                </div>

                {quizSubmitted && quizScore !== null && (
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider">TOTAL SCORE</div>
                    <div className="text-xl font-black">{quizScore} / {QUIZ_BANK.length} ({Math.round((quizScore / QUIZ_BANK.length) * 100)}%)</div>
                  </div>
                )}
              </div>

              <form onSubmit={handleQuizSubmit} className="space-y-6">
                {QUIZ_BANK.map((q, idx) => {
                  const userAns = quizAnswers[q.id];
                  const isCorrect = userAns && userAns.trim().toLowerCase() === q.answer.trim().toLowerCase();

                  return (
                    <div key={q.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="font-semibold text-sm text-slate-900">
                          {idx + 1}. {q.question}
                        </div>
                        {quizSubmitted && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                            {isCorrect ? "CORRECT" : "INCORRECT"}
                          </span>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, i) => (
                          <label
                            key={i}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                              userAns === opt
                                ? "bg-blue-50 border-blue-500 text-slate-900 font-medium"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              disabled={quizSubmitted}
                              checked={userAns === opt}
                              onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                              className="text-blue-600 focus:ring-0"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>

                      {quizSubmitted && (
                        <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                          <div><strong>Correct Answer:</strong> <span className="text-emerald-700 font-bold">{q.answer}</span></div>
                          <div><strong>Explanation:</strong> {q.explanation}</div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!quizSubmitted ? (
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
                  >
                    Submit Quiz Answers
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs text-emerald-800 font-bold">
                    Quiz submitted! Your answers are locked. You can view your score and explanations above.
                  </div>
                )}
              </form>
            </div>
          )}

          {/* 7. CONCLUSION TAB */}
          {activeTab === "conclusion" && (
            <div className="space-y-6">
              <LabCard title="Generate Lab Report" icon={Award}>
                <ReportDownloadBar
                  disabled={!activeProject || !quizSubmitted}
                  exporting={false}
                  onDownload={() => {
                    if (!activeProject) return;
                    const metrics = calcMetrics(activeProject, components, gscRatings);
                    const compliance = calcCompliance(activeProject, components, gscRatings);
                    const recs = Object.entries({
                      component_coverage: compliance.component_coverage,
                      complexity_assigned: compliance.complexity_assigned,
                      gsc_completeness: compliance.gsc_completeness,
                      project_type_missing: compliance.project_type_missing,
                      language_missing: compliance.language_missing,
                    })
                      .filter(([, rule]) => !rule.passed)
                      .map(([key]) => IMPROVEMENT_MAP[key] ?? key);
                    void downloadExp3Pdf({
                      names: studentInfo.name,
                      regs: studentInfo.registration_number,
                      project: activeProject,
                      metrics,
                      compliance,
                      recommendations: recs.length
                        ? recs
                        : ["Estimation checklist is complete. Review snapshots and quiz feedback in the lab."],
                      quizScore,
                      quizTotal: QUIZ_BANK.length,
                    });
                  }}
                  hint={
                    !activeProject
                      ? "Create a project in Simulation first."
                      : !quizSubmitted
                        ? "Complete the Assessment Quiz in Exercise before downloading the PDF."
                        : `Project: ${activeProject.name} · ${activeProject.language}`
                  }
                />
                <ReportStudentFields
                  form={{
                    names: studentInfo.name,
                    regs: studentInfo.registration_number,
                    title: "Software Size Estimation",
                    origin: "own",
                    github: "",
                    description: "Function Point Analysis and COCOMO Basic modelled in 21CSC403T Virtual Lab Exercise 3.",
                  }}
                  onChange={(key, value) => {
                    if (key === "names") setStudentInfo((prev) => ({ ...prev, name: value }));
                    if (key === "regs") setStudentInfo((prev) => ({ ...prev, registration_number: value }));
                  }}
                  originOptions={[
                    { value: "own", label: "Own project" },
                    { value: "sample", label: "Lab sample" },
                    { value: "github", label: "GitHub project" },
                  ]}
                  footnote="Function Point Analysis & COCOMO (Exercise 3)."
                />
              </LabCard>

              {/* Live Report Preview (Sections A, B, C, D) */}
              <div className="p-6 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-6">
                <div className="text-center border-b border-slate-800 pb-4 space-y-1">
                  <div className="text-base font-bold text-white">================= VIRTUAL LAB REPORT =================</div>
                  <div className="text-cyan-400 font-semibold">21CSC403T — Software Metrics & Measurement</div>
                  <div>Experiment 3: Software Size Estimation (FPA & COCOMO)</div>
                  <div className="text-slate-400">
                    Student: <strong>{studentInfo.name || "N/A"}</strong> | Reg No: <strong>{studentInfo.registration_number || "N/A"}</strong>
                  </div>
                  {activeProject && (
                    <div className="text-slate-400">
                      Project: <strong>{activeProject.name}</strong> ({activeProject.project_type}, {activeProject.language})
                    </div>
                  )}
                </div>

                {/* Section A */}
                <div className="space-y-2">
                  <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1">SECTION A — Knowledge Assessment (MCQ)</div>
                  <div>
                    Score: <strong>{quizScore !== null ? `${quizScore} / ${QUIZ_BANK.length}` : "Not submitted yet"}</strong>
                  </div>
                </div>

                {/* Section B */}
                <div className="space-y-2">
                  <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1">SECTION B — Estimation Correctness Audit</div>
                  <div>[{activeCompliance.component_coverage.passed ? "✅" : "❌"}] Component Coverage — {activeCompliance.component_coverage.detail}</div>
                  <div>[{activeCompliance.complexity_assigned.passed ? "✅" : "❌"}] Complexity Assigned — {activeCompliance.complexity_assigned.detail}</div>
                  <div>[{activeCompliance.gsc_completeness.passed ? "✅" : "❌"}] GSC Completeness — {activeCompliance.gsc_completeness.detail}</div>
                  <div>[{activeCompliance.project_type_missing.passed ? "✅" : "❌"}] Project Type Selected — {activeCompliance.project_type_missing.detail}</div>
                  <div>[{activeCompliance.language_missing.passed ? "✅" : "❌"}] Language Selected — {activeCompliance.language_missing.detail}</div>
                  <div className="font-bold text-white">Overall Quality Score: {activeCompliance.quality_score} / 100</div>
                </div>

                {/* Section C */}
                <div className="space-y-2">
                  <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1">SECTION C — Computed Estimates</div>
                  <div>Unadjusted Function Points (UFP): {activeMetrics.ufp} FP</div>
                  <div>Value Adjustment Factor (VAF): {activeMetrics.vaf} (TDI = {activeMetrics.tdi})</div>
                  <div>Adjusted Function Points (AFP): {activeMetrics.afp} FP</div>
                  <div>Estimated Size (KLOC): {activeMetrics.kloc} KLOC ({activeMetrics.loc_per_fp} LOC/FP)</div>
                  <div>COCOMO Effort: {activeMetrics.cocomo.effort_pm} Person-Months</div>
                  <div>COCOMO Schedule: {activeMetrics.cocomo.time_months} Calendar Months</div>
                  <div>COCOMO Avg Team Size: {activeMetrics.cocomo.avg_team_size} Engineers</div>
                  <div>Size Category: {activeMetrics.size_category}</div>
                </div>

                {/* Section D */}
                <div className="space-y-2">
                  <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1">SECTION D — Areas for Improvement</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {getRecommendations().map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-center text-slate-500 border-t border-slate-800 pt-4">
                  =======================================================
                </div>
              </div>
            </div>
          )}
        </div>
    </LabPageShell>
  );
}
