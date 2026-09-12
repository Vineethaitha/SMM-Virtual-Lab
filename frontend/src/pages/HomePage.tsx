import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Beaker,
  BookOpen,
  BookText,
  Boxes,
  ChevronDown,
  ClipboardCheck,
  Code,
  FileSearch,
  Gauge,
  Lightbulb,
  Monitor,
  Network,
  Play,
  Ruler,
  Shield,
  Smile,
  Sparkles,
  Target,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXPERIMENTS } from "@/data/experiments";
import { SrmOfficialLogo, SrmvlLogo } from "@/components/brand/SrmLogos";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  BarChart3,
  ClipboardCheck,
  Ruler,
  Smile,
  Boxes,
  Network,
  FileSearch,
  Wrench,
  Shield,
  Gauge,
};

const SYLLABUS = [
  {
    unit: 1,
    title: "Product metrics & static analysis",
    topics: [
      "LOC, SLOC, LLOC and size interpretation",
      "McCabe cyclomatic complexity and control-flow graphs",
      "Halstead metrics and Maintainability Index",
      "Identifying complex functions and refactoring with before/after comparison",
    ],
  },
  {
    unit: 2,
    title: "Test management & quality surveys",
    topics: [
      "Test-case design, execution, and coverage in Kiwi TCMS",
      "Customer satisfaction as a quality metric",
      "Survey design, administration, and analysis",
    ],
  },
  {
    unit: 3,
    title: "Object-oriented metrics",
    topics: [
      "Class size, cohesion, coupling, and response set",
      "CK suite: WMC, DIT, NOC, CBO, RFC, LCOM",
      "Tool-based collection with CK and SonarCloud",
    ],
  },
  {
    unit: 4,
    title: "Requirements, maintenance & process",
    topics: [
      "Requirement ambiguity and inspection comments",
      "Corrective, adaptive, perfective, and preventive maintenance",
      "Reliability, defect density, and process capability (CPI)",
    ],
  },
];

const FEATURES = [
  {
    icon: Play,
    title: "Interactive simulation",
    description:
      "Walk a control-flow graph with Play / Step and true–false branches — without executing student code.",
  },
  {
    icon: Beaker,
    title: "Real metric engines",
    description: "Exercise 1 uses Radon on Python AST. No hardcoded LOC, CC, Halstead, or MI values.",
  },
  {
    icon: Code,
    title: "Write and refactor",
    description: "Edit sample or your own Python, save a baseline, then compare improvement after a refactor.",
  },
  {
    icon: BookOpen,
    title: "Guided exercises",
    description: "Aim, theory, procedure, quiz, and a rubric-aligned report for each lab.",
  },
];

const OUTCOMES = [
  { icon: BarChart3, text: "Collect and interpret size, complexity, and Halstead metrics" },
  { icon: Target, text: "Spot high-complexity functions and justify a refactor with numbers" },
  { icon: Lightbulb, text: "Relate object-oriented metrics to design quality" },
  { icon: ClipboardCheck, text: "Connect test coverage and requirement quality to measurement" },
  { icon: Shield, text: "Discuss reliability and process capability using collected data" },
  { icon: Monitor, text: "Produce a structured lab report from live analysis results" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function Section({
  children,
  className = "",
  id = "",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function HomePage() {
  const [openUnits, setOpenUnits] = useState<number[]>([1]);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  const toggleUnit = (unit: number) => {
    setOpenUnits((prev) => (prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit]));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
          <Link to="/" className="flex items-center gap-3 sm:gap-6">
            <SrmvlLogo className="h-9 w-auto" />
            <div className="hidden items-center gap-4 border-l border-border pl-6 md:flex">
              <div className="flex flex-col leading-tight">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">21CSC403T</p>
                <p className="text-sm font-semibold">Software Metrics & Measurement</p>
              </div>
            </div>
          </Link>
          <Link to="/lab/1">
            <Button size="sm" className="gap-2">
              <Beaker className="h-4 w-4" />
              Enter Labs
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-background to-background" />
        <div className="absolute left-1/2 top-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

        <motion.div
          className="mx-auto max-w-5xl space-y-8 px-4 text-center sm:px-6"
          style={{ opacity, scale }}
        >
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              Virtual Laboratory
            </Badge>
          </motion.div>
          <motion.h1
            className="text-4xl font-extrabold tracking-tight sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Master{" "}
            <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              Software Metrics
            </span>{" "}
            Through{" "}
            <span className="bg-gradient-to-r from-[hsl(var(--accent))] to-amber-600 bg-clip-text text-transparent">
              Experimentation
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto max-w-3xl text-lg text-muted-foreground sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Interactive labs for size, complexity, object-oriented quality, testing, and process
            measurement — with live workbenches for experiments 1, 4, and 5.
          </motion.p>
          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/lab/1">
              <Button size="lg" className="h-12 rounded-full px-8 shadow-lg shadow-primary/20">
                Start Experiment 1 <ArrowRight className="h-5 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-2 px-8"
              onClick={() => document.getElementById("syllabus")?.scrollIntoView({ behavior: "smooth" })}
            >
              <BookText className="h-5 w-5" /> View syllabus
            </Button>
          </motion.div>
          <motion.div
            className="mx-auto grid max-w-4xl grid-cols-2 gap-8 pt-8 md:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            {[
              { value: String(EXPERIMENTS.length), label: "Experiments" },
              {
                value: String(EXPERIMENTS.filter((e) => e.implemented).length).padStart(2, "0"),
                label: "Live now",
              },
              {
                value: String(EXPERIMENTS.filter((e) => !e.implemented).length).padStart(2, "0"),
                label: "Coming soon",
              },
              { value: "Python", label: "Live language" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <Section className="relative bg-primary/10 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 space-y-3 text-center">
            <motion.div variants={itemVariants}>
              <Badge className="border border-primary/20 px-4 py-1.5">
                <Beaker className="mr-2 h-3.5 w-3.5 text-primary" />
                Laboratory modules
              </Badge>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-3xl font-bold sm:text-4xl">
              Hands-on learning
            </motion.h2>
            <motion.p variants={itemVariants} className="mx-auto max-w-2xl text-muted-foreground">
              Ten experiments mapped to the course. Experiments 1, 4, and 5 are live; the rest open a
              Coming Soon page until they are built.
            </motion.p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {EXPERIMENTS.map((exp) => {
              const Icon = ICONS[exp.icon] ?? Beaker;
              const inner = (
                <Card
                  className={cn(
                    "h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl",
                    !exp.implemented && "opacity-70",
                  )}
                >
                  <CardHeader>
                    <div className="mb-3 flex items-start justify-between">
                      <div
                        className={cn(
                          "rounded-xl p-3 transition-transform duration-300 group-hover:scale-110",
                          exp.implemented ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge
                        className={
                          exp.implemented
                            ? "bg-primary px-2 py-0.5 text-xs text-white"
                            : "border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                        }
                      >
                        Lab {exp.id}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-snug">{exp.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{exp.description}</p>
                    <div
                      className={cn(
                        "flex items-center text-sm font-medium transition-transform group-hover:translate-x-1",
                        exp.implemented ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {exp.implemented ? "Start lab" : "Coming soon"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              );

              return (
                <motion.div key={exp.id} variants={itemVariants}>
                  <Link to={`/lab/${exp.id}`} className="group block h-full">
                    {inner}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 space-y-3 text-center">
            <motion.div variants={itemVariants}>
              <Badge className="px-4 py-1.5">
                <Monitor className="mr-2 h-3.5 w-3.5" />
                Interactive features
              </Badge>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-3xl font-bold">
              Learn by doing
            </motion.h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={itemVariants} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="syllabus" className="bg-primary/10 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-10 space-y-3 text-center">
            <motion.div variants={itemVariants}>
              <Badge className="px-4 py-1.5">
                <BookText className="mr-2 h-3.5 w-3.5" />
                Syllabus
              </Badge>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-3xl font-bold">
              Course curriculum
            </motion.h2>
          </div>
          <div className="space-y-4">
            {SYLLABUS.map((unit) => {
              const open = openUnits.includes(unit.unit);
              return (
                <motion.div key={unit.unit} variants={itemVariants}>
                  <Card className={open ? "border-primary shadow-md" : ""}>
                    <button type="button" className="w-full p-6 text-left" onClick={() => toggleUnit(unit.unit)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {unit.unit}
                          </span>
                          <h3 className="text-lg font-semibold">{unit.title}</h3>
                        </div>
                        <ChevronDown
                          className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")}
                        />
                      </div>
                    </button>
                    {open && (
                      <div className="ml-12 px-6 pb-6">
                        <ul className="space-y-3">
                          {unit.topics.map((topic) => (
                            <li key={topic} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div variants={itemVariants} className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold">What you will achieve</h2>
            <p className="text-muted-foreground">Key takeaways from this laboratory course</p>
          </motion.div>
          <div className="grid items-stretch gap-6 sm:grid-cols-2 md:grid-cols-3">
            {OUTCOMES.map((item) => (
              <motion.div key={item.text} variants={itemVariants} className="h-full">
                <Card className="h-full border-border/50">
                  <CardContent className="flex h-full flex-col items-start gap-3 p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </span>
                    <p className="font-medium">{item.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <footer className="border-t border-border bg-background py-12 text-center text-sm text-muted-foreground">
        <div className="mx-auto mb-8 flex max-w-4xl flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-8">
            <SrmOfficialLogo className="h-16 w-auto" />
            <div className="h-12 w-px bg-border" />
            <SrmvlLogo className="h-12 w-auto" />
          </div>
          <p className="font-bold text-foreground">
            SRM Institute of Science and Technology · 21CSC403T Virtual Lab
          </p>
        </div>
        <p>© {new Date().getFullYear()} SRM Institute of Science and Technology. All rights reserved.</p>
      </footer>
    </div>
  );
}
