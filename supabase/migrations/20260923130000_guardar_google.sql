-- Guardar los tokens de Google desde el navegador.
--
-- `integrations` no tiene política de SELECT a propósito (el navegador no debe
-- poder leerse los tokens). Pero el cliente guardaba con upsert, que en
-- Postgres es INSERT … ON CONFLICT DO UPDATE, y con RLS eso exige también
-- poder hacer SELECT de la fila existente. Resultado: "new row violates
-- row-level security policy" en cada login y Google nunca quedaba conectado.
--
-- En vez de abrir la lectura, esta función hace el upsert por dentro
-- (security definer) y solo para auth.uid(): no se le puede pasar otro user_id.
-- Un token que no venga (null) no pisa el que ya estaba guardado.

create or replace function public.guardar_google(
  p_refresh_token text,
  p_access_token text,
  p_expira_at timestamptz,
  p_scopes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Hace falta una sesión para guardar la conexión con Google';
  end if;

  insert into public.integrations as i (user_id, proveedor, refresh_token, access_token, expira_at, scopes)
  values (auth.uid(), 'google', p_refresh_token, p_access_token, p_expira_at, p_scopes)
  on conflict (user_id, proveedor) do update set
    refresh_token = coalesce(excluded.refresh_token, i.refresh_token),
    -- access_token y expira_at van juntos: si no vino token nuevo, se quedan los dos.
    access_token = case when excluded.access_token is null then i.access_token else excluded.access_token end,
    expira_at = case when excluded.access_token is null then i.expira_at else excluded.expira_at end,
    scopes = coalesce(excluded.scopes, i.scopes);
end;
$$;

revoke all on function public.guardar_google(text, text, timestamptz, text) from public, anon;
grant execute on function public.guardar_google(text, text, timestamptz, text) to authenticated;
