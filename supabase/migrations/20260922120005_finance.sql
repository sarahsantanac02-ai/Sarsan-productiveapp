create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('gasto', 'ingreso')),
  monto numeric not null check (monto > 0),
  categoria_id uuid references public.money_categories (id) on delete set null,
  medio_id uuid references public.payment_methods (id) on delete set null,
  fecha date not null default current_date,
  texto text,
  created_at timestamptz not null default now()
);

create index transactions_user_fecha_idx on public.transactions (user_id, fecha);

alter table public.transactions enable row level security;
create policy "transactions_select_own" on public.transactions for select using (user_id = auth.uid());
create policy "transactions_insert_own" on public.transactions for insert with check (user_id = auth.uid());
create policy "transactions_update_own" on public.transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions_delete_own" on public.transactions for delete using (user_id = auth.uid());
