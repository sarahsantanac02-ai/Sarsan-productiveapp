-- Control de envíos: evita mandar el mismo aviso dos veces el mismo día
-- (el cron corre cada 15 minutos y las ventanas se solapan).
create table if not exists public.notifications_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null,
  dia date not null,
  created_at timestamptz not null default now(),
  unique (user_id, tipo, dia)
);

alter table public.notifications_sent enable row level security;
drop policy if exists "notifications_sent_select_own" on public.notifications_sent;
create policy "notifications_sent_select_own" on public.notifications_sent for select using (user_id = auth.uid());

-- La franja alta manda dos avisos al día (Foco y Segundo aire), así que el
-- tipo lleva la franja adentro: 'franja:foco', 'franja:segundo_aire',
-- 'vencimientos', 'cierre', 'cafeina'.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- El cron llama a la Edge Function cada 15 minutos. La llave de servicio sale
-- del Vault de Supabase, no del repo: hay que crearla una vez con
--   select vault.create_secret('<service_role_key>', 'service_role_key');
select cron.schedule(
  'sarsan-notificaciones',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := 'https://hapzosvmagvjowrcnetk.supabase.co/functions/v1/check-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
