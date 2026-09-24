-- Cuándo se marcó hecho un pendiente (no solo si). La usan la pestaña
-- "Realizadas" (lo hecho esta semana) y el Historial de Ajustes (lo hecho
-- antes de esta semana, agrupado por mes). Se llena/limpia desde el cliente
-- al tocar el check, no con un trigger, porque Hoy ya tiene el "hoy" de
-- Sarah en hora Bogotá calculado ahí mismo.
alter table public.items add column if not exists completado_en timestamptz;
