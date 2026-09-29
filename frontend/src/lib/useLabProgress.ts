import { useSyncExternalStore } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { LabKey, LabProgressRow } from "@/lib/labProgress";
import { useAuth } from "@/state/AuthContext";

type Snapshot = { rows: LabProgressRow[]; loaded: boolean };

let snapshot: Snapshot = { rows: [], loaded: !supabaseConfigured };
let inflight: Promise<void> | null = null;
let started = false;
let currentUserId: string | null | undefined;
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((fn) => fn());
}

/** Refetch the signed-in user's progress rows and notify every subscriber. */
export function refreshLabProgress(): Promise<void> {
  if (!supabase) return Promise.resolve();
  if (inflight) return inflight;
  const client = supabase;
  inflight = (async () => {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      emit({ rows: [], loaded: true });
      return;
    }
    const { data } = await client.from("lab_progress").select("*").eq("user_id", session.user.id);
    emit({ rows: (data as LabProgressRow[] | null) ?? [], loaded: true });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!started && supabase) {
    started = true;
    supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      if (uid === currentUserId) return;
      currentUserId = uid;
      emit({ rows: [], loaded: false });
      void refreshLabProgress();
    });
  }
  return () => {
    listeners.delete(fn);
  };
}

export const LAB_COUNT = 10;

export function useLabProgress() {
  const { rows, loaded } = useSyncExternalStore(subscribe, () => snapshot);
  const { profile } = useAuth();
  const bypass = !supabaseConfigured || profile?.role === "faculty";

  const byKey = (key: LabKey) => rows.find((r) => r.lab_key === key);
  const isComplete = (key: LabKey) => Boolean(byKey(key)?.report_downloaded_at);

  /** Experiments unlock in order: N needs N-1 completed. Faculty see everything. */
  const isUnlocked = (id: number) => bypass || id <= 1 || isComplete(String(id - 1) as LabKey);

  const completedCount = Array.from({ length: LAB_COUNT }, (_, i) => String(i + 1) as LabKey).filter(isComplete)
    .length;
  const finalUnlocked = bypass || completedCount === LAB_COUNT;

  return { rows, loaded, byKey, isComplete, isUnlocked, completedCount, finalUnlocked };
}
