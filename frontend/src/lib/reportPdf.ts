import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "@/lib/types";
import type { compareAnalyses } from "@/lib/compare";
import type { Exp4Factor, Exp4QuizQuestion, Exp4Response } from "@/data/exp4Data";
import type { Exp5ClassMetrics, Exp5QuizQuestion, Exp5Strategy } from "@/data/exp5Data";
import type { Exp2MetricsResult, Exp2Project, Exp2QuizQuestion, Exp2Requirement, Exp2TestCase } from "@/data/exp2Data";
import type {
  SizeComplianceResponseItem,
  SizeMetricsResultItem,
  SizeProjectItem,
} from "@/data/exp3Data";

type Rows = ReturnType<typeof compareAnalyses>;

const NAVY: [number, number, number] = [11, 27, 51];
const GOLD: [number, number, number] = [196, 154, 58];
const PRIMARY: [number, number, number] = [11, 27, 51];
const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [71, 85, 105];
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

const CREAM: [number, number, number] = [248, 244, 234];
const PASS: [number, number, number] = [4, 120, 87];
const FAIL: [number, number, number] = [190, 18, 60];

export interface QuizReviewEntry {
  prompt: string;
  chosen: string;
  expected: string;
  correct: boolean;
}

export interface QuizAppendix {
  title: string;
  score: number;
  total: number;
  entries: QuizReviewEntry[];
}

let activeAppendix: QuizAppendix | null = null;

/** The quiz review attached to the next PDF generated (set by the fullscreen quiz around its download). */
export function setReportQuizAppendix(appendix: QuizAppendix | null) {
  activeAppendix = appendix;
}

function pct(score: number, total: number) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

type CertificateInput = { names: string; regs: string; score: number; total: number };

/** Everything needed to rebuild an issued report later, stored with the student's progress row. */
export type SavedReport =
  | { kind: "lab"; issuedAt: string; input: UnifiedLabReport; appendix: QuizAppendix | null }
  | { kind: "final"; issuedAt: string; input: CertificateInput; appendix: QuizAppendix | null };

let issuedAtOverride: string | null = null;
let lastReport: SavedReport | null = null;

/** Returns (and clears) the report most recently generated in this session. */
export function takeLastReport(): SavedReport | null {
  const report = lastReport;
  lastReport = null;
  return report;
}

/** Re-download a previously issued report exactly as it was issued. */
export async function downloadSavedReport(report: SavedReport) {
  const previous = activeAppendix;
  activeAppendix = report.appendix;
  issuedAtOverride = report.issuedAt;
  try {
    if (report.kind === "lab") await downloadUnifiedLabPdf(report.input);
    else await downloadCompletionCertificate(report.input);
  } finally {
    activeAppendix = previous;
    issuedAtOverride = null;
    lastReport = null;
  }
}

function issuedOn() {
  return issuedAtOverride ? new Date(issuedAtOverride) : new Date();
}

function issuedDate() {
  return issuedOn().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

class LabPdf {
  doc: jsPDF;
  pageW: number;
  pageH: number;
  margin = 48;
  contentW: number;
  footerY: number;
  y: number;
  section = 0;
  appendix: QuizAppendix | null;

  constructor(doc?: jsPDF) {
    this.doc = doc ?? new jsPDF({ unit: "pt", format: "a4" });
    this.pageW = this.doc.internal.pageSize.getWidth();
    this.pageH = this.doc.internal.pageSize.getHeight();
    this.contentW = this.pageW - this.margin * 2;
    this.footerY = this.pageH - 46;
    this.y = 40;
    this.appendix = activeAppendix;
  }

  paintTopBand() {
    this.doc.setFillColor(...NAVY);
    this.doc.rect(0, 0, this.pageW, 22, "F");
    this.doc.setFillColor(...GOLD);
    this.doc.rect(0, 22, this.pageW, 3, "F");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("21CSC403T Virtual Laboratory", this.margin, 15);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(232, 214, 160);
    this.doc.text("Software Metrics & Measurement", this.pageW - this.margin, 15, { align: "right" });
  }

  newPage() {
    this.doc.addPage("a4", "portrait");
    this.paintTopBand();
    this.y = 50;
  }

  ensureSpace(needed: number) {
    if (this.y + needed > this.footerY - 8) this.newPage();
  }

  heading(text: string) {
    this.ensureSpace(48);
    this.y += 6;
    this.section += 1;
    const label = ascii(text).replace(/^\d+\.\s*/, "");
    this.doc.setFillColor(...NAVY);
    this.doc.roundedRect(this.margin, this.y - 12, 18, 18, 3, 3, "F");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(232, 214, 160);
    this.doc.text(String(this.section), this.margin + 9, this.y + 0.5, { align: "center" });
    this.doc.setFontSize(12.5);
    this.doc.setTextColor(...NAVY);
    this.doc.text(label, this.margin + 26, this.y + 1);
    this.doc.setDrawColor(...LINE);
    this.doc.setLineWidth(0.6);
    this.doc.line(this.margin + 26, this.y + 8, this.pageW - this.margin, this.y + 8);
    this.y += 24;
  }

  listItem(text: string) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    const lines = this.doc.splitTextToSize(ascii(text) || "-", this.contentW - 14);
    lines.forEach((line: string, i: number) => {
      this.ensureSpace(14);
      if (i === 0) {
        this.doc.setFillColor(...GOLD);
        this.doc.rect(this.margin + 1, this.y - 5, 4, 4, "F");
      }
      this.doc.setTextColor(...INK);
      this.doc.text(line, this.margin + 14, this.y);
      this.y += 14;
    });
    this.y += 2;
  }

  callout(text: string) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    const lines = this.doc.splitTextToSize(ascii(text) || "-", this.contentW - 30) as string[];
    const h = lines.length * 14 + 20;
    this.ensureSpace(h + 8);
    this.doc.setFillColor(...CREAM);
    this.doc.rect(this.margin, this.y, this.contentW, h, "F");
    this.doc.setFillColor(...GOLD);
    this.doc.rect(this.margin, this.y, 3, h, "F");
    this.doc.setTextColor(...INK);
    lines.forEach((line, i) => this.doc.text(line, this.margin + 16, this.y + 18 + i * 14));
    this.y += h + 12;
  }

  kvGrid(pairs: [string, string][]) {
    const rows = pairs.filter(([, v]) => ascii(v));
    if (!rows.length) return;
    const colW = this.contentW / 2;
    const rowH = 30;
    const h = Math.ceil(rows.length / 2) * rowH + 8;
    this.ensureSpace(h + 10);
    const top = this.y;
    this.doc.setDrawColor(...LINE);
    this.doc.setLineWidth(0.6);
    this.doc.roundedRect(this.margin, top, this.contentW, h, 4, 4, "S");
    rows.forEach(([label, value], i) => {
      const x = this.margin + 14 + (i % 2) * colW;
      const y = top + 16 + Math.floor(i / 2) * rowH;
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(7);
      this.doc.setTextColor(...MUTED);
      this.doc.text(label.toUpperCase(), x, y);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(...INK);
      const v = (this.doc.splitTextToSize(ascii(value), colW - 24) as string[])[0] ?? "";
      this.doc.text(v, x, y + 12);
    });
    this.y = top + h + 14;
  }

  scoreBar(score: number, total: number) {
    this.ensureSpace(58);
    const p = pct(score, total);
    const top = this.y;
    this.doc.setFont("times", "bold");
    this.doc.setFontSize(26);
    this.doc.setTextColor(...NAVY);
    this.doc.text(`${score} / ${total}`, this.margin, top + 20);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...MUTED);
    this.doc.text(`${p}% correct  ·  locked fullscreen assessment`, this.margin, top + 36);
    const barX = this.margin + 190;
    const barW = this.contentW - 190;
    this.doc.setFillColor(232, 236, 242);
    this.doc.roundedRect(barX, top + 10, barW, 9, 4.5, 4.5, "F");
    if (p > 0) {
      this.doc.setFillColor(...GOLD);
      this.doc.roundedRect(barX, top + 10, Math.max(9, (barW * p) / 100), 9, 4.5, 4.5, "F");
    }
    this.doc.setFontSize(8);
    this.doc.text("0%", barX, top + 32);
    this.doc.text("100%", barX + barW, top + 32, { align: "right" });
    this.y = top + 52;
  }

  /** Answer-by-answer review of the quiz, on its own page(s). */
  quizReview(appendix: QuizAppendix) {
    this.newPage();
    this.section += 1;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...GOLD);
    this.doc.text(`APPENDIX  ·  ASSESSMENT REVIEW`, this.margin, this.y);
    this.y += 20;
    this.doc.setFont("times", "bold");
    this.doc.setFontSize(19);
    this.doc.setTextColor(...NAVY);
    this.doc.text("Quiz answers and key", this.margin, this.y);
    this.y += 15;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...MUTED);
    this.doc.text(ascii(appendix.title), this.margin, this.y);
    this.y += 18;

    const correct = appendix.entries.filter((e) => e.correct).length;
    const tiles: [string, string, [number, number, number]][] = [
      ["Score", `${appendix.score} / ${appendix.total}`, NAVY],
      ["Percentage", `${pct(appendix.score, appendix.total)}%`, NAVY],
      ["Correct", String(correct), PASS],
      ["Incorrect", String(appendix.entries.length - correct), FAIL],
    ];
    const gap = 10;
    const tw = (this.contentW - gap * 3) / 4;
    tiles.forEach(([label, value, color], i) => {
      const x = this.margin + i * (tw + gap);
      this.doc.setFillColor(...CREAM);
      this.doc.setDrawColor(...GOLD);
      this.doc.setLineWidth(0.6);
      this.doc.roundedRect(x, this.y, tw, 44, 4, 4, "FD");
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(7);
      this.doc.setTextColor(...MUTED);
      this.doc.text(label.toUpperCase(), x + 10, this.y + 14);
      this.doc.setFontSize(14);
      this.doc.setTextColor(...color);
      this.doc.text(value, x + 10, this.y + 33);
    });
    this.y += 60;

    autoTable(this.doc, {
      startY: this.y,
      margin: { left: this.margin, right: this.margin, top: 50, bottom: this.pageH - this.footerY + 10 },
      head: [["#", "Question", "Your answer", "Correct answer", "Result"]],
      body: appendix.entries.map((e, i) => [
        String(i + 1),
        ascii(e.prompt),
        ascii(e.chosen) || "-",
        ascii(e.expected),
        e.correct ? "Correct" : "Wrong",
      ]),
      styles: { fontSize: 8.5, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: 0.5, valign: "top" },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 248, 243] },
      columnStyles: {
        0: { cellWidth: 22, halign: "center", textColor: MUTED },
        2: { cellWidth: 104 },
        3: { cellWidth: 104 },
        4: { cellWidth: 50, halign: "center", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const entry = appendix.entries[data.row.index];
        if (!entry) return;
        if (data.column.index === 4) data.cell.styles.textColor = entry.correct ? PASS : FAIL;
        if (data.column.index === 2 && !entry.correct) data.cell.styles.textColor = FAIL;
        if (data.column.index === 3) data.cell.styles.textColor = PASS;
      },
      didDrawPage: () => this.paintTopBand(),
    });
    this.y = (this.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
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
        this.doc.setTextColor(...INK);
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
      margin: { left: this.margin, right: this.margin, top: 50, bottom: this.pageH - this.footerY + 10 },
      head: [head],
      body,
      styles: { fontSize: 9, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 248, 243] },
      columnStyles,
      didDrawPage: () => this.paintTopBand(),
    });
    this.y = (this.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  }

  async header(title: string, subtitle: string) {
    this.paintTopBand();
    this.y = 40;
    const base = import.meta.env.BASE_URL ?? "/";
    const [official, srmvl] = await Promise.all([
      loadScaled(`${base}srm-official-logo.jpg`, 36),
      loadScaled(`${base}srmvl-logo.png`, 24),
    ]);
    if (official) this.doc.addImage(official.data, official.fmt, this.margin, this.y, official.w, official.h);
    if (srmvl) {
      this.doc.addImage(srmvl.data, srmvl.fmt, this.pageW - this.margin - srmvl.w, this.y + 6, srmvl.w, srmvl.h);
    }
    this.y += 48;
    this.doc.setDrawColor(...GOLD);
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);
    this.y += 24;

    const expNo = subtitle.match(/Exercise (\d+)/)?.[1];
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...GOLD);
    this.doc.text(expNo ? `EXPERIMENT ${expNo}  ·  LAB REPORT` : "LAB REPORT", this.margin, this.y);
    this.y += 22;
    this.doc.setFont("times", "bold");
    this.doc.setFontSize(22);
    this.doc.setTextColor(...NAVY);
    const titleLines = this.doc.splitTextToSize(ascii(title), this.contentW) as string[];
    titleLines.forEach((line) => {
      this.doc.text(line, this.margin, this.y);
      this.y += 24;
    });
    this.y -= 8;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(...MUTED);
    this.doc.text(`21CSC403T Software Metrics & Measurement  ·  Issued ${issuedDate()}`, this.margin, this.y);
    this.y += 22;
  }

  /** Closing declaration block with the instructor line. */
  declaration(names: string, regs: string, completed = "the experiment exercise and the locked conclusion assessment") {
    this.ensureSpace(96);
    this.y += 10;
    const top = this.y;
    this.doc.setDrawColor(...GOLD);
    this.doc.setLineWidth(0.8);
    this.doc.line(this.margin, top, this.pageW - this.margin, top);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(...MUTED);
    const text = `This report was generated by the 21CSC403T Virtual Laboratory for ${ascii(names) || "the student"} (${ascii(regs) || "-"}) after completing ${completed}.`;
    const lines = this.doc.splitTextToSize(text, this.contentW) as string[];
    lines.forEach((line, i) => this.doc.text(line, this.margin, top + 18 + i * 12));
    const sigY = top + 30 + lines.length * 12 + 18;
    this.doc.setDrawColor(...NAVY);
    this.doc.setLineWidth(0.6);
    this.doc.line(this.margin, sigY, this.margin + 170, sigY);
    this.doc.line(this.pageW - this.margin - 170, sigY, this.pageW - this.margin, sigY);
    this.doc.setFont("times", "italic");
    this.doc.setFontSize(11);
    this.doc.setTextColor(...INK);
    this.doc.text(ascii(names) || "Student", this.margin, sigY + 14);
    this.doc.text(INSTRUCTOR, this.pageW - this.margin, sigY + 14, { align: "right" });
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(8);
    this.doc.setTextColor(...MUTED);
    this.doc.text("Student", this.margin, sigY + 26);
    this.doc.text("Instructor", this.pageW - this.margin, sigY + 26, { align: "right" });
    this.y = sigY + 36;
  }

  footerAndSave(filename: string, fromPage = 1) {
    if (this.appendix) this.quizReview(this.appendix);
    const pages = this.doc.getNumberOfPages();
    for (let p = fromPage; p <= pages; p += 1) {
      this.doc.setPage(p);
      this.doc.setFillColor(...GOLD);
      this.doc.rect(0, this.pageH - 32, this.pageW, 3, "F");
      this.doc.setFillColor(...NAVY);
      this.doc.rect(0, this.pageH - 29, this.pageW, 29, "F");
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(
        "Department of Computational Intelligence  ·  SRM Institute of Science and Technology",
        this.margin,
        this.pageH - 12,
      );
      this.doc.text(`Page ${p} of ${pages}`, this.pageW - this.margin, this.pageH - 12, { align: "right" });
    }
    this.doc.save(filename);
  }
}

function studentBlock(pdf: LabPdf, form: { names: string; regs: string; title?: string }) {
  const boxH = 70;
  pdf.ensureSpace(boxH + 18);
  const top = pdf.y;
  const { doc, margin, contentW } = pdf;
  doc.setFillColor(...CREAM);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.9);
  doc.roundedRect(margin, top, contentW, boxH, 5, 5, "FD");
  doc.setFillColor(...NAVY);
  doc.roundedRect(margin, top, 5, boxH, 2, 2, "F");

  const quiz = pdf.appendix;
  const cols: { label: string; value: string; x: number; w: number }[] = [
    { label: "Student name", value: ascii(form.names) || "-", x: margin + 20, w: contentW * 0.44 },
    { label: "Registration no.", value: ascii(form.regs) || "-", x: margin + 20 + contentW * 0.44, w: contentW * 0.26 },
    {
      label: quiz ? "Quiz score" : "Issued",
      value: quiz ? `${quiz.score} / ${quiz.total}  (${pct(quiz.score, quiz.total)}%)` : issuedDate(),
      x: margin + 20 + contentW * 0.7,
      w: contentW * 0.28,
    },
  ];
  cols.forEach(({ label, value, x, w }) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text(label.toUpperCase(), x, top + 22);
    doc.setFontSize(label === "Student name" ? 13 : 11.5);
    doc.setTextColor(...INK);
    const v = (doc.splitTextToSize(value, w - 12) as string[])[0] ?? "-";
    doc.text(v, x, top + 40);
  });
  if (form.title) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text((doc.splitTextToSize(ascii(form.title), contentW - 40) as string[])[0] ?? "", margin + 20, top + 58);
  }
  pdf.y = top + boxH + 18;
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
  pdf.field("Tool", "Browser static analyzer (LOC, CC, Halstead, MI). Code is never executed.");
  pdf.body(form.justification);
  pdf.y += 6;

  pdf.heading("3. Results (live from static analysis)");
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

export interface UnifiedLabReport {
  experimentNumber: number;
  experimentTitle: string;
  names: string;
  regs: string;
  projectTitle?: string;
  origin?: string;
  github?: string;
  description?: string;
  toolNote?: string;
  resultLines: string[];
  analysisLines: string[];
  conclusion: string;
  quizScore: number;
  quizTotal: number;
  tables?: { title: string; head: string[]; rows: string[][] }[];
}

export async function downloadUnifiedLabPdf(input: UnifiedLabReport) {
  const pdf = new LabPdf();
  lastReport = { kind: "lab", issuedAt: issuedOn().toISOString(), input, appendix: pdf.appendix };
  await pdf.header(input.experimentTitle, `Exercise ${input.experimentNumber}`);

  const project = input.projectTitle && input.projectTitle !== input.experimentTitle ? input.projectTitle : "";
  studentBlock(pdf, { names: input.names, regs: input.regs, title: project });

  pdf.heading("Experiment details");
  pdf.kvGrid([
    ["Experiment", `${input.experimentNumber}. ${input.experimentTitle}`],
    ["Course", "21CSC403T Software Metrics & Measurement"],
    ["Project / dataset", input.projectTitle || input.experimentTitle],
    ["Origin", input.origin ? `${input.origin}${input.github ? ` (${input.github})` : ""}` : ""],
    ["Issued on", issuedDate()],
    ["Instructor", INSTRUCTOR],
  ]);
  if (input.description) pdf.body(input.description);

  pdf.heading("Tool & method");
  pdf.body(
    input.toolNote ||
      "Completed in the 21CSC403T browser virtual lab. Student artefacts are not executed as production software.",
  );

  pdf.heading("Results");
  if (input.resultLines.length === 0) pdf.body("No quantitative results were recorded.");
  else input.resultLines.forEach((line) => pdf.listItem(line));

  pdf.heading("Analysis & interpretation");
  if (input.analysisLines.length === 0) pdf.body("See conclusion.");
  else input.analysisLines.forEach((line) => pdf.listItem(line));

  (input.tables ?? []).forEach((table) => {
    pdf.heading(table.title);
    pdf.table(table.head, table.rows);
  });

  pdf.heading("Assessment");
  pdf.scoreBar(input.quizScore, input.quizTotal);
  if (pdf.appendix) pdf.body("Every question, your answer, and the correct answer are listed in the appendix.");

  pdf.heading("Inference & conclusion");
  pdf.callout(input.conclusion);

  pdf.declaration(input.names, input.regs);

  const safe = input.experimentTitle.replace(/[^\w-]+/g, "-").toLowerCase();
  pdf.footerAndSave(`21csc403t-exercise${input.experimentNumber}-${safe}.pdf`);
}

const INSTRUCTOR = "Dr.T.Grace Shalini";

function certificateRef(names: string, regs: string, score: number, total: number): string {
  const raw = `${ascii(names).toUpperCase()}|${ascii(regs).toUpperCase()}|${score}/${total}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
  return `21CSC403T-${hex}`;
}

/** Landscape completion certificate (final comprehensive quiz). */
export async function downloadCompletionCertificate(input: CertificateInput) {
  lastReport = { kind: "final", issuedAt: issuedOn().toISOString(), input, appendix: activeAppendix };
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addPage("a4", "landscape");
  doc.deletePage(1);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const NAVY: [number, number, number] = [11, 27, 51];
  const GOLD: [number, number, number] = [196, 154, 58];
  const INK_C: [number, number, number] = [20, 24, 32];
  const MUTED_C: [number, number, number] = [90, 98, 110];
  const m = 48;
  const date = issuedOn().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const ref = certificateRef(input.names, input.regs, input.score, input.total);
  const headerH = 36;
  const footerH = 36;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, headerH, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, headerH, pageW, 3, "F");
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - footerH, pageW, footerH, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, pageH - footerH - 3, pageW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("21CSC403T Virtual Laboratory", m, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(232, 214, 160);
  doc.text("Software Metrics & Measurement", pageW - m, 22, { align: "right" });

  const base = import.meta.env.BASE_URL ?? "/";
  const [official, srmvl] = await Promise.all([
    loadScaled(`${base}srm-official-logo.jpg`, 34),
    loadScaled(`${base}srmvl-logo.png`, 26),
  ]);
  let y = headerH + 16;
  let logoX = m;
  if (official) {
    doc.addImage(official.data, official.fmt, logoX, y, official.w, official.h);
    logoX += official.w + 12;
  }
  if (srmvl) doc.addImage(srmvl.data, srmvl.fmt, logoX, y + 4, srmvl.w, srmvl.h);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_C);
  [
    `Certificate no: ${ref}`,
    "Department of Computational Intelligence",
    "SRM Institute of Science and Technology",
  ].forEach((line, i) => {
    doc.text(line, pageW - m, headerH + 20 + i * 11, { align: "right" });
  });

  y = headerH + 62;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(m, y, pageW - m, y);

  const top = y;
  const bot = pageH - footerH - 12;
  const at = (t: number) => top + (bot - top) * t;

  y = at(0.07);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text("CERTIFICATE OF COMPLETION", m, y);

  y = at(0.16);
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...INK_C);
  doc.text("Software Metrics & Measurement", m, y);

  y = at(0.24);
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.setTextColor(50, 58, 72);
  doc.text("21CSC403T Virtual Laboratory  -  Comprehensive Assessment", m, y);

  y = at(0.32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_C);
  doc.text("Instructor", m, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK_C);
  doc.text(INSTRUCTOR, m + 62, y);

  y = at(0.44);
  doc.setFont("times", "bold");
  doc.setFontSize(34);
  doc.text(ascii(input.names) || "Student", m, y);

  y = at(0.56);
  const colW = (pageW - m * 2) / 3;
  const details: [string, string][] = [
    ["Date", date],
    ["Registration", ascii(input.regs) || "-"],
    ["Assessment", `${input.score} / ${input.total}`],
  ];
  details.forEach(([label, value], i) => {
    const x = m + i * colW;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_C);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK_C);
    doc.text(value, x, y + 16);
  });

  const pillX = m + 2 * colW + 96;
  const pillY = y + 2;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.1);
  doc.roundedRect(pillX, pillY, 72, 22, 3, 3, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text(`${input.score} / ${input.total}`, pillX + 36, pillY + 15, { align: "center" });

  y = at(0.7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(55, 62, 74);
  const certCopy =
    "This certifies that the student completed the 40-question comprehensive assessment of the 21CSC403T Virtual Laboratory under locked fullscreen conditions.";
  const certLines = doc.splitTextToSize(certCopy, pageW - m * 2) as string[];
  const certLead = Math.min(24, (at(0.82) - y) / Math.max(certLines.length, 1));
  certLines.forEach((line: string) => {
    doc.text(line, m, y);
    y += certLead;
  });

  y = at(0.84);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.9);
  doc.line(m, y, pageW - m, y);

  y = at(0.91);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.line(m, y, m + 180, y);
  y += 16;
  doc.setFont("times", "italic");
  doc.setFontSize(14);
  doc.setTextColor(...INK_C);
  doc.text(INSTRUCTOR, m, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_C);
  doc.text("Instructor  ·  Department of Computational Intelligence", m, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("21CSC403T Virtual Lab  ·  SRM Institute of Science and Technology", m, pageH - 14);
  doc.text(ref, pageW - m, pageH - 14, { align: "right" });

  const filename = `21csc403t-certificate-${ascii(input.regs).replace(/[^\w-]+/g, "-") || "student"}.pdf`;
  if (!activeAppendix) {
    doc.save(filename);
    return;
  }
  doc.addPage("a4", "portrait");
  const review = new LabPdf(doc);
  review.paintTopBand();
  review.y = 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD);
  doc.text("COMPREHENSIVE ASSESSMENT  ·  PERFORMANCE REPORT", review.margin, review.y);
  review.y += 22;
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text("Final assessment summary", review.margin, review.y);
  review.y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED_C);
  doc.text(`Certificate ${ref}  ·  Issued ${issuedDate()}`, review.margin, review.y);
  review.y += 22;
  studentBlock(review, { names: input.names, regs: input.regs, title: "Experiments 1-10 · 40 shuffled questions" });
  review.heading("Overall result");
  review.scoreBar(input.score, input.total);
  review.body("The following pages list every question with your answer and the correct answer.");
  review.declaration(input.names, input.regs, "the locked 40-question comprehensive assessment");
  review.footerAndSave(filename, 2);
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

export interface Exp3PdfInput {
  names: string;
  regs: string;
  project: SizeProjectItem;
  metrics: SizeMetricsResultItem;
  compliance: SizeComplianceResponseItem;
  recommendations: string[];
  quizScore: number | null;
  quizTotal: number;
}

export async function downloadExp3Pdf(input: Exp3PdfInput) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header(
    "Software Size Estimation (FPA & COCOMO)",
    `21CSC403T Virtual Lab - Exercise 3 Report  |  Generated ${date}`,
  );

  studentBlock(pdf, { names: input.names, regs: input.regs, title: input.project.name });
  pdf.field("Project type", input.project.project_type);
  pdf.field("Language", input.project.language);
  if (input.project.description) pdf.field("Description", input.project.description);
  pdf.y += 6;

  pdf.heading("2. Knowledge Assessment");
  pdf.body(
    input.quizScore == null
      ? "Quiz completed in the interactive lab dashboard."
      : `Quiz score: ${input.quizScore} / ${input.quizTotal}.`,
  );

  const c = input.compliance;
  pdf.heading("3. Estimation Correctness Checklist");
  pdf.body(`Component coverage: ${c.component_coverage.passed ? "PASS" : "FAIL"} — ${c.component_coverage.detail}`);
  pdf.body(`Complexity assigned: ${c.complexity_assigned.passed ? "PASS" : "FAIL"} — ${c.complexity_assigned.detail}`);
  pdf.body(`GSC completeness: ${c.gsc_completeness.passed ? "PASS" : "FAIL"} — ${c.gsc_completeness.detail}`);
  pdf.body(`Project type: ${c.project_type_missing.passed ? "PASS" : "FAIL"} — ${c.project_type_missing.detail}`);
  pdf.body(`Language: ${c.language_missing.passed ? "PASS" : "FAIL"} — ${c.language_missing.detail}`);
  pdf.body(`Overall estimation quality score: ${c.quality_score}/100`);

  const m = input.metrics;
  pdf.heading("4. Computed Estimates");
  pdf.body(`UFP ${m.ufp}  |  VAF ${m.vaf}  |  AFP ${m.afp}`);
  pdf.body(`KLOC ${m.kloc}  |  Size category ${m.size_category}`);
  pdf.body(
    `Effort ${m.cocomo.effort_pm} person-months  |  Time ${m.cocomo.time_months} months  |  Team ${m.cocomo.avg_team_size}`,
  );

  pdf.heading("5. Areas for Improvement");
  input.recommendations.forEach((r) => pdf.bullet("•", r));

  pdf.footerAndSave("21csc403t-exercise3-size-estimation.pdf");
}

export async function downloadExp8Pdf(input: {
  names: string;
  regs: string;
  correct: number;
  total: number;
  quizScore: number;
  quizTotal: number;
  conclusion: string;
}) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header("Software Maintenance Metrics", `21CSC403T Virtual Lab - Exercise 8 Report  |  Generated ${date}`);
  studentBlock(pdf, { names: input.names, regs: input.regs, title: "SmartServe maintenance classification" });
  pdf.heading("2. Simulation results");
  pdf.body(`Reference-matching labels: ${input.correct} / ${input.total}.`);
  pdf.body(`Exercise score: ${input.quizScore} / ${input.quizTotal}.`);
  pdf.heading("3. Conclusion");
  pdf.body(input.conclusion);
  pdf.footerAndSave("21csc403t-exercise8-maintenance-metrics.pdf");
}

export async function downloadExp9Pdf(input: {
  names: string;
  regs: string;
  density: number;
  lambda: number;
  r100: number;
  totalDefects: number;
  quizScore: number;
  quizTotal: number;
  conclusion: string;
}) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header("Reliability and Defect Density", `21CSC403T Virtual Lab - Exercise 9 Report  |  Generated ${date}`);
  studentBlock(pdf, { names: input.names, regs: input.regs, title: "Payment Gateway sample" });
  pdf.heading("2. Computed metrics");
  pdf.body(`Defects ${input.totalDefects}  |  Density ${fmt(input.density)} /KLOC  |  lambda ${input.lambda.toFixed(3)}  |  R(100) ${fmt(input.r100)}`);
  pdf.body(`Exercise score: ${input.quizScore} / ${input.quizTotal}.`);
  pdf.heading("3. Conclusion");
  pdf.body(input.conclusion);
  pdf.footerAndSave("21csc403t-exercise9-reliability.pdf");
}

export async function downloadExp10Pdf(input: {
  names: string;
  regs: string;
  before: { mean: number; stdev: number; cp: number; cpk: number; stable: boolean };
  after: { mean: number; stdev: number; cp: number; cpk: number; stable: boolean };
  quizScore: number;
  quizTotal: number;
  conclusion: string;
}) {
  const pdf = new LabPdf();
  const date = new Date().toLocaleDateString();
  await pdf.header("Process Performance (CPI)", `21CSC403T Virtual Lab - Exercise 10 Report  |  Generated ${date}`);
  studentBlock(pdf, { names: input.names, regs: input.regs, title: "CodeWave testing process" });
  pdf.heading("2. Baseline (sprints 1-10)");
  pdf.body(
    `Mean ${fmt(input.before.mean)}  |  sigma ${fmt(input.before.stdev)}  |  Cp ${fmt(input.before.cp)}  |  Cpk ${fmt(input.before.cpk)}  |  ${input.before.stable ? "stable" : "unstable"}`,
  );
  pdf.heading("3. After improvement (sprints 11-15)");
  pdf.body(
    `Mean ${fmt(input.after.mean)}  |  sigma ${fmt(input.after.stdev)}  |  Cp ${fmt(input.after.cp)}  |  Cpk ${fmt(input.after.cpk)}  |  ${input.after.stable ? "stable" : "unstable"}`,
  );
  pdf.body(`Exercise score: ${input.quizScore} / ${input.quizTotal}.`);
  pdf.heading("4. Conclusion");
  pdf.body(input.conclusion);
  pdf.footerAndSave("21csc403t-exercise10-process-cpi.pdf");
}

