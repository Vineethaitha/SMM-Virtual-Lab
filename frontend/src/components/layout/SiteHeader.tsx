import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SrmvlLogo } from "@/components/brand/SrmLogos";
import { cn } from "@/lib/utils";

/** Frosted top bar shared by the home, login, profile, and faculty pages. */
export function SiteHeader({
  title = "Software Metrics & Measurement",
  kicker = "21CSC403T",
  right,
  fixed = true,
}: {
  title?: string;
  kicker?: string;
  right?: ReactNode;
  fixed?: boolean;
}) {
  return (
    <header
      className={cn(
        "z-40 border-b border-border/50 bg-background/80 backdrop-blur-md",
        fixed ? "fixed left-0 right-0 top-0" : "sticky top-0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link to="/" className="flex items-center gap-3 sm:gap-6">
          <SrmvlLogo className="h-9 w-auto" />
          <div className="hidden items-center gap-4 border-l border-border pl-6 md:flex">
            <div className="flex flex-col leading-tight">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kicker}</p>
              <p className="text-sm font-semibold">{title}</p>
            </div>
          </div>
        </Link>
        {right ? <div className="flex items-center gap-3">{right}</div> : null}
      </div>
    </header>
  );
}
