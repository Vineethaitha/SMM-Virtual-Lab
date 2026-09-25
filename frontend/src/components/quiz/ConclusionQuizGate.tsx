import { useState, type ReactNode } from "react";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabCard } from "@/components/lab/LabCard";
import { FullscreenQuiz, type FullscreenQuizItem } from "@/components/quiz/FullscreenQuiz";
import type { ReportStudentForm } from "@/components/lab/ReportForm";
import { FINAL_LAB_QUIZ } from "@/data/finalLabQuiz";
import { downloadUnifiedLabPdf } from "@/lib/reportPdf";

export function ConclusionQuizGate({
  paragraphs,
  questions,
  quizTitle,
  locked,
  lockHint,
  originOptions,
  footnote,
  studentSeed,
  extraAction,
  onDownload,
}: {
  paragraphs: string[];
  questions: FullscreenQuizItem[];
  quizTitle: string;
  locked?: boolean;
  lockHint?: string;
  originOptions: { value: string; label: string }[];
  footnote?: string;
  studentSeed?: Partial<ReportStudentForm>;
  extraAction?: ReactNode;
  onDownload: (student: ReportStudentForm, result: { score: number; total: number }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <LabCard title="Conclusion" icon={Award}>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          {paragraphs.map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
        </div>
      </LabCard>
      <LabCard title="Assessment">
        <p className="mb-3 text-sm text-slate-600">
          You can take this quiz only after you finish the Exercise tab — check every exercise question
          first. Use a single monitor. The quiz locks to one screen; switching windows, apps, or adding
          another display voids the report. Name, registration number, and the PDF appear only at the end.
        </p>
        {locked ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {lockHint ?? "Complete every question in the Exercise tab, then return here to unlock the quiz."}
          </p>
        ) : (
          <p className="mb-4 text-sm text-emerald-800">Exercise complete. You can start the quiz.</p>
        )}
        <Button size="lg" disabled={locked || questions.length === 0} onClick={() => setOpen(true)}>
          Take quiz and download report
        </Button>
        {extraAction ? <div className="mt-4">{extraAction}</div> : null}
      </LabCard>
      {open && (
        <FullscreenQuiz
          title={quizTitle}
          questions={questions}
          studentSeed={studentSeed}
          originOptions={originOptions}
          footnote={footnote}
          onDownload={onDownload}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function FinalLabQuizButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => setOpen(true)}>
        Take comprehensive lab quiz (40 questions)
      </Button>
      <p className="mt-2 text-xs text-slate-500">
        Covers Experiments 1–10. Questions and options are shuffled. Fullscreen until you finish.
      </p>
      {open && (
        <FullscreenQuiz
          title="21CSC403T comprehensive assessment"
          questions={FINAL_LAB_QUIZ}
          studentSeed={{
            title: "Comprehensive lab assessment",
            origin: "sample",
            description: "40-question shuffled assessment across Experiments 1-10.",
          }}
          originOptions={[{ value: "sample", label: "Virtual lab (all experiments)" }]}
          footnote="Final assessment — 21CSC403T."
          onDownload={async (student, result) => {
            await downloadUnifiedLabPdf({
              experimentNumber: 10,
              experimentTitle: "Comprehensive lab assessment",
              names: student.names,
              regs: student.regs,
              projectTitle: student.title,
              origin: student.origin,
              description: student.description,
              toolNote: "Browser virtual lab. Forty shuffled items spanning size, test management, FPA, surveys, OO, requirements, maintenance, reliability, and process capability.",
              resultLines: [`Comprehensive quiz score ${result.score} / ${result.total}.`],
              analysisLines: [
                "Items include MCQs, numericals, and new case studies (MediSlot, RideNow, CampusLearn, civic reporting, ShopLite) that are not copies of the in-lab samples.",
              ],
              conclusion:
                "The student completed the end-of-course assessment under fullscreen conditions. Leaving fullscreen before the last item voids the report.",
              quizScore: result.score,
              quizTotal: result.total,
            });
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
