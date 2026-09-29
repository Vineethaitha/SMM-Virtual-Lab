import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";
import { EXPERIMENTS, getExperiment } from "@/data/experiments";
import type { LabKey } from "@/lib/labProgress";
import { useLabProgress } from "@/lib/useLabProgress";
import { cn } from "@/lib/utils";

export function LockedExperimentPage({ id }: { id: number }) {
  const exp = getExperiment(id);
  const { isComplete, completedCount } = useLabProgress();
  const nextOpen = EXPERIMENTS.find((e) => !isComplete(String(e.id) as LabKey))?.id ?? 1;
  const previous = getExperiment(id - 1);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <ExperimentSidebar />
      <div className="min-w-0 flex-1">
        <div className="relative overflow-hidden bg-[#0b1b33] text-white">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#c49a3a]/20 blur-3xl" />
          <div className="h-1 bg-[#c49a3a]" />
          <div className="relative px-6 py-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#e8d6a0]">
              Experiment {id} · Locked
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{exp?.title ?? "Experiment"}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-xl px-4 py-14">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="flex flex-col items-center px-8 pb-6 pt-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0b1b33] text-[#e8d6a0] shadow-lg">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-[#0b1b33]">Complete the previous experiment first</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                Experiments unlock in order. Finish{" "}
                <span className="font-semibold text-slate-800">
                  Experiment {id - 1}
                  {previous ? ` — ${previous.title}` : ""}
                </span>{" "}
                by taking its quiz and downloading the report.
              </p>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-8 py-5">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Your progress</span>
                <span>
                  {completedCount} / {EXPERIMENTS.length} experiments
                </span>
              </div>
              <div className="flex gap-1">
                {EXPERIMENTS.map((e) => {
                  const done = isComplete(String(e.id) as LabKey);
                  return (
                    <div
                      key={e.id}
                      title={`Experiment ${e.id}`}
                      className={cn(
                        "h-2 flex-1 rounded-full",
                        done ? "bg-emerald-500" : e.id === nextOpen ? "bg-[#c49a3a]" : "bg-slate-200",
                      )}
                    />
                  );
                })}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Next up: Experiment {nextOpen}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 px-8 py-6">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link to={`/lab/${nextOpen}`}>
                <Button className="bg-[#0b1b33] text-white hover:bg-[#163056]">
                  Continue Experiment {nextOpen}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
