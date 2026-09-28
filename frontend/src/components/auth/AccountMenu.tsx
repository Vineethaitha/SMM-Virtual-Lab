import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/AuthContext";

export function AccountMenu({ light }: { light?: boolean }) {
  const { profile, signOut } = useAuth();
  return (
    <div className={`flex items-center gap-2 text-xs ${light ? "text-white/90" : "text-slate-600"}`}>
      {profile?.role === "faculty" ? (
        <Link to="/faculty" className={light ? "underline" : "font-medium text-primary"}>
          Faculty
        </Link>
      ) : null}
      <span className="hidden max-w-[140px] truncate sm:inline">{profile?.full_name}</span>
      <Button
        type="button"
        size="sm"
        variant={light ? "outline" : "outline"}
        className={light ? "h-7 border-white/40 bg-white/10 text-white hover:bg-white/20" : "h-7"}
        onClick={() => void signOut()}
      >
        Sign out
      </Button>
    </div>
  );
}
