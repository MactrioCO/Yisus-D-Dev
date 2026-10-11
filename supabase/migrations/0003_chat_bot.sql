-- ═══════════════════════════════════════════════════════════════
--  YISUS D DEV · Migración 0003 — Mactrio Bot (conversaciones)
--  Visitantes: Supabase Auth anónimo (cada uno solo ve lo suyo vía
--  auth.uid() = visitor_user_id — autorización real, no por oscuridad).
-- ═══════════════════════════════════════════════════════════════

-- ── Conversaciones ────────────────────────────────────────────────
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_user_id uuid not null,
  visitor_name text not null default '',
  visitor_email text not null default '',
  status text not null default 'bot'
    check (status in ('bot', 'pending_human', 'human', 'resolved', 'closed')),
  handoff_requested boolean not null default false,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists chat_conv_status_idx on public.chat_conversations (status, last_message_at desc);
create index if not exists chat_conv_visitor_idx on public.chat_conversations (visitor_user_id);
alter table public.chat_conversations enable row level security;

drop policy if exists "chat_conv_owner_all" on public.chat_conversations;
create policy "chat_conv_owner_all" on public.chat_conversations
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists "chat_conv_visitor_insert" on public.chat_conversations;
create policy "chat_conv_visitor_insert" on public.chat_conversations
  for insert to authenticated with check (visitor_user_id = auth.uid());
drop policy if exists "chat_conv_visitor_read" on public.chat_conversations;
create policy "chat_conv_visitor_read" on public.chat_conversations
  for select to authenticated using (visitor_user_id = auth.uid() or public.is_owner());
-- El visitante solo puede pedir handoff en SU conversación (sin tocar otros campos críticos
-- a nivel SQL; la app solo expone status/handoff_requested).
drop policy if exists "chat_conv_visitor_handoff" on public.chat_conversations;
create policy "chat_conv_visitor_handoff" on public.chat_conversations
  for update to authenticated
  using (visitor_user_id = auth.uid())
  with check (visitor_user_id = auth.uid());

-- ── Mensajes ──────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  sender text not null check (sender in ('visitor', 'bot', 'owner')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists chat_msg_conv_idx on public.chat_messages (conversation_id, created_at);
alter table public.chat_messages enable row level security;

drop policy if exists "chat_msg_owner_all" on public.chat_messages;
create policy "chat_msg_owner_all" on public.chat_messages
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists "chat_msg_visitor_read" on public.chat_messages;
create policy "chat_msg_visitor_read" on public.chat_messages
  for select to authenticated using (
    exists (select 1 from public.chat_conversations c
            where c.id = conversation_id and c.visitor_user_id = auth.uid())
  );
-- NOTA DE SEGURIDAD: el motor local del bot corre en el navegador del
-- visitante, por eso se permite sender 'visitor'/'bot' en SU conversación.
-- Un visitante malicioso solo podría forjar mensajes de bot en SU PROPIA
-- conversación (sin impacto en otros). La vía endurecida es la Edge Function
-- supabase/functions/mactrio-reply (service_role, pendiente de deploy).
drop policy if exists "chat_msg_visitor_insert" on public.chat_messages;
create policy "chat_msg_visitor_insert" on public.chat_messages
  for insert to authenticated with check (
    sender in ('visitor', 'bot') and
    exists (select 1 from public.chat_conversations c
            where c.id = conversation_id and c.visitor_user_id = auth.uid())
  );

-- ── Solicitudes de atención humana ─────────────────────────────────
create table if not exists public.chat_handoff_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  reason text not null default '',
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.chat_handoff_requests enable row level security;
drop policy if exists "handoff_owner_all" on public.chat_handoff_requests;
create policy "handoff_owner_all" on public.chat_handoff_requests
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists "handoff_visitor_insert" on public.chat_handoff_requests;
create policy "handoff_visitor_insert" on public.chat_handoff_requests
  for insert to authenticated with check (
    exists (select 1 from public.chat_conversations c
            where c.id = conversation_id and c.visitor_user_id = auth.uid())
  );

-- ── Config del bot (SOLO valores no sensibles) ─────────────────────
create table if not exists public.chatbot_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.chatbot_settings enable row level security;
drop policy if exists "botcfg_public_read" on public.chatbot_settings;
create policy "botcfg_public_read" on public.chatbot_settings for select to anon, authenticated using (true);
drop policy if exists "botcfg_owner_all" on public.chatbot_settings;
create policy "botcfg_owner_all" on public.chatbot_settings for all to authenticated using (public.is_owner()) with check (public.is_owner());
insert into public.chatbot_settings (key, value) values
  ('enabled', '{"value": true}'),
  ('welcome', '{"value": "¡Hola! Soy Mactrio Bot, asistente de Yisus D Dev. Pregúntame por proyectos, servicios o cómo contactar."}'),
  ('suggestions', '{"value": ["¿Qué proyectos ha hecho?", "¿Qué servicios ofrece?", "¿Cómo lo contacto?"]}'),
  ('handoff_enabled', '{"value": true}'),
  ('absence', '{"value": "He registrado tu solicitud. Yisus la revisará y te responderá por aquí mismo."}')
on conflict (key) do nothing;

-- ── Preguntas sin respuesta (solo OWNER las ve) ────────────────────
create table if not exists public.chatbot_unanswered (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  conversation_id uuid references public.chat_conversations (id) on delete set null,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.chatbot_unanswered enable row level security;
drop policy if exists "unanswered_owner_all" on public.chatbot_unanswered;
create policy "unanswered_owner_all" on public.chatbot_unanswered
  for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists "unanswered_visitor_insert" on public.chatbot_unanswered;
create policy "unanswered_visitor_insert" on public.chatbot_unanswered
  for insert to authenticated with check (true);

-- ── Bitácora administrativa (solo OWNER) ───────────────────────────
create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_activity_logs enable row level security;
drop policy if exists "logs_owner_all" on public.admin_activity_logs;
create policy "logs_owner_all" on public.admin_activity_logs
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ── Realtime para el inbox y el widget ─────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.chat_conversations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; end $$;
