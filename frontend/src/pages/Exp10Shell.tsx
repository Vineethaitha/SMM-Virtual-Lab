import { useState } from "react";
import {
  Award,
  BookOpen,
  Calculator,
  ClipboardList,
  Gauge,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Target,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LabPageShell, type LabPageSection } from "@/components/layout/LabPageShell";
import { LabCard, LabFormula, LabInfoBox, LabKpiCard, LabStepList } from "@/components/lab/LabCard";
import { LabQuizCards } from "@/components/exercise/LabQuizCards";
import { ConclusionQuizGate, FinalLabQuizButton } from "@/components/quiz/ConclusionQuizGate";
import {
  EXP10_AFTER,
  EXP10_BASELINE,
  EXP10_BEFORE,
  EXP10_IMPROVED,
  EXP10_LSL,
  EXP10_CONCLUSION_QUIZ,
  EXP10_QUIZ,
  EXP10_USL,
} from "@/data/exp10Data";
import { formatNum } from "@/lib/utils";

type Tab = "aim" | "objective" | "theory" | "procedure" | "simulation" | "results" | "exercise" | "conclusion";

const SECTIONS: LabPageSection<Tab>[] = [
  { id: "aim", label: "Aim", icon: Target },
  { id: "objective", label: "Objective", icon: Lightbulb },
  { id: "theory", label: "Theory", icon: BookOpen },
  { id: "procedure", label: "Procedure", icon: ClipboardList },
  { id: "simulation", label: "Case Study", icon: Calculator },
  { id: "results", label: "Results", icon: ListChecks },
  { id: "exercise", label: "Exercise", icon: HelpCircle },
  { id: "conclusion", label: "Conclusion", icon: Award },
];

export function Exp10Shell() {
  const [section, setSection] = useState<Tab>("aim");
  const [phase, setPhase] = useState<"before" | "after">("before");
  const [exerciseDone, setExerciseDone] = useState(false);

  const stats = phase === "before" ? EXP10_BEFORE : EXP10_AFTER;
  const series =
    phase === "before"
      ? EXP10_BASELINE.map((days, i) => ({ sprint: i + 1, days }))
      : EXP10_IMPROVED.map((days, i) => ({ sprint: i + 11, days }));
  const conclusion = `CodeWave’s first 10 sprints have mean ${EXP10_BEFORE.mean.toFixed(1)} days and are statistically stable (no point outside 3-sigma limits), but they are not capable: Cpk ≈ ${EXP10_BEFORE.cpk.toFixed(2)} and sprint 10 exceeds USL = 10. After a PDCA/IDEAL improvement cycle the next five sprints centre near ${EXP10_AFTER.mean.toFixed(1)} days with Cp ≈ ${EXP10_AFTER.cp.toFixed(2)} and Cpk ≈ ${EXP10_AFTER.cpk.toFixed(2)}. Stability and capability are different questions; both must be shown before calling the testing process mature.`;

  const body = (() => {
    if (section === "aim") {
      return (
        <LabCard title="Aim" icon={Target}>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              Decide whether CodeWave Technologies’ testing process is statistically stable and capable of the 4–10
              day specification, then outline a process-improvement plan.
            </p>
            <p>The sample is Case Study 10 (Banking Web Application testing times for 10 sprints, then 5 more).</p>
          </div>
        </LabCard>
      );
    }
    if (section === "objective") {
      return (
        <LabCard title="Objective" icon={Lightbulb}>
          <LabStepList
            items={[
              "Compute mean and sample standard deviation of the ten baseline sprint times.",
              "Form 3-sigma control limits and state whether the process is stable.",
              "Compute Cp and Cpk against USL = 10 and LSL = 4 and interpret capability.",
              "Propose a PDCA or SEI IDEAL improvement sequence.",
              "Recalculate the same parameters on the five post-improvement sprints.",
            ]}
          />
        </LabCard>
      );
    }
    if (section === "theory") {
      return (
        <div className="space-y-4">
          <LabCard title="Stability versus capability">
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                A <strong>stable</strong> process has only common-cause variation (every sprint time stays inside
                the 3-sigma control limits). A <strong>capable</strong> process also fits the customer specification
                (almost all times lie between LSL and USL). Stability does not imply capability.
              </p>
              <LabFormula>μ = Σxᵢ / n &nbsp;&nbsp; σ = √(Σ(xᵢ−μ)² / (n−1))</LabFormula>
              <LabFormula>UCL = μ + 3σ &nbsp;&nbsp; LCL = μ − 3σ</LabFormula>
              <LabFormula>Cp = (USL − LSL) / 6σ</LabFormula>
              <LabFormula>Cpk = min( (USL−μ)/(3σ) , (μ−LSL)/(3σ) )</LabFormula>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Symbol</th>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Meaning in this lab</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">xᵢ</td><td className="px-3 py-1.5">Observation</td><td className="px-3 py-1.5">Testing completion time of sprint i, in days</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">n</td><td className="px-3 py-1.5">Sample size</td><td className="px-3 py-1.5">Number of sprints (10 baseline, then 5 after improvement)</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">μ</td><td className="px-3 py-1.5">Mean</td><td className="px-3 py-1.5">Average completion time of the sample</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">σ</td><td className="px-3 py-1.5">Sample std. deviation</td><td className="px-3 py-1.5">Spread of sprint times around the mean</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">UCL / LCL</td><td className="px-3 py-1.5">Control limits</td><td className="px-3 py-1.5">μ ± 3σ — used to judge statistical stability</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">USL / LSL</td><td className="px-3 py-1.5">Specification limits</td><td className="px-3 py-1.5">Customer window: 10 days (upper) and 4 days (lower)</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">Cp</td><td className="px-3 py-1.5">Process capability</td><td className="px-3 py-1.5">Spec width ÷ 6σ — potential fit if the process is centred</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">Cpk</td><td className="px-3 py-1.5">Capability index</td><td className="px-3 py-1.5">Same idea, but uses the nearer spec so off-centre processes score worse</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                Common practice treats Cp, Cpk ≥ 1 as barely capable and ≥ 1.33 as a typical industry target.
              </p>
            </div>
          </LabCard>
          <LabCard title="Improvement models (Unit 5)">
            <p className="text-sm leading-relaxed text-slate-600">
              Deming’s PDCA (Plan–Do–Check–Act) and the SEI IDEAL model (Initiating, Diagnosing, Establishing, Acting,
              Learning) structure how a team changes a process after a capability study. This lab applies the formulas
              to the published case numbers; it does not run the bank application.
            </p>
          </LabCard>
        </div>
      );
    }
    if (section === "procedure") {
      return (
        <LabCard title="Procedure" icon={ClipboardList}>
          <LabStepList
            variant="procedure"
            items={[
              "Open Case Study and leave the toggle on Baseline (sprints 1–10).",
              "Read mean, σ, UCL, LCL, Cp, and Cpk computed from the case table.",
              "Switch to After improvement (sprints 11–15) and compare centring and spread.",
              "Answer Exercise questions using these same numbers.",
              "Summarize stability, capability, and the PDCA/IDEAL plan in Conclusion.",
            ]}
          />
        </LabCard>
      );
    }
    if (section === "simulation") {
      return (
        <div className="space-y-4">
          <LabInfoBox>
            CodeWave Technologies — Banking Web Application. USL = {EXP10_USL} days, LSL = {EXP10_LSL} days.
          </LabInfoBox>
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${phase === "before" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
              onClick={() => setPhase("before")}
            >
              Baseline (1–10)
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${phase === "after" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}
              onClick={() => setPhase("after")}
            >
              After improvement (11–15)
            </button>
          </div>
          <LabCard title="Testing completion time (days)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="sprint" />
                <YAxis domain={[0, 14]} />
                <Tooltip />
                <ReferenceLine y={EXP10_USL} stroke="#f59e0b" strokeDasharray="4 4" label="USL" />
                <ReferenceLine y={EXP10_LSL} stroke="#f59e0b" strokeDasharray="4 4" label="LSL" />
                <ReferenceLine y={stats.ucl} stroke="#ef4444" strokeDasharray="2 2" label="UCL" />
                <ReferenceLine y={stats.lcl} stroke="#ef4444" strokeDasharray="2 2" label="LCL" />
                <ReferenceLine y={stats.mean} stroke="#2563eb" label="mean" />
                <Line type="monotone" dataKey="days" stroke="#1d4ed8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </LabCard>
        </div>
      );
    }
    if (section === "results") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <LabKpiCard label="Mean" value={formatNum(stats.mean)} sub={`${stats.n} sprints`} color="blue" />
            <LabKpiCard label="σ" value={formatNum(stats.stdev)} sub="sample stdev" color="indigo" />
            <LabKpiCard label="Cp" value={formatNum(stats.cp)} sub={stats.capable ? "capable" : "not capable"} color="amber" />
            <LabKpiCard
              label="Cpk"
              value={formatNum(stats.cpk)}
              sub={stats.stable ? "stable chart" : "special cause"}
              color="green"
            />
          </div>
          <LabCard title="Reading the chart">
            <p className="text-sm leading-relaxed text-slate-600">
              {phase === "before"
                ? `Baseline UCL ≈ ${formatNum(EXP10_BEFORE.ucl)}, LCL ≈ ${formatNum(EXP10_BEFORE.lcl)}. All ten points stay inside the control limits, so the process is stable. Sprint 10 (11 days) is above USL, which is why Cpk is far below 1.`
                : `Improved mean ≈ ${formatNum(EXP10_AFTER.mean)} with much smaller σ. Cp and Cpk both exceed 1, so the testing process is now capable and better centered.`}
            </p>
          </LabCard>
        </div>
      );
    }
    if (section === "exercise") {
      return (
        <div className="space-y-4">
          <LabCard title="Exercise" icon={HelpCircle}>
            <p className="text-sm leading-relaxed text-slate-600">
              Answer from the CodeWave sprint table. Use Try Yourself, Check Answer, and Show Explanation on each card.
            </p>
          </LabCard>
          <LabQuizCards
            questions={EXP10_QUIZ.map((q) => ({
              id: q.id,
              prompt: q.prompt,
              expected: q.answer,
              explain: q.explain,
              options: q.options,
            }))}
            onStatusChange={(s) => {
              if (s.allChecked) setExerciseDone(true);
            }}
          />
        </div>
      );
    }
    return (
      <ConclusionQuizGate
        paragraphs={[conclusion]}
        questions={EXP10_CONCLUSION_QUIZ.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          expected: q.answer,
          explain: q.explain,
          options: q.options,
        }))}
        quizTitle="Experiment 10 — Conclusion quiz"
        locked={!exerciseDone}
        lockHint="Complete every question in the Exercise tab, then return here to take the quiz."
        originOptions={[{ value: "sample", label: "CodeWave case study sample" }]}
        footnote="Exercise 10 — Process performance (CPI)."
        studentSeed={{ title: "CodeWave testing-process CPI", origin: "sample" }}
        extraAction={<FinalLabQuizButton />}
        onDownload={async (s, result) => {
          const { downloadUnifiedLabPdf } = await import("@/lib/reportPdf");
          await downloadUnifiedLabPdf({
            experimentNumber: 10,
            experimentTitle: "Process Performance (CPI)",
            names: s.names,
            regs: s.regs,
            projectTitle: s.title,
            origin: s.origin,
            description: s.description,
            toolNote: `CodeWave testing times. USL=${EXP10_USL}, LSL=${EXP10_LSL}.`,
            resultLines: [
              `Baseline mean ${EXP10_BEFORE.mean.toFixed(2)}, Cpk ${EXP10_BEFORE.cpk.toFixed(2)}.`,
              `After mean ${EXP10_AFTER.mean.toFixed(2)}, Cp ${EXP10_AFTER.cp.toFixed(2)}, Cpk ${EXP10_AFTER.cpk.toFixed(2)}.`,
            ],
            analysisLines: [conclusion],
            conclusion,
            quizScore: result.score,
            quizTotal: result.total,
          });
        }}
      />
    );
  })();

  return (
    <LabPageShell
      experimentNumber={10}
      title="Process Performance (CPI)"
      subtitle="Check stability and capability of CodeWave’s testing times, then compare a post-improvement sample."
      sections={SECTIONS}
      activeSection={section}
      onSectionChange={setSection}
      badgeIcon={Gauge}
    >
      {body}
    </LabPageShell>
  );
}
