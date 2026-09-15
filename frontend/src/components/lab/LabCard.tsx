import { AlertCircle } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LabCard({
  title,
  icon: Icon,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {title && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          <h3 className="text-sm font-semibold text-blue-700">{title}</h3>
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function LabFormula({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center rounded-lg bg-blue-50 p-3", className)}>
      <p className="text-center font-mono text-sm font-semibold text-blue-800">{children}</p>
    </div>
  );
}

export function LabThresholds({
  caption,
  rows,
}: {
  caption?: string;
  rows: { range: string; label: string; color: string }[];
}) {
  return (
    <>
      {caption && <p className="mb-3 text-xs italic text-slate-500">{caption}</p>}
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={`${r.range}-${r.label}`}
            className={cn("flex items-center justify-between rounded-lg px-4 py-2 text-sm", r.color)}
          >
            <span className="font-mono">{r.range}</span>
            <span className="font-bold">{r.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function LabKpiCard({
  label,
  value,
  sub,
  color = "blue",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "red" | "indigo";
}) {
  const colors = {
    blue: "from-blue-600 to-blue-500",
    green: "from-emerald-600 to-emerald-500",
    amber: "from-amber-500 to-amber-400",
    red: "from-rose-600 to-rose-500",
    indigo: "from-indigo-600 to-indigo-500",
  };
  return (
    <div className={cn("rounded-xl bg-gradient-to-br p-4 text-white shadow-md", colors[color])}>
      <p className="mb-1 text-xs font-medium text-white/80">{label}</p>
      <p className="text-2xl font-bold leading-none">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/70">{sub}</p>}
    </div>
  );
}

export function LabInfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <div>{children}</div>
    </div>
  );
}

export function LabStepList({
  items,
  variant = "objective",
}: {
  items: string[];
  variant?: "objective" | "procedure";
}) {
  const badge =
    variant === "procedure"
      ? "bg-blue-600 text-white"
      : "bg-blue-100 text-blue-700";
  return (
    <ol className="space-y-3 text-sm text-slate-600">
      {items.map((item, i) => (
        <li key={item} className="flex gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              badge,
            )}
          >
            {i + 1}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}
