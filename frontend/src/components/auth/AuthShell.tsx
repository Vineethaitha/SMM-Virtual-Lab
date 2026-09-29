import type { InputHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BarChart3, FileCheck2, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { SrmOfficialLogo } from "@/components/brand/SrmLogos";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Badge } from "@/components/ui/card";

const FEATURES: { icon: LucideIcon; title: string; detail: string }[] = [
  {
    icon: BarChart3,
    title: "10 experiments from the syllabus",
    detail: "Size estimation, code complexity, OO metrics, testing, maintainability, reliability and process metrics.",
  },
  {
    icon: ShieldCheck,
    title: "Quiz at the end of each lab",
    detail: "Taken in fullscreen on one screen. You can check your answers once you submit.",
  },
  {
    icon: FileCheck2,
    title: "Lab report as a PDF",
    detail: "Download it after the quiz for your record. Your faculty can see which labs you have finished.",
  },
];

export function AuthShell({
  heading,
  description,
  headerRight,
  children,
}: {
  heading?: ReactNode;
  description?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <SiteHeader right={headerRight} />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-background to-background" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <main className="mx-auto grid min-h-screen max-w-6xl content-start gap-12 md:content-center md:items-center px-4 pb-12 pt-28 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-10 md:pt-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,440px)] lg:gap-16">
        <motion.section
          className="hidden md:block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
            <Sparkles className="mr-2 h-4 w-4" />
            Virtual Laboratory
          </Badge>
          <h1 className="mt-6 text-4xl font-extrabold lg:text-5xl leading-[1.1] tracking-tight">
            {heading ?? (
              <>
                Sign in to your{" "}
                <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
                  virtual lab
                </span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed lg:text-lg text-muted-foreground">
            {description ??
              "Lab work for 21CSC403T Software Metrics and Measurement. Sign in with your SRM email to do the experiments and keep track of what you've completed."}
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.title}
                className="flex items-start gap-4"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                  <f.icon className="h-5 w-5 text-white" />
                </span>
                <span>
                  <span className="block font-semibold">{f.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{f.detail}</span>
                </span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-12 flex items-center gap-4 border-t border-border/60 pt-6">
            <SrmOfficialLogo className="h-12 w-auto" />
            <p className="text-sm leading-snug text-muted-foreground">
              Department of Computational Intelligence
              <br />
              SRM Institute of Science and Technology
            </p>
          </div>
        </motion.section>

        <motion.section
          className="mx-auto w-full max-w-md md:max-w-none"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="rounded-2xl border border-border/60 bg-white/90 p-7 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-9">
            {children}
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground md:hidden">
            Department of Computational Intelligence · SRMIST
          </p>
        </motion.section>
      </main>
    </div>
  );
}

/** Text input with a leading icon, styled to match the rest of the site. */
export function IconField({
  icon: Icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }) {
  return (
    <div className="relative mt-1.5">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        className={cn(
          "h-12 w-full rounded-xl border border-input bg-white pl-10 pr-3.5 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/15",
          className,
        )}
      />
    </div>
  );
}
