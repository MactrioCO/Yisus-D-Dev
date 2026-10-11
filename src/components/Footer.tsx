import { ArrowUp } from "lucide-react";
import { navLinks, siteConfig, type SocialLink } from "../config/site";
import { socialIcon } from "./icons";
import Logo from "./Logo";
import Reveal from "./Reveal";

export default function Footer({ socials = [], links = navLinks, contact = { email: "", whatsapp: "" } }: {
  socials?: SocialLink[]; links?: typeof navLinks; contact?: { email: string; whatsapp: string };
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.07] bg-[#04060b]" aria-label="Pie de página">
      <Reveal className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              {siteConfig.tagline}. Software real, interfaces cuidadas y sistemas listos para crecer.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.filter((s) => s.href).map((s) => {
                const Icon = socialIcon(s.id);
                return (
                  <a key={`${s.id}-${s.href}`} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="btn-ghost grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:text-white">
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>
          <nav aria-label="Secciones del portafolio">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.25em] text-slate-500">Navegación</p>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {links.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="text-sm text-slate-400 transition-colors hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-mono2 text-[11px] uppercase tracking-[0.25em] text-slate-500">Contacto</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {contact.email && (
                <li><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></li>
              )}
              {contact.whatsapp && (
                <li><a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a></li>
              )}
              <li className="font-mono2 text-xs text-slate-600">Respuesta 24–48 h laborables</li>
            </ul>
            <a href="#inicio" className="btn-ghost mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white" aria-label="Volver al inicio">
              <ArrowUp size={15} /> Regresar al inicio
            </a>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 sm:flex-row">
          <p className="text-[13px] text-slate-500">© {year} {siteConfig.brand}. Todos los derechos reservados.</p>
          <p className="font-mono2 text-[11px] text-slate-600">
            diseñado + programado a mano · react · ts · tailwind
            <a href="#/owner" aria-label="Acceso privado" title="Acceso privado"
              className="ml-1 text-slate-700 transition-colors hover:text-cyan-300">·</a>
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
