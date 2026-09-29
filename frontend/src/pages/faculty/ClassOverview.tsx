import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Check, ChevronRight, Loader2, Minus, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LAB_KEYS,
  SORT_LABEL,
  STATUS_LABEL,
  fmtDate,
  labTitle,
  matchesQuery,
  relativeTime,
  sortStudents,
  stage,
  type SortKey,
  type StudentStatus,
  type StudentSummary,
} from "./facultyData";
import { Avatar } from "./StudentDetail";

type Filter = "all" | StudentStatus;

const FILTERS: Filter[] = ["all", "not_started", "in_progress", "labs_done", "final_done"];

export function ClassOverview({
  students,
  loading,
  onOpen,
}: {
  students: StudentSummary[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("name");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: students.length, not_started: 0, in_progress: 0, labs_done: 0, final_done: 0 };
    for (const s of students) c[s.status] += 1;
    return c;
  }, [students]);

  const rows = useMemo(
    () =>
      sortStudents(
        students.filter((s) => (filter === "all" || s.status === filter) && matchesQuery(s, query)),
        sort,
      ),
    [students, filter, query, sort],
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
      <div className="space-y-3 border-b border-border/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, registration number or email"
              className="h-10 w-full rounded-full border border-input bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
            />
          </div>
          <label className="relative flex items-center">
            <ArrowUpDown className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 w-full appearance-none rounded-full border border-input bg-white pl-10 pr-8 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 sm:w-52"
              aria-label="Sort students"
            >
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition",
                filter === f
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {f === "all" ? "All students" : STATUS_LABEL[f]}
              <span
                className={cn(
                  "rounded-full px-1.5 tabular-nums",
                  filter === f ? "bg-white/20" : "bg-slate-100 text-foreground/70",
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading class progress…
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold">
            {students.length === 0 ? "No students yet" : "No students match these filters"}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {students.length === 0
              ? "Students appear here after they sign in and save their name and registration number."
              : "Try a different search or status filter."}
          </p>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="sticky left-0 z-10 border-b border-border/60 bg-slate-50 px-4 py-3 text-left">Student</th>
                {LAB_KEYS.map((k) => (
                  <th
                    key={k}
                    title={labTitle(k)}
                    className={cn("border-b border-border/60 px-1 py-3 text-center", k === "final" && "text-amber-700")}
                  >
                    {k === "final" ? "Final" : `L${k}`}
                  </th>
                ))}
                <th className="border-b border-border/60 px-4 py-3 text-left">Progress</th>
                <th className="border-b border-border/60 px-4 py-3 text-left">Last active</th>
                <th className="border-b border-border/60 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.profile.id} onClick={() => onOpen(s.profile.id)} className="group cursor-pointer">
                  <td className="sticky left-0 z-10 border-b border-border/40 bg-white px-4 py-2.5 transition group-hover:bg-blue-50/60">
                    <div className="flex items-center gap-3">
                      <Avatar profile={s.profile} size="sm" />
                      <div className="min-w-0">
                        <p className="max-w-[180px] truncate font-semibold">{s.profile.full_name || "Name not set"}</p>
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {s.profile.registration_number || s.profile.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  {LAB_KEYS.map((k) => (
                    <td key={k} className="border-b border-border/40 px-1 py-2.5 text-center transition group-hover:bg-blue-50/60">
                      <StatusCell student={s} labKey={k} />
                    </td>
                  ))}
                  <td className="border-b border-border/40 px-4 py-2.5 transition group-hover:bg-blue-50/60">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full", s.percent === 100 ? "bg-emerald-500" : "bg-primary")}
                          style={{ width: `${s.percent}%` }}
                        />
                      </div>
                      <span className="w-9 text-xs font-semibold tabular-nums">{s.percent}%</span>
                    </div>
                  </td>
                  <td
                    className="whitespace-nowrap border-b border-border/40 px-4 py-2.5 text-xs text-muted-foreground transition group-hover:bg-blue-50/60"
                    title={s.lastActive ? new Date(s.lastActive).toLocaleString() : undefined}
                  >
                    {relativeTime(s.lastActive)}
                  </td>
                  <td className="border-b border-border/40 px-2 py-2.5 text-muted-foreground transition group-hover:bg-blue-50/60">
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {rows.length} of {students.length} students
          </span>
          <span className="flex items-center gap-3">
            <Legend className="bg-emerald-500 text-white" label="Report downloaded" icon={<Check className="h-2.5 w-2.5" />} />
            <Legend className="bg-amber-100 text-amber-700" label="In progress" icon={<Minus className="h-2.5 w-2.5" />} />
            <Legend className="bg-slate-100" label="Not started" />
          </span>
        </div>
      ) : null}
    </section>
  );
}

function StatusCell({ student, labKey }: { student: StudentSummary; labKey: (typeof LAB_KEYS)[number] }) {
  const row = student.labs.get(labKey);
  const mark = stage(row);
  const lines = [labTitle(labKey)];
  if (row?.quiz_completed_at) lines.push(`Quiz ${row.quiz_score ?? "—"}/${row.quiz_total ?? "—"}`);
  if (row?.report_downloaded_at) lines.push(`Report ${fmtDate(row.report_downloaded_at)}`);
  else if (mark === "partial") lines.push("Report not downloaded yet");
  else lines.push("Not started");
  return (
    <span
      title={lines.join("\n")}
      className={cn(
        "mx-auto flex h-6 w-6 items-center justify-center rounded-lg",
        mark === "done" && "bg-emerald-500 text-white",
        mark === "partial" && "bg-amber-100 text-amber-700",
        mark === "none" && "bg-slate-100 text-slate-300",
      )}
    >
      {mark === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : mark === "partial" ? <Minus className="h-3.5 w-3.5" strokeWidth={3} /> : null}
    </span>
  );
}

function Legend({ className, label, icon }: { className: string; label: string; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded", className)}>{icon}</span>
      {label}
    </span>
  );
}
