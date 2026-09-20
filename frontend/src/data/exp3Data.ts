export interface FPComponentItem {
  id: string;
  project_id: string;
  name: string;
  type: "EI" | "EO" | "EQ" | "ILF" | "EIF";
  complexity: "low" | "average" | "high";
}

export interface GSCRatingItem {
  id: string;
  project_id: string;
  characteristic_name: string;
  rating: number; // 0..5
}

export interface SizeProjectItem {
  id: string;
  name: string;
  description: string;
  project_type: "organic" | "semi_detached" | "embedded";
  language: string;
  created_at: string;
}

export interface SizeStudentInfoItem {
  name: string;
  registration_number: string;
}

export interface CocomoResultItem {
  effort_pm: number;
  time_months: number;
  avg_team_size: number;
}

export interface SizeMetricsResultItem {
  project_id: string;
  total_components: number;
  ufp: number;
  tdi: number;
  vaf: number;
  afp: number;
  loc_per_fp: number;
  kloc: number;
  cocomo: CocomoResultItem;
  size_category: string;
  consistency_note: string;
}

export interface ComplianceRuleResultItem {
  passed: boolean;
  detail: string;
  failing_ids: string[];
}

export interface SizeComplianceResponseItem {
  component_coverage: ComplianceRuleResultItem;
  complexity_assigned: ComplianceRuleResultItem;
  gsc_completeness: ComplianceRuleResultItem;
  project_type_missing: ComplianceRuleResultItem;
  language_missing: ComplianceRuleResultItem;
  quality_score: number;
}

export interface SizeSnapshotItem {
  id: string;
  project_id: string;
  label: string;
  ufp: number;
  vaf: number;
  afp: number;
  kloc: number;
  effort_pm: number;
  time_months: number;
  avg_team_size: number;
  created_at: string;
}

export interface SizeQuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
}

// --- CONSTANTS ---

export const GSC_LIST = [
  { id: "gsc1", name: "Data Communications", desc: "How much data transfer/communication occurs with remote systems?" },
  { id: "gsc2", name: "Distributed Data Processing", desc: "Are data processing functions distributed across multiple CPUs/nodes?" },
  { id: "gsc3", name: "Performance Objectives", desc: "Response time and throughput requirements critical to the system?" },
  { id: "gsc4", name: "Heavily Used Configuration", desc: "Is the hardware/execution environment heavily loaded or constrained?" },
  { id: "gsc5", name: "Transaction Rate", desc: "Are high volume daily or peak transaction rates expected?" },
  { id: "gsc6", name: "Online Data Entry", desc: "What percentage of data is entered interactively online?" },
  { id: "gsc7", name: "End-User Efficiency", desc: "Human factors & user usability features built into the interface?" },
  { id: "gsc8", name: "Online Update", desc: "Are internal logical files updated interactively in real time?" },
  { id: "gsc9", name: "Complex Processing", desc: "Mathematical/algorithmic processing, security, or heavy logic present?" },
  { id: "gsc10", name: "Reusability", desc: "Code designed, developed, and maintained for reuse in other apps?" },
  { id: "gsc11", name: "Installation Ease", desc: "Is conversion, migration, and installation automation required?" },
  { id: "gsc12", name: "Operational Ease", desc: "Automated backup, recovery, and minimal operator intervention needed?" },
  { id: "gsc13", name: "Multiple Sites", desc: "Will the software operate at multiple distinct target organizations/sites?" },
  { id: "gsc14", name: "Facilitate Change", desc: "Designed for flexible customization, user queries, or easy maintenance?" },
];

export const IFPUG_WEIGHTS: Record<string, Record<string, number>> = {
  EI:  { low: 3, average: 4, high: 6 },
  EO:  { low: 4, average: 5, high: 7 },
  EQ:  { low: 3, average: 4, high: 6 },
  ILF: { low: 7, average: 10, high: 15 },
  EIF: { low: 5, average: 7, high: 10 },
};

export const LOC_PER_FP: Record<string, number> = {
  Assembly: 320,
  C: 128,
  COBOL: 106,
  "C++": 53,
  Java: 53,
  JavaScript: 47,
  Python: 42,
  "Visual Basic": 32,
};

export const COCOMO_CONSTANTS: Record<string, { a: number; b: number; c: number; d: number }> = {
  organic:       { a: 2.4, b: 1.05, c: 2.5, d: 0.38 },
  semi_detached: { a: 3.0, b: 1.12, c: 2.5, d: 0.35 },
  embedded:      { a: 3.6, b: 1.20, c: 2.5, d: 0.32 },
};

export const IMPROVEMENT_MAP: Record<string, string> = {
  component_coverage: "You haven't added any Function Point components yet. Go to the Function Point Counter and list every screen, report, and data store in your project.",
  complexity_assigned: "Some components are missing a complexity rating. Every EI/EO/EQ/ILF/EIF needs Low, Average, or High assigned.",
  gsc_completeness: "Not all 14 General System Characteristics have been rated. Go to the GSC panel and rate each one 0–5.",
  project_type_missing: "Select a COCOMO project type (organic, semi-detached, or embedded) before viewing Effort/Time.",
  language_missing: "Select an implementation language so AFP can be converted to KLOC.",
  fp_components_topic: "Revisit Theory > Function Point components table — review the difference between EI, EO, EQ, ILF, and EIF.",
  ufp_formula_topic: "Revisit Theory > UFP formula — UFP is calculated as the sum of (count × complexity weight) for each component.",
  vaf_formula_topic: "Revisit Theory > VAF formula — remember VAF = 0.65 + 0.01 × TDI.",
  vaf_range_topic: "Revisit Theory > VAF range — VAF always falls within the range 0.65 to 1.35.",
  loc_conversion_topic: "Revisit Theory > LOC Conversion — higher-level languages require fewer lines of code per function point.",
  cocomo_types_topic: "Revisit Theory > COCOMO project types — review when to pick organic vs semi-detached vs embedded.",
  cocomo_formula_topic: "Revisit Theory > COCOMO formulas — Effort = a × (KLOC)^b.",
  cocomo_output_topic: "Revisit Theory > Team Size formula — Average Team Size = Effort / Time.",
  purpose_topic: "Revisit Theory — Function Point Analysis enables size estimation before code is written.",
};

// --- STATIC QUIZ BANK ---

export const QUIZ_BANK: SizeQuizQuestionItem[] = [
  {
    id: "q1",
    question: "What is the primary advantage of Function Point Analysis over Lines of Code (LOC) for size estimation?",
    options: [
      "FPA can be performed early in the lifecycle before any code is written",
      "FPA produces larger numbers than LOC, making estimates sound more accurate",
      "FPA only applies to object-oriented programming languages like Java and C++",
      "FPA automates test case generation directly from requirements"
    ],
    answer: "FPA can be performed early in the lifecycle before any code is written",
    explanation: "FPA measures software size based on user-facing functional requirements (inputs, outputs, files) rather than implementation code, making it technology-independent and usable during early requirements phase.",
    topic: "purpose"
  },
  {
    id: "q2",
    question: "Which component type represents data maintained inside the boundary of the system being estimated?",
    options: [
      "External Interface File (EIF)",
      "Internal Logical File (ILF)",
      "External Input (EI)",
      "External Inquiry (EQ)"
    ],
    answer: "Internal Logical File (ILF)",
    explanation: "Internal Logical Files (ILF) are user-identifiable groups of logically related data maintained inside the application boundary.",
    topic: "fp_components"
  },
  {
    id: "q3",
    question: "If an External Output (EO) has 'Average' complexity, what is its standard IFPUG function point weight?",
    options: [
      "3",
      "4",
      "5",
      "7"
    ],
    answer: "5",
    explanation: "According to IFPUG guidelines, EO complexity weights are Low=4, Average=5, High=7.",
    topic: "ufp_formula"
  },
  {
    id: "q4",
    question: "What is the formula for Value Adjustment Factor (VAF) in Function Point Analysis?",
    options: [
      "VAF = 0.65 + 0.01 × sum(GSC_i)",
      "VAF = 1.0 + 0.05 × sum(GSC_i)",
      "VAF = sum(GSC_i) / 14",
      "VAF = 0.65 × UFP + 0.35"
    ],
    answer: "VAF = 0.65 + 0.01 × sum(GSC_i)",
    explanation: "VAF = 0.65 + 0.01 × Total Degree of Influence (TDI), where TDI is the sum of all 14 General System Characteristics (rated 0 to 5).",
    topic: "vaf_formula"
  },
  {
    id: "q5",
    question: "What are the minimum and maximum possible values for the Value Adjustment Factor (VAF)?",
    options: [
      "0.00 to 1.00",
      "0.65 to 1.35",
      "0.50 to 1.50",
      "1.00 to 2.00"
    ],
    answer: "0.65 to 1.35",
    explanation: "When all 14 GSCs are rated 0, TDI=0 => VAF=0.65. When all 14 GSCs are rated 5, TDI=70 => VAF=0.65 + 0.70 = 1.35.",
    topic: "vaf_range"
  },
  {
    id: "q6",
    question: "Why does Python require fewer Lines of Code per Function Point (~42 LOC/FP) compared to C (~128 LOC/FP)?",
    options: [
      "Python programs run faster than C programs",
      "Python is a higher-level language with richer built-in abstractions and libraries",
      "Python compilers optimize code size automatically during build",
      "Function point weights are adjusted dynamically based on language"
    ],
    answer: "Python is a higher-level language with richer built-in abstractions and libraries",
    explanation: "Higher-level expressive languages provide concise constructs, reducing the raw lines of code required to deliver 1 Function Point of capability.",
    topic: "loc_conversion"
  },
  {
    id: "q7",
    question: "In COCOMO Basic, which project type is best suited for small, simple software projects developed by experienced in-house teams with loose requirements?",
    options: [
      "Embedded",
      "Semi-Detached",
      "Organic",
      "Real-Time Flight Control"
    ],
    answer: "Organic",
    explanation: "Organic mode represents small, straightforward projects with small teams working in familiar, relaxed environments.",
    topic: "cocomo_types"
  },
  {
    id: "q8",
    question: "In COCOMO Basic Organic mode (Effort = 2.4 × KLOC^1.05), if KLOC = 10, what is the estimated Effort in Person-Months?",
    options: [
      "10.0 PM",
      "24.0 PM",
      "26.9 PM",
      "45.2 PM"
    ],
    answer: "26.9 PM",
    explanation: "Effort = 2.4 × (10^1.05) = 2.4 × 11.22 = ~26.9 Person-Months.",
    topic: "cocomo_formula"
  },
  {
    id: "q9",
    question: "How is Average Team Size calculated from COCOMO outputs?",
    options: [
      "Team Size = Effort (PM) × Development Time (Months)",
      "Team Size = Effort (PM) / Development Time (Months)",
      "Team Size = KLOC / Development Time (Months)",
      "Team Size = Total FP / 14 GSCs"
    ],
    answer: "Team Size = Effort (PM) / Development Time (Months)",
    explanation: "Average Team Size = Effort (person-months) divided by Development Time (calendar months).",
    topic: "cocomo_output"
  },
  {
    id: "q10",
    question: "What is Adjusted Function Points (AFP) when UFP = 120 and VAF = 1.10?",
    options: [
      "109.1 FP",
      "120.0 FP",
      "132.0 FP",
      "150.5 FP"
    ],
    answer: "132.0 FP",
    explanation: "AFP = UFP × VAF = 120 × 1.10 = 132.0 Function Points.",
    topic: "ufp_formula"
  }
];

// --- CLIENT-SIDE CALCULATION FUNCTIONS ---

export function calcUFP(components: FPComponentItem[]): number {
  let ufp = 0;
  for (const c of components) {
    const typeWeights = IFPUG_WEIGHTS[c.type] || { low: 3, average: 4, high: 6 };
    const cmplx = (c.complexity || "average").toLowerCase();
    ufp += typeWeights[cmplx] || 4;
  }
  return ufp;
}

export function calcVAF(gscRatings: GSCRatingItem[]): { tdi: number; vaf: number } {
  const tdi = gscRatings.reduce((sum, r) => sum + r.rating, 0);
  const vaf = Math.round((0.65 + 0.01 * tdi) * 1000) / 1000;
  return { tdi, vaf };
}

export function calcAFP(ufp: number, vaf: number): number {
  return Math.round(ufp * vaf * 100) / 100;
}

export function calcKLOC(afp: number, language: string): number {
  const ratio = LOC_PER_FP[language] || 42;
  return Math.round(((afp * ratio) / 1000.0) * 1000) / 1000;
}

export function calcCOCOMO(kloc: number, projectType: string): CocomoResultItem {
  const k = COCOMO_CONSTANTS[projectType] || COCOMO_CONSTANTS["organic"];
  if (kloc <= 0) {
    return { effort_pm: 0, time_months: 0, avg_team_size: 0 };
  }
  const effort = Math.round(k.a * Math.pow(kloc, k.b) * 100) / 100;
  const time = Math.round(k.c * Math.pow(effort, k.d) * 100) / 100;
  const people = time > 0 ? Math.round((effort / time) * 100) / 100 : 0;
  return { effort_pm: effort, time_months: time, avg_team_size: people };
}

export function calcMetrics(
  project: SizeProjectItem,
  components: FPComponentItem[],
  gscRatings: GSCRatingItem[]
): SizeMetricsResultItem {
  const ufp = calcUFP(components);
  const { tdi, vaf } = calcVAF(gscRatings);
  const afp = calcAFP(ufp, vaf);
  const kloc = calcKLOC(afp, project.language);
  const cocomo = calcCOCOMO(kloc, project.project_type);

  let size_category = "Very Small";
  if (kloc < 2.0) size_category = "Very Small";
  else if (kloc < 10.0) size_category = "Small";
  else if (kloc < 50.0) size_category = "Medium";
  else if (kloc < 300.0) size_category = "Large";
  else size_category = "Very Large";

  let note = "Your chosen project type is consistent with the estimated size.";
  if (project.project_type === "organic" && kloc > 50.0) {
    note = "Your project size suggests 'semi-detached' or 'embedded' may fit better than 'organic'.";
  } else if (project.project_type === "embedded" && kloc < 50.0) {
    note = "Your project size suggests 'organic' or 'semi-detached' may fit better than 'embedded'.";
  }

  return {
    project_id: project.id,
    total_components: components.length,
    ufp,
    tdi,
    vaf,
    afp,
    loc_per_fp: LOC_PER_FP[project.language] || 42,
    kloc,
    cocomo,
    size_category,
    consistency_note: note,
  };
}

export function calcCompliance(
  project: SizeProjectItem | null,
  components: FPComponentItem[],
  gscRatings: GSCRatingItem[]
): SizeComplianceResponseItem {
  const hasComponents = components.length > 0;

  const ruleComp: ComplianceRuleResultItem = {
    passed: hasComponents,
    detail: `${components.length} component(s) added`,
    failing_ids: hasComponents ? [] : ["no_components"],
  };

  const missingCmplx = components.filter((c) => !c.complexity);
  const hasComplexity = hasComponents && missingCmplx.length === 0;
  const ruleCmplx: ComplianceRuleResultItem = {
    passed: hasComplexity,
    detail: hasComponents
      ? `${missingCmplx.length} component(s) missing complexity`
      : "No components added yet to evaluate complexity",
    failing_ids: hasComponents ? missingCmplx.map((c) => c.name) : ["no_components"],
  };

  const ratedCount = gscRatings.filter((r) => r.rating > 0).length;
  const hasGsc = gscRatings.length === 14 && ratedCount > 0;
  const ruleGsc: ComplianceRuleResultItem = {
    passed: hasGsc,
    detail: `${ratedCount}/14 General System Characteristics rated`,
    failing_ids: hasGsc ? [] : ["incomplete_gsc"],
  };

  const hasType = Boolean(project?.project_type);
  const ruleType: ComplianceRuleResultItem = {
    passed: hasType,
    detail: hasType ? `Project type selected (${project?.project_type})` : "No project type selected",
    failing_ids: hasType ? [] : ["no_project_type"],
  };

  const hasLang = Boolean(project?.language);
  const ruleLang: ComplianceRuleResultItem = {
    passed: hasLang,
    detail: hasLang ? `Language selected (${project?.language})` : "No language selected",
    failing_ids: hasLang ? [] : ["no_language"],
  };

  const rules = [ruleComp, ruleCmplx, ruleGsc, ruleType, ruleLang];
  const passedCount = rules.filter((r) => r.passed).length;
  const qualityScore = Math.round((passedCount / rules.length) * 1000) / 10;

  return {
    component_coverage: ruleComp,
    complexity_assigned: ruleCmplx,
    gsc_completeness: ruleGsc,
    project_type_missing: ruleType,
    language_missing: ruleLang,
    quality_score: qualityScore,
  };
}
