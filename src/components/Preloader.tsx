import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { asset } from "../lib/assets";

const TERMINAL_LINES = ["$ yisusddev init --portfolio", "✓ entorno listo · react + ts + tailwind", "✓ identidad visual cargada", "→ revelando contenido…"];

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [lineCount, setLineCount] = useState(1);
  const [leaving, setLeaving] = useState(false);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) {
      onDone();
      return;
    }
    let raf = 0;
    const start = performance.now();
    const MIN = 1400;
    const MAX = 2600;

    const tick = (now: number) => {
      const elapsed = now - start;
      // Progreso ligado al ciclo real: document.readyState + tiempo mínimo
      const loaded = document.readyState === "complete" ? 1 : 0.65;
      const timePart = Math.min(elapsed / MIN, 1);
      const target = Math.min(100, Math.round((timePart * 0.75 + loaded * 0.25) * 100));
      setProgress((p) => (target > p ? target : p));
      setLineCount(Math.min(TERMINAL_LINES.length, 1 + Math.floor(elapsed / 420)));
      if ((elapsed >= MIN && document.readyState === "complete") || elapsed >= MAX) {
        setProgress(100);
        setLeaving(true);
        setTimeout(onDone, 550);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onLoad = () => setProgress((p) => Math.max(p, 82));
    window.addEventListener("load", onLoad);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {!leaving ? (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05070d]"
          exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-label="Cargando portafolio de Yisus D Dev"
        >
          <div className="bg-tech-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-[42rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]"
            aria-hidden
          />
          <div className="relative w-full max-w-md px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto h-24 w-24"
            >
              <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-violet-600/60 via-blue-500/40 to-cyan-400/50 blur-md" aria-hidden />
              <img
                src={asset("logo.png")}
                alt="Logo de Yisus D Dev"
                width={96}
                height={96}
                className="relative h-24 w-24 rounded-full bg-black object-cover ring-2 ring-white/15"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono2 mt-5 text-[11px] uppercase tracking-[0.35em] text-slate-500"
            >
              inicializando entorno
            </motion.p>
            <h1 className="font-display sheen-text mt-3 text-4xl font-bold tracking-[0.12em] text-white sm:text-5xl" aria-label="Yisus D Dev">
              YISUS <span className="text-gradient">D&nbsp;DEV</span>
            </h1>
            <div className="glass mx-auto mt-6 rounded-xl p-4 text-left" aria-hidden="true">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                <span className="font-mono2 ml-2 text-[11px] text-slate-500">yisus — zsh</span>
              </div>
              <div className="font-mono2 min-h-[86px] space-y-1.5 text-[12.5px] leading-relaxed">
                {TERMINAL_LINES.slice(0, lineCount).map((l, i) => (
                  <motion.p
                    key={l}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={l.startsWith("$") ? "text-slate-200" : "text-emerald-300/90"}
                  >
                    {l}
                    {i === lineCount - 1 && <span className="ml-1 inline-block h-3.5 w-2 animate-[blink_1.1s_step-end_infinite] bg-cyan-300 align-middle" />}
                  </motion.p>
                ))}
              </div>
            </div>
            <div className="mt-6" aria-hidden="true">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-mono2 mt-2 text-xs text-slate-500">{progress}%</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="loader-exit"
          className="pointer-events-none fixed inset-0 z-[90] bg-[#05070d]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
        />
      )}
    </AnimatePresence>
  );
}
