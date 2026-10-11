-- ─────────────────────────────────────────────────────────────
--  YISUS D DEV — Migración 0006 - buzón visible para el OWNER
--  Tabla: public.contact_messages
--  Aplicar con:  npm run migrate   (ver scripts/migrate.mjs)
-- ─────────────────────────────────────────────────────────────
--  La 0001 solo permitía INSERT (cualquiera podía escribir, nadie
--  podía leer). El panel "Actividad y buzón" consulta con la sesión
--  del OWNER (authenticated) y RLS devolvía vacío. Aquí se dan al
--  OWNER lectura, marcado de leído y borrado de SUS mensajes.

drop policy if exists "contact_owner_read" on public.contact_messages;
create policy "contact_owner_read"
  on public.contact_messages
  for select
  to authenticated
  using (public.is_owner());

drop policy if exists "contact_owner_update" on public.contact_messages;
create policy "contact_owner_update"
  on public.contact_messages
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "contact_owner_delete" on public.contact_messages;
create policy "contact_owner_delete"
  on public.contact_messages
  for delete
  to authenticated
  using (public.is_owner());
