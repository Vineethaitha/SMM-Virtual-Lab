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
import { layoutCfg, type CfgFlowData } from "@/lib/cfgLayout";
import { useLab } from "@/state/LabContext";
import { Button } from "@/components/ui/button";

const SHAPE: Record<string, string> = {
  entry: "rounded-full border-emerald-400/60 bg-emerald-500/10",
  exit: "rounded-full border-slate-400/60 bg-slate-500/10",
  decision: "rotate-45 border-amber-400/70 bg-amber-500/10",
  loop: "rounded-md border-violet-400/60 bg-violet-500/10",
  return: "rounded-md border-sky-400/60 bg-sky-500/10",
  block: "rounded-md border-border bg-secondary/80",
};

function CfgFlowNode({ data, selected }: NodeProps<Node<CfgFlowData>>) {
  const diamond = data.type === "decision";
  return (
    <div
      className={`relative flex h-[64px] w-[180px] items-center justify-center border text-[10px] ${SHAPE[data.type] ?? SHAPE.block} ${selected ? "ring-2 ring-sky-400" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div
        className={`${diamond ? "-rotate-45 px-2" : "px-2"} max-h-14 overflow-hidden text-center leading-tight`}
      >
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  );
}

const nodeTypes = { cfg: CfgFlowNode };

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
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Function CFG</span>
        <select
          className="rounded border border-border bg-secondary px-2 py-1 text-xs"
          value={selectedFunction ?? ""}
          onChange={(e) => setSelectedFunction(e.target.value)}
        >
          {analysis.cfgs.map((c) => (
            <option key={c.function} value={c.function}>
              {c.function}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap gap-1">
          <Button size="sm" onClick={sim.play} disabled={!activeCfg}>
            Play
          </Button>
          <Button size="sm" variant="secondary" onClick={sim.pause}>
            Pause
          </Button>
          <Button size="sm" variant="secondary" onClick={sim.step}>
            Step
          </Button>
          <Button size="sm" variant="outline" onClick={sim.reset}>
            Reset
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b border-border px-3 py-2 text-[11px] md:grid-cols-4">
        <div>
          <div className="text-muted-foreground">Current block</div>
          <div className="truncate font-mono">{sim.current?.label ?? "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Source line</div>
          <div className="font-mono">{sim.current?.lineno ?? "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Condition</div>
          <div className="truncate font-mono">{sim.current?.condition ?? "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Path taken</div>
          <div className="truncate">{sim.path.slice(-6).join(" → ") || "—"}</div>
        </div>
      </div>
      {sim.status === "decision" && (
        <div className="flex flex-wrap items-center gap-2 bg-amber-500/10 px-3 py-2 text-xs">
          <span>
            {sim.current?.type === "loop"
              ? "Loop: True = enter body, False = exit loop. Graph walk only — code is not executed."
              : "Decision: pick the branch. Graph walk only — code is not executed."}
          </span>
          <Button size="sm" onClick={() => sim.choose("true")}>
            True
          </Button>
          <Button size="sm" variant="destructive" onClick={() => sim.choose("false")}>
            False
          </Button>
        </div>
      )}
      {sim.status === "paused" && sim.current && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          At {sim.current.type} node. Click Step to continue, or Play to walk until the next decision.
        </div>
      )}
      <div className="min-h-0 flex-1 bg-[#070b14]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          onNodeClick={(_, node) => {
            const d = node.data;
            if (d.lineno) setHighlightRange({ start: d.lineno, end: d.end_lineno ?? d.lineno });
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={18} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
