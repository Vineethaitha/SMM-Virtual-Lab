import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LabHeroHeader } from "@/components/layout/LabHeroHeader";
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
        <LabHeroHeader
          experimentNumber={experimentNumber}
          title={title}
          subtitle={subtitle}
          badgeIcon={BadgeIcon}
          headerAction={headerAction}
        />

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
