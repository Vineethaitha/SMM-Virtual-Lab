import { useMemo, useState, type ReactNode } from "react";
import { Award, BookOpenCheck, CheckCircle2, CircleDashed, ClipboardCheck, FileText, Loader2, Mail, Search, Timer } from "lucide-react";
import { SavedReportButton } from "@/components/quiz/SavedReportButton";
import { cn } from "@/lib/utils";
import {
  LAB_KEYS,
  STATUS_LABEL,
  fmtDateTime,
  initials,
  labTitle,
  matchesQuery,
  relativeTime,
  stage,
  tally,
  type ProfileRow,
  type Stage,
  type StudentStatus,
  type StudentSummary,
} from "./facultyData";

const AVATAR_TONES = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

export function Avatar({ profile, size = "md" }: { profile: ProfileRow; size?: "sm" | "md" | "lg" }) {
  const hash = [...profile.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        AVATAR_TONES[hash % AVATAR_TONES.length],
        size === "sm" && "h-8 w-8 text-[11px]",
        size === "md" && "h-10 w-10 text-xs",
        size === "lg" && "h-14 w-14 text-base",
      )}
    >
      {initials(profile.full_name, profile.email)}
    </span>
  );
}

const STATUS_TONE: Record<StudentStatus, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-50 text-amber-700",
  labs_done: "bg-blue-50 text-blue-700",
  final_done: "bg-emerald-50 text-emerald-700",
};

const STAGE_PILL: Record<Stage, { label: string; className: string }> = {
  done: { label: "Completed", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  partial: { label: "In progress", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  none: { label: "Not started", className: "bg-slate-50 text-slate-500 ring-slate-200" },
};

export function StudentDetail({
  students,
  loading,
  selectedId,
  onSelect,
}: {
  students: StudentSummary[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const list = useMemo(() => students.filter((s) => matchesQuery(s, query)), [students, query]);
  const selected = students.find((s) => s.profile.id === selectedId) ?? list[0] ?? null;

  return (
    <section className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm lg:sticky lg:top-24">
        <div className="border-b border-border/60 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students"
              className="h-10 w-full rounded-full border border-input bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15"
            />
          </div>
        </div>
        <div className="max-h-[36vh] overflow-y-auto p-2 lg:max-h-[64vh]">
          {loading ? (
            <p className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading students…
            </p>
          ) : list.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">No students match that search.</p>
          ) : (
            list.map((s) => {
              const active = selected?.profile.id === s.profile.id;
              return (
                <button
                  key={s.profile.id}
                  type="button"
                  onClick={() => onSelect(s.profile.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-slate-50",
                  )}
                >
                  <Avatar profile={s.profile} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-semibold", active && "text-primary")}>
                      {s.profile.full_name || "Name not set"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.profile.registration_number || s.profile.email}
                    </p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {s.completedAll}/{LAB_KEYS.length}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selected ? (
        <StudentCard student={selected} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center text-sm text-muted-foreground">
          {loading ? "Loading…" : "Pick a student to see their lab-by-lab progress."}
        </div>
      )}
    </section>
  );
}

function StudentCard({ student }: { student: StudentSummary }) {
  const { profile, labs } = student;
  const counts = tally(labs);
  return (
    <article className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar profile={profile} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold tracking-tight">{profile.full_name || "Name not set"}</h2>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STATUS_TONE[student.status])}>
                  {STATUS_LABEL[student.status]}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-sm text-foreground/70">
                {profile.registration_number || "Registration number not set"}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {profile.email}
              </p>
            </div>
          </div>
          <ProgressRing percent={student.percent} label={`${student.completedAll} of ${LAB_KEYS.length}`} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Mini icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Exercises" value={`${counts.exercise}/${LAB_KEYS.length}`} />
          <Mini icon={<BookOpenCheck className="h-3.5 w-3.5" />} label="Quizzes" value={`${counts.quiz}/${LAB_KEYS.length}`} />
          <Mini icon={<FileText className="h-3.5 w-3.5" />} label="Reports" value={`${counts.report}/${LAB_KEYS.length}`} />
          <Mini icon={<Timer className="h-3.5 w-3.5" />} label="Last active" value={relativeTime(student.lastActive)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h3 className="text-sm font-semibold">Lab-by-lab progress</h3>
          <p className="text-xs text-muted-foreground">Download any issued report</p>
        </div>
        <ul className="divide-y divide-border/50">
          {LAB_KEYS.map((key) => {
            const row = labs.get(key);
            const mark = stage(row);
            const pill = STAGE_PILL[mark];
            const score = row?.quiz_completed_at && row.quiz_total ? (row.quiz_score ?? 0) / row.quiz_total : null;
            return (
              <li key={key} className="flex flex-col gap-3 px-5 py-3.5 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                      key === "final" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary",
                    )}
                  >
                    {key === "final" ? <Award className="h-4 w-4" /> : key.padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{labTitle(key)}</p>
                    <p className="text-xs text-muted-foreground">
                      {row?.exercise_completed_at ? `Exercise ${fmtDateTime(row.exercise_completed_at)}` : "Exercise not done"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:justify-end">
                  <div className="w-28">
                    <p className="text-[11px] text-muted-foreground">Quiz</p>
                    {score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              score >= 0.75 ? "bg-emerald-500" : score >= 0.5 ? "bg-amber-500" : "bg-red-500",
                            )}
                            style={{ width: `${Math.round(score * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums">
                          {row?.quiz_score}/{row?.quiz_total}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Not taken</p>
                    )}
                  </div>
                  <div className="w-28">
                    <p className="text-[11px] text-muted-foreground">Report</p>
                    <p className={cn("text-xs", row?.report_downloaded_at ? "font-medium" : "text-slate-400")}>
                      {row?.report_downloaded_at ? fmtDateTime(row.report_downloaded_at) : "Not issued"}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", pill.className)}>
                    {mark === "done" ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
                    {pill.label}
                  </span>
                  <div className="flex w-36 justify-end">
                    {row?.report_payload ? (
                      <SavedReportButton
                        labKey={key}
                        payload={row.report_payload}
                        label="Download"
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {row?.report_downloaded_at ? "No saved copy" : "—"}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3 sm:flex-col sm:gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-slate-100" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - percent / 100)}
            className={cn("transition-all duration-700", percent === 100 ? "stroke-emerald-500" : "stroke-primary")}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums">{percent}%</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label} complete</span>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
