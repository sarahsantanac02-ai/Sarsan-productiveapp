# Plan — pantalla → tablas → funciones

Mapa de cada pantalla/módulo del blueprint (`docs/blueprint.md`) a sus tablas de Supabase y su lógica (Edge Functions o cálculo en cliente). Se usa para planear las migraciones y las funciones de cada fase.

| Pantalla / módulo | Tablas Supabase | Edge Functions / lógica | Fase |
| --- | --- | --- | --- |
| Onboarding | `profiles`, `tags`, `payment_methods`, `habits`, `drinks` (seeds) | — | 1 |
| Captura | `items`, `tag_hints` | `classify-capture` (haiku) | 2 |
| Hoy | `items`, `tags` | `plan-day` (sonnet); cálculo de franjas y urgencia en cliente | 3 |
| Calendario | `items` (`gcal_event_id`, `gcal_status`) | Edge Function `google-calendar` (leer rango visible, crear eventos/recurrencias RRULE) | 4 |
| Mí — no negociables | `habits`, `habit_logs` | cálculo de racha en cliente | 5 |
| Mí — lecturas | `readings` | — | 5 |
| Mí — agua | `water_logs`, `profiles` (`botella_ml`, `botellas_meta`) | — | 5 |
| Mí — comida | `food_logs` | `estimate-food` (sonnet, visión); cálculo de meta Mifflin-St Jeor en cliente | 5 |
| Mí — energizantes | `drinks`, `energy_logs` | cálculo de hora de corte en cliente | 5 |
| Mí — ciclo | `cycle_logs` | cálculo de duración/promedio en cliente | 5 |
| Finanzas | `transactions`, `payment_methods`, `money_categories` | — | 6 |
| Etiquetas | `tags` (+ Storage para `logo_path`) | — | 1 / 6 |
| Integraciones — Google | `integrations` | OAuth Google (Calendar + Gmail) vía Supabase Auth | 1 |
| Integraciones — Gmail SAPQ | — (lectura directa, sin tabla propia) | Edge Function `gmail-sapq` (`gmail.readonly`, filtra SunAce/SAPQ/sunacepq) | 7 |
| Integraciones — Notion | `integrations` (`notion_database_id`), `items` (`notion_page_id`, `notion_status`) | Edge Function `notion-sync` (crear fila bajo pedido, sincronizar "Hecha") | 7 |
| Notificaciones | `push_subscriptions`, `notification_prefs` | `pg_cron` + Edge Function `web-push` | 8 |
| Widgets | `items`, `water_logs` (lectura) | Capacitor + WidgetKit / App Widgets | 10 |

## Funciones de IA (Edge Functions, Deno)

| Función | Modelo | Entrada → salida |
| --- | --- | --- |
| `classify-capture` | `claude-haiku-4-5` | Texto + etiquetas + medios de pago + últimas 20 correcciones → JSON (tipo, tag_id, urgencia, fecha, hora, duracion_min, recurrencia, monto, medio_id, categoria, pedir_notion, texto_limpio) |
| `estimate-food` | `claude-sonnet-5` (visión) | Foto o descripción → nombre, kcal (rango), macros, confianza |
| `plan-day` | `claude-sonnet-5` | Pendientes + eventos de hoy + franjas + cafeína → resumen (≤3 frases) + franja por tarea |

Reglas fijas para las tres: respuesta solo en JSON validado con Zod; si falla, la captura queda como tarea en `General`, editable a mano. Montos en pesos colombianos ("18 mil" = 18.000).

## Cálculos de cliente (sin IA, con pruebas unitarias — ver Fase 9)

- Franjas de energía desde `hora_despertar` (ver tabla en `docs/blueprint.md#franjas-de-energía`).
- Urgencia por días restantes: ≤1 día → alta, ≤4 días → media, resto → baja.
- Meta de energía (Mifflin-St Jeor, mujer): `10×peso + 6.25×estatura − 5×edad − 161`, ajustada por factor de actividad (1.2 / 1.375 / 1.55 / 1.725).
- Racha de no negociables (días consecutivos marcados).
- Hora de corte de cafeína: `hora_dormir − 6h`.
- Expansión de recurrencias (`recurrencia.dias`, `.inicio`, `.hasta`) para marcar tareas por día.

## Pendiente antes de completar la Fase 0

- `docs/design-system.md` requiere los exports/capturas reales de Lovable en `reference/lovable/`, que todavía no están en el repo — ver nota en ese archivo.
