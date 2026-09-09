// ================================================================
// Experiment 5 — Object-Oriented Design Metrics
// Self-contained page; zero shared state with other experiments.
// All component names and variables use Exp5 / exp5_ prefix.
// ================================================================

import { useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Target, Lightbulb, BookOpen, ClipboardList, ListChecks,
  Play, BarChart3, FlaskConical, GitCompare, FileText,
  Boxes, ArrowRight, Check, X, Minus, RotateCcw, Download,
  TrendingUp, TrendingDown, Info, Plus, Trash2, Edit2, GitBranch, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { LabCard as Exp5Card, LabInfoBox as Exp5InfoBox } from "@/components/lab/LabCard";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";
import {
  EXP5_CLASSES, EXP5_RELATIONSHIPS, EXP5_COHESION,
  EXP5_QUIZ, EXP5_TABS, EXP5_STRATEGIES,
  exp5_computeAllMetrics,
  type Exp5Tab, type Exp5ClassMetrics,
  type Exp5ClassDef, type Exp5Relationship,
} from "@/data/exp5Data";

// ─── Pre-computed metrics (stable, derived from constants) ───────
const EXP5_METRICS: Exp5ClassMetrics[] = exp5_computeAllMetrics(
  EXP5_CLASSES, EXP5_RELATIONSHIPS, EXP5_COHESION,
);

// ─── Diagram node layout ─────────────────────────────────────────
const NODE_W = 180;

interface Exp5NodePos { x: number; y: number; h: number }

function exp5_nodeHeight(cls: typeof EXP5_CLASSES[0]): number {
  // header(28) + attr-section-pad(8) + attrs + method-section-pad(8) + methods + bottom-pad(6)
  const attrH = cls.attributes.length > 0 ? cls.attributes.length * 20 : 16;
  const methH = cls.methods.length * 20;
  return 28 + 8 + attrH + 8 + methH + 6;
}

const EXP5_NODE_POSITIONS: Record<string, Exp5NodePos> = (() => {
  const defs: Record<string, { x: number; y: number }> = {
    User:                { x: 485, y: 20  },
    Admin:               { x: 80,  y: 240 },
    Guest:               { x: 890, y: 240 },
    Product:             { x: 80,  y: 400 },
    Order:               { x: 770, y: 400 },
    ShoppingCart:        { x: 485, y: 620 },
    Invoice:             { x: 200, y: 840 },
    NotificationService: { x: 700, y: 840 },
    DatabaseConnector:   { x: 20,  y: 990 },
    EmailService:        { x: 350, y: 990 },
    SMSService:          { x: 850, y: 990 },
  };
  const result: Record<string, Exp5NodePos> = {};
  for (const cls of EXP5_CLASSES) {
    result[cls.id] = { ...defs[cls.id]!, h: exp5_nodeHeight(cls) };
  }
  return result;
})();

const CANVAS_W = 1150;
const CANVAS_H = 1090;

// ─── Colour helpers ───────────────────────────────────────────────
const EXP5_CHART_COLORS = ["#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#06b6d4"];

const SIZE_COLOR: Record<string, string> = {
  Small: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-100 text-blue-700",
  Large: "bg-rose-100 text-rose-700",
};
const COUPLING_COLOR: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-rose-100 text-rose-700",
};
const COHESION_COLOR: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-rose-100 text-rose-700",
};


function Exp5Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", color)}>{label}</span>
  );
}

function Exp5KpiCard({ label, value, sub, color = "blue" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "from-blue-600 to-blue-500",
    indigo: "from-indigo-600 to-indigo-500",
    green: "from-emerald-600 to-emerald-500",
    amber: "from-amber-500 to-amber-400",
    red: "from-rose-600 to-rose-500",
  };
  return (
    <div className={cn("rounded-xl bg-gradient-to-br text-white p-4 shadow-md", colors[color] ?? colors.blue)}>
      <p className="text-xs font-medium text-white/80 mb-1">{label}</p>
      <p className="text-xl font-bold leading-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/70">{sub}</p>}
    </div>
  );
}

// ─── UML Class Node (HTML positioned) ────────────────────────────
function Exp5ClassBox({ cls, pos, isSelected, isRelated, onSelect }: {
  cls: typeof EXP5_CLASSES[0];
  pos: Exp5NodePos;
  isSelected: boolean;
  isRelated: boolean;
  onSelect: () => void;
}) {
  const borderColor = isSelected ? "#2563eb" : isRelated ? "#93c5fd" : "#94a3b8";
  const shadow = isSelected
    ? "0 0 0 2px #2563eb, 0 4px 16px rgba(37,99,235,0.3)"
    : isRelated
    ? "0 0 0 1px #93c5fd, 0 2px 8px rgba(59,130,246,0.15)"
    : "0 1px 4px rgba(0,0,0,0.1)";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select class ${cls.name}`}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: NODE_W,
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow: shadow,
        transition: "all 0.18s ease",
        zIndex: isSelected ? 10 : isRelated ? 5 : 1,
        background: "white",
      }}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
    >
      {/* Class name header */}
      <div style={{
        background: isSelected ? "#1d4ed8" : "#3b82f6",
        color: "white",
        textAlign: "center",
        padding: "5px 6px",
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "Inter, sans-serif",
        borderBottom: "1px solid rgba(255,255,255,0.2)",
        letterSpacing: 0.2,
      }}>
        {cls.name}
      </div>
      {/* Attributes section */}
      <div style={{
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        padding: "4px 7px",
        minHeight: 24,
      }}>
        {cls.attributes.length === 0 ? (
          <div style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>— no attributes —</div>
        ) : (
          cls.attributes.map((a) => (
            <div key={a} style={{ fontSize: 11, color: "#334155", fontFamily: "Fira Code, monospace", lineHeight: "19px" }}>
              - {a}
            </div>
          ))
        )}
      </div>
      {/* Methods section */}
      <div style={{ background: "white", padding: "4px 7px" }}>
        {cls.methods.map((m) => (
          <div key={m} style={{ fontSize: 11, color: "#1e3a5f", fontFamily: "Fira Code, monospace", lineHeight: "19px" }}>
            + {m}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG Arrows ──────────────────────────────────────────────────
function Exp5DiagramEdges({ selectedId }: { selectedId: string | null }) {
  const np = EXP5_NODE_POSITIONS;
  const w2 = NODE_W / 2;

  const getRelatedIds = (id: string | null): Set<string> => {
    if (!id) return new Set();
    const s = new Set<string>();
    for (const r of EXP5_RELATIONSHIPS) {
      if (r.from === id) s.add(r.to);
      if (r.to === id) s.add(r.from);
    }
    return s;
  };
  const relatedIds = getRelatedIds(selectedId);

  function edgePath(fromId: string, toId: string) {
    const fp = np[fromId]!;
    const tp = np[toId]!;
    const sx = fp.x + w2;
    const sy = fp.y + fp.h;
    const tx = tp.x + w2;
    const ty = tp.y;
    const midY = (sy + ty) / 2;
    return `M ${sx},${sy} C ${sx},${midY} ${tx},${midY} ${tx},${ty}`;
  }

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}
      overflow="visible"
    >
      <defs>
        {/* Association arrow — filled */}
        <marker id="exp5-assoc" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#64748b" />
        </marker>
        <marker id="exp5-assoc-hl" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#2563eb" />
        </marker>
        {/* Generalization arrow — hollow triangle */}
        <marker id="exp5-gen" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 9 4, 0 8" fill="white" stroke="#7c3aed" strokeWidth="1.2" />
        </marker>
        <marker id="exp5-gen-hl" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <polygon points="0 0, 9 4, 0 8" fill="white" stroke="#2563eb" strokeWidth="1.5" />
        </marker>
      </defs>

      {EXP5_RELATIONSHIPS.map((rel) => {
        const isHL =
          selectedId === rel.from ||
          selectedId === rel.to ||
          relatedIds.has(rel.from) ||
          relatedIds.has(rel.to);
        const color = isHL ? "#2563eb" : rel.type === "generalization" ? "#7c3aed" : "#94a3b8";
        const strokeW = isHL ? 2.2 : 1.4;
        const markerEnd =
          isHL
            ? rel.type === "generalization"
              ? "url(#exp5-gen-hl)"
              : "url(#exp5-assoc-hl)"
            : rel.type === "generalization"
            ? "url(#exp5-gen)"
            : "url(#exp5-assoc)";

        return (
          <path
            key={`${rel.from}-${rel.to}`}
            d={edgePath(rel.from, rel.to)}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeDasharray={rel.type === "generalization" ? "none" : "none"}
            markerEnd={markerEnd}
            opacity={selectedId && !isHL ? 0.25 : 1}
          />
        );
      })}
    </svg>
  );
}

// ─── Full Diagram ─────────────────────────────────────────────────
function Exp5Diagram({ selectedId, onSelect }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const relatedIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>();
    for (const r of EXP5_RELATIONSHIPS) {
      if (r.from === selectedId) s.add(r.to);
      if (r.to === selectedId) s.add(r.from);
    }
    return s;
  }, [selectedId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: 680,
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#f8fafc",
      }}
    >
      {/* Legend */}
      <div style={{ position: "sticky", top: 8, left: 8, display: "flex", gap: 16, zIndex: 20, background: "rgba(248,250,252,0.9)", borderRadius: 6, padding: "4px 10px", width: "fit-content", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
          <svg width="32" height="10"><line x1="2" y1="5" x2="24" y2="5" stroke="#7c3aed" strokeWidth="1.5" /><polygon points="24,2 30,5 24,8" fill="white" stroke="#7c3aed" strokeWidth="1" /></svg>
          Generalization
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
          <svg width="32" height="10"><line x1="2" y1="5" x2="22" y2="5" stroke="#64748b" strokeWidth="1.5" /><polygon points="22,2 30,5 22,8" fill="#64748b" /></svg>
          Association
        </div>
        <div style={{ fontSize: 11, color: "#64748b" }}>Click a class to inspect</div>
      </div>

      <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H }}>
        <Exp5DiagramEdges selectedId={selectedId} />
        {EXP5_CLASSES.map((cls) => (
          <Exp5ClassBox
            key={cls.id}
            cls={cls}
            pos={EXP5_NODE_POSITIONS[cls.id]!}
            isSelected={selectedId === cls.id}
            isRelated={relatedIds.has(cls.id)}
            onSelect={() => onSelect(selectedId === cls.id ? null : cls.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Details Panel ────────────────────────────────────────────────
function Exp5DetailsPanel({ selectedId }: { selectedId: string | null }) {
  const m = EXP5_METRICS.find((x) => x.id === selectedId);
  const cls = EXP5_CLASSES.find((x) => x.id === selectedId);
  if (!m || !cls) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-slate-400">
        <Boxes className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">Click a class in the diagram to inspect it.</p>
      </div>
    );
  }

  const outgoingTargets = EXP5_RELATIONSHIPS
    .filter((r) => r.from === m.id)
    .map((r) => r.to);
  const incomingTargets = EXP5_RELATIONSHIPS
    .filter((r) => r.to === m.id)
    .map((r) => r.from);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow">
          {m.name[0]}
        </div>
        <div>
          <p className="font-bold text-blue-800 text-base">{m.name}</p>
          <p className="text-xs text-slate-500">Class Details</p>
        </div>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {[
            { label: "Attributes", value: cls.attributes.length > 0 ? cls.attributes.join(", ") : "—" },
            { label: "Attribute Count", value: m.attributeCount },
            { label: "Methods", value: cls.methods.join(", ") },
            { label: "Method Count", value: m.methodCount },
            { label: "Total Members", value: m.totalMembers },
            { label: "Size Category", value: <Exp5Badge label={m.sizeCategory} color={SIZE_COLOR[m.sizeCategory]!} /> },
            { label: "Cohesion", value: <Exp5Badge label={m.cohesionLevel} color={COHESION_COLOR[m.cohesionLevel]!} /> },
            { label: "Outgoing Interactions", value: `${m.outgoing}${outgoingTargets.length ? ` (→ ${outgoingTargets.join(", ")})` : ""}` },
            { label: "Incoming Interactions", value: `${m.incoming}${incomingTargets.length ? ` (← ${incomingTargets.join(", ")})` : ""}` },
            { label: "Coupling", value: <Exp5Badge label={m.couplingCategory} color={COUPLING_COLOR[m.couplingCategory]!} /> },
            { label: "Est. Response Set", value: m.estimatedResponseSet },
          ].map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0">
              <td className="py-1.5 pr-2 text-xs font-medium text-slate-500 whitespace-nowrap align-top">{row.label}</td>
              <td className="py-1.5 text-xs text-slate-700">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5 text-xs text-blue-700">
        <p className="font-semibold mb-0.5">Cohesion Reason</p>
        <p>{m.cohesionReason}</p>
      </div>
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600">
        <p className="font-semibold mb-0.5">Response Set Breakdown</p>
        <p>{m.responseReason}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Exp5AimTab() {
  return (
    <Exp5Card title="Aim" icon={Target}>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">
        <p>
          Analyze an object-oriented software design using class size, cohesion, coupling, and
          response-set characteristics.
        </p>
        <p>
          Identify large and small classes, distinguish high and low cohesion, identify tightly coupled
          classes, suggest decoupling strategies, and estimate classes with high response sets.
        </p>
      </div>
    </Exp5Card>
  );
}

function Exp5ObjectiveTab() {
  const objectives = [
    "Identify classes with many attributes and methods.",
    "Identify small and low-complexity classes.",
    "Analyze cohesion based on related responsibilities.",
    "Identify classes with low cohesion.",
    "Identify tightly coupled classes.",
    "Suggest appropriate decoupling strategies.",
    "Estimate classes with large response sets.",
    "Understand message passing between classes.",
  ];
  return (
    <div className="space-y-4">
      <Exp5Card title="Objective" icon={Lightbulb}>
        <ol className="space-y-2 text-sm text-slate-600">
          {objectives.map((obj, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {i + 1}
              </span>
              <span>{obj}</span>
            </li>
          ))}
        </ol>
      </Exp5Card>
      <Exp5Card title="Learning Outcome" icon={TrendingUp}>
        <p className="text-sm text-slate-600 leading-relaxed">
          Students should be able to inspect an object-oriented class diagram and use structural
          information to reason about class size, cohesion, coupling, and response-set characteristics.
        </p>
      </Exp5Card>
    </div>
  );
}

function Exp5TheoryTab() {
  const sizeRows = [
    { range: "0 – 4 total members", label: "Small", color: "bg-slate-100 text-slate-700" },
    { range: "5 – 7 total members", label: "Medium", color: "bg-blue-100 text-blue-700" },
    { range: "8 + total members", label: "Large", color: "bg-rose-100 text-rose-700" },
  ];
  const couplingRows = [
    { range: "0 – 1 outgoing interactions", label: "Low", color: "bg-emerald-100 text-emerald-700" },
    { range: "2 – 3 outgoing interactions", label: "Medium", color: "bg-amber-100 text-amber-700" },
    { range: "4 + outgoing interactions", label: "High", color: "bg-rose-100 text-rose-700" },
  ];
  return (
    <div className="space-y-4">
      <Exp5Card title="Theory" icon={BookOpen}>
        <p className="text-sm text-slate-600">
          Object-oriented design metrics help assess the structural quality of a software system from its
          class design. The four key dimensions assessed in this experiment are class size, cohesion,
          coupling, and response set.
        </p>
      </Exp5Card>

      <Exp5Card title="Class Size">
        <p className="text-sm text-slate-600 mb-3">
          Class size provides an indication of how much data and behavior is contained within a class.
        </p>
        <div className="mb-3 flex items-center justify-center rounded-lg bg-blue-50 p-3">
          <p className="font-mono text-sm font-semibold text-blue-800">
            Total Members = Number of Attributes + Number of Methods
          </p>
        </div>
        <p className="text-xs text-slate-500 italic mb-3">
          Laboratory thresholds (simplified for this experiment):
        </p>
        <div className="space-y-1.5">
          {sizeRows.map((r) => (
            <div key={r.label} className={cn("flex items-center justify-between rounded-lg px-4 py-2 text-sm", r.color)}>
              <span className="font-mono">{r.range}</span>
              <span className="font-bold">{r.label}</span>
            </div>
          ))}
        </div>
      </Exp5Card>

      <Exp5Card title="Cohesion">
        <p className="text-sm text-slate-600 mb-3">
          Cohesion describes how closely related the responsibilities of a class are.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p className="font-semibold text-emerald-800 mb-1">High Cohesion</p>
            <p className="text-emerald-700">Methods and attributes support a single, focused responsibility.</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-amber-800 mb-1">Lower Cohesion</p>
            <p className="text-amber-700">A class combines unrelated responsibilities, making it harder to maintain.</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 italic">
          Note: Cohesion in this experiment is assessed qualitatively based on responsibility analysis.
          The supplied class diagram does not provide enough information for a formal numerical cohesion
          calculation (such as LCOM).
        </p>
      </Exp5Card>

      <Exp5Card title="Coupling">
        <p className="text-sm text-slate-600 mb-3">
          Coupling describes the degree of dependency or interaction between classes.
        </p>
        <p className="text-xs text-slate-500 italic mb-3">
          Simplified laboratory coupling classification (based on outgoing interactions):
        </p>
        <div className="space-y-1.5">
          {couplingRows.map((r) => (
            <div key={r.label} className={cn("flex items-center justify-between rounded-lg px-4 py-2 text-sm", r.color)}>
              <span className="font-mono">{r.range}</span>
              <span className="font-bold">{r.label}</span>
            </div>
          ))}
        </div>
      </Exp5Card>

      <Exp5Card title="Response Set">
        <p className="text-sm text-slate-600 mb-3">
          Response-set analysis considers the methods that may be involved when an object receives a
          message, including interactions with collaborating classes.
        </p>
        <div className="flex items-center justify-center rounded-lg bg-blue-50 p-3 mb-3">
          <p className="font-mono text-sm font-semibold text-blue-800">
            Estimated Response Set = Class Methods + Methods of Directly Interacted Classes
          </p>
        </div>
        <p className="text-xs text-slate-500 italic">
          This is a simplified educational estimate used to identify which classes have the largest
          response sets. It is not a complete formal RFC (Response For a Class) calculation.
        </p>
      </Exp5Card>

      <Exp5Card title="Decoupling Strategies">
        <p className="text-sm text-slate-600 mb-3">
          When coupling is high or cohesion is low, design improvement strategies can be applied:
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          {[
            { name: "Interfaces", desc: "Define abstract contracts that concrete classes implement, reducing direct class-to-class dependencies." },
            { name: "Service Abstraction", desc: "Introduce a mediating service layer between high-coupling classes and their dependencies." },
            { name: "Separation of Concerns", desc: "Split classes with multiple unrelated responsibilities into focused single-responsibility classes." },
            { name: "Dependency Injection", desc: "Pass dependencies into a class rather than having the class create them, improving testability and flexibility." },
            { name: "Reducing Direct Dependencies", desc: "Remove unnecessary direct references between classes that do not need to communicate." },
          ].map((s) => (
            <li key={s.name} className="flex gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400 flex-none mt-1.5" />
              <span><strong>{s.name}:</strong> {s.desc}</span>
            </li>
          ))}
        </ul>
      </Exp5Card>
    </div>
  );
}

function Exp5ProcedureTab() {
  const steps = [
    "Open the Simulation tab.",
    "Inspect the supplied class diagram.",
    "Count attributes and methods for each class.",
    "Identify large and small classes using the size thresholds.",
    "Analyze method responsibilities for each class.",
    "Identify high-cohesion and lower-cohesion classes.",
    "Inspect class relationships in the diagram.",
    "Identify tightly coupled classes (high outgoing interactions).",
    "Estimate classes with high response sets.",
    "Suggest decoupling strategies for high-coupling classes.",
    "Review the Results and Analysis tabs.",
    "Complete the assessment quiz.",
    "Generate the lab report from the Conclusion tab.",
  ];
  return (
    <div className="space-y-4">
      <Exp5Card title="Procedure" icon={ClipboardList}>
        <ol className="space-y-3 text-sm text-slate-600">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </Exp5Card>
    </div>
  );
}

// ─── Exercise Tab ─────────────────────────────────────────────────
function Exp5ExerciseTab({ selectedId, onSelect }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [activeTask, setActiveTask] = useState(0);
  const tasks = ["Class Size Analysis", "Cohesion Analysis", "Coupling and Decoupling", "Response Set Estimation"];

  const m = EXP5_METRICS.find((x) => x.id === selectedId);

  return (
    <div className="space-y-4">
      <Exp5Card title="Object-Oriented Metrics Exercise" icon={ListChecks}>
        <p className="text-sm text-slate-600 mb-4">
          Select a class from the dropdown to complete each analysis task. Immediate feedback is shown
          based on the selected class.
        </p>

        {/* Task tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {tasks.map((t, i) => (
            <button
              key={t}
              type="button"
              id={`exp5-task-${i + 1}`}
              onClick={() => setActiveTask(i)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                activeTask === i
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              )}
            >
              Task {i + 1}: {t}
            </button>
          ))}
        </div>

        {/* Class selector */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="exp5-exercise-class">
            Select a Class
          </label>
          <select
            id="exp5-exercise-class"
            className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedId ?? ""}
            onChange={(e) => onSelect(e.target.value || null)}
          >
            <option value="">— Select a class —</option>
            {EXP5_CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Task content */}
        {activeTask === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-blue-700">Task 1: Class Size Analysis</p>
            {!m ? (
              <Exp5InfoBox>Select a class to see its size analysis.</Exp5InfoBox>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                <p><strong>Class:</strong> {m.name}</p>
                <p><strong>Attributes:</strong> {m.attributeCount} — {EXP5_CLASSES.find(c => c.id === m.id)?.attributes.join(", ") || "none"}</p>
                <p><strong>Methods:</strong> {m.methodCount} — {EXP5_CLASSES.find(c => c.id === m.id)?.methods.join(", ")}</p>
                <p><strong>Total Members:</strong> {m.totalMembers}</p>
                <div className="flex items-center gap-2">
                  <strong>Size Category:</strong>
                  <Exp5Badge label={m.sizeCategory} color={SIZE_COLOR[m.sizeCategory]!} />
                </div>
                <div className="rounded bg-blue-50 border border-blue-200 p-2 mt-2 text-xs text-blue-700">
                  {m.sizeCategory === "Large" && `${m.name} is a large class with ${m.totalMembers} total members (≥ 8). Consider reviewing whether its responsibilities can be separated.`}
                  {m.sizeCategory === "Medium" && `${m.name} is a medium class with ${m.totalMembers} total members (5–7). It has a balanced amount of functionality.`}
                  {m.sizeCategory === "Small" && `${m.name} is a small class with ${m.totalMembers} total members (≤ 4). It has a focused, minimal footprint.`}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTask === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-blue-700">Task 2: Cohesion Analysis</p>
            {!m ? (
              <Exp5InfoBox>Select a class to see its cohesion assessment.</Exp5InfoBox>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                <p><strong>Class:</strong> {m.name}</p>
                <div className="flex items-center gap-2">
                  <strong>Cohesion Level:</strong>
                  <Exp5Badge label={m.cohesionLevel} color={COHESION_COLOR[m.cohesionLevel]!} />
                </div>
                <p><strong>Reason:</strong> {m.cohesionReason}</p>
                <div className="rounded bg-blue-50 border border-blue-200 p-2 mt-2 text-xs text-blue-700">
                  {m.cohesionLevel === "High" && `${m.name} demonstrates high cohesion. All its methods and attributes are focused on a single, clear responsibility.`}
                  {m.cohesionLevel === "Medium" && `${m.name} shows medium cohesion. It handles more than one type of responsibility, which could be separated for a cleaner design.`}
                  {m.cohesionLevel === "Low" && `${m.name} shows low cohesion. Its responsibilities are quite unrelated and should be split into separate classes.`}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTask === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-blue-700">Task 3: Coupling and Decoupling</p>
            {!m ? (
              <Exp5InfoBox>Select a class to see its coupling analysis.</Exp5InfoBox>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                  <p><strong>Class:</strong> {m.name}</p>
                  <p><strong>Outgoing Interactions:</strong> {m.outgoing}</p>
                  <p><strong>Incoming Interactions:</strong> {m.incoming}</p>
                  <div className="flex items-center gap-2">
                    <strong>Coupling Classification:</strong>
                    <Exp5Badge label={m.couplingCategory} color={COUPLING_COLOR[m.couplingCategory]!} />
                  </div>
                </div>
                {EXP5_STRATEGIES.filter((s) => s.applicableTo.includes(m.id)).length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                    <p className="font-semibold text-blue-800 mb-2">Suggested Decoupling Strategies:</p>
                    {EXP5_STRATEGIES.filter((s) => s.applicableTo.includes(m.id)).map((s) => (
                      <div key={s.id} className="mb-2 last:mb-0">
                        <p className="font-medium text-blue-700">• {s.label}</p>
                        <p className="text-blue-600 text-xs">{s.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                {m.couplingCategory === "Low" && (
                  <Exp5InfoBox>{m.name} has low coupling ({m.outgoing} outgoing). No immediate decoupling action is required.</Exp5InfoBox>
                )}
              </div>
            )}
          </div>
        )}

        {activeTask === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-blue-700">Task 4: Response Set Estimation</p>
            {!m ? (
              <Exp5InfoBox>Select a class to see its estimated response set.</Exp5InfoBox>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                <p><strong>Class:</strong> {m.name}</p>
                <p><strong>Own Methods:</strong> {m.methodCount}</p>
                <p><strong>Directly Interacted Classes:</strong> {m.outgoing}</p>
                <p><strong>Estimated Response Set:</strong> <span className="font-bold text-blue-700">{m.estimatedResponseSet}</span></p>
                <p className="text-xs text-slate-500">{m.responseReason}</p>
                <div className="rounded bg-blue-50 border border-blue-200 p-2 mt-2 text-xs text-blue-700">
                  {m.estimatedResponseSet >= 7
                    ? `${m.name} has a large estimated response set (${m.estimatedResponseSet}). Classes interacting with it may trigger many method executions.`
                    : m.estimatedResponseSet >= 4
                    ? `${m.name} has a moderate estimated response set (${m.estimatedResponseSet}).`
                    : `${m.name} has a small estimated response set (${m.estimatedResponseSet}), indicating limited interaction depth.`}
                </div>
              </div>
            )}
          </div>
        )}
      </Exp5Card>
    </div>
  );
}

// ─── Custom Diagram Components ────────────────────────────────────

/** Renders one custom class box, no interaction needed */
function Exp5CustomClassBox({ cls, metrics }: { cls: Exp5ClassDef; metrics: Exp5ClassMetrics | undefined }) {
  return (
    <div
      style={{
        border: "2px solid #3b82f6",
        borderRadius: 8,
        overflow: "hidden",
        minWidth: 180,
        boxShadow: "0 2px 8px rgba(59,130,246,0.12)",
        background: "white",
        flex: "0 0 auto",
      }}
    >
      <div style={{
        background: "#2563eb", color: "white", textAlign: "center",
        padding: "6px 8px", fontSize: 13, fontWeight: 700, letterSpacing: 0.2,
      }}>
        {cls.name}
      </div>
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "4px 8px", minHeight: 22 }}>
        {cls.attributes.length === 0
          ? <div style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>— no attributes —</div>
          : cls.attributes.map(a => (
            <div key={a} style={{ fontSize: 11, color: "#334155", fontFamily: "Fira Code, monospace", lineHeight: "20px" }}>- {a}</div>
          ))}
      </div>
      <div style={{ background: "white", padding: "4px 8px", minHeight: 22 }}>
        {cls.methods.length === 0
          ? <div style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>— no methods —</div>
          : cls.methods.map(m => (
            <div key={m} style={{ fontSize: 11, color: "#1e3a5f", fontFamily: "Fira Code, monospace", lineHeight: "20px" }}>+ {m}</div>
          ))}
      </div>
      {metrics && (
        <div style={{ background: "#eff6ff", padding: "4px 8px", borderTop: "1px solid #dbeafe", fontSize: 10, color: "#1e40af" }}>
          Size: <strong>{metrics.sizeCategory}</strong> &nbsp;|&nbsp;
          Coupling: <strong>{metrics.couplingCategory}</strong> &nbsp;|&nbsp;
          ERS: <strong>{metrics.estimatedResponseSet}</strong>
        </div>
      )}
    </div>
  );
}

/** Custom diagram builder form + live metrics */
function Exp5CustomDiagramBuilder({
  classes, rels, onSetClasses, onSetRels,
}: {
  classes: Exp5ClassDef[];
  rels: Exp5Relationship[];
  onSetClasses: (cls: Exp5ClassDef[]) => void;
  onSetRels: (rels: Exp5Relationship[]) => void;
}) {
  const setClasses = onSetClasses;
  const setRels = onSetRels;

  // ── add-class form
  const [newName, setNewName] = useState("");
  const [newAttrs, setNewAttrs] = useState(""); // comma-separated
  const [newMethods, setNewMethods] = useState(""); // comma-separated
  const [nameError, setNameError] = useState("");

  // ── editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAttrs, setEditAttrs] = useState("");
  const [editMethods, setEditMethods] = useState("");

  // ── add-relationship form
  const [relFrom, setRelFrom] = useState("");
  const [relTo, setRelTo] = useState("");
  const [relType, setRelType] = useState<"association" | "generalization">("association");
  const [relError, setRelError] = useState("");

  // ── compute live metrics
  const customCohesion = useMemo(() =>
    classes.map(c => ({ classId: c.id, level: "High" as const, reason: "User-defined class." })),
    [classes]
  );
  const customMetrics = useMemo(() =>
    exp5_computeAllMetrics(classes, rels, customCohesion),
    [classes, rels, customCohesion]
  );

  function parseList(raw: string): string[] {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }

  function addClass(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { setNameError("Class name is required."); return; }
    if (classes.some(c => c.id === name)) { setNameError(`Class "${name}" already exists.`); return; }
    setNameError("");
    const cls: Exp5ClassDef = {
      id: name,
      name,
      attributes: parseList(newAttrs),
      methods: parseList(newMethods),
    };
    setClasses([...classes, cls]);
    setNewName(""); setNewAttrs(""); setNewMethods("");
    if (!relFrom) setRelFrom(name);
  }

  function deleteClass(id: string) {
    setClasses(classes.filter(c => c.id !== id));
    setRels(rels.filter(r => r.from !== id && r.to !== id));
    if (editingId === id) setEditingId(null);
  }

  function startEdit(cls: Exp5ClassDef) {
    setEditingId(cls.id);
    setEditName(cls.name);
    setEditAttrs(cls.attributes.join(", "));
    setEditMethods(cls.methods.join(", "));
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const newNameTrimmed = editName.trim();
    if (!newNameTrimmed) return;
    setClasses(classes.map(c => c.id === editingId
      ? { id: newNameTrimmed, name: newNameTrimmed, attributes: parseList(editAttrs), methods: parseList(editMethods) }
      : c
    ));
    // update rels that referenced the old id
    setRels(rels.map(r => ({
      ...r,
      from: r.from === editingId ? newNameTrimmed : r.from,
      to: r.to === editingId ? newNameTrimmed : r.to,
    })));
    setEditingId(null);
  }

  function addRel(e: React.FormEvent) {
    e.preventDefault();
    if (!relFrom || !relTo) { setRelError("Select both classes."); return; }
    if (relFrom === relTo) { setRelError("A class cannot relate to itself."); return; }
    if (rels.some(r => r.from === relFrom && r.to === relTo)) { setRelError("This relationship already exists."); return; }
    setRelError("");
    setRels([...rels, { from: relFrom, to: relTo, type: relType }]);
  }

  function deleteRel(idx: number) {
    setRels(rels.filter((_, i) => i !== idx));
  }

  const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "mb-1 block text-xs font-medium text-slate-500";

  return (
    <div className="space-y-5">
      {/* ── Add Class ── */}
      <Exp5Card title="Add a Class" icon={Plus}>
        <form onSubmit={addClass} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="cus-cls-name">Class Name <span className="text-rose-500">*</span></label>
              <input id="cus-cls-name" className={inputCls} placeholder="e.g. Vehicle" value={newName}
                onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cus-cls-attrs">Attributes <span className="text-slate-400">(comma-separated)</span></label>
              <input id="cus-cls-attrs" className={inputCls} placeholder="e.g. id, name, speed" value={newAttrs}
                onChange={e => setNewAttrs(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cus-cls-methods">Methods <span className="text-slate-400">(comma-separated)</span></label>
              <input id="cus-cls-methods" className={inputCls} placeholder="e.g. start(), stop()" value={newMethods}
                onChange={e => setNewMethods(e.target.value)} />
            </div>
          </div>
          {nameError && <p className="text-xs text-rose-600">{nameError}</p>}
          <button id="cus-add-class" type="submit"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Class
          </button>
        </form>
      </Exp5Card>

      {/* ── Class List + Edit ── */}
      {classes.length > 0 && (
        <Exp5Card title={`Classes (${classes.length})`} icon={Boxes}>
          <div className="space-y-3">
            {classes.map(cls => (
              <div key={cls.id}>
                {editingId === cls.id ? (
                  <form onSubmit={saveEdit} className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-700 mb-2">Editing: {cls.name}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className={labelCls} htmlFor="edit-cls-name">Class Name</label>
                        <input id="edit-cls-name" className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="edit-cls-attrs">Attributes</label>
                        <input id="edit-cls-attrs" className={inputCls} value={editAttrs} onChange={e => setEditAttrs(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="edit-cls-methods">Methods</label>
                        <input id="edit-cls-methods" className={inputCls} value={editMethods} onChange={e => setEditMethods(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                        <Check className="h-3 w-3" /> Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-blue-800 text-sm">{cls.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Attrs: {cls.attributes.length > 0 ? cls.attributes.join(", ") : "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Methods: {cls.methods.length > 0 ? cls.methods.join(", ") : "—"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => startEdit(cls)}
                        className="rounded bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteClass(cls.id)}
                        className="rounded bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Exp5Card>
      )}

      {/* ── Add Relationship ── */}
      {classes.length >= 2 && (
        <Exp5Card title="Add a Relationship" icon={GitBranch}>
          <form onSubmit={addRel} className="space-y-3" noValidate>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls} htmlFor="cus-rel-from">From Class</label>
                <select id="cus-rel-from" className={inputCls} value={relFrom} onChange={e => setRelFrom(e.target.value)}>
                  <option value="">— select —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="cus-rel-to">To Class</label>
                <select id="cus-rel-to" className={inputCls} value={relTo} onChange={e => setRelTo(e.target.value)}>
                  <option value="">— select —</option>
                  {classes.filter(c => c.id !== relFrom).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="cus-rel-type">Type</label>
                <select id="cus-rel-type" className={inputCls} value={relType}
                  onChange={e => setRelType(e.target.value as "association" | "generalization")}>
                  <option value="association">Association</option>
                  <option value="generalization">Generalization (Inheritance)</option>
                </select>
              </div>
            </div>
            {relError && <p className="text-xs text-rose-600">{relError}</p>}
            <button id="cus-add-rel" type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Relationship
            </button>
          </form>

          {rels.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {rels.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-700">
                    <strong>{r.from}</strong>
                    <span className="mx-2 text-slate-400">
                      {r.type === "generalization" ? "──▷" : "──▶"}
                    </span>
                    <strong>{r.to}</strong>
                    <span className="ml-2 text-xs text-slate-400">({r.type})</span>
                  </span>
                  <button type="button" onClick={() => deleteRel(i)}
                    className="rounded bg-red-50 p-1 text-red-500 hover:bg-red-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Exp5Card>
      )}

      {/* ── Live Diagram Preview ── */}
      {classes.length > 0 && (
        <Exp5Card title="Diagram Preview" icon={Play}>
          <div className="overflow-x-auto">
            <div className="flex flex-wrap gap-4 pb-2">
              {classes.map(cls => (
                <Exp5CustomClassBox
                  key={cls.id}
                  cls={cls}
                  metrics={customMetrics.find(m => m.id === cls.id)}
                />
              ))}
            </div>
            {rels.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Relationships</p>
                <div className="flex flex-wrap gap-2">
                  {rels.map((r, i) => (
                    <span key={i} className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                      r.type === "generalization" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {r.from} {r.type === "generalization" ? "◁──" : "◀──"} {r.to}
                      <span className="text-[10px] opacity-70">({r.type})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Exp5Card>
      )}

      {/* ── Live Metrics Table ── */}
      {customMetrics.length > 0 && (
        <Exp5Card title="Computed OO Metrics" icon={BarChart3}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Class","Attrs","Methods","Total","Size","Outgoing","Incoming","Coupling","ERS"].map(h => (
                    <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customMetrics.map(m => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-blue-800">{m.name}</td>
                    <td className="px-3 py-2 text-center">{m.attributeCount}</td>
                    <td className="px-3 py-2 text-center">{m.methodCount}</td>
                    <td className="px-3 py-2 text-center font-medium">{m.totalMembers}</td>
                    <td className="px-3 py-2">
                      <Exp5Badge label={m.sizeCategory}
                        color={m.sizeCategory === "Large" ? "bg-rose-100 text-rose-700" : m.sizeCategory === "Medium" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"} />
                    </td>
                    <td className="px-3 py-2 text-center">{m.outgoing}</td>
                    <td className="px-3 py-2 text-center">{m.incoming}</td>
                    <td className="px-3 py-2">
                      <Exp5Badge label={m.couplingCategory}
                        color={m.couplingCategory === "High" ? "bg-rose-100 text-rose-700" : m.couplingCategory === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"} />
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-indigo-700">{m.estimatedResponseSet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400 italic">
            Cohesion is qualitatively set to High for user-defined classes. Add domain-specific knowledge to interpret cohesion manually.
          </p>
        </Exp5Card>
      )}

      {classes.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-400">
          <Boxes className="h-12 w-12 opacity-30" />
          <p className="font-medium">No classes added yet.</p>
          <p className="text-sm">Use the form above to add your first class.</p>
        </div>
      )}
    </div>
  );
}

// ─── Simulation Tab ───────────────────────────────────────────────
interface Exp5SimulationTabProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  simMode: "prebuilt" | "custom";
  onSetSimMode: (m: "prebuilt" | "custom") => void;
  customClasses: Exp5ClassDef[];
  customRels: Exp5Relationship[];
  onSetCustomClasses: (cls: Exp5ClassDef[]) => void;
  onSetCustomRels: (rels: Exp5Relationship[]) => void;
}

function Exp5SimulationTab({
  selectedId, onSelect,
  simMode, onSetSimMode,
  customClasses, customRels, onSetCustomClasses, onSetCustomRels,
}: Exp5SimulationTabProps) {

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          id="exp5-mode-prebuilt"
          type="button"
          onClick={() => onSetSimMode("prebuilt")}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            simMode === "prebuilt" ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
          )}
        >
          <Boxes className="h-3.5 w-3.5" /> Pre-built Diagram
        </button>
        <button
          id="exp5-mode-custom"
          type="button"
          onClick={() => onSetSimMode("custom")}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            simMode === "custom" ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
          )}
        >
          <Edit2 className="h-3.5 w-3.5" /> Custom Diagram
        </button>
      </div>

      {simMode === "prebuilt" ? (
        <>
          <Exp5Card title="Interactive Class Diagram Simulation" icon={Play}>
            <p className="text-sm text-slate-500 mb-4">
              Click any class box to select it and inspect its metrics. Related classes and connections are
              highlighted automatically.
            </p>
            <Exp5Diagram selectedId={selectedId} onSelect={onSelect} />
          </Exp5Card>
          <Exp5Card title="Class Inspector" icon={Info}>
            <Exp5DetailsPanel selectedId={selectedId} />
          </Exp5Card>
        </>
      ) : (
        <>
          <Exp5InfoBox>
            Build your own class diagram by adding classes, attributes, methods and relationships.
            OO metrics (size, coupling, estimated response set) are computed live.
          </Exp5InfoBox>
          <Exp5CustomDiagramBuilder
            classes={customClasses}
            rels={customRels}
            onSetClasses={onSetCustomClasses}
            onSetRels={onSetCustomRels}
          />
        </>
      )}
    </div>
  );
}

// ─── Results Tab ──────────────────────────────────────────────────
function Exp5ResultsTab() {
  const metrics = EXP5_METRICS;

  const largestClass = metrics.reduce((a, b) => (b.totalMembers > a.totalMembers ? b : a));
  const highestCoupling = metrics.reduce((a, b) => (b.outgoing > a.outgoing ? b : a));
  const highestERS = metrics.reduce((a, b) => (b.estimatedResponseSet > a.estimatedResponseSet ? b : a));

  const attrData = metrics.map((m, i) => ({ name: m.name, value: m.attributeCount, color: EXP5_CHART_COLORS[i % EXP5_CHART_COLORS.length]! }));
  const methData = metrics.map((m, i) => ({ name: m.name, value: m.methodCount, color: EXP5_CHART_COLORS[i % EXP5_CHART_COLORS.length]! }));
  const outgoingData = metrics.map((m, i) => ({ name: m.name, value: m.outgoing, color: EXP5_CHART_COLORS[i % EXP5_CHART_COLORS.length]! }));
  const ersData = metrics.map((m, i) => ({ name: m.name, value: m.estimatedResponseSet, color: EXP5_CHART_COLORS[i % EXP5_CHART_COLORS.length]! }));

  function Exp5SmallChart({ data, title, yLabel }: { data: { name: string; value: number; color: string }[]; title: string; yLabel: string }) {
    return (
      <Exp5Card title={title} icon={BarChart3}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: yLabel, angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
            <Tooltip />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Exp5Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Exp5KpiCard label="Total Classes" value={metrics.length} color="blue" />
        <Exp5KpiCard label="Largest Class" value={largestClass.name} sub={`${largestClass.totalMembers} members`} color="indigo" />
        <Exp5KpiCard label="Highest Coupling" value={highestCoupling.name} sub={`${highestCoupling.outgoing} outgoing`} color="amber" />
        <Exp5KpiCard label="Highest Est. Response Set" value={highestERS.name} sub={`ERS: ${highestERS.estimatedResponseSet}`} color="red" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Exp5SmallChart data={attrData} title="Attributes per Class" yLabel="Attrs" />
        <Exp5SmallChart data={methData} title="Methods per Class" yLabel="Methods" />
        <Exp5SmallChart data={outgoingData} title="Outgoing Interactions per Class" yLabel="Outgoing" />
        <Exp5SmallChart data={ersData} title="Estimated Response Set per Class" yLabel="ERS" />
      </div>

      {/* Full table */}
      <Exp5Card title="Complete Metrics Table" icon={ListChecks}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Class", "Attrs", "Methods", "Total", "Size", "Cohesion", "Outgoing", "Coupling", "Est. RS"].map(h => (
                  <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{m.name}</td>
                  <td className="px-3 py-2 text-center">{m.attributeCount}</td>
                  <td className="px-3 py-2 text-center">{m.methodCount}</td>
                  <td className="px-3 py-2 text-center font-semibold">{m.totalMembers}</td>
                  <td className="px-3 py-2"><Exp5Badge label={m.sizeCategory} color={SIZE_COLOR[m.sizeCategory]!} /></td>
                  <td className="px-3 py-2"><Exp5Badge label={m.cohesionLevel} color={COHESION_COLOR[m.cohesionLevel]!} /></td>
                  <td className="px-3 py-2 text-center">{m.outgoing}</td>
                  <td className="px-3 py-2"><Exp5Badge label={m.couplingCategory} color={COUPLING_COLOR[m.couplingCategory]!} /></td>
                  <td className="px-3 py-2 text-center font-semibold text-blue-700">{m.estimatedResponseSet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Exp5Card>
    </div>
  );
}

// ─── Analysis Tab ─────────────────────────────────────────────────
function Exp5AnalysisTab() {
  const metrics = EXP5_METRICS;

  const large = metrics.filter((m) => m.sizeCategory === "Large");
  const small = metrics.filter((m) => m.sizeCategory === "Small");
  const highCohesion = metrics.filter((m) => m.cohesionLevel === "High");
  const medLowCohesion = metrics.filter((m) => m.cohesionLevel !== "High");
  const highCoupling = metrics.filter((m) => m.couplingCategory === "High");
  const medCoupling = metrics.filter((m) => m.couplingCategory === "Medium");
  const maxERS = Math.max(...metrics.map((m) => m.estimatedResponseSet));
  const highERS = metrics.filter((m) => m.estimatedResponseSet >= Math.max(maxERS - 1, 6));

  return (
    <div className="space-y-4">
      <Exp5Card title="Class Size Insights" icon={FlaskConical}>
        <div className="space-y-2 text-sm text-slate-600">
          {large.length > 0 ? (
            <p>
              <strong className="text-rose-700">Large classes ({large.map((m) => m.name).join(", ")}):</strong>{" "}
              These classes have {large.length === 1 ? `${large[0]!.totalMembers} members` : "8 or more members"}, which may indicate
              that they carry significant functionality. Consider reviewing whether any responsibilities
              can be extracted into separate classes.
            </p>
          ) : (
            <p><strong>No large classes detected.</strong> All classes have 7 or fewer total members.</p>
          )}
          {small.length > 0 && (
            <p>
              <strong className="text-slate-700">Small classes ({small.map((m) => m.name).join(", ")}):</strong>{" "}
              These have {small.length === 1 ? "a minimal footprint" : "minimal footprints"}, suggesting focused and potentially
              specialized responsibilities.
            </p>
          )}
        </div>
      </Exp5Card>

      <Exp5Card title="Cohesion Insights" icon={FlaskConical}>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <strong className="text-emerald-700">{highCohesion.length} high-cohesion classes:</strong>{" "}
            {highCohesion.map((m) => m.name).join(", ")} — each has a single, focused responsibility.
          </p>
          {medLowCohesion.length > 0 && (
            <p>
              <strong className="text-amber-700">{medLowCohesion.length} class(es) with medium/lower cohesion:</strong>{" "}
              {medLowCohesion.map((m) => m.name).join(", ")}.{" "}
              {medLowCohesion.map((m) => m.cohesionReason).join(" ")}
            </p>
          )}
        </div>
      </Exp5Card>

      <Exp5Card title="Coupling Insights" icon={GitCompare}>
        <div className="space-y-2 text-sm text-slate-600">
          {highCoupling.length > 0 ? (
            <p>
              <strong className="text-rose-700">High-coupling classes ({highCoupling.map((m) => m.name).join(", ")}):</strong>{" "}
              These have 4 or more outgoing interactions and are candidates for design improvement through
              interfaces, abstraction, or dependency injection.
            </p>
          ) : (
            <p><strong>No high-coupling classes detected</strong> using the simplified laboratory threshold (4+).</p>
          )}
          {medCoupling.length > 0 && (
            <p>
              <strong className="text-amber-700">Medium-coupling classes ({medCoupling.map((m) => m.name).join(", ")}):</strong>{" "}
              These have 2–3 outgoing interactions. Introducing abstractions can reduce direct
              dependencies where beneficial.
            </p>
          )}
        </div>
      </Exp5Card>

      <Exp5Card title="Response Set Insights" icon={BarChart3}>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            <strong className="text-blue-700">Highest estimated response set classes ({highERS.map((m) => m.name).join(", ")}):</strong>{" "}
            These classes have the largest estimated response sets (ERS ≥ {Math.max(maxERS - 1, 6)}),
            meaning that when they receive messages, the most methods — across themselves and their
            collaborators — may be involved.
          </p>
          {highERS.map((m) => (
            <div key={m.id} className="rounded bg-blue-50 border border-blue-100 p-2 text-xs text-blue-700">
              <strong>{m.name} (ERS: {m.estimatedResponseSet}):</strong> {m.responseReason}
            </div>
          ))}
        </div>
      </Exp5Card>

      <Exp5Card title="Design Recommendations" icon={TrendingUp}>
        <ul className="space-y-2 text-sm text-slate-600">
          {medLowCohesion.map((m) => (
            <li key={m.id} className="flex gap-2">
              <ArrowRight className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
              <span><strong>{m.name}:</strong> Consider applying Separation of Concerns — {m.cohesionReason}</span>
            </li>
          ))}
          {medCoupling.concat(highCoupling).map((m) => {
            const strats = EXP5_STRATEGIES.filter((s) => s.applicableTo.includes(m.id));
            return strats.map((s) => (
              <li key={`${m.id}-${s.id}`} className="flex gap-2">
                <ArrowRight className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <span><strong>{m.name} ({s.label}):</strong> {s.description}</span>
              </li>
            ));
          })}
          {large.map((m) => (
            <li key={`${m.id}-size`} className="flex gap-2">
              <ArrowRight className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span><strong>{m.name} (large class):</strong> Review whether any methods can be delegated to collaborating classes.</span>
            </li>
          ))}
          {medLowCohesion.length === 0 && medCoupling.length === 0 && highCoupling.length === 0 && large.length === 0 && (
            <li className="text-slate-400 italic">No critical design issues detected based on the simplified laboratory thresholds.</li>
          )}
        </ul>
      </Exp5Card>
    </div>
  );
}

// ─── Comparison Tab ───────────────────────────────────────────────
function Exp5ComparisonTab() {
  const [strategyId, setStrategyId] = useState<string>(EXP5_STRATEGIES[0]!.id);
  const strategy = EXP5_STRATEGIES.find((s) => s.id === strategyId)!;

  return (
    <div className="space-y-4">
      <Exp5Card title="Before vs Improved Design" icon={GitCompare}>
        <p className="text-sm text-slate-600 mb-4">
          Select a refactoring strategy to see how it conceptually improves the design. Before values
          reflect the original class model; after values reflect the improved design.
        </p>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="exp5-strategy-select">
            Design Improvement Strategy
          </label>
          <select
            id="exp5-strategy-select"
            className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
          >
            {EXP5_STRATEGIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <p className="text-sm text-slate-600 mb-4 italic">{strategy.description}</p>
        <p className="text-xs text-slate-400 mb-4">Applicable to: {strategy.applicableTo.join(", ")}</p>
      </Exp5Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Exp5Card title="Original Design (Before)" icon={TrendingDown}>
          <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre">
            {strategy.before}
          </pre>
        </Exp5Card>
        <Exp5Card title="Improved Design (After)" icon={TrendingUp}>
          <pre className="bg-slate-900 text-blue-300 rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre">
            {strategy.after}
          </pre>
        </Exp5Card>
      </div>

      <Exp5Card title="Metric Comparison" icon={BarChart3}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Metric</th>
                <th className="px-4 py-2 text-left text-slate-700">Before</th>
                <th className="px-4 py-2 text-left text-blue-700">After</th>
                <th className="px-4 py-2 text-left">Note</th>
              </tr>
            </thead>
            <tbody>
              {strategy.metricChanges.map((row) => (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-700 whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-2 text-slate-600">{row.before}</td>
                  <td className="px-4 py-2 text-blue-700 font-medium">{row.after}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Exp5Card>
    </div>
  );
}

// ─── Quiz Tab ─────────────────────────────────────────────────────
function Exp5QuizTab() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const q = EXP5_QUIZ[current]!;
  const score = answers.filter((a, i) => a === EXP5_QUIZ[i]!.correct).length;

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const upd = [...answers]; upd[current] = idx; setAnswers(upd);
  }

  function handleNext() {
    if (current < EXP5_QUIZ.length - 1) {
      const next = current + 1;
      setCurrent(next);
      setSelected(answers[next] ?? null);
      setAnswered(answers[next] !== null);
    } else {
      setFinished(true);
    }
  }

  function handleRetry() {
    setCurrent(0); setSelected(null); setAnswered(false);
    setAnswers(Array(10).fill(null)); setFinished(false); setReviewing(false);
  }

  if (finished && !reviewing) {
    const pct = Math.round((score / 10) * 100);
    const pass = score >= 6;
    return (
      <Exp5Card title="Object-Oriented Design Metrics — Assessment Quiz" icon={ListChecks}>
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <div className={cn("flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white", pass ? "bg-emerald-500" : "bg-rose-500")}>
            {score}/10
          </div>
          <div>
            <p className="text-2xl font-bold">{pct}%</p>
            <p className={cn("text-lg font-semibold mt-1", pass ? "text-emerald-600" : "text-rose-600")}>{pass ? "✓ Pass" : "✗ Fail"}</p>
            <p className="text-sm text-slate-500 mt-2">Passing score: 6/10 (60%)</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleRetry} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <RotateCcw className="h-4 w-4" /> Retry Quiz
            </button>
            <button type="button" onClick={() => setReviewing(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Review Answers <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Exp5Card>
    );
  }

  if (reviewing) {
    return (
      <Exp5Card title="Answer Review" icon={ListChecks}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">Final Score: <strong>{score}/10</strong></p>
          <button type="button" onClick={handleRetry} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Retry Quiz
          </button>
        </div>
        <div className="space-y-4">
          {EXP5_QUIZ.map((qItem, qi) => {
            const userAns = answers[qi];
            const correct = userAns === qItem.correct;
            return (
              <div key={qItem.id} className={cn("rounded-lg border p-4", correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50")}>
                <p className="text-sm font-semibold text-slate-800 mb-2">Q{qItem.id}. {qItem.question}</p>
                <div className="space-y-1">
                  {qItem.options.map((opt, oi) => (
                    <div key={oi} className={cn("flex items-center gap-2 rounded px-3 py-1.5 text-sm",
                      oi === qItem.correct ? "bg-emerald-100 text-emerald-800 font-medium"
                        : oi === userAns && !correct ? "bg-red-100 text-red-700"
                        : "text-slate-500")}>
                      {oi === qItem.correct ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                        : oi === userAns ? <X className="h-3.5 w-3.5 text-red-500" />
                        : <Minus className="h-3.5 w-3.5 text-slate-300" />}
                      {opt}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-600 italic">{qItem.feedback}</p>
              </div>
            );
          })}
        </div>
      </Exp5Card>
    );
  }

  return (
    <Exp5Card title="Object-Oriented Design Metrics — Assessment Quiz" icon={ListChecks}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">Question {current + 1} of 10</span>
        <span className="text-sm font-medium text-blue-600">Score: {score}</span>
      </div>
      <div className="mb-2 h-2 w-full rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${((current + (answered ? 1 : 0)) / 10) * 100}%` }} />
      </div>
      <p className="mt-5 mb-4 text-base font-semibold text-slate-800">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let variant = "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50";
          if (answered) {
            if (i === q.correct) variant = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
            else if (i === selected) variant = "border-red-400 bg-red-50 text-red-700";
            else variant = "border-slate-100 bg-slate-50 text-slate-400";
          } else if (selected === i) variant = "border-blue-500 bg-blue-50 text-blue-800";
          return (
            <button key={i} id={`exp5-quiz-q${current + 1}-opt-${i}`} type="button" onClick={() => handleSelect(i)} disabled={answered}
              className={cn("w-full rounded-lg border px-4 py-3 text-left text-sm transition-all", variant)}>
              <span className="mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <span className="font-semibold mr-2">{selected === q.correct ? "✓ Correct!" : "✗ Incorrect."}</span>
          {q.feedback}
        </div>
      )}
      {answered && (
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={handleNext}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            {current < 9 ? "Next Question" : "See Results"}<ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </Exp5Card>
  );
}

// ─── Conclusion + Report Tab ──────────────────────────────────────
function Exp5ConclusionTab() {
  const metrics = EXP5_METRICS;
  const largestClass = metrics.reduce((a, b) => (b.totalMembers > a.totalMembers ? b : a));
  const highestCoupling = metrics.reduce((a, b) => (b.outgoing > a.outgoing ? b : a));
  const highestERS = metrics.reduce((a, b) => (b.estimatedResponseSet > a.estimatedResponseSet ? b : a));
  const medLowCohesion = metrics.filter((m) => m.cohesionLevel !== "High");
  const [names, setNames] = useState("");
  const [regs, setRegs] = useState("");
  const [exporting, setExporting] = useState(false);

  const conclusion =
    "Object-oriented design metrics provide a structured approach to evaluating software quality at the class level. By analyzing size, cohesion, coupling, and response sets, developers can identify classes that may benefit from refactoring and apply appropriate design improvements such as interfaces, service abstractions, dependency injection, and separation of responsibilities.";

  async function handleDownload() {
    setExporting(true);
    try {
      const { downloadExp5Pdf } = await import("@/lib/reportPdf");
      await downloadExp5Pdf({
        names,
        regs,
        metrics,
        strategies: EXP5_STRATEGIES,
        largestClass,
        highestCoupling,
        highestERS,
        medLowCohesion,
        conclusion,
      });
    } finally {
      setExporting(false);
    }
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4">
      <Exp5Card title="Conclusion" icon={FileText}>
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          <p>
            Object-oriented design metrics help evaluate the structural quality of a software system.
            Class size provides an indication of the amount of functionality contained within classes,
            while cohesion describes how closely related their responsibilities are.
          </p>
          <p>
            Coupling and response-set analysis help identify classes that participate heavily in
            interactions with other classes. Such classes can become candidates for design improvement
            through interfaces, service abstractions, dependency injection, and separation of
            responsibilities.
          </p>
        </div>
      </Exp5Card>

      <Exp5Card title="Generate Lab Report" icon={Download}>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-medium text-slate-700">
              Name(s)
              <input className={fieldClass} value={names} onChange={(e) => setNames(e.target.value)} />
            </label>
            <label className="text-xs font-medium text-slate-700">
              Registration number(s)
              <input className={fieldClass} value={regs} onChange={(e) => setRegs(e.target.value)} />
            </label>
          </div>
          <button
            id="exp5-download-report"
            type="button"
            onClick={() => void handleDownload()}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Preparing…" : "Download PDF"}
          </button>
          <p className="text-xs text-slate-500">
            The PDF includes class size, cohesion, coupling, response-set tables, and decoupling
            recommendations from the current model.
          </p>
        </div>
      </Exp5Card>
    </div>
  );
}

// ─── Tab Icons ────────────────────────────────────────────────────
const EXP5_TAB_ICONS: Record<Exp5Tab, React.ComponentType<{ className?: string }>> = {
  aim: Target,
  objective: Lightbulb,
  theory: BookOpen,
  procedure: ClipboardList,
  exercise: ListChecks,
  simulation: Play,
  results: BarChart3,
  analysis: FlaskConical,
  comparison: GitCompare,
  conclusion: FileText,
};

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export function ObjectOrientedMetricsPage() {
  useParams();
  const [activeTab, setActiveTab] = useState<Exp5Tab>("aim");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Simulation state — lifted so it survives tab switches
  const [simMode, setSimMode] = useState<"prebuilt" | "custom">("prebuilt");
  const [customClasses, setCustomClasses] = useState<Exp5ClassDef[]>([]);
  const [customRels, setCustomRels] = useState<Exp5Relationship[]>([]);

  const handleSelectClass = useCallback((id: string | null) => {
    setSelectedClassId(id);
  }, []);

  function handleReset() {
    setSelectedClassId(null);
    setSimMode("prebuilt");
    setCustomClasses([]);
    setCustomRels([]);
    setActiveTab("aim");
  }

  function renderTab() {
    switch (activeTab) {
      case "aim":        return <Exp5AimTab />;
      case "objective":  return <Exp5ObjectiveTab />;
      case "theory":     return <Exp5TheoryTab />;
      case "procedure":  return <Exp5ProcedureTab />;
      case "exercise":   return <Exp5ExerciseTab selectedId={selectedClassId} onSelect={handleSelectClass} />;
      case "simulation": return (
        <Exp5SimulationTab
          selectedId={selectedClassId}
          onSelect={handleSelectClass}
          simMode={simMode}
          onSetSimMode={setSimMode}
          customClasses={customClasses}
          customRels={customRels}
          onSetCustomClasses={setCustomClasses}
          onSetCustomRels={setCustomRels}
        />
      );
      case "results":    return <Exp5ResultsTab />;
      case "analysis":   return <Exp5AnalysisTab />;
      case "comparison": return <Exp5ComparisonTab />;
      case "conclusion":
        return (
          <div className="space-y-6">
            <Exp5ConclusionTab />
            <Exp5QuizTab />
          </div>
        );
      default: return null;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <ExperimentSidebar />
      <div className="min-w-0 flex-1">
        {/* Blue gradient header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-indigo-500 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <span>Experiments</span>
              <span>/</span>
              <span className="font-medium text-white">Object-Oriented Design Metrics</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
                <Boxes className="h-3 w-3" />
                Experiment 5
              </span>
              <h1 className="text-xl font-bold sm:text-2xl">Object-Oriented Design Metrics</h1>
            </div>
            <p className="mt-1.5 max-w-3xl text-sm text-white/85">
              Analyze class size, cohesion, coupling, and response sets to evaluate object-oriented design quality.
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-10">
            {EXP5_TABS.map((tab) => {
              const Icon = EXP5_TAB_ICONS[tab.id];
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`exp5-tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="px-4 py-6 sm:px-6 lg:px-10">
          {renderTab()}

          {/* Reset */}
          <div className="mt-8 flex justify-end">
            <button
              id="exp5-reset-experiment"
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-300 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Experiment
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
