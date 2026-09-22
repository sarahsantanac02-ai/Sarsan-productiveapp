-- Al crear una cuenta (auth.users), sembramos su perfil y sus valores por
-- defecto (etiquetas, medios de pago, categorías, hábitos, energizantes,
-- preferencias de notificación) tal como los pide el blueprint.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));

  insert into public.notification_prefs (user_id) values (new.id);

  insert into public.tags (user_id, nombre, color, emoji, orden, es_default) values
    (new.id, 'General', '#6b7280', '✦', 0, true),
    (new.id, 'SAPQ', '#8b3ff0', '🏢', 1, true),
    (new.id, 'Universidad', '#3b82f6', '🎓', 2, true),
    (new.id, 'Twelve Sent', '#14b8a6', '📨', 3, true),
    (new.id, 'Casa Suba', '#f59e0b', '🏠', 4, true),
    (new.id, 'App videos', '#ec4899', '🎬', 5, true),
    (new.id, 'Virrey', '#ef4444', '🏙️', 6, true),
    (new.id, 'Effeta', '#10b981', '✳️', 7, true),
    (new.id, 'Emihs', '#6366f1', '🔷', 8, true),
    (new.id, 'Lucas', '#f97316', '👤', 9, true),
    (new.id, 'Personal', '#d946ef', '✨', 10, true);

  insert into public.payment_methods (user_id, nombre, tipo, orden) values
    (new.id, 'Efectivo', 'efectivo', 0),
    (new.id, 'Davivienda débito', 'debito', 1),
    (new.id, 'Davivienda crédito', 'credito', 2),
    (new.id, 'Nu tarjeta de crédito', 'credito', 3),
    (new.id, 'Cuenta Nu', 'debito', 4),
    (new.id, 'Nequi', 'debito', 5),
    (new.id, 'Llave (Bre-B)', 'transferencia', 6);

  insert into public.money_categories (user_id, tipo, nombre, emoji) values
    (new.id, 'gasto', 'Comida', '🍜'),
    (new.id, 'gasto', 'Transporte', '🚕'),
    (new.id, 'gasto', 'Casa', '🏠'),
    (new.id, 'gasto', 'Personal', '✨'),
    (new.id, 'gasto', 'Salud', '💊'),
    (new.id, 'ingreso', 'SAPQ', '🏢'),
    (new.id, 'ingreso', 'Freelance', '💼'),
    (new.id, 'ingreso', 'Otros', '✨');

  insert into public.habits (user_id, nombre, emoji, orden) values
    (new.id, 'Leer 20 minutos', '📖', 0),
    (new.id, 'Rutina de abdomen', '💪', 1),
    (new.id, 'Ir al gym', '🏋️', 2),
    (new.id, 'Escuchar el evangelio', '🙏', 3),
    (new.id, 'Crema en el cuerpo', '🧴', 4),
    (new.id, 'Desayunar', '🍳', 5),
    (new.id, 'Almorzar', '🍽️', 6),
    (new.id, 'Cenar', '🌙', 7);

  insert into public.drinks (user_id, nombre, emoji, mg_cafeina) values
    (new.id, 'Red Bull', '🔵', 80),
    (new.id, 'Monster', '🟢', 160),
    (new.id, 'Vive 100', '🟡', 100),
    (new.id, 'Amper', '🟠', 95),
    (new.id, 'Tinto', '☕', 70),
    (new.id, 'Café grande', '☕', 150),
    (new.id, 'Coca-Cola', '🥤', 40),
    (new.id, 'Té', '🍵', 40);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
