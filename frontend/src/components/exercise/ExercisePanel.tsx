import { useMemo } from "react";
import { LabQuizCards } from "@/components/exercise/LabQuizCards";
import { useLab } from "@/state/LabContext";

export function ExercisePanel({
  onStatusChange,
}: {
  onStatusChange?: (status: { allChecked: boolean }) => void;
}) {
  const { analysis } = useLab();

  const qs = useMemo(() => {
    if (!analysis) return [];
    const hardest = [...analysis.functions].sort((a, b) => b.cc - a.cc)[0];
    const named = hardest?.name ?? "—";
    const nameOptions = [
      named,
      ...analysis.functions.map((f) => f.name).filter((n) => n !== named),
    ].filter((n, i, arr) => n && arr.indexOf(n) === i).slice(0, 4);
    while (nameOptions.length < 4) nameOptions.push(`fn_${nameOptions.length}`);

    return [
      {
        id: "loc",
        prompt: "What is the physical LOC of the current module?",
        kind: "number" as const,
        expected: String(analysis.loc.loc),
        explain: `Static analysis reports loc = ${analysis.loc.loc} (SLOC ${analysis.loc.sloc}, LLOC ${analysis.loc.lloc}).`,
      },
      {
        id: "sloc",
        prompt: "What is the SLOC of the current module?",
        kind: "number" as const,
        expected: String(analysis.loc.sloc),
        explain: `SLOC = ${analysis.loc.sloc}.`,
      },
      {
        id: "cc",
        prompt: `What is the cyclomatic complexity of ${named}?`,
        kind: "number" as const,
        expected: hardest ? String(hardest.cc) : "0",
        explain: hardest
          ? `${named} has CC ${hardest.cc} (rank ${hardest.rank}).`
          : "Analyze a module that contains functions.",
      },
      {
        id: "hardest",
        prompt: "Which function has the highest cyclomatic complexity?",
        expected: named,
        explain: `Sort functions by CC. ${named} is highest.`,
        options: nameOptions,
      },
      {
        id: "funcs",
        prompt: "How many functions did the analyzer report?",
        kind: "number" as const,
        expected: String(analysis.functions.length),
        explain: `The parser found ${analysis.functions.length} function(s).`,
      },
      {
        id: "halstead",
        prompt: "Halstead effort E equals:",
        expected: "Difficulty × Volume",
        explain: `E = D × V. Here V = ${analysis.halstead.volume.toFixed(1)}, D = ${analysis.halstead.difficulty.toFixed(2)}.`,
        options: ["Difficulty × Volume", "LOC × CC", "MI × SLOC", "Edges − nodes"],
      },
    ];
  }, [analysis]);

  if (!analysis) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Analyze code before answering exercise questions. Answers use live analysis results.
      </p>
    );
  }

  return (
    <div className="p-3">
      <LabQuizCards questions={qs} onStatusChange={onStatusChange} />
    </div>
  );
}
