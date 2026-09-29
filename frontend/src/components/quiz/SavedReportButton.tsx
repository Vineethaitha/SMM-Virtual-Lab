import { useState, type MouseEvent } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LabKey } from "@/lib/labProgress";
import type { SavedReport } from "@/lib/reportPdf";
import { useLabProgress } from "@/lib/useLabProgress";
import { cn } from "@/lib/utils";

/** Re-downloads the saved copy of an issued report. Renders nothing if no copy is saved. */
export function SavedReportButton({
  labKey,
  payload,
  label = "Download report again",
  size = "default",
  className,
}: {
  labKey: LabKey;
  /** Another user's saved copy (faculty view); overrides the signed-in user's progress. */
  payload?: SavedReport | null;
  label?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const { byKey } = useLabProgress();
  const [busy, setBusy] = useState(false);
  const saved = payload !== undefined ? payload : byKey(labKey)?.report_payload;
  if (!saved) return null;

  const onClick = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      const { downloadSavedReport } = await import("@/lib/reportPdf");
      await downloadSavedReport(saved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      className={cn("bg-emerald-600 text-white hover:bg-emerald-700", className)}
      disabled={busy}
      onClick={(e) => void onClick(e)}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {busy ? "Preparing PDF…" : label}
    </Button>
  );
}
