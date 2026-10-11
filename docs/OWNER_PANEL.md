# YISUS D DEV — OWNER PANEL + Mactrio Bot · Guía operativa

Panel privado en **`#/owner`** (ej. `https://tudominio.com/#/owner`). Sin rutas secretas:
la seguridad es Supabase Auth + tabla `owner_profiles` + RLS. No hay registro público
ni credenciales por defecto.

## 1. Crear el primer OWNER (una vez)

1. Supabase dashboard → **Authentication → Users → Add user → Create new user**.
   Pon tu correo y una contraseña fuerte (mín. 10 caracteres). Confirma el email
   (o marca *Auto Confirm User*).
2. **SQL Editor → New query** y ejecuta con tu correo (service_role, solo tú
   tienes acceso). Idempotente: puedes repetirlo sin duplicar:
   ```sql
   insert into public.owner_profiles (user_id, role, display_name)
   select id, 'owner', 'Yisus'
   from auth.users
   where email = 'mactrioforever@gmail.com'
   on conflict (user_id) do update set role = 'owner';
   ```
   Verifica con: `select * from public.owner_profiles;` (debe salir 1 fila).
3. Entra en `#/owner` con ese correo y contraseña (ver §1.bis para el acceso discreto).

## 1.bis. Botón secreto (acceso discreto, no seguridad)

El login vive en `#/owner`. Además hay dos accesos camuflados:
- **Triple clic** en el logo del navbar.
- **Puntito `·`** casi invisible al final del footer
  (“…tailwind **·**”, solo se ilumina al pasar el mouse).

Ojo: esto es discreción visual, no protección. La seguridad real es
Supabase Auth + `owner_profiles` + RLS (cualquiera que adivine la URL
sigue viendo solo el login, y sin rol OWNER no entra).

Nadie puede auto-otorgarse el rol: `owner_profiles` no tiene políticas de
INSERT/UPDATE/DELETE para clientes. Colaboradores futuros: inserta filas con
`role='collaborator'` por este mismo procedimiento (cuando lo autorices).

## 2. Chat anónimo (ya activado)

Habilitado el 2026-10-10 (`external_anonymous_users_enabled = true`), verificado
con un alta anónima real. Si algún día lo desactivas en **Authentication →
Providers**, el widget dejará de crear conversaciones.

## 3. MFA (recomendado)

Authentication → Providers → activa MFA (TOTP). El panel lo respeta solo:
la sesión existe únicamente tras completar el segundo factor.

## 4. Publicar contenido (sincronización con el sitio)

- **Proyectos**: `#/owner/proyectos` → Nuevo → rellena → `Publicado = ON`.
  Aparece en la galería pública al recargar. Borrador = invisible para anon (RLS).
  Solo el **Título es obligatorio**: el resto (problema, solución, stack,
  URLs…) es opcional y **el slug se genera solo** desde el título (si quieres
  uno propio, escríbelo; si está vacío, se autogenera). Un proyecto puede
  publicarse **sin URL demo ni repo** (sistemas en producción sin web, o con
  solo imagen de referencia): la ficha oculta los botones que no apliquen y
  muestra un aviso honesto en su lugar; las secciones vacías no se pintan.
- **Novedades**: igual con `status = published` + `published_at`
  (slug también automático).
- **Servicios / Habilidades / Trayectoria / FAQs**: `is_active` controla la
  visibilidad pública. En **Habilidades**, *Tecnologías* ahora es un **selector
  con chulo**: salen todas las tecnologías del catálogo y solo tocas las que
  quieras mostrar (contador arriba, *Limpiar todo* y campo para agregar
  tecnologías que no estén en la lista). El sitio lee Supabase:
  **sin contenido, la sección se
  oculta sola** (no hay datos de prueba; todo lo publicas tú desde el panel).
  El correo y el WhatsApp se editan en `#/owner/ajustes` (claves `email` y
  `whatsapp` de `site_settings`) y aparecen en Contacto y el pie.
- **Redes**: `#/owner/redes` → *Nuevo* → eliges la red (Instagram, TikTok,
  WhatsApp, GitHub, LinkedIn, X, YouTube, Facebook, Telegram, Discord, Twitch,
  Medium, Correo o Sitio web), pones la etiqueta y la URL. El icono correcto
  sale solo en el hero, el contacto y el pie; puedes añadir varias entradas
  de la misma red (p. ej. dos webs) sin problema.
- **Imágenes**: en Proyectos/Novedades, pulsa **Subir imagen** en el campo
  *Portada*: la foto sube sola a la Biblioteca (`portfolio-media`, máx 5 MB)
  y se guarda la URL. Sin copiar ni pegar nada a mano.

## 5. Atender el inbox

`#/owner/inbox` → conversaciones en tiempo real (Realtime + polling de respaldo
cada 15 s). Al responder tomas el control (`human`) y el bot se calla solo.
Acciones: *Al bot / Pendiente / Atender / Resolver / Cerrar*.

**Buzón de contacto**: los mensajes del formulario público se guardan en
`contact_messages` y aparecen en `#/owner/actividad` (*Actividad y buzón* →
*Buzón de contacto*), con indicador de sin leer, *Marcar leído*, *Borrar* y
enlace para responder por correo. Cualquiera puede escribir; solo tú (OWNER)
puedes leer, marcar o borrar (RLS de la migración 0006).

## 6. IA externa (opcional)

Sin claves, el bot responde con el **motor local** (datos autorizados, sin inventar).
Para IA real, despliega la Edge Function (código listo en
`supabase/functions/mactrio-reply/`):

```bash
supabase login
supabase link --project-ref eecsygwrmnntfbssmdoi
supabase secrets set AI_API_KEY=... AI_MODEL=gpt-4o-mini
supabase functions deploy mactrio-reply
```

Y define en tu `.env` de frontend:
`VITE_MACTRIO_FUNCTION_URL=https://eecsygwrmnntfbssmdoi.supabase.co/functions/v1/mactrio-reply`
El widget la usará primero y caerá al motor local si falla. La clave de IA
vive en Secrets: jamás toca el navegador.

## 7. Probar las restricciones (checklist)

- [ ] Sin sesión, `#/owner` muestra el login (nunca el panel).
- [ ] Usuario autenticado NO owner ve “Sin permisos”.
- [ ] Anon: `GET /rest/v1/projects` solo trae `is_published=true`;
      `news_posts` solo `published`; `owner_profiles`, `chat_*`, `admin_activity_logs`
      devuelven 0 filas; `POST /rest/v1/projects` → 42501.
- [ ] Borradores creados en el panel no aparecen en el sitio público.
- [ ] Handoff desde el widget aparece en el Inbox como *Pendiente*;
      al responder, el bot deja de contestar.
- [ ] Visitante A no puede leer la conversación del visitante B
      (RLS por `auth.uid()`; probado con dos sesiones anónimas).
- [ ] Cerrar sesión invalida el acceso (el panel vuelve al login).
- [ ] `.env` no está en git (`git status` no lo muestra).

## 8. Variables

Públicas (frontend): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_MACTRIO_FUNCTION_URL` (opcional).
Secretas (solo máquina/local): `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`
(ver `.env.example`).
