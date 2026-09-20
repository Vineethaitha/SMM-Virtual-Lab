export interface Experiment {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  implemented: boolean;
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 1,
    slug: "code-metrics",
    title: "Software Code Metrics Analysis",
    description:
      "Compute LOC, cyclomatic complexity, Halstead metrics, and Maintainability Index with Radon. Refactor and compare before vs after.",
    icon: "BarChart3",
    implemented: true,
  },
  {
    id: 2,
    slug: "test-case-management",
    title: "Test Case Management (Kiwi TCMS)",
    description:
      "Create requirements, write test cases, execute them, and measure coverage gaps in a test-management workflow.",
    icon: "ClipboardCheck",
    implemented: true,
  },
  {
    id: 3,
    slug: "size-estimation",
    title: "Software Size Estimation",
    description:
      "Estimate software size using Function Point Analysis (FPA) & COCOMO Basic models, then relate estimates to measured KLOC.",
    icon: "Ruler",
    implemented: true,
  },
  {
    id: 4,
    slug: "customer-satisfaction",
    title: "Customer Satisfaction Metrics",
    description:
      "Design, administer, and analyse customer satisfaction surveys as a software quality metric for popular applications.",
    icon: "Smile",
    implemented: true,
  },
  {
    id: 5,
    slug: "oo-metrics-design",
    title: "Object-Oriented Design Metrics",
    description:
      "Comment on class size, cohesion, coupling, and response set from an object-oriented design.",
    icon: "Boxes",
    implemented: true,
  },
  {
    id: 6,
    slug: "ck-sonar-metrics",
    title: "OO Metrics with CK / SonarCloud",
    description:
      "Capture WMC, DIT, NOC, CBO, RFC, and LCOM (or SonarCloud OO metrics) on a real project and interpret the results.",
    icon: "Network",
    implemented: false,
  },
  {
    id: 7,
    slug: "requirement-ambiguity",
    title: "Requirement Ambiguity Analysis",
    description:
      "Review requirements for ambiguity and incompleteness, then write clarification comments in a structured review table.",
    icon: "FileSearch",
    implemented: false,
  },
  {
    id: 8,
    slug: "maintenance-metrics",
    title: "Software Maintenance Metrics",
    description:
      "Classify corrective, adaptive, perfective, and preventive maintenance work and relate it to maintainability metrics.",
    icon: "Wrench",
    implemented: false,
  },
  {
    id: 9,
    slug: "reliability-metrics",
    title: "Reliability & Defect Density",
    description:
      "Compute defect density, failure rates, and reliability indicators, then discuss what they imply for release quality.",
    icon: "Shield",
    implemented: false,
  },
  {
    id: 10,
    slug: "process-cpi",
    title: "Process Performance (CPI)",
    description:
      "Assess whether a testing process is statistically stable and capable, then propose an improvement plan.",
    icon: "Gauge",
    implemented: false,
  },
];

export function getExperiment(id: number): Experiment | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}
