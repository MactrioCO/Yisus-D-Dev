import { ArrowRight, Database, Globe, LayoutTemplate, RefreshCcw, ServerCog, ShoppingCart } from "lucide-react";
import { siteConfig } from "../config/site";
import type { ServiceItem } from "../lib/cms";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const icons = [Globe, ServerCog, ShoppingCart, Database, LayoutTemplate, RefreshCcw];

export default function Services({ list = [] }: { list?: readonly ServiceItem[] }) {
  if (!siteConfig.sections.services) return null;
  return (
    <section id="servicios" className="border-y border-white/[0.06] bg-white/[0.015]" aria-label="Servicios profesionales">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <SectionHeading
          kicker="Servicios"
          title="Cómo puedo ayudarte"
          description="Oferta configurable — activa solo lo que definas como servicio real. Cada tarjeta enfoca el problema que resuelve."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={s.title} delay={(i % 3) * 0.07}>
                <article className="glass card-lift flex h-full flex-col rounded-2xl p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-600/30 to-cyan-500/15 text-cyan-300">
                    <Icon size={20} aria-hidden />
                  </span>
                  <h3 className="font-display mt-4 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.description}</p>
                  <p className="mt-3 rounded-lg bg-white/[0.03] p-3 text-[13px] leading-relaxed text-slate-500">
                    <span className="font-medium text-slate-300">Resuelve: </span>
                    {s.problem}
                  </p>
                  <a href="#contacto" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-cyan-300 transition-colors hover:text-white">
                    {s.cta} <ArrowRight size={15} aria-hidden />
                  </a>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
