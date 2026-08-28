import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNum } from "@/lib/utils";
import type { MetricExplanation } from "@/lib/types";
import { useLab } from "@/state/LabContext";

function Explain({ exp }: { exp: MetricExplanation }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
      <button type="button" className="text-sky-400 hover:underline" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "What is this metric?"}
      </button>
      {open && (
        <div className="space-y-1 rounded border border-border bg-background/60 p-2">
          <p>
            <strong className="text-foreground">What:</strong> {exp.what}
          </p>
          <p>
            <strong className="text-foreground">How:</strong> {exp.how}
          </p>
          <p>
            <strong className="text-foreground">Meaning:</strong> {exp.meaning}
          </p>
        </div>
      )}
    </div>
  );
}

export function MetricsDashboard() {
  const { analysis, jumpToFunction } = useLab();
  if (!analysis) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Click <strong className="text-foreground">Analyze Code</strong> to compute real Radon metrics.
      </div>
    );
  }
  const exp = (family: MetricExplanation["family"]) =>
    analysis.explanations.find((e) => e.family === family)!;
  const maxCc = Math.max(0, ...analysis.functions.map((f) => f.cc));

  return (
    <div className="space-y-4 p-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi title="LOC / SLOC" value={`${analysis.loc.loc} / ${analysis.loc.sloc}`} hint={`LLOC ${analysis.loc.lloc} · comments ${analysis.loc.comments} · blank ${analysis.loc.blank}`} exp={exp("loc")} />
        <Kpi title="Max CC" value={String(maxCc)} hint={`${analysis.functions.length} functions`} exp={exp("cyclomatic")} />
        <Kpi title="Halstead Volume" value={formatNum(analysis.halstead.volume)} hint={`Effort ${formatNum(analysis.halstead.effort)}`} exp={exp("halstead")} />
        <Kpi title="Maintainability" value={`${formatNum(analysis.maintainability.mi)} ${analysis.maintainability.rank}`} hint="0–100 Radon MI" exp={exp("maintainability")} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Functions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2">Name</th>
                <th>CC</th>
                <th>Rank</th>
                <th>LOC</th>
                <th>Nest</th>
                <th>Lines</th>
              </tr>
            </thead>
            <tbody>
              {analysis.functions.map((fn) => (
                <tr
                  key={fn.qualified_name + fn.lineno}
                  className="cursor-pointer border-t border-border hover:bg-secondary/60"
                  onClick={() => jumpToFunction(fn.name)}
                >
                  <td className="py-1.5 font-mono">{fn.qualified_name}</td>
                  <td>{fn.cc}</td>
                  <td>
                    <Badge variant={fn.cc >= 10 ? "crit" : fn.cc >= 6 ? "warn" : "ok"}>{fn.rank}</Badge>
                  </td>
                  <td>{fn.loc}</td>
                  <td>{fn.nested_decision_depth}</td>
                  <td>
                    {fn.lineno}–{fn.end_lineno}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cyclomatic complexity by function</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.functions.map((f) => ({ name: f.name, cc: f.cc }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              <Bar dataKey="cc" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Halstead volume vs effort</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Volume", value: Number(analysis.halstead.volume.toFixed(1)) },
                { name: "Effort", value: Number(analysis.halstead.effort.toFixed(1)) },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Halstead (module)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          {[
            ["η1 operators", analysis.halstead.h1],
            ["η2 operands", analysis.halstead.h2],
            ["Length N", analysis.halstead.length],
            ["Difficulty D", analysis.halstead.difficulty],
            ["Effort E", analysis.halstead.effort],
            ["Time (s)", analysis.halstead.time],
            ["Bugs B", analysis.halstead.bugs],
            ["Vocabulary", analysis.halstead.vocabulary],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded bg-secondary/50 p-2">
              <div className="text-muted-foreground">{k}</div>
              <div className="font-mono text-sm">{formatNum(Number(v))}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  title,
  value,
  hint,
  exp,
}: {
  title: string;
  value: string;
  hint: string;
  exp: MetricExplanation;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-xl">{value}</div>
        <div className="text-[11px] text-muted-foreground">{hint}</div>
        <Explain exp={exp} />
      </CardContent>
    </Card>
  );
}

export function InsightsList() {
  const { analysis, jumpToFunction } = useLab();
  if (!analysis) return null;
  return (
    <ul className="space-y-2 p-3">
      {analysis.insights.map((i, idx) => (
        <li key={idx} className="rounded-lg border border-border p-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={i.severity === "critical" ? "crit" : i.severity === "warning" ? "warn" : "ok"}>
              {i.severity}
            </Badge>
            <span className="font-medium">{i.title}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{i.detail}</p>
          {i.function && (
            <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-sky-400" onClick={() => jumpToFunction(i.function!)}>
              Jump to {i.function}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
