import { useMemo, useState } from "react";
import { ArrowLeft, Check, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FullscreenQuizItem } from "@/components/quiz/FullscreenQuiz";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Filter = "all" | "wrong" | "right";

export function isAnswerCorrect(q: FullscreenQuizItem, answer: string | undefined) {
  return (answer ?? "").trim().toLowerCase() === q.expected.trim().toLowerCase();
}

export function QuizReview({
  deck,
  answers,
  onBack,
  backLabel = "Back",
}: {
  deck: FullscreenQuizItem[];
  answers: Record<string, string>;
  onBack: () => void;
  backLabel?: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const results = useMemo(
    () => deck.map((q, i) => ({ q, i, answer: answers[q.id] ?? "", right: isAnswerCorrect(q, answers[q.id]) })),
    [deck, answers],
  );
  const rightCount = results.filter((r) => r.right).length;
  const shown = results.filter((r) => (filter === "all" ? true : filter === "right" ? r.right : !r.right));

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: results.length },
    { id: "wrong", label: "Wrong", count: results.length - rightCount },
    { id: "right", label: "Correct", count: rightCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Answer review</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight">
            {rightCount} of {results.length} correct
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Your answer and the correct answer for each question.</p>
        </div>
        <Button variant="outline" className="rounded-full bg-white" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
      </div>

      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {results.map((r) => (
          <div key={r.q.id} className={cn("h-full flex-1", r.right ? "bg-emerald-500" : "bg-red-400")} />
        ))}
      </div>

      <div className="inline-flex rounded-full border border-border/60 bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              filter === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label} <span className="ml-1 tabular-nums opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-8 text-center text-sm text-muted-foreground">
          No questions in this list.
        </p>
      ) : null}

      <div className="space-y-4">
        {shown.map(({ q, i, answer, right }) => (
          <article key={q.id} className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
            <header
              className={cn(
                "flex items-center justify-between gap-3 border-b px-5 py-3",
                right ? "border-emerald-100 bg-emerald-50/50" : "border-red-100 bg-red-50/50",
              )}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-foreground ring-1 ring-border">
                  Q{i + 1}
                </span>
                <span>{q.options?.length ? "Multiple choice" : "Numerical"}</span>
                {q.caseStudy ? <span className="text-amber-700">· Case study</span> : null}
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  right ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                )}
              >
                {right ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                {right ? "Correct" : "Wrong"}
              </span>
            </header>

            <div className="space-y-4 px-5 py-5">
              {q.caseStudy ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-amber-950">
                  {q.caseStudy}
                </p>
              ) : null}
              <p className="text-base font-semibold leading-snug">{q.prompt}</p>

              {q.options?.length ? (
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isExpected = opt.trim().toLowerCase() === q.expected.trim().toLowerCase();
                    const isChosen = opt === answer;
                    return (
                      <div
                        key={opt}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-sm",
                          isExpected
                            ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                            : isChosen
                              ? "border-red-300 bg-red-50 text-red-950"
                              : "border-border/60 text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            isExpected
                              ? "bg-emerald-500 text-white"
                              : isChosen
                                ? "bg-red-500 text-white"
                                : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {isExpected ? <Check className="h-3.5 w-3.5" /> : isChosen ? <X className="h-3.5 w-3.5" /> : LETTERS[oi]}
                        </span>
                        <span className="flex-1 pt-0.5 leading-relaxed">{opt}</span>
                        {isChosen || isExpected ? (
                          <span
                            className={cn(
                              "shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide",
                              isExpected ? "text-emerald-700" : "text-red-700",
                            )}
                          >
                            {isChosen ? "Your answer" : "Correct answer"}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3",
                      right ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50",
                    )}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your answer</p>
                    <p className={cn("mt-1 text-lg font-bold", right ? "text-emerald-800" : "text-red-800")}>
                      {answer || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Correct answer</p>
                    <p className="mt-1 text-lg font-bold text-emerald-800">{q.expected}</p>
                  </div>
                </div>
              )}

              {q.explain ? (
                <div className="flex gap-2.5 rounded-xl bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-950">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p>{q.explain}</p>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
