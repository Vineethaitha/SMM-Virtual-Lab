import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/AuthContext";

export function AccountMenu() {
  const { profile, signOut } = useAuth();
  const { pathname } = useLocation();
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      {profile?.role === "faculty" && pathname !== "/faculty" ? (
        <Link to="/faculty">
          <Button type="button" size="sm" className="h-7 rounded-full bg-primary px-3 text-white">
            Student results
          </Button>
        </Link>
      ) : null}
      <span className="hidden max-w-[140px] truncate sm:inline">{profile?.full_name}</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 rounded-full px-3"
        onClick={() => void signOut()}
      >
        Sign out
      </Button>
    </div>
  );
}
