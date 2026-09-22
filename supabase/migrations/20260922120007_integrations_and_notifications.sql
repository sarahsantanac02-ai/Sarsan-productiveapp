-- integrations guarda tokens de Google/Notion. Sin política de SELECT a
-- propósito: el cliente puede escribir (upsert con return=minimal, sin
-- .select()) pero no leer los tokens de vuelta — solo Edge Functions con
-- la service_role key los leen. TODO(fase 7): cifrar con pgsodium.
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  proveedor text not null check (proveedor in ('google', 'notion')),
  access_token text,
  refresh_token text,
  scopes text,
  expira_at timestamptz,
  notion_database_id text,
  created_at timestamptz not null default now(),
  unique (user_id, proveedor)
);

alter table public.integrations enable row level security;
create policy "integrations_insert_own" on public.integrations for insert with check (user_id = auth.uid());
create policy "integrations_update_own" on public.integrations for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "integrations_delete_own" on public.integrations for delete using (user_id = auth.uid());

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  dispositivo text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions_select_own" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "push_subscriptions_insert_own" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "push_subscriptions_delete_own" on public.push_subscriptions for delete using (user_id = auth.uid());

create table public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  por_franja boolean not null default true,
  cierre_hora time not null default '19:00',
  vencimientos boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;
create policy "notification_prefs_select_own" on public.notification_prefs for select using (user_id = auth.uid());
create policy "notification_prefs_update_own" on public.notification_prefs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
