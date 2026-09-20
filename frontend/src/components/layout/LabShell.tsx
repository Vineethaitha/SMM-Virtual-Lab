import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { ComponentType } from "react";
import {
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
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CfgView } from "@/components/cfg/CfgView";
import { CodeWorkspace } from "@/components/editor/CodeWorkspace";
import { ExercisePanel } from "@/components/exercise/ExercisePanel";
import { InsightsList, MetricsDashboard } from "@/components/metrics/Dashboard";
import { Pipeline } from "@/components/pipeline/Pipeline";
import { ComparisonPanel, ReportPanel } from "@/components/report/ReportPanel";
import { LabCard, LabFormula, LabInfoBox, LabStepList, LabThresholds } from "@/components/lab/LabCard";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";
import { NAV } from "@/content/labCopy";
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

const OBJECTIVES = [
  "Collect real LOC / SLOC / LLOC, per-function cyclomatic complexity, Halstead volume/difficulty/effort, and Maintainability Index.",
  "Identify high-complexity functions from the dashboard and control-flow graph.",
  "Refactor nested decisions, re-analyze, and report before/after change with a structured lab report.",
];

const PROCEDURE_STEPS = [
  "Open Simulation and load the sample (or paste your own Python). Code is never executed — only parsed.",
  "Click Analyze Code. Watch the pipeline, then stay on Simulation — the control-flow graph appears below the editor.",
  "Open Results for KPI cards, function table, and charts. Click a function to jump in the editor.",
  "Select a function CFG and Step / Play. At decisions choose true or false (graph walk, not a Python VM).",
  "Save Baseline. Refactor nested if/elif chains (guard clauses, helpers). Analyze Again.",
  "Compare BEFORE → AFTER percentages. Complete Exercise questions. Generate the report from Conclusion.",
];

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
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <ExperimentSidebar />
      <div className="min-w-0 flex-1">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <span>Experiments</span>
              <span>/</span>
              <span className="font-medium text-white">Software Code Metrics Analysis</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
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

        <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-10">
            {NAV.map((item) => {
              const Icon = NAV_ICONS[item.id];
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main id="lab-section" className="scroll-mt-16 px-4 py-6 sm:px-6 lg:px-10">
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
  if (section === "aim") {
    return (
      <LabCard title="Aim" icon={Target}>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>
            Measure software size and structural complexity of Python source using static analysis in the browser.
          </p>
          <p>
            Learn how LOC, cyclomatic complexity, Halstead metrics, and the Maintainability Index describe
            quality — then improve a module and prove it with numbers.
          </p>
        </div>
      </LabCard>
    );
  }

  if (section === "objective") {
    return (
      <div className="space-y-4">
        <LabCard title="Objective" icon={Lightbulb}>
          <LabStepList items={OBJECTIVES} />
        </LabCard>
        <LabCard title="Learning Outcome" icon={TrendingUp}>
          <p className="text-sm leading-relaxed text-slate-600">
            After completing this experiment, students should be able to collect live static metrics,
            identify high-complexity functions, refactor with evidence, and produce a structured lab report.
          </p>
        </LabCard>
      </div>
    );
  }

  if (section === "theory") {
    return (
      <div className="space-y-4">
        <LabCard title="LOC family">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            The LOC family measures size, not complexity. Physical lines, source lines, and logical
            statements answer different questions about how large a module is.
          </p>
          <div className="mb-3 space-y-1.5">
            <LabFormula>LOC = physical lines in the file</LabFormula>
            <LabFormula>SLOC = non-blank, non-comment source lines</LabFormula>
            <LabFormula>LLOC = logical statements</LabFormula>
          </div>
          <LabThresholds
            caption="Laboratory reading (size is not a quality grade):"
            rows={[
              { range: "LOC", label: "Physical size", color: "bg-slate-100 text-slate-700" },
              { range: "SLOC", label: "Coded size", color: "bg-blue-100 text-blue-700" },
              { range: "LLOC", label: "Statement size", color: "bg-indigo-100 text-indigo-700" },
            ]}
          />
        </LabCard>

        <LabCard title="McCabe cyclomatic complexity">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            Cyclomatic complexity counts independent paths through a function. Each path needs at least
            one test. Predicates are counted from a static parse of the buffer, not by executing the code.
          </p>
          <div className="mb-3 space-y-1.5">
            <LabFormula>M = E − N + 2P</LabFormula>
            <LabFormula>M ≈ number of decision points + 1</LabFormula>
          </div>
          <LabThresholds
            caption="Laboratory thresholds (McCabe ranks, simplified for this experiment):"
            rows={[
              { range: "1 – 5", label: "A · Simple", color: "bg-emerald-100 text-emerald-700" },
              { range: "6 – 10", label: "B · Moderate", color: "bg-blue-100 text-blue-700" },
              { range: "11 – 20", label: "C · Complex", color: "bg-amber-100 text-amber-700" },
              { range: "21 – 30", label: "D · More complex", color: "bg-orange-100 text-orange-700" },
              { range: "31 – 40", label: "E · High risk", color: "bg-rose-100 text-rose-700" },
              { range: "41 +", label: "F · Unstable", color: "bg-red-100 text-red-700" },
            ]}
          />
        </LabCard>

        <LabCard title="Halstead metrics">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            Halstead metrics treat source as operators (η1, N1) and operands (η2, N2). Nested predicates
            inflate operator counts and therefore volume, difficulty, and effort.
          </p>
          <div className="mb-3 space-y-1.5">
            <LabFormula>η = η1 + η2 &nbsp;&nbsp; N = N1 + N2</LabFormula>
            <LabFormula>V = N × log₂(η)</LabFormula>
            <LabFormula>D = (η1 / 2) × (N2 / η2)</LabFormula>
            <LabFormula>E = D × V</LabFormula>
          </div>
          <LabThresholds
            caption="Laboratory reading (what each term measures):"
            rows={[
              { range: "V · Volume", label: "Information content", color: "bg-slate-100 text-slate-700" },
              { range: "D · Difficulty", label: "Error-proneness", color: "bg-blue-100 text-blue-700" },
              { range: "E · Effort", label: "Review / implement cost", color: "bg-amber-100 text-amber-700" },
            ]}
          />
        </LabCard>

        <LabCard title="Maintainability Index">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            The analyzer blends Halstead volume, cyclomatic complexity, and SLOC onto a 0–100 scale. Higher MI
            is easier to maintain.
          </p>
          <div className="mb-3">
            <LabFormula>
              MI = max(0, (171 − 5.2 ln(V) − 0.23 CC − 16.2 ln(SLOC)) × 100 / 171)
            </LabFormula>
          </div>
          <LabThresholds
            caption="Laboratory thresholds (MI ranks):"
            rows={[
              { range: "20 – 100", label: "A · High", color: "bg-emerald-100 text-emerald-700" },
              { range: "10 – 19", label: "B · Medium", color: "bg-amber-100 text-amber-700" },
              { range: "0 – 9", label: "C · Low", color: "bg-rose-100 text-rose-700" },
            ]}
          />
        </LabCard>

        <LabCard title="Control-flow graph">
          <p className="mb-3 text-sm leading-relaxed text-slate-600">
            A CFG makes McCabe visual. The token walks edges only — student Python is never executed.
          </p>
          <div className="mb-3">
            <LabFormula>Independent paths = E − N + 2P</LabFormula>
          </div>
          <LabThresholds
            caption="Laboratory node types used in the simulation:"
            rows={[
              { range: "ENTRY / EXIT", label: "Start and end", color: "bg-slate-100 text-slate-700" },
              { range: "Statement", label: "Sequential step", color: "bg-blue-100 text-blue-700" },
              { range: "Decision (true / false)", label: "Branch", color: "bg-amber-100 text-amber-700" },
              { range: "Loop (back-edge)", label: "Repeat body", color: "bg-indigo-100 text-indigo-700" },
              { range: "RETURN", label: "Leave function", color: "bg-rose-100 text-rose-700" },
            ]}
          />
        </LabCard>
      </div>
    );
  }

  if (section === "procedure") {
    return (
      <div className="space-y-4">
        <LabCard title="Procedure" icon={ClipboardList}>
          <LabStepList items={PROCEDURE_STEPS} variant="procedure" />
        </LabCard>
        <LabInfoBox>
          <p className="mb-1 font-semibold">Safety</p>
          <p>
            The lab only parses the editor buffer in the browser. Your
            code is never executed.
          </p>
        </LabInfoBox>
      </div>
    );
  }

  if (section === "simulation") {
    return (
      <div className="space-y-4">
        <LabCard title="Interactive Simulation" icon={Play}>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600">
            <p>The token follows CFG edges only. User code is never eval&apos;d or run as a process.</p>
            <p>
              Play / Pause / Step / Reset. At diamonds, pick True or False. Loop nodes: True = enter body,
              False = exit loop.
            </p>
          </div>
        </LabCard>

        <LabCard title="Workbench" icon={RefreshCw}>
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto text-xs text-slate-500">
              Edit the Python, analyze real metrics, then walk the control-flow graph.
            </p>
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
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {(analyzing || analysisReady) && (
            <div className="mt-3 border-t border-slate-100 pt-2">
              <Pipeline />
            </div>
          )}
        </LabCard>

        <LabCard title="Python editor" icon={BookOpen} padded={false}>
          <div className="h-[640px]">
            <CodeWorkspace />
          </div>
        </LabCard>

        <div id="exp1-cfg-graph" className="scroll-mt-24">
        <LabCard title="Control-flow graph" icon={GitCompare} padded={!analysisReady}>
          {analysisReady ? (
            <div className="h-[600px]">
              <CfgView />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <GitCompare className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No graph yet</p>
              <p className="max-w-sm text-xs text-slate-500">
                Click <span className="font-medium text-slate-700">Analyze Code</span> above to build the
                control-flow graph, then Play or Step through it.
              </p>
            </div>
          )}
        </LabCard>
        </div>
      </div>
    );
  }

  if (section === "results") {
    return <MetricsDashboard />;
  }

  if (section === "exercise") {
    return (
      <div className="space-y-4">
        <LabCard title="Exercise" icon={ListChecks}>
          <p className="text-sm leading-relaxed text-slate-600">
            Answer questions from the live analysis. Refactor, re-analyze, then compare.
          </p>
        </LabCard>
        <ExercisePanel />
      </div>
    );
  }

  if (section === "analysis") {
    return (
      <div className="space-y-4">
        <LabCard title="Analysis" icon={FlaskConical}>
          <p className="text-sm leading-relaxed text-slate-600">
            Which functions are highly complex, and why? How does LOC relate to CC? What do Halstead volume
            and effort say about review cost?
          </p>
        </LabCard>
        <InsightsList />
      </div>
    );
  }

  if (section === "comparison") {
    return (
      <div className="space-y-4">
        <LabCard title="Before / After Comparison" icon={GitCompare}>
          <p className="text-sm leading-relaxed text-slate-600">
            Save a baseline, refactor, analyze again. Percentages use the two real AnalysisResult payloads.
          </p>
        </LabCard>
        <ComparisonPanel />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LabCard title="Conclusion" icon={FileText}>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>Size, path count, and operator/operand effort are complementary views of quality.</p>
          <p>
            Metrics guide refactoring: extract predicates, flatten nests, shrink vocabulary — then verify
            with a second analysis run.
          </p>
        </div>
      </LabCard>
      <ReportPanel />
    </div>
  );
}
