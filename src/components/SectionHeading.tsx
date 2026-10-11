import { motion } from "framer-motion";
import Reveal from "./Reveal";

export default function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
}: {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "mx-auto text-center items-center" : "text-left items-start"} flex max-w-2xl flex-col gap-3`}>
      <Reveal>
        <span className="font-mono2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-cyan-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" aria-hidden />
          {kicker}
        </span>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{title}</h2>
      </Reveal>
      {description && (
        <Reveal delay={0.12}>
          <motion.p layout className="text-base leading-relaxed text-slate-400">
            {description}
          </motion.p>
        </Reveal>
      )}
    </div>
  );
}
