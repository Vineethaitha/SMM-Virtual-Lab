import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Calculator,
  ClipboardList,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Target,
  Wrench,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LabPageShell, type LabPageSection } from "@/components/layout/LabPageShell";
import { LabCard, LabFormula, LabInfoBox, LabKpiCard, LabStepList, LabThresholds } from "@/components/lab/LabCard";
import { LabQuizCards } from "@/components/exercise/LabQuizCards";
import { ConclusionQuizGate } from "@/components/quiz/ConclusionQuizGate";
import {
  EXP8_ACTIVITIES,
  EXP8_CONCLUSION_QUIZ,
  EXP8_EFFICIENCY_EVIDENCE,
  EXP8_KINDS,
  EXP8_QUIZ,
  countByKind,
  type MaintenanceKind,
} from "@/data/exp8Data";
import { cn } from "@/lib/utils";

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

export function Exp8Shell() {
  const [section, setSection] = useState<Tab>("aim");
  const [choices, setChoices] = useState<Record<string, MaintenanceKind | "">>(
    Object.fromEntries(EXP8_ACTIVITIES.map((a) => [a.id, ""])),
  );
  const [exerciseDone, setExerciseDone] = useState(false);

  const classified = EXP8_ACTIVITIES.filter((a) => choices[a.id]).length;
  const correct = EXP8_ACTIVITIES.filter((a) => choices[a.id] === a.kind).length;
  const studentKinds = EXP8_ACTIVITIES.map((a) => choices[a.id]).filter(Boolean) as MaintenanceKind[];
  const chart = countByKind(studentKinds);

  const conclusion = useMemo(
    () =>
      `SmartServe’s six-month log was classified into corrective, adaptive, perfective, and preventive work. ${correct} of ${EXP8_ACTIVITIES.length} sample activities were labelled correctly in the simulation. Preventive and maintainability actions (refactoring, documentation policy, automated tests) explain the reported 20% cost reduction and shrinking backlog. The recommended next-semester priority is preventive work, because it lowers future MTTR and backlog more cheaply than repeated corrective firefighting.`,
    [correct],
  );

  const body = (() => {
    if (section === "aim") {
      return (
        <LabCard title="Aim" icon={Target}>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>
              Classify maintenance work on the SmartServe university service system into corrective, adaptive,
              perfective, and preventive types, and relate those types to maintainability and efficiency.
            </p>
            <p>
              Use the six-month case from Class Exercise 8 as a sample simulation, then answer questions from the
              same scenario.
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
              "Identify at least two activities that improve maintainability and name a metric for that improvement.",
              "Separate corrective, adaptive, perfective, and preventive items in the SmartServe log.",
              "Explain why MTTR matters for corrective work and why testing matters for adaptive work.",
              "Suggest a metric for perfective impact and discuss why preventive work is often under-prioritized.",
              "Rank the four types by effort versus value and recommend a strategy for the next semester.",
            ]}
          />
        </LabCard>
      );
    }
    if (section === "theory") {
      return (
        <div className="space-y-4">
          <LabCard title="Four types of software maintenance">
            <p className="mb-3 text-sm leading-relaxed text-slate-600">
              IEEE / ISO maintenance categories describe why a change is made, not how large the patch is.
            </p>
            <LabThresholds
              caption="Laboratory classification used in this experiment:"
              rows={[
                { range: "Corrective", label: "Repair a discovered fault", color: "bg-rose-100 text-rose-800" },
                { range: "Adaptive", label: "Keep working in a new environment", color: "bg-amber-100 text-amber-800" },
                { range: "Perfective", label: "Add or improve capability", color: "bg-blue-100 text-blue-800" },
                { range: "Preventive", label: "Reduce future maintenance cost", color: "bg-emerald-100 text-emerald-800" },
              ]}
            />
          </LabCard>
          <LabCard title="Maintainability and efficiency">
            <div className="space-y-2 text-sm leading-relaxed text-slate-600">
              <LabFormula>MTTR = total repair time / number of corrective incidents</LabFormula>
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
                    <tr className="border-t"><td className="px-3 py-1.5 font-mono">MTTR</td><td className="px-3 py-1.5">Mean Time To Repair</td><td className="px-3 py-1.5">Average clock time from fault report to working fix</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5">Backlog</td><td className="px-3 py-1.5">Open maintenance items</td><td className="px-3 py-1.5">Work still waiting; should fall if preventive work is effective</td></tr>
                    <tr className="border-t"><td className="px-3 py-1.5">IEEE / ISO types</td><td className="px-3 py-1.5">Maintenance category</td><td className="px-3 py-1.5">Why the change is made (fault, environment, capability, or future cost)</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                Maintainability is the ease of changing software later. Documentation, automated tests, and
                refactoring lower MTTR and backlog. Efficiency is observed when cost and pending-issue counts fall
                after those investments.
              </p>
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
              "Read the SmartServe six-month case in Case Study. Each row is one real activity from the exercise brief.",
              "Classify every activity. Hover or open the hint after you choose — the lab does not execute any system.",
              "Open Results to compare your mix against the reference counts and see efficiency evidence.",
              "Complete the Exercise questions. Answers are taken from this same sample, not from another project.",
              "Write a short conclusion and download the PDF report.",
            ]}
          />
        </LabCard>
      );
    }
    if (section === "simulation") {
      return (
        <div className="space-y-4">
          <LabInfoBox>
            Sample case: SmartServe, a web-based university service system in its maintenance phase (Class Exercise 8).
          </LabInfoBox>
          <LabCard title="Classify each activity" icon={Wrench}>
            <div className="space-y-3">
              {EXP8_ACTIVITIES.map((a, i) => (
                <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-sm text-slate-700">
                    <span className="mr-2 font-semibold text-blue-700">{i + 1}.</span>
                    {a.text}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EXP8_KINDS.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setChoices((prev) => ({ ...prev, [a.id]: k.id }))}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium",
                          choices[a.id] === k.id ? k.color + " ring-2 ring-blue-400" : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                  {choices[a.id] && (
                    <p className="mt-2 text-xs text-slate-500">
                      {choices[a.id] === a.kind ? "Matches the reference classification. " : "Reference differs. "}
                      {a.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </LabCard>
          <LabCard title="Efficiency evidence (given in the case)">
            <p className="text-sm text-slate-600">{EXP8_EFFICIENCY_EVIDENCE}</p>
          </LabCard>
        </div>
      );
    }
    if (section === "results") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <LabKpiCard label="Classified" value={`${classified} / ${EXP8_ACTIVITIES.length}`} sub="Sample activities" color="blue" />
            <LabKpiCard label="Matching reference" value={correct} sub="Correct labels" color="green" />
            <LabKpiCard label="Corrective in sample" value={2} sub="Timeout + security patch" color="amber" />
            <LabKpiCard label="Cost change" value="−20%" sub="Backlog also declined" color="indigo" />
          </div>
          <LabCard title="Your classification mix" icon={ListChecks}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </LabCard>
        </div>
      );
    }
    if (section === "exercise") {
      return (
        <div className="space-y-4">
          <LabCard title="Exercise" icon={HelpCircle}>
            <p className="text-sm leading-relaxed text-slate-600">
              Answer from the SmartServe simulation. Use Try Yourself, Check Answer, and Show Explanation on each card.
            </p>
          </LabCard>
          {!classified ? (
            <p className="p-4 text-sm text-muted-foreground">Classify the simulation activities first — questions use that sample.</p>
          ) : (
            <LabQuizCards
              questions={EXP8_QUIZ.map((q) => ({
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
          )}
        </div>
      );
    }
    return (
      <ConclusionQuizGate
        paragraphs={[conclusion]}
        questions={EXP8_CONCLUSION_QUIZ.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          expected: q.answer,
          explain: q.explain,
          options: q.options,
        }))}
        quizTitle="Experiment 8 — Conclusion quiz"
        locked={!exerciseDone}
        lockHint="Complete every question in the Exercise tab, then return here to take the quiz."
        originOptions={[{ value: "sample", label: "SmartServe lab sample" }]}
        footnote="Exercise 8 — Software Maintenance and Metrics."
        studentSeed={{ title: "SmartServe maintenance classification", origin: "sample", description: "Class Exercise 8." }}
        onDownload={async (s, result) => {
          const { downloadUnifiedLabPdf } = await import("@/lib/reportPdf");
          await downloadUnifiedLabPdf({
            experimentNumber: 8,
            experimentTitle: "Software Maintenance Metrics",
            names: s.names,
            regs: s.regs,
            projectTitle: s.title,
            origin: s.origin,
            description: s.description,
            toolNote: "SmartServe six-month maintenance classification (Class Exercise 8).",
            resultLines: [`Simulation labels correct: ${correct} / ${EXP8_ACTIVITIES.length}.`],
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
      experimentNumber={8}
      title="Software Maintenance Metrics"
      subtitle="Classify SmartServe maintenance work and relate it to maintainability, MTTR, and efficiency."
      sections={SECTIONS}
      activeSection={section}
      onSectionChange={setSection}
      badgeIcon={Wrench}
    >
      {body}
    </LabPageShell>
  );
}
