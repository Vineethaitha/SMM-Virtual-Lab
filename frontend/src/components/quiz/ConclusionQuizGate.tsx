import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Award, CheckCircle2, FileText, ListChecks, Lock, Monitor } from "lucide-react";
import { SavedReportButton } from "@/components/quiz/SavedReportButton";
import { Button } from "@/components/ui/button";
import { LabCard } from "@/components/lab/LabCard";
import { FullscreenQuiz, type FullscreenQuizItem, type QuizCompletion } from "@/components/quiz/FullscreenQuiz";
import { LAB_COUNT, useLabProgress } from "@/lib/useLabProgress";
import type { ReportStudentForm } from "@/components/lab/ReportForm";
import { FINAL_LAB_QUIZ } from "@/data/finalLabQuiz";
import { downloadCompletionCertificate, takeLastReport } from "@/lib/reportPdf";
import { type LabKey, upsertLabProgress } from "@/lib/labProgress";
import { useAuth } from "@/state/AuthContext";

export function ConclusionQuizGate({
  labKey,
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
  labKey: LabKey;
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
  const { profile } = useAuth();
  const { byKey } = useLabProgress();
  const row = byKey(labKey);
  const saved = Boolean(row?.report_downloaded_at && row.report_payload);

  useEffect(() => {
    if (locked === false) void upsertLabProgress(labKey, { exercise: true });
  }, [locked, labKey]);

  const mergedSeed = useMemo(
    () => ({
      ...studentSeed,
      names: studentSeed?.names || profile?.full_name || "",
      regs: studentSeed?.regs || profile?.registration_number || "",
    }),
    [studentSeed, profile?.full_name, profile?.registration_number],
  );

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
        {saved && row ? (
          <CompletedPanel labKey={labKey} score={row.quiz_score} total={row.quiz_total} issuedAt={row.report_downloaded_at} />
        ) : (
          <>
            <ul className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <li className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <ListChecks className="h-4 w-4 shrink-0 text-primary" />
                {questions.length} questions
              </li>
              <li className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <Monitor className="h-4 w-4 shrink-0 text-primary" />
                Fullscreen, one monitor
              </li>
              <li className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                Report PDF at the end
              </li>
            </ul>
            {locked ? (
              <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                {lockHint ?? "Finish every question in the Exercise tab to unlock the quiz."}
              </p>
            ) : (
              <p className="mb-4 flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Exercise done. You can start the quiz.
              </p>
            )}
            <Button
              size="lg"
              className="rounded-full px-6"
              disabled={locked || questions.length === 0}
              onClick={() => setOpen(true)}
            >
              {locked ? <Lock className="h-4 w-4" /> : null}
              Start quiz
            </Button>
          </>
        )}
        {extraAction ? <div className="mt-4">{extraAction}</div> : null}
      </LabCard>
      {open && (
        <FullscreenQuiz
          title={quizTitle}
          questions={questions}
          studentSeed={mergedSeed}
          originOptions={originOptions}
          footnote={footnote}
          completion={completionFor(labKey)}
          onDownload={async (student, result) => {
            await onDownload(student, result);
            await upsertLabProgress(labKey, {
              quizScore: result.score,
              quizTotal: result.total,
              report: true,
              reportPayload: takeLastReport(),
            });
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function CompletedPanel({
  labKey,
  score,
  total,
  issuedAt,
}: {
  labKey: LabKey;
  score: number | null;
  total: number | null;
  issuedAt: string | null;
}) {
  const date = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/70">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-900">
            {labKey === "final" ? "Final assessment completed" : "Experiment completed"}
          </p>
          <p className="text-xs text-emerald-800/80">
            {score != null && total != null ? `Quiz score ${score} / ${total}` : "Quiz submitted"}
            {date ? ` · Issued ${date}` : ""}
          </p>
        </div>
        <SavedReportButton labKey={labKey} label={labKey === "final" ? "Download certificate again" : undefined} />
      </div>
      <p className="border-t border-emerald-200/70 bg-white/60 px-5 py-2.5 text-xs text-slate-500">
        This is the same report you downloaded after the quiz, with the same score and date.
      </p>
    </div>
  );
}

function completionFor(labKey: LabKey): QuizCompletion {
  const n = Number(labKey);
  if (n >= LAB_COUNT) {
    return {
      kicker: `Experiment ${n} · Completed`,
      heading: "All experiments done",
      message: "Your report has been downloaded. The final quiz is now open, below this lab and on the home page.",
    };
  }
  return {
    kicker: `Experiment ${n} · Completed`,
    heading: "Experiment complete",
    message: `Your report has been downloaded. Experiment ${n + 1} is now open.`,
    next: { label: `Start Experiment ${n + 1}`, to: `/lab/${n + 1}` },
  };
}

export function FinalLabQuizButton({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const { finalUnlocked, completedCount, byKey } = useLabProgress();
  const finalRow = byKey("final");
  if (finalRow?.report_downloaded_at && finalRow.report_payload && !open) {
    return compact ? (
      <SavedReportButton labKey="final" label="Download certificate again" className="rounded-xl" />
    ) : (
      <CompletedPanel
        labKey="final"
        score={finalRow.quiz_score}
        total={finalRow.quiz_total}
        issuedAt={finalRow.report_downloaded_at}
      />
    );
  }
  return (
    <>
      <Button
        variant={compact ? "default" : "secondary"}
        size={compact ? "default" : "lg"}
        className={compact ? "rounded-xl" : "rounded-full px-6"}
        disabled={!finalUnlocked}
        onClick={() => setOpen(true)}
      >
        {finalUnlocked ? null : <Lock className="h-4 w-4" />}
        Take the final quiz (40 questions)
      </Button>
      {!compact ? (
        <p className="mt-2 text-xs text-slate-500">
          {finalUnlocked
            ? "Questions from Experiments 1–10, in random order. Runs in fullscreen until you submit."
            : `Unlocks after all ten experiments are completed (${completedCount} / ${LAB_COUNT} done).`}
        </p>
      ) : null}
      {open && (
        <FullscreenQuiz
          title="Final quiz: Experiments 1–10"
          completion={{
            kicker: "21CSC403T · Course complete",
            heading: "Course labs complete",
            message: "Your certificate has been downloaded. You have finished all ten experiments and the final quiz.",
            closeLabel: "Close",
          }}
          questions={FINAL_LAB_QUIZ}
          studentSeed={{
            title: "Comprehensive lab assessment",
            origin: "sample",
            description: "40-question shuffled assessment across Experiments 1-10.",
            names: profile?.full_name ?? "",
            regs: profile?.registration_number ?? "",
          }}
          originOptions={[{ value: "sample", label: "Virtual lab (all experiments)" }]}
          footnote="Final assessment — 21CSC403T."
          onDownload={async (student, result) => {
            await downloadCompletionCertificate({
              names: student.names,
              regs: student.regs,
              score: result.score,
              total: result.total,
            });
            await upsertLabProgress("final", {
              exercise: true,
              quizScore: result.score,
              quizTotal: result.total,
              report: true,
              reportPayload: takeLastReport(),
            });
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
