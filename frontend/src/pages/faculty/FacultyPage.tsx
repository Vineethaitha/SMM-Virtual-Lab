import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Download, GraduationCap, LayoutList, Table2, TrendingUp, Users } from "lucide-react";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LabKey, LabProgressRow } from "@/lib/labProgress";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ClassOverview } from "./ClassOverview";
import { StudentDetail } from "./StudentDetail";
import {
  EXPERIMENT_KEYS,
  LAB_KEYS,
  downloadCsv,
  labTitle,
  sortStudents,
  stage,
  summarize,
  type ProfileRow,
} from "./facultyData";

type Tab = "overview" | "detail";

export function FacultyPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [progress, setProgress] = useState<LabProgressRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    Promise.all([
      supabase.from("profiles").select("id,email,full_name,registration_number,role"),
      supabase.from("lab_progress").select("*"),
    ]).then(([p, g]) => {
      if (p.error) setError(p.error.message);
      else setProfiles((p.data ?? []) as ProfileRow[]);
      if (g.error) setError(g.error.message);
      else setProgress((g.data ?? []) as LabProgressRow[]);
      setLoading(false);
    });
  }, []);

  const students = useMemo(() => {
    const byUser = new Map<string, Map<LabKey, LabProgressRow>>();
    for (const row of progress) {
      const inner = byUser.get(row.user_id) ?? new Map<LabKey, LabProgressRow>();
      inner.set(row.lab_key, row);
      byUser.set(row.user_id, inner);
    }
    return sortStudents(
      profiles.filter((p) => p.role === "student").map((p) => summarize(p, byUser.get(p.id))),
      "name",
    );
  }, [profiles, progress]);

  const kpis = useMemo(() => {
    const n = students.length;
    const avg = n ? students.reduce((s, x) => s + x.completedLabs, 0) / n : 0;
    const allTen = students.filter((s) => s.completedLabs === EXPERIMENT_KEYS.length).length;
    const finalDone = students.filter((s) => s.status === "final_done").length;
    return { n, avg, allTen, finalDone };
  }, [students]);

  const perLab = useMemo(
    () =>
      LAB_KEYS.map((key) => {
        const done = students.filter((s) => stage(s.labs.get(key)) === "done").length;
        return { key, done, pct: students.length ? Math.round((done / students.length) * 100) : 0 };
      }),
    [students],
  );

  const openStudent = (id: string) => {
    setSelectedId(id);
    setTab("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pct = (x: number) => (kpis.n ? `${Math.round((x / kpis.n) * 100)}% of class` : "No students yet");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        title="Faculty dashboard"
        right={
          <>
            <Link to="/" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to labs
              </Button>
            </Link>
            <AccountMenu />
          </>
        }
      />

      <div className="relative overflow-hidden pt-16 sm:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-background to-background" />

        <main className="relative mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <Badge className="border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <GraduationCap className="mr-2 h-4 w-4" />
                Faculty · 21CSC403T
              </Badge>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Student{" "}
                <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">progress</span>
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                Track every student across the 10 experiments and the final quiz, and download their issued reports.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-full bg-white px-5"
              disabled={loading || students.length === 0}
              onClick={() => downloadCsv(students)}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </motion.section>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={<Users className="h-4 w-4" />} tone="blue" label="Students" value={loading ? "—" : String(kpis.n)} hint="Signed in with a profile" />
            <Kpi
              icon={<TrendingUp className="h-4 w-4" />}
              tone="amber"
              label="Avg labs completed"
              value={loading ? "—" : kpis.avg.toFixed(1)}
              hint="out of 10 experiments"
            />
            <Kpi
              icon={<LayoutList className="h-4 w-4" />}
              tone="emerald"
              label="Completed all 10"
              value={loading ? "—" : String(kpis.allTen)}
              hint={pct(kpis.allTen)}
            />
            <Kpi
              icon={<Award className="h-4 w-4" />}
              tone="violet"
              label="Final quiz done"
              value={loading ? "—" : String(kpis.finalDone)}
              hint={pct(kpis.finalDone)}
            />
          </section>

          <section className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold">Completion by lab</h2>
              <p className="text-xs text-muted-foreground">Share of students with a downloaded report</p>
            </div>
            <div className="mt-4 grid grid-cols-11 items-end gap-1.5 sm:gap-3">
              {perLab.map(({ key, done, pct: p }) => (
                <div key={key} className="flex flex-col items-center gap-1.5" title={`${labTitle(key)} · ${done} of ${students.length} students`}>
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground sm:text-xs">{p}%</span>
                  <div className="relative flex h-24 w-full items-end overflow-hidden rounded-lg bg-slate-100">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${p}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={cn(
                        "w-full rounded-lg",
                        key === "final" ? "bg-gradient-to-t from-amber-500 to-amber-300" : "bg-gradient-to-t from-blue-600 to-blue-400",
                      )}
                    />
                  </div>
                  <span className={cn("text-[10px] font-semibold sm:text-xs", key === "final" ? "text-amber-700" : "text-foreground/70")}>
                    {key === "final" ? "Final" : `L${key}`}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="inline-flex rounded-full border border-border/60 bg-white p-1 shadow-sm">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<Table2 className="h-4 w-4" />}>
              Class overview
            </TabButton>
            <TabButton active={tab === "detail"} onClick={() => setTab("detail")} icon={<Users className="h-4 w-4" />}>
              Student detail
            </TabButton>
          </div>

          {tab === "overview" ? (
            <ClassOverview students={students} loading={loading} onOpen={openStudent} />
          ) : (
            <StudentDetail students={students} loading={loading} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </main>
      </div>
    </div>
  );
}

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

function Kpi({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tone: keyof typeof TONES;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", TONES[tone])}>{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? "bg-primary text-white shadow-md shadow-primary/25" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
