import { Activity, Baseline, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CfgView } from "@/components/cfg/CfgView";
import { CodeWorkspace } from "@/components/editor/CodeWorkspace";
import { ExercisePanel } from "@/components/exercise/ExercisePanel";
import { InsightsList, MetricsDashboard } from "@/components/metrics/Dashboard";
import { Pipeline } from "@/components/pipeline/Pipeline";
import { ComparisonPanel, ReportPanel } from "@/components/report/ReportPanel";
import { NAV, COPY } from "@/content/labCopy";
import { cn } from "@/lib/utils";
import { useLab } from "@/state/LabContext";
import type { LabSection } from "@/lib/types";
import { useState } from "react";

type WorkspaceTab = "metrics" | "cfg";

export function LabShell() {
  const { section, setSection, analyze, analyzing, saveBaseline, analysis, error, sim, baseline } =
    useLab();
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("metrics");

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(ellipse_at_top,_#0f1a2e_0%,_#070b14_55%)]">
      <header className="no-print flex flex-wrap items-center gap-2 border-b border-border/80 bg-card/40 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500/15 font-mono text-xs font-bold text-sky-300">
            SMM
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">SMM Virtual Lab</div>
            <div className="text-[11px] text-muted-foreground">
              Exercise 1 · Software Code Metrics Analysis
            </div>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void analyze()} disabled={analyzing}>
            <RefreshCw className={cn("h-3.5 w-3.5", analyzing && "animate-spin")} />
            {analysis ? "Analyze Again" : "Analyze Code"}
          </Button>
          <Button size="sm" variant="secondary" onClick={saveBaseline} disabled={!analysis}>
            <Baseline className="h-3.5 w-3.5" />
            {baseline ? "Baseline Saved" : "Save Baseline"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSection("simulation");
              setWorkspaceTab("cfg");
              sim.reset();
              sim.play();
            }}
            disabled={!analysis}
          >
            <Play className="h-3.5 w-3.5" />
            Simulate Execution
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="no-print w-48 shrink-0 overflow-y-auto border-r border-border/80 bg-card/30">
          <div className="px-3 py-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            Lab sections
          </div>
          <nav className="flex flex-col gap-0.5 px-2 pb-4">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                  if (item.id === "simulation") setWorkspaceTab("cfg");
                  if (item.id === "results" || item.id === "analysis") setWorkspaceTab("metrics");
                }}
                className={cn(
                  "rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  section === item.id
                    ? "bg-sky-500/15 text-sky-300"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(320px,0.95fr)_minmax(420px,1.15fr)]">
          <div className="flex min-h-0 flex-col border-r border-border/80">
            <SectionCopy section={section} />
            <div className="min-h-0 flex-1 overflow-y-auto">
              {section === "exercise" && <ExercisePanel />}
              {section === "simulation" && (
                <div className="p-3 text-xs text-muted-foreground xl:hidden">
                  Open the CFG tab in the workspace below on large screens, or use the controls under
                  Metrics / CFG.
                </div>
              )}
              {section === "simulation" && (
                <div className="h-[min(70vh,640px)] xl:hidden">
                  <CfgView />
                </div>
              )}
              {section === "results" && <MetricsDashboard />}
              {section === "analysis" && <InsightsList />}
              {section === "comparison" && <ComparisonPanel />}
              {section === "conclusion" && <ReportPanel />}
              {["aim", "objective", "theory", "procedure"].includes(section) && (
                <ProcedureHint />
              )}
            </div>
          </div>

          <div className="no-print flex min-h-0 flex-col">
            <Pipeline />
            {error && (
              <div className="mx-3 mb-2 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-[280px] flex-[1.2] flex-col overflow-hidden">
                <CodeWorkspace />
              </div>
              <div className="flex min-h-[240px] flex-1 flex-col overflow-hidden border-t border-border/80">
                <div className="flex items-center gap-1 border-b border-border/80 px-2 py-1">
                  {(
                    [
                      ["metrics", "Metrics Dashboard"],
                      ["cfg", "Interactive CFG"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setWorkspaceTab(id)}
                      className={cn(
                        "rounded px-2 py-1 text-xs",
                        workspaceTab === id
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  {workspaceTab === "metrics" ? <MetricsDashboard /> : <CfgView />}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ProcedureHint() {
  return (
    <div className="space-y-3 p-4 text-sm text-muted-foreground">
      <ol className="list-decimal space-y-2 pl-5">
        <li>Edit the Python sample in the Monaco editor (right).</li>
        <li>
          Click <span className="text-foreground">Analyze Code</span> — metrics come from Radon, never
          from hardcoded values.
        </li>
        <li>Inspect KPIs, charts, and the CFG. Click a function to jump to its source.</li>
        <li>
          <span className="text-foreground">Save Baseline</span>, refactor nested decisions, then{" "}
          <span className="text-foreground">Analyze Again</span>.
        </li>
        <li>Complete Exercise questions and generate the report under Conclusion.</li>
      </ol>
      <p className="text-xs">
        Safety: the backend only runs <code className="text-sky-300">ast.parse</code> and Radon
        visitors. Your code is never executed.
      </p>
    </div>
  );
}

function SectionCopy({ section }: { section: LabSection }) {
  const copy = COPY[section];
  return (
    <div className="border-b border-border/80 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-sky-400" />
        {copy.title}
      </div>
      <div className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
        {copy.body.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </div>
    </div>
  );
}
