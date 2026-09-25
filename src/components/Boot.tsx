import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOSStore } from "../store/useOSStore";

const TARGET = "KLORK.OS";
const CHAR_SET = "0123456789ABCDEF";
const TICK_MS = 55;
const SCRAMBLE_MS = 2200;
const STAGGER_MS = 80;
const HOLD_MS = 1800;

interface ScrambleChar {
  char: string;
  active: boolean;
  justResolved: boolean;
}

function randomChar(): string {
  return CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
}

function isReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function initChars(): ScrambleChar[] {
  if (isReducedMotion()) {
    return Array.from({ length: TARGET.length }, (_, i) => ({
      char: TARGET[i],
      active: true,
      justResolved: false,
    }));
  }
  return Array.from({ length: TARGET.length }, () => ({
    char: randomChar(),
    active: false,
    justResolved: false,
  }));
}

function initPhase(): "scramble" | "ready" {
  return isReducedMotion() ? "ready" : "scramble";
}

function initResolved(): boolean[] {
  if (isReducedMotion()) {
    return new Array(TARGET.length).fill(true);
  }
  return new Array(TARGET.length).fill(false);
}

export default function Boot() {
  const setBooted = useOSStore((s) => s.setBooted);
  const [chars, setChars] = useState<ScrambleChar[]>(() => initChars());
  const [phase, setPhase] = useState<"scramble" | "ready">(() =>
    initPhase()
  );
  const done = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const resolvedRef = useRef<boolean[]>(initResolved());

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setBooted(true);
  }, [setBooted]);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setChars(
        Array.from({ length: TARGET.length }, (_, i) => ({
          char: TARGET[i],
          active: true,
          justResolved: false,
        }))
      );
      setPhase("ready");
      setTimeout(finish, HOLD_MS);
    } else {
      startRef.current = performance.now();
      resolvedRef.current = new Array(TARGET.length).fill(false);

      intervalRef.current = setInterval(() => {
        const elapsed = performance.now() - startRef.current;

        const next: ScrambleChar[] = Array.from(
          { length: TARGET.length },
          (_, i) => {
            const localElapsed = elapsed - i * STAGGER_MS;

            if (localElapsed < 0) {
              return { char: randomChar(), active: false, justResolved: false };
            }

            if (localElapsed >= SCRAMBLE_MS) {
              const wasActive = resolvedRef.current[i];
              return {
                char: TARGET[i],
                active: true,
                justResolved: !wasActive,
              };
            }

            return { char: randomChar(), active: true, justResolved: false };
          }
        );

        next.forEach((c, i) => {
          if (c.active) resolvedRef.current[i] = true;
        });

        setChars(next);

        if (next.every((c) => c.active)) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPhase("ready");
          setTimeout(finish, HOLD_MS);
        }
      }, TICK_MS);
    }

    const onKey = () => finish();
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [finish]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onPointerDown={finish}
      className="fixed inset-0 z-[9000] flex cursor-pointer flex-col items-center justify-center bg-black select-none overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute h-[420px] w-[420px] rounded-full opacity-25 blur-[120px]"
        style={{
          background:
            "conic-gradient(from 90deg, #8b5cf6, #06b6d4, #d946ef, #8b5cf6)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }}
      />

      <div className="relative flex flex-col items-center justify-center gap-6">
        <AnimatePresence mode="wait">
          {phase === "scramble" ? (
            <motion.div
              key="scramble"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-[6px]"
              style={{
                fontFamily:
                  "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
              }}
            >
              {chars.map((c, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  style={{
                    color: c.active
                      ? `var(--accent, #8b5cf6)`
                      : "rgba(255,255,255,0.12)",
                    textShadow: c.active
                      ? "0 0 14px var(--accent, #8b5cf6), 0 0 40px rgba(139,92,246,0.3)"
                      : "none",
                    fontWeight: 700,
                    fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                  animate={
                    c.justResolved
                      ? { scale: [1.25, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {c.char}
                </motion.span>
              ))}
            </motion.div>
          ) : (
            <motion.span
              key="ready"
              initial={{ opacity: 0, letterSpacing: "0.3em" }}
              animate={{ opacity: 1, letterSpacing: "0.05em" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-bold whitespace-nowrap"
              style={{
                fontFamily:
                  "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
                color: "var(--accent, #8b5cf6)",
                textShadow:
                  "0 0 20px var(--accent, #8b5cf6), 0 0 60px rgba(139,92,246,0.4)",
                fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
                lineHeight: 1,
              }}
            >
              KLORK.OS
            </motion.span>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={
              phase === "ready"
                ? { background: "#34d399", boxShadow: "0 0 8px #34d399" }
                : {
                    background: "#8b5cf6",
                    animation: "klork-pulse 1.1s ease-in-out infinite",
                  }
            }
          />
          <span className="font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">
            {phase === "ready" ? "system ready" : "initializing..."}
          </span>
        </motion.div>

        <p className="absolute bottom-8 font-mono text-[9.5px] tracking-[0.15em] text-white/20 uppercase">
          press any key to skip
        </p>
      </div>
    </motion.div>
  );
}
