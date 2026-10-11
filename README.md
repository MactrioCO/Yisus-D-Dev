# Yisus D Dev — Portafolio Personal

Portafolio premium dark para **Yisus D Dev**: desarrollador de software (web · backend · sistemas).
React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion + iconografía Lucide / SVG propio.

## Comandos

```bash
npm install     # instalar dependencias
npm run dev     # desarrollo en http://localhost:5173
npm run build   # typecheck (tsc -b) + build de producción a dist/
npm run preview # servir dist/ localmente
npm run lint    # oxlint
```

## Estructura

```
index.html                  # SEO, Open Graph, Twitter, JSON-LD, fuentes, favicon
public/
  logo.png                  # logo oficial (favicon + OG + apple-touch-icon)
  robots.txt / sitemap.xml  # usan https://yisus-d-dev.example.com → cambiar al dominio real
src/
  main.tsx / App.tsx        # entrada + ensamblado + sección activa + modal de proyecto
  index.css                 # sistema visual: variables, gradientes, botones, grid técnica
  config/site.ts            # identidad de marca (profile, disponibilidad, proceso)
  lib/cms.ts                # carga de contenido desde Supabase (fuente de verdad)
  lib/motion.ts             # variantes y curvas de animación centralizadas
  components/
    Preloader.tsx           # carga cinematográfica ligada a document.readyState
    Navbar.tsx              # fija, sección activa, menú móvil accesible
    Hero.tsx                # titular, CTAs, terminal decorativa, entrada escalonada
    About / Skills / Projects / ProjectModal
    Services / Process / Experience
    Contact.tsx             # validación + mailto honesto (sin backend no finge envíos)
    MactrioWidget.tsx       # chat flotante con handoff humano
    Footer.tsx              # año automático, nav, botón volver arriba
    BackgroundFX / Reveal / SectionHeading / Logo / icons.tsx
```

## Dónde poner tus datos reales: el OWNER PANEL

Todo el contenido se administra desde el panel privado (`#/owner`, ver
`docs/OWNER_PANEL.md`). Si una sección está vacía, **el sitio la oculta sola**:
no hay datos de prueba ni avisos provisionales en la UI pública.

| Dato | Dónde |
|---|---|
| Proyectos | Panel → Proyectos (portada con botón **Subir imagen**) |
| Novedades | Panel → Novedades (`status = published`) |
| Servicios | Panel → Servicios |
| Stack / habilidades | Panel → Habilidades |
| Experiencia / formación / certs | Panel → Perfil y experiencia |
| Redes sociales y FAQs | Panel → Redes y FAQs |
| Correo y WhatsApp | Panel → Ajustes (claves `email` / `whatsapp`) |
| Mensajes del formulario | Panel → Actividad y buzón |
| Bot (bienvenida, sugerencias, handoff) | Panel → Ajustes → Mactrio Bot |

Solo se edita en `src/config/site.ts` lo que es identidad de marca:
`profile` (nombre, titulares, ubicación), `siteConfig` (disponibilidad,
dominio `siteConfig.url`) y `processSteps` (método de trabajo).

## Imágenes a sustituir

1. `public/logo.png` → logo oficial (512×512, ya integrado: navbar, footer, preloader, favicon y Open Graph). Si lo reemplazas, mantén el nombre o actualiza `Logo.tsx`, `Preloader.tsx` e `index.html`.
2. Portadas de proyecto/novedad → súbelas desde el panel (campo **Portada** → *Subir imagen*); van al bucket `portfolio-media` y el sitio las renderiza con `loading="lazy"`.

## Formulario de contacto (Supabase)

El formulario es **real**: valida en cliente (nombre/email/asunto/mensaje + errores `role="alert"`),
protege con honeypot anti-bots + límite de 1 envío/min por navegador, valida de nuevo
en la base (constraints SQL) y guarda en `public.contact_messages`.

```bash
cp .env.example .env   # rellena tus valores (el .env jamás se sube a git)
```

Sin credenciales, el formulario usa el fallback honesto (abre `mailto:`) sin fingir envíos.

### Migraciones: SQL directo a Supabase

Los SQL viven en `supabase/migrations/` numerados (`0001_...`, `0002_...`).
`scripts/migrate.mjs` los envía directo a tu proyecto vía Management API,
con libro de registro (`public._migrations`) para no repetir y `--dry-run` para previsualizar:

```bash
$env:SUPABASE_PROJECT_REF='turef'          # PowerShell
$env:SUPABASE_ACCESS_TOKEN='sbp_...'
npm run migrate
npm run migrate -- --dry-run
```

Seguridad RLS: cualquiera puede INSERTAR mensajes, **nadie anónimo puede leerlos**;
los lees en el dashboard (Table Editor). La `anon key` es pública por diseño;
el `ACCESS_TOKEN` es secreto y solo vive en tu máquina.

## OWNER PANEL + Mactrio Bot

- Panel privado en **`#/owner`**: dashboard real, CRUD de proyectos/novedades/servicios/habilidades/trayectoria/redes/FAQs, biblioteca (Storage), **Mactrio Inbox** con realtime, ajustes, buzón y bitácora. Sin registro público ni claves por defecto.
- Auth: Supabase Auth email/pass + rol verificado contra `owner_profiles` (RLS). Primer OWNER: `docs/OWNER_PANEL.md` §1.
- Widget **Mactrio Bot** en el sitio: auth anónimo, motor local que responde solo con datos autorizados (nunca inventa), handoff humano persistido, preguntas sin respuesta registradas.
- IA externa opcional: `supabase/functions/mactrio-reply/` lista para `supabase functions deploy` + `VITE_MACTRIO_FUNCTION_URL`.
- Migraciones: `0001_contact_messages` · `0002_owner_cms` · `0003_chat_bot` · `0004_project_cover` · `0005_seed_contact_settings` (`npm run migrate`).

## Animaciones

Centralizadas en `src/lib/motion.ts` (curva `[0.22,1,0.36,1]`, duraciones 0.18/0.42/0.8s). Incluye: preloader con sheen + terminal + barra ligada a carga real, hero escalonado, reveals por IntersectionObserver, filtros de proyectos con layout animado, modal accesible (Esc + foco), timeline de proceso, hovers `transform/opacity`, scroll-progress, cursor desktop opcional. Todo respeta `prefers-reduced-motion`.

## Accesibilidad / SEO / Rendimiento

- Skip-link, semántica (`header/main/section/footer`), foco visible, menú con `aria-expanded`, modal `role="dialog"`, formulario etiquetado, contraste AA, sin dependencia solo-ratón.
- Título/descripción/OG/Twitter/JSON-LD/canonical/robots/sitemap en `index.html` + `public/`.
- Fuentes con preconnect, CSS ~53 kB, JS con code-splitting de Vite, sin imágenes pesadas iniciales, listeners/ observers con cleanup, `loading="lazy"` previsto para capturas futuras.

## Pruebas realizadas

- `npx tsc -b` → limpio (0 errores).
- `npm run build` → OK (`dist/` generado).
- `npm run lint` (oxlint) → 0 errores, 5 warnings menores (setState-in-effect / Date en render, sin impacto funcional).
- Verificación pendiente por el usuario: navegación por teclado, menú móvil, responsive real y Lighthouse en despliegue.
