import dagre from "dagre";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { CfgNode, FunctionCfg } from "./types";

const W = 210;
const H = 84;

export type CfgFlowData = CfgNode & Record<string, unknown>;

const EDGE_COLOR: Record<string, string> = {
  true: "#16a34a",
  false: "#e11d48",
  back: "#d97706",
};
const DEFAULT_EDGE = "#94a3b8";

export function layoutCfg(cfg: FunctionCfg): { nodes: Node<CfgFlowData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 55, ranksep: 70, marginx: 20, marginy: 20 });

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

  const edges: Edge[] = cfg.edges.map((e) => {
    const color = (e.label && EDGE_COLOR[e.label]) || DEFAULT_EDGE;
    const isBranch = e.label === "true" || e.label === "false" || e.label === "back";
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      label: e.label ?? undefined,
      animated: e.label === "back",
      style: { stroke: color, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
      labelShowBg: isBranch,
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
      labelBgStyle: { fill: color },
      labelStyle: isBranch
        ? { fill: "#ffffff", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }
        : { fill: "#64748b", fontSize: 10 },
    };
  });

  return { nodes, edges };
}
