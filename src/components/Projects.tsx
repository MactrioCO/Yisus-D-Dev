import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { siteConfig, type Project } from "../config/site";
import { GithubIcon } from "./icons";
import { ProjectCover } from "./ProjectModal";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const statusDot: Record<Project["status"], string> = {
  Producción: "bg-emerald-400",
  "Demo funcional": "bg-cyan-400",
  "En desarrollo": "bg-amber-400",
  Concepto: "bg-violet-400",
};

export default function Projects({ onOpen, items = [] }: { onOpen: (p: Project) => void; items?: Project[] }) {
  const [filter, setFilter] = useState("Todos");
  const categories = useMemo(() => ["Todos", ...Array.from(new Set(items.map((p) => p.category)))], [items]);
  const list = useMemo(() => (filter === "Todos" ? items : items.filter((p) => p.category === filter)), [filter, items]);

  if (!siteConfig.sections.projects) return null;

  return (
    <section id="proyectos" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32" aria-label="Proyectos destacados">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          kicker="Proyectos"
          title="Trabajo que habla por mí"
          description="Selección de sistemas y aplicaciones. Cada ficha explica el problema, la solución y las decisiones técnicas — sin métricas inventadas."
        />
      </div>

      <Reveal delay={0.1} className="mt-8">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar proyectos por categoría">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              onClick={() => setFilter(c)}
              className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-all ${
                filter === c
                  ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg"
                  : "border border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      <motion.div layout className="mt-8 grid gap-5 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <motion.article
              layout
              key={p.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass card-lift group flex flex-col overflow-hidden rounded-2xl"
            >
              <div className="relative h-44 overflow-hidden border-b border-white/[0.07]">
                <div className="h-full transition-transform duration-500 group-hover:scale-[1.03]">
                  {p.coverUrl ? (
                    <img src={p.coverUrl} alt={`Captura de ${p.name}`} loading="lazy" className="h-full w-full bg-black/50 object-cover" />
                  ) : (
                    <ProjectCover accent={p.accent} name={p.name} />
                  )}
                </div>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDot[p.status]}`} aria-hidden />
                  {p.status}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">{p.name}</h3>
                    {p.tagline && <p className="mt-0.5 text-[13px] text-cyan-300/90">{p.tagline}</p>}
                  </div>
                  {p.type && (
                    <span className="font-mono2 shrink-0 rounded-lg bg-white/[0.05] px-2 py-1 text-[11px] text-slate-400">{p.type}</span>
                  )}
                </div>
                {p.problem && <p className="text-sm leading-relaxed text-slate-400">{p.problem}</p>}
                {p.stack.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label={`Stack de ${p.name}`}>
                    {p.stack.slice(0, 4).map((s) => (
                      <li key={s} className="font-mono2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <button
                    onClick={() => onOpen(p)}
                    className="btn-primary inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    aria-label={`Ver detalle de ${p.name}`}
                  >
                    Conocer más <ArrowUpRight size={15} />
                  </button>
                  {p.repoUrl ? (
                    <a href={p.repoUrl} target="_blank" rel="noreferrer" aria-label={`Repositorio de ${p.name}`} className="btn-ghost grid h-[42px] w-[42px] place-items-center rounded-xl text-slate-300">
                      <GithubIcon size={17} />
                    </a>
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
