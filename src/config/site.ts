/**
 * ═══════════════════════════════════════════════════════════════
 *  YISUS D DEV — CONFIGURACIÓN BÁSICA DEL SITIO
 * ───────────────────────────────────────────────────────────────
 *  El contenido del sitio (proyectos, novedades, servicios,
 *  habilidades, trayectoria, redes, FAQs, correo y WhatsApp)
 *  se administra desde el OWNER PANEL (#/owner) y vive en Supabase.
 *
 *  Este archivo solo conserva la identidad de marca, la
 *  configuración de secciones y los textos del perfil, que se
 *  editan aquí directamente.
 * ═══════════════════════════════════════════════════════════════
 */

export const siteConfig = {
  brand: "Yisus D Dev",
  tagline: "Ingeniería de software con identidad propia",
  // [PROVISIONAL] Dominio definitivo cuando exista (SEO canonical/OG).
  url: "https://yisus-d-dev.example.com",
  // Respaldo; lo real se edita en el panel → Ajustes → site_settings (email / whatsapp)
  email: "",
  whatsapp: "",
  availability: {
    enabled: true,
    label: "Disponible para proyectos",
    open: true,
  },
  sections: {
    about: true,
    skills: true,
    projects: true,
    news: true,
    services: true,
    process: true,
    experience: true,
    faqs: true,
    contact: true,
  },
} as const;

export const profile = {
  name: "Yisus D Dev",
  role: "Desarrollador de Software",
  specialty: "Aplicaciones web · Backend · Sistemas",
  location: "Colombia · Trabajo remoto",
  headline: "Construyo software real que se siente premium.",
  heroDescription:
    "Diseño y desarrollo aplicaciones web, APIs y sistemas de gestión rápidos, escalables y con una experiencia cuidada — del modelo de datos al último píxel.",
  aboutIntro:
    "Soy Yisus D Dev, desarrollador enfocado en construir productos útiles y mantenibles. Me muevo entre el frontend, el backend y la arquitectura: me importa tanto que el código sea sólido como que la interfaz se sienta impecable.",
  aboutApproach:
    "Mi forma de trabajar es analítica: entender el problema, diseñar la solución más simple que funcione, iterar con calidad y dejar el sistema listo para crecer. Sin plantillas genéricas, sin humo.",
  focus: [
    {
      title: "Producto útil",
      description: "Software que resuelve un problema concreto, no demos vacías.",
    },
    {
      title: "Código mantenible",
      description: "Arquitectura clara, tipado estricto y piezas reutilizables.",
    },
    {
      title: "Experiencia cuidada",
      description: "Interfaces rápidas, accesibles y con microinteracciones con intención.",
    },
  ],
} as const;

export type SocialId =
  | "github" | "linkedin" | "x" | "youtube"
  | "instagram" | "tiktok" | "facebook" | "whatsapp"
  | "telegram" | "discord" | "twitch" | "medium"
  | "email" | "website" | "portfolio";

export interface SocialLink {
  id: SocialId;
  label: string;
  href: string;
}

export type SkillCategory =
  | "Frontend"
  | "Backend"
  | "Lenguajes"
  | "Bases de datos"
  | "Escritorio"
  | "Móvil y PWA"
  | "Cloud y despliegue"
  | "Herramientas"
  | "Arquitectura y testing";

export type ProjectStatus = "En desarrollo" | "Demo funcional" | "Concepto" | "Producción";
export type ProjectType = "Web App" | "Sistema" | "Landing" | "API" | "Escritorio" | "PWA";

export interface Project {
  id: string;
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  features: string[];
  stack: string[];
  type: ProjectType;
  status: ProjectStatus;
  category: string;
  demoUrl: string;
  repoUrl: string;
  accent: string;
  coverUrl?: string;
  architecture: string[];
  challenges: string[];
}

export interface TimelineEntry {
  period: string;
  title: string;
  org: string;
  description: string;
  tags: string[];
}

// Proceso de trabajo (método; no depende del panel)
export const processSteps = [
  { n: "01", title: "Descubrimiento", description: "Requisitos, alcance y criterios de éxito. Sin jerga: qué problema resolvemos y cómo lo medimos." },
  { n: "02", title: "Planificación y diseño", description: "Mapa de pantallas, modelo de datos y prototipo navegable antes de escribir código serio." },
  { n: "03", title: "Arquitectura y desarrollo", description: "Iteraciones cortas con código tipado, revisiones y demos frecuentes." },
  { n: "04", title: "Pruebas y validación", description: "Testing funcional, accesibilidad, responsive real y revisión contigo." },
  { n: "05", title: "Despliegue y entrega", description: "Despliegue reproducible, documentación y transferencia sin dependencias ocultas." },
  { n: "06", title: "Evolución", description: "Mantenimiento, métricas y mejoras continuas según uso real." },
] as const;

export interface NavLink {
  id: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { id: "inicio", label: "Inicio" },
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "stack", label: "Stack" },
  { id: "proyectos", label: "Proyectos" },
  { id: "novedades", label: "Novedades" },
  { id: "servicios", label: "Servicios" },
  { id: "proceso", label: "Proceso" },
  { id: "experiencia", label: "Trayectoria" },
  { id: "faqs", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
];
