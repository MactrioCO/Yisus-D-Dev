-- YISUS D DEV · Migración 0004 — portada de proyectos
-- Permite que el panel asigne una imagen (URL de portfolio-media) al proyecto.

alter table public.projects
  add column if not exists cover_url text not null default '';
