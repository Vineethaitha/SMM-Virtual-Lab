export type MaintenanceKind = "corrective" | "adaptive" | "perfective" | "preventive";

export interface Exp8Activity {
  id: string;
  text: string;
  kind: MaintenanceKind;
  note: string;
}

export const EXP8_KINDS: { id: MaintenanceKind; label: string; color: string }[] = [
  { id: "corrective", label: "Corrective", color: "bg-rose-100 text-rose-800" },
  { id: "adaptive", label: "Adaptive", color: "bg-amber-100 text-amber-800" },
  { id: "perfective", label: "Perfective", color: "bg-blue-100 text-blue-800" },
  { id: "preventive", label: "Preventive", color: "bg-emerald-100 text-emerald-800" },
];

export const EXP8_ACTIVITIES: Exp8Activity[] = [
  {
    id: "a1",
    text: "Login timeout errors caused by poor session handling were resolved.",
    kind: "corrective",
    note: "A defect already in production is repaired. This is classic corrective maintenance.",
  },
  {
    id: "a2",
    text: "The university’s email provider was upgraded, requiring corresponding code updates.",
    kind: "adaptive",
    note: "The system is changed to keep working in a new external environment.",
  },
  {
    id: "a3",
    text: "A new monthly hostel occupancy dashboard was requested by the Dean’s office.",
    kind: "perfective",
    note: "A new capability is added to improve usefulness for a stakeholder.",
  },
  {
    id: "a4",
    text: "Old modules were refactored and documented to improve ease of maintenance.",
    kind: "preventive",
    note: "Structure and documentation are improved before the next defect wave.",
  },
  {
    id: "a5",
    text: "A security flaw in file uploads was patched immediately.",
    kind: "corrective",
    note: "An existing vulnerability is fixed after it is discovered.",
  },
  {
    id: "a6",
    text: "Performance of the mobile version was optimized, resulting in 40% faster load time.",
    kind: "perfective",
    note: "Existing behaviour is improved for user satisfaction, not to fix a crash.",
  },
  {
    id: "a7",
    text: "Policies for code commenting and documentation were introduced.",
    kind: "preventive",
    note: "Process rules reduce future comprehension cost.",
  },
  {
    id: "a8",
    text: "ID cards were updated to include QR codes as mandated by new government regulations.",
    kind: "adaptive",
    note: "The product is changed because the legal or institutional environment changed.",
  },
  {
    id: "a9",
    text: "Automated testing was incorporated before every release.",
    kind: "preventive",
    note: "Regression tests reduce the chance that later fixes introduce new faults.",
  },
];

export const EXP8_EFFICIENCY_EVIDENCE =
  "Maintenance costs were reduced by 20%, and the backlog of pending issues declined.";

export interface Exp8QuizItem {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}

export const EXP8_QUIZ: Exp8QuizItem[] = [
  {
    id: "q1",
    prompt: "How many SmartServe activities in the sample are corrective maintenance?",
    options: ["1", "2", "3", "4"],
    answer: "2",
    explain: "Login timeout repair and the file-upload security patch are corrective.",
  },
  {
    id: "q2",
    prompt: "Which activity is adaptive because a mandated external rule changed?",
    options: [
      "Mobile load-time optimization",
      "QR codes on ID cards after a government regulation",
      "Refactoring old modules",
      "Adding automated tests",
    ],
    answer: "QR codes on ID cards after a government regulation",
    explain: "Adaptive work keeps the system compliant with a changed environment.",
  },
  {
    id: "q3",
    prompt: "Which pair best demonstrates improved maintainability in the sample?",
    options: [
      "Timeout fix and security patch",
      "Email-provider change and QR-code regulation",
      "Refactoring/documentation and commenting policies",
      "Hostel dashboard and 40% faster mobile load",
    ],
    answer: "Refactoring/documentation and commenting policies",
    explain: "Those activities reduce future change cost rather than adding features or fixing live faults.",
  },
  {
    id: "q4",
    prompt: "A suitable metric for the 40% faster mobile load (perfective) is:",
    options: ["MTTR", "Defect density", "Page-load time (or Apdex)", "Cyclomatic complexity only"],
    answer: "Page-load time (or Apdex)",
    explain: "Perfective impact is measured by the user-visible performance or satisfaction metric that changed.",
  },
  {
    id: "q5",
    prompt: "The 20% cost drop and shrinking backlog are evidence of:",
    options: [
      "Only corrective maintenance",
      "Improved maintenance efficiency",
      "A failed adaptive change",
      "Higher defect injection",
    ],
    answer: "Improved maintenance efficiency",
    explain: "Cost and backlog are efficiency outcomes of maintainability plus preventive work.",
  },
  {
    id: "q6",
    prompt: "Why is MTTR useful for the timeout and upload-security fixes?",
    options: [
      "It measures how long users wait for a new feature",
      "It measures how quickly a discovered fault is restored",
      "It replaces all size metrics",
      "It is only used for process capability (Cpk)",
    ],
    answer: "It measures how quickly a discovered fault is restored",
    explain: "Mean Time to Repair tracks corrective responsiveness.",
  },
];

export const EXP8_CONCLUSION_QUIZ: Exp8QuizItem[] = [
  {
    id: "c1",
    prompt: "In this SmartServe case, which maintenance type should the team prioritize next semester?",
    options: ["Corrective only", "Preventive (with targeted adaptive compliance)", "Ignore adaptive work", "Perfective dashboards only"],
    answer: "Preventive (with targeted adaptive compliance)",
    explain: "Refactoring, tests, and documentation cut future MTTR; adaptive QR/email work still cannot be skipped when rules change.",
  },
  {
    id: "c2",
    prompt: "Why is preventive maintenance often under-prioritized?",
    options: [
      "It has no effect on cost",
      "Its benefits are delayed while corrective work has visible urgency",
      "IEEE forbids it",
      "It always increases MTTR",
    ],
    answer: "Its benefits are delayed while corrective work has visible urgency",
    explain: "Firefighting is visible this sprint; maintainability pay-off shows up later in backlog and cost.",
  },
  {
    id: "c3",
    prompt: "A good maintainability metric for the refactoring/documentation work is:",
    options: ["USL days", "Comment density or change-cycle time / MTTR", "Function points only", "Cpk"],
    answer: "Comment density or change-cycle time / MTTR",
    explain: "Easier change shows up as shorter repair and change cycles, or better documentation coverage.",
  },
  {
    id: "c4",
    prompt: "Delaying the email-provider adaptive change mainly risks:",
    options: ["Higher Halstead volume", "Broken notifications / integration failure", "A better Cpk", "Lower defect density automatically"],
    answer: "Broken notifications / integration failure",
    explain: "Adaptive work keeps the system aligned with the environment; delay can stop a live integration.",
  },
  {
    id: "c5",
    prompt: "Corrective maintenance is performed when:",
    options: [
      "A discovered fault in the delivered system is repaired",
      "A new marketing dashboard is added with no defect",
      "Only comments are added",
      "Cpk is recalculated",
    ],
    answer: "A discovered fault in the delivered system is repaired",
    explain: "Corrective work restores intended behaviour after a defect is found.",
  },
  {
    id: "c6",
    prompt: "Perfective maintenance aims to:",
    options: [
      "Only patch security CVEs",
      "Improve performance, usability, or features without fixing a logged fault",
      "Ignore user requests",
      "Freeze all code forever",
    ],
    answer: "Improve performance, usability, or features without fixing a logged fault",
    explain: "Perfective is enhancement; it is not the same as a production bug fix.",
  },
  {
    id: "c7",
    prompt: "IEEE-style maintenance classification is useful because:",
    options: [
      "It replaces all testing",
      "It separates defect repair, environment change, enhancement, and future-proofing",
      "It is only for function points",
      "It forbids preventive work",
    ],
    answer: "It separates defect repair, environment change, enhancement, and future-proofing",
    explain: "Different types need different metrics (MTTR vs load time vs compliance dates).",
  },
  {
    id: "c8",
    prompt: "A security patch for a file-upload hole is primarily:",
    options: [
      "Only perfective branding",
      "Corrective (a defect/vulnerability already present)",
      "Unrelated to maintenance",
      "A control-chart USL",
    ],
    answer: "Corrective (a defect/vulnerability already present)",
    explain: "The product was already unsafe; the patch repairs existing risk.",
  },
  {
    id: "c9",
    prompt: "Adding automated tests and refactoring old modules is mainly:",
    options: [
      "Only adaptive regulation work",
      "Preventive — reducing future change and repair cost",
      "A Likert survey",
      "Goel–Okumoto fitting",
    ],
    answer: "Preventive — reducing future change and repair cost",
    explain: "You invest now so later defects are cheaper to prevent or find.",
  },
  {
    id: "c10",
    prompt: "If cost dropped 20% and the backlog shrank, a fair claim is:",
    options: [
      "All future work can skip classification",
      "Maintenance efficiency improved; you should still keep classifying new work",
      "Adaptive work is banned",
      "MTTR is meaningless",
    ],
    answer: "Maintenance efficiency improved; you should still keep classifying new work",
    explain: "Outcome metrics support the story but do not retire the four-type taxonomy.",
  },
];

export function countByKind(kinds: MaintenanceKind[]) {
  return EXP8_KINDS.map((k) => ({
    ...k,
    count: kinds.filter((x) => x === k.id).length,
  }));
}
