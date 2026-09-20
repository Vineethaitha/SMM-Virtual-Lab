import { cn } from "@/lib/utils";

const asset = (name: string) => `${import.meta.env.BASE_URL}${name}`;

export function SrmvlLogo({
  className = "h-9 w-auto",
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <img
      src={asset(markOnly ? "srmvl-logo-only.png" : "srmvl-logo.png")}
      alt="SRM Virtual Labs"
      className={cn("object-contain", className)}
    />
  );
}

export function SrmOfficialLogo({ className = "h-14 w-auto" }: { className?: string }) {
  return (
    <img
      src={asset("srm-official-logo.jpg")}
      alt="SRM Institute of Science and Technology"
      className={cn("object-contain mix-blend-multiply", className)}
    />
  );
}
