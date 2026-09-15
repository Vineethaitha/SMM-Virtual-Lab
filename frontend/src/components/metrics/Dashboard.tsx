import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LabCard, LabKpiCard } from "@/components/lab/LabCard";
import { cn, formatNum } from "@/lib/utils";
import { useLab } from "@/state/LabContext";
import { Pipeline } from "@/components/pipeline/Pipeline";

const CHART_COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const RANK_PIE_COLORS: Record<string, string> = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#f43f5e",
  F: "#ef4444",
};

function ccTone(cc: number) {
  if (cc >= 21) return "text-red-600";
  if (cc >= 11) return "text-amber-600";
  return "text-emerald-600";
}

function ccFill(cc: number) {
  if (cc >= 21) return "#ef4444";
  if (cc >= 11) return "#f59e0b";
  if (cc >= 6) return "#3b82f6";
  return "#10b981";
}

function interpretRank(rank: string) {
  const map: Record<string, string> = {
    A: "Simple",
    B: "Moderate",
    C: "Complex",
    D: "More complex",
    E: "High risk",
    F: "Unstable",
  };
  return map[rank] ?? rank;
}

export function MetricsDashboard() {
  const { analysis, jumpToFunction, analyze, analyzing } = useLab();

  if (!analysis) {
    return (
      <LabCard title="Results" icon={BarChart3}>
        <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-400">
          <BarChart3 className="h-10 w-10 opacity-40" />
          <p className="font-medium">No metrics yet</p>
          <p className="text-sm">Analyze code in Simulation or here to see live Radon results.</p>
          <Button size="sm" onClick={() => void analyze()} disabled={analyzing} className="mt-1">
            <RefreshCw className={cn("h-3.5 w-3.5", analyzing && "animate-spin")} />
            {analyzing ? "Analyzing…" : "Analyze Code"}
          </Button>
        </div>
        {analyzing && (
          <div className="mt-3">
            <Pipeline />
          </div>
        )}
      </LabCard>
    );
  }

  const maxCc = Math.max(0, ...analysis.functions.map((f) => f.cc));
  const hardest = analysis.functions.reduce(
    (best, fn) => (fn.cc > best.cc ? fn : best),
    analysis.functions[0]!,
  );
  const rankCounts = analysis.functions.reduce<Record<string, number>>((acc, fn) => {
    acc[fn.rank] = (acc[fn.rank] ?? 0) + 1;
    return acc;
  }, {});
  const pieData = ["A", "B", "C", "D", "E", "F"]
    .filter((r) => rankCounts[r])
    .map((r) => ({ name: `Rank ${r}`, value: rankCounts[r]!, rank: r }));

  const sizeBarData = [
    { name: "LOC", value: analysis.loc.loc },
    { name: "SLOC", value: analysis.loc.sloc },
    { name: "LLOC", value: analysis.loc.lloc },
    { name: "Comments", value: analysis.loc.comments },
    { name: "Blank", value: analysis.loc.blank },
  ];

  const ccBarData = analysis.functions.map((f) => ({ name: f.name, cc: f.cc }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" onClick={() => void analyze()} disabled={analyzing}>
          <RefreshCw className={cn("h-3.5 w-3.5", analyzing && "animate-spin")} />
          {analyzing ? "Analyzing…" : "Analyze Again"}
        </Button>
      </div>
      {analyzing && <Pipeline />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <LabKpiCard
          label="LOC / SLOC"
          value={`${analysis.loc.loc} / ${analysis.loc.sloc}`}
          sub={`LLOC ${analysis.loc.lloc} · comments ${analysis.loc.comments}`}
          color="blue"
        />
        <LabKpiCard
          label="Max Cyclomatic Complexity"
          value={maxCc}
          sub={`${analysis.functions.length} functions`}
          color="indigo"
        />
        <LabKpiCard
          label="Highest-Complexity Function"
          value={hardest.name}
          sub={`CC ${hardest.cc} · rank ${hardest.rank}`}
          color="green"
        />
        <LabKpiCard
          label="Maintainability"
          value={`${formatNum(analysis.maintainability.mi)} ${analysis.maintainability.rank}`}
          sub="0–100 Radon MI"
          color="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LabCard title="Cyclomatic Complexity by Function" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ccBarData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v, "CC"]} />
              <Bar dataKey="cc" radius={[4, 4, 0, 0]}>
                {ccBarData.map((row) => (
                  <Cell key={row.name} fill={ccFill(row.cc)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </LabCard>

        <LabCard title="Size Breakdown" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sizeBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Lines">
                {sizeBarData.map((row, i) => (
                  <Cell key={row.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </LabCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LabCard title="Complexity Rank Distribution">
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">No functions to plot.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((row) => (
                      <Cell key={row.rank} fill={RANK_PIE_COLORS[row.rank] ?? "#64748b"} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => [`${v} functions`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-xs text-slate-400">
                Based on {analysis.functions.length} functions · Halstead volume{" "}
                {formatNum(analysis.halstead.volume)}
              </p>
            </>
          )}
        </LabCard>

        <LabCard title="Function Summary Table">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-center">CC</th>
                  <th className="px-3 py-2 text-center">Rank</th>
                  <th className="px-3 py-2 text-left">Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {analysis.functions.map((fn) => (
                  <tr
                    key={fn.qualified_name + fn.lineno}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => jumpToFunction(fn.name)}
                  >
                    <td className="px-3 py-2 font-mono text-xs font-medium text-slate-700">
                      {fn.qualified_name}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn("font-bold", ccTone(fn.cc))}>{fn.cc}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={fn.cc >= 10 ? "crit" : fn.cc >= 6 ? "warn" : "ok"}>{fn.rank}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{interpretRank(fn.rank)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LabCard>
      </div>
    </div>
  );
}

export function InsightsList() {
  const { analysis, jumpToFunction } = useLab();
  if (!analysis) return null;
  return (
    <ul className="space-y-2">
      {analysis.insights.map((i, idx) => (
        <li key={idx} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={i.severity === "critical" ? "crit" : i.severity === "warning" ? "warn" : "ok"}>
              {i.severity}
            </Badge>
            <span className="font-medium">{i.title}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{i.detail}</p>
          {i.function && (
            <Button variant="ghost" size="sm" className="mt-1 h-7 px-2 text-primary" onClick={() => jumpToFunction(i.function!)}>
              Jump to {i.function}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
