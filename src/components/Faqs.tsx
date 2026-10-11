import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { siteConfig } from "../config/site";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/** Preguntas frecuentes (acordeón). Sin FAQs publicadas en el panel, la sección no aparece. */
export default function Faqs({ items = [] }: { items?: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!siteConfig.sections.faqs || items.length === 0) return null;

  return (
    <section id="faqs" className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32" aria-label="Preguntas frecuentes">
      <SectionHeading
        kicker="Preguntas frecuentes"
        title="Antes de arrancar"
        description="Lo que suelen preguntarme antes de empezar un proyecto. Si tu duda no está aquí, escríbeme por WhatsApp o correo."
      />
      <div className="mt-10 flex flex-col gap-3">
        {items.map((f, i) => {
          const open = openId === f.id;
          return (
            <Reveal key={f.id} delay={Math.min(i * 0.05, 0.3)}>
              <div className={`glass overflow-hidden rounded-2xl transition-colors ${open ? "border-cyan-400/30" : ""}`}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : f.id)}
                  aria-expanded={open}
                  aria-controls={`faq-respuesta-${f.id}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <span className="font-display text-[15px] font-semibold text-white">{f.question}</span>
                  <Plus
                    size={18}
                    aria-hidden
                    className={`shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-45 text-cyan-300" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`faq-respuesta-${f.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-slate-400 sm:px-6">{f.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
