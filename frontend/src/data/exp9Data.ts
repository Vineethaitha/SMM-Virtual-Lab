export interface Exp9Week {
  week: number;
  defects: number;
}

export const EXP9_MODULE = {
  name: "Payment Gateway",
  kloc: 12.4,
  operationalHours: 2000,
  failures: 14,
};

export const EXP9_WEEKS: Exp9Week[] = [
  { week: 1, defects: 8 },
  { week: 2, defects: 6 },
  { week: 3, defects: 5 },
  { week: 4, defects: 4 },
  { week: 5, defects: 4 },
  { week: 6, defects: 3 },
  { week: 7, defects: 2 },
  { week: 8, defects: 2 },
  { week: 9, defects: 1 },
  { week: 10, defects: 1 },
];

export function exp9Metrics() {
  const totalDefects = EXP9_WEEKS.reduce((s, w) => s + w.defects, 0);
  const density = totalDefects / EXP9_MODULE.kloc;
  const lambda = EXP9_MODULE.failures / EXP9_MODULE.operationalHours;
  const r100 = Math.exp(-lambda * 100);
  const firstHalf = EXP9_WEEKS.slice(0, 5).reduce((s, w) => s + w.defects, 0);
  const secondHalf = EXP9_WEEKS.slice(5).reduce((s, w) => s + w.defects, 0);
  return {
    totalDefects,
    density,
    lambda,
    r100,
    firstHalf,
    secondHalf,
    declining: secondHalf < firstHalf,
  };
}

export const EXP9_METRICS = exp9Metrics();

export interface Exp9QuizItem {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}

const d = EXP9_METRICS;

export const EXP9_QUIZ: Exp9QuizItem[] = [
  {
    id: "q1",
    prompt: "What is the total number of defects recorded across the 10 sample weeks?",
    options: ["28", "32", "36", "40"],
    answer: String(d.totalDefects),
    explain: `Sum of weekly arrivals = ${d.totalDefects}.`,
  },
  {
    id: "q2",
    prompt: "Defect density for the 12.4 KLOC Payment Gateway module is closest to:",
    options: ["1.2 defects/KLOC", "2.9 defects/KLOC", "4.5 defects/KLOC", "14 defects/KLOC"],
    answer: "2.9 defects/KLOC",
    explain: `Density = ${d.totalDefects} / 12.4 ≈ ${d.density.toFixed(2)} defects/KLOC.`,
  },
  {
    id: "q3",
    prompt: "With 14 failures in 2000 operational hours, the constant failure rate λ is:",
    options: ["0.007 /hour", "0.07 /hour", "14 /hour", "2000 /hour"],
    answer: "0.007 /hour",
    explain: "λ = failures / hours = 14 / 2000 = 0.007 per hour.",
  },
  {
    id: "q4",
    prompt: "Under an exponential reliability model, R(100) = e^(−λ·100) is closest to:",
    options: ["0.25", "0.50", "0.75", "0.99"],
    answer: "0.50",
    explain: `e^(−0.7) ≈ ${d.r100.toFixed(2)}. About half the units are expected to survive 100 hours at this λ.`,
  },
  {
    id: "q5",
    prompt: "The weekly defect-arrival pattern in the sample is best described as:",
    options: [
      "A rising Rayleigh growth curve",
      "A declining arrival curve after early testing",
      "A flat arrival rate every week",
      "Zero defects after week 3",
    ],
    answer: "A declining arrival curve after early testing",
    explain: `Weeks 1–5 found ${d.firstHalf} defects; weeks 6–10 found ${d.secondHalf}. That resembles late-test reliability growth, not a rising Rayleigh peak.`,
  },
  {
    id: "q6",
    prompt: "Jelinski–Moranda models reliability growth by assuming:",
    options: [
      "Failure intensity stays constant forever",
      "Each removed fault reduces remaining fault content",
      "Only lines of code predict failures",
      "Cpk must exceed 1.33",
    ],
    answer: "Each removed fault reduces remaining fault content",
    explain: "JM treats the program as having a finite fault count N; intensity falls as faults are corrected.",
  },
];

export const EXP9_CONCLUSION_QUIZ: Exp9QuizItem[] = [
  {
    id: "c1",
    prompt: "Given R(100) ≈ 0.50 and a falling arrival curve, a responsible release comment is:",
    options: [
      "Ship as defect-free; λ cannot fall further",
      "Quality is improving but a 100-hour mission is still risky until λ keeps dropping",
      "Ignore density because KLOC is unused",
      "The Rayleigh peak has not started, so stop testing",
    ],
    answer: "Quality is improving but a 100-hour mission is still risky until λ keeps dropping",
    explain: "Declining arrivals are good news; R(100) near one-half is not a high-confidence go-live.",
  },
  {
    id: "c2",
    prompt: "Musa–Okumoto differs from a constant-λ exponential model because it assumes:",
    options: [
      "Failure intensity decreases logarithmically as failures are experienced",
      "Every week has the same defect count",
      "Only Cpk is required",
      "Faults are never removed",
    ],
    answer: "Failure intensity decreases logarithmically as failures are experienced",
    explain: "Musa–Okumoto is a logarithmic Poisson growth model; intensity falls as testing exposes faults.",
  },
  {
    id: "c3",
    prompt: "Goel–Okumoto is best described as:",
    options: [
      "A control-chart Cpk test",
      "An NHPP whose mean value function grows toward a finite total",
      "A function-point count",
      "A survey Likert average",
    ],
    answer: "An NHPP whose mean value function grows toward a finite total",
    explain: "GO is a non-homogeneous Poisson process with exponentially decaying intensity.",
  },
  {
    id: "c4",
    prompt: "Defect density is useful at release time because it:",
    options: [
      "Replaces all reliability models",
      "Normalizes remaining/found faults by size so modules can be compared",
      "Is identical to λ",
      "Must always be below Cpk",
    ],
    answer: "Normalizes remaining/found faults by size so modules can be compared",
    explain: "Density = defects / KLOC. A large module can hide a high raw count.",
  },
  {
    id: "c5",
    prompt: "Reliability R(t) near 0.50 at a 100-hour mission means:",
    options: [
      "About even odds of surviving that mission under the model",
      "Zero remaining faults",
      "Cpk is automatically 1.33",
      "Testing can stop immediately",
    ],
    answer: "About even odds of surviving that mission under the model",
    explain: "R(t) is a probability, not a certificate of defect-free software.",
  },
  {
    id: "c6",
    prompt: "If weekly failure arrivals are still rising, a Rayleigh-style curve suggests:",
    options: [
      "You may still be before the peak; more testing is expected to find faults",
      "The product is ready for unlimited warranty",
      "λ must already be zero",
      "Only function points matter",
    ],
    answer: "You may still be before the peak; more testing is expected to find faults",
    explain: "A rising arrival rate is not evidence that discovery is finished.",
  },
  {
    id: "c7",
    prompt: "Failure intensity λ is:",
    options: [
      "The instantaneous rate at which failures are expected",
      "The same as defect density always",
      "A Likert average",
      "Unused in Musa–Okumoto",
    ],
    answer: "The instantaneous rate at which failures are expected",
    explain: "Models describe how λ changes as testing time or failures accumulate.",
  },
  {
    id: "c8",
    prompt: "A constant-λ exponential reliability model assumes:",
    options: [
      "Intensity does not improve as faults are removed",
      "Every module has the same KLOC",
      "Only Cpk is plotted",
      "Arrivals follow a survey scale",
    ],
    answer: "Intensity does not improve as faults are removed",
    explain: "That is why growth models (GO, Musa–Okumoto) are preferred during active debugging.",
  },
  {
    id: "c9",
    prompt: "Using KLOC with defect counts lets you:",
    options: [
      "Compare modules of different size fairly",
      "Prove R(t) = 1",
      "Skip the arrival chart",
      "Replace all reviews",
    ],
    answer: "Compare modules of different size fairly",
    explain: "Raw counts favour large files; density normalizes them.",
  },
  {
    id: "c10",
    prompt: "A responsible go-live argument combines:",
    options: [
      "Falling arrivals, acceptable R(t) for the mission, and density that meets the bar",
      "A single green sprint and no model",
      "Only the quiz score",
      "Increasing λ and ignoring density",
    ],
    answer: "Falling arrivals, acceptable R(t) for the mission, and density that meets the bar",
    explain: "No single chart is enough; trend, mission reliability, and size-normalized defects together.",
  },
];
