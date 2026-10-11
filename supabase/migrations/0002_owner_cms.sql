-- ═══════════════════════════════════════════════════════════════
--  YISUS D DEV · Migración 0002 — OWNER + contenido del portafolio
--  Aplica con: npm run migrate
--  El primer OWNER se crea con el procedimiento de docs/OWNER_PANEL.md
--  (Auth dashboard + INSERT manual; nadie puede auto-otorgarse el rol)
-- ═══════════════════════════════════════════════════════════════

-- ──Autorización: perfiles de propietario ─────────────────────────
create table if not exists public.owner_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'collaborator')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.owner_profiles enable row level security;
-- Cada usuario autenticado solo puede ver SU propia fila (para el chequeo
-- de rol). Sin políticas de INSERT/UPDATE/DELETE: el rol solo se otorga
-- vía SQL administrativo (service_role / SQL editor). Imposible auto-darse.
drop policy if exists "owner_profiles_self_read" on public.owner_profiles;
create policy "owner_profiles_self_read"
  on public.owner_profiles for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.owner_profiles
    where user_id = auth.uid() and role = 'owner'
  );
$$;

-- ── updated_at automático ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── site_settings (SOLO valores no sensibles; jamás secretos) ─────
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "settings_owner_all" on public.site_settings;
create policy "settings_owner_all" on public.site_settings for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop trigger if exists trg_settings_updated on public.site_settings;
create trigger trg_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ── projects ──────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null check (char_length(title) between 2 and 120),
  tagline text not null default '',
  problem text not null default '',
  solution text not null default '',
  features jsonb not null default '[]'::jsonb,
  stack text[] not null default '{}',
  type text not null default 'Web App',
  status text not null default 'En desarrollo',
  category text not null default 'Web',
  demo_url text not null default '',
  repo_url text not null default '',
  accent text not null default '#8b5cf6',
  architecture jsonb not null default '[]'::jsonb,
  challenges jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_published_idx on public.projects (is_published, sort_order);
alter table public.projects enable row level security;
drop policy if exists "projects_public_read" on public.projects;
create policy "projects_public_read" on public.projects for select to anon, authenticated using (is_published = true);
drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order int not null default 0
);
alter table public.project_media enable row level security;
drop policy if exists "media_public_read" on public.project_media;
create policy "media_public_read" on public.project_media for select to anon, authenticated using (true);
drop policy if exists "media_owner_all" on public.project_media;
create policy "media_owner_all" on public.project_media for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ── news_posts ────────────────────────────────────────────────────
create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null check (char_length(title) between 2 and 160),
  excerpt text not null default '',
  content text not null default '',
  cover_url text not null default '',
  category text not null default 'General',
  tags text[] not null default '{}',
  project_id uuid references public.projects (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists news_published_idx on public.news_posts (status, published_at desc);
alter table public.news_posts enable row level security;
drop policy if exists "news_public_read" on public.news_posts;
create policy "news_public_read" on public.news_posts for select to anon, authenticated using (status = 'published');
drop policy if exists "news_owner_all" on public.news_posts;
create policy "news_owner_all" on public.news_posts for all to authenticated using (public.is_owner()) with check (public.is_owner());
drop trigger if exists trg_news_updated on public.news_posts;
create trigger trg_news_updated before update on public.news_posts
  for each row execute function public.set_updated_at();

-- ── services / skills / experiences / social_links / faqs ────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text not null default '',
  problem text not null default '', cta text not null default 'Contarme',
  icon text not null default 'globe',
  sort_order int not null default 0, is_active boolean not null default true
);
alter table public.services enable row level security;
drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services for select to anon, authenticated using (is_active = true);
drop policy if exists "services_owner_all" on public.services;
create policy "services_owner_all" on public.services for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  category text not null, items text[] not null default '{}',
  sort_order int not null default 0
);
alter table public.skills enable row level security;
drop policy if exists "skills_public_read" on public.skills;
create policy "skills_public_read" on public.skills for select to anon, authenticated using (true);
drop policy if exists "skills_owner_all" on public.skills;
create policy "skills_owner_all" on public.skills for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'experience' check (kind in ('experience', 'education', 'certification')),
  period text not null default '', title text not null,
  org text not null default '', description text not null default '',
  tags text[] not null default '{}', sort_order int not null default 0
);
alter table public.experiences enable row level security;
drop policy if exists "exp_public_read" on public.experiences;
create policy "exp_public_read" on public.experiences for select to anon, authenticated using (true);
drop policy if exists "exp_owner_all" on public.experiences;
create policy "exp_owner_all" on public.experiences for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  network text not null, label text not null, href text not null,
  sort_order int not null default 0, is_active boolean not null default true
);
alter table public.social_links enable row level security;
drop policy if exists "social_public_read" on public.social_links;
create policy "social_public_read" on public.social_links for select to anon, authenticated using (is_active = true);
drop policy if exists "social_owner_all" on public.social_links;
create policy "social_owner_all" on public.social_links for all to authenticated using (public.is_owner()) with check (public.is_owner());

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null, answer text not null,
  sort_order int not null default 0, is_active boolean not null default true
);
alter table public.faqs enable row level security;
drop policy if exists "faqs_public_read" on public.faqs;
create policy "faqs_public_read" on public.faqs for select to anon, authenticated using (is_active = true);
drop policy if exists "faqs_owner_all" on public.faqs;
create policy "faqs_owner_all" on public.faqs for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ── Storage: bucket público para el portafolio ────────────────────
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

drop policy if exists "media_pub_read" on storage.objects;
create policy "media_pub_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'portfolio-media');
drop policy if exists "media_owner_write" on storage.objects;
create policy "media_owner_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio-media' and public.is_owner());
drop policy if exists "media_owner_update" on storage.objects;
create policy "media_owner_update" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio-media' and public.is_owner());
drop policy if exists "media_owner_delete" on storage.objects;
create policy "media_owner_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio-media' and public.is_owner());
