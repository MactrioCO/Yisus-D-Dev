import { AppWindow, Cloud, Cpu, Database, GitBranch, Globe, MonitorSmartphone, Server, ShieldCheck } from "lucide-react";
import { siteConfig, type SkillCategory } from "../config/site";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

/**
 * Icono según palabras clave del nombre de categoría. Funciona con CUALQUIER
 * nombre que se escriba en el panel (si no coincide, usa uno por defecto).
 */
function iconFor(category: string): typeof Globe {
  const c = category.toLowerCase();
  if (/front|interfaz/.test(c)) return Globe;
  if (/back|servidor|\bapi\b/.test(c)) return Server;
  if (/lenguaje|programaci/.test(c)) return Cpu;
  if (/dato|database|sql|nosql/.test(c)) return Database;
  if (/m[oó]vil|pwa|android|ios|celular/.test(c)) return MonitorSmartphone;
  if (/cloud|nube|devops|desplieg|deploy|infra/.test(c)) return Cloud;
  if (/herramienta|git|version/.test(c)) return GitBranch;
  if (/test|calidad|arquitect|seguridad|security/.test(c)) return ShieldCheck;
  if (/escritorio|desktop/.test(c)) return AppWindow;
  return Globe;
}

export default function Skills({ groups = [] }: { groups?: { category: SkillCategory; items: string[] }[] }) {
  if (!siteConfig.sections.skills) return null;
  return (
    <section id="stack" className="relative border-y border-white/[0.06] bg-white/[0.015]" aria-label="Stack tecnológico">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionHeading
          kicker="Stack"
          title="Tecnologías que uso para construir"
          description="Organizadas por categoría y sin porcentajes inventados: lo que importa es qué puedo construir con cada pieza."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, gi) => {
            const Icon = iconFor(g.category);
            return (
              <Reveal key={g.category} delay={(gi % 3) * 0.07}>
                <article className="glass card-lift group h-full rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-600/25 to-cyan-500/10 text-slate-200 transition-colors group-hover:text-cyan-300">
                      <Icon size={19} aria-hidden />
                    </span>
                    <h3 className="font-display text-[15px] font-semibold text-white">{g.category}</h3>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Tecnologías de ${g.category}`}>
                    {g.items.map((t) => (
                      <li
                        key={t}
                        className="font-mono2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
