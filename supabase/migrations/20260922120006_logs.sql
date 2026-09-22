-- Registros diarios de "Mí": hábitos, lecturas, agua, comida, energizantes, ciclo.

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  dia date not null default current_date,
  hecho boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, dia)
);

alter table public.habit_logs enable row level security;
create policy "habit_logs_select_own" on public.habit_logs for select using (user_id = auth.uid());
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (user_id = auth.uid());
create policy "habit_logs_update_own" on public.habit_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habit_logs_delete_own" on public.habit_logs for delete using (user_id = auth.uid());

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null default current_date,
  libro text,
  resumen text,
  created_at timestamptz not null default now()
);

alter table public.readings enable row level security;
create policy "readings_select_own" on public.readings for select using (user_id = auth.uid());
create policy "readings_insert_own" on public.readings for insert with check (user_id = auth.uid());
create policy "readings_update_own" on public.readings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "readings_delete_own" on public.readings for delete using (user_id = auth.uid());

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null default current_date,
  botellas numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, dia)
);

alter table public.water_logs enable row level security;
create policy "water_logs_select_own" on public.water_logs for select using (user_id = auth.uid());
create policy "water_logs_insert_own" on public.water_logs for insert with check (user_id = auth.uid());
create policy "water_logs_update_own" on public.water_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null default current_date,
  comida text not null check (comida in ('desayuno', 'almuerzo', 'cena', 'snack')),
  nombre text,
  kcal numeric,
  kcal_min numeric,
  kcal_max numeric,
  proteina_g numeric,
  carbos_g numeric,
  grasa_g numeric,
  confianza text,
  foto_path text,
  created_at timestamptz not null default now()
);

create index food_logs_user_dia_idx on public.food_logs (user_id, dia);

alter table public.food_logs enable row level security;
create policy "food_logs_select_own" on public.food_logs for select using (user_id = auth.uid());
create policy "food_logs_insert_own" on public.food_logs for insert with check (user_id = auth.uid());
create policy "food_logs_update_own" on public.food_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "food_logs_delete_own" on public.food_logs for delete using (user_id = auth.uid());

create table public.energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  drink_id uuid references public.drinks (id) on delete set null,
  mg numeric not null,
  consumido_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index energy_logs_user_consumido_idx on public.energy_logs (user_id, consumido_at);

alter table public.energy_logs enable row level security;
create policy "energy_logs_select_own" on public.energy_logs for select using (user_id = auth.uid());
create policy "energy_logs_insert_own" on public.energy_logs for insert with check (user_id = auth.uid());
create policy "energy_logs_delete_own" on public.energy_logs for delete using (user_id = auth.uid());

create table public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  inicio date not null,
  created_at timestamptz not null default now()
);

alter table public.cycle_logs enable row level security;
create policy "cycle_logs_select_own" on public.cycle_logs for select using (user_id = auth.uid());
create policy "cycle_logs_insert_own" on public.cycle_logs for insert with check (user_id = auth.uid());
create policy "cycle_logs_delete_own" on public.cycle_logs for delete using (user_id = auth.uid());
