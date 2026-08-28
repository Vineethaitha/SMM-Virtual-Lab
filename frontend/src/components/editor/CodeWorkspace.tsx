import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect } from "react";
import { useLab } from "@/state/LabContext";

export function CodeWorkspace() {
  const { source, setSource, analysis, highlightRange, editorRef, jumpToFunction } = useLab();

  const onMount: OnMount = (ed) => {
    editorRef.current = ed;
    // Flex parents often mount at 0 height; force a layout once the pane has size.
    requestAnimationFrame(() => ed.layout());
  };

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !analysis) return;
    const decorations = analysis.functions.map((fn) => {
      const cls = fn.cc >= 10 ? "cc-high" : fn.cc >= 6 ? "cc-mid" : "cc-low";
      return {
        range: {
          startLineNumber: fn.lineno,
          startColumn: 1,
          endLineNumber: fn.end_lineno,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: cls,
          glyphMarginClassName: `${cls}-glyph`,
          overviewRuler: {
            color: fn.cc >= 10 ? "#f87171" : fn.cc >= 6 ? "#fbbf24" : "#34d399",
            position: 1,
          },
        },
      };
    });
    if (highlightRange) {
      decorations.push({
        range: {
          startLineNumber: highlightRange.start,
          startColumn: 1,
          endLineNumber: highlightRange.end,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "cc-select",
          glyphMarginClassName: "cc-select-glyph",
          overviewRuler: { color: "#38bdf8", position: 2 },
        },
      });
    }
    const ids = ed.deltaDecorations([], decorations);
    return () => {
      ed.deltaDecorations(ids, []);
    };
  }, [analysis, highlightRange, editorRef]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>sample_metrics.py</span>
        <span>Python · static analysis only · editable</span>
      </div>

      {analysis && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border px-2 py-1.5">
          {analysis.functions.map((fn) => (
            <button
              key={fn.qualified_name}
              type="button"
              onClick={() => jumpToFunction(fn.name)}
              className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px] hover:bg-slate-700"
            >
              {fn.name}
              <span
                className={
                  fn.cc >= 10 ? "text-red-300" : fn.cc >= 6 ? "text-amber-300" : "text-emerald-300"
                }
              >
                {" "}
                CC {fn.cc}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Absolute fill: Monaco's height="100%" fails when the flex parent has no explicit height. */}
      <div className="relative min-h-[220px] flex-1">
        <div className="absolute inset-0">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme="vs-dark"
            value={source}
            onChange={(v) => setSource(v ?? "")}
            onMount={onMount}
            loading={<div className="p-3 text-xs text-muted-foreground">Loading editor…</div>}
            options={{
              minimap: { enabled: true },
              fontSize: 13,
              fontFamily: "IBM Plex Mono, monospace",
              glyphMargin: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
}
