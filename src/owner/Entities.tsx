import { getSupabase } from "../lib/supabase";
import EntityManager, { type EntityConfig } from "./crud";

async function projectOptions() {
  const sb = getSupabase();
  const opts = [{ value: "", label: "(ninguno)" }];
  if (!sb) return opts;
  const { data } = await sb.from("projects").select("id,title").order("title").limit(100);
  return [...opts, ...((data ?? []) as { id: string; title: string }[]).map((p) => ({ value: p.id, label: p.title }))];
}

const TYPES = ["Web App", "Sistema", "Landing", "API", "Escritorio", "PWA"].map((t) => ({ value: t, label: t }));
const STATUS = ["En desarrollo", "Demo funcional", "Concepto", "Producción"].map((t) => ({ value: t, label: t }));

/** Catálogo de tecnologías para el selector con chulo de Habilidades (las tuyas van en orden). */
const TECHS = [
  // Lenguajes y bases
  "HTML5", "CSS3", "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "PHP", "SQL", "Bash",
  // Frontend
  "React", "Next.js", "Vue.js", "Angular", "Svelte", "Tailwind CSS", "Bootstrap", "Framer Motion",
  "Redux", "Zustand", "Vite", "Webpack",
  // Backend
  "Node.js", "Express", "NestJS", "Django", "Flask", "Laravel", ".NET", "REST APIs", "GraphQL", "Socket.IO",
  // Bases de datos
  "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Supabase", "Firebase", "Redis",
  // Móvil y escritorio
  "React Native", "Flutter", "Expo", "Android Studio", "Electron",
  // DevOps y herramientas
  "Git", "GitHub", "Docker", "Linux", "Nginx", "Vercel", "Netlify", "AWS", "CI/CD", "Figma", "Unity",
].map((t) => ({ value: t, label: t }));

export const projectsConfig: EntityConfig = {
  table: "projects", label: "Proyectos", singular: "proyecto",
  orderBy: { column: "sort_order" }, searchKeys: ["title", "category", "status"],
  slugFrom: "title",
  columns: [
    { key: "title", label: "Título" }, { key: "category", label: "Categoría" },
    { key: "status", label: "Estado" }, { key: "is_published", label: "Publicado" },
  ],
  fields: [
    { key: "title", label: "Título", type: "text", required: true },
    { key: "slug", label: "Slug (opcional)", type: "text", placeholder: "Se genera automáticamente del título" },
    { key: "tagline", label: "Subtítulo", type: "text" },
    { key: "category", label: "Categoría", type: "text" },
    { key: "type", label: "Tipo", type: "select", options: TYPES },
    { key: "status", label: "Estado", type: "select", options: STATUS },
    { key: "problem", label: "Problema", type: "textarea" },
    { key: "solution", label: "Solución", type: "textarea" },
    { key: "features", label: "Funcionalidades", type: "chips" },
    { key: "stack", label: "Tecnologías", type: "chips" },
    { key: "architecture", label: "Arquitectura", type: "chips" },
    { key: "challenges", label: "Retos", type: "chips" },
    { key: "cover_url", label: "Portada", type: "image" },
    { key: "demo_url", label: "URL demo (opcional)", type: "text", placeholder: "Déjalo vacío si no tiene web" },
    { key: "repo_url", label: "URL repo (opcional)", type: "text", placeholder: "Déjalo vacío si es privado" },
    { key: "accent", label: "Acento", type: "color" },
    { key: "sort_order", label: "Orden", type: "number" },
    { key: "is_published", label: "Publicado", type: "bool" },
    { key: "is_featured", label: "Destacado", type: "bool" },
  ],
};

export const newsConfig: EntityConfig = {
  table: "news_posts", label: "Novedades", singular: "novedad",
  orderBy: { column: "created_at", ascending: false }, searchKeys: ["title", "category", "status"],
  slugFrom: "title",
  columns: [
    { key: "title", label: "Título" }, { key: "category", label: "Categoría" },
    { key: "status", label: "Estado" }, { key: "published_at", label: "Publicada" },
  ],
  fields: [
    { key: "title", label: "Título", type: "text", required: true },
    { key: "slug", label: "Slug (opcional)", type: "text", placeholder: "Se genera automáticamente del título" },
    { key: "excerpt", label: "Resumen", type: "textarea", rows: 2 },
    { key: "content", label: "Contenido", type: "textarea", rows: 8 },
    { key: "cover_url", label: "Portada", type: "image" },
    { key: "category", label: "Categoría", type: "text" },
    { key: "tags", label: "Etiquetas", type: "chips" },
    { key: "project_id", label: "Proyecto relacionado", type: "select", options: projectOptions },
    { key: "status", label: "Estado", type: "select", options: ["draft", "published", "archived"].map((s) => ({ value: s, label: s })) },
    { key: "published_at", label: "Fecha publicación (ISO)", type: "text", placeholder: "2026-01-01T00:00:00Z" },
  ],
};

export const servicesConfig: EntityConfig = {
  table: "services", label: "Servicios", singular: "servicio",
  orderBy: { column: "sort_order" }, searchKeys: ["title"],
  columns: [{ key: "title", label: "Título" }, { key: "is_active", label: "Activo" }],
  fields: [
    { key: "title", label: "Título", type: "text", required: true },
    { key: "description", label: "Descripción", type: "textarea" },
    { key: "problem", label: "Problema que resuelve", type: "textarea" },
    { key: "cta", label: "Texto del botón", type: "text" },
    { key: "icon", label: "Icono", type: "select", options: ["globe", "server", "cart", "db", "layout", "refresh"].map((i) => ({ value: i, label: i })) },
    { key: "sort_order", label: "Orden", type: "number" },
    { key: "is_active", label: "Activo", type: "bool" },
  ],
};

export const skillsConfig: EntityConfig = {
  table: "skills", label: "Habilidades", singular: "categoría",
  orderBy: { column: "sort_order" }, searchKeys: ["category"],
  columns: [{ key: "category", label: "Categoría" }, { key: "items", label: "Ítems" }],
  fields: [
    { key: "category", label: "Categoría", type: "text", required: true },
    { key: "items", label: "Tecnologías (toca para seleccionar las que quieras)", type: "picker", options: TECHS },
    { key: "sort_order", label: "Orden", type: "number" },
  ],
};

export const experiencesConfig: EntityConfig = {
  table: "experiences", label: "Trayectoria", singular: "entrada",
  orderBy: { column: "sort_order" }, searchKeys: ["title", "org", "kind"],
  columns: [{ key: "kind", label: "Tipo" }, { key: "title", label: "Título" }, { key: "period", label: "Periodo" }],
  fields: [
    { key: "kind", label: "Tipo", type: "select", options: [{ value: "experience", label: "Experiencia" }, { value: "education", label: "Formación" }, { value: "certification", label: "Certificación" }] },
    { key: "title", label: "Título", type: "text", required: true },
    { key: "org", label: "Organización", type: "text" },
    { key: "period", label: "Periodo", type: "text" },
    { key: "description", label: "Descripción", type: "textarea" },
    { key: "tags", label: "Etiquetas", type: "chips" },
    { key: "sort_order", label: "Orden", type: "number" },
  ],
};

const NETWORKS = [
  ["instagram", "Instagram"], ["tiktok", "TikTok"], ["whatsapp", "WhatsApp"],
  ["github", "GitHub"], ["linkedin", "LinkedIn"], ["x", "X (Twitter)"],
  ["youtube", "YouTube"], ["facebook", "Facebook"], ["telegram", "Telegram"],
  ["discord", "Discord"], ["twitch", "Twitch"], ["medium", "Medium"],
  ["email", "Correo electrónico"], ["website", "Sitio web"],
].map(([value, label]) => ({ value, label }));

export const socialsConfig: EntityConfig = {
  table: "social_links", label: "Redes sociales", singular: "enlace",
  orderBy: { column: "sort_order" }, searchKeys: ["label", "network"],
  columns: [{ key: "label", label: "Etiqueta" }, { key: "network", label: "Red" }, { key: "href", label: "URL" }, { key: "is_active", label: "Activo" }],
  fields: [
    { key: "network", label: "Red", type: "select", options: NETWORKS },
    { key: "label", label: "Etiqueta (lo que se lee al pasar el mouse)", type: "text", required: true, placeholder: "@tu_usuario" },
    { key: "href", label: "URL", type: "text", required: true, placeholder: "https://instagram.com/tu_usuario" },
    { key: "sort_order", label: "Orden", type: "number" },
    { key: "is_active", label: "Activo", type: "bool" },
  ],
};

export const faqsConfig: EntityConfig = {
  table: "faqs", label: "Preguntas frecuentes", singular: "pregunta",
  orderBy: { column: "sort_order" }, searchKeys: ["question"],
  columns: [{ key: "question", label: "Pregunta" }, { key: "is_active", label: "Activa" }],
  fields: [
    { key: "question", label: "Pregunta", type: "textarea", rows: 2, required: true },
    { key: "answer", label: "Respuesta", type: "textarea", rows: 4, required: true },
    { key: "sort_order", label: "Orden", type: "number" },
    { key: "is_active", label: "Activa", type: "bool" },
  ],
};

export function EntityView({ config }: { config: EntityConfig }) {
  return (
    <div>
      <h1 className="font-display mb-5 text-2xl font-bold text-white">{config.label}</h1>
      <EntityManager config={config} />
    </div>
  );
}
