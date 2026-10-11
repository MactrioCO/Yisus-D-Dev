-- 0005: claves iniciales de contacto en site_settings (editables desde el panel → Ajustes)
insert into public.site_settings (key, value)
values
  ('email', '""'::jsonb),
  ('whatsapp', '""'::jsonb)
on conflict (key) do nothing;
