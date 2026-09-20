import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { editor } from "monaco-editor";
import { analyzeSource } from "@/lib/api";
import { SAMPLE_PYTHON } from "@/lib/sampleCode";
import type { AnalysisResult, CfgNode, FunctionCfg, LabSection } from "@/lib/types";

export const PIPELINE_STEPS = [
  "Source",
  "AST Parse",
  "Functions",
  "LOC",
  "Operators/Operands",
  "Complexity",
  "CFG",
  "Metrics",
  "Insights",
] as const;

type SimStatus = "idle" | "playing" | "paused" | "decision" | "done";

interface LabState {
  source: string;
  setSource: (s: string) => void;
  analysis: AnalysisResult | null;
  baseline: AnalysisResult | null;
  error: string | null;
  analyzing: boolean;
  pipelineIndex: number;
  section: LabSection;
  setSection: (s: LabSection) => void;
  selectedFunction: string | null;
  setSelectedFunction: (n: string | null) => void;
  activeCfg: FunctionCfg | null;
  jumpToFunction: (name: string) => void;
  highlightRange: { start: number; end: number } | null;
  setHighlightRange: (r: { start: number; end: number } | null) => void;
  editorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>;
  analyze: () => Promise<void>;
  saveBaseline: () => void;
  sim: {
    status: SimStatus;
    current: CfgNode | null;
    path: string[];
    play: () => void;
    pause: () => void;
    step: () => void;
    reset: () => void;
    choose: (branch: "true" | "false") => void;
  };
}

const LabContext = createContext<LabState | null>(null);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function nextNode(
  cfg: FunctionCfg,
  fromId: string,
  prefer: "true" | "false" | "auto",
): { node: CfgNode; via: string } | null {
  const outs = cfg.edges.filter((e) => e.source === fromId);
  if (!outs.length) return null;
  let edge = outs[0];
  if (prefer === "true" || prefer === "false") {
    const match = outs.find((e) => e.label === prefer);
    if (!match) return null;
    edge = match;
  } else {
    edge =
      outs.find((e) => !e.label) ??
      outs.find((e) => e.label === "true") ??
      outs.find((e) => e.label !== "back") ??
      outs[0];
  }
  const node = cfg.nodes.find((n) => n.id === edge.target);
  if (!node) return null;
  return { node, via: edge.label ?? "next" };
}

export function LabProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState(SAMPLE_PYTHON);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [baseline, setBaseline] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pipelineIndex, setPipelineIndex] = useState(-1);
  const [section, setSection] = useState<LabSection>("aim");
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(
    null,
  );
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const [simStatus, setSimStatus] = useState<SimStatus>("idle");
  const [simNodeId, setSimNodeId] = useState<string | null>(null);
  const [simPath, setSimPath] = useState<string[]>([]);
  const playingRef = useRef(false);
  const simNodeRef = useRef<string | null>(null);
  const cfgRef = useRef<FunctionCfg | null>(null);

  const activeCfg = useMemo(() => {
    if (!analysis?.cfgs.length) return null;
    const name = selectedFunction ?? analysis.cfgs[0].function;
    return analysis.cfgs.find((c) => c.function === name) ?? analysis.cfgs[0];
  }, [analysis, selectedFunction]);
  cfgRef.current = activeCfg;

  const selectFunction = useCallback(
    (name: string | null) => {
      if (name !== selectedFunction) {
        playingRef.current = false;
        simNodeRef.current = null;
        setSimStatus("idle");
        setSimNodeId(null);
        setSimPath([]);
      }
      setSelectedFunction(name);
    },
    [selectedFunction],
  );

  const jumpToFunction = useCallback(
    (name: string) => {
      selectFunction(name);
      const fn = analysis?.functions.find((f) => f.name === name);
      if (!fn || !editorRef.current) return;
      setHighlightRange({ start: fn.lineno, end: fn.end_lineno });
      editorRef.current.revealLineInCenter(fn.lineno);
      editorRef.current.setPosition({ lineNumber: fn.lineno, column: 1 });
      editorRef.current.focus();
    },
    [analysis, selectFunction],
  );

  const analyze = useCallback(async () => {
    setAnalyzing(true);
    setError(null);
    setPipelineIndex(0);
    try {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        setPipelineIndex(i);
        await sleep(140);
      }
      const result = await analyzeSource(source);
      setAnalysis(result);
      const firstComplex = result.functions.find((f) => f.is_complex) ?? result.functions[0];
      setSelectedFunction(firstComplex?.name ?? result.cfgs[0]?.function ?? null);
      playingRef.current = false;
      simNodeRef.current = null;
      setSimStatus("idle");
      setSimNodeId(null);
      setSimPath([]);
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          document.getElementById("exp1-cfg-graph")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 80);
      });
    } catch (e) {
      const err = e as Error & { lineno?: number };
      setError(err.message);
      setAnalysis(null);
      if (err.lineno && editorRef.current) {
        editorRef.current.revealLineInCenter(err.lineno);
      }
    } finally {
      setAnalyzing(false);
    }
  }, [source]);

  const saveBaseline = useCallback(() => {
    if (analysis) setBaseline(analysis);
  }, [analysis]);

  const resetSim = useCallback(() => {
    playingRef.current = false;
    simNodeRef.current = null;
    setSimStatus("idle");
    setSimNodeId(null);
    setSimPath([]);
  }, []);

  const applyNode = useCallback((node: CfgNode) => {
    simNodeRef.current = node.id;
    setSimNodeId(node.id);
    if (node.lineno) {
      setHighlightRange({ start: node.lineno, end: node.end_lineno ?? node.lineno });
      editorRef.current?.revealLineInCenter(node.lineno);
    }
    if (node.type === "exit") {
      playingRef.current = false;
      setSimStatus("done");
    } else if (node.type === "decision" || node.type === "loop") {
      playingRef.current = false;
      setSimStatus("decision");
    } else {
      setSimStatus(playingRef.current ? "playing" : "paused");
    }
  }, []);

  const advance = useCallback(
    (prefer: "true" | "false" | "auto") => {
      const cfg = cfgRef.current;
      if (!cfg) return;
      const id = simNodeRef.current;
      if (!id) {
        const entry = cfg.nodes.find((n) => n.type === "entry");
        if (!entry) return;
        setSimPath([entry.label]);
        applyNode(entry);
        return;
      }
      const current = cfg.nodes.find((n) => n.id === id);
      if (!current) return;
      if (current.type === "exit") {
        playingRef.current = false;
        setSimStatus("done");
        return;
      }
      if ((current.type === "decision" || current.type === "loop") && prefer === "auto") {
        playingRef.current = false;
        setSimStatus("decision");
        return;
      }
      const nxt = nextNode(cfg, current.id, prefer);
      if (!nxt) {
        playingRef.current = false;
        setSimStatus("done");
        return;
      }
      setSimPath((p) => [...p, `${nxt.via}: ${nxt.node.label}`]);
      applyNode(nxt.node);
    },
    [applyNode],
  );

  const play = useCallback(() => {
    if (!cfgRef.current) return;
    if (playingRef.current) return;
    setSection("simulation");
    playingRef.current = true;
    setSimStatus("playing");
    const tick = async () => {
      while (playingRef.current) {
        const cfg = cfgRef.current;
        const cur = simNodeRef.current
          ? cfg?.nodes.find((n) => n.id === simNodeRef.current)
          : null;
        if (cur && (cur.type === "decision" || cur.type === "loop")) {
          playingRef.current = false;
          setSimStatus("decision");
          break;
        }
        if (cur?.type === "exit") {
          playingRef.current = false;
          setSimStatus("done");
          break;
        }
        advance("auto");
        await sleep(550);
      }
    };
    void tick();
  }, [advance]);

  const currentNode = activeCfg?.nodes.find((n) => n.id === simNodeId) ?? null;

  const value: LabState = {
    source,
    setSource,
    analysis,
    baseline,
    error,
    analyzing,
    pipelineIndex,
    section,
    setSection,
    selectedFunction,
    setSelectedFunction: selectFunction,
    activeCfg,
    jumpToFunction,
    highlightRange,
    setHighlightRange,
    editorRef,
    analyze,
    saveBaseline,
    sim: {
      status: simStatus,
      current: currentNode,
      path: simPath,
      play,
      pause: () => {
        playingRef.current = false;
        setSimStatus("paused");
      },
      step: () => {
        setSection("simulation");
        playingRef.current = false;
        const cur = simNodeRef.current
          ? cfgRef.current?.nodes.find((n) => n.id === simNodeRef.current)
          : null;
        if (cur && (cur.type === "decision" || cur.type === "loop")) {
          setSimStatus("decision");
          return;
        }
        advance("auto");
      },
      reset: resetSim,
      choose: (branch) => {
        playingRef.current = false;
        advance(branch);
        const cur = simNodeRef.current
          ? cfgRef.current?.nodes.find((n) => n.id === simNodeRef.current)
          : null;
        if (cur && cur.type !== "decision" && cur.type !== "loop" && cur.type !== "exit") {
          play();
        }
      },
    },
  };

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab() {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error("useLab must be used within LabProvider");
  return ctx;
}
