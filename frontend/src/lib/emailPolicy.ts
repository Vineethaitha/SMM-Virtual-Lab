const DOMAIN = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || "srmist.edu.in").trim().toLowerCase().replace(/^@/, "");

const EXTRA = new Set(
  (import.meta.env.VITE_EXTRA_ALLOWED_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean),
);

export const ALLOWED_EMAIL_DOMAIN = DOMAIN;

/** Returns an error message when the address may not sign in, or null when it may. */
export function emailPolicyError(email: string): string | null {
  const addr = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return "Enter a valid email address.";
  if (EXTRA.has(addr) || addr.endsWith(`@${DOMAIN}`)) return null;
  return `Use your SRM college email ending in @${DOMAIN}. Personal addresses such as Gmail can't be used.`;
}
