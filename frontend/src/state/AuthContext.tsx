import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { emailPolicyError } from "@/lib/emailPolicy";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  registration_number: string | null;
  role: "student" | "faculty";
};

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileComplete: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (fields: { full_name: string; registration_number: string }) => Promise<string | null>;
  sendOtp: (email: string) => Promise<string | null>;
  verifyOtp: (email: string, token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(message?: string | null, status?: number) {
  if (status === 504 || (message ?? "").includes("504") || (message ?? "").toLowerCase().includes("gateway")) {
    return "HTTP 504: Supabase timed out contacting your custom SMTP server. The lab did not send the mail. In Authentication → Emails → SMTP, use a public host (not localhost), port 587, and the mailbox password or app password. Use Send test email there. If that also returns 504, the SMTP host is blocking or too slow for Supabase.";
  }
  if (!message) return status ? `Sign-in failed (HTTP ${status}).` : null;
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("over_email_send_rate_limit")) {
    return `Supabase email rate limit (${message}). This is enforced by the Auth project, not the lab app. Wait, or raise it under Authentication → Rate Limits → emails.`;
  }
  return message;
}

function authError(error: { message: string; status?: number } | null) {
  if (!error) return null;
  const status = "status" in error ? Number(error.status) : undefined;
  return friendlyAuthError(error.message, Number.isFinite(status) ? status : undefined);
}

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  for (let i = 0; i < 6; i += 1) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!error && data) return data as Profile;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) {
      setProfile(null);
      return;
    }
    setProfile(await loadProfile(uid));
  }, [session?.user?.id]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const uid = session?.user?.id;
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      await supabase.rpc("sync_my_faculty_role");
      const p = await loadProfile(uid);
      setProfile(p);
      setLoading(false);
    })();
  }, [session?.user?.id]);

  const updateProfile = useCallback(
    async (fields: { full_name: string; registration_number: string }) => {
      if (!supabase || !session?.user) return "Not signed in.";
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        email: session.user.email ?? "",
        full_name: fields.full_name.trim(),
        registration_number: fields.registration_number.trim(),
        role: profile?.role ?? "student",
      });
      if (error) return error.message;
      await refreshProfile();
      const next = await loadProfile(session.user.id);
      setProfile(next);
      return null;
    },
    [session?.user, refreshProfile, profile?.role],
  );

  const sendOtp = useCallback(async (email: string) => {
    if (!supabase) return "Supabase is not configured.";
    const policyError = emailPolicyError(email);
    if (policyError) return policyError;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      return authError(error);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in request failed.";
      return friendlyAuthError(message, message.includes("504") ? 504 : undefined);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return "Supabase is not configured.";
    const emailAddr = email.trim();
    const code = token.trim();
    try {
      const first = await supabase.auth.verifyOtp({ email: emailAddr, token: code, type: "email" });
      if (!first.error) return null;
      return authError(first.error);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not verify the code.";
      return friendlyAuthError(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const profileComplete = Boolean(profile?.full_name?.trim() && profile?.registration_number?.trim());

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: supabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      profileComplete,
      refreshProfile,
      updateProfile,
      sendOtp,
      verifyOtp,
      signOut,
    }),
    [
      loading,
      session,
      profile,
      profileComplete,
      refreshProfile,
      updateProfile,
      sendOtp,
      verifyOtp,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
