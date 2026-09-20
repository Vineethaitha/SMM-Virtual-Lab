import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "@/lib/types";
import type { compareAnalyses } from "@/lib/compare";
import type { Exp4Factor, Exp4QuizQuestion, Exp4Response } from "@/data/exp4Data";
import type { Exp5ClassMetrics, Exp5QuizQuestion, Exp5Strategy } from "@/data/exp5Data";
import type { Exp2MetricsResult, Exp2Project, Exp2QuizQuestion, Exp2Requirement, Exp2TestCase } from "@/data/exp2Data";

type Rows = ReturnType<typeof compareAnalyses>;

const PRIMARY: [number, number, number] = [37, 99, 235];
const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [214, 222, 234];

export function ascii(input: string | number | null | undefined): string {
  if (input == null) return "";
  const subs = "₀₁₂₃₄₅₆₇₈₉";
  return String(input)
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d) => String(subs.indexOf(d)))
    .replace(/η/g, "eta")
    .replace(/[μµ]/g, "u")
    .replace(/[·•]/g, "-")
    .replace(/→/g, "->")
    .replace(/≈/g, "~")
    .replace(/×/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[^\x00-\xFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fmt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "-";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

interface LoadedImage {
  data: string;
  w: number;
  h: number;
  fmt: "PNG" | "JPEG";
}

async function loadScaled(url: string, targetH: number): Promise<LoadedImage | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const ratio = img.naturalWidth / img.naturalHeight || 1;
    const w = targetH * ratio;
    const scale = 3;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(targetH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const isJpg = /\.jpe?g$/i.test(url);
    if (isJpg) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      data: canvas.toDataURL(isJpg ? "image/jpeg" : "image/png"),
      w,
      h: targetH,
      fmt: isJpg ? "JPEG" : "PNG",
    };
  } catch {
    return null;
  }
}

class LabPdf {
  doc: jsPDF;
  pageW: number;
  pageH: number;
  margin = 48;
  contentW: number;
  footerY: number;
  y: number;

  constructor() {
    this.doc = new jsPDF({ unit: "pt", format: "a4" });
    this.pageW = this.doc.internal.pageSize.getWidth();
    this.pageH = this.doc.internal.pageSize.getHeight();
    this.contentW = this.pageW - this.margin * 2;
    this.footerY = this.pageH - 30;
    this.y = this.margin;
  }

  ensureSpace(needed: number) {
    if (this.y + needed > this.footerY - 12) {
      this.doc.addPage();
      this.y = this.margin;
    }
  }

  heading(text: string) {
    this.ensureSpace(40);
    this.doc.setFillColor(...PRIMARY);
    this.doc.rect(this.margin, this.y - 10, 3.5, 15, "F");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(12);
    this.doc.setTextColor(...INK);
    this.doc.text(ascii(text), this.margin + 11, this.y + 2);
    this.y += 20;
  }

  field(label: string, value: string) {
    const val = ascii(value) || "-";
    this.doc.setFontSize(9.5);
    const labelText = `${label}:  `;
    this.doc.setFont("helvetica", "bold");
    const offset = this.doc.getTextWidth(labelText);
    const lines = this.doc.splitTextToSize(val, this.contentW - offset);
    lines.forEach((line: string, i: number) => {
      this.ensureSpace(14);
      if (i === 0) {
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...INK);
        this.doc.text(labelText, this.margin, this.y);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(...MUTED);
      }
      this.doc.text(line, this.margin + offset, this.y);
      this.y += 14;
    });
    this.y += 3;
  }

  body(text: string) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...MUTED);
    const lines = this.doc.splitTextToSize(ascii(text) || "-", this.contentW);
    lines.forEach((line: string) => {
      this.ensureSpace(14);
      this.doc.text(line, this.margin, this.y);
      this.y += 14;
    });
    this.y += 3;
  }

  bullet(title: string, detail: string) {
    this.ensureSpace(28);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...INK);
    const tLines = this.doc.splitTextToSize(ascii(title), this.contentW - 12);
    tLines.forEach((line: string, i: number) => {
      this.ensureSpace(13);
      if (i === 0) {
        this.doc.setFillColor(...PRIMARY);
        this.doc.circle(this.margin + 2, this.y - 3, 1.6, "F");
      }
      this.doc.text(line, this.margin + 12, this.y);
      this.y += 13;
    });
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...MUTED);
    const dLines = this.doc.splitTextToSize(ascii(detail), this.contentW - 12);
    dLines.forEach((line: string) => {
      this.ensureSpace(13);
      this.doc.text(line, this.margin + 12, this.y);
      this.y += 13;
    });
    this.y += 5;
  }

  table(head: string[], body: string[][], centerFrom = 1) {
    this.ensureSpace(70);
    const columnStyles: Record<number, { halign: "center" | "left" }> = {};
    for (let i = centerFrom; i < head.length; i += 1) columnStyles[i] = { halign: "center" };
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: this.margin, right: this.margin },
      head: [head],
      body,
      styles: { fontSize: 9, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 253] },
      columnStyles,
    });
    this.y = (this.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  }

  async header(title: string, subtitle: string) {
    const base = import.meta.env.BASE_URL ?? "/";
    const [official, srmvl] = await Promise.all([
      loadScaled(`${base}srm-official-logo.jpg`, 40),
      loadScaled(`${base}srmvl-logo.png`, 26),
    ]);
    if (official) this.doc.addImage(official.data, official.fmt, this.margin, this.y, official.w, official.h);
    if (srmvl) {
      this.doc.addImage(srmvl.data, srmvl.fmt, this.pageW - this.margin - srmvl.w, this.y + 6, srmvl.w, srmvl.h);
    }
    this.y += 46;
    this.doc.setDrawColor(...PRIMARY);
    this.doc.setLineWidth(1.4);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);
    this.y += 22;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    this.doc.setTextColor(...INK);
    this.doc.text(ascii(title), this.margin, this.y);
    this.y += 16;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...MUTED);
    this.doc.text(ascii(subtitle), this.margin, this.y);
    this.y += 24;
  }

  footerAndSave(filename: string) {
    const pages = this.doc.getNumberOfPages();
    for (let p = 1; p <= pages; p += 1) {
      this.doc.setPage(p);
      this.doc.setDrawColor(...LINE);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.footerY - 8, this.pageW - this.margin, this.footerY - 8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(...MUTED);
      this.doc.text("SRM Institute of Science and Technology - 21CSC403T Virtual Lab", this.margin, this.footerY);
      this.doc.text(`Page ${p} of ${pages}`, this.pageW - this.margin, this.footerY, { align: "right" });
    }
    this.doc.save(filename);
  }
}

function studentBlock(pdf: LabPdf, form: { names: string; regs: string; title?: string }) {
  pdf.heading("1. Student Details");
  pdf.field("Name(s)", form.names);
  pdf.field("Registration number(s)", form.regs);
  if (form.title) pdf.field("Project title", form.title);
  pdf.y += 6;
}

export async function downloadReportPdf(
  form: Record<string, string>,
  analysis: AnalysisResult,
  rows: Rows,
) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header(
    form.title || "Software Code Metrics Analysis",
    `21CSC403T Virtual Lab - Exercise 1 Report  |  Generated ${date}`,
  );

  studentBlock(pdf, { names: form.names, regs: form.regs, title: form.title });
  pdf.field("Origin", `${form.origin}${form.github ? ` (${form.github})` : ""}`);
  pdf.field("Language", "Python");
  pdf.field("Description", form.description);
  pdf.y += 6;

  pdf.heading("2. Tool & Metrics");
  pdf.field("Tool", "Radon (RadonEngine). Lizard is reserved for a later exercise.");
  pdf.body(form.justification);
  pdf.y += 6;

  pdf.heading("3. Results (live from Radon)");
  pdf.field(
    "Size",
    `LOC ${analysis.loc.loc} - SLOC ${analysis.loc.sloc} - LLOC ${analysis.loc.lloc} - comments ${analysis.loc.comments}`,
  );
  pdf.field(
    "Halstead",
    `Volume ${fmt(analysis.halstead.volume)} - Difficulty ${fmt(analysis.halstead.difficulty)} - Effort ${fmt(analysis.halstead.effort)}`,
  );
  pdf.field("Maintainability Index", `${fmt(analysis.maintainability.mi)} (${analysis.maintainability.rank})`);
  pdf.table(
    ["Function", "CC", "Rank", "Lines"],
    analysis.functions.map((f) => [ascii(f.qualified_name), String(f.cc), f.rank, `${f.lineno}-${f.end_lineno}`]),
  );

  pdf.heading("4. Analysis & Interpretation");
  if (analysis.insights.length === 0) pdf.body("No insights generated.");
  else analysis.insights.forEach((i) => pdf.bullet(i.title, i.detail));
  pdf.y += 4;

  pdf.heading("5. Code Improvement");
  pdf.body(form.refactor);
  if (rows.length > 0) {
    pdf.table(
      ["Metric", "Before", "After", "Change %"],
      rows.map((r) => [
        ascii(r.label),
        fmt(r.before),
        fmt(r.after),
        r.pct == null ? "-" : `${r.pct > 0 ? "+" : ""}${r.pct.toFixed(1)}%`,
      ]),
    );
  }

  pdf.heading("6. Inference & Conclusion");
  pdf.body(form.conclusion);

  const safeTitle = (form.title || "report").replace(/[^\w-]+/g, "-").toLowerCase();
  pdf.footerAndSave(`21csc403t-exercise1-${safeTitle}.pdf`);
}

export interface Exp4PdfInput {
  names: string;
  regs: string;
  title?: string;
  origin?: string;
  github?: string;
  description?: string;
  selectedApp: string;
  responses: Exp4Response[];
  overallAvg: number;
  interpretation: string;
  factors: { factor: string; avg: number; interpretation: string }[];
  highest: { factor: Exp4Factor; avg: number; label: string } | null;
  lowest: { factor: Exp4Factor; avg: number; label: string } | null;
  themes: { theme: string; mentions: number }[];
  comments: string;
  quiz?: {
    score: number;
    answers: (number | null)[];
    questions: Exp4QuizQuestion[];
  };
}

export async function downloadExp4Pdf(input: Exp4PdfInput) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header(
    input.title || "Customer Satisfaction Metrics",
    `21CSC403T Virtual Lab - Exercise 4 Report  |  Generated ${date}`,
  );

  studentBlock(pdf, {
    names: input.names,
    regs: input.regs,
    title: input.title || "Customer Satisfaction Metrics",
  });
  if (input.origin) pdf.field("Origin", `${input.origin}${input.github ? ` (${input.github})` : ""}`);
  if (input.description) pdf.field("Description", input.description);
  pdf.field("Application", input.selectedApp);
  pdf.field("Number of responses", String(input.responses.length));
  pdf.field("Overall average satisfaction", `${input.overallAvg.toFixed(2)} / 5.00`);
  pdf.field("Interpretation", input.interpretation);
  pdf.y += 6;

  pdf.heading("2. Survey Questions");
  pdf.body("1. How satisfied are you with the overall experience of the application?");
  pdf.body("2. How satisfied are you with the application's ease of use?");
  pdf.body("3. How satisfied are you with the application's performance?");
  pdf.body("4. How satisfied are you with the application's reliability?");
  pdf.body("5. How satisfied are you with the application's features?");
  pdf.body("6. What improvement would you most like to see in this application? (Open-ended)");

  pdf.heading("3. Factor-wise Average Ratings");
  pdf.table(
    ["Factor", "Average", "Interpretation"],
    input.factors.map((r) => [ascii(r.factor), r.avg.toFixed(2), ascii(r.interpretation)]),
    1,
  );
  pdf.field("Highest-rated factor", input.highest ? `${input.highest.label} (${input.highest.avg.toFixed(2)})` : "-");
  pdf.field("Lowest-rated factor", input.lowest ? `${input.lowest.label} (${input.lowest.avg.toFixed(2)})` : "-");
  pdf.y += 6;

  pdf.heading("4. Feedback Themes");
  if (input.themes.length === 0) pdf.body("No recurring qualitative themes were identified.");
  else pdf.body(input.themes.map((t) => `${t.theme}: ${t.mentions}`).join("; "));

  pdf.heading("5. Analytical Comments");
  pdf.body(input.comments);

  if (input.quiz) {
    pdf.heading("6. Assessment Quiz Results");
    const { score, answers, questions } = input.quiz;
    const pct = Math.round((score / questions.length) * 100);
    pdf.field("Score", `${score}/${questions.length} (${pct}%) - ${score >= 6 ? "PASS" : "FAIL"}`);
    pdf.table(
      ["#", "Question", "Your answer", "Correct", "Result"],
      questions.map((q, i) => {
        const userIdx = answers[i];
        return [
          String(i + 1),
          ascii(q.question),
          userIdx != null ? ascii(`${String.fromCharCode(65 + userIdx)}. ${q.options[userIdx]}`) : "-",
          ascii(`${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`),
          userIdx === q.correct ? "Pass" : "Fail",
        ];
      }),
      0,
    );
  }

  pdf.footerAndSave("21csc403t-exercise4-customer-satisfaction.pdf");
}

export interface Exp5PdfInput {
  names: string;
  regs: string;
  title?: string;
  origin?: string;
  github?: string;
  description?: string;
  metrics: Exp5ClassMetrics[];
  strategies: Exp5Strategy[];
  largestClass: Exp5ClassMetrics;
  highestCoupling: Exp5ClassMetrics;
  highestERS: Exp5ClassMetrics;
  medLowCohesion: Exp5ClassMetrics[];
  conclusion: string;
  quiz?: {
    score: number;
    answers: (number | null)[];
    questions: Exp5QuizQuestion[];
  };
}

export async function downloadExp5Pdf(input: Exp5PdfInput) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header(
    input.title || "Object-Oriented Design Metrics",
    `21CSC403T Virtual Lab - Exercise 5 Report  |  Generated ${date}`,
  );

  studentBlock(pdf, {
    names: input.names,
    regs: input.regs,
    title: input.title || "Object-Oriented Design Metrics",
  });
  if (input.origin) pdf.field("Origin", `${input.origin}${input.github ? ` (${input.github})` : ""}`);
  if (input.description) pdf.field("Description", input.description);
  pdf.y += 6;

  pdf.heading("2. Class Size Analysis");
  pdf.table(
    ["Class", "Attributes", "Methods", "Total", "Size"],
    input.metrics.map((m) => [m.name, String(m.attributeCount), String(m.methodCount), String(m.totalMembers), m.sizeCategory]),
  );
  pdf.body(`Largest class: ${input.largestClass.name} (${input.largestClass.totalMembers} members).`);

  pdf.heading("3. Cohesion Analysis");
  pdf.table(
    ["Class", "Cohesion", "Reason"],
    input.metrics.map((m) => [m.name, m.cohesionLevel, ascii(m.cohesionReason)]),
    1,
  );

  pdf.heading("4. Coupling Analysis");
  pdf.table(
    ["Class", "Outgoing", "Incoming", "Coupling"],
    input.metrics.map((m) => [m.name, String(m.outgoing), String(m.incoming), m.couplingCategory]),
  );
  pdf.body(
    `Highest coupling: ${input.highestCoupling.name} (${input.highestCoupling.outgoing} outgoing, ${input.highestCoupling.couplingCategory}).`,
  );

  pdf.heading("5. Response Set Analysis");
  pdf.table(
    ["Class", "Methods", "Interactions", "Est. RS"],
    input.metrics.map((m) => [
      m.name,
      String(m.methodCount),
      String(m.outgoing),
      String(m.estimatedResponseSet),
    ]),
  );
  pdf.body(`Highest estimated response set: ${input.highestERS.name} (ERS: ${input.highestERS.estimatedResponseSet}).`);

  pdf.heading("6. Decoupling Recommendations");
  input.strategies.forEach((s) => pdf.bullet(s.label, `${s.applicableTo.join(", ")}: ${s.description}`));

  pdf.heading("7. Overall Design Analysis");
  const cohesionNote =
    input.medLowCohesion.length > 0
      ? `${input.medLowCohesion.map((m) => m.name).join(", ")} show medium/lower cohesion.`
      : "All classes show high cohesion.";
  pdf.body(
    `The class model contains ${input.metrics.length} classes. The largest class is ${input.largestClass.name} with ${input.largestClass.totalMembers} total members. ${cohesionNote} The class with the most outgoing interactions is ${input.highestCoupling.name}. The highest estimated response set belongs to ${input.highestERS.name}.`,
  );

  pdf.heading("8. Conclusion");
  pdf.body(input.conclusion);

  if (input.quiz) {
    pdf.heading("9. Assessment Quiz Results");
    const { score, answers, questions } = input.quiz;
    const pct = Math.round((score / questions.length) * 100);
    pdf.field("Score", `${score}/${questions.length} (${pct}%) - ${score >= 6 ? "PASS" : "FAIL"}`);
    pdf.table(
      ["#", "Question", "Your answer", "Correct", "Result"],
      questions.map((q, i) => {
        const userIdx = answers[i];
        return [
          String(i + 1),
          ascii(q.question),
          userIdx != null ? ascii(`${String.fromCharCode(65 + userIdx)}. ${q.options[userIdx]}`) : "-",
          ascii(`${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`),
          userIdx === q.correct ? "Pass" : "Fail",
        ];
      }),
      0,
    );
  }

  pdf.footerAndSave("21csc403t-exercise5-oo-design-metrics.pdf");
}

export interface Exp6ClassMetrics {
  name: string;
  layer: string;
  wmc: number;
  dit: number;
  noc: number;
  cbo: number;
  rfc: number;
  lcom: number;
}

export interface Exp6PdfInput {
  names: string;
  regs: string;
  title?: string;
  origin?: string;
  github?: string;
  description?: string;
  classes: Exp6ClassMetrics[];
  thresholds: { wmc: number; dit: number; noc: number; cbo: number; rfc: number; lcom: number };
  conclusion: string;
}

export async function downloadExp6Pdf(input: Exp6PdfInput) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header(
    input.title || "OO Metrics with CK / SonarCloud",
    `21CSC403T Virtual Lab - Exercise 6 Report  |  Generated ${date}`,
  );

  studentBlock(pdf, {
    names: input.names,
    regs: input.regs,
    title: input.title || "OO Metrics with CK / SonarCloud",
  });
  if (input.origin) pdf.field("Origin", `${input.origin}${input.github ? ` (${input.github})` : ""}`);
  if (input.description) pdf.field("Description", input.description);
  pdf.y += 6;

  const t = input.thresholds;
  pdf.heading("2. CK Metric Thresholds");
  pdf.body(
    `WMC ${t.wmc}  |  DIT ${t.dit}  |  NOC ${t.noc}  |  CBO ${t.cbo}  |  RFC ${t.rfc}  |  LCOM ${t.lcom}`,
  );

  pdf.heading("3. Class Metric Values");
  pdf.table(
    ["Class", "Layer", "WMC", "DIT", "NOC", "CBO", "RFC", "LCOM"],
    input.classes.map((c) => [
      ascii(c.name),
      ascii(c.layer),
      String(c.wmc),
      String(c.dit),
      String(c.noc),
      String(c.cbo),
      String(c.rfc),
      String(c.lcom),
    ]),
  );

  const maxWmc = input.classes.reduce((a, b) => (b.wmc > a.wmc ? b : a));
  const maxCbo = input.classes.reduce((a, b) => (b.cbo > a.cbo ? b : a));
  const maxRfc = input.classes.reduce((a, b) => (b.rfc > a.rfc ? b : a));
  pdf.body(
    `Dataset size: ${input.classes.length} classes. Highest WMC: ${maxWmc.name} (${maxWmc.wmc}). Highest CBO: ${maxCbo.name} (${maxCbo.cbo}). Highest RFC: ${maxRfc.name} (${maxRfc.rfc}).`,
  );

  pdf.heading("4. Conclusion");
  pdf.body(input.conclusion);

  pdf.footerAndSave("21csc403t-exercise6-oo-ck-metrics.pdf");
}

export interface Exp2PdfInput {
  names: string;
  regs: string;
  project: Exp2Project;
  requirements: Exp2Requirement[];
  testCases: Exp2TestCase[];
  summary: Exp2MetricsResult | null;
  uncovered: Exp2Requirement[];
  comparison?: { initial: Exp2MetricsResult; current: Exp2MetricsResult };
  conclusion: string;
  quizAnswers?: (number | null)[];
  quizQuestions?: Exp2QuizQuestion[];
}

export async function downloadExp2Pdf(input: Exp2PdfInput) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header(
    "Test Case Management (Kiwi TCMS)",
    `21CSC403T Virtual Lab - Exercise 2 Report  |  Generated ${date}`,
  );

  studentBlock(pdf, { names: input.names, regs: input.regs, title: input.project.name });

  pdf.heading("2. Project Overview");
  pdf.field("Project Name", input.project.name);
  pdf.body(input.project.description || "No description provided.");

  pdf.heading("3. Requirement Traceability & Coverage");
  pdf.table(
    ["Key", "Title", "Category", "Priority", "Linked Tests"],
    input.requirements.map((r) => [
      r.req_id || r.id,
      ascii(r.title),
      r.category.toUpperCase(),
      r.priority.toUpperCase(),
      String(input.testCases.filter((tc) => tc.linked_requirement_ids.includes(r.id)).length),
    ]),
    1,
  );
  if (input.summary) {
    pdf.body(`Total Requirements: ${input.summary.total_requirements}`);
  }

  pdf.heading("4. Test Execution Summary");
  pdf.body(`Total Test Cases: ${input.testCases.length}`);

  pdf.heading("5. Test Case Inventory (Sample / Active Cases)");
  pdf.table(
    ["Key", "Title", "Tier", "Priority", "Linked Reqs"],
    input.testCases.slice(0, 25).map((tc) => [
      tc.tc_id || tc.id,
      ascii(tc.title.length > 38 ? `${tc.title.slice(0, 38)}...` : tc.title),
      tc.tier,
      tc.priority,
      tc.linked_requirement_ids
        .map((rid) => input.requirements.find((r) => r.id === rid)?.req_id ?? rid)
        .join(", "),
    ]),
    1,
  );

  pdf.heading("6. Testing Gaps & Identified Action Items");
  if (input.uncovered && input.uncovered.length > 0) {
    pdf.body(`The following ${input.uncovered.length} requirement(s) lack passing test evidence:`);
    input.uncovered.forEach((r) => {
      pdf.bullet(r.req_id || r.id, `${r.title} (Priority: ${r.priority})`);
    });
  } else {
    pdf.body("All defined requirements have at least one passing test case. No uncovered requirements remain.");
  }

  pdf.heading("7. Conclusion & Pedagogical Insights");
  pdf.body(input.conclusion || "Test management completed successfully.");

  pdf.footerAndSave("21csc403t-exercise2-test-case-management.pdf");
}

export interface Exp7PdfRequirement {
  id: number;
  statement: string;
  issues: string[];
}

export interface Exp7PdfInput {
  names: string;
  regs: string;
  title?: string;
  origin?: string;
  github?: string;
  description?: string;
  conclusion: string;
  issueCounts: { tag: string; count: number }[];
  requirements: Exp7PdfRequirement[];
}

export async function downloadExp7Pdf(input: Exp7PdfInput) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header(
    input.title || "Requirement Ambiguity Analysis",
    `21CSC403T Virtual Lab - Exercise 7 Report  |  Generated ${date}`,
  );

  studentBlock(pdf, {
    names: input.names,
    regs: input.regs,
    title: input.title || "Requirement Ambiguity Analysis",
  });
  if (input.origin) pdf.field("Origin", `${input.origin}${input.github ? ` (${input.github})` : ""}`);
  if (input.description) pdf.field("Description", input.description);
  pdf.y += 6;

  pdf.heading("2. Issue Distribution");
  pdf.table(
    ["Issue tag", "Requirements"],
    input.issueCounts.map((r) => [ascii(r.tag), String(r.count)]),
  );

  pdf.heading("3. Requirement Review Table");
  pdf.table(
    ["#", "Requirement", "Tags"],
    input.requirements.map((r) => [
      String(r.id),
      ascii(r.statement),
      ascii(r.issues.join(", ")),
    ]),
    0,
  );

  pdf.heading("4. Conclusion");
  pdf.body(input.conclusion);

  pdf.footerAndSave("21csc403t-exercise7-requirement-ambiguity.pdf");
}

