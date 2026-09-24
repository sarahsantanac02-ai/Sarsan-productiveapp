-- Aviso individual por cada pendiente de "Hoy" (uno por tarea, no agrupado
-- como "vencimientos"). Sin tope: si hay 8 pendientes, salen 8 avisos.
alter table public.notification_prefs add column if not exists pendientes_individuales boolean not null default false;
alter table public.notification_prefs add column if not exists pendientes_hora time not null default '07:00';
