-- Revisión del correo: Claude lee la bandeja principal y propone eventos y
-- tareas. Sarah aprueba antes de que algo se cree — nada entra a su Google
-- Calendar sin que ella lo vea.

-- Mensajes que la revisión ya miró, hayan dado algo o no. Sin esto cada
-- revisión volvería a pagarle a la IA por los mismos correos.
create table if not exists public.mail_seen (
  user_id uuid not null references auth.users (id) on delete cascade,
  gmail_message_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, gmail_message_id)
);

alter table public.mail_seen enable row level security;
drop policy if exists "mail_seen_select_own" on public.mail_seen;
drop policy if exists "mail_seen_insert_own" on public.mail_seen;
drop policy if exists "mail_seen_delete_own" on public.mail_seen;
create policy "mail_seen_select_own" on public.mail_seen for select using (user_id = auth.uid());
create policy "mail_seen_insert_own" on public.mail_seen for insert with check (user_id = auth.uid());
create policy "mail_seen_delete_own" on public.mail_seen for delete using (user_id = auth.uid());

-- Lo que la IA encontró. `etiqueta` guarda el NOMBRE, no el id: la fila se crea
-- desde la Edge Function y el nombre es lo que devuelve el modelo; resolverlo a
-- tag_id se hace al aceptar, en el cliente, que ya tiene las etiquetas cargadas.
create table if not exists public.mail_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  gmail_message_id text not null,
  gmail_thread_id text not null,
  asunto text not null,
  de text not null,
  recibido_at timestamptz,
  link text not null,
  tipo text not null check (tipo in ('evento', 'tarea')),
  titulo text not null,
  fecha date,
  hora time,
  duracion_min int,
  etiqueta text,
  razon text,
  estado text not null default 'propuesta' check (estado in ('propuesta', 'aceptada', 'descartada')),
  item_id uuid references public.items (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, gmail_message_id)
);

create index if not exists mail_suggestions_pendientes_idx
  on public.mail_suggestions (user_id, estado, created_at desc);

alter table public.mail_suggestions enable row level security;
drop policy if exists "mail_suggestions_select_own" on public.mail_suggestions;
drop policy if exists "mail_suggestions_insert_own" on public.mail_suggestions;
drop policy if exists "mail_suggestions_update_own" on public.mail_suggestions;
drop policy if exists "mail_suggestions_delete_own" on public.mail_suggestions;
create policy "mail_suggestions_select_own" on public.mail_suggestions for select using (user_id = auth.uid());
create policy "mail_suggestions_insert_own" on public.mail_suggestions for insert with check (user_id = auth.uid());
create policy "mail_suggestions_update_own" on public.mail_suggestions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mail_suggestions_delete_own" on public.mail_suggestions for delete using (user_id = auth.uid());
