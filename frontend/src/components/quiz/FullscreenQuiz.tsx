import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabQuizQuestion } from "@/components/exercise/LabQuizCards";
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

export type FullscreenQuizItem = LabQuizQuestion & {
  caseStudy?: string;
};

type Phase = "gate" | "ask" | "done" | "abandoned";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function FullscreenQuiz({
  title,
  questions,
  studentSeed,
  originOptions,
  footnote,
  onDownload,
  onClose,
}: {
  title: string;
  questions: FullscreenQuizItem[];
  studentSeed?: Partial<ReportStudentForm>;
  originOptions: { value: string; label: string }[];
  footnote?: string;
  onDownload: (student: ReportStudentForm, result: { score: number; total: number }) => Promise<void>;
  onClose: () => void;
}) {
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
  const [student, setStudent] = useState<ReportStudentForm>({
    names: studentSeed?.names ?? "",
    regs: studentSeed?.regs ?? "",
    title: studentSeed?.title ?? title,
    origin: studentSeed?.origin ?? "sample",
    github: studentSeed?.github ?? "",
    description: studentSeed?.description ?? "",
  });

  phaseRef.current = phase;

  const total = deck.length;
  const current = deck[index];
  const score = deck.filter((q) => (answers[q.id] ?? "").trim().toLowerCase() === q.expected.trim().toLowerCase()).length;
  const progress =
    phase === "ask" ? ((index + (answers[current?.id ?? ""] ? 0.35 : 0)) / Math.max(total, 1)) * 100 : phase === "done" ? 100 : 0;
  const canDownload = phase === "done" && Boolean(student.names.trim() && student.regs.trim());
  const answered = Boolean((answers[current?.id ?? ""] ?? "").trim());

  const abandon = useCallback((reason: string) => {
    if (phaseRef.current === "done" || phaseRef.current === "abandoned") return;
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
    if (!canDownload) return;
    setExporting(true);
    try {
      await onDownload(student, { score, total });
      setDownloaded(true);
    } finally {
      setExporting(false);
    }
  }

  function leave() {
    releaseQuizLock();
    onClose();
  }

  return (
    <div ref={rootRef} className="fixed inset-0 z-[80] flex flex-col bg-[#07111f] text-white">
      <div className="h-1.5 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-blue-400 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(phase === "gate" ? 4 : 4, progress))}%` }}
        />
      </div>

      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
            21CSC403T · Locked assessment
          </p>
          <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        </div>
        <div className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80">
          {phase === "gate"
            ? "Ready"
            : phase === "ask"
              ? `${index + 1} / ${total}`
              : phase === "done"
                ? downloaded
                  ? "Report ready"
                  : "Quiz complete"
                : "Voided"}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          {phase === "gate" && (
            <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <h3 className="text-2xl font-semibold tracking-tight">Single-screen lock</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/75">
                <li>Use exactly one monitor. Disconnect or turn off any extra display first.</li>
                <li>The quiz fills this display. Do not switch apps, desktops, or browser windows.</li>
                <li>Command-Tab, Mission Control, and three-finger trackpad swipes also void the report.</li>
                <li>Leaving fullscreen, changing focus, or adding a second screen voids the report.</li>
              </ul>
              {multiScreen ? (
                <p className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  A second display is connected. Unplug it (or turn it off), then press Check displays.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-amber-400 text-slate-950 hover:bg-amber-300"
                  disabled={starting || multiScreen}
                  onClick={() => void beginQuiz()}
                >
                  {starting ? "Entering fullscreen…" : "Begin locked quiz"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={() => setMultiScreen(isExtendedDisplay())}
                >
                  Check displays
                </Button>
                <Button size="lg" variant="ghost" className="text-white/70" onClick={leave}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {phase === "abandoned" && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-950/40 p-6 shadow-2xl">
              <ShieldAlert className="mb-3 h-8 w-8 text-rose-200" />
              <p className="text-xl font-semibold text-rose-50">Attempt voided</p>
              <p className="mt-2 text-sm leading-relaxed text-rose-100/80">{failReason}</p>
              <p className="mt-2 text-sm text-rose-100/70">
                The report cannot be downloaded. Return to the lab and start again on a single screen.
              </p>
              <Button className="mt-5 bg-white text-slate-900 hover:bg-slate-100" onClick={leave}>
                Back to lab
              </Button>
            </div>
          )}

          {phase === "ask" && current && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-blue-100">
                  {current.options?.length ? "Multiple choice" : "Numerical"}
                </span>
                {current.caseStudy ? (
                  <span className="rounded-full bg-amber-400/15 px-2.5 py-1 font-medium text-amber-200">Case study</span>
                ) : null}
              </div>

              {current.caseStudy && (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-5 text-sm leading-relaxed text-amber-50">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Case study</p>
                  {current.caseStudy}
                </div>
              )}

              <h3 className="text-2xl font-semibold leading-snug tracking-tight sm:text-[1.7rem]">{current.prompt}</h3>

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
                          "flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition",
                          selected
                            ? "border-amber-300 bg-amber-400/15 text-white shadow-[0_0_0_1px_rgba(252,211,77,0.35)]"
                            : "border-white/10 bg-white/[0.04] text-white/90 hover:border-blue-300/40 hover:bg-white/[0.08]",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            selected ? "bg-amber-400 text-slate-950" : "bg-white/10 text-white/70",
                          )}
                        >
                          {LETTERS[i] ?? i + 1}
                        </span>
                        <span className="pt-0.5 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  className={cn(REPORT_FIELD_CLASS, "h-12 bg-white text-base text-slate-900")}
                  value={answers[current.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
                  placeholder="Enter a number"
                />
              )}
            </div>
          )}

          {phase === "done" && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white text-slate-800 shadow-2xl">
              <div className="bg-[#0b1b33] px-6 py-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">Assessment complete</p>
                <p className="mt-1 text-2xl font-semibold">
                  Score {score} / {total}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Enter your details, then download the report. Do not leave this screen before the PDF is saved.
                </p>
              </div>

              <div className="space-y-5 px-6 py-6">
                <ReportStudentFields
                  form={student}
                  onChange={(key, value) => setStudent((f) => ({ ...f, [key]: value }))}
                  originOptions={originOptions}
                  footnote={footnote}
                />

                {downloaded ? (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    Report downloaded. You can return to the lab now.
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Name and registration number are required. The PDF uses the same 21CSC403T layout as Experiment 1.
                  </p>
                )}

                <Button
                  size="lg"
                  className="h-12 w-full bg-blue-700 text-base hover:bg-blue-800"
                  disabled={!canDownload || exporting}
                  onClick={() => void handleDownload()}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {exporting ? "Preparing PDF…" : downloaded ? "Download report again" : "Download report"}
                </Button>

                <Button variant="ghost" className="w-full text-slate-500" disabled={!downloaded} onClick={leave}>
                  {downloaded ? "Return to lab" : "Download the report to continue"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {phase === "ask" && current && (
        <div className="border-t border-white/10 bg-[#0a1628]/95 px-5 py-4 backdrop-blur sm:px-8">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
            <p className="text-xs text-white/45">Single screen only. Switching windows voids the report.</p>
            <Button
              size="lg"
              className="min-w-[10rem] bg-amber-400 text-slate-950 hover:bg-amber-300"
              disabled={!answered}
              onClick={submitCurrent}
            >
              {index + 1 < total ? "Next question" : "Finish quiz"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
