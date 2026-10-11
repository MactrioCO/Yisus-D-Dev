import { profile, siteConfig } from "../../config/site";
import type { PublicContent } from "../cms";

/**
 * Mactrio Bot · motor local de recuperación.
 * Responde SOLO con datos autorizados del portafolio (nunca inventa).
 * Si no hay información suficiente ⇒ answered:false ⇒ el widget ofrece handoff.
 */

export interface BotAnswer {
  text: string;
  answered: boolean;
  suggestions: string[];
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(norm(w)));

function score(q: string, text: string): number {
  const words = norm(q).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const t = norm(text);
  let s = 0;
  for (const w of words) if (t.includes(w)) s += w.length > 5 ? 2 : 1;
  return s;
}

export function answerQuestion(raw: string, ctx: PublicContent): BotAnswer {
  const q = norm(raw.trim());
  const D = (t: string) => ({ text: t, answered: true, suggestions: ctx.bot.suggestions });

  if (!q) return { text: "Escríbeme tu pregunta y te ayudo.", answered: true, suggestions: ctx.bot.suggestions };

  // Saludos
  if (/^(hola|buenas|hey|saludos|que tal|buenos dias|buenas tardes|buenas noches)\b/.test(q)) {
    return D(`¡Hola! Soy Mactrio Bot. Puedo contarte sobre los proyectos, servicios y novedades de ${profile.name}, o ayudarte a contactarlo. ¿Qué te interesa?`);
  }
  // Humano
  if (has(q, "humano", "persona", "hablar con", "atiendeme", "atiéndeme", "operador", "telefono", "teléfono", "llamar", "whatsapp")) {
    return { text: "__HANDOFF__", answered: true, suggestions: [] };
  }
  // Precios (no inventar)
  if (has(q, "precio", "cuanto cuesta", "cuánto cuesta", "costo", "tarifa", "presupuesto")) {
    return D("Los costos dependen del alcance de cada proyecto, así que no tengo una tarifa fija publicada. Lo mejor es describir tu idea en la sección de contacto y Yisus te envía una propuesta. ¿Quieres que te ayude a pedir atención humana para cotizar?");
  }
  // Contacto / ubicación / disponibilidad
  if (has(q, "contacto", "contactar", "correo", "email", "escrib", "mensaje", "contratar")) {
    const email = ctx.contact.email ? ` Su correo es ${ctx.contact.email}.` : "";
    const wa = ctx.contact.whatsapp ? " También puede escribirle por WhatsApp desde la sección de contacto." : "";
    const extra = ctx.contact.email || ctx.contact.whatsapp ? `${email}${wa}` : " Todavía no hay un correo ni WhatsApp públicos, así que usa el formulario de Contacto o pide atención humana.";
    return D(`Puedes contactarlo desde la sección “Contacto” del portafolio (formulario + redes).${extra}`);
  }
  if (has(q, "donde", "dónde", "ubicacion", "ubicación", "pais", "país", "ciudad")) {
    return D(`Trabaja en: ${profile.location}.`);
  }
  if (has(q, "disponible", "disponibilidad", "atiende", "responde")) {
    return D(siteConfig.availability.enabled
      ? `Estado actual: “${siteConfig.availability.label}”. Déjale un mensaje en Contacto o por aquí y te responderá.`
      : "Ahora mismo no hay un estado de disponibilidad publicado. Déjale un mensaje y te confirmará.");
  }
  // Quién es / perfil
  if (has(q, "quien es", "quién es", "quien eres", "quién eres", "sobre ti", "sobre el", "perfil", "experiencia", "trayectoria", "estudio", "formacion")) {
    return D(`${profile.name} — ${profile.role} (${profile.specialty}). ${profile.aboutIntro}`);
  }
  // Stack / tecnologías
  if (has(q, "tecnologia", "tecnología", "stack", "lenguaje", "framework", "herramienta", "sabe", "conoce", "domina", "react", "node", "python", "base de datos")) {
    if (!ctx.skills.length) return D("Aún no hay un stack publicado. Pregunta por sus proyectos o pide atención humana.");
    const flat = ctx.skills.map((g) => `${g.category}: ${g.items.join(", ")}`).join(" · ");
    return D(`Su stack incluye — ${flat}. Sin porcentajes inventados: lo importante es lo que construye con cada pieza.`);
  }
  // Servicios
  if (has(q, "servicio", "ofrece", "hace", "hacen", "trabajo", "desarrolla", "pagina", "página", "sistema", "aplicacion", "aplicación", "automatiz")) {
    if (!ctx.services.length) return D("Aún no hay servicios publicados. Déjale tu caso en Contacto o pide atención humana.");
    const list = ctx.services.map((s) => `• ${s.title}: ${s.description}`).join("\n");
    return D(`Servicios disponibles:\n${list}\n\nCada tarjeta del portafolio tiene un botón que lleva a Contacto.`);
  }
  // Novedades
  if (has(q, "novedad", "noticia", "nuevo", "actualizacion", "actualización", "lanzamiento", "blog", "avance")) {
    if (!ctx.news.length) return D("Aún no hay novedades publicadas. Vuelve pronto o pregunta por sus proyectos.");
    const list = ctx.news.slice(0, 4).map((n) => `• ${n.title} — ${n.excerpt}`).join("\n");
    return D(`Últimas novedades:\n${list}`);
  }
  // Proyectos: mención por nombre o petición general
  const projHit = ctx.projects.map((p) => ({ p, s: score(q, `${p.name} ${p.tagline} ${p.category} ${p.stack.join(" ")}`) }))
    .filter((x) => x.s > 2).sort((a, b) => b.s - a.s)[0];
  if (projHit || has(q, "proyecto", "portafolio", "trabajo", "app", "desarrollado", "creado", "muestrame", "muéstrame", "ver")) {
    if (!ctx.projects.length) return D("Aún no hay proyectos publicados. Pregunta por sus servicios o pide atención humana.");
    if (projHit && projHit.s >= 4) {
      const p = projHit.p;
      return D(`${p.name} — ${p.tagline}\n${p.problem}\nStack: ${p.stack.join(", ")} · Estado: ${p.status}. Tienes la ficha completa en la sección Proyectos.`);
    }
    const list = ctx.projects.map((p) => `• ${p.name} (${p.type} · ${p.status}): ${p.tagline}`).join("\n");
    return D(`Proyectos publicados:\n${list}\n\nPregúntame por uno por su nombre y te cuento más.`);
  }
  // FAQs (mejor coincidencia)
  let best: { question: string; answer: string; s: number } | null = null;
  for (const f of ctx.faqs) {
    const s = score(q, `${f.question} ${f.answer}`);
    if (s > 2 && (!best || s > best.s)) best = { ...f, s };
  }
  if (best) return D(best.answer);

  // Sin información suficiente ⇒ no inventar: registrar + ofrecer humano
  return { text: "No tengo información suficiente sobre eso en las fuentes autorizadas y prefiero no inventar. Puedo registrar tu pregunta para que Yisus la responda personalmente. ¿Solicito atención humana?", answered: false, suggestions: ["Sí, hablar con un humano", "Ver proyectos", "Ver servicios"] };
}
