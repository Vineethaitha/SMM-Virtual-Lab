import { Link, useNavigate, useParams } from "react-router-dom";
import { Home } from "lucide-react";
import { EXPERIMENTS } from "@/data/experiments";
import { SrmvlLogo } from "@/components/brand/SrmLogos";
import { cn } from "@/lib/utils";

function ExperimentLinks({ current }: { current: number }) {
  return (
    <>
      <Link
        to="/"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>
      <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Experiments
      </p>
      {EXPERIMENTS.map((exp) => {
        const active = current === exp.id;
        return (
          <Link
            key={exp.id}
            to={`/lab/${exp.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
              active ? "bg-primary text-white shadow-sm" : "text-foreground hover:bg-primary/10",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                active
                  ? "bg-white/20 text-white"
                  : exp.implemented
                    ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {exp.id}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block text-[13px] font-medium leading-snug",
                  active ? "text-white" : "text-foreground group-hover:text-primary",
                )}
              >
                {exp.title}
              </span>
              {!exp.implemented && (
                <span
                  className={cn(
                    "mt-0.5 block text-[10px]",
                    active ? "text-white/80" : "text-muted-foreground",
                  )}
                >
                  Coming soon
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function ExperimentSidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const current = Number(id);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-white lg:flex">
        <div className="sticky top-0 z-10 border-b border-border bg-white p-3">
          <Link to="/" className="block px-1">
            <SrmvlLogo className="h-10 w-auto" />
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          <ExperimentLinks current={current} />
        </nav>
      </aside>

      <div className="w-full border-b border-border bg-white lg:hidden">
        <div className="flex items-center gap-3 px-3 py-2">
          <Link to="/">
            <SrmvlLogo className="h-8 w-auto" />
          </Link>
          <select
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
            value={Number.isFinite(current) ? String(current) : "1"}
            onChange={(e) => navigate(`/lab/${e.target.value}`)}
          >
            {EXPERIMENTS.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.id}. {exp.title}
                {!exp.implemented ? " (soon)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
