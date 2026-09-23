-- Descripción libre de un pendiente: lo que no cabe en el título. Se edita
-- manteniendo presionada la card en Hoy.
alter table public.items add column if not exists descripcion text;
