import { CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { siteConfig, type SocialLink } from "../config/site";
import { isSupabaseConfigured, saveContactMessage } from "../lib/supabase";
import { socialIcon } from "./icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

interface Errors { name?: string; email?: string; subject?: string; message?: string; }
interface ContactInfo { email: string; whatsapp: string }

type SendState = "idle" | "sending" | "sent-db" | "sent-mailto";

export default function Contact({ socials = [], contact = { email: "", whatsapp: "" } }: { socials?: SocialLink[]; contact?: ContactInfo }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState(""); // trampa anti-bots: los humanos no lo ven
  const sent = state === "sent-db" || state === "sent-mailto";
  if (!siteConfig.sections.contact) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = (): boolean => {
    const er: Errors = {};
    if (form.name.trim().length < 2) er.name = "Escribe tu nombre (mínimo 2 caracteres).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = "Escribe un correo válido.";
    if (form.subject.trim().length < 3) er.subject = "Añade un asunto descriptivo.";
    if (form.message.trim().length < 10) er.message = "Cuéntame un poco más (mínimo 10 caracteres).";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSendError(null);
    if (!validate()) return;
    // Honeypot: si un bot lo rellenó, fingimos éxito sin guardar nada.
    if (honeypot) {
      setState("sent-db");
      return;
    }
    if (isSupabaseConfigured) {
      setState("sending");
      try {
        await saveContactMessage(form);
        setState("sent-db");
      } catch (err) {
        setState("idle");
        setSendError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
      }
      return;
    }
    // Sin Supabase: NO fingimos envío. Abrimos el cliente de correo con el contenido.
    const to = contact.email || "";
    const subject = encodeURIComponent(`[Portafolio] ${form.subject}`);
    const body = encodeURIComponent(`Nombre: ${form.name}\nCorreo: ${form.email}\n\n${form.message}`);
    if (to) window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    setState("sent-mailto");
  };

  const reset = () => {
    setForm({ name: "", email: "", subject: "", message: "" });
    setErrors({});
    setSendError(null);
    setState("idle");
  };

  const inputCls = (bad?: string) =>
    `w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-400/60 ${
      bad ? "border-red-500/60" : "border-white/10"
    }`;

  return (
    <section id="contacto" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32" aria-label="Contacto">
      <SectionHeading
        kicker="Contacto"
        title="¿Construimos algo juntos?"
        description="Cuéntame tu idea, tu sistema o lo que necesitas optimizar. Respondo con propuesta clara y sin compromiso."
        align="center"
      />
      <div className="mx-auto mt-10 grid max-w-4xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="h-full">
          <aside className="glass flex h-full flex-col gap-4 rounded-2xl p-6 sm:p-7">
            <h3 className="font-display text-lg font-semibold text-white">Vías directas</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              {contact.email
                ? `Escríbeme a ${contact.email} o usa el formulario.`
                : "Cuéntame tu caso usando el formulario: llega directo a mi bandeja."}
            </p>
            <div className="flex flex-col gap-2.5">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="btn-ghost inline-flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white">
                  <Mail size={17} className="text-cyan-300" /> {contact.email}
                </a>
              )}
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-400/20">
                  <MessageCircle size={17} /> WhatsApp directo
                </a>
              )}
              {socials.length > 0 && (
                <div className="flex gap-2">
                  {socials.filter((s) => s.href).map((s) => {
                    const Icon = socialIcon(s.id);
                    return (
                      <a key={`${s.id}-${s.href}`} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="btn-ghost grid h-10 w-10 place-items-center rounded-xl text-slate-300">
                        <Icon size={17} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-auto rounded-xl bg-gradient-to-br from-violet-600/15 to-cyan-500/10 p-4 text-[13px] leading-relaxed text-slate-400">
              Tiempo de respuesta habitual: <span className="font-semibold text-white">24–48 h laborables</span> (orientativo, no un SLA).
            </div>
          </aside>
        </Reveal>

        <Reveal delay={0.08} className="h-full">
          {sent ? (
            <div className="glass flex h-full flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center" role="status">
              <CheckCircle2 size={40} className="text-emerald-400" aria-hidden />
              <h3 className="font-display text-xl font-bold text-white">¡Mensaje recibido!</h3>
              <p className="max-w-sm text-sm leading-relaxed text-slate-400">
                {state === "sent-db"
                  ? "Tu mensaje quedó guardado y lo revisaré a la brevedad. ¡Gracias por escribir!"
                  : contact.email
                    ? "Se abrió tu cliente de correo con el mensaje listo para enviar. ¡Gracias por escribir!"
                    : "No hay servicio de envío configurado todavía, así que no se simuló ningún envío. Configura Supabase (ver README) para activar el buzón real."}
              </p>
              <button onClick={reset} className="btn-ghost mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
                Escribir otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="glass flex h-full flex-col gap-4 rounded-2xl p-6 sm:p-7" aria-label="Formulario de contacto">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-[13px] font-medium text-slate-300">Nombre *</label>
                  <input id="c-name" autoComplete="name" value={form.name} onChange={set("name")} placeholder="Tu nombre" className={inputCls(errors.name)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "e-name" : undefined} />
                  {errors.name && <p id="e-name" role="alert" className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-[13px] font-medium text-slate-300">Correo *</label>
                  <input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="tucorreo@ejemplo.com" className={inputCls(errors.email)} aria-invalid={!!errors.email} aria-describedby={errors.email ? "e-email" : undefined} />
                  {errors.email && <p id="e-email" role="alert" className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="c-subject" className="mb-1.5 block text-[13px] font-medium text-slate-300">Asunto *</label>
                <input id="c-subject" value={form.subject} onChange={set("subject")} placeholder="Ej. Sistema de inventario para mi negocio" className={inputCls(errors.subject)} aria-invalid={!!errors.subject} aria-describedby={errors.subject ? "e-subject" : undefined} />
                {errors.subject && <p id="e-subject" role="alert" className="mt-1.5 text-xs text-red-400">{errors.subject}</p>}
              </div>
              <div className="flex-1">
                <label htmlFor="c-msg" className="mb-1.5 block text-[13px] font-medium text-slate-300">Mensaje *</label>
                <textarea id="c-msg" rows={5} value={form.message} onChange={set("message")} placeholder="Cuéntame qué necesitas, plazos y contexto…" className={`${inputCls(errors.message)} min-h-[130px] resize-y`} aria-invalid={!!errors.message} aria-describedby={errors.message ? "e-msg" : undefined} />
                {errors.message && <p id="e-msg" role="alert" className="mt-1.5 text-xs text-red-400">{errors.message}</p>}
              </div>
              {/* Honeypot anti-bots: invisible para humanos */}
              <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="c-company">Empresa (no llenar)</label>
                <input id="c-company" name="company" autoComplete="off" tabIndex={-1} value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={state === "sending"}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white disabled:cursor-wait disabled:opacity-70"
              >
                <Send size={16} aria-hidden />{" "}
                {state === "sending" ? "Enviando…" : isSupabaseConfigured || contact.email ? "Enviar mensaje" : "Preparar mensaje"}
              </button>
              {sendError && (
                <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-center text-[13px] text-red-300">
                  {sendError}
                </p>
              )}
              <p className="font-mono2 text-center text-[11px] text-slate-600">
                {isSupabaseConfigured
                  ? "Buzón activo: tu mensaje se guarda de forma segura."
                  : "Sin backend: no se simulan envíos. Actívalo con Supabase (ver README)."}
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
