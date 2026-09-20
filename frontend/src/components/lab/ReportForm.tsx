import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

export const REPORT_FIELD_CLASS =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export type ReportStudentForm = {
  names: string;
  regs: string;
  title: string;
  origin: string;
  github: string;
  description: string;
};

export function ReportField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-xs font-medium text-slate-700">
      {label}
      <input className={REPORT_FIELD_CLASS} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function ReportDownloadBar({
  disabled,
  exporting,
  onDownload,
  hint,
  buttonId,
}: {
  disabled: boolean;
  exporting: boolean;
  onDownload: () => void;
  hint?: string;
  buttonId?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Button id={buttonId} size="sm" onClick={onDownload} disabled={disabled || exporting}>
        {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {exporting ? "Preparing…" : "Download PDF"}
      </Button>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function ReportStudentFields({
  form,
  onChange,
  originOptions,
  footnote,
}: {
  form: ReportStudentForm;
  onChange: (key: keyof ReportStudentForm, value: string) => void;
  originOptions: { value: string; label: string }[];
  footnote?: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ReportField label="Name(s)" value={form.names} onChange={(v) => onChange("names", v)} />
      <ReportField
        label="Registration number(s)"
        value={form.regs}
        onChange={(v) => onChange("regs", v)}
      />
      <ReportField label="Project title" value={form.title} onChange={(v) => onChange("title", v)} />
      <label className="text-xs font-medium text-slate-700">
        Origin
        <select
          className={REPORT_FIELD_CLASS}
          value={form.origin}
          onChange={(e) => onChange("origin", e.target.value)}
        >
          {originOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <ReportField label="GitHub link (if any)" value={form.github} onChange={(v) => onChange("github", v)} />
      <label className="text-xs font-medium text-slate-700 md:col-span-2">
        Short description
        <textarea
          className={REPORT_FIELD_CLASS}
          rows={2}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </label>
      {footnote && <p className="text-xs text-slate-500 md:col-span-2">{footnote}</p>}
    </div>
  );
}
