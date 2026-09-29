import { EXPERIMENTS } from "@/data/experiments";
import type { LabKey, LabProgressRow } from "@/lib/labProgress";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  registration_number: string | null;
  role: string;
};

export const LAB_KEYS: LabKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "final"];
export const EXPERIMENT_KEYS = LAB_KEYS.filter((k) => k !== "final");

export type Stage = "done" | "partial" | "none";
export type StudentStatus = "not_started" | "in_progress" | "labs_done" | "final_done";

export const STATUS_LABEL: Record<StudentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  labs_done: "All 10 labs done",
  final_done: "Final done",
};

export function labTitle(key: LabKey) {
  if (key === "final") return "Comprehensive quiz";
  return EXPERIMENTS.find((e) => String(e.id) === key)?.title ?? `Lab ${key}`;
}

export function stage(row: LabProgressRow | undefined): Stage {
  if (!row || (!row.exercise_completed_at && !row.quiz_completed_at && !row.report_downloaded_at)) return "none";
  return row.report_downloaded_at ? "done" : "partial";
}

export function tally(labs: Map<LabKey, LabProgressRow> | undefined) {
  let exercise = 0;
  let quiz = 0;
  let report = 0;
  for (const key of LAB_KEYS) {
    const row = labs?.get(key);
    if (row?.exercise_completed_at) exercise += 1;
    if (row?.quiz_completed_at) quiz += 1;
    if (row?.report_downloaded_at) report += 1;
  }
  return { exercise, quiz, report };
}

export type StudentSummary = {
  profile: ProfileRow;
  labs: Map<LabKey, LabProgressRow>;
  completedLabs: number;
  completedAll: number;
  percent: number;
  lastActive: string | null;
  status: StudentStatus;
  started: boolean;
};

export function summarize(profile: ProfileRow, labs: Map<LabKey, LabProgressRow> | undefined): StudentSummary {
  const map = labs ?? new Map<LabKey, LabProgressRow>();
  const completedLabs = EXPERIMENT_KEYS.filter((k) => stage(map.get(k)) === "done").length;
  const finalDone = stage(map.get("final")) === "done";
  const completedAll = completedLabs + (finalDone ? 1 : 0);
  let lastActive: string | null = null;
  let started = false;
  for (const row of map.values()) {
    if (stage(row) !== "none") started = true;
    for (const t of [row.exercise_completed_at, row.quiz_completed_at, row.report_downloaded_at]) {
      if (t && (!lastActive || t > lastActive)) lastActive = t;
    }
  }
  const status: StudentStatus = finalDone
    ? "final_done"
    : completedLabs === EXPERIMENT_KEYS.length
      ? "labs_done"
      : started
        ? "in_progress"
        : "not_started";
  return {
    profile,
    labs: map,
    completedLabs,
    completedAll,
    percent: Math.round((completedAll / LAB_KEYS.length) * 100),
    lastActive,
    status,
    started,
  };
}

export type SortKey = "name" | "reg" | "most" | "least" | "recent";

export const SORT_LABEL: Record<SortKey, string> = {
  name: "Name (A–Z)",
  reg: "Registration no.",
  most: "Most progress",
  least: "Least progress",
  recent: "Last active",
};

const displayName = (s: StudentSummary) => (s.profile.full_name || s.profile.email).toLowerCase();

export function sortStudents(list: StudentSummary[], key: SortKey) {
  const out = list.slice();
  out.sort((a, b) => {
    switch (key) {
      case "reg":
        return (a.profile.registration_number ?? "~").localeCompare(b.profile.registration_number ?? "~");
      case "most":
        return b.completedAll - a.completedAll || displayName(a).localeCompare(displayName(b));
      case "least":
        return a.completedAll - b.completedAll || displayName(a).localeCompare(displayName(b));
      case "recent":
        return (b.lastActive ?? "").localeCompare(a.lastActive ?? "");
      default:
        return displayName(a).localeCompare(displayName(b));
    }
  });
  return out;
}

export function matchesQuery(s: StudentSummary, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    (s.profile.full_name ?? "").toLowerCase().includes(q) ||
    (s.profile.registration_number ?? "").toLowerCase().includes(q) ||
    s.profile.email.toLowerCase().includes(q)
  );
}

export function initials(name: string | null, email: string) {
  const source = (name || email.split("@")[0] || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return fmtDate(iso);
}

function csvCell(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(students: StudentSummary[]) {
  const labHeads = LAB_KEYS.flatMap((k) => {
    const name = k === "final" ? "Final" : `Lab ${k}`;
    return [`${name} status`, `${name} quiz`];
  });
  const head = ["Name", "Registration", "Email", ...labHeads, "Completed", "Progress %", "Last active"];
  const rows = students.map((s) => [
    s.profile.full_name ?? "",
    s.profile.registration_number ?? "",
    s.profile.email,
    ...LAB_KEYS.flatMap((k) => {
      const row = s.labs.get(k);
      const st = stage(row);
      const score = row?.quiz_completed_at ? `${row.quiz_score ?? ""}/${row.quiz_total ?? ""}` : "";
      return [st === "done" ? "Completed" : st === "partial" ? "In progress" : "Not started", score];
    }),
    `${s.completedAll}/${LAB_KEYS.length}`,
    s.percent,
    s.lastActive ? new Date(s.lastActive).toISOString() : "",
  ]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function downloadCsv(students: StudentSummary[]) {
  const blob = new Blob([`\uFEFF${toCsv(students)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `21csc403t-class-progress-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
