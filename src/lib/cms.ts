import { siteConfig, type Project, type SkillCategory, type SocialLink, type TimelineEntry } from "../config/site";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/** Capa de contenido público: TODO vive en Supabase (panel). Sin datos de prueba. */

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category: string;
  tags: string[];
  published_at: string | null;
}

export interface ServiceItem {
  title: string;
  description: string;
  problem: string;
  cta: string;
}

export interface PublicContent {
  projects: Project[];
  news: NewsPost[];
  services: ServiceItem[];
  skills: { category: SkillCategory; items: string[] }[];
  experience: TimelineEntry[];
  education: TimelineEntry[];
  certifications: TimelineEntry[];
  socials: SocialLink[];
  faqs: { id: string; question: string; answer: string }[];
  settings: Record<string, unknown>;
  contact: { email: string; whatsapp: string };
  bot: { enabled: boolean; welcome: string; suggestions: string[]; handoff_enabled: boolean; absence: string };
  source: "supabase" | "local";
}

const asArray = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/** site_settings guarda JSON: acepta "texto" o {"value":"texto"}. */
const strVal = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v) return String((v as { value: unknown }).value);
  return "";
};

function mapProject(r: Record<string, unknown>): Project {
  return {
    id: String(r.id),
    name: String(r.title ?? ""),
    tagline: String(r.tagline ?? ""),
    problem: String(r.problem ?? ""),
    solution: String(r.solution ?? ""),
    features: asArray(r.features),
    stack: asArray(r.stack),
    type: (r.type as Project["type"]) ?? "Web App",
    status: (r.status as Project["status"]) ?? "En desarrollo",
    category: String(r.category ?? "Web"),
    demoUrl: String(r.demo_url ?? ""),
    repoUrl: String(r.repo_url ?? ""),
    accent: String(r.accent ?? "#8b5cf6"),
    coverUrl: String(r.cover_url ?? ""),
    architecture: asArray(r.architecture),
    challenges: asArray(r.challenges),
  };
}

/** Contenido vacío por defecto: nada de proyectos/servicios inventados. */
export const localContent = (): PublicContent => ({
  projects: [],
  news: [],
  services: [],
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  socials: [],
  faqs: [],
  settings: {},
  contact: { email: siteConfig.email, whatsapp: siteConfig.whatsapp },
  bot: {
    enabled: true,
    welcome: "¡Hola! Soy Mactrio Bot, asistente de Yisus D Dev. Pregúntame por proyectos, servicios o cómo contactar.",
    suggestions: ["¿Qué proyectos ha hecho?", "¿Qué servicios ofrece?", "¿Cómo lo contacto?"],
    handoff_enabled: true,
    absence: "He registrado tu solicitud. Yisus la revisará y te responderá por aquí mismo.",
  },
  source: "local",
});

export async function loadPublicContent(): Promise<PublicContent> {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) return localContent();
  try {
    const [pj, nw, sv, sk, ex, so, fq, st, bt] = await Promise.all([
      sb.from("projects").select("*").eq("is_published", true).order("sort_order"),
      sb.from("news_posts").select("*").eq("status", "published").order("published_at", { ascending: false }),
      sb.from("services").select("*").eq("is_active", true).order("sort_order"),
      sb.from("skills").select("*").order("sort_order"),
      sb.from("experiences").select("*").order("sort_order"),
      sb.from("social_links").select("*").eq("is_active", true).order("sort_order"),
      sb.from("faqs").select("*").eq("is_active", true).order("sort_order"),
      sb.from("site_settings").select("*"),
      sb.from("chatbot_settings").select("*"),
    ]);
    if (pj.error || nw.error) throw pj.error ?? nw.error;

    const settings: Record<string, unknown> = {};
    (st.data ?? []).forEach((r: { key: string; value: unknown }) => (settings[r.key] = r.value));
    const botCfg: Record<string, { value: unknown }> = {};
    (bt.data ?? []).forEach((r: { key: string; value: { value: unknown } }) => (botCfg[r.key] = r.value as { value: unknown }));
    const bv = (k: string, fb: unknown) => (botCfg[k]?.value ?? fb);
    const exp = (ex.data ?? []) as Record<string, string & string[]>[];
    const toEntry = (r: Record<string, string & string[]>): TimelineEntry => ({
      period: String(r.period), title: String(r.title), org: String(r.org),
      description: String(r.description), tags: asArray(r.tags),
    });

    return {
      projects: ((pj.data ?? []) as Record<string, unknown>[]).map(mapProject),
      news: ((nw.data ?? []) as Record<string, string & string[]>[]).map((r) => ({
        id: String(r.id), slug: String(r.slug), title: String(r.title), excerpt: String(r.excerpt ?? ""),
        content: String(r.content ?? ""), cover_url: String(r.cover_url ?? ""), category: String(r.category ?? "General"),
        tags: asArray(r.tags), published_at: (r.published_at as string) ?? null,
      })),
      services: ((sv.data ?? []) as Record<string, string>[]).map((r) => ({
        title: String(r.title ?? ""), description: String(r.description ?? ""),
        problem: String(r.problem ?? ""), cta: String(r.cta || "Contarme"),
      })),
      skills: ((sk.data ?? []) as { category: string; items: string[] }[]).map((r) => ({
        category: r.category as SkillCategory, items: r.items ?? [],
      })),
      experience: exp.filter((r) => r.kind === "experience").map(toEntry),
      education: exp.filter((r) => r.kind === "education").map(toEntry),
      certifications: exp.filter((r) => r.kind === "certification").map(toEntry),
      socials: ((so.data ?? []) as { network: string; label: string; href: string }[]).map((r) => ({
        id: r.network as SocialLink["id"], label: r.label, href: r.href,
      })),
      faqs: ((fq.data ?? []) as { id: string; question: string; answer: string }[]).map((r) => ({
        id: String(r.id), question: r.question, answer: r.answer,
      })),
      settings,
      contact: {
        email: strVal(settings.email) || siteConfig.email,
        whatsapp: strVal(settings.whatsapp).replace(/\D/g, "") || siteConfig.whatsapp,
      },
      bot: {
        enabled: Boolean(bv("enabled", true)),
        welcome: String(bv("welcome", localContent().bot.welcome)),
        suggestions: asArray(bv("suggestions", localContent().bot.suggestions)),
        handoff_enabled: Boolean(bv("handoff_enabled", true)),
        absence: String(bv("absence", localContent().bot.absence)),
      },
      source: "supabase",
    };
  } catch {
    return localContent();
  }
}
