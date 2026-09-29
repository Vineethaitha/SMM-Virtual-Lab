import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Keyboard,
  ListChecks,
  Loader2,
  Maximize,
  Monitor,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabQuizQuestion } from "@/components/exercise/LabQuizCards";
import { CompletionCelebration } from "@/components/quiz/CompletionCelebration";
import { QuizReview, isAnswerCorrect } from "@/components/quiz/QuizReview";
import { setReportQuizAppendix } from "@/lib/reportPdf";
import {
  REPORT_FIELD_CLASS,
  ReportStudentFields,
  type ReportStudentForm,
} from "@/components/lab/ReportForm";
import {
  blockPageSwipes,
  enterFullscreen,
  isExtendedDisplay,
  onDisplayChange,
  releaseQuizLock,
  trapHistory,
} from "@/lib/quizLock";
import { shuffle } from "@/lib/shuffle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/state/AuthContext";

export type FullscreenQuizItem = LabQuizQuestion & {
  caseStudy?: string;
};

type Phase = "gate" | "ask" | "done" | "celebrate" | "abandoned";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type QuizCompletion = {
  kicker: string;
  heading: string;
  message: string;
  next?: { label: string; to: string };
  closeLabel?: string;
};

export function FullscreenQuiz({
  title,
  questions,
  studentSeed,
  originOptions,
  footnote,
  completion,
  onDownload,
  onClose,
}: {
  title: string;
  questions: FullscreenQuizItem[];
  studentSeed?: Partial<ReportStudentForm>;
  originOptions: { value: string; label: string }[];
  footnote?: string;
  completion?: QuizCompletion;
  onDownload: (student: ReportStudentForm, result: { score: number; total: number }) => Promise<void>;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [reviewing, setReviewing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("gate");
  const armedRef = useRef(false);

  const [deck] = useState(() =>
    shuffle(questions).map((q) => ({
      ...q,
      options: q.options?.length ? shuffle(q.options) : q.options,
    })),
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("gate");
  const [failReason, setFailReason] = useState(
    "The session was interrupted. The report cannot be downloaded.",
  );
  const [multiScreen, setMultiScreen] = useState(() => isExtendedDisplay());
  const [starting, setStarting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { profile } = useAuth();
  const [student, setStudent] = useState<ReportStudentForm>({
    names: profile?.full_name || studentSeed?.names || "",
    regs: profile?.registration_number || studentSeed?.regs || "",
    title: studentSeed?.title ?? title,
    origin: studentSeed?.origin ?? "sample",
    github: studentSeed?.github ?? "",
    description: studentSeed?.description ?? "",
  });

  phaseRef.current = phase;

  const total = deck.length;
  const current = deck[index];
  const score = deck.filter((q) => isAnswerCorrect(q, answers[q.id])).length;
  const progress =
    phase === "ask"
      ? ((index + (answers[current?.id ?? ""] ? 0.35 : 0)) / Math.max(total, 1)) * 100
      : phase === "done" || phase === "celebrate"
        ? 100
        : 0;
  const canDownload = phase === "done" && Boolean(student.names.trim() && student.regs.trim());
  const answered = Boolean((answers[current?.id ?? ""] ?? "").trim());

  const abandon = useCallback((reason: string) => {
    if (phaseRef.current === "done" || phaseRef.current === "celebrate" || phaseRef.current === "abandoned") return;
    armedRef.current = false;
    setFailReason(reason);
    setPhase("abandoned");
  }, []);

  useEffect(() => {
    return () => releaseQuizLock();
  }, []);

  useEffect(() => {
    const sync = () => setMultiScreen(isExtendedDisplay());
    sync();
    return onDisplayChange(() => {
      sync();
      if (isExtendedDisplay() && phaseRef.current === "ask") {
        abandon("A second display was detected. Use a single monitor only.");
      }
    });
  }, [abandon]);

  useEffect(() => {
    if (phase !== "ask") {
      armedRef.current = false;
      return;
    }

    const swipeReason = "A trackpad swipe or gesture left the quiz. That voids the attempt.";
    const leaveReason = "The Mac desktop, another app, or another window was shown. That voids the attempt.";

    let lastBeat = performance.now();
    let rafId = 0;

    const armTimer = window.setTimeout(() => {
      armedRef.current = true;
      lastBeat = performance.now();
    }, 900);

    const violate = (reason: string) => {
      if (!armedRef.current) return;
      abandon(reason);
    };

    const onFs = () => {
      if (!document.fullscreenElement) {
        violate("Fullscreen was left. Stay on this screen until every question is answered.");
      }
    };
    const onVis = () => {
      if (document.hidden || document.visibilityState !== "visible") violate(leaveReason);
    };
    const onBlur = () => violate(leaveReason);
    const onPageHide = () => violate("The page was left before the quiz finished.");
    const onFreeze = () => violate(leaveReason);
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F11" || e.metaKey || (e.altKey && e.key === "Tab")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const blockContext = (e: Event) => e.preventDefault();

    const pulse = window.setInterval(() => {
      if (!armedRef.current || phaseRef.current !== "ask") return;
      if (isExtendedDisplay()) {
        abandon("A second display was detected. Use a single monitor only.");
        return;
      }
      if (!document.fullscreenElement) {
        abandon("Fullscreen was left. Stay on this screen until every question is answered.");
        return;
      }
      if (document.hidden || document.visibilityState !== "visible" || !document.hasFocus()) {
        abandon(leaveReason);
      }
    }, 250);

    const beat = (now: number) => {
      if (armedRef.current && phaseRef.current === "ask" && now - lastBeat > 900) {
        abandon(swipeReason);
        return;
      }
      lastBeat = now;
      rafId = window.requestAnimationFrame(beat);
    };
    rafId = window.requestAnimationFrame(beat);

    const releaseHistory = trapHistory();
    const releaseSwipes = rootRef.current
      ? blockPageSwipes(rootRef.current, () => violate(swipeReason))
      : () => undefined;

    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("webkitvisibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("freeze", onFreeze);
    window.addEventListener("keydown", blockKeys, true);
    document.addEventListener("contextmenu", blockContext);
    return () => {
      window.clearTimeout(armTimer);
      window.clearInterval(pulse);
      window.cancelAnimationFrame(rafId);
      releaseHistory();
      releaseSwipes();
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("webkitvisibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("freeze", onFreeze);
      window.removeEventListener("keydown", blockKeys, true);
      document.removeEventListener("contextmenu", blockContext);
    };
  }, [abandon, phase]);

  useEffect(() => {
    if (phase !== "ask") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!current || !(answers[current.id] ?? "").trim()) return;
        if (index + 1 < total) setIndex((i) => i + 1);
        else setPhase("done");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, index, answers, current, total]);

  async function beginQuiz() {
    if (isExtendedDisplay()) {
      setMultiScreen(true);
      return;
    }
    const el = rootRef.current;
    if (!el) return;
    setStarting(true);
    const ok = await enterFullscreen(el);
    setStarting(false);
    if (!ok) {
      abandon("Fullscreen was blocked. Allow fullscreen and start again on a single display.");
      return;
    }
    setPhase("ask");
  }

  function submitCurrent() {
    if (!current || !answered) return;
    if (index + 1 < total) setIndex((i) => i + 1);
    else setPhase("done");
  }

  async function handleDownload() {
    if (!canDownload || downloaded) return;
    setExporting(true);
    setReportQuizAppendix({
      title,
      score,
      total,
      entries: deck.map((q) => ({
        prompt: q.prompt,
        chosen: answers[q.id] ?? "",
        expected: q.expected,
        correct: isAnswerCorrect(q, answers[q.id]),
      })),
    });
    try {
      await onDownload(student, { score, total });
      setDownloaded(true);
      setReviewing(false);
      setPhase("celebrate");
    } finally {
      setReportQuizAppendix(null);
      setExporting(false);
    }
  }

  function goNext() {
    const to = completion?.next?.to;
    leave();
    if (to) navigate(to);
  }

  function leave() {
    releaseQuizLock();
    onClose();
  }

  const statusLabel =
    phase === "gate"
      ? "Not started"
      : phase === "ask"
        ? `Question ${index + 1} of ${total}`
        : reviewing
          ? "Answer review"
          : phase === "abandoned"
            ? "Voided"
            : "Submitted";

  return (
    <div ref={rootRef} className="fixed inset-0 z-[80] flex flex-col bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-background to-background" />

      <header className="relative border-b border-border/60 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 sm:flex">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">21CSC403T · Assessment</p>
              <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold tabular-nums",
              phase === "abandoned"
                ? "border-red-200 bg-red-50 text-red-700"
                : phase === "done" || phase === "celebrate"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-border bg-white text-foreground/70",
            )}
          >
            {statusLabel}
          </span>
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className={cn(
              "h-full transition-all duration-300",
              phase === "abandoned" ? "bg-red-400" : phase === "done" || phase === "celebrate" ? "bg-emerald-500" : "bg-primary",
            )}
            style={{ width: `${Math.min(100, Math.max(phase === "gate" ? 0 : 2, progress))}%` }}
          />
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          {phase === "gate" && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl shadow-primary/5">
              <div className="border-b border-border/60 px-6 py-5 sm:px-8">
                <h3 className="text-2xl font-bold tracking-tight">Before you start</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {total} questions. The quiz opens in fullscreen and stays there until you submit.
                </p>
              </div>
              <ul className="space-y-3 px-6 py-5 text-sm sm:px-8">
                {[
                  { icon: Monitor, text: "Use one monitor. Disconnect any external display before you begin." },
                  { icon: Maximize, text: "Don't leave fullscreen or switch to another app, window or desktop." },
                  { icon: Keyboard, text: "Command-Tab, Mission Control and three-finger swipes count as leaving." },
                  { icon: ShieldAlert, text: "If you leave, the attempt is voided and the report can't be downloaded." },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="pt-1.5 leading-relaxed text-foreground/80">{text}</span>
                  </li>
                ))}
              </ul>
              {multiScreen ? (
                <p className="mx-6 mb-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-8">
                  <Monitor className="mt-0.5 h-4 w-4 shrink-0" />
                  A second display is connected. Disconnect it or turn it off, then press Check displays.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2.5 border-t border-border/60 bg-slate-50/70 px-6 py-4 sm:px-8">
                <Button
                  size="lg"
                  className="rounded-full px-6 shadow-lg shadow-primary/20"
                  disabled={starting || multiScreen}
                  onClick={() => void beginQuiz()}
                >
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {starting ? "Entering fullscreen…" : "Start quiz"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-white"
                  onClick={() => setMultiScreen(isExtendedDisplay())}
                >
                  Check displays
                </Button>
                <Button size="lg" variant="ghost" className="rounded-full text-muted-foreground" onClick={leave}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {phase === "abandoned" && (
            <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-xl shadow-red-500/5 sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-2xl font-bold tracking-tight">Attempt voided</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">{failReason}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The report can't be downloaded for this attempt. Go back to the lab and start the quiz again.
              </p>
              <Button className="mt-6 rounded-full px-6" onClick={leave}>
                Back to lab
              </Button>
            </div>
          )}

          {phase === "ask" && current && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  {current.options?.length ? "Multiple choice" : "Numerical answer"}
                </span>
                {current.caseStudy ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">Case study</span>
                ) : null}
              </div>

              {current.caseStudy && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm leading-relaxed text-amber-950">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">Case study</p>
                  {current.caseStudy}
                </div>
              )}

              <h3 className="text-2xl font-bold leading-snug tracking-tight sm:text-[1.65rem]">{current.prompt}</h3>

              {current.options?.length ? (
                <div className="space-y-2.5">
                  {current.options.map((opt, i) => {
                    const selected = answers[current.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [current.id]: opt }))}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left text-sm shadow-sm transition",
                          selected
                            ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20"
                            : "border-border/70 hover:border-primary/40 hover:bg-blue-50/40",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                            selected ? "bg-primary text-white" : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {LETTERS[i] ?? i + 1}
                        </span>
                        <span className={cn("pt-0.5 leading-relaxed", selected ? "font-medium text-foreground" : "text-foreground/85")}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  className={cn(
                    REPORT_FIELD_CLASS,
                    "h-12 rounded-xl bg-white text-base text-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/15",
                  )}
                  value={answers[current.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
                  placeholder="Enter a number"
                  inputMode="decimal"
                />
              )}
            </div>
          )}

          {(phase === "done" || phase === "celebrate") && reviewing && (
            <QuizReview
              deck={deck}
              answers={answers}
              onBack={() => setReviewing(false)}
              backLabel={phase === "done" ? "Back to report" : "Back"}
            />
          )}

          {phase === "done" && !reviewing && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-xl shadow-primary/5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-gradient-to-br from-blue-50 to-white px-6 py-5 sm:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Quiz submitted</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
                    {score} <span className="text-lg font-semibold text-muted-foreground">/ {total}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Download the report to complete this lab.
                  </p>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200">
                    <Check className="h-3.5 w-3.5" />
                    {score} correct
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-red-700 ring-1 ring-red-200">
                    <X className="h-3.5 w-3.5" />
                    {total - score} wrong
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReviewing(true)}
                className="group flex w-full items-center gap-3 border-b border-border/60 px-6 py-3.5 text-left transition hover:bg-blue-50/50 sm:px-8"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ListChecks className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">Review your answers</span>
                  <span className="block text-xs text-muted-foreground">
                    Each question with your answer and the correct one.
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>

              <div className="space-y-5 px-6 py-6 sm:px-8">
                <ReportStudentFields
                  form={student}
                  lockIdentity
                  disabled={downloaded}
                  onChange={(key, value) => {
                    if (downloaded || key === "names" || key === "regs") return;
                    setStudent((f) => ({ ...f, [key]: value }));
                  }}
                  originOptions={originOptions}
                  footnote={footnote}
                />

                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  The report includes your score and a list of every question with your answer. You can download it
                  again later from the lab page.
                </p>

                <Button
                  size="lg"
                  className="h-12 w-full rounded-full text-base shadow-lg shadow-primary/20"
                  disabled={!canDownload || exporting || downloaded}
                  onClick={() => void handleDownload()}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {exporting ? "Preparing PDF…" : "Download report"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {phase === "celebrate" && !reviewing && (
        <CompletionCelebration
          kicker={completion?.kicker ?? "Assessment complete"}
          heading={completion?.heading ?? "Well done!"}
          message={completion?.message ?? "Your report has been downloaded."}
          score={score}
          total={total}
          primaryLabel={completion?.next?.label}
          onPrimary={completion?.next ? goNext : undefined}
          onReview={() => setReviewing(true)}
          onClose={leave}
          closeLabel={completion?.closeLabel}
        />
      )}

      {phase === "ask" && current && (
        <div className="relative border-t border-border/60 bg-white/90 px-5 py-4 backdrop-blur sm:px-8">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
            <p className="hidden text-xs text-muted-foreground sm:block">
              Press Enter to continue. Leaving fullscreen voids the attempt.
            </p>
            <Button
              size="lg"
              className="ml-auto min-w-[10rem] rounded-full shadow-lg shadow-primary/20"
              disabled={!answered}
              onClick={submitCurrent}
            >
              {index + 1 < total ? "Next question" : "Submit quiz"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
