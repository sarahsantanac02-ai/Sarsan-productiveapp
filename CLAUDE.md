# CLAUDE.md

SarSan: app móvil personal de productividad y bienestar para Sarah (diseñadora UX/UI y estudiante de Diseño Industrial, Bogotá). Voz → IA clasifica → tareas, eventos, gastos, hábitos y bienestar en un solo lugar. Detalle completo en `docs/blueprint.md` — si algo aquí y el blueprint se contradicen, gana el blueprint.

Estado actual: **Fase 0 (auditoría)**. Todavía no existe código de app; este archivo describe la estructura planeada y se actualiza al final de cada fase.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui, PWA instalable (manifest + service worker).
- Datos: TanStack Query + `supabase-js`.
- Backend: Supabase (Postgres + RLS en toda tabla, Auth con Google, Storage, Edge Functions en Deno, `pg_cron`).
- IA: API de Anthropic solo desde Edge Functions — `claude-haiku-4-5` para clasificar capturas, `claude-sonnet-5` para fotos de comida y para "Organizar mi día". Respuestas en JSON validadas con Zod.
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

## Estructura planeada

```
/src
  /components       # UI compartida (shadcn + estética Lovable)
  /features
    capture/         # micrófono, clasificación, bottom sheets
    today/           # franjas de energía, pendientes, "Organizar mi día"
    calendar/        # vistas Día/3 días/Mes, Google Calendar
    me/               # no negociables, agua, comida, energizantes, ciclo
    finance/         # gastos/ingresos, medios, categorías
    tags/            # etiquetas
    integrations/    # Google, Gmail, Notion
  /lib               # supabase client, formatters, cálculos (franjas, urgencia, Mifflin-St Jeor)
  /hooks
/supabase
  /migrations
  /functions
    classify-capture/
    estimate-food/
    plan-day/
    google-calendar/
    gmail-sapq/
    notion-sync/
    web-push/
/docs
  blueprint.md        # fuente de verdad del producto
  design-system.md    # tokens extraídos de reference/lovable/
  plan.md             # mapa pantalla → tablas → funciones
/reference
  lovable/            # export/capturas de Lovable — SOLO referencia visual, no se construye sobre esto
```

## Comandos

Se documentan aquí a medida que el proyecto se scaffolda (Fase 1). Previstos:

- `npm run dev` — servidor de desarrollo Vite
- `npm run build` — build de producción
- `npm run test` — pruebas unitarias (franjas, urgencia, Mifflin-St Jeor, rachas, recurrencias, prompts de IA)
- `npx supabase db diff` / `npx supabase migration new <nombre>` — migraciones
- `npx supabase functions serve <nombre>` / `npx supabase functions deploy <nombre>` — Edge Functions

## Fases

Ver tabla completa en `docs/blueprint.md#plan-por-fases-para-claude-code`. Cada fase termina con algo usable en el celular y espera el OK de Sarah antes de continuar.
