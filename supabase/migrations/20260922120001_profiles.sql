-- profiles: 1:1 con auth.users. Excepción a la convención user_id — aquí
-- el id ES el user_id (id references auth.users(id)).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  hora_despertar time not null default '06:00',
  hora_dormir time not null default '22:00',
  edad int,
  estatura_cm numeric not null default 147,
  peso_kg numeric not null default 51,
  actividad numeric not null default 1.375 check (actividad in (1.2, 1.375, 1.55, 1.725)),
  botella_ml int not null default 700,
  botellas_meta int not null default 3,
  zona_horaria text not null default 'America/Bogota',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
