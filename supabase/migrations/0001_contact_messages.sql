-- ═══════════════════════════════════════════════════════════════
--  YISUS D DEV · Migración 0001 — buzón de contacto
--  Tabla: public.contact_messages
--  Aplicar con:  npm run migrate   (ver scripts/migrate.mjs)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(name) between 2 and 100),
  email text not null
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  subject text not null
    check (char_length(subject) between 3 and 150),
  message text not null
    check (char_length(message) between 10 and 5000),
  created_at timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

-- Seguridad: RLS activado. Cualquiera puede ESCRIBIR (insert),
-- nadie anónimo puede LEER ni BORRAR. Lees los mensajes desde el
-- dashboard de Supabase (Table Editor) con tu usuario.
alter table public.contact_messages enable row level security;

drop policy if exists "contact_insert_public" on public.contact_messages;
create policy "contact_insert_public"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- Sin políticas de SELECT/UPDATE/DELETE para anon/authenticated:
-- solo service_role (dashboard / backend) puede leerlos.
