import { supabase } from "@/lib/supabase";
import { refreshLabProgress } from "@/lib/useLabProgress";
import type { SavedReport } from "@/lib/reportPdf";

export type LabKey = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "final";

export type LabProgressRow = {
  user_id: string;
  lab_key: LabKey;
  exercise_completed_at: string | null;
  quiz_completed_at: string | null;
  quiz_score: number | null;
  quiz_total: number | null;
  report_downloaded_at: string | null;
  report_payload?: SavedReport | null;
};

export function toLabKey(id: number): LabKey {
  return String(id) as LabKey;
}

export async function upsertLabProgress(
  labKey: LabKey,
  patch: {
    exercise?: boolean;
    quizScore?: number;
    quizTotal?: number;
    report?: boolean;
    reportPayload?: SavedReport | null;
  },
) {
  if (!supabase) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.rpc("touch_lab_progress", {
    p_lab_key: labKey,
    p_exercise: patch.exercise ?? false,
    p_quiz_score: patch.quizScore ?? null,
    p_quiz_total: patch.quizTotal ?? null,
    p_report: patch.report ?? false,
  });
  if (error) console.error("lab progress", error.message);
  if (patch.reportPayload) {
    const { error: saveError } = await supabase
      .from("lab_progress")
      .update({ report_payload: patch.reportPayload })
      .eq("user_id", session.user.id)
      .eq("lab_key", labKey);
    if (saveError) console.error("save report copy", saveError.message);
  }
  await refreshLabProgress();
}
