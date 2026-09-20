import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExperimentSidebar } from "@/components/layout/ExperimentSidebar";

export interface LabPageSection<T extends string = string> {
  id: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface LabPageShellProps<T extends string> {
  experimentNumber: number;
  title: string;
  subtitle: string;
  sections: LabPageSection<T>[];
  activeSection: T;
  onSectionChange: (id: T) => void;
  children: ReactNode;
  headerAction?: ReactNode;
  badgeIcon?: ComponentType<{ className?: string }>;
}

export function LabPageShell<T extends string>({
  experimentNumber,
  title,
  subtitle,
  sections,
  activeSection,
  onSectionChange,
  children,
  headerAction,
  badgeIcon: BadgeIcon,
}: LabPageShellProps<T>) {
  const skipScroll = useRef(true);

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    document.getElementById("lab-page-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <ExperimentSidebar />

      <div className="min-w-0 flex-1">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>Experiments</span>
                <span>/</span>
                <span className="font-medium text-white">{title}</span>
              </div>
              {headerAction}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                Experiment {experimentNumber}
              </span>
              <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
            </div>
            <p className="mt-1.5 max-w-3xl text-sm text-white/85">{subtitle}</p>
          </div>
        </div>

        <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-10">
            {sections.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-section-${item.id}`}
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main id="lab-page-section" className="scroll-mt-16 px-4 py-6 sm:px-6 lg:px-10">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
