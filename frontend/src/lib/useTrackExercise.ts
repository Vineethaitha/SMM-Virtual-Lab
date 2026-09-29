import { useEffect, useRef } from "react";
import { type LabKey, upsertLabProgress } from "@/lib/labProgress";

/** Records exercise completion once when `done` becomes true. */
export function useTrackExercise(labKey: LabKey, done: boolean) {
  const sent = useRef(false);
  useEffect(() => {
    if (!done || sent.current) return;
    sent.current = true;
    void upsertLabProgress(labKey, { exercise: true });
  }, [done, labKey]);
}
