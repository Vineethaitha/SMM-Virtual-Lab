import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shuffle } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

export interface LabQuizQuestion {
  id: string;
  prompt: string;
  expected: string;
  explain: string;
  kind?: "number" | "text";
  options?: string[];
}

type Mode = "try" | "checked" | "explain";

export interface LabQuizStatus {
  checked: number;
  correct: number;
  total: number;
  allChecked: boolean;
}

function isMatch(given: string, expected: string, kind: "number" | "text") {
  const g = given.trim().toLowerCase();
  const e = expected.trim().toLowerCase();
  if (!g) return false;
  if (kind === "number") return Math.abs(Number(g) - Number(e)) < 0.51;
  return g === e;
}

export function LabQuizCards({
  questions,
  onStatusChange,
}: {
  questions: LabQuizQuestion[];
  onStatusChange?: (status: LabQuizStatus) => void;
}) {
  const [deck] = useState(() =>
    shuffle(questions).map((q) => ({
      ...q,
      options: q.options?.length ? shuffle(q.options) : q.options,
    })),
  );
  const [mode, setMode] = useState<Record<string, Mode>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const lastStatus = useRef("");

  useEffect(() => {
    const total = deck.length;
    const checked = deck.filter((q) => mode[q.id] === "checked" || mode[q.id] === "explain").length;
    const correct = deck.filter((q) =>
      isMatch(answers[q.id] ?? "", q.expected, q.kind ?? "text"),
    ).length;
    const status = { checked, correct, total, allChecked: total > 0 && checked === total };
    const key = JSON.stringify(status);
    if (lastStatus.current === key) return;
    lastStatus.current = key;
    onStatusChange?.(status);
  }, [answers, deck, mode, onStatusChange]);

  if (!deck.length) {
    return <p className="p-4 text-sm text-muted-foreground">No questions yet.</p>;
  }

  return (
    <div className="space-y-3">
      {deck.map((q) => {
        const m = mode[q.id] ?? "try";
        const given = answers[q.id] ?? "";
        const ok = isMatch(given, q.expected, q.kind ?? "text");
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base leading-snug">{q.prompt}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options?.length ? (
                <div className="space-y-1.5">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                        given === opt
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300",
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        className="mt-0.5"
                        checked={given === opt}
                        onChange={() => {
                          setAnswers((a) => ({ ...a, [q.id]: opt }));
                          setMode((prev) => ({ ...prev, [q.id]: "try" }));
                        }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-sm"
                  value={given}
                  onChange={(e) => {
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }));
                    setMode((prev) => ({ ...prev, [q.id]: "try" }));
                  }}
                  placeholder="Enter a number"
                />
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setMode((prev) => ({ ...prev, [q.id]: "try" }))}>
                  Try Yourself
                </Button>
                <Button size="sm" onClick={() => setMode((prev) => ({ ...prev, [q.id]: "checked" }))}>
                  Check Answer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMode((prev) => ({ ...prev, [q.id]: "explain" }))}>
                  Show Explanation
                </Button>
              </div>
              {m === "checked" && (
                <p className={ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
                  {ok ? "Correct." : `Not quite. Expected ${q.expected}.`}
                </p>
              )}
              {m === "explain" && <p className="text-xs text-muted-foreground">{q.explain}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
