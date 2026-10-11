import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/** Fondo tecnológico global: grid, luces ambientales, dots. Baja intensidad, solo transform/opacity. */
export default function BackgroundFX() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* grid técnica */}
      <div className="bg-tech-grid absolute inset-0" />
      {/* luces ambientales */}
      <motion.div
        className="absolute -top-40 left-1/2 h-[34rem] w-[60rem] max-w-none -translate-x-1/2 rounded-full bg-violet-700/15 blur-[130px]"
        animate={reduced ? {} : { opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute right-[-10rem] top-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[110px]" />
      <div className="absolute bottom-[-8rem] left-[-8rem] h-[24rem] w-[24rem] rounded-full bg-blue-600/10 blur-[110px]" />
      {/* línea de progreso de scroll */}
      <motion.div className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" style={{ scaleX: smooth }} />
    </div>
  );
}
