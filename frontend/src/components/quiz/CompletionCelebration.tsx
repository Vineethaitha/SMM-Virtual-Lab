import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ListChecks, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#2563eb", "#60a5fa", "#f59e0b", "#fbbf24", "#10b981", "#8b5cf6", "#f472b6"];

function useCountUp(target: number, ms = 1400, delay = 500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delay]);
  return value;
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.9,
        duration: 2.6 + Math.random() * 2.2,
        drift: (Math.random() - 0.5) * 220,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        round: Math.random() > 0.6,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            backgroundColor: p.color,
            borderRadius: p.round ? 999 : 2,
          }}
          initial={{ y: "-10vh", x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", x: p.drift, rotate: p.spin, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

function Burst() {
  const rays = useMemo(() => Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2), []);
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2">
      {rays.map((a, i) => (
        <motion.span
          key={i}
          className="absolute block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: COLORS[i % COLORS.length] }}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
          animate={{ x: Math.cos(a) * 150, y: Math.sin(a) * 150, scale: [0.4, 1.2, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const shown = useCountUp(pct);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <motion.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums">{shown}%</span>
        <span className="text-xs text-muted-foreground">
          {score} / {total}
        </span>
      </div>
    </div>
  );
}

export function CompletionCelebration({
  kicker,
  heading,
  message,
  score,
  total,
  primaryLabel,
  onPrimary,
  onReview,
  onClose,
  closeLabel = "Back to lab",
}: {
  kicker: string;
  heading: string;
  message: string;
  score: number;
  total: number;
  primaryLabel?: string;
  onPrimary?: () => void;
  onReview: () => void;
  onClose: () => void;
  closeLabel?: string;
}) {
  const pct = total > 0 ? score / total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
  const words = heading.split(" ");

  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-background bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100 via-background to-background text-foreground">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-[38rem] w-[38rem] shrink-0 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(37,99,235,0.10),transparent,rgba(245,158,11,0.12),transparent)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <Confetti />
      <Burst />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-5 py-8">
          <motion.div
            className="relative w-full max-w-xl rounded-3xl border border-border/60 bg-white/85 px-6 py-8 text-center shadow-2xl shadow-primary/10 backdrop-blur-sm sm:px-10"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-[0_20px_50px_-12px_rgba(245,158,11,0.65)]"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <Trophy className="h-10 w-10" strokeWidth={2.2} />
              </motion.div>
            </motion.div>

            <div className="mt-4 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 12, delay: 0.55 + i * 0.15 }}
                >
                  <Star
                    className={i < stars ? "h-7 w-7 fill-amber-400 text-amber-400" : "h-7 w-7 text-slate-200"}
                    strokeWidth={1.5}
                  />
                </motion.div>
              ))}
            </div>

            <motion.p
              className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {kicker}
            </motion.p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {words.map((w, i) => (
                <motion.span
                  key={`${w}-${i}`}
                  className="mr-[0.25em] inline-block last:mr-0"
                  initial={{ opacity: 0, y: 24, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.5 + i * 0.09 }}
                >
                  {w}
                </motion.span>
              ))}
            </h2>
            <motion.p
              className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {message}
            </motion.p>

            <motion.div
              className="mt-6 flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 16 }}
            >
              <ScoreRing score={score} total={total} />
            </motion.div>

            <motion.div
              className="mt-7 flex flex-wrap justify-center gap-2.5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              {primaryLabel && onPrimary ? (
                <Button size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20" onClick={onPrimary}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : null}
              <Button size="lg" variant="outline" className="rounded-full bg-white" onClick={onReview}>
                <ListChecks className="h-4 w-4" />
                Review answers
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full text-muted-foreground"
                onClick={onClose}
              >
                {closeLabel}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
