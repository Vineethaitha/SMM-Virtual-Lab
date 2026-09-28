import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { SrmOfficialLogo, SrmvlLogo } from "@/components/brand/SrmLogos";
import { Button } from "@/components/ui/button";
import { REPORT_FIELD_CLASS } from "@/components/lab/ReportForm";
import { useAuth } from "@/state/AuthContext";

export function LoginPage() {
  const { configured, session, sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const msg = await sendOtp(email);
    setBusy(false);
    if (msg) setError(msg);
    else setStep("code");
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const msg = await verifyOtp(email, code);
    setBusy(false);
    if (msg) setError(msg);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1b33] text-white">
      <div className="h-1 bg-[#c49a3a]" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-4 rounded-xl bg-white px-4 py-3">
          <SrmOfficialLogo className="h-10 w-auto" />
          <SrmvlLogo className="h-8 w-auto" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c49a3a]">21CSC403T Virtual Laboratory</p>
        <h1 className="mt-2 text-3xl font-bold">Sign in with email</h1>
        <p className="mt-2 text-sm text-white/70">
          We send a one-time code through the course mail (Supabase SMTP). Enter the code to open the labs.
        </p>

        {!configured ? (
          <p className="mt-8 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Add <code className="text-white">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-white">VITE_SUPABASE_ANON_KEY</code> to <code className="text-white">frontend/.env</code>,
            then restart the dev server.
          </p>
        ) : step === "email" ? (
          <form className="mt-8 space-y-4" onSubmit={onSend}>
            <label className="block text-xs font-medium text-white/80">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                className={`${REPORT_FIELD_CLASS} mt-1 text-slate-900`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button type="submit" className="w-full bg-[#c49a3a] text-[#0b1b33] hover:bg-amber-400" disabled={busy}>
              {busy ? "Sending…" : "Send code"}
            </Button>
          </form>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onVerify}>
            <p className="text-sm text-white/70">
              Code sent to <span className="text-white">{email}</span>.{" "}
              <button type="button" className="underline" onClick={() => { setStep("email"); setError(null); }}>
                Change email
              </button>
            </p>
            <label className="block text-xs font-medium text-white/80">
              6-digit code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={8}
                className={`${REPORT_FIELD_CLASS} mt-1 tracking-[0.3em] text-slate-900`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
              />
            </label>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button type="submit" className="w-full bg-[#c49a3a] text-[#0b1b33] hover:bg-amber-400" disabled={busy}>
              {busy ? "Verifying…" : "Verify and continue"}
            </Button>
          </form>
        )}
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/50">
        Software Metrics & Measurement · Department of Computational Intelligence
      </div>
    </div>
  );
}
