import { useState, type FormEvent } from "react";
import { SrmvlLogo } from "@/components/brand/SrmLogos";
import { Button } from "@/components/ui/button";
import { REPORT_FIELD_CLASS } from "@/components/lab/ReportForm";
import { useAuth } from "@/state/AuthContext";

export function CompleteProfilePage() {
  const { profile, updateProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [reg, setReg] = useState(profile?.registration_number ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const msg = await updateProfile({ full_name: name, registration_number: reg });
    setBusy(false);
    if (msg) setError(msg);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <SrmvlLogo className="mb-6 h-9 w-auto" />
        <h1 className="text-xl font-bold text-slate-900">Student details</h1>
        <p className="mt-1 text-sm text-slate-600">
          Name and registration number are stored on your lab profile and used on reports.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-xs font-medium text-slate-700">
            Full name
            <input className={REPORT_FIELD_CLASS} required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Registration number
            <input className={REPORT_FIELD_CLASS} required value={reg} onChange={(e) => setReg(e.target.value)} />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Continue"}
          </Button>
        </form>
        <button type="button" className="mt-4 text-xs text-slate-500 underline" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}
