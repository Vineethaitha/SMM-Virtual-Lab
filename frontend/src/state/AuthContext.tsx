import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
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
    loadProfile(uid).then((p) => {
      setProfile(p);
      setLoading(false);
    });
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
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    return error?.message ?? null;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
    return error?.message ?? null;
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
