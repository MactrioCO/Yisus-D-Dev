import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { profile, type SocialLink } from "../config/site";
import { staggerChild, staggerParent } from "../lib/motion";
import { socialIcon } from "./icons";

const TERMINAL_SCRIPT = [
  { text: "$ pnpm dev", cls: "text-slate-100" },
  { text: "▲ entorno listo en 412ms", cls: "text-emerald-300" },
  { text: "→ compilando rutas …", cls: "text-slate-400" },
  { text: "✓ / · /proyectos · /contacto", cls: "text-cyan-300" },
  { text: "✓ deploy preview generada", cls: "text-violet-300" },
];

function useTypewriter(active: boolean) {
  const [lines, setLines] = useState(1);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLines(TERMINAL_SCRIPT.length);
      return;
    }
    if (lines >= TERMINAL_SCRIPT.length) return;
    const t = setTimeout(() => setLines((l) => l + 1), 650);
    return () => clearTimeout(t);
  }, [active, lines]);
  return lines;
}

export default function Hero({ started, socials = [] }: { started: boolean; socials?: SocialLink[] }) {
  const visibleLines = useTypewriter(started);
  const visibleSocials = socials.filter((s) => s.href);

  return (
    <section id="inicio" className="relative flex min-h-[100svh] items-center overflow-hidden pt-[68px]" aria-label="Presentación">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-16">
        {/* Columna texto */}
        <motion.div variants={staggerParent} initial="hidden" animate={started ? "show" : "hidden"} className="flex flex-col items-start gap-6">
          <motion.div variants={staggerChild}>
            <span className="glass inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-xs text-slate-300">
              <span className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
                YISUS D DEV
              </span>
              <span className="font-mono2 tracking-wide text-slate-400">{profile.specialty}</span>
            </span>
          </motion.div>

          <motion.h1 variants={staggerChild} className="font-display max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
            {profile.headline.split("premium")[0]}
            <span className="text-gradient">premium.</span>
          </motion.h1>

          <motion.p variants={staggerChild} className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            {profile.heroDescription}
          </motion.p>

          <motion.div variants={staggerChild} className="font-mono2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden /> {profile.role}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} aria-hidden /> {profile.location}
            </span>
          </motion.div>

          <motion.div variants={staggerChild} className="flex flex-wrap items-center gap-3 pt-1">
            <a href="#proyectos" className="btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white">
              Explorar proyectos
              <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </a>
            <a href="#contacto" className="btn-ghost inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white">
              Contactarme
            </a>
          </motion.div>

          {visibleSocials.length > 0 && (
            <motion.div variants={staggerChild} className="flex items-center gap-2 pt-1">
              {visibleSocials.map((s) => {
                const Icon = socialIcon(s.id);
                return (
                  <a
                    key={`${s.id}-${s.href}`}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="btn-ghost grid h-10 w-10 place-items-center rounded-xl text-slate-300 hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Columna terminal */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={started ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-500/15 blur-2xl" aria-hidden />
          <div className="glass relative overflow-hidden rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="font-mono2 ml-2 text-xs text-slate-500">yisus — dev · zsh</span>
              <span className="font-mono2 ml-auto hidden rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-500 sm:inline">decorativa</span>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              {/* code panel */}
              <pre className="font-mono2 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/40 p-4 text-[12.5px] leading-relaxed" aria-label="Ejemplo de código decorativo">
                <code>
                  <span className="text-violet-300">const</span> <span className="text-cyan-200">dev</span>{" "}
                  <span className="text-slate-500">=</span> <span className="text-slate-200">await</span>{" "}
                  <span className="text-emerald-300">YisusDDev</span>
                  <span className="text-slate-400">.create</span>
                  <span className="text-slate-500">({"{"}</span>
                  {"\n  "}  <span className="text-slate-300">enfoque</span>
                  <span className="text-slate-500">:</span> <span className="text-amber-200">"producto real"</span>
                  <span className="text-slate-500">,</span>
                  {"\n  "}  <span className="text-slate-300">stack</span>
                  <span className="text-slate-500">:</span> <span className="text-slate-500">[</span>
                  <span className="text-amber-200">"react"</span>
                  <span className="text-slate-500">,</span> <span className="text-amber-200">"node"</span>
                  <span className="text-slate-500">,</span> <span className="text-amber-200">"sql"</span>
                  <span className="text-slate-500">]</span>
                  {"\n"}
                  <span className="text-slate-500">{"}"});</span>
                </code>
              </pre>
              {/* terminal animada */}
              <div className="font-mono2 min-h-[132px] rounded-xl border border-white/[0.07] bg-black/50 p-4 text-[12.5px] leading-relaxed" aria-hidden="true">
                {TERMINAL_SCRIPT.slice(0, visibleLines).map((l) => (
                  <p key={l.text} className={l.cls}>
                    {l.text}
                  </p>
                ))}
                <span className="mt-1 inline-block h-4 w-2 animate-[blink_1.1s_step-end_infinite] bg-cyan-300 align-middle" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5" aria-hidden>
                  {["#8b5cf6", "#3b82f6", "#22d3ee"].map((c) => (
                    <span key={c} className="h-1.5 w-8 rounded-full" style={{ background: c, opacity: 0.8 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#sobre-mi"
        initial={{ opacity: 0 }}
        animate={started ? { opacity: 1 } : {}}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-slate-500 transition-colors hover:text-white sm:flex"
        aria-label="Descubrir la siguiente sección"
      >
        <span className="font-mono2 text-[11px] uppercase tracking-[0.3em]">scroll</span>
        <motion.span animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="grid h-9 w-9 place-items-center rounded-full border border-white/15">
          <ArrowDown size={16} />
        </motion.span>
      </motion.a>
    </section>
  );
}
