import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";
import type { CfgNode, FunctionCfg } from "./types";

const W = 200;
const H = 72;

export type CfgFlowData = CfgNode & Record<string, unknown>;

export function layoutCfg(cfg: FunctionCfg): { nodes: Node<CfgFlowData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  cfg.nodes.forEach((n) => g.setNode(n.id, { width: W, height: H }));
  cfg.edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const nodes: Node<CfgFlowData>[] = cfg.nodes.map((n) => {
    const p = g.node(n.id);
    const data: CfgFlowData = { ...n };
    return {
      id: n.id,
      type: "cfg",
      position: { x: p.x - W / 2, y: p.y - H / 2 },
      data,
    };
  });

  const edges: Edge[] = cfg.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label ?? undefined,
    animated: e.label === "back",
    style: {
      stroke:
        e.label === "true" ? "#34d399" : e.label === "false" ? "#f87171" : "#64748b",
    },
    labelStyle: { fill: "#94a3b8", fontSize: 11 },
  }));

  return { nodes, edges };
}
