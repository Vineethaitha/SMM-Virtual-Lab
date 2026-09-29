import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Loader2, Mail, MailCheck, RotateCw } from "lucide-react";
import { AuthShell, IconField } from "@/components/auth/AuthShell";
import { OTP_LENGTH, OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/button";
import { ALLOWED_EMAIL_DOMAIN, emailPolicyError } from "@/lib/emailPolicy";
import { cn } from "@/lib/utils";
import { useAuth } from "@/state/AuthContext";

const RESEND_MS = 90_000;

function stampKey(email: string) {
  return `smm-otp-sent:${email.trim().toLowerCase()}`;
}

function secondsUntilResend(email: string) {
  const raw = sessionStorage.getItem(stampKey(email));
  if (!raw) return 0;
  const wait = RESEND_MS - (Date.now() - Number(raw));
  return wait > 0 ? Math.ceil(wait / 1000) : 0;
}

function Steps({ step }: { step: "email" | "code" }) {
  const items = [
    { id: "email", label: "Email" },
    { id: "code", label: "Verify" },
  ] as const;
  const current = step === "email" ? 0 : 1;
  return (
    <ol className="flex items-center gap-3">
      {items.map((item, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={item.id} className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition",
                  done && "bg-emerald-500 text-white",
                  active && "bg-primary text-white shadow-md shadow-primary/30",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("text-xs font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
            </span>
            {i < items.length - 1 ? (
              <span className={cn("h-px w-10 transition", done ? "bg-emerald-400" : "bg-border")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

const stepMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.22 },
};

export function LoginPage() {
  const { configured, session, sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (step !== "code") return;
    const tick = () => setResendIn(secondsUntilResend(email));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [step, email]);

  if (session) return <Navigate to="/" replace />;

  const onSend = async (e?: { preventDefault(): void }) => {
    e?.preventDefault();
    setError(null);
    const policyError = emailPolicyError(email);
    if (policyError) {
      setError(policyError);
      return;
    }
    const wait = secondsUntilResend(email);
    if (wait > 0) {
      if (step === "email") setStep("code");
      else setError(`Wait ${wait}s before requesting another code.`);
      return;
    }
    setBusy(true);
    const msg = await sendOtp(email);
    setBusy(false);
    if (msg) setError(msg);
    else {
      sessionStorage.setItem(stampKey(email), String(Date.now()));
      setResendIn(secondsUntilResend(email));
      setCode("");
      setStep("code");
    }
  };

  const verify = async (token: string) => {
    if (busy || token.length < OTP_LENGTH) return;
    setError(null);
    setBusy(true);
    const msg = await verifyOtp(email, token);
    setBusy(false);
    if (msg) setError(msg);
  };

  const onVerify = (e: FormEvent) => {
    e.preventDefault();
    void verify(code);
  };

  return (
    <AuthShell>
      <Steps step={step} />

      {!configured ? (
        <div className="mt-6">
          <ErrorNote message="Add the Supabase URL and anon key to frontend/.env, then restart the dev server." />
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {step === "email" ? (
            <motion.div key="email" {...stepMotion}>
              <h2 className="mt-6 text-2xl font-bold tracking-tight">Sign in</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Enter your SRM email address. We'll email you a code to sign in. There's no password.
              </p>
              <form className="mt-6 space-y-4" onSubmit={onSend} noValidate>
                <label className="block text-xs font-semibold text-foreground/80">
                  SRM email address
                  <IconField
                    icon={Mail}
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder={`netid@${ALLOWED_EMAIL_DOMAIN}`}
                    value={email}
                    aria-invalid={Boolean(error)}
                    className={error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                  <span className="mt-1.5 block font-normal text-muted-foreground">
                    Only @{ALLOWED_EMAIL_DOMAIN} addresses can sign in.
                  </span>
                </label>
                {error ? <ErrorNote message={error} /> : null}
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full text-sm font-semibold shadow-lg shadow-primary/20"
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Sending code…" : "Send sign-in code"}
                  {!busy ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </form>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                First time here? Your account is created when you sign in.
              </p>
            </motion.div>
          ) : (
            <motion.div key="code" {...stepMotion}>
              <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight">Enter the code</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                We sent a {OTP_LENGTH}-digit code to{" "}
                <span className="font-semibold text-foreground">{email}</span>.{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError(null);
                  }}
                >
                  Change
                </button>
              </p>
              <form className="mt-6 space-y-4" onSubmit={onVerify}>
                <OtpInput
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    if (error) setError(null);
                  }}
                  onComplete={(v) => void verify(v)}
                  disabled={busy}
                  invalid={Boolean(error)}
                />
                {error ? <ErrorNote message={error} /> : null}
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-full text-sm font-semibold shadow-lg shadow-primary/20"
                  disabled={busy || code.length < OTP_LENGTH}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Verifying…" : "Verify and continue"}
                </Button>
              </form>
              <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                Didn't get the email? Check your spam folder, or
                {resendIn > 0 ? (
                  <span className="font-semibold tabular-nums text-foreground/70">resend in {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    onClick={() => void onSend()}
                  >
                    <RotateCw className="h-3 w-3" />
                    resend code
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </AuthShell>
  );
}
