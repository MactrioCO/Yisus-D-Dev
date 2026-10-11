import { Boxes, Crosshair, Layers } from "lucide-react";
import { profile, siteConfig } from "../config/site";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const icons = [Crosshair, Layers, Boxes];

export default function About() {
  if (!siteConfig.sections.about) return null;
  return (
    <section id="sobre-mi" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32" aria-label="Sobre mí">
      <SectionHeading
        kicker="Sobre mí"
        title="Desarrollador con criterio de producto"
        description={profile.aboutIntro}
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {profile.focus.map((f, i) => {
          const Icon = icons[i % icons.length];
          return (
            <Reveal key={f.title} delay={i * 0.08}>
              <article className="glass card-lift h-full rounded-2xl p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-600/30 to-cyan-500/15 text-cyan-300">
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="font-display mt-4 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.description}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
      <Reveal delay={0.15} className="mt-6">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <p className="font-mono2 text-xs uppercase tracking-[0.25em] text-cyan-300">Mi enfoque</p>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-300">{profile.aboutApproach}</p>
        </div>
      </Reveal>
    </section>
  );
}
