import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pctChange(before: number, after: number): number | null {
  if (before === 0) return after === 0 ? 0 : null;
  return ((after - before) / Math.abs(before)) * 100;
}

export function formatNum(n: number, digits = 1): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(digits);
}
