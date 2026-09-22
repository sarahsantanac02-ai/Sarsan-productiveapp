-- Catálogos simples: medios de pago, categorías de dinero, hábitos (no negociables), energizantes.

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('efectivo', 'debito', 'credito', 'transferencia')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;
create policy "payment_methods_select_own" on public.payment_methods for select using (user_id = auth.uid());
create policy "payment_methods_insert_own" on public.payment_methods for insert with check (user_id = auth.uid());
create policy "payment_methods_update_own" on public.payment_methods for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "payment_methods_delete_own" on public.payment_methods for delete using (user_id = auth.uid());

create table public.money_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('gasto', 'ingreso')),
  nombre text not null,
  emoji text,
  created_at timestamptz not null default now()
);

alter table public.money_categories enable row level security;
create policy "money_categories_select_own" on public.money_categories for select using (user_id = auth.uid());
create policy "money_categories_insert_own" on public.money_categories for insert with check (user_id = auth.uid());
create policy "money_categories_update_own" on public.money_categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "money_categories_delete_own" on public.money_categories for delete using (user_id = auth.uid());

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  emoji text,
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;
create policy "habits_select_own" on public.habits for select using (user_id = auth.uid());
create policy "habits_insert_own" on public.habits for insert with check (user_id = auth.uid());
create policy "habits_update_own" on public.habits for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habits_delete_own" on public.habits for delete using (user_id = auth.uid());

create table public.drinks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  emoji text,
  mg_cafeina numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.drinks enable row level security;
create policy "drinks_select_own" on public.drinks for select using (user_id = auth.uid());
create policy "drinks_insert_own" on public.drinks for insert with check (user_id = auth.uid());
create policy "drinks_update_own" on public.drinks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "drinks_delete_own" on public.drinks for delete using (user_id = auth.uid());
