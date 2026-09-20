import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { layoutCfg, type CfgFlowData } from "@/lib/cfgLayout";
import { useLab } from "@/state/LabContext";
import { Button } from "@/components/ui/button";

const NODE_STYLE: Record<string, { box: string; tag: string; label: string }> = {
  entry: {
    box: "rounded-full border-emerald-500 bg-emerald-50",
    tag: "text-emerald-700",
    label: "Entry",
  },
  exit: {
    box: "rounded-full border-slate-400 bg-slate-100",
    tag: "text-slate-600",
    label: "Exit",
  },
  decision: {
    box: "border-amber-500 bg-amber-50",
    tag: "text-amber-700",
    label: "Decision",
  },
  loop: {
    box: "rounded-lg border-violet-500 bg-violet-50",
    tag: "text-violet-700",
    label: "Loop",
  },
  return: {
    box: "rounded-lg border-primary bg-primary/5",
    tag: "text-primary",
    label: "Return",
  },
  block: {
    box: "rounded-lg border-slate-300 bg-white",
    tag: "text-slate-500",
    label: "Statement",
  },
};

function CfgFlowNode({ data, selected }: NodeProps<Node<CfgFlowData>>) {
  const diamond = data.type === "decision";
  const style = NODE_STYLE[data.type] ?? NODE_STYLE.block;
  return (
    <div
      className={`relative flex h-[84px] w-[210px] items-center justify-center border-2 shadow-sm transition-shadow ${diamond ? "rotate-45" : ""} ${style.box} ${
        selected ? "ring-4 ring-[hsl(var(--accent))]/60" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
      <div className={`${diamond ? "-rotate-45" : ""} flex max-h-[76px] flex-col items-center gap-0.5 overflow-hidden px-3 text-center`}>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${style.tag}`}>{style.label}</span>
        <span className="text-[11px] font-medium leading-tight text-slate-700">{data.label}</span>
        {data.lineno ? <span className="text-[9px] text-slate-400">line {data.lineno}</span> : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-2 !border-white !bg-slate-500" />
    </div>
  );
}

const nodeTypes = { cfg: CfgFlowNode };

const LEGEND: { label: string; dot: string }[] = [
  { label: "Entry / Exit", dot: "bg-emerald-500" },
  { label: "Decision", dot: "bg-amber-500" },
  { label: "Loop", dot: "bg-violet-500" },
  { label: "Return", dot: "bg-primary" },
  { label: "True", dot: "bg-green-600" },
  { label: "False", dot: "bg-rose-600" },
];

export function CfgView() {
  const { analysis, activeCfg, selectedFunction, setSelectedFunction, setHighlightRange, sim } =
    useLab();
  const laid = useMemo(
    () => (activeCfg ? layoutCfg(activeCfg) : { nodes: [], edges: [] }),
    [activeCfg],
  );

  const nodes = laid.nodes.map((n) => ({
    ...n,
    selected: sim.current?.id === n.id,
    className: sim.current?.id === n.id ? "sim-current" : undefined,
  }));

  const edges = laid.edges.map((e) => ({
    ...e,
    animated: e.target === sim.current?.id || e.label === "back",
  }));

  if (!analysis) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        Analyze code to build a control-flow graph.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Function</span>
          <select
            className="rounded-md border border-border bg-white px-2 py-1 font-mono text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={selectedFunction ?? ""}
            onChange={(e) => setSelectedFunction(e.target.value)}
          >
            {analysis.cfgs.map((c) => (
              <option key={c.function} value={c.function}>
                {c.function}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted/60 p-1">
          <Button size="sm" onClick={sim.play} disabled={!activeCfg} className="gap-1">
            <Play className="h-3.5 w-3.5" />
            Play
          </Button>
          <Button size="sm" variant="secondary" onClick={sim.pause} className="gap-1">
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
          <Button size="sm" variant="secondary" onClick={sim.step} className="gap-1">
            <SkipForward className="h-3.5 w-3.5" />
            Step
          </Button>
          <Button size="sm" variant="outline" onClick={sim.reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border md:grid-cols-4">
        <StatCell label="Current block" value={sim.current?.label ?? "—"} mono />
        <StatCell label="Source line" value={sim.current?.lineno != null ? String(sim.current.lineno) : "—"} mono />
        <StatCell label="Condition" value={sim.current?.condition ?? "—"} mono />
        <StatCell label="Path taken" value={sim.path.slice(-6).join(" → ") || "—"} />
      </div>

      {sim.status === "decision" && (
        <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-3 py-2.5 text-xs">
          <span className="flex-1 text-amber-900">
            {sim.current?.type === "loop"
              ? "Loop: choose True to enter the body, False to exit. Graph walk only — code is not executed."
              : "Decision: pick a branch to follow. Graph walk only — code is not executed."}
          </span>
          <Button size="sm" onClick={() => sim.choose("true")} className="bg-green-600 hover:bg-green-700">
            True
          </Button>
          <Button size="sm" variant="destructive" onClick={() => sim.choose("false")}>
            False
          </Button>
        </div>
      )}
      {sim.status === "paused" && sim.current && (
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          At a {sim.current.type} node. Click <strong className="text-foreground">Step</strong> to continue, or{" "}
          <strong className="text-foreground">Play</strong> to walk until the next decision.
        </div>
      )}
      {sim.status === "done" && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Reached EXIT. Reset or pick another function to simulate a new path.
        </div>
      )}

      <div className="relative min-h-0 flex-1 bg-[#f6f8fc]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
          onNodeClick={(_, node) => {
            const d = node.data;
            if (d.lineno) setHighlightRange({ start: d.lineno, end: d.end_lineno ?? d.lineno });
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#dbe3f0" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
        <div className="pointer-events-none absolute right-3 top-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-border bg-white/90 px-3 py-2 text-[10px] shadow-sm backdrop-blur">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`truncate text-xs text-foreground ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </div>
    </div>
  );
}
