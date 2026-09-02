import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { ComponentType } from "react";
import {
  Activity,
  Baseline,
  BarChart3,
  BookOpen,
  ClipboardList,
  FlaskConical,
  GitCompare,
  Lightbulb,
  ListChecks,
  Play,
  RefreshCw,
  Target,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CfgView } from "@/components/cfg/CfgView";
import { CodeWorkspace } from "@/components/editor/CodeWorkspace";
import { ExercisePanel } from "@/components/exercise/ExercisePanel";
import { InsightsList, MetricsDashboard } from "@/components/metrics/Dashboard";
import { Pipeline } from "@/components/pipeline/Pipeline";
import { ComparisonPanel, ReportPanel } from "@/components/report/ReportPanel";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";
import { NAV, COPY } from "@/content/labCopy";
import { cn } from "@/lib/utils";
import { useLab } from "@/state/LabContext";
import type { LabSection } from "@/lib/types";

const NAV_ICONS: Record<LabSection, ComponentType<{ className?: string }>> = {
  aim: Target,
  objective: Lightbulb,
  theory: BookOpen,
  procedure: ClipboardList,
  exercise: ListChecks,
  simulation: Play,
  results: BarChart3,
  analysis: FlaskConical,
  comparison: GitCompare,
  conclusion: FileText,
};

export function LabShell() {
  const { section, setSection, analyze, analyzing, saveBaseline, analysis, error, sim, baseline } =
    useLab();

  const skipScroll = useRef(true);
  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    document.getElementById("lab-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [section]);

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <ExperimentSidebar />
      <div className="min-w-0 flex-1">
        <div className="gradient-hero relative overflow-hidden text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <span>Experiments</span>
              <span>/</span>
              <span className="font-medium text-white">Software Code Metrics Analysis</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
                Experiment 1
              </span>
              <h1 className="text-xl font-bold sm:text-2xl">Software Code Metrics Analysis</h1>
            </div>
            <p className="mt-1.5 max-w-3xl text-sm text-white/85">
              Measure LOC, cyclomatic complexity, Halstead metrics, and the Maintainability Index — then
              refactor and compare before vs after.
            </p>
          </div>
        </div>

        <nav className="sticky top-0 z-20 glass border-b border-border shadow-sm">
          <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-2.5">
            {NAV.map((item) => {
              const Icon = NAV_ICONS[item.id];
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "gradient-primary text-white shadow-md"
                      : "bg-muted/70 text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main id="lab-section" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-6 sm:px-6">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <SectionBody
              section={section}
              analyze={analyze}
              analyzing={analyzing}
              saveBaseline={saveBaseline}
              analysisReady={!!analysis}
              error={error}
              simPlay={() => {
                setSection("simulation");
                sim.reset();
                sim.play();
              }}
              baselineSaved={!!baseline}
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function SectionBody({
  section,
  analyze,
  analyzing,
  saveBaseline,
  analysisReady,
  error,
  simPlay,
  baselineSaved,
}: {
  section: LabSection;
  analyze: () => Promise<void>;
  analyzing: boolean;
  saveBaseline: () => void;
  analysisReady: boolean;
  error: string | null;
  simPlay: () => void;
  baselineSaved: boolean;
}) {
  if (section === "simulation") {
    return (
      <div className="space-y-4">
        <TheoryCard section={section} />

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
            <div className="mr-auto">
              <p className="text-sm font-semibold text-foreground">Workbench</p>
              <p className="text-xs text-muted-foreground">
                Edit the Python, analyze real metrics, then walk the control-flow graph.
              </p>
            </div>
            <Button size="sm" onClick={() => void analyze()} disabled={analyzing}>
              <RefreshCw className={cn("h-3.5 w-3.5", analyzing && "animate-spin")} />
              {analysisReady ? "Analyze Again" : "Analyze Code"}
            </Button>
            <Button size="sm" variant="secondary" onClick={saveBaseline} disabled={!analysisReady}>
              <Baseline className="h-3.5 w-3.5" />
              {baselineSaved ? "Baseline Saved" : "Save Baseline"}
            </Button>
            <Button size="sm" variant="outline" onClick={simPlay} disabled={!analysisReady}>
              <Play className="h-3.5 w-3.5" />
              Simulate
            </Button>
          </div>
          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
          {(analyzing || analysisReady) && (
            <div className="border-b border-border bg-white">
              <Pipeline />
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Python editor</span>
          </div>
          <div className="h-[440px]">
            <CodeWorkspace />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
            <GitCompare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Control-flow graph</span>
            <span className="ml-auto text-xs text-muted-foreground">Click a node to jump to its source line</span>
          </div>
          <div className="h-[560px]">
            <CfgView />
          </div>
        </Card>
      </div>
    );
  }

  if (section === "results") {
    return (
      <div className="space-y-4">
        <TheoryCard section={section} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void analyze()} disabled={analyzing}>
            <RefreshCw className={cn("h-3.5 w-3.5", analyzing && "animate-spin")} />
            {analysisReady ? "Analyze Again" : "Analyze Code"}
          </Button>
        </div>
        <Pipeline />
        <MetricsDashboard />
      </div>
    );
  }

  if (section === "exercise") {
    return (
      <div className="space-y-4">
        <TheoryCard section={section} />
        <ExercisePanel />
      </div>
    );
  }

  if (section === "analysis") {
    return (
      <div className="space-y-4">
        <TheoryCard section={section} />
        <InsightsList />
      </div>
    );
  }

  if (section === "comparison") {
    return (
      <div className="space-y-4">
        <TheoryCard section={section} />
        <ComparisonPanel />
      </div>
    );
  }
  if (section === "conclusion") {
    return (
      <div className="space-y-4">
        <TheoryCard section={section} />
        <ReportPanel />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TheoryCard section={section} />
      {section === "procedure" && <ProcedureHint />}
    </div>
  );
}

function TheoryCard({ section }: { section: LabSection }) {
  const copy = COPY[section];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {copy.body.map((p) => (
          <p key={p.slice(0, 48)}>{p}</p>
        ))}
      </CardContent>
    </Card>
  );
}

function ProcedureHint() {
  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How to use this lab</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Open the <span className="font-medium text-foreground">Simulation</span> section to edit
            Python and build the CFG.
          </li>
          <li>
            Click <span className="font-medium text-foreground">Analyze Code</span> — metrics come from
            Radon, never from hardcoded values.
          </li>
          <li>
            Open <span className="font-medium text-foreground">Results</span> for the dashboard, then
            <span className="font-medium text-foreground"> Analysis</span> for insights.
          </li>
          <li>
            Save a baseline, refactor in Simulation, analyze again, then use{" "}
            <span className="font-medium text-foreground">Comparison</span>.
          </li>
        </ol>
        <p className="text-xs">
          Safety: the backend only runs <code className="text-primary">ast.parse</code> and Radon
          visitors. Your code is never executed.
        </p>
      </CardContent>
    </Card>
  );
}
