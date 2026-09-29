import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export const OTP_LENGTH = 8;

/** One box per digit. Supports paste, backspace, and arrow keys; calls onComplete when every box is filled. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  length = OTP_LENGTH,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const setAt = (i: number, digit: string) => {
    const arr = digits.slice();
    arr[i] = digit;
    commit(arr.join(""));
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) setAt(i, "");
      else if (i > 0) {
        setAt(i - 1, "");
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    commit(text);
    focus(text.length);
  };

  return (
    <div className="flex justify-between gap-1.5 sm:gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          disabled={disabled}
          value={d}
          autoFocus={i === 0}
          onPaste={onPaste}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) return;
            if (v.length > 1) {
              commit(value.slice(0, i) + v);
              focus(i + v.length);
              return;
            }
            setAt(i, v);
            focus(i + 1);
          }}
          className={cn(
            "h-12 w-full min-w-0 rounded-xl border bg-white text-center font-mono text-xl font-semibold text-foreground outline-none transition sm:h-14",
            "focus:border-primary focus:ring-4 focus:ring-primary/15",
            d ? "border-primary/40 bg-primary/[0.03]" : "border-input",
            invalid && "border-red-300 bg-red-50/50",
          )}
        />
      ))}
    </div>
  );
}
