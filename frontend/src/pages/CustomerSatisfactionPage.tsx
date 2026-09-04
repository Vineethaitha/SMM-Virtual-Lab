import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Target, Lightbulb, BookOpen, ClipboardList, ListChecks,
  Play, BarChart3, FlaskConical, GitCompare, FileText,
  Smile, Plus, Trash2, Edit2, Check, X, RotateCcw,
  ArrowRight, AlertCircle, RefreshCw, Download, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";
import {
  EXP4_TABS, EXP4_APPS, EXP4_FACTORS, EXP4_FACTOR_LABELS,
  EXP4_QUIZ,
  exp4_generateSampleResponses, exp4_factorAverage, exp4_overallAverage,
  exp4_highestFactor, exp4_lowestFactor, exp4_interpretScore,
  exp4_ratingDistribution, exp4_satisfactionGroups, exp4_analyzeThemes,
  type Exp4Response, type Exp4Tab,
} from "@/data/exp4Data";

// ─── Colour palette ───────────────────────────────────────────
const EXP4_COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const EXP4_PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981"];

// ─── Helpers ──────────────────────────────────────────────────
function exp4_round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── Shared Card Shell ────────────────────────────────────────
function Exp4Card({ title, icon: Icon, children, className = "" }: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden", className)}>
      {title && (
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          <h3 className="text-sm font-semibold text-blue-700">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Exp4InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <div>{children}</div>
    </div>
  );
}

function Exp4KpiCard({ label, value, sub, color = "blue" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "from-blue-600 to-blue-500",
    green: "from-emerald-600 to-emerald-500",
    amber: "from-amber-500 to-amber-400",
    red: "from-rose-600 to-rose-500",
    indigo: "from-indigo-600 to-indigo-500",
  };
  return (
    <div className={cn("rounded-xl bg-gradient-to-br text-white p-4 shadow-md", colors[color] ?? colors.blue)}>
      <p className="text-xs font-medium text-white/80 mb-1">{label}</p>
      <p className="text-2xl font-bold leading-none">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/70">{sub}</p>}
    </div>
  );
}

// ─── Aim Tab ──────────────────────────────────────────────────
function Exp4AimTab() {
  return (
    <Exp4Card title="Aim" icon={Target}>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">
        <p>
          To understand customer satisfaction as a software quality metric by designing a short survey,
          collecting responses, calculating satisfaction metrics, and identifying strengths and areas
          requiring improvement.
        </p>
        <p>
          Analyze customer feedback using Likert-scale ratings and qualitative comments, then summarize
          the results using meaningful satisfaction indicators.
        </p>
      </div>
    </Exp4Card>
  );
}

// ─── Objective Tab ────────────────────────────────────────────
function Exp4ObjectiveTab() {
  const objectives = [
    "Understand how customer satisfaction surveys function as a software quality metric.",
    "Design a short questionnaire using mainly 1–5 Likert-scale questions.",
    "Collect and analyze customer responses.",
    "Calculate the overall average satisfaction score.",
    "Identify the highest-rated factor.",
    "Identify the lowest-rated factor requiring improvement.",
    "Identify common themes from open-ended user feedback.",
    "Present the findings in a concise analytical report.",
  ];
  return (
    <div className="space-y-4">
      <Exp4Card title="Objective" icon={Lightbulb}>
        <ol className="space-y-2 text-sm text-slate-600">
          {objectives.map((obj, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {i + 1}
              </span>
              <span>{obj}</span>
            </li>
          ))}
        </ol>
      </Exp4Card>
      <Exp4Card title="Learning Outcome" icon={TrendingUp}>
        <p className="text-sm text-slate-600 leading-relaxed">
          After completing this experiment, students should be able to convert survey responses into
          measurable satisfaction metrics and use the results to identify application strengths and areas
          requiring improvement.
        </p>
      </Exp4Card>
    </div>
  );
}

// ─── Theory Tab ───────────────────────────────────────────────
function Exp4TheoryTab() {
  const likertRows = [
    { value: 1, label: "Very Dissatisfied" },
    { value: 2, label: "Dissatisfied" },
    { value: 3, label: "Neutral" },
    { value: 4, label: "Satisfied" },
    { value: 5, label: "Very Satisfied" },
  ];
  const interpretRows = [
    { range: "1.00 – 1.80", label: "Very Low Satisfaction", color: "bg-red-100 text-red-700" },
    { range: "1.81 – 2.60", label: "Low Satisfaction", color: "bg-orange-100 text-orange-700" },
    { range: "2.61 – 3.40", label: "Moderate Satisfaction", color: "bg-yellow-100 text-yellow-700" },
    { range: "3.41 – 4.20", label: "High Satisfaction", color: "bg-green-100 text-green-700" },
    { range: "4.21 – 5.00", label: "Very High Satisfaction", color: "bg-emerald-100 text-emerald-700" },
  ];
  return (
    <div className="space-y-4">
      <Exp4Card title="Theory" icon={BookOpen}>
        <p className="text-sm text-slate-600 leading-relaxed">
          Customer satisfaction is a measure of how users perceive their experience with a software
          application. A satisfaction survey can be used to collect structured numerical ratings as well
          as qualitative feedback.
        </p>
      </Exp4Card>

      <Exp4Card title="Likert Scale">
        <p className="mb-3 text-sm text-slate-500">Likert ratings convert user opinions into numerical values that can be summarized and compared across factors.</p>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Rating</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {likertRows.map((r) => (
                <tr key={r.value} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-blue-700">{r.value}</td>
                  <td className="px-4 py-2 text-slate-600">{r.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Exp4Card>

      <Exp4Card title="Average Satisfaction Formula">
        <div className="flex items-center justify-center rounded-lg bg-blue-50 p-4 text-center">
          <p className="font-mono text-base font-semibold text-blue-800">
            Average Satisfaction = Sum of Ratings / Number of Ratings
          </p>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          This formula can be applied to all ratings combined, or separately for each factor to produce
          factor-level averages.
        </p>
      </Exp4Card>

      <Exp4Card title="Factor Analysis">
        <p className="text-sm text-slate-600 leading-relaxed">
          The factor with the highest average represents the strongest-rated aspect of the application,
          while the factor with the lowest average identifies an area requiring improvement. The gap
          between highest and lowest gives a measure of consistency across factors.
        </p>
      </Exp4Card>

      <Exp4Card title="Qualitative Feedback">
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          Open-ended questions provide qualitative suggestions that can be grouped into recurring themes
          when those themes actually occur in the collected comments. Example theme categories include:
        </p>
        <div className="flex flex-wrap gap-2">
          {["Performance", "Usability", "Reliability", "Features", "Interface", "Notifications", "Security", "Support"].map((t) => (
            <span key={t} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{t}</span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500 italic">Note: Only themes found in the actual collected comments are counted and reported.</p>
      </Exp4Card>

      <Exp4Card title="Laboratory Interpretation Scale">
        <p className="mb-3 text-xs text-slate-500 italic">This scale is used throughout the experiment to interpret average satisfaction scores.</p>
        <div className="space-y-2">
          {interpretRows.map((r) => (
            <div key={r.range} className={cn("flex items-center justify-between rounded-lg px-4 py-2 text-sm", r.color)}>
              <span className="font-mono font-medium">{r.range}</span>
              <span className="font-semibold">{r.label}</span>
            </div>
          ))}
        </div>
      </Exp4Card>
    </div>
  );
}

// ─── Procedure Tab ────────────────────────────────────────────
function Exp4ProcedureTab() {
  const steps = [
    "Select a software application.",
    "Create a short questionnaire containing approximately 5–6 questions.",
    "Use mainly 1–5 Likert-scale questions.",
    "Include at least one open-ended question.",
    "Distribute the survey and collect responses.",
    "Enter or simulate responses in the Simulation tab.",
    "Calculate the average satisfaction score (see Results tab).",
    "Identify the highest-rated factor.",
    "Identify the lowest-rated factor.",
    "Analyze open-ended comments in the Analysis tab.",
    "Review Results and Analysis tabs for insights.",
    "Generate the lab report from the Conclusion tab.",
  ];
  return (
    <div className="space-y-4">
      <Exp4Card title="Procedure" icon={ClipboardList}>
        <ol className="space-y-3 text-sm text-slate-600">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </Exp4Card>
      <Exp4InfoBox>
        <p className="font-semibold mb-1">Classroom Requirement</p>
        <p>The classroom exercise requires a minimum of 20 responses and specifies a 10-minute response collection period.</p>
      </Exp4InfoBox>
    </div>
  );
}

// ─── Exercise Tab ─────────────────────────────────────────────
interface Exp4ExerciseTabProps {
  responses: Exp4Response[];
  selectedApp: string;
  submittedApps: Set<string>;
  onAddResponse: (r: Exp4Response) => void;
  onMarkAppSubmitted: (app: string) => void;
}

function Exp4ExerciseTab({ responses, selectedApp, submittedApps, onAddResponse, onMarkAppSubmitted }: Exp4ExerciseTabProps) {
  const [app, setApp] = useState(selectedApp);
  const [q1, setQ1] = useState<number>(0);
  const [q2, setQ2] = useState<number>(0);
  const [q3, setQ3] = useState<number>(0);
  const [q4, setQ4] = useState<number>(0);
  const [q5, setQ5] = useState<number>(0);
  const [q6, setQ6] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const alreadySubmitted = submittedApps.has(app);

  const totalCount = responses.length;

  function Exp4LikertSelector({ value, onChange, label, qId }: {
    value: number; onChange: (v: number) => void; label: string; qId: string;
  }) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              id={`${qId}-option-${v}`}
              type="button"
              onClick={() => onChange(v)}
              className={cn(
                "flex h-9 w-16 items-center justify-center rounded-lg border text-sm font-medium transition-all",
                value === v
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50"
              )}
            >
              {v}
            </button>
          ))}
          <span className="self-center text-xs text-slate-400">
            {value ? ["", "Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"][value] : "Select"}
          </span>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (alreadySubmitted) return;
    const errs: string[] = [];
    if (!q1) errs.push("Q1: Overall Satisfaction is required.");
    if (!q2) errs.push("Q2: Ease of Use is required.");
    if (!q3) errs.push("Q3: Performance is required.");
    if (!q4) errs.push("Q4: Reliability is required.");
    if (!q5) errs.push("Q5: Features is required.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    onAddResponse({
      id: Date.now(),
      overall: q1,
      easeOfUse: q2,
      performance: q3,
      reliability: q4,
      features: q5,
      comment: q6,
    });
    onMarkAppSubmitted(app);
    setQ1(0); setQ2(0); setQ3(0); setQ4(0); setQ5(0); setQ6("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="space-y-4">
      <Exp4Card title="Survey Design Exercise" icon={ListChecks}>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="exp4-exercise-app">
            Application
          </label>
          <select
            id="exp4-exercise-app"
            className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={app}
            onChange={e => setApp(e.target.value)}
          >
            {EXP4_APPS.map(a => (
              <option key={a} value={a}>
                {a}{submittedApps.has(a) ? " ✓" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <div className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            totalCount >= 20 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          )}>
            Responses Collected: {totalCount} / 20
          </div>
          {totalCount >= 20 && (
            <span className="text-xs font-medium text-emerald-600">✓ Minimum classroom response target reached.</span>
          )}
        </div>

        {alreadySubmitted ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="font-semibold text-emerald-700">Response already submitted for <span className="italic">{app}</span>.</p>
            <p className="text-sm text-emerald-600">Each application allows only one response per session. Please select a different application to submit another response.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Exp4LikertSelector label="Q1. How satisfied are you with the overall experience of the application?" value={q1} onChange={setQ1} qId="exp4-q1" />
            <Exp4LikertSelector label="Q2. How satisfied are you with the application's ease of use?" value={q2} onChange={setQ2} qId="exp4-q2" />
            <Exp4LikertSelector label="Q3. How satisfied are you with the application's performance?" value={q3} onChange={setQ3} qId="exp4-q3" />
            <Exp4LikertSelector label="Q4. How satisfied are you with the application's reliability?" value={q4} onChange={setQ4} qId="exp4-q4" />
            <Exp4LikertSelector label="Q5. How satisfied are you with the application's features?" value={q5} onChange={setQ5} qId="exp4-q5" />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="exp4-q6">
                Q6. What improvement would you most like to see in this application?
              </label>
              <textarea
                id="exp4-q6"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                rows={3}
                placeholder="Describe a suggestion or improvement..."
                value={q6}
                onChange={e => setQ6(e.target.value)}
              />
            </div>

            {errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
                {errors.map(e => <p key={e}>{e}</p>)}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                id="exp4-submit-response"
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Submit Response
              </button>
              {submitted && (
                <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Response added!
                </span>
              )}
            </div>
          </form>
        )}
      </Exp4Card>
    </div>
  );
}

// ─── Simulation Tab ───────────────────────────────────────────
interface Exp4SimulationTabProps {
  responses: Exp4Response[];
  selectedApp: string;
  simApp: string;
  dataset: "sample" | "custom";
  sampleCount: number;
  onSetSimApp: (a: string) => void;
  onSetDataset: (d: "sample" | "custom") => void;
  onSetSampleCount: (n: number) => void;
  onSetApp: (app: string) => void;
  onSetResponses: (rs: Exp4Response[]) => void;
  onNavigate: (tab: Exp4Tab) => void;
}


function Exp4SimulationTab({ responses, onSetApp, onSetResponses, onNavigate }: Exp4SimulationTabProps) {
  const [simApp, setSimApp] = useState(EXP4_APPS[0]);
  const [dataset, setDataset] = useState<"sample" | "custom">("sample");
  const [sampleCount, setSampleCount] = useState<number>(20);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Exp4Response>>({});

  // Custom entry form state
  const [cOverall, setCOverall] = useState<number>(0);
  const [cEase, setCEase] = useState<number>(0);
  const [cPerf, setCPerf] = useState<number>(0);
  const [cRel, setCRel] = useState<number>(0);
  const [cFeat, setCFeat] = useState<number>(0);
  const [cComment, setCComment] = useState("");
  const [cErrors, setCErrors] = useState<string[]>([]);
  const [cAdded, setCAdded] = useState(false);

  const totalCount = responses.length;

  function loadSample() {
    onSetApp(simApp);
    const generated = exp4_generateSampleResponses(simApp, sampleCount);
    onSetResponses(generated);
  }

  function clearAll() {
    onSetResponses([]);
  }

  function analyzeResponses() {
    onSetApp(simApp);
    onNavigate("results");
  }

  function handleCustomAdd(e: React.FormEvent) {
    e.preventDefault();
    const errs: string[] = [];
    if (!cOverall) errs.push("Overall Satisfaction is required.");
    if (!cEase) errs.push("Ease of Use is required.");
    if (!cPerf) errs.push("Performance is required.");
    if (!cRel) errs.push("Reliability is required.");
    if (!cFeat) errs.push("Features is required.");
    if (errs.length) { setCErrors(errs); return; }
    setCErrors([]);
    onSetApp(simApp);
    onSetResponses([...responses, {
      id: Date.now(),
      overall: cOverall, easeOfUse: cEase, performance: cPerf,
      reliability: cRel, features: cFeat, comment: cComment,
    }]);
    setCOverall(0); setCEase(0); setCPerf(0); setCRel(0); setCFeat(0); setCComment("");
    setCAdded(true);
    setTimeout(() => setCAdded(false), 2500);
  }

  function startEdit(r: Exp4Response) {
    setEditingId(r.id);
    setEditData({ ...r });
  }

  function saveEdit() {
    if (!editingId) return;
    onSetResponses(responses.map(r => r.id === editingId ? { ...r, ...editData } as Exp4Response : r));
    setEditingId(null);
    setEditData({});
  }

  function deleteResponse(id: number) {
    onSetResponses(responses.filter(r => r.id !== id));
  }

  function addEmptyResponse() {
    const newR: Exp4Response = {
      id: Date.now(),
      overall: 3, easeOfUse: 3, performance: 3, reliability: 3, features: 3,
      comment: "",
    };
    onSetResponses([...responses, newR]);
    startEdit(newR.id as unknown as Exp4Response);
    setEditingId(newR.id);
    setEditData({ ...newR });
  }

  function CustomLikert({ label, value, onChange, qId }: { label: string; value: number; onChange: (v: number) => void; qId: string }) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v} id={`${qId}-${v}`} type="button"
              onClick={() => onChange(v)}
              className={cn(
                "flex h-8 w-12 items-center justify-center rounded-lg border text-xs font-semibold transition-all",
                value === v ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:border-indigo-400 hover:bg-indigo-50"
              )}
            >{v}</button>
          ))}
          <span className="self-center text-[11px] text-slate-400">
            {value ? ["", "Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"][value] : "—"}
          </span>
        </div>
      </div>
    );
  }

  const colLabels: { field: keyof Exp4Response; label: string }[] = [
    { field: "overall", label: "Overall" },
    { field: "easeOfUse", label: "Ease of Use" },
    { field: "performance", label: "Performance" },
    { field: "reliability", label: "Reliability" },
    { field: "features", label: "Features" },
  ];

  return (
    <div className="space-y-4">
      <Exp4Card title="Interactive Survey Simulation" icon={Play}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="exp4-sim-app">Application</label>
            <select
              id="exp4-sim-app"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={simApp}
              onChange={e => onSetSimApp(e.target.value)}
            >
              {EXP4_APPS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="exp4-sim-dataset">Dataset</label>
            <select
              id="exp4-sim-dataset"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dataset}
              onChange={e => onSetDataset(e.target.value as "sample" | "custom")}
            >
              <option value="sample">Sample Dataset</option>
              <option value="custom">Custom Dataset</option>
            </select>
          </div>
          {dataset === "sample" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="exp4-sim-count">Sample Responses</label>
              <select
                id="exp4-sim-count"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sampleCount}
                onChange={e => onSetSampleCount(Number(e.target.value))}
              >
                {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {dataset === "sample" && (
            <button
              id="exp4-load-sample"
              type="button"
              onClick={loadSample}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Load Sample Responses
            </button>
          )}
          <button
            id="exp4-clear-responses"
            type="button"
            onClick={clearAll}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Responses
          </button>
          <button
            id="exp4-analyze-responses"
            type="button"
            onClick={analyzeResponses}
            disabled={responses.length === 0}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analyze Responses
          </button>
          {dataset === "sample" && (
            <button
              id="exp4-add-response"
              type="button"
              onClick={addEmptyResponse}
              className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Response
            </button>
          )}
        </div>

        <div className={cn(
          "mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium",
          totalCount >= 20 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
        )}>
          Responses Collected: {totalCount} / 20
          {totalCount >= 20 && <span className="font-semibold">— Minimum classroom response target reached.</span>}
        </div>

        {/* Custom dataset manual entry form */}
        {dataset === "custom" && (
          <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/60 p-5">
            <p className="mb-4 text-sm font-semibold text-indigo-700 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Custom Response
            </p>
            <form onSubmit={handleCustomAdd} className="space-y-4" noValidate>
              <CustomLikert label="Overall Satisfaction" value={cOverall} onChange={setCOverall} qId="csim-overall" />
              <CustomLikert label="Ease of Use" value={cEase} onChange={setCEase} qId="csim-ease" />
              <CustomLikert label="Performance" value={cPerf} onChange={setCPerf} qId="csim-perf" />
              <CustomLikert label="Reliability" value={cRel} onChange={setCRel} qId="csim-rel" />
              <CustomLikert label="Features" value={cFeat} onChange={setCFeat} qId="csim-feat" />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="csim-comment">Comment (optional)</label>
                <textarea
                  id="csim-comment"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="Describe a suggestion or improvement..."
                  value={cComment}
                  onChange={e => setCComment(e.target.value)}
                />
              </div>
              {cErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
                  {cErrors.map(e => <p key={e}>{e}</p>)}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  id="csim-add-response"
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add to Dataset
                </button>
                {cAdded && (
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <Check className="h-4 w-4" /> Response added!
                  </span>
                )}
              </div>
            </form>
          </div>
        )}
      </Exp4Card>

      {responses.length > 0 && (
        <Exp4Card title={`Response Table (${responses.length} records)`} icon={ListChecks}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  {colLabels.map(c => (
                    <th key={c.field} className="px-3 py-2 text-center">{c.label}</th>
                  ))}
                  <th className="px-3 py-2 text-left">Comment</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r, idx) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    {editingId === r.id ? (
                      <>
                        <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                        {colLabels.map(c => (
                          <td key={c.field} className="px-3 py-2 text-center">
                            <select
                              className="w-14 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                              value={(editData[c.field] as number) ?? 3}
                              onChange={e => setEditData({ ...editData, [c.field]: Number(e.target.value) })}
                            >
                              {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <input
                            className="w-full rounded border border-slate-300 px-2 py-0.5 text-xs"
                            value={(editData.comment as string) ?? ""}
                            onChange={e => setEditData({ ...editData, comment: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center gap-1">
                            <button type="button" onClick={saveEdit} className="rounded bg-emerald-100 p-1 text-emerald-700 hover:bg-emerald-200">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-medium text-slate-500">{idx + 1}</td>
                        {colLabels.map(c => (
                          <td key={c.field} className="px-3 py-2 text-center">
                            <span className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                              Number(r[c.field]) >= 4 ? "bg-emerald-100 text-emerald-700"
                                : Number(r[c.field]) === 3 ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            )}>
                              {r[c.field]}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-2 max-w-xs">
                          <span className="line-clamp-1 text-xs text-slate-500">{r.comment || "—"}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center gap-1">
                            <button type="button" onClick={() => startEdit(r)} className="rounded bg-blue-50 p-1 text-blue-600 hover:bg-blue-100">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => deleteResponse(r.id)} className="rounded bg-red-50 p-1 text-red-500 hover:bg-red-100">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Exp4Card>
      )}
    </div>
  );
}

// ─── Results Tab ──────────────────────────────────────────────
function Exp4ResultsTab({ responses, selectedApp: _selectedApp }: { responses: Exp4Response[]; selectedApp: string }) {
  if (!responses.length) {
    return (
      <Exp4Card title="Results" icon={BarChart3}>
        <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-400">
          <BarChart3 className="h-10 w-10 opacity-40" />
          <p className="font-medium">No responses yet</p>
          <p className="text-sm">Load sample responses in the Simulation tab to see results.</p>
        </div>
      </Exp4Card>
    );
  }

  const overallAvg = exp4_round2(exp4_overallAverage(responses));
  const highest = exp4_highestFactor(responses);
  const lowest = exp4_lowestFactor(responses);
  const interpretation = exp4_interpretScore(overallAvg);

  const factorBarData = EXP4_FACTORS.map(f => ({
    name: EXP4_FACTOR_LABELS[f],
    avg: exp4_round2(exp4_factorAverage(responses, f)),
  }));

  const ratingDist = exp4_ratingDistribution(responses);
  const ratingBarData = [1, 2, 3, 4, 5].map(v => ({
    rating: `${v} ★`,
    count: ratingDist[v] ?? 0,
  }));

  const groups = exp4_satisfactionGroups(responses);
  const pieTotalRatings = groups.dissatisfied + groups.neutral + groups.satisfied;
  const pieData = [
    { name: "Dissatisfied (1–2)", value: groups.dissatisfied },
    { name: "Neutral (3)", value: groups.neutral },
    { name: "Satisfied (4–5)", value: groups.satisfied },
  ];

  const factorTableData = EXP4_FACTORS.map(f => {
    const avg = exp4_round2(exp4_factorAverage(responses, f));
    return {
      factor: EXP4_FACTOR_LABELS[f],
      avg,
      interpretation: exp4_interpretScore(avg),
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Exp4KpiCard label="Total Responses" value={responses.length} color="blue" />
        <Exp4KpiCard label="Average Satisfaction" value={overallAvg} sub={interpretation} color="indigo" />
        <Exp4KpiCard
          label="Highest-Rated Factor"
          value={highest ? EXP4_FACTOR_LABELS[highest.factor] : "—"}
          sub={highest ? `Avg: ${exp4_round2(highest.avg)}` : ""}
          color="green"
        />
        <Exp4KpiCard
          label="Lowest-Rated Factor"
          value={lowest ? EXP4_FACTOR_LABELS[lowest.factor] : "—"}
          sub={lowest ? `Avg: ${exp4_round2(lowest.avg)}` : ""}
          color="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Exp4Card title="Average Rating by Factor" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={factorBarData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={80} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v.toFixed(2), "Avg Rating"]} />
              <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {factorBarData.map((_, i) => (
                  <Cell key={i} fill={EXP4_COLORS[i % EXP4_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Exp4Card>

        <Exp4Card title="Rating Distribution" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ratingBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Count">
                {ratingBarData.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? "#ef4444" : i === 2 ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Exp4Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Exp4Card title="Satisfaction Distribution" icon={PieChart as React.ComponentType<{ className?: string }>}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={EXP4_PIE_COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip formatter={(v) => [`${v} ratings`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-center text-xs text-slate-400">Based on {pieTotalRatings} individual factor ratings</p>
        </Exp4Card>

        <Exp4Card title="Factor Summary Table" icon={ListChecks}>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Factor</th>
                  <th className="px-3 py-2 text-center">Avg Rating</th>
                  <th className="px-3 py-2 text-left">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {factorTableData.map((row) => (
                  <tr key={row.factor} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-700">{row.factor}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn(
                        "font-bold",
                        row.avg >= 4 ? "text-emerald-600" : row.avg >= 3 ? "text-amber-600" : "text-red-600"
                      )}>
                        {row.avg.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{row.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Exp4Card>
      </div>
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────
function Exp4AnalysisTab({ responses, selectedApp }: { responses: Exp4Response[]; selectedApp: string }) {
  if (!responses.length) {
    return (
      <Exp4Card title="Analysis" icon={FlaskConical}>
        <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-400">
          <FlaskConical className="h-10 w-10 opacity-40" />
          <p className="font-medium">No data to analyze</p>
          <p className="text-sm">Load responses in the Simulation tab first.</p>
        </div>
      </Exp4Card>
    );
  }

  const overallAvg = exp4_round2(exp4_overallAverage(responses));
  const highest = exp4_highestFactor(responses);
  const lowest = exp4_lowestFactor(responses);
  const gap = highest && lowest ? exp4_round2(highest.avg - lowest.avg) : 0;
  const themes = exp4_analyzeThemes(responses);

  return (
    <div className="space-y-4">
      <Exp4Card title="Analysis" icon={FlaskConical}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Overall Satisfaction", value: overallAvg.toFixed(2), sub: exp4_interpretScore(overallAvg), color: "text-blue-700" },
            { label: "Highest-Rated Factor", value: highest ? EXP4_FACTOR_LABELS[highest.factor] : "—", sub: highest ? `Avg: ${exp4_round2(highest.avg).toFixed(2)}` : "", color: "text-emerald-700" },
            { label: "Lowest-Rated Factor", value: lowest ? EXP4_FACTOR_LABELS[lowest.factor] : "—", sub: lowest ? `Avg: ${exp4_round2(lowest.avg).toFixed(2)}` : "", color: "text-amber-700" },
            { label: "Gap (Highest − Lowest)", value: gap.toFixed(2), sub: "scale points", color: "text-indigo-700" },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className={cn("text-lg font-bold", item.color)}>{item.value}</p>
              {item.sub && <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>}
            </div>
          ))}
        </div>
      </Exp4Card>

      <Exp4Card title="Common Feedback Themes" icon={FileText}>
        {themes.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No recognizable themes found in the collected comments.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">Theme</th>
                  <th className="px-4 py-2 text-center">Mentions</th>
                  <th className="px-4 py-2 text-left">Visual</th>
                </tr>
              </thead>
              <tbody>
                {themes.map(t => (
                  <tr key={t.theme} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-700">{t.theme}</td>
                    <td className="px-4 py-2 text-center font-bold text-blue-700">{t.mentions}</td>
                    <td className="px-4 py-2 w-48">
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (t.mentions / responses.length) * 100 * 3)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Exp4Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Exp4Card title="Strengths" icon={TrendingUp}>
          {highest ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="font-semibold text-emerald-700">{EXP4_FACTOR_LABELS[highest.factor]}</p>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {exp4_round2(highest.avg).toFixed(2)} / 5
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {EXP4_FACTOR_LABELS[highest.factor]} is the strongest aspect of {selectedApp}, rated{" "}
                {exp4_interpretScore(highest.avg).toLowerCase()} by respondents. This suggests users are
                particularly pleased with this dimension of the application's performance.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No data available.</p>
          )}
        </Exp4Card>

        <Exp4Card title="Areas for Improvement" icon={TrendingDown}>
          {lowest ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-600" />
                <p className="font-semibold text-amber-700">{EXP4_FACTOR_LABELS[lowest.factor]}</p>
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {exp4_round2(lowest.avg).toFixed(2)} / 5
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {EXP4_FACTOR_LABELS[lowest.factor]} is the lowest-rated aspect of {selectedApp}, rated{" "}
                {exp4_interpretScore(lowest.avg).toLowerCase()}. Development efforts should prioritize
                improving this dimension to raise overall satisfaction.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No data available.</p>
          )}
        </Exp4Card>
      </div>
    </div>
  );
}

// ─── Comparison Tab ───────────────────────────────────────────
function Exp4ComparisonTab({ responses, selectedApp }: { responses: Exp4Response[]; selectedApp: string }) {
  const [appB, setAppB] = useState(EXP4_APPS.find(a => a !== selectedApp) ?? EXP4_APPS[1]);
  const [countB, setCountB] = useState(20);
  const [responsesB, setResponsesB] = useState<Exp4Response[]>([]);
  const [loaded, setLoaded] = useState(false);

  // If the selected app changes from outside, reset
  const hasResponses = responses.length > 0;

  function runComparison() {
    if (!hasResponses) return;
    const rB = exp4_generateSampleResponses(appB, countB);
    setResponsesB(rB);
    setLoaded(true);
  }

  const compRows = EXP4_FACTORS.map(f => {
    const aAvg = exp4_round2(exp4_factorAverage(responses, f));
    const bAvg = exp4_round2(exp4_factorAverage(responsesB, f));
    const winner = aAvg > bAvg ? "A" : bAvg > aAvg ? "B" : "tie";
    return { factor: EXP4_FACTOR_LABELS[f], aAvg, bAvg, winner };
  });

  const chartData = loaded
    ? EXP4_FACTORS.map(f => ({
        name: EXP4_FACTOR_LABELS[f].split(" ")[0],
        [selectedApp]: exp4_round2(exp4_factorAverage(responses, f)),
        [appB]: exp4_round2(exp4_factorAverage(responsesB, f)),
      }))
    : [];

  if (!hasResponses) {
    return (
      <Exp4Card title="Application Comparison" icon={GitCompare}>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <GitCompare className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">No responses collected yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Collect or load survey responses in the <strong>Exercise</strong> or <strong>Simulation</strong> tab first.
              Your real responses for <strong>{selectedApp}</strong> will be used as App A for comparison.
            </p>
          </div>
        </div>
      </Exp4Card>
    );
  }

  return (
    <div className="space-y-4">
      <Exp4Card title="Application Comparison" icon={GitCompare}>
        <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="font-semibold">App A</span> is fixed to your collected responses for{" "}
          <span className="font-semibold">{selectedApp}</span> ({responses.length} responses).
          Choose an <span className="font-semibold">App B</span> to compare against using simulated benchmark data.
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">App A (Your Data)</label>
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {selectedApp} &mdash; {responses.length} responses
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="exp4-cmp-app-b">App B (Benchmark)</label>
            <select id="exp4-cmp-app-b" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={appB} onChange={e => { setAppB(e.target.value); setLoaded(false); }}>
              {EXP4_APPS.filter(a => a !== selectedApp).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="exp4-cmp-count-b">Benchmark Responses</label>
            <select id="exp4-cmp-count-b" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={countB} onChange={e => { setCountB(Number(e.target.value)); setLoaded(false); }}>
              {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button
          id="exp4-run-comparison"
          type="button"
          onClick={runComparison}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <GitCompare className="h-4 w-4" />
          Compare Applications
        </button>
      </Exp4Card>

      {loaded && (
        <>
          <Exp4Card title="Comparison Chart" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={selectedApp} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey={appB} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Exp4Card>

          <Exp4Card title="Metric Comparison Table" icon={ListChecks}>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Metric</th>
                    <th className="px-4 py-2 text-center text-blue-600">{selectedApp} (Your Data)</th>
                    <th className="px-4 py-2 text-center text-amber-600">{appB} (Benchmark)</th>
                    <th className="px-4 py-2 text-left">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {compRows.map(row => (
                    <tr key={row.factor} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-700">{row.factor}</td>
                      <td className={cn("px-4 py-2 text-center font-bold", row.winner === "A" ? "text-blue-700" : "text-slate-500")}>
                        {row.aAvg.toFixed(2)} {row.winner === "A" && "✓"}
                      </td>
                      <td className={cn("px-4 py-2 text-center font-bold", row.winner === "B" ? "text-amber-700" : "text-slate-500")}>
                        {row.bAvg.toFixed(2)} {row.winner === "B" && "✓"}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {row.winner === "tie"
                          ? "Both applications have the same average rating."
                          : `${row.winner === "A" ? appA : appB} scores higher`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Exp4Card>
        </>
      )}
    </div>
  );
}

// ─── Quiz Tab ─────────────────────────────────────────────────
interface Exp4QuizTabProps {
  quizAnswers: (number | null)[];
  quizFinished: boolean;
  onQuizAnswersChange: (a: (number | null)[]) => void;
  onQuizFinish: () => void;
  onQuizReset: () => void;
}

function Exp4QuizTab({ quizAnswers, quizFinished, onQuizAnswersChange, onQuizFinish, onQuizReset }: Exp4QuizTabProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(quizAnswers[0] ?? null);
  const [answered, setAnswered] = useState(quizAnswers[0] !== null);
  const [reviewing, setReviewing] = useState(false);
  const answers = quizAnswers;
  const finished = quizFinished;

  const q = EXP4_QUIZ[current];
  const score = answers.filter((a, i) => a === EXP4_QUIZ[i].correct).length;

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const updated = [...answers];
    updated[current] = idx;
    onQuizAnswersChange(updated);
  }

  function handleNext() {
    if (current < EXP4_QUIZ.length - 1) {
      setCurrent(current + 1);
      setSelected(answers[current + 1] ?? null);
      setAnswered(answers[current + 1] !== null);
    } else {
      onQuizFinish();
    }
  }

  function handleRetry() {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setReviewing(false);
    onQuizReset();
  }

  if (finished && !reviewing) {
    const pct = Math.round((score / 10) * 100);
    const pass = score >= 6;
    return (
      <Exp4Card title="Customer Satisfaction Metrics — Assessment Quiz" icon={ListChecks}>
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <div className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white",
            pass ? "bg-emerald-500" : "bg-rose-500"
          )}>
            {score}/10
          </div>
          <div>
            <p className="text-2xl font-bold">{pct}%</p>
            <p className={cn("text-lg font-semibold mt-1", pass ? "text-emerald-600" : "text-rose-600")}>
              {pass ? "✓ Pass" : "✗ Fail"}
            </p>
            <p className="text-sm text-slate-500 mt-2">Passing score: 6/10 (60%)</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleRetry}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <RotateCcw className="h-4 w-4" /> Retry Quiz
            </button>
            <button type="button" onClick={() => setReviewing(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Review Answers <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Exp4Card>
    );
  }

  if (reviewing) {
    return (
      <Exp4Card title="Answer Review" icon={ListChecks}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">Final Score: <strong>{score}/10</strong></p>
          <button type="button" onClick={handleRetry}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Retry Quiz
          </button>
        </div>
        <div className="space-y-4">
          {EXP4_QUIZ.map((qItem, qi) => {
            const userAns = answers[qi];
            const correct = userAns === qItem.correct;
            return (
              <div key={qItem.id} className={cn("rounded-lg border p-4", correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
                <p className="text-sm font-semibold text-slate-800 mb-2">Q{qItem.id}. {qItem.question}</p>
                <div className="space-y-1">
                  {qItem.options.map((opt, oi) => (
                    <div key={oi} className={cn("flex items-center gap-2 rounded px-3 py-1.5 text-sm",
                      oi === qItem.correct ? "bg-emerald-100 text-emerald-800 font-medium"
                        : oi === userAns && !correct ? "bg-red-100 text-red-700"
                        : "text-slate-600"
                    )}>
                      {oi === qItem.correct ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                        : oi === userAns ? <X className="h-3.5 w-3.5 text-red-500" />
                        : <Minus className="h-3.5 w-3.5 text-slate-300" />}
                      {opt}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-600 italic">{qItem.feedback}</p>
              </div>
            );
          })}
        </div>
      </Exp4Card>
    );
  }

  return (
    <Exp4Card title="Customer Satisfaction Metrics — Assessment Quiz" icon={ListChecks}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">Question {current + 1} of 10</span>
        <span className="text-sm font-medium text-blue-600">Score: {score}</span>
      </div>
      <div className="mb-2 h-2 w-full rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${((current + (answered ? 1 : 0)) / 10) * 100}%` }} />
      </div>

      <div className="mt-5 mb-4">
        <p className="text-base font-semibold text-slate-800">{q.question}</p>
      </div>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let variant = "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50";
          if (answered) {
            if (i === q.correct) variant = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
            else if (i === selected) variant = "border-red-400 bg-red-50 text-red-700";
            else variant = "border-slate-100 bg-slate-50 text-slate-400";
          } else if (selected === i) {
            variant = "border-blue-500 bg-blue-50 text-blue-800";
          }
          return (
            <button
              key={i}
              id={`exp4-quiz-q${current + 1}-opt-${i}`}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={cn("w-full rounded-lg border px-4 py-3 text-left text-sm transition-all", variant)}
            >
              <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <span className="font-semibold mr-2">{selected === q.correct ? "✓ Correct!" : "✗ Incorrect."}</span>
          {q.feedback}
        </div>
      )}

      {answered && (
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={handleNext}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            {current < 9 ? "Next Question" : "See Results"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </Exp4Card>
  );
}

// ─── Conclusion Tab (with Report) ─────────────────────────────
function Exp4ConclusionTab({
  responses, selectedApp, quizAnswers, quizFinished,
}: {
  responses: Exp4Response[];
  selectedApp: string;
  quizAnswers: (number | null)[];
  quizFinished: boolean;
}) {
  const reportRef = useRef<HTMLDivElement>(null);

  const overallAvg = exp4_round2(exp4_overallAverage(responses));
  const highest = exp4_highestFactor(responses);
  const lowest = exp4_lowestFactor(responses);
  const themes = exp4_analyzeThemes(responses);

  function handlePrint() {
    window.print();
  }

  const factorTableData = EXP4_FACTORS.map(f => ({
    factor: EXP4_FACTOR_LABELS[f],
    avg: exp4_round2(exp4_factorAverage(responses, f)),
    interpretation: exp4_interpretScore(exp4_factorAverage(responses, f)),
  }));

  return (
    <div className="space-y-4">
      <Exp4Card title="Conclusion" icon={FileText}>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>
            Customer satisfaction surveys provide a practical way to evaluate how users perceive a
            software application. Likert-scale responses can be converted into numerical metrics, while
            open-ended responses provide qualitative suggestions.
          </p>
          <p>
            By calculating average satisfaction, comparing individual factors, and identifying recurring
            feedback themes, the experiment demonstrates how survey data can be used to identify software
            strengths and areas requiring improvement.
          </p>
        </div>
      </Exp4Card>

      <Exp4Card title="Generate Lab Report" icon={Download}>
        {!responses.length ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-slate-400">
            <FileText className="h-8 w-8 opacity-40" />
            <p className="text-sm">Load responses to generate the report.</p>
          </div>
        ) : !quizFinished ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <ListChecks className="h-7 w-7 text-amber-500" />
            </div>
            <p className="font-semibold text-slate-700">Complete the Assessment Quiz first</p>
            <p className="text-sm text-slate-500">The lab report can only be downloaded after finishing the quiz below.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                id="exp4-print-report"
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Print Report
              </button>
            </div>

            <div ref={reportRef} className="rounded-lg border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 space-y-5 print:border-0">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold text-blue-800 uppercase tracking-wide">Customer Satisfaction Metrics Report</h2>
                <p className="text-xs text-slate-400 mt-1">SRM Institute of Science and Technology — 21CSC403T Virtual Lab</p>
                <p className="text-xs text-slate-400">Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div><span className="font-semibold text-slate-800">Application:</span> {selectedApp}</div>
                <div><span className="font-semibold text-slate-800">Number of Responses:</span> {responses.length}</div>
                <div><span className="font-semibold text-slate-800">Overall Average Satisfaction:</span> {overallAvg.toFixed(2)} / 5.00</div>
                <div><span className="font-semibold text-slate-800">Interpretation:</span> {exp4_interpretScore(overallAvg)}</div>
              </div>

              <div>
                <p className="font-semibold text-slate-800 mb-2">Survey Questions</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>How satisfied are you with the overall experience of the application?</li>
                  <li>How satisfied are you with the application's ease of use?</li>
                  <li>How satisfied are you with the application's performance?</li>
                  <li>How satisfied are you with the application's reliability?</li>
                  <li>How satisfied are you with the application's features?</li>
                  <li>What improvement would you most like to see in this application? (Open-ended)</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold text-slate-800 mb-2">Factor-wise Average Ratings</p>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <th className="px-3 py-1.5 text-left">Factor</th>
                      <th className="px-3 py-1.5 text-center">Average</th>
                      <th className="px-3 py-1.5 text-left">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factorTableData.map(row => (
                      <tr key={row.factor} className="border-b border-slate-100">
                        <td className="px-3 py-1.5">{row.factor}</td>
                        <td className="px-3 py-1.5 text-center font-medium">{row.avg.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-800">Highest-Rated Factor (Strength)</p>
                  <p>{highest ? `${EXP4_FACTOR_LABELS[highest.factor]} (${exp4_round2(highest.avg).toFixed(2)})` : "—"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Lowest-Rated Factor (Improvement Area)</p>
                  <p>{lowest ? `${EXP4_FACTOR_LABELS[lowest.factor]} (${exp4_round2(lowest.avg).toFixed(2)})` : "—"}</p>
                </div>
              </div>

              {themes.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-800 mb-2">Common Feedback Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {themes.map(t => (
                      <span key={t.theme} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {t.theme}: {t.mentions} mention{t.mentions !== 1 ? "s" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-slate-800 mb-1">Analytical Comments</p>
                <p className="text-slate-600">
                  Based on {responses.length} survey responses for {selectedApp}, the overall satisfaction
                  score of {overallAvg.toFixed(2)} out of 5.00 indicates{" "}
                  {exp4_interpretScore(overallAvg).toLowerCase()}.{" "}
                  {highest && `The strongest aspect is ${EXP4_FACTOR_LABELS[highest.factor]} with an average of ${exp4_round2(highest.avg).toFixed(2)}.`}{" "}
                  {lowest && `The primary area requiring improvement is ${EXP4_FACTOR_LABELS[lowest.factor]}, which received an average of ${exp4_round2(lowest.avg).toFixed(2)}.`}{" "}
                  {themes.length > 0
                    ? `Open-ended feedback highlighted themes including ${themes.slice(0, 3).map(t => t.theme).join(", ")}.`
                    : "No recurring qualitative themes were identified from the open-ended responses."}
                </p>
              </div>

              {/* Quiz Results Section */}
              {quizFinished && (() => {
                const quizScore = quizAnswers.filter((a, i) => a === EXP4_QUIZ[i].correct).length;
                const quizPct = Math.round((quizScore / 10) * 100);
                const quizPass = quizScore >= 6;
                return (
                  <div className="border-t pt-4">
                    <p className="font-semibold text-slate-800 mb-3">Assessment Quiz Results</p>
                    <div className="mb-3 flex items-center gap-4 text-sm">
                      <span className={cn("font-bold", quizPass ? "text-emerald-600" : "text-rose-600")}>
                        Score: {quizScore}/10 ({quizPct}%) — {quizPass ? "PASS" : "FAIL"}
                      </span>
                      <span className="text-slate-500">Correct: {quizScore} &nbsp;|&nbsp; Wrong: {10 - quizScore}</span>
                    </div>
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-50">
                          <th className="px-2 py-1.5 text-left w-6">#</th>
                          <th className="px-2 py-1.5 text-left">Question</th>
                          <th className="px-2 py-1.5 text-left">Your Answer</th>
                          <th className="px-2 py-1.5 text-left">Correct Answer</th>
                          <th className="px-2 py-1.5 text-center w-14">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {EXP4_QUIZ.map((qItem, qi) => {
                          const userIdx = quizAnswers[qi];
                          const isCorrect = userIdx === qItem.correct;
                          return (
                            <tr key={qItem.id} className="border-b border-slate-100">
                              <td className="px-2 py-1.5 text-slate-400">{qi + 1}</td>
                              <td className="px-2 py-1.5 text-slate-700">{qItem.question}</td>
                              <td className="px-2 py-1.5 text-slate-600">
                                {userIdx !== null ? `${String.fromCharCode(65 + userIdx)}. ${qItem.options[userIdx]}` : "—"}
                              </td>
                              <td className="px-2 py-1.5 text-emerald-700 font-medium">
                                {String.fromCharCode(65 + qItem.correct)}. {qItem.options[qItem.correct]}
                              </td>
                              <td className="px-2 py-1.5 text-center font-bold">
                                {isCorrect
                                  ? <span className="text-emerald-600">✓</span>
                                  : <span className="text-rose-500">✗</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </Exp4Card>
    </div>
  );
}

// ─── Tab Icons ────────────────────────────────────────────────
const EXP4_TAB_ICONS: Record<Exp4Tab, React.ComponentType<{ className?: string }>> = {
  aim: Target,
  objective: Lightbulb,
  theory: BookOpen,
  procedure: ClipboardList,
  exercise: ListChecks,
  simulation: Play,
  results: BarChart3,
  analysis: FlaskConical,
  comparison: GitCompare,
  conclusion: FileText,
};

// ─── Main Page ────────────────────────────────────────────────
export function CustomerSatisfactionPage() {
  useParams();
  const [activeTab, setActiveTab] = useState<Exp4Tab>("aim");
  const [responses, setResponses] = useState<Exp4Response[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("WhatsApp");
  const [submittedApps, setSubmittedApps] = useState<Set<string>>(new Set());

  // Simulation tab state — lifted to survive tab switches
  const [simApp, setSimApp] = useState(EXP4_APPS[0]);
  const [simDataset, setSimDataset] = useState<"sample" | "custom">("sample");
  const [simSampleCount, setSimSampleCount] = useState<number>(20);

  // Quiz state — lifted to share with ConclusionTab
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const [quizFinished, setQuizFinished] = useState(false);

  const handleAddResponse = useCallback((r: Exp4Response) => {
    setResponses(prev => [...prev, r]);
  }, []);

  const handleMarkAppSubmitted = useCallback((app: string) => {
    setSubmittedApps(prev => new Set(prev).add(app));
  }, []);

  const handleSetResponses = useCallback((rs: Exp4Response[]) => {
    setResponses(rs);
  }, []);

  const handleSetApp = useCallback((app: string) => {
    setSelectedApp(app);
  }, []);

  function handleReset() {
    setResponses([]);
    setSelectedApp("WhatsApp");
    setSubmittedApps(new Set());
    setSimApp(EXP4_APPS[0]);
    setSimDataset("sample");
    setSimSampleCount(20);
    setQuizAnswers(Array(10).fill(null));
    setQuizFinished(false);
    setActiveTab("aim");
  }

  function renderTab() {
    switch (activeTab) {
      case "aim": return <Exp4AimTab />;
      case "objective": return <Exp4ObjectiveTab />;
      case "theory": return <Exp4TheoryTab />;
      case "procedure": return <Exp4ProcedureTab />;
      case "exercise": return (
        <Exp4ExerciseTab
          responses={responses}
          selectedApp={selectedApp}
          submittedApps={submittedApps}
          onAddResponse={handleAddResponse}
          onMarkAppSubmitted={handleMarkAppSubmitted}
        />
      );
      case "simulation": return (
        <Exp4SimulationTab
          responses={responses}
          selectedApp={selectedApp}
          simApp={simApp}
          dataset={simDataset}
          sampleCount={simSampleCount}
          onSetSimApp={setSimApp}
          onSetDataset={setSimDataset}
          onSetSampleCount={setSimSampleCount}
          onSetApp={handleSetApp}
          onSetResponses={handleSetResponses}
          onNavigate={setActiveTab}
        />
      );
      case "results": return <Exp4ResultsTab responses={responses} selectedApp={selectedApp} />;
      case "analysis": return <Exp4AnalysisTab responses={responses} selectedApp={selectedApp} />;
      case "comparison": return <Exp4ComparisonTab responses={responses} selectedApp={selectedApp} />;
      case "conclusion": return (
        <div className="space-y-4">
          <Exp4ConclusionTab
            responses={responses}
            selectedApp={selectedApp}
            quizAnswers={quizAnswers}
            quizFinished={quizFinished}
          />
          <Exp4QuizTab
            quizAnswers={quizAnswers}
            quizFinished={quizFinished}
            onQuizAnswersChange={setQuizAnswers}
            onQuizFinish={() => setQuizFinished(true)}
            onQuizReset={() => { setQuizAnswers(Array(10).fill(null)); setQuizFinished(false); }}
          />
        </div>
      );
      default: return null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <ExperimentSidebar />
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <span>Experiments</span>
              <span>/</span>
              <span className="font-medium text-white">Customer Satisfaction Metrics</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
                <Smile className="h-3 w-3" />
                Experiment 4
              </span>
              <h1 className="text-xl font-bold sm:text-2xl">Customer Satisfaction Metrics</h1>
            </div>
            <p className="mt-1.5 max-w-3xl text-sm text-white/85">
              Measure customer satisfaction through surveys, analyze user feedback, and identify strengths and improvement areas.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-10">
            {EXP4_TABS.map(tab => {
              const Icon = EXP4_TAB_ICONS[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`exp4-tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="scroll-mt-16 px-4 py-6 sm:px-6 lg:px-10">
          {renderTab()}

          {/* Reset Button */}
          <div className="mt-8 flex justify-end">
            <button
              id="exp4-reset-experiment"
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-300 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Experiment
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
