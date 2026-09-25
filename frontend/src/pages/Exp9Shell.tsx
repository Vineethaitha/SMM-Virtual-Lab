import { useState } from "react";
import {
  Award,
  BookOpen,
  Calculator,
  ClipboardList,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Shield,
  Target,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LabPageShell, type LabPageSection } from "@/components/layout/LabPageShell";
import { LabCard, LabFormula, LabInfoBox, LabKpiCard, LabStepList } from "@/components/lab/LabCard";
import { LabQuizCards } from "@/components/exercise/LabQuizCards";
import { ConclusionQuizGate } from "@/components/quiz/ConclusionQuizGate";
import { EXP9_CONCLUSION_QUIZ, EXP9_METRICS, EXP9_MODULE, EXP9_QUIZ, EXP9_WEEKS } from "@/data/exp9Data";
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

export function Exp9Shell() {
  const [section, setSection] = useState<Tab>("aim");
  const [exerciseDone, setExerciseDone] = useState(false);
  const m = EXP9_METRICS;
  const conclusion = `The Payment Gateway sample (12.4 KLOC) recorded ${m.totalDefects} defects over 10 weeks and 14 failures in 2000 hours. Defect density is ${m.density.toFixed(2)} defects/KLOC and λ = ${m.lambda.toFixed(3)} /hour, so R(100) ≈ ${m.r100.toFixed(2)}. Arrivals fell from ${m.firstHalf} in weeks 1–5 to ${m.secondHalf} in weeks 6–10, which is consistent with reliability growth (Jelinski–Moranda / Goel–Okumoto style) rather than a still-rising Rayleigh peak. Release quality is improving but not yet “defect free”: remaining intensity should be watched before a high-risk go-live.`;

  const body = (() => {
    if (section === "aim") {
      return (
        <LabCard title="Aim" icon={Target}>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              Compute defect density, failure rate, and a simple reliability function from a sample test log, then
              interpret what the numbers imply for release quality.
            </p>
            <p>
              Relate the arrival curve to the Rayleigh model and to reliability-growth models (Jelinski–Moranda,
              Goel–Okumoto, Musa–Okumoto) from Unit 4.
            </p>
          </div>
        </LabCard>
      );
    }
    if (section === "objective") {
      return (
        <LabCard title="Objective" icon={Lightbulb}>
          <LabStepList
            items={[
              "Record size (KLOC), defect arrivals, failures, and operational hours for the sample module.",
              "Compute defect density = defects / KLOC and λ = failures / operational hours.",
              "Evaluate exponential reliability R(t) = e^(−λt) at a stated mission time.",
              "Describe whether weekly arrivals are still rising (Rayleigh growth) or already declining (growth models).",
              "State a release recommendation grounded in those metrics.",
            ]}
          />
        </LabCard>
      );
    }
    if (section === "theory") {
      return (
        <div className="space-y-4">
          <LabCard title="Defect density and failure rate">
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                Defect density normalizes how many faults were found against product size. Failure rate λ
                (lambda) is how often the running system fails. Reliability R(t) is the probability of
                surviving t hours with no failure, assuming a constant λ (exponential model).
              </p>
              <LabFormula>Defect density = defects found / KLOC</LabFormula>
              <LabFormula>λ = failures / operational hours</LabFormula>
              <LabFormula>R(t) = e^(−λt) &nbsp;&nbsp;(constant-rate exponential model)</LabFormula>
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
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">KLOC</td><td className="px-3 py-1.5">Kilo-lines of code</td><td className="px-3 py-1.5">Module size in thousands of source lines (12.4 in the sample)</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">λ</td><td className="px-3 py-1.5">Failure intensity</td><td className="px-3 py-1.5">Failures per operational hour</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">t</td><td className="px-3 py-1.5">Mission time</td><td className="px-3 py-1.5">Hours of operation of interest (this lab uses t = 100)</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">R(t)</td><td className="px-3 py-1.5">Reliability</td><td className="px-3 py-1.5">P(no failure in t hours) = e^(−λt)</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">NHPP</td><td className="px-3 py-1.5">Non-homogeneous Poisson process</td><td className="px-3 py-1.5">Failure intensity that changes with time (growth models)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </LabCard>
          <LabCard title="Reliability growth models (Unit 4)">
            <div className="space-y-2 text-sm leading-relaxed text-slate-600">
              <p>
                The Rayleigh model describes defect discovery that rises then falls as testing effort accumulates.
                Jelinski–Moranda assumes a finite fault content N; each fix reduces remaining intensity.
                Goel–Okumoto is an NHPP with exponentially decaying mean-value function. Musa–Okumoto uses a
                logarithmic Poisson intensity that decreases more slowly.
              </p>
              <p>This lab does not execute the product. It only applies the closed-form measures to the sample table.</p>
            </div>
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
              "Open Case Study and read the Payment Gateway sample (size, weekly defects, failures, hours).",
              "Confirm the live formulas for density, λ, and R(100).",
              "Inspect the arrival chart: early weeks versus late weeks.",
              "Open Results for the KPI strip, then answer Exercise items computed from this same sample.",
              "Record the release implication in Conclusion and download the report.",
            ]}
          />
        </LabCard>
      );
    }
    if (section === "simulation") {
      return (
        <div className="space-y-4">
          <LabInfoBox>
            Sample module: {EXP9_MODULE.name}, {EXP9_MODULE.kloc} KLOC, {EXP9_MODULE.failures} failures in{" "}
            {EXP9_MODULE.operationalHours} operational hours. Educational dataset — not a live production feed.
          </LabInfoBox>
          <LabCard title="Weekly defect arrivals">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="pb-2">Week</th>
                  <th>Defects found</th>
                </tr>
              </thead>
              <tbody>
                {EXP9_WEEKS.map((w) => (
                  <tr key={w.week} className="border-t border-slate-200">
                    <td className="py-1.5">{w.week}</td>
                    <td>{w.defects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LabCard>
          <LabCard title="Arrival curve">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={EXP9_WEEKS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="defects" stroke="#2563eb" strokeWidth={2} />
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
            <LabKpiCard label="Defects" value={m.totalDefects} sub={`${EXP9_MODULE.kloc} KLOC`} color="blue" />
            <LabKpiCard label="Density" value={formatNum(m.density)} sub="defects / KLOC" color="indigo" />
            <LabKpiCard label="λ" value={m.lambda.toFixed(3)} sub="failures / hour" color="amber" />
            <LabKpiCard label="R(100)" value={formatNum(m.r100)} sub="exponential model" color="green" />
          </div>
          <LabCard title="Interpretation">
            <p className="text-sm leading-relaxed text-slate-600">
              Arrivals dropped from {m.firstHalf} (weeks 1–5) to {m.secondHalf} (weeks 6–10). Intensity is declining,
              so a late-test growth model is a better story than an early Rayleigh rise. R(100) near 0.5 still warns
              that a 100-hour mission is risky if λ does not keep falling.
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
              Answer from the Payment Gateway sample. Use Try Yourself, Check Answer, and Show Explanation on each card.
            </p>
          </LabCard>
          <LabQuizCards
            questions={EXP9_QUIZ.map((q) => ({
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
        questions={EXP9_CONCLUSION_QUIZ.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          expected: q.answer,
          explain: q.explain,
          options: q.options,
        }))}
        quizTitle="Experiment 9 — Conclusion quiz"
        locked={!exerciseDone}
        lockHint="Complete every question in the Exercise tab, then return here to take the quiz."
        originOptions={[{ value: "sample", label: "Payment Gateway sample" }]}
        footnote="Exercise 9 — Reliability and defect density."
        studentSeed={{ title: "Payment Gateway reliability sample", origin: "sample" }}
        onDownload={async (s, result) => {
          const { downloadUnifiedLabPdf } = await import("@/lib/reportPdf");
          await downloadUnifiedLabPdf({
            experimentNumber: 9,
            experimentTitle: "Reliability & Defect Density",
            names: s.names,
            regs: s.regs,
            projectTitle: s.title,
            origin: s.origin,
            description: s.description,
            toolNote: `Payment Gateway sample (${EXP9_MODULE.kloc} KLOC).`,
            resultLines: [
              `Defects ${m.totalDefects}, density ${m.density.toFixed(2)} /KLOC, λ ${m.lambda.toFixed(3)} /h, R(100) ${m.r100.toFixed(2)}.`,
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
      experimentNumber={9}
      title="Reliability & Defect Density"
      subtitle="Measure density, failure rate, and reliability growth on a sample Payment Gateway test log."
      sections={SECTIONS}
      activeSection={section}
      onSectionChange={setSection}
      badgeIcon={Shield}
    >
      {body}
    </LabPageShell>
  );
}
