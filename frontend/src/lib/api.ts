import { analyzePython, SyntaxAnalysisError } from "@/lib/pythonAnalyze";
import type { AnalysisResult } from "./types";

export async function analyzeSource(source: string): Promise<AnalysisResult> {
  try {
    return analyzePython(source);
  } catch (e) {
    if (e instanceof SyntaxAnalysisError) {
      const err = new Error(e.message) as Error & { lineno?: number };
      err.lineno = e.lineno;
      throw err;
    }
    throw e;
  }
}
