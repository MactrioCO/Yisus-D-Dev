import { processSteps, siteConfig } from "../config/site";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function Process() {
  if (!siteConfig.sections.process) return null;
  return (
    <section id="proceso" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32" aria-label="Proceso de trabajo">
      <SectionHeading
        kicker="Proceso"
        title="Cómo abordo un proyecto"
        description="Un marco flexible, no una camisa de fuerza: cada proyecto adapta estas etapas a su realidad."
        align="center"
      />
      <ol className="relative mx-auto mt-14 max-w-3xl space-y-0">
        <span className="absolute bottom-6 left-[27px] top-6 w-px bg-gradient-to-b from-violet-500/60 via-blue-500/40 to-cyan-400/40 sm:left-[31px]" aria-hidden />
        {processSteps.map((s, i) => (
          <Reveal key={s.n} delay={0.04 * i}>
            <li className="relative flex gap-5 pb-8 last:pb-0 sm:gap-6">
              <span className="font-mono2 relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-[#0a0e17] text-sm font-bold text-cyan-300 shadow-[0_0_24px_-6px_rgba(139,92,246,0.5)] sm:h-16 sm:w-16">
                {s.n}
              </span>
              <div className="glass card-lift flex-1 rounded-2xl p-5 sm:p-6">
                <h3 className="font-display text-base font-semibold text-white sm:text-lg">
                  <span className="mr-2 text-slate-600">{String(i + 1).padStart(2, "0")}.</span>
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.description}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
