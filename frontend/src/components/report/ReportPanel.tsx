import { useState } from "react";
import { Download } from "lucide-react";
import { compareAnalyses } from "@/lib/compare";
import { formatNum } from "@/lib/utils";
import { Badge } from "@/components/ui/card";
import { LabCard } from "@/components/lab/LabCard";
import {
  REPORT_FIELD_CLASS,
  ReportDownloadBar,
  ReportStudentFields,
  type ReportStudentForm,
} from "@/components/lab/ReportForm";
import { useLab } from "@/state/LabContext";

export function ComparisonPanel() {
  const { analysis, baseline } = useLab();
  if (!analysis) {
    return (
      <p className="p-4 text-sm text-slate-500">
        Analyze, then Save Baseline. Refactor and Analyze Again to compare.
      </p>
    );
  }
  if (!baseline) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Current metrics are ready. Click <strong className="text-slate-800">Save Baseline</strong>,
        edit/refactor, then Analyze Again.
      </div>
    );
  }
  const rows = compareAnalyses(baseline, analysis);
  return (
    <LabCard title="BEFORE → AFTER (Radon, not estimates)">
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
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
              r.pct == null ? null : r.betterWhen === "down" ? r.pct < 0 : r.pct > 0;
            return (
              <tr key={r.key} className="border-t border-slate-200">
                <td className="py-1.5">{r.label}</td>
                <td className="font-mono">{formatNum(r.before)}</td>
                <td className="font-mono">{formatNum(r.after)}</td>
                <td>
                  {r.pct == null ? (
                    "-"
                  ) : (
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
    </LabCard>
  );
}

export function ReportPanel() {
  const { analysis, baseline } = useLab();
  const [student, setStudent] = useState<ReportStudentForm>({
    names: "",
    regs: "",
    title: "Software Code Metrics Analysis",
    origin: "sample",
    github: "",
    description: "Python module analyzed in 21CSC403T Virtual Lab Exercise 1.",
  });
  const [justification, setJustification] = useState(
    "Radon is used because the lab is Python-only. It exposes LOC, cyclomatic complexity, Halstead, and MI from AST visitors without executing source.",
  );
  const [refactor, setRefactor] = useState("");
  const [conclusion, setConclusion] = useState(
    "Static metrics make complexity visible, guide refactoring, and provide evidence of improvement when before/after values move in the right direction.",
  );

  const [exporting, setExporting] = useState(false);
  const rows = analysis && baseline ? compareAnalyses(baseline, analysis) : [];
  const form = { ...student, justification, refactor, conclusion };

  const exportPdf = async () => {
    if (!analysis) return;
    setExporting(true);
    try {
      const { downloadReportPdf } = await import("@/lib/reportPdf");
      await downloadReportPdf(form, analysis, rows);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4" id="lab-report">
      <LabCard title="Generate Lab Report" icon={Download}>
        <ReportDownloadBar
          buttonId="exp1-download-report"
          disabled={!analysis}
          exporting={exporting}
          onDownload={() => void exportPdf()}
          hint={
            !analysis
              ? "Run Analyze Code in Simulation first — the PDF embeds your live Radon metrics."
              : undefined
          }
        />
        <ReportStudentFields
          form={student}
          onChange={(key, value) => setStudent((f) => ({ ...f, [key]: value }))}
          originOptions={[
            { value: "sample", label: "Lab sample / own snippet" },
            { value: "own", label: "Own project" },
            { value: "github", label: "GitHub project" },
          ]}
          footnote="Programming language: Python (Exercise 1)."
        />
      </LabCard>

      <LabCard title="Section 2 — Tool & Metrics">
        <p className="text-sm text-slate-600">Tool: Radon (RadonEngine). Lizard is reserved for a later exercise.</p>
        <textarea
          className={`mt-2 ${REPORT_FIELD_CLASS}`}
          rows={3}
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />
      </LabCard>

      <LabCard title="Section 3 — Results">
        {!analysis && <p className="text-sm text-slate-500">Run Analyze Code to embed live metrics.</p>}
        {analysis && (
          <ul className="space-y-1 font-mono text-xs text-slate-700">
            <li>
              LOC {analysis.loc.loc} · SLOC {analysis.loc.sloc} · LLOC {analysis.loc.lloc}
            </li>
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
      </LabCard>

      <LabCard title="Section 4 — Analysis & Interpretation">
        <div className="space-y-2 text-sm text-slate-600">
          {analysis?.insights.map((i, n) => (
            <p key={n}>
              <strong className="text-slate-800">{i.title}</strong> {i.detail}
            </p>
          ))}
          {!analysis && <p className="text-slate-500">Insights appear after analysis.</p>}
        </div>
      </LabCard>

      <LabCard title="Section 5 — Code Improvement">
        <textarea
          className={REPORT_FIELD_CLASS}
          rows={4}
          placeholder="Describe the refactor (guard clauses, extracted helpers, simplified elif chains)…"
          value={refactor}
          onChange={(e) => setRefactor(e.target.value)}
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
                <tr key={r.key} className="border-t border-slate-200">
                  <td>{r.label}</td>
                  <td>{formatNum(r.before)}</td>
                  <td>{formatNum(r.after)}</td>
                  <td>{r.pct == null ? "-" : `${r.pct.toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </LabCard>

      <LabCard title="Section 6 — Inference & Conclusion">
        <textarea
          className={REPORT_FIELD_CLASS}
          rows={4}
          value={conclusion}
          onChange={(e) => setConclusion(e.target.value)}
        />
      </LabCard>
    </div>
  );
}
