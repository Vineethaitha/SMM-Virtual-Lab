import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";
import { getExperiment } from "@/data/experiments";

export function ComingSoonPage() {
  const { id } = useParams();
  const exp = getExperiment(Number(id));

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <ExperimentSidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 hidden h-14 items-center border-b border-border bg-card/80 px-4 backdrop-blur-sm lg:flex">
          <div className="text-sm">
            <span className="text-muted-foreground">Experiments</span>
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="font-medium">{exp?.title ?? "Experiment"}</span>
          </div>
        </header>

        <div className="gradient-hero relative overflow-hidden px-6 py-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <p className="relative mb-1 text-xs text-white/70">Experiment {exp?.id ?? id}</p>
          <h1 className="relative text-2xl font-bold">{exp?.title ?? "Experiment"}</h1>
        </div>

        <div className="mx-auto max-w-lg px-4 py-16">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <Construction className="h-12 w-12 text-accent" />
              <h2 className="text-xl font-semibold">Coming soon</h2>
              <p className="text-sm text-muted-foreground">
                {exp?.description ?? "This experiment is not available yet."} This lab will be added in a
                later version. Experiments 1, 4, and 5 are available now.
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
