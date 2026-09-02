import { useState } from "react";
import { compareAnalyses } from "@/lib/compare";
import { formatNum } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLab } from "@/state/LabContext";
import type { AnalysisResult } from "@/lib/types";

export function ComparisonPanel() {
  const { analysis, baseline } = useLab();
  if (!analysis) {
    return <p className="p-4 text-sm text-muted-foreground">Analyze, then Save Baseline. Refactor and Analyze Again to compare.</p>;
  }
  if (!baseline) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Current metrics are ready. Click <strong className="text-foreground">Save Baseline</strong>, edit/refactor, then Analyze Again.
      </div>
    );
  }
  const rows = compareAnalyses(baseline, analysis);
  return (
    <Card className="m-3">
      <CardHeader>
        <CardTitle>BEFORE → AFTER (Radon, not estimates)</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="pb-2">Metric</th>
              <th>Before</th>
              <th>After</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const improved =
                r.pct == null
                  ? null
                  : r.betterWhen === "down"
                    ? r.pct < 0
                    : r.pct > 0;
              return (
                <tr key={r.key} className="border-t border-border">
                  <td className="py-1.5">{r.label}</td>
                  <td className="font-mono">{formatNum(r.before)}</td>
                  <td className="font-mono">{formatNum(r.after)}</td>
                  <td>
                    {r.pct == null ? "—" : (
                      <Badge variant={improved ? "ok" : r.pct === 0 ? "default" : "warn"}>
                        {r.pct > 0 ? "+" : ""}
                        {r.pct.toFixed(1)}%
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function ReportPanel() {
  const { analysis, baseline } = useLab();
  const [form, setForm] = useState({
    names: "",
    regs: "",
    title: "Software Code Metrics Analysis",
    origin: "sample",
    github: "",
    description: "Python module analyzed in 21CSC403T Virtual Lab Exercise 1.",
    justification:
      "Radon is used because the lab is Python-only. It exposes LOC, cyclomatic complexity, Halstead, and MI from AST visitors without executing source.",
    refactor: "",
    conclusion:
      "Static metrics make complexity visible, guide refactoring, and provide evidence of improvement when before/after values move in the right direction.",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const rows = analysis && baseline ? compareAnalyses(baseline, analysis) : [];

  const download = (kind: "json" | "md") => {
    if (!analysis) return;
    const payload = { student: form, analysis, baseline, comparison: rows };
    const blob =
      kind === "json"
        ? new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
        : new Blob([toMarkdown(form, analysis, rows)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = kind === "json" ? "smm-exercise1-report.json" : "smm-exercise1-report.md";
    a.click();
  };

  return (
    <div className="space-y-3 p-3 print:p-0" id="lab-report">
      <div className="no-print flex flex-wrap gap-2">
        <Button size="sm" onClick={() => window.print()}>
          Print / PDF
        </Button>
        <Button size="sm" variant="secondary" onClick={() => download("md")} disabled={!analysis}>
          Download Markdown
        </Button>
        <Button size="sm" variant="outline" onClick={() => download("json")} disabled={!analysis}>
          Download JSON
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Section 1 — Student & Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <Field label="Name(s)" value={form.names} onChange={(v) => set("names", v)} />
          <Field label="Registration number(s)" value={form.regs} onChange={(v) => set("regs", v)} />
          <Field label="Project title" value={form.title} onChange={(v) => set("title", v)} />
          <label className="text-xs">
            Origin
            <select
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5"
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
            >
              <option value="sample">Lab sample / own snippet</option>
              <option value="own">Own project</option>
              <option value="github">GitHub project</option>
            </select>
          </label>
          <Field label="GitHub link (if any)" value={form.github} onChange={(v) => set("github", v)} />
          <label className="text-xs md:col-span-2">
            Short description
            <textarea
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <p className="text-xs text-muted-foreground md:col-span-2">Programming language: Python (Exercise 1).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section 2 — Tool & Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs">Tool: Radon (RadonEngine). Lizard is reserved for a later exercise.</p>
          <textarea
            className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            rows={3}
            value={form.justification}
            onChange={(e) => set("justification", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section 3 — Results</CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
          {!analysis && <p className="text-muted-foreground">Run Analyze Code to embed live metrics.</p>}
          {analysis && (
            <ul className="space-y-1 font-mono">
              <li>LOC {analysis.loc.loc} · SLOC {analysis.loc.sloc} · LLOC {analysis.loc.lloc}</li>
              <li>
                Halstead V {analysis.halstead.volume.toFixed(2)} · D {analysis.halstead.difficulty.toFixed(2)} · E{" "}
                {analysis.halstead.effort.toFixed(2)}
              </li>
              <li>
                MI {analysis.maintainability.mi} ({analysis.maintainability.rank})
              </li>
              {analysis.functions.map((f) => (
                <li key={f.qualified_name + f.lineno}>
                  {f.qualified_name} CC={f.cc} rank={f.rank} lines={f.lineno}-{f.end_lineno}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section 4 — Analysis & Interpretation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {analysis?.insights.map((i, n) => (
            <p key={n}>
              <strong>{i.title}</strong> {i.detail}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section 5 — Code Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            rows={4}
            placeholder="Describe the refactor (guard clauses, extracted helpers, simplified elif chains)…"
            value={form.refactor}
            onChange={(e) => set("refactor", e.target.value)}
          />
          {rows.length > 0 && (
            <table className="mt-3 w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t border-border">
                    <td>{r.label}</td>
                    <td>{formatNum(r.before)}</td>
                    <td>{formatNum(r.after)}</td>
                    <td>{r.pct == null ? "—" : `${r.pct.toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section 6 — Inference & Conclusion</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            rows={4}
            value={form.conclusion}
            onChange={(e) => set("conclusion", e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-xs">
      {label}
      <input
        className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function toMarkdown(
  form: Record<string, string>,
  analysis: AnalysisResult,
  rows: ReturnType<typeof compareAnalyses>,
) {
  return `# 21CSC403T Exercise 1 Report

## 1. Student & Project
- Names: ${form.names}
- Registration: ${form.regs}
- Title: ${form.title}
- Origin: ${form.origin} ${form.github}
- Language: Python
- Description: ${form.description}

## 2. Tool
Radon. ${form.justification}

## 3. Results
- LOC ${analysis.loc.loc}, SLOC ${analysis.loc.sloc}, LLOC ${analysis.loc.lloc}
- Halstead V ${analysis.halstead.volume}, E ${analysis.halstead.effort}
- MI ${analysis.maintainability.mi} ${analysis.maintainability.rank}
${analysis.functions.map((f) => `- ${f.qualified_name} CC=${f.cc} (${f.rank})`).join("\n")}

## 4. Analysis
${analysis.insights.map((i) => `- ${i.title}: ${i.detail}`).join("\n")}

## 5. Improvement
${form.refactor}
${rows.map((r) => `- ${r.label}: ${r.before} → ${r.after} (${r.pct?.toFixed(1)}%)`).join("\n")}

## 6. Conclusion
${form.conclusion}
`;
}
