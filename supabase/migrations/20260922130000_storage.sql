-- Buckets privados: las fotos de comida y los logos de etiquetas se leen con
-- URLs firmadas, nunca públicas (blueprint, sección de seguridad).
insert into storage.buckets (id, name, public)
values ('comida', 'comida', false), ('logos', 'logos', false)
on conflict (id) do nothing;

-- Convención de ruta: <user_id>/<archivo>. La primera carpeta es el dueño, y
-- eso es lo que revisa la política.
create policy "comida_propia" on storage.objects
  for all
  using (bucket_id = 'comida' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'comida' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos_propios" on storage.objects
  for all
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
