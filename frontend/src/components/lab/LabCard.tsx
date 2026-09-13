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

export function LabInfoBox({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
  variant?: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <div>
        {title && <div className="font-semibold text-blue-900 mb-1">{title}</div>}
        <div>{children}</div>
      </div>
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
