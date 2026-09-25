import type { ComponentType, ReactNode } from "react";

/** Fixed-height lab banner so switching experiments does not shift the tab row. */
export function LabHeroHeader({
  experimentNumber,
  title,
  subtitle,
  badgeIcon: BadgeIcon,
  headerAction,
}: {
  experimentNumber: number;
  title: string;
  subtitle: string;
  badgeIcon?: ComponentType<{ className?: string }>;
  headerAction?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 text-white">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
      <div className="relative flex h-[148px] flex-col justify-center px-4 sm:h-[156px] sm:px-6 lg:px-10">
        <div className="mb-1.5 flex h-5 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-white/70">
            <span className="shrink-0">Experiments</span>
            <span className="shrink-0">/</span>
            <span className="truncate font-medium text-white">{title}</span>
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
        <div className="flex h-8 items-center gap-x-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
            {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
            Experiment {experimentNumber}
          </span>
          <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
        </div>
        <p className="mt-1.5 line-clamp-2 min-h-[40px] max-w-3xl text-sm leading-5 text-white/85">{subtitle}</p>
      </div>
    </div>
  );
}
