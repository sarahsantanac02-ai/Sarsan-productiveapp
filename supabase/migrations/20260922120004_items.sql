create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  texto text not null,
  texto_original text,
  tipo text not null check (tipo in ('tarea', 'evento', 'seguimiento', 'idea', 'gasto', 'ingreso')),
  tag_id uuid references public.tags (id) on delete set null,
  urgencia text check (urgencia in ('alta', 'media', 'baja')),
  fecha date,
  hora time,
  duracion_min int,
  recurrencia jsonb,
  done boolean not null default false,
  done_dates date[] not null default '{}',
  franja text check (franja in ('arranque', 'foco', 'bajon', 'segundo_aire', 'cierre')),
  franja_dia date,
  gcal_event_id text,
  gcal_status text,
  notion_page_id text,
  notion_status text,
  clasificando boolean not null default false,
  created_at timestamptz not null default now()
);

create index items_user_fecha_idx on public.items (user_id, fecha);
create index items_user_tag_idx on public.items (user_id, tag_id);

alter table public.items enable row level security;
create policy "items_select_own" on public.items for select using (user_id = auth.uid());
create policy "items_insert_own" on public.items for insert with check (user_id = auth.uid());
create policy "items_update_own" on public.items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "items_delete_own" on public.items for delete using (user_id = auth.uid());

create table public.tag_hints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  texto text not null,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.tag_hints enable row level security;
create policy "tag_hints_select_own" on public.tag_hints for select using (user_id = auth.uid());
create policy "tag_hints_insert_own" on public.tag_hints for insert with check (user_id = auth.uid());
create policy "tag_hints_delete_own" on public.tag_hints for delete using (user_id = auth.uid());
