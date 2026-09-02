import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "@/lib/types";
import type { compareAnalyses } from "@/lib/compare";

type Rows = ReturnType<typeof compareAnalyses>;

const PRIMARY: [number, number, number] = [37, 99, 235]; // blue-600
const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const LINE: [number, number, number] = [214, 222, 234];

/** jsPDF standard fonts only support Latin-1. Map common symbols to ASCII so
 *  text like Halstead's "η", "₂", "·", "→" doesn't render as spaced gibberish. */
function ascii(input: string | number | null | undefined): string {
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

function fmt(n: number | null | undefined): string {
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

export async function downloadReportPdf(
  form: Record<string, string>,
  analysis: AnalysisResult,
  rows: Rows,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  const footerY = pageH - 30;
  let y = margin;

  const base = import.meta.env.BASE_URL ?? "/";
  const [official, srmvl] = await Promise.all([
    loadScaled(`${base}srm-official-logo.jpg`, 40),
    loadScaled(`${base}srmvl-logo.png`, 26),
  ]);

  const ensureSpace = (needed: number) => {
    if (y + needed > footerY - 12) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string) => {
    ensureSpace(40);
    doc.setFillColor(...PRIMARY);
    doc.rect(margin, y - 10, 3.5, 15, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(ascii(text), margin + 11, y + 2);
    y += 20;
  };

  const field = (label: string, value: string) => {
    const val = ascii(value) || "-";
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    const labelText = `${label}:  `;
    const offset = doc.getTextWidth(labelText);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(val, contentW - offset);
    lines.forEach((line: string, i: number) => {
      ensureSpace(14);
      if (i === 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...INK);
        doc.text(labelText, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...MUTED);
      }
      doc.text(line, margin + offset, y);
      y += 14;
    });
    y += 3;
  };

  const body = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(ascii(text) || "-", contentW);
    lines.forEach((line: string) => {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 3;
  };

  const bullet = (title: string, detail: string) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    const tLines = doc.splitTextToSize(ascii(title), contentW - 12);
    tLines.forEach((line: string, i: number) => {
      ensureSpace(13);
      if (i === 0) {
        doc.setFillColor(...PRIMARY);
        doc.circle(margin + 2, y - 3, 1.6, "F");
      }
      doc.text(line, margin + 12, y);
      y += 13;
    });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    const dLines = doc.splitTextToSize(ascii(detail), contentW - 12);
    dLines.forEach((line: string) => {
      ensureSpace(13);
      doc.text(line, margin + 12, y);
      y += 13;
    });
    y += 5;
  };

  // ---------- Header ----------
  if (official) doc.addImage(official.data, official.fmt, margin, y, official.w, official.h);
  if (srmvl) {
    doc.addImage(srmvl.data, srmvl.fmt, pageW - margin - srmvl.w, y + 6, srmvl.w, srmvl.h);
  }
  y += 46;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(1.4);
  doc.line(margin, y, pageW - margin, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(ascii(form.title || "Software Code Metrics Analysis"), margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(
    ascii(
      `21CSC403T Virtual Lab - Exercise 1 Report  |  Generated ${new Date().toLocaleDateString()}`,
    ),
    margin,
    y,
  );
  y += 24;

  // ---------- Section 1 ----------
  heading("1. Student & Project Details");
  field("Name(s)", form.names);
  field("Registration number(s)", form.regs);
  field("Project title", form.title);
  field("Origin", `${form.origin}${form.github ? ` (${form.github})` : ""}`);
  field("Language", "Python");
  field("Description", form.description);
  y += 6;

  // ---------- Section 2 ----------
  heading("2. Tool & Metrics");
  field("Tool", "Radon (RadonEngine). Lizard is reserved for a later exercise.");
  body(form.justification);
  y += 6;

  // ---------- Section 3 ----------
  heading("3. Results (live from Radon)");
  field(
    "Size",
    `LOC ${analysis.loc.loc} - SLOC ${analysis.loc.sloc} - LLOC ${analysis.loc.lloc} - comments ${analysis.loc.comments}`,
  );
  field(
    "Halstead",
    `Volume ${fmt(analysis.halstead.volume)} - Difficulty ${fmt(analysis.halstead.difficulty)} - Effort ${fmt(analysis.halstead.effort)}`,
  );
  field("Maintainability Index", `${fmt(analysis.maintainability.mi)} (${analysis.maintainability.rank})`);
  y += 4;

  ensureSpace(70);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Function", "CC", "Rank", "Lines"]],
    body: analysis.functions.map((f) => [ascii(f.qualified_name), String(f.cc), f.rank, `${f.lineno}-${f.end_lineno}`]),
    styles: { fontSize: 9, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 253] },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;

  // ---------- Section 4 ----------
  heading("4. Analysis & Interpretation");
  if (analysis.insights.length === 0) body("No insights generated.");
  else analysis.insights.forEach((i) => bullet(i.title, i.detail));
  y += 4;

  // ---------- Section 5 ----------
  heading("5. Code Improvement");
  body(form.refactor);
  if (rows.length > 0) {
    ensureSpace(70);
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Metric", "Before", "After", "Change %"]],
      body: rows.map((r) => [
        ascii(r.label),
        fmt(r.before),
        fmt(r.after),
        r.pct == null ? "-" : `${r.pct > 0 ? "+" : ""}${r.pct.toFixed(1)}%`,
      ]),
      styles: { fontSize: 9, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 253] },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  }

  // ---------- Section 6 ----------
  heading("6. Inference & Conclusion");
  body(form.conclusion);

  // ---------- Footer on every page ----------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 8, pageW - margin, footerY - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("SRM Institute of Science and Technology - 21CSC403T Virtual Lab", margin, footerY);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, footerY, { align: "right" });
  }

  const safeTitle = (form.title || "report").replace(/[^\w-]+/g, "-").toLowerCase();
  doc.save(`21csc403t-exercise1-${safeTitle}.pdf`);
}
