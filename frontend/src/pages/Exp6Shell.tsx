/**
 * Experiment 6 – OO Metrics with CK / SonarCloud
 *
 * Sections:
 *   Aim · Objective · Theory · Procedure ·
 *   Metrics (table + radar + self-assessment) ·
 *   Metric Explorer (interactive sliders) ·
 *   Analysis · Refactoring ·
 *   Exercise (Q&A) · Conclusion
 *
 * All metric values in the Metrics/Explorer sections are part of a clearly-labelled
 * SIMULATED / EDUCATIONAL DATASET — not real CK / SonarCloud output.
 */

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Check,
  ClipboardList,
  FileText,
  FlaskConical,
  Lightbulb,
  Network,
  Sliders,
  Target,
  Wrench,
  X,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LabPageShell, type LabPageSection } from "@/components/layout/LabPageShell";
import { cn } from "@/lib/utils";

// ─── Section IDs ─────────────────────────────────────────────────────────────
type Exp6Section =
  | "aim"
  | "objective"
  | "theory"
  | "procedure"
  | "metrics"
  | "explorer"
  | "analysis"
  | "refactoring"
  | "exercise"
  | "conclusion";

const SECTIONS: LabPageSection<Exp6Section>[] = [
  { id: "aim",         label: "Aim",            icon: Target        },
  { id: "objective",   label: "Objective",      icon: Lightbulb     },
  { id: "theory",      label: "Theory",         icon: BookOpen      },
  { id: "procedure",   label: "Procedure",      icon: ClipboardList },
  { id: "metrics",     label: "Metrics",        icon: Network       },
  { id: "explorer",    label: "Metric Explorer",icon: Sliders       },
  { id: "analysis",    label: "Analysis",       icon: FlaskConical  },
  { id: "refactoring", label: "Refactoring",    icon: Wrench        },
  { id: "exercise",    label: "Exercise",       icon: Activity      },
  { id: "conclusion",  label: "Conclusion",     icon: FileText      },
];

// ─── Prose copy ───────────────────────────────────────────────────────────────
const COPY: Record<Exp6Section, { title: string; body: string[] }> = {
  aim: {
    title: "Aim",
    body: [
      "Understand and apply the Chidamber-Kemerer (CK) suite of object-oriented design metrics — WMC, DIT, NOC, CBO, RFC, and LCOM — to evaluate the structural quality of a Java-based student-attendance application.",
      "Identify design smells using metric thresholds, discuss their implications, and propose technically justified refactoring strategies.",
    ],
  },
  objective: {
    title: "Objective",
    body: [
      "Compute the six CK metrics for each class in the target project using the CK tool (or SonarCloud's OO metrics view).",
      "Compare obtained values against established threshold guidelines (Rosenberg, Ferme, Lanza & Marinescu).",
      "Identify at least two classes whose metric profiles indicate significant design problems.",
      "Provide concrete refactoring recommendations backed by metric evidence and OO design principles.",
      "Document the measurement process so the experiment can be reproduced on any Java project.",
    ],
  },
  theory: {
    title: "Theory",
    body: [
      "The Chidamber-Kemerer metric suite (1994) defines six class-level measures that capture complementary aspects of OO design quality.",
      "WMC (Weighted Methods per Class) — sum of cyclomatic complexities of all methods. High WMC indicates a class is difficult to understand, test, and maintain; it tends to be highly application-specific and therefore hard to reuse.",
      "DIT (Depth of Inheritance Tree) — length of the longest path from a class to the root of its inheritance hierarchy. Deeper trees inherit more behavior (potential for reuse) but also increase coupling to ancestors, making classes harder to understand in isolation. DIT > 5 is generally considered a smell.",
      "NOC (Number of Children) — the number of immediate subclasses. High NOC indicates that many subclasses will be affected by changes to the parent; it also implies wider reuse. Abstract base classes with very high NOC may be carrying too many responsibilities.",
      "CBO (Coupling Between Object classes) — the number of classes to which a given class is coupled (uses or is used by). High CBO inhibits encapsulation, increases ripple-change risk, and hinders independent testing. CBO > 14 is widely cited as problematic.",
      "RFC (Response For a Class) — the cardinality of the set of methods that can potentially be executed in response to a message received by an object of the class (own methods + called external methods). High RFC increases the complexity of testing and understanding a class.",
      "LCOM (Lack of Cohesion in Methods) — measures how dissimilar the methods of a class are in terms of shared instance variables. High LCOM (LCOM1 ≥ 1) indicates that a class may be handling unrelated responsibilities and should potentially be split.",
      "Tool options: CK (github.com/mauricioaniche/ck) is a standalone, open-source Java tool that reads compiled class files or source files and outputs a CSV report. SonarCloud provides equivalent metrics through its 'Complexity' and 'Design' dashboards for hosted projects.",
    ],
  },
  procedure: {
    title: "Procedure",
    body: [
      "1. TOOL SELECTION — CK was selected because it is free, open-source, and produces a machine-readable CSV that can be imported into spreadsheets or automated pipelines. SonarCloud is the hosted alternative for teams already using CI/CD.",
      "2. SCENARIO JUSTIFICATION — A Java-based student-attendance REST application was chosen because it contains identifiable layers (controllers, services, repositories, utilities) that are likely to exhibit the coupling and cohesion issues the CK suite is designed to detect.",
      "3. MEASUREMENT STEPS (for real execution):",
      "   a. Clone the target repository.",
      "   b. Build the project: mvn compile (Maven) or gradle compileJava.",
      "   c. Download the CK jar: wget https://github.com/mauricioaniche/ck/releases/latest/download/ck.jar",
      "   d. Run: java -jar ck.jar /path/to/project/ true 0 false /output/",
      "   e. Open class.csv in Excel / Python / R.",
      "   f. Filter classes with WMC > 20, CBO > 14, RFC > 50, or LCOM ≥ 1.",
      "   g. Map each flagged class to the design problem it suggests.",
      "4. The Metrics section of this lab uses a clearly labelled SIMULATED / EDUCATIONAL DATASET to demonstrate how metric values would be interpreted. In a real execution the CSV produced by CK replaces this dataset.",
    ],
  },
  metrics:     { title: "Metrics",               body: [] },
  explorer:    { title: "Interactive Metric Explorer", body: [] },
  analysis:    { title: "Analysis",              body: [] },
  refactoring: { title: "Refactoring Suggestions", body: [] },
  exercise:    { title: "Exercise",              body: [] },
  conclusion: {
    title: "Conclusion",
    body: [
      "The CK metric suite provides a principled, tool-automated way to surface structural design problems in object-oriented codebases. WMC and RFC together reveal over-loaded classes; CBO quantifies coupling risk; LCOM diagnoses cohesion failure; DIT and NOC assess inheritance hierarchy health.",
      "In this experiment's educational dataset, NotificationEngine (high WMC/RFC/CBO) and ReportBuilder (high LCOM) were identified as the two most problematic classes. Standard refactoring patterns — Extract Class, Introduce Facade, and Single Responsibility decomposition — were shown to reduce each metric to within accepted thresholds.",
      "Real measurements should be obtained by running the CK tool (or SonarCloud) on the actual compiled project and repeating the analysis after each refactoring iteration to verify improvement.",
    ],
  },
};

// ─── Dataset ──────────────────────────────────────────────────────────────────
interface OOClass {
  name: string;
  layer: string;
  wmc: number;
  dit: number;
  noc: number;
  cbo: number;
  rfc: number;
  lcom: number;
}

const OO_CLASSES: OOClass[] = [
  { name: "StudentService",       layer: "Service",    wmc: 22, dit: 2, noc: 0, cbo: 9,  rfc: 38, lcom: 0 },
  { name: "AttendanceController", layer: "Controller", wmc: 14, dit: 1, noc: 0, cbo: 7,  rfc: 29, lcom: 0 },
  { name: "UserRepository",       layer: "Repository", wmc: 6,  dit: 3, noc: 2, cbo: 4,  rfc: 11, lcom: 0 },
  { name: "NotificationEngine",   layer: "Utility",    wmc: 31, dit: 1, noc: 0, cbo: 16, rfc: 58, lcom: 0 },
  { name: "ReportBuilder",        layer: "Utility",    wmc: 18, dit: 1, noc: 0, cbo: 11, rfc: 42, lcom: 1 },
];

const THRESHOLDS = { wmc: 20, dit: 5, noc: 10, cbo: 14, rfc: 50, lcom: 0 };
type MetricKey = keyof typeof THRESHOLDS;

function metricStatus(key: MetricKey, value: number): "ok" | "warn" | "crit" {
  if (key === "lcom") return value > 0 ? "crit" : "ok";
  const t = THRESHOLDS[key];
  if (value >= t) return "crit";
  if (value >= t * 0.75) return "warn";
  return "ok";
}

const STATUS_BADGE: Record<"ok" | "warn" | "crit", { label: string; variant: "ok" | "warn" | "crit" }> = {
  ok:   { label: "OK",   variant: "ok"   },
  warn: { label: "WARN", variant: "warn" },
  crit: { label: "HIGH", variant: "crit" },
};

const CLASS_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// Correct issue type per class (for self-assessment)
type IssueType = "God Class" | "Feature Envy" | "Healthy" | "Low Coupling";
const CORRECT_ISSUES: Record<string, IssueType> = {
  StudentService:       "God Class",
  AttendanceController: "Healthy",
  UserRepository:       "Healthy",
  NotificationEngine:   "God Class",
  ReportBuilder:        "Feature Envy",
};
const ISSUE_OPTIONS: IssueType[] = ["God Class", "Feature Envy", "Healthy", "Low Coupling"];

// ─── Disclaimer ───────────────────────────────────────────────────────────────
function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div>
        <span className="font-semibold">Simulated / Educational Dataset — </span>
        The metric values below were constructed for teaching purposes to illustrate how CK metrics
        are interpreted. They were <em>not</em> produced by running CK or SonarCloud against a real
        repository. In a live experiment, these numbers would be replaced by the CSV output of{" "}
        <code className="font-mono text-xs">java -jar ck.jar ...</code> or by the SonarCloud API.
      </div>
    </div>
  );
}

// ─── Theory card (prose) ──────────────────────────────────────────────────────
function TheoryCard({ section }: { section: Exp6Section }) {
  const copy = COPY[section];
  if (!copy.body.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-w-4xl space-y-3 text-sm leading-relaxed text-muted-foreground">
        {copy.body.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Metrics table ────────────────────────────────────────────────────────────
function MetricsTable() {
  const metricKeys: MetricKey[] = ["wmc", "dit", "noc", "cbo", "rfc", "lcom"];
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>CK Metric Values by Class</CardTitle>
        <p className="text-xs text-muted-foreground">
          Thresholds: WMC ≥ {THRESHOLDS.wmc} | CBO ≥ {THRESHOLDS.cbo} | RFC ≥ {THRESHOLDS.rfc} | LCOM {">"} {THRESHOLDS.lcom}
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Class</th>
              <th className="px-4 py-3 font-semibold">Layer</th>
              {metricKeys.map((k) => (
                <th key={k} className="px-4 py-3 font-semibold uppercase">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OO_CLASSES.map((cls) => (
              <tr key={cls.name} className="border-t border-border hover:bg-secondary/40">
                <td className="px-4 py-2.5 font-mono font-medium text-foreground">{cls.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{cls.layer}</td>
                {metricKeys.map((k) => {
                  const val = cls[k as keyof OOClass] as number;
                  const st = metricStatus(k, val);
                  const { label, variant } = STATUS_BADGE[st];
                  return (
                    <td key={k} className="px-4 py-2.5">
                      <span className="mr-1.5 font-mono">{val}</span>
                      <Badge variant={variant}>{label}</Badge>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ─── Radar chart ──────────────────────────────────────────────────────────────
function RadarSection() {
  function norm(key: MetricKey, value: number) {
    const ceiling = THRESHOLDS[key] * 2;
    return Math.min(100, Math.round((value / ceiling) * 100));
  }
  const radarData = ["WMC", "DIT", "NOC", "CBO", "RFC", "LCOM"].map((label) => {
    const key = label.toLowerCase() as MetricKey;
    const row: Record<string, number | string> = { metric: label };
    OO_CLASSES.forEach((cls) => {
      row[cls.name] = norm(key, cls[key as keyof OOClass] as number);
    });
    row["Threshold"] = 50;
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Normalised Radar — each metric scaled 0–100, dashed line = threshold</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius={100}>
            <PolarGrid stroke="#d6deea" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#4b5870", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #d6deea", fontSize: 11 }} />
            {OO_CLASSES.map((cls, i) => (
              <Radar key={cls.name} name={cls.name} dataKey={cls.name}
                stroke={CLASS_COLORS[i]} fill={CLASS_COLORS[i]} fillOpacity={0.08} dot={false} />
            ))}
            <Radar name="Threshold" dataKey="Threshold"
              stroke="#6b7280" fill="transparent" strokeDasharray="5 4" dot={false} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-3">
          {OO_CLASSES.map((cls, i) => (
            <span key={cls.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CLASS_COLORS[i] }} />
              {cls.name}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-gray-400" />
            Threshold
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Self-assessment cards ────────────────────────────────────────────────────
function SelfAssessmentPanel() {
  const [selected, setSelected] = useState<Record<string, IssueType | null>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  function pick(cls: string, issue: IssueType) {
    setSelected((s) => ({ ...s, [cls]: issue }));
  }
  function reveal(cls: string) {
    setRevealed((r) => ({ ...r, [cls]: true }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Self-Assessment — Classify Each Class
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on the metric table above, select the primary design smell for each class,
          then click <strong>Reveal</strong> to check your answer.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {OO_CLASSES.map((cls) => {
          const sel = selected[cls.name] ?? null;
          const rev = revealed[cls.name] ?? false;
          const correct = CORRECT_ISSUES[cls.name];
          const isRight = sel === correct;
          return (
            <div key={cls.name} className="rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground">{cls.name}</span>
                <span className="text-xs text-muted-foreground">({cls.layer})</span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  WMC {cls.wmc} · CBO {cls.cbo} · RFC {cls.rfc} · LCOM {cls.lcom}
                </span>
              </div>

              {/* Option buttons */}
              <div className="flex flex-wrap gap-2">
                {ISSUE_OPTIONS.map((opt) => {
                  const chosen = sel === opt;
                  let btnClass = "border border-border bg-white text-muted-foreground hover:bg-muted/60";
                  if (rev) {
                    if (opt === correct) btnClass = "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                    else if (chosen && !isRight) btnClass = "border-2 border-red-400 bg-red-50 text-red-700";
                    else btnClass = "border border-border bg-white text-muted-foreground opacity-50";
                  } else if (chosen) {
                    btnClass = "border-2 border-primary bg-primary/10 text-primary font-semibold";
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={rev}
                      onClick={() => pick(cls.name, opt)}
                      className={cn("rounded-md px-3 py-1.5 text-xs transition-all", btnClass)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Reveal / Result */}
              <div className="mt-3 flex items-center gap-3">
                {!rev && (
                  <Button size="sm" variant="outline" onClick={() => reveal(cls.name)} disabled={!sel}>
                    Reveal Answer
                  </Button>
                )}
                {rev && (
                  <div className={cn("flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium",
                    isRight ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                  )}>
                    {isRight ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    {isRight
                      ? `Correct! ${correct} — metrics confirm this classification.`
                      : `Not quite. The correct classification is "${correct}".`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Interactive Metric Explorer (sliders) ────────────────────────────────────
const EXPLORER_METRICS: { key: MetricKey; label: string; max: number; description: string }[] = [
  { key: "wmc", label: "WMC", max: 60, description: "Weighted Methods per Class (threshold 20)" },
  { key: "cbo", label: "CBO", max: 30, description: "Coupling Between Object classes (threshold 14)" },
  { key: "rfc", label: "RFC", max: 100, description: "Response For a Class (threshold 50)" },
  { key: "dit", label: "DIT", max: 10,  description: "Depth of Inheritance Tree (threshold 5)" },
  { key: "lcom",label: "LCOM",max: 5,  description: "Lack of Cohesion in Methods (threshold: must be 0)" },
];

function MetricExplorer() {
  const [vals, setVals] = useState<Record<MetricKey, number>>({
    wmc: 10, dit: 2, noc: 1, cbo: 6, rfc: 24, lcom: 0,
  });

  function set(k: MetricKey, v: number) {
    setVals((prev) => ({ ...prev, [k]: v }));
  }

  const issues: string[] = [];
  if (vals.wmc >= THRESHOLDS.wmc) issues.push("God Class / Large Class — WMC too high");
  if (vals.cbo >= THRESHOLDS.cbo) issues.push("Inappropriate Intimacy — too many couplings");
  if (vals.rfc >= THRESHOLDS.rfc) issues.push("Complex Class — response set too large");
  if (vals.dit >= THRESHOLDS.dit) issues.push("Deep Hierarchy — DIT exceeds safe depth");
  if (vals.lcom > THRESHOLDS.lcom) issues.push("Low Cohesion — class handles unrelated responsibilities");

  const healthScore = Math.max(0, 100 - (
    (vals.wmc >= THRESHOLDS.wmc ? 25 : 0) +
    (vals.cbo >= THRESHOLDS.cbo ? 25 : 0) +
    (vals.rfc >= THRESHOLDS.rfc ? 25 : 0) +
    (vals.dit >= THRESHOLDS.dit ? 15 : 0) +
    (vals.lcom > THRESHOLDS.lcom ? 10 : 0)
  ));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            Interactive Metric Explorer
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Drag the sliders to simulate a class's metric values. Watch how the design-smell
            diagnosis and health score respond in real time.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {EXPLORER_METRICS.map(({ key, label, max, description }) => {
              const val = vals[key];
              const st = metricStatus(key, val);
              const { variant } = STATUS_BADGE[st];
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`slider-${key}`} className="text-xs font-semibold text-foreground">
                      {label} = <span className="font-mono">{val}</span>
                    </label>
                    <Badge variant={variant}>{STATUS_BADGE[st].label}</Badge>
                  </div>
                  <input
                    id={`slider-${key}`}
                    type="range"
                    min={0}
                    max={max}
                    value={val}
                    onChange={(e) => set(key, Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">{description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle>Live Diagnosis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Design Health Score</span>
            <div className="flex-1 overflow-hidden rounded-full bg-muted h-3">
              <div
                className={cn("h-3 rounded-full transition-all duration-300",
                  healthScore >= 75 ? "bg-emerald-500" : healthScore >= 50 ? "bg-amber-400" : "bg-red-500"
                )}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <span className={cn("font-mono text-sm font-bold",
              healthScore >= 75 ? "text-emerald-700" : healthScore >= 50 ? "text-amber-700" : "text-red-700"
            )}>
              {healthScore}/100
            </span>
          </div>
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Check className="h-4 w-4" />
              All metrics within acceptable thresholds — class appears well-designed.
            </div>
          ) : (
            <ul className="space-y-2">
              {issues.map((iss) => (
                <li key={iss} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {iss}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Analysis section ─────────────────────────────────────────────────────────
function AnalysisSection() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Problematic Class 1 — NotificationEngine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">Metric profile:</strong> WMC = 31, CBO = 16, RFC = 58 — all above threshold.</p>
          <p><strong className="text-foreground">Why problematic:</strong> Elevated WMC (31) indicates the class contains too many weighted methods for a single responsibility. High CBO (16) means changes in any of 16 external classes may require changes here — a classic ripple-change risk. RFC = 58 implies that testing a single object requires understanding 58 possible response paths, dramatically increasing test surface area.</p>
          <p><strong className="text-foreground">Design smells:</strong> God Class / Large Class (WMC), Inappropriate Intimacy (CBO), Complex Class (RFC).</p>
          <div className="grid grid-cols-3 gap-2">
            {[["WMC = 31", "threshold 20", "crit"], ["CBO = 16", "threshold 14", "crit"], ["RFC = 58", "threshold 50", "crit"]].map(([l, s, v]) => (
              <div key={l} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <div className="font-mono text-lg font-bold text-foreground">{l.split("= ")[1]}</div>
                <div className="text-xs text-muted-foreground">{l.split(" =")[0]} — {s}</div>
                <Badge variant={v as "crit"} className="mt-1">HIGH</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Problematic Class 2 — ReportBuilder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">Metric profile:</strong> LCOM = 1, WMC = 18 (approaching threshold), RFC = 42.</p>
          <p><strong className="text-foreground">Why problematic:</strong> LCOM = 1 (LCOM1 formulation) means that no two methods share any instance variable — the class has been assembled from logically unrelated sub-functions, violating the Single Responsibility Principle. High RFC (42) confirms wide external interaction.</p>
          <p><strong className="text-foreground">Design smells:</strong> Low Cohesion / Feature Envy, Data Clumps.</p>
          <div className="grid grid-cols-3 gap-2">
            {[["LCOM = 1", "threshold 0", "crit"], ["WMC = 18", "near limit 20", "warn"], ["RFC = 42", "threshold 50", "warn"]].map(([l, s, v]) => (
              <div key={l} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                <div className="font-mono text-lg font-bold text-foreground">{l.split("= ")[1]}</div>
                <div className="text-xs text-muted-foreground">{l.split(" =")[0]} — {s}</div>
                <Badge variant={v as "crit" | "warn"} className="mt-1">{v === "crit" ? "HIGH" : "WARN"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Refactoring section ──────────────────────────────────────────────────────
function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border text-xs">
      <div className="border-b border-border bg-muted/40 px-3 py-1.5 font-medium text-foreground">{label}</div>
      <pre className="overflow-x-auto bg-[hsl(220_33%_97%)] px-4 py-3 font-mono leading-relaxed text-foreground">{code}</pre>
    </div>
  );
}

function RefactoringSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Refactoring Plan — NotificationEngine (Extract Class + Introduce Facade)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>The single over-loaded class is split into three focused specialists; a lightweight <code>NotificationFacade</code> delegates to each. This reduces WMC and RFC per class and cuts CBO by limiting each specialist to its own dependency set.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <CodeBlock label="BEFORE — NotificationEngine.java (WMC 31, CBO 16)" code={`class NotificationEngine {
  // Email (8 methods) — couples to EmailClient,
  //   TemplateEngine, AttachmentService, MailQueue…
  void sendWelcomeEmail(User u) { … }
  void sendPasswordReset(User u) { … }

  // SMS (7 methods) — couples to SmsGateway,
  //   PhoneValidator, RegionRouter, RateLimiter…
  void sendOtpSms(User u) { … }

  // Push (6 methods) — couples to FirebaseClient,
  //   DeviceRegistry, TopicManager…
  void sendPushAlert(User u) { … }

  // Admin/audit (10 methods)
  void logNotificationEvent(Event e) { … }
}`} />
            <CodeBlock label="AFTER — four focused classes (WMC ≤ 10, CBO ≤ 6 each)" code={`class EmailNotifier {           // WMC 8, CBO 4
  void sendWelcome(User u) { … }
  void sendPasswordReset(User u) { … }
}

class SmsNotifier {             // WMC 7, CBO 4
  void sendOtp(User u) { … }
}

class PushNotifier {            // WMC 6, CBO 4
  void sendAlert(User u) { … }
}

class NotificationAuditLogger { // WMC 10, CBO 3
  void logEvent(Event e) { … }
}

// Thin facade
class NotificationFacade {      // WMC 4, CBO 4
  void notify(User u, Channel c) { … }
}`} />
          </div>
          <p><strong className="text-foreground">Expected improvement:</strong> WMC 31 → ≤ 10 per class · CBO 16 → ≤ 6 · RFC 58 → ≤ 20.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Refactoring Plan — ReportBuilder (Single Responsibility Decomposition)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>LCOM = 1 signals method groups with completely disjoint state. Each group becomes its own class; a coordinating builder composes the parts.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <CodeBlock label="BEFORE — ReportBuilder.java (LCOM 1, WMC 18)" code={`class ReportBuilder {
  // Group A — uses: studentList, filters
  List<Student> fetchStudents() { … }
  List<Student> applyFilters() { … }

  // Group B — uses: template, stylesheet
  //   (ZERO shared fields with A → LCOM = 1)
  String renderHtml() { … }
  byte[] generatePdf() { … }

  // Group C — uses: emailConfig, recipients
  //   (ZERO shared fields with A or B)
  void sendReport() { … }
}`} />
            <CodeBlock label="AFTER — three cohesive classes (LCOM 0 each)" code={`class StudentDataFetcher {   // LCOM 0, WMC 6
  private List<Student> studentList;
  private FilterCriteria  filters;
  List<Student> fetch() { … }
}

class ReportRenderer {       // LCOM 0, WMC 5
  private Template   template;
  private Stylesheet stylesheet;
  byte[] generatePdf() { … }
}

class ReportDispatcher {     // LCOM 0, WMC 7
  private EmailConfig     emailConfig;
  private List<String>    recipients;
  void send(byte[] r) { … }
}

// Thin orchestrator
class ReportBuilder {        // WMC 3, CBO 3
  void build(FilterCriteria f) {
    var data = new StudentDataFetcher(f).fetch();
    var pdf  = new ReportRenderer().generatePdf(data);
    new ReportDispatcher().send(pdf);
  }
}`} />
          </div>
          <p><strong className="text-foreground">Expected improvement:</strong> LCOM 1 → 0 per class · WMC 18 → ≤ 7 · RFC 42 → ≤ 15.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Exercise Q&A ─────────────────────────────────────────────────────────────
interface Question {
  id: number;
  text: string;
  type: "mcq" | "short";
  options?: string[];
  answer: string;         // correct option text (mcq) or model answer (short)
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Which class in the dataset has the highest CBO value, and what design smell does this indicate?",
    type: "mcq",
    options: [
      "NotificationEngine — Inappropriate Intimacy (too many couplings)",
      "ReportBuilder — God Class (too many methods)",
      "StudentService — Feature Envy (low cohesion)",
      "UserRepository — Deep Hierarchy (high DIT)",
    ],
    answer: "NotificationEngine — Inappropriate Intimacy (too many couplings)",
    explanation: "NotificationEngine has CBO = 16, exceeding the threshold of 14. This means it depends on 16 other classes, creating a high ripple-change risk — the definition of Inappropriate Intimacy.",
  },
  {
    id: 2,
    text: "Why does an LCOM value of 1 indicate a design problem? Which class in the dataset exhibits this?",
    type: "mcq",
    options: [
      "LCOM = 1 means methods share no instance variables → the class handles unrelated responsibilities. ReportBuilder exhibits this.",
      "LCOM = 1 means the class has only one method → too small. StudentService exhibits this.",
      "LCOM = 1 means the class inherits from one parent → DIT is too shallow. UserRepository exhibits this.",
      "LCOM = 1 is the ideal cohesion value — it means perfect cohesion.",
    ],
    answer: "LCOM = 1 means methods share no instance variables → the class handles unrelated responsibilities. ReportBuilder exhibits this.",
    explanation: "LCOM1 = 1 means no pair of methods shares any instance variable, i.e., they are completely unrelated. ReportBuilder has LCOM = 1, indicating it should be split into separate classes by responsibility.",
  },
  {
    id: 3,
    text: "Which metric directly measures the size of a test harness needed for a class?",
    type: "mcq",
    options: [
      "RFC — Response For a Class (methods reachable from a single message)",
      "WMC — total method count",
      "DIT — inheritance depth",
      "NOC — number of subclasses",
    ],
    answer: "RFC — Response For a Class (methods reachable from a single message)",
    explanation: "RFC counts all methods (own + called) that may execute in response to a single message. A test harness must cover all of these paths, so RFC is directly proportional to minimum test-harness complexity.",
  },
  {
    id: 4,
    text: "Explain what refactoring pattern you would apply to NotificationEngine and why it reduces CBO.",
    type: "short",
    answer: "Apply Extract Class to split NotificationEngine into EmailNotifier, SmsNotifier, PushNotifier, and NotificationAuditLogger, coordinated by a NotificationFacade. Each specialist couples only to its own subset of dependencies, so CBO per class drops from 16 to ≤ 6. The facade provides a single stable interface to callers without accumulating all couplings in one class.",
    explanation: "",
  },
  {
    id: 5,
    text: "AttendanceController has WMC = 14, CBO = 7, RFC = 29. Is this class problematic? Justify your answer using threshold values.",
    type: "short",
    answer: "No. All three metrics are below their respective thresholds (WMC < 20, CBO < 14, RFC < 50). LCOM = 0 confirms cohesion is acceptable. The controller appears well-scoped for a REST endpoint handler, and no refactoring is immediately indicated by the metric evidence.",
    explanation: "",
  },
];

function ExercisePanel() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [shown, setShown] = useState<Record<number, boolean>>({});

  function submit(id: number) {
    setSubmitted((s) => ({ ...s, [id]: true }));
  }
  function showModel(id: number) {
    setShown((s) => ({ ...s, [id]: true }));
  }

  const mcqScore = QUESTIONS.filter((q) => q.type === "mcq" && submitted[q.id] && answers[q.id] === q.answer).length;
  const mcqTotal = QUESTIONS.filter((q) => q.type === "mcq").length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Exercise Questions
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Answer all questions based on the metrics and analysis you studied. MCQs are auto-scored.
            Short-answer questions have a model answer you can compare with.
          </p>
        </CardHeader>
      </Card>

      {QUESTIONS.map((q) => {
        const userAnswer = answers[q.id] ?? "";
        const isSubmitted = !!submitted[q.id];
        const isCorrect = q.type === "mcq" && userAnswer === q.answer;
        const modelShown = !!shown[q.id];

        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">
                Q{q.id}. {q.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.type === "mcq" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    let cls = "border border-border bg-white text-muted-foreground hover:bg-muted/50";
                    if (isSubmitted) {
                      if (opt === q.answer) cls = "border-2 border-emerald-500 bg-emerald-50 text-emerald-800 font-medium";
                      else if (opt === userAnswer) cls = "border-2 border-red-400 bg-red-50 text-red-700";
                      else cls = "border border-border bg-white text-muted-foreground opacity-50";
                    } else if (userAnswer === opt) {
                      cls = "border-2 border-primary bg-primary/10 text-primary font-medium";
                    }
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={cn("block w-full rounded-md px-4 py-2.5 text-left text-xs transition-all", cls)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                  {!isSubmitted && (
                    <Button size="sm" disabled={!userAnswer} onClick={() => submit(q.id)}>
                      Submit Answer
                    </Button>
                  )}
                  {isSubmitted && (
                    <div className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-xs",
                      isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                    )}>
                      {isCorrect ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                      <div>
                        <strong>{isCorrect ? "Correct!" : "Incorrect."}</strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {q.type === "short" && (
                <div className="space-y-2">
                  <textarea
                    id={`short-${q.id}`}
                    rows={4}
                    value={userAnswer}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    placeholder="Type your answer here…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!userAnswer} onClick={() => showModel(q.id)}>
                      Show Model Answer
                    </Button>
                  </div>
                  {modelShown && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-foreground">
                      <p className="mb-1 font-semibold text-primary">Model Answer</p>
                      {q.answer}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Score summary */}
      {QUESTIONS.filter((q) => q.type === "mcq").every((q) => submitted[q.id]) && (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-primary">{mcqScore}/{mcqTotal}</div>
              <div className="text-xs text-muted-foreground">MCQ Score</div>
            </div>
            <p className="text-sm text-muted-foreground">
              {mcqScore === mcqTotal
                ? "Full marks on all multiple-choice questions. Excellent work!"
                : `Review the highlighted questions and the Analysis section for clarification.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────
export function Exp6Shell() {
  const [section, setSection] = useState<Exp6Section>("aim");

  function renderBody() {
    if (section === "metrics") {
      return (
        <div className="space-y-4">
          <DisclaimerBanner />
          <MetricsTable />
          <RadarSection />
          <SelfAssessmentPanel />
        </div>
      );
    }
    if (section === "explorer") {
      return (
        <div className="space-y-4">
          <DisclaimerBanner />
          <MetricExplorer />
        </div>
      );
    }
    if (section === "analysis") return <AnalysisSection />;
    if (section === "refactoring") return <RefactoringSection />;
    if (section === "exercise") return <ExercisePanel />;
    return <TheoryCard section={section} />;
  }

  return (
    <LabPageShell
      experimentNumber={6}
      title="OO Metrics with CK / SonarCloud"
      subtitle="Capture WMC, DIT, NOC, CBO, RFC, and LCOM. Explore thresholds interactively, classify design smells, and complete exercises."
      sections={SECTIONS}
      activeSection={section}
      onSectionChange={setSection}
    >
      {renderBody()}
    </LabPageShell>
  );
}
