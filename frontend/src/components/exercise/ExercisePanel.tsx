import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLab } from "@/state/LabContext";

type Mode = "try" | "checked" | "explain";

export function ExercisePanel() {
  const { analysis, baseline } = useLab();
  const [mode, setMode] = useState<Record<string, Mode>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const qs = useMemo(() => {
    if (!analysis) return [];
    const hardest = [...analysis.functions].sort((a, b) => b.cc - a.cc)[0];
    const named = hardest?.name ?? "—";
    return [
      {
        id: "loc",
        prompt: "What is the physical LOC of the current module (Radon loc)?",
        kind: "number" as const,
        expected: String(analysis.loc.loc),
        explain: `Radon raw.analyze reports loc = ${analysis.loc.loc} (SLOC ${analysis.loc.sloc}, LLOC ${analysis.loc.lloc}, comments ${analysis.loc.comments}, blank ${analysis.loc.blank}).`,
      },
      {
        id: "cc",
        prompt: `What is the cyclomatic complexity of ${named}?`,
        kind: "number" as const,
        expected: hardest ? String(hardest.cc) : "0",
        explain: hardest
          ? `${named} has CC ${hardest.cc} (rank ${hardest.rank}). McCabe counts independent paths from predicates in the AST.`
          : "Analyze a module that contains functions.",
      },
      {
        id: "hardest",
        prompt: "Which function is the most complex (highest CC)?",
        kind: "text" as const,
        expected: named,
        explain: `Sort functions by CC. ${named} is highest. Nested if/elif chains are the usual cause.`,
      },
      {
        id: "halstead",
        prompt: "Is Halstead effort (E) volume × difficulty? (yes/no)",
        kind: "text" as const,
        expected: "yes",
        explain: `E = D × V. Here V = ${analysis.halstead.volume.toFixed(1)}, D = ${analysis.halstead.difficulty.toFixed(2)}, E = ${analysis.halstead.effort.toFixed(1)}.`,
      },
      {
        id: "refactor",
        prompt: "After refactoring nested conditions, did you re-analyze? Type done.",
        kind: "text" as const,
        expected: "done",
        explain: "Extract helpers or use early returns, then Analyze Again so CC, volume, and MI update.",
      },
      {
        id: "compare",
        prompt: "Did Maintainability Index increase after your refactor vs baseline? (yes/no/na)",
        kind: "text" as const,
        expected: baseline
          ? analysis.maintainability.mi >= baseline.maintainability.mi
            ? "yes"
            : "no"
          : "na",
        explain: baseline
          ? `Baseline MI ${baseline.maintainability.mi} → current ${analysis.maintainability.mi}.`
          : "Save Baseline first, then compare. If you have no baseline yet, the answer is na.",
      },
    ];
  }, [analysis, baseline]);

  if (!analysis) {
    return <p className="p-4 text-sm text-muted-foreground">Analyze code before answering exercise questions. Answers use live Radon results.</p>;
  }

  return (
    <div className="space-y-3 p-3">
      {qs.map((q) => {
        const m = mode[q.id] ?? "try";
        const given = (answers[q.id] ?? "").trim().toLowerCase();
        const ok =
          q.kind === "number"
            ? Math.abs(Number(given) - Number(q.expected)) < 0.51
            : given === q.expected.toLowerCase();
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle>{q.prompt}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-sm"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Your answer"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setMode((m) => ({ ...m, [q.id]: "try" }))}>
                  Try Yourself
                </Button>
                <Button size="sm" onClick={() => setMode((m) => ({ ...m, [q.id]: "checked" }))}>
                  Check Answer
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMode((m) => ({ ...m, [q.id]: "explain" }))}>
                  Show Explanation
                </Button>
              </div>
              {m === "checked" && (
                <p className={ok ? "text-sm text-emerald-300" : "text-sm text-red-300"}>
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
