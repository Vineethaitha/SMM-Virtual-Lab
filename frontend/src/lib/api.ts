import type { AnalysisResult } from "./types";

const API = "/api/v1";

export async function analyzeSource(source: string): Promise<AnalysisResult> {
  const res = await fetch(`${API}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message || `Analysis failed (${res.status})`;
    const err = new Error(message) as Error & { lineno?: number };
    if (detail?.lineno) err.lineno = detail.lineno;
    throw err;
  }
  return res.json();
}
