import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SrmvlLogo } from "@/components/brand/SrmLogos";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { EXPERIMENTS } from "@/data/experiments";
import { supabase } from "@/lib/supabase";
import type { LabKey, LabProgressRow } from "@/lib/labProgress";
import { cn } from "@/lib/utils";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  registration_number: string | null;
  role: string;
};

const LAB_KEYS: LabKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "final"];

function mark(row: LabProgressRow | undefined, field: keyof LabProgressRow) {
  return row?.[field] ? "●" : "○";
}

export function FacultyPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [progress, setProgress] = useState<LabProgressRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("profiles").select("id,email,full_name,registration_number,role"),
      supabase.from("lab_progress").select("*"),
    ]).then(([p, g]) => {
      if (p.error) setError(p.error.message);
      else setProfiles((p.data ?? []) as ProfileRow[]);
      if (g.error) setError(g.error.message);
      else setProgress((g.data ?? []) as LabProgressRow[]);
    });
  }, []);

  const students = useMemo(() => profiles.filter((p) => p.role === "student"), [profiles]);
  const studentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const byUser = useMemo(() => {
    const m = new Map<string, Map<LabKey, LabProgressRow>>();
    for (const row of progress) {
      const inner = m.get(row.user_id) ?? new Map();
      inner.set(row.lab_key, row);
      m.set(row.user_id, inner);
    }
    return m;
  }, [progress]);

  const counts = LAB_KEYS.map((key) => {
    const rows = progress.filter((r) => r.lab_key === key && studentIds.has(r.user_id));
    return {
      key,
      exercise: rows.filter((r) => r.exercise_completed_at).length,
      quiz: rows.filter((r) => r.quiz_completed_at).length,
      report: rows.filter((r) => r.report_downloaded_at).length,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <SrmvlLogo className="h-8 w-auto" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Faculty</p>
              <h1 className="text-lg font-bold">Lab completion</h1>
            </div>
          </div>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-800">How many students completed each lab</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Lab</th>
                  <th className="px-3 py-2">Exercise</th>
                  <th className="px-3 py-2">Quiz</th>
                  <th className="px-3 py-2">Report</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((c) => {
                  const title =
                    c.key === "final" ? "Comprehensive quiz" : EXPERIMENTS.find((e) => String(e.id) === c.key)?.title;
                  return (
                    <tr key={c.key} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium">
                        {c.key === "final" ? "Final" : `Lab ${c.key}`}
                        <span className="ml-2 text-xs font-normal text-slate-500">{title}</span>
                      </td>
                      <td className="px-3 py-2">{c.exercise}</td>
                      <td className="px-3 py-2">{c.quiz}</td>
                      <td className="px-3 py-2">{c.report}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">{students.length} student profiles · counts are unique students per lab.</p>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Per student (● done / ○ not yet)</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  {LAB_KEYS.map((k) => (
                    <th key={k} className="px-2 py-2 text-center">
                      {k === "final" ? "F" : k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const labs = byUser.get(s.id);
                  return (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">{s.full_name ?? "—"}</div>
                        <div className="text-slate-500">{s.registration_number}</div>
                        <div className={cn("truncate text-slate-400")}>{s.email}</div>
                      </td>
                      {LAB_KEYS.map((k) => {
                        const row = labs?.get(k);
                        return (
                          <td key={k} className="px-2 py-2 text-center font-mono text-[11px] leading-4 text-slate-700">
                            <div title="Exercise">{mark(row, "exercise_completed_at")}E</div>
                            <div title="Quiz">{mark(row, "quiz_completed_at")}Q</div>
                            <div title="Report">{mark(row, "report_downloaded_at")}R</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
