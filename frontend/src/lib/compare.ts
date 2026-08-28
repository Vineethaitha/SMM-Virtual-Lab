import type { AnalysisResult } from "./types";
import { pctChange } from "./utils";

export interface CompareRow {
  key: string;
  label: string;
  before: number;
  after: number;
  pct: number | null;
  betterWhen: "down" | "up";
}

export function compareAnalyses(before: AnalysisResult, after: AnalysisResult): CompareRow[] {
  const maxCc = (a: AnalysisResult) =>
    a.functions.length ? Math.max(...a.functions.map((f) => f.cc)) : 0;
  const avgCc = (a: AnalysisResult) =>
    a.functions.length
      ? a.functions.reduce((s, f) => s + f.cc, 0) / a.functions.length
      : 0;

  const pairs: Omit<CompareRow, "pct">[] = [
    { key: "loc", label: "LOC", before: before.loc.loc, after: after.loc.loc, betterWhen: "down" },
    { key: "sloc", label: "SLOC", before: before.loc.sloc, after: after.loc.sloc, betterWhen: "down" },
    {
      key: "maxCc",
      label: "Cyclomatic Complexity (max)",
      before: maxCc(before),
      after: maxCc(after),
      betterWhen: "down",
    },
    {
      key: "avgCc",
      label: "Cyclomatic Complexity (avg)",
      before: avgCc(before),
      after: avgCc(after),
      betterWhen: "down",
    },
    {
      key: "volume",
      label: "Halstead Volume",
      before: before.halstead.volume,
      after: after.halstead.volume,
      betterWhen: "down",
    },
    {
      key: "effort",
      label: "Halstead Effort",
      before: before.halstead.effort,
      after: after.halstead.effort,
      betterWhen: "down",
    },
    {
      key: "mi",
      label: "Maintainability Index",
      before: before.maintainability.mi,
      after: after.maintainability.mi,
      betterWhen: "up",
    },
  ];

  return pairs.map((p) => ({ ...p, pct: pctChange(p.before, p.after) }));
}
