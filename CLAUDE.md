# CLAUDE.md

SarSan: app móvil personal de productividad y bienestar para Sarah (diseñadora UX/UI y estudiante de Diseño Industrial, Bogotá). Voz → IA clasifica → tareas, eventos, gastos, hábitos y bienestar en un solo lugar. Detalle completo en `docs/blueprint.md` — si algo aquí y el blueprint se contradicen, gana el blueprint.

Estado actual: **Fases 0–9 construidas.** Falta solo la Fase 10 (widgets nativos), que necesita Xcode y cuenta de Apple Developer.

- **1 Base** — Supabase con esquema, RLS y seeds; Auth con Google; onboarding; navegación.
- **2 Captura** — voz (Web Speech es-CO) y texto → `classify-capture` (haiku) → card al instante en "ordenando"; pregunta fecha o medio cuando faltan; las correcciones de etiqueta alimentan `tag_hints`.
- **3 Hoy** — franjas de energía desde la hora de despertar, y `plan-day` (sonnet) reparte pendientes y escribe el resumen.
- **4 Calendario** — `google-calendar` lee y crea (con RRULE); vistas Día/3 días/Mes con solapes, línea de hora actual y resumen de ocupación.
- **5 Mí** — no negociables con racha, agua, lecturas, `estimate-food` (sonnet con visión), energizantes con hora de corte, ciclo.
- **6 Finanzas** — gastos/ingresos por mes, categorías, medios, aviso de crédito, campo rápido que reusa la captura.
- **7 Integraciones** — `gmail-sapq` y `notion-sync` (OAuth, base "SarSan — Tareas", "Colocar en Notion", sync de Hecha).
- **Del correo** (fuera del blueprint, pedido por Sarah) — `gmail-triage` lee la bandeja principal de los últimos 7 días y propone eventos y tareas; ella aprueba en Hoy y ahí sí se crea el item (y el evento en Google).
- **8 Notificaciones** — service worker propio, `check-notifications` por `pg_cron`, pantalla de Ajustes.
- **9 Pulido** — modo oscuro verificado (el `h1` computa el blanco correcto, que era el bug del prototipo), estados vacíos y de error en cada pantalla.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui, PWA instalable (manifest + service worker).
- Datos: TanStack Query + `supabase-js`.
- Backend: Supabase (Postgres + RLS en toda tabla, Auth con Google, Storage, Edge Functions en Deno, `pg_cron`).
- IA: API de Anthropic solo desde Edge Functions — `claude-haiku-4-5` para clasificar capturas, `claude-sonnet-5` para fotos de comida, "Organizar mi día" y la revisión del correo. Respuestas en JSON validadas con Zod.
- Voz: Web Speech API, `lang="es-CO"`.
- Notificaciones: Web Push + VAPID.

## Convenciones

- Todo el texto de UI en español de Colombia, tono directo y cálido. Zona horaria `America/Bogota`, moneda COP.
- El cliente nunca llama directo a Anthropic, Google ni Notion: siempre a través de Edge Functions. Ninguna llave ni token en el cliente.
- Cada tabla lleva `user_id uuid references auth.users`, `created_at`, y RLS con `user_id = auth.uid()` en la misma migración que la crea.
- Migraciones SQL versionadas en `supabase/migrations`; seeds para los valores por defecto de Sarah (etiquetas, medios de pago, no negociables, energizantes).
- Tipos generados desde el esquema de Supabase (`supabase gen types typescript`); nada de `any`.
- Pantallas de `reference/lovable/` son solo referencia visual (como un Figma): replicar estética (color, tipografía, espaciado, radios, componentes), nunca su lógica, estado o estructura de archivos.
- Cada integración (Google, Gmail, Notion) maneja sus errores por separado: si una falla, el resto de la app sigue funcionando y muestra cómo reconectar.
- Antes de borrar archivos, cambiar un esquema existente o instalar una dependencia grande: preguntar a Sarah primero.
- Antes de la siguiente fase: resumen de lo hecho, cómo probarlo en el celular, qué sigue, y esperar el OK de Sarah.

## Estructura

```
/src
  sw.ts              # service worker propio (injectManifest): push + notificationclick
  /components/ui     # primitivas shadcn-style (Button, Card, Input, Label, Sheet) + app-shell (header/dock)
  /hooks             # use-minuto (tick de 60s para que la franja actual se mueva sola)
  /features
    auth/            # AuthProvider, sign-in con Google
    onboarding/      # perfil (hora_despertar/dormir, edad) — gate antes de la app
    capture/         # voz, sheet manual, sheets de fecha y medio, task-card, use-items
    today/           # Hoy — franja-bar, pendientes, "Organizar mi día"
    calendar/        # Día / 3 días / Mes contra Google Calendar
    me/              # hábitos, agua, lecturas, comida (foto), energizantes, ciclo
    finance/         # movimientos por mes, categorías, medios de pago
    tags/            # hook y sheet de etiquetas (usados por Hoy y por Captura)
    integrations/    # Notion (OAuth + callback), Gmail SAPQ — Google se conecta en auth/
    notifications/   # Ajustes: tema, push por dispositivo, preferencias de aviso
  /lib               # supabase, theme, date, query-client, cn(), imagen
                     # + lógica pura con pruebas: franjas, urgencia, salud, agenda, dinero
/supabase
  /migrations        # esquema + RLS + seeds + storage + cron (aplicados a mano vía SQL Editor — ver abajo)
  /functions
    _shared/         # cors, franjas (duplicado del front), google (OAuth + refresh), push (VAPID)
    classify-capture/  # haiku — index.ts + prompt.ts + schema.ts (enums de nombres + Zod)
    plan-day/          # sonnet — reparte pendientes en las franjas y escribe el resumen
    estimate-food/     # sonnet con visión — calorías aproximadas desde una foto
    google-calendar/   # lee y crea eventos (con RRULE) en Google Calendar
    gmail-sapq/        # lee el buzón SAPQ
    gmail-triage/      # sonnet — lee la bandeja principal y propone eventos y tareas
    notion-sync/       # OAuth, crea "SarSan — Tareas", sincroniza Hecha
    check-notifications/ # lo llama pg_cron cada 15 min; decide y manda los avisos
/docs
  blueprint.md        # fuente de verdad del producto
  design-system.md    # tokens extraídos de reference/lovable/
  plan.md             # mapa pantalla → tablas → funciones
  despliegue.md       # todo lo que hay que dejar configurado afuera del repo
/reference
  lovable/            # export/capturas de Lovable — SOLO referencia visual, no se construye sobre esto
```

Dos decisiones que no son obvias al leer el código:

- **`classify-capture` NO usa `strict: true`** en el JSON Schema de la herramienta. Lo usaba, y la API
  rechazaba la llamada entera: todo caía en el `catch` y terminaba como tarea en General. La garantía
  del JSON la da Zod al validar la respuesta, no el `strict`.
- **El modelo responde con nombres, no con UUIDs** (`Virrey`, `Nequi`, `Comida`). Pedirle que copie un
  uuid de memoria es justo lo que peor hacen los modelos; los nombres se resuelven a id en el servidor.

Nota sobre las migraciones: como este entorno no tiene el `service_role` ni la contraseña de la base de datos de Sarah, todas las migraciones se aplicaron pegando el SQL en el SQL Editor del Dashboard de Supabase en vez de `supabase db push`. Los archivos en `supabase/migrations` son la fuente de verdad versionada; para cada migración nueva, usar `npx supabase db push` o repetir el pegado a mano.

Como ese pegado no queda registrado en `supabase_migrations`, una migración se puede correr dos veces sin querer. Escribirlas idempotentes cuando se pueda (`create table if not exists`, `on conflict do nothing`, `drop policy if exists` antes del `create policy`).

## Comandos

- `npm install` — instala dependencias
- `npm run dev` — servidor de desarrollo Vite (http://localhost:5173)
- `npm run build` — typecheck (`tsc -b`) + build de producción (incluye el service worker vía `vite-plugin-pwa`)
- `npm run lint` — ESLint (flat config, ignora `reference/`)
- `npm run test` — pruebas unitarias (vitest): 48 specs sobre la lógica pura de `src/lib`
- `npm run gen:types` — regenera `src/lib/database.types.ts` desde el esquema real de Supabase (requiere `supabase login` una vez)
- `npx supabase migration new <nombre>` — nueva migración versionada en `supabase/migrations`
- `npx supabase db push` — aplica migraciones pendientes al proyecto vinculado (alternativa a pegar el SQL a mano en el Dashboard)

Variables de entorno: copiar `.env.example` a `.env.local` (ya gitignored) con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto de Supabase.

Secrets de Edge Functions (Dashboard → Edge Functions → Secrets, nunca en el repo): `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`. `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase solo.

Además, para el cron de notificaciones hay que meter la service_role al Vault una vez:
`select vault.create_secret('<service_role_key>', 'service_role_key');`

Las Edge Functions corren con el JWT de Sarah (no con la service_role), así que el RLS también aplica adentro: `classify-capture` solo puede leer y escribir sus propias filas.

## Fases

Ver tabla completa en `docs/blueprint.md#plan-por-fases-para-claude-code`. Cada fase termina con algo usable en el celular y espera el OK de Sarah antes de continuar.
