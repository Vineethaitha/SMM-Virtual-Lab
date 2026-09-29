import { Navigate } from "react-router-dom";
import { CompleteProfilePage } from "@/pages/CompleteProfilePage";
import { useAuth } from "@/state/AuthContext";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { configured, loading, session, profileComplete } = useAuth();

  if (!configured) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading session…</div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!profileComplete) return <CompleteProfilePage />;
  return <>{children}</>;
}

export function RequireFaculty({ children }: { children: ReactNode }) {
  const { loading, session, profile, profileComplete } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading session…</div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!profileComplete) return <CompleteProfilePage />;
  if (profile?.role !== "faculty") return <Navigate to="/" replace />;
  return <>{children}</>;
}
