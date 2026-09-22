create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  descripcion text,
  color text not null default '#6b7280',
  emoji text,
  logo_path text,
  orden int not null default 0,
  es_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, nombre)
);

alter table public.tags enable row level security;

create policy "tags_select_own" on public.tags for select using (user_id = auth.uid());
create policy "tags_insert_own" on public.tags for insert with check (user_id = auth.uid());
create policy "tags_update_own" on public.tags for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tags_delete_own" on public.tags for delete using (user_id = auth.uid());

-- General no se puede borrar (blueprint: "General no se puede borrar").
create or replace function public.prevent_delete_general_tag()
returns trigger
language plpgsql
as $$
begin
  if old.nombre = 'General' then
    raise exception 'La etiqueta General no se puede borrar';
  end if;
  return old;
end;
$$;

create trigger tags_protect_general
  before delete on public.tags
  for each row execute function public.prevent_delete_general_tag();
