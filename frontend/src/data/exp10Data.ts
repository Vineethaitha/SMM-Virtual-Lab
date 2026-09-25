export const EXP10_USL = 10;
export const EXP10_LSL = 4;

export const EXP10_BASELINE = [7, 6, 9, 8, 10, 8, 9, 7, 6, 11];
export const EXP10_IMPROVED = [7, 6, 7, 8, 7];

export interface ProcessStats {
  n: number;
  mean: number;
  stdev: number;
  ucl: number;
  lcl: number;
  cp: number;
  cpk: number;
  pointsOutsideSpec: number;
  pointsOutsideControl: number;
  stable: boolean;
  capable: boolean;
}

export function processStats(values: number[], usl = EXP10_USL, lsl = EXP10_LSL): ProcessStats {
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(n - 1, 1);
  const stdev = Math.sqrt(variance);
  const ucl = mean + 3 * stdev;
  const lcl = mean - 3 * stdev;
  const cp = (usl - lsl) / (6 * stdev);
  const cpk = Math.min((usl - mean) / (3 * stdev), (mean - lsl) / (3 * stdev));
  const pointsOutsideSpec = values.filter((v) => v > usl || v < lsl).length;
  const pointsOutsideControl = values.filter((v) => v > ucl || v < lcl).length;
  return {
    n,
    mean,
    stdev,
    ucl,
    lcl,
    cp,
    cpk,
    pointsOutsideSpec,
    pointsOutsideControl,
    stable: pointsOutsideControl === 0,
    capable: cp >= 1 && cpk >= 1,
  };
}

export const EXP10_BEFORE = processStats(EXP10_BASELINE);
export const EXP10_AFTER = processStats(EXP10_IMPROVED);

export interface Exp10QuizItem {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explain: string;
}

export const EXP10_QUIZ: Exp10QuizItem[] = [
  {
    id: "q1",
    prompt: "The mean testing time of the first 10 CodeWave sprints is closest to:",
    options: ["6.0 days", "8.1 days", "10.0 days", "11.0 days"],
    answer: "8.1 days",
    explain: `Mean = (7+6+9+8+10+8+9+7+6+11) / 10 = ${EXP10_BEFORE.mean.toFixed(1)} days.`,
  },
  {
    id: "q2",
    prompt: "Using 3-sigma limits on the first 10 sprints, the process is:",
    options: [
      "Unstable — a point sits above UCL",
      "Stable — every point is inside UCL/LCL",
      "Stable and fully capable (Cpk ≥ 1)",
      "Not computable without LOC",
    ],
    answer: "Stable — every point is inside UCL/LCL",
    explain: `UCL ≈ ${EXP10_BEFORE.ucl.toFixed(2)}, LCL ≈ ${EXP10_BEFORE.lcl.toFixed(2)}. Sprint 10 (11 days) exceeds USL=10 but stays below UCL, so the process is statistically stable.`,
  },
  {
    id: "q3",
    prompt: "Baseline Cpk (USL=10, LSL=4) is closest to:",
    options: ["0.38", "1.00", "1.33", "2.00"],
    answer: "0.38",
    explain: `Cpk = min((USL−μ)/(3σ), (μ−LSL)/(3σ)) ≈ ${EXP10_BEFORE.cpk.toFixed(2)}. The mean sits closer to the upper spec.`,
  },
  {
    id: "q4",
    prompt: "Is the baseline testing process capable of the 4–10 day specification?",
    options: [
      "Yes — Cp and Cpk both exceed 1.33",
      "No — Cp and Cpk are well below 1, and one sprint exceeds USL",
      "Yes — because the process is stable",
      "Only if MTTR is used instead of days",
    ],
    answer: "No — Cp and Cpk are well below 1, and one sprint exceeds USL",
    explain: `Cp ≈ ${EXP10_BEFORE.cp.toFixed(2)} and Cpk ≈ ${EXP10_BEFORE.cpk.toFixed(2)}. Stability does not imply capability.`,
  },
  {
    id: "q5",
    prompt: "After the five improved sprints (7, 6, 7, 8, 7), capability:",
    options: [
      "Gets worse (Cpk falls)",
      "Improves and the process is now capable and more centered",
      "Cannot be judged",
      "Is identical to the baseline",
    ],
    answer: "Improves and the process is now capable and more centered",
    explain: `Post-improvement mean = ${EXP10_AFTER.mean.toFixed(1)}, Cp ≈ ${EXP10_AFTER.cp.toFixed(2)}, Cpk ≈ ${EXP10_AFTER.cpk.toFixed(2)}.`,
  },
  {
    id: "q6",
    prompt: "A suitable improvement wrapper for this case is Deming’s PDCA. The Act step should:",
    options: [
      "Skip measurement and add more testers only",
      "Standardize the changes that reduced variation, then plan the next cycle",
      "Compute Halstead volume",
      "Remove specification limits",
    ],
    answer: "Standardize the changes that reduced variation, then plan the next cycle",
    explain: "PDCA: Plan the bottleneck, Do a controlled change, Check Cp/Cpk and the chart, Act by locking in what worked.",
  },
];

export const EXP10_CONCLUSION_QUIZ: Exp10QuizItem[] = [
  {
    id: "c1",
    prompt: "In the SEI IDEAL model, Diagnosing for this case means:",
    options: [
      "Skipping the control chart",
      "Using mean, σ, Cp, and Cpk to name the bottleneck (late, off-centre testing)",
      "Adding features to the bank app",
      "Deleting specification limits",
    ],
    answer: "Using mean, σ, Cp, and Cpk to name the bottleneck (late, off-centre testing)",
    explain: "Diagnosing is the measurement step before Establishing an improvement plan.",
  },
  {
    id: "c2",
    prompt: "A process that is stable but not capable should first:",
    options: [
      "Be declared mature and left unchanged",
      "Reduce variation and/or shift the mean toward the spec midpoint, then re-check Cpk",
      "Increase USL until Cpk looks good on paper only",
      "Switch to Halstead effort",
    ],
    answer: "Reduce variation and/or shift the mean toward the spec midpoint, then re-check Cpk",
    explain: "Control-chart stability is necessary but not sufficient; capability needs the spec window.",
  },
  {
    id: "c3",
    prompt: "Industry often treats a process as capable when:",
    options: ["Cpk ≥ 1 (1.33 is a common target)", "Any one sprint is below USL", "UCL equals USL", "n = 2"],
    answer: "Cpk ≥ 1 (1.33 is a common target)",
    explain: "Cpk ≥ 1 is the usual bare threshold; many programs ask for 1.33.",
  },
  {
    id: "c4",
    prompt: "The Check step of PDCA in this lab is:",
    options: [
      "Recalculating mean, σ, Cp, and Cpk on sprints 11–15",
      "Writing Python in the editor",
      "Counting function points",
      "Skipping measurement",
    ],
    answer: "Recalculating mean, σ, Cp, and Cpk on sprints 11–15",
    explain: "Check is the re-measure after Do.",
  },
  {
    id: "c5",
    prompt: "Cp measures:",
    options: [
      "Potential capability from specification width versus process spread (ignoring centering)",
      "Only the sample mean",
      "Halstead effort",
      "Function-point VAF",
    ],
    answer: "Potential capability from specification width versus process spread (ignoring centering)",
    explain: "Cp = (USL − LSL) / (6σ). Cpk also penalizes off-centre means.",
  },
  {
    id: "c6",
    prompt: "Cpk is smaller than Cp when:",
    options: [
      "The mean is off the specification midpoint",
      "σ is exactly zero",
      "n is larger than 1000 always",
      "USL equals LSL",
    ],
    answer: "The mean is off the specification midpoint",
    explain: "Cpk uses the nearer spec limit; shift reduces the index.",
  },
  {
    id: "c7",
    prompt: "A point outside ±3σ control limits on an I-chart suggests:",
    options: [
      "Possible special-cause variation; do not treat the process as stable yet",
      "Automatic Cpk ≥ 1.33",
      "That USL should be deleted",
      "That PDCA is finished",
    ],
    answer: "Possible special-cause variation; do not treat the process as stable yet",
    explain: "Capability studies assume statistical control first.",
  },
  {
    id: "c8",
    prompt: "Raising USL only so Cpk looks better is:",
    options: [
      "A paper improvement that does not make testing faster",
      "The Check step of PDCA",
      "Required by IDEAL Diagnosing",
      "The same as reducing σ",
    ],
    answer: "A paper improvement that does not make testing faster",
    explain: "Spec limits come from the customer/plan, not from hiding lateness.",
  },
  {
    id: "c9",
    prompt: "In IDEAL, Establishing comes after Diagnosing so that:",
    options: [
      "The improvement plan targets the measured bottleneck",
      "You skip all metrics",
      "You only write Python",
      "You compute UFP",
    ],
    answer: "The improvement plan targets the measured bottleneck",
    explain: "Diagnose with data, then set a plan, then Act/Do.",
  },
  {
    id: "c10",
    prompt: "After an improvement cycle, you should:",
    options: [
      "Re-plot control limits and recompute Cp/Cpk on the new sprints",
      "Assume maturity without new data",
      "Delete the old mean",
      "Switch the lab to Halstead only",
    ],
    answer: "Re-plot control limits and recompute Cp/Cpk on the new sprints",
    explain: "Check/Act closes the loop with fresh measurements.",
  },
];
