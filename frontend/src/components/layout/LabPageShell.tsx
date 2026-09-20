import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { ComponentType, ReactNode } from "react";
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
}

export function LabPageShell<T extends string>({
  experimentNumber,
  title,
  subtitle,
  sections,
  activeSection,
  onSectionChange,
  children,
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
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <ExperimentSidebar />

      <div className="min-w-0 flex-1">
        {/* ── Gradient hero ── */}
        <div className="gradient-hero relative overflow-hidden text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
            <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
              <span>Experiments</span>
              <span>/</span>
              <span className="font-medium text-white">{title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">
                Experiment {experimentNumber}
              </span>
              <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
            </div>
            <p className="mt-1.5 max-w-3xl text-sm text-white/85">{subtitle}</p>
          </div>
        </div>

        {/* ── Section nav ── */}
        <nav className="sticky top-0 z-20 glass border-b border-border shadow-sm">
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-10">
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
                    "flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "gradient-primary text-white shadow-md"
                      : "bg-muted/70 text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Content ── */}
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
