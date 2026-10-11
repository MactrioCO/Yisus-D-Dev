import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarDays, X } from "lucide-react";
import { useState } from "react";
import type { NewsPost } from "../lib/cms";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function News({ posts }: { posts: NewsPost[] }) {
  const [sel, setSel] = useState<NewsPost | null>(null);

  // Sin publicaciones reales, la sección no aparece (igual que el resto del sitio)
  if (posts.length === 0) return null;

  return (
    <section id="novedades" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32" aria-label="Novedades">
      <SectionHeading
        kicker="Novedades"
        title="Lo último del taller"
        description="Lanzamientos, mejoras y avances del trabajo en curso."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((n, i) => (
            <Reveal key={n.id} delay={(i % 3) * 0.07}>
              <article className="glass card-lift flex h-full flex-col overflow-hidden rounded-2xl">
                {n.cover_url ? (
                  <img src={n.cover_url} alt={`Portada de ${n.title}`} loading="lazy" className="h-40 w-full bg-black/40 object-cover" />
                ) : (
                  <div className="bg-tech-grid h-24 border-b border-white/[0.07] bg-gradient-to-br from-violet-600/20 to-cyan-500/10" aria-hidden />
                )}
                <div className="flex flex-1 flex-col gap-2.5 p-6">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 font-medium text-cyan-300">{n.category}</span>
                    {n.published_at && (
                      <span className="font-mono2 inline-flex items-center gap-1 text-slate-500">
                        <CalendarDays size={13} aria-hidden />
                        {new Date(n.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug text-white">{n.title}</h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">{n.excerpt}</p>
                  <button onClick={() => setSel(n)} aria-label={`Leer ${n.title}`}
                    className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-cyan-300 hover:text-white">
                    Leer más <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

      <AnimatePresence>
        {sel && (
          <motion.div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog" aria-modal="true" aria-label={sel.title}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSel(null)} aria-hidden />
            <motion.article
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl sm:p-8">
              <button onClick={() => setSel(null)} autoFocus aria-label="Cerrar"
                className="btn-ghost absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-slate-300">
                <X size={18} />
              </button>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">{sel.category}</span>
              <h3 className="font-display mt-3 pr-10 text-2xl font-bold text-white">{sel.title}</h3>
              {sel.published_at && (
                <p className="font-mono2 mt-1 text-xs text-slate-500">{new Date(sel.published_at).toLocaleDateString()}</p>
              )}
              {sel.cover_url && <img src={sel.cover_url} alt={`Portada de ${sel.title}`} className="mt-5 w-full rounded-2xl border border-white/10" />}
              <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-slate-300">{sel.content || sel.excerpt}</p>
              {sel.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {sel.tags.map((t) => (
                    <span key={t} className="font-mono2 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-slate-300">{t}</span>
                  ))}
                </div>
              )}
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
