import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navLinks, siteConfig } from "../config/site";
import Logo from "./Logo";

export default function Navbar({ active, links = navLinks }: { active: string; links?: typeof navLinks }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const logoClicks = useRef(0);

  // Acceso discreto al panel: triple clic en el logo → #/owner.
  // (Oscuridad, no seguridad: la protección real es Auth + RLS.)
  // OJO: se usa preventDefault al disparar, porque la navegación nativa
  // del <a href="#inicio"> ocurre DESPUÉS del handler y la anularía.
  const onLogoClick = (e: React.MouseEvent) => {
    logoClicks.current += 1;
    if (logoClicks.current === 1) setTimeout(() => { logoClicks.current = 0; }, 800);
    if (logoClicks.current >= 3) {
      e.preventDefault();
      logoClicks.current = 0;
      window.location.hash = "#/owner";
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[70] transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-[#05070d]/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8" aria-label="Navegación principal">
        <a href="#inicio" aria-label="Yisus D Dev — ir al inicio" className="shrink-0" onClick={onLogoClick}>
          <Logo />
        </a>

        <ul className="hidden min-w-0 items-center gap-0.5 xl:flex">
          {links.map((l) => (
            <li key={l.id} className="shrink-0">
              <a
                href={`#${l.id}`}
                aria-current={active === l.id ? "true" : undefined}
                className={`relative whitespace-nowrap rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
                  active === l.id ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
                {active === l.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-2.5 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          {siteConfig.availability.enabled && (
            <span className="hidden whitespace-nowrap rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 2xl:inline-flex 2xl:items-center 2xl:gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" style={{ animation: "pulse-dot 2s infinite" }} aria-hidden />
              {siteConfig.availability.label}
            </span>
          )}
          <a href="#contacto" className="btn-primary whitespace-nowrap rounded-xl px-4 py-2 text-[13.5px] font-semibold text-white">
            Contactarme
          </a>
        </div>

        <button
          className="btn-ghost grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white xl:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-movil"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-5 top-[68px] w-[min(290px,calc(100vw-2.5rem))] origin-top-right rounded-2xl border border-white/10 bg-[#0a0e18]/95 p-2 shadow-2xl backdrop-blur-xl sm:right-8 xl:hidden"
          >
            <ul className="flex flex-col">
              {links.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      active === l.id ? "bg-white/[0.07] text-white" : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#contacto"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 block rounded-xl px-3.5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Contactarme
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
