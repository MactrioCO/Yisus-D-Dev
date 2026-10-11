import { Award, Briefcase, GraduationCap } from "lucide-react";
import { siteConfig, type TimelineEntry } from "../config/site";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

function Timeline({ title, icon: Icon, entries }: { title: string; icon: typeof Briefcase; entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2.5 text-lg font-semibold text-white">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-300">
          <Icon size={17} aria-hidden />
        </span>
        {title}
      </h3>
      <ol className="mt-5 space-y-4">
        {entries.map((e) => (
          <li key={e.title} className="glass rounded-2xl p-5">
            <p className="font-mono2 text-xs text-cyan-300">{e.period}</p>
            <p className="font-display mt-1 font-semibold text-white">{e.title}</p>
            <p className="text-[13px] text-slate-500">{e.org}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{e.description}</p>
            {e.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.tags.map((t) => (
                  <span key={t} className="font-mono2 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-slate-300">{t}</span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Experience({ exp = [], edu = [], certs = [] }: {
  exp?: TimelineEntry[]; edu?: TimelineEntry[]; certs?: TimelineEntry[];
}) {
  if (!siteConfig.sections.experience) return null;

  return (
    <section id="experiencia" className="border-y border-white/[0.06] bg-white/[0.015]" aria-label="Experiencia y formación">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionHeading
          kicker="Trayectoria"
          title="Experiencia y formación"
          description="Trayectoria, formación y certificaciones que respaldan el trabajo."
        />
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <Reveal><Timeline title="Experiencia" icon={Briefcase} entries={exp} /></Reveal>
          <Reveal delay={0.08}><Timeline title="Formación" icon={GraduationCap} entries={edu} /></Reveal>
          <Reveal delay={0.16}><Timeline title="Certificaciones" icon={Award} entries={certs} /></Reveal>
        </div>
      </div>
    </section>
  );
}
