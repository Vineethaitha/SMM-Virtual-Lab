import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, IdCard, Loader2, UserRound } from "lucide-react";
import { AuthShell, IconField } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
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
    <AuthShell
      heading={
        <>
          Set up your{" "}
          <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">lab profile</span>
        </>
      }
      description="Your name and registration number appear on your lab reports and certificate. Your faculty uses them to identify you."
      headerRight={
        <Button variant="outline" size="sm" className="h-8 rounded-full px-4" onClick={() => void signOut()}>
          Sign out
        </Button>
      }
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Email verified
        </span>
        <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
      </div>
      <h2 className="mt-5 text-2xl font-bold tracking-tight">Your details</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Enter your name and registration number as they are in the college records.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-xs font-semibold text-foreground/80">
          Full name
          <IconField
            icon={UserRound}
            required
            autoFocus
            autoComplete="name"
            placeholder="e.g. Aitha Vineeth"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold text-foreground/80">
          Registration number
          <IconField
            icon={IdCard}
            required
            placeholder="e.g. RA2211003010123"
            className="uppercase placeholder:normal-case"
            value={reg}
            onChange={(e) => setReg(e.target.value)}
          />
        </label>
        {error ? (
          <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-full text-sm font-semibold shadow-lg shadow-primary/20"
          disabled={busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Saving…" : "Save and continue"}
          {!busy ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>
    </AuthShell>
  );
}
