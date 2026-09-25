import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LabCard } from "@/components/lab/LabCard";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";
import { getExperiment } from "@/data/experiments";

export function ComingSoonPage() {
  const { id } = useParams();
  const exp = getExperiment(Number(id));

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <ExperimentSidebar />
      <div className="min-w-0 flex-1">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <p className="relative mb-1 px-6 pt-6 text-xs text-white/70">Experiment {exp?.id ?? id}</p>
          <h1 className="relative px-6 pb-6 text-2xl font-bold">{exp?.title ?? "Experiment"}</h1>
        </div>

        <div className="mx-auto max-w-lg px-4 py-16">
          <LabCard title="Coming soon">
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Construction className="h-12 w-12 text-amber-500" />
              <p className="text-sm text-slate-600">
                {exp?.description ?? "This experiment is not available yet."} This lab will be added in a
                later version. Experiments 1 through 10 are available now.
              </p>
              <div className="flex gap-2">
                <Link to="/">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link to="/lab/1">
                  <Button>Open Experiment 1</Button>
                </Link>
              </div>
            </div>
          </LabCard>
        </div>
      </div>
    </div>
  );
}
