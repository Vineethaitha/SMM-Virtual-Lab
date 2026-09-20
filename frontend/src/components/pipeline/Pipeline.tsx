import { PIPELINE_STEPS, useLab } from "@/state/LabContext";
import { cn } from "@/lib/utils";

export function Pipeline() {
  const { pipelineIndex, analyzing, analysis } = useLab();
  if (pipelineIndex < 0 && !analysis) return null;
  return (
    <ol className="flex flex-wrap gap-1 px-3 py-2">
      {PIPELINE_STEPS.map((step, i) => {
        const active = analyzing && i === pipelineIndex;
        const done = pipelineIndex >= i && (analysis || analyzing);
        return (
          <li
            key={step}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              active && "bg-primary text-primary-foreground",
              !active && done && "bg-emerald-100 text-emerald-800",
              !active && !done && "bg-secondary text-muted-foreground",
            )}
          >
            {step}
          </li>
        );
      })}
    </ol>
  );
}
