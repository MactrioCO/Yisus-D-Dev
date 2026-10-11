import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import type { Project } from "../config/site";
import { GithubIcon } from "./icons";

const statusStyle: Record<Project["status"], string> = {
  Producción: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "Demo funcional": "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  "En desarrollo": "border-amber-400/30 bg-amber-400/10 text-amber-300",
  Concepto: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

export default function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = project ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${project.name}`}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.article
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl sm:p-8"
          >
            <button
              onClick={onClose}
              autoFocus
              className="btn-ghost absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-slate-300"
              aria-label="Cerrar detalle"
            >
              <X size={18} />
            </button>

            <div className="h-36 overflow-hidden rounded-2xl border border-white/10 sm:h-44" aria-hidden>
              {project.coverUrl ? (
                <img src={project.coverUrl} alt="" loading="lazy" className="h-full w-full bg-black/50 object-cover" />
              ) : (
                <ProjectCover accent={project.accent} name={project.name} large />
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyle[project.status]}`}>{project.status}</span>
              {project.type && (
                <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{project.type}</span>
              )}
            </div>

            <h3 className="font-display mt-3 text-2xl font-bold text-white">{project.name}</h3>
            {project.tagline && <p className="mt-1 text-sm text-cyan-300">{project.tagline}</p>}

            {(project.problem || project.solution || project.architecture.length > 0 || project.features.length > 0 || project.challenges.length > 0) && (
              <dl className="mt-6 space-y-5 text-sm leading-relaxed">
                {project.problem && (
                  <div>
                    <dt className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Problema</dt>
                    <dd className="mt-1 text-slate-300">{project.problem}</dd>
                  </div>
                )}
                {project.solution && (
                  <div>
                    <dt className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Solución</dt>
                    <dd className="mt-1 text-slate-300">{project.solution}</dd>
                  </div>
                )}
                {project.architecture.length > 0 && (
                  <div>
                    <dt className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Arquitectura</dt>
                    <dd className="mt-2 flex flex-col gap-1.5">
                      {project.architecture.map((a) => (
                        <span key={a} className="font-mono2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-300">▸ {a}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {project.features.length > 0 && (
                  <div>
                    <dt className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Funcionalidades</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {project.features.map((f) => (
                        <span key={f} className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-200">{f}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {project.challenges.length > 0 && (
                  <div>
                    <dt className="font-mono2 text-[11px] uppercase tracking-[0.2em] text-slate-500">Retos técnicos</dt>
                    <dd className="mt-1 list-disc space-y-1 pl-5 text-slate-400">
                      {project.challenges.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {project.demoUrl || project.repoUrl ? (
              <div className="mt-7 flex flex-wrap gap-3">
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
                    Ver demo <ExternalLink size={15} />
                  </a>
                )}
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
                    <GithubIcon size={16} /> Repositorio
                  </a>
                )}
              </div>
            ) : (
              <p className="font-mono2 mt-7 rounded-xl border border-dashed border-white/15 px-4 py-3 text-xs text-slate-500">
                {project.status === "Producción"
                  ? "Sistema en producción sin acceso público — puedes solicitar una demostración en Contacto."
                  : "Sin enlaces públicos por ahora — sigue el avance en Novedades."}
              </p>
            )}
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ProjectCover({ accent, name, large = false }: { accent: string; name: string; large?: boolean }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${large ? "" : ""}`}
      style={{ background: `linear-gradient(135deg, #0a0e17 0%, ${accent}26 55%, #0a0e17 100%)` }}
    >
      <div className="bg-tech-grid absolute inset-0 opacity-70" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl" style={{ background: `${accent}55` }} />
      <div className="font-mono2 absolute left-3 top-3 flex gap-1.5" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
      </div>
      <span className="font-display text-4xl font-bold tracking-tight text-white/90" style={{ textShadow: `0 8px 30px ${accent}66` }} aria-hidden>
        {initials}
      </span>
      <span className="font-mono2 absolute bottom-3 left-3 right-3 truncate text-[11px] text-white/50">~/proyectos/{name.toLowerCase().replace(/\s+/g, "-")}</span>
      <span className="absolute inset-x-8 bottom-8 flex gap-1" aria-hidden>
        {[0.9, 0.5, 0.75, 0.35, 0.6].map((o, i) => (
          <span key={i} className="h-1 flex-1 rounded-full" style={{ background: accent, opacity: o }} />
        ))}
      </span>
    </div>
  );
}

export function ArrowIcon() {
  return <ArrowUpRight size={16} aria-hidden />;
}
