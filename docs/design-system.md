# Sistema de diseño — SarSan

Extraído del prototipo de Lovable (`vacia-mente-clara`, ahora en `reference/lovable/`) el 2026-09-22: código fuente en `reference/lovable/source/` y capturas en `reference/lovable/screenshots/`. **Solo referencia visual** — el prototipo es un solo componente (`vacia-app.tsx`) con datos hardcodeados y sin backend; no se reutiliza su lógica ni su estructura de archivos, solo sus tokens y patrones visuales.

## Colores

Tailwind v4 con variables CSS en `oklch`, definidas en `:root` (claro) y `.dark` (oscuro), mapeadas a utilidades vía `@theme inline` (`--color-primary` → `bg-primary`/`text-primary`, etc.).

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `background` | `oklch(0.973 0.004 270)` | `oklch(0.17 0.012 275)` | Fondo de pantalla |
| `foreground` | `oklch(0.205 0.008 270)` | `oklch(0.96 0.004 270)` | Texto principal |
| `card` | `oklch(1 0 0)` | `oklch(0.22 0.014 275)` | Fondo de cards |
| `card-foreground` | `oklch(0.205 0.008 270)` | `oklch(0.984 0.003 247.858)` | Texto en cards |
| `primary` | `oklch(0.55 0.245 295)` (morado) | `oklch(0.7 0.2 295)` | Acciones principales, mic, activo |
| `primary-foreground` | `oklch(0.99 0 0)` | igual | Texto sobre `primary` |
| `primary-soft` | `oklch(0.94 0.035 295)` | `oklch(0.3 0.08 295)` | Fondos suaves (badges, iconos) |
| `secondary` / `muted` | `oklch(0.95 0.006 270)` / `oklch(0.943 0.006 270)` | `oklch(0.279 0.041 260.031)` / `oklch(0.27 0.012 275)` | Fondos neutros, barras |
| `muted-foreground` | `oklch(0.52 0.012 270)` | `oklch(0.7 0.01 270)` | Texto secundario |
| `border` / `input` | `oklch(0.92 0.007 270)` | `oklch(1 0 0 / 10%)` / `oklch(1 0 0 / 15%)` | Bordes de cards, inputs |
| `success` | `oklch(0.64 0.17 154)` (verde) | — | Check completado |
| `urgent` / `urgent-soft` | `oklch(0.62 0.19 36)` / `oklch(0.95 0.035 36)` (rojo-naranja) | — | Urgencia alta, hora actual en calendario |
| `amber` / `amber-soft` / `amber-strong` | `oklch(0.75 0.16 78)` / `oklch(0.95 0.055 85)` / `oklch(0.56 0.13 70)` | — | Alertas de tarjeta de crédito, cafeína |
| `app-shell` | `oklch(0.9 0.008 270)` | — | Fondo detrás del "marco" de celular en desktop |
| `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errores |

Colores de etiqueta (uno por etiqueta, con variante `-soft` para fondos de chip):

| Etiqueta de ejemplo | Color | Soft |
| --- | --- | --- |
| SAPQ | `oklch(0.55 0.245 295)` (morado, = `primary`) | `oklch(0.95 0.03 295)` |
| Universidad | `oklch(0.61 0.16 250)` (azul) | `oklch(0.95 0.025 250)` |
| Twelve Sent | `oklch(0.67 0.15 180)` (verde azulado) | `oklch(0.95 0.03 180)` |
| Casa Suba | `oklch(0.72 0.16 78)` (ámbar) | `oklch(0.96 0.035 78)` |
| Personal | `oklch(0.68 0.18 340)` (rosa) | `oklch(0.96 0.03 340)` |

El blueprint pide más etiquetas por defecto (General, App videos, Virrey, Effeta, Emihs, Lucas) que el prototipo no cubre — al construir, generar sus colores siguiendo el mismo patrón (`oklch` con luminosidad ~0.55–0.72, chroma ~0.15–0.25, un hue distinto por etiqueta) en vez de codificarlos a mano.

`chart-1..5` y los tokens `sidebar-*` existen (boilerplate de shadcn) pero **no se usan** en ninguna pantalla del prototipo — no hay gráficas `recharts` reales todavía; se definen igual por si `docs/plan.md` los necesita más adelante.

## Tipografía

- Import: Google Fonts, `Inter:wght@400;500;600` + `Poppins:wght@600;700`.
- `--font-sans: "Inter", sans-serif` — texto de cuerpo, labels, botones.
- `--font-display: "Poppins", sans-serif` (clase `font-display`) — títulos de pantalla, encabezados de sección, nombres de tarea, montos.
- Escalas observadas: título de pantalla `text-[34px] font-bold` (Hoy) / `text-[32px] font-bold` (otras pantallas), títulos de sheet `text-2xl font-bold`, encabezados de sección `text-lg`/`font-display font-semibold` (sin tamaño explícito = 1rem), monto grande en Finanzas `text-[38px] font-bold`, cuerpo `text-sm`, metadatos/tags `text-xs`/`text-[10px]`/`text-[9px]`.
- `letter-spacing: 0` fijado en `body`.

## Radios y espaciado

`--radius: 0.875rem` (14px) es la base; el resto se deriva:

| Token | Valor | Uso típico |
| --- | --- | --- |
| `radius-sm` | 10px | — |
| `radius-md` | 12px (reemplaza el `rounded-md` por defecto de Tailwind) | Botones tamaño sm/lg |
| `radius-lg` (`--radius`) | 14px | — |
| `radius-xl` | 18px | Badges de icono cuadrados (`rounded-xl`), botones por defecto |
| `radius-2xl` | 22px | Cards de contenido (`rounded-2xl border border-border bg-card`) — el patrón más común |
| `radius-3xl` / `radius-4xl` | 26px / 30px | — |
| Sheets (bottom sheet) | `rounded-t-[24px]` | Esquinas superiores del modal |
| Marco de celular (desktop) | `rounded-[28px]` | Solo en el contenedor `sm:` de escritorio |

Espaciado: gutter horizontal de pantalla `px-4`; secciones apiladas con `space-y-5` o `space-y-6`; cards con `p-4` (o `p-3.5` en task cards); gap entre chips/botones `gap-2`/`gap-1.5`. El layout objetivo es **390×844 (iPhone)** — en pantallas más anchas (`sm:`) todo vive centrado dentro de un marco de celular con borde y esquinas redondeadas; en móvil real ocupa todo el viewport.

## Componentes clave (con sus variantes exactas)

**Botón** (`buttonVariants`, base: `rounded-xl text-sm font-semibold`, `active:scale-[.98]` en el variante `default`):

| Variante | Estilo | Dónde aparece |
| --- | --- | --- |
| `default` | `bg-primary text-primary-foreground` | CTA principal de sheets |
| `pill` / `pillActive` | borde + fondo card / fondo `foreground` sólido | Nav superior (Calendario, Mí, Finanzas, Todo) |
| `chip` | `rounded-full border border-border bg-card` | "＋ Nueva etiqueta", chips de acción |
| `check` / `checkActive` | círculo con borde / círculo `bg-success` | Checks de tarea y de hábito |
| `soft` | `bg-primary-soft text-primary` | Botones secundarios (+¼ de agua, "Escribir resumen") |
| `tile` | card pequeña `h-12` | Selector de energizante |
| `segment` / `segmentActive` | pestaña sin fondo / pestaña con `bg-card` dentro de `bg-muted p-1` | Selector Día/Mes, Gastos/Ingresos |
| `choice` / `choiceActive` | card `h-14` / borde+fondo `primary-soft` | Opciones de fecha rápida |
| `emoji` / `emojiActive` | igual patrón que choice, para grid de emojis | Selector de emoji de etiqueta |
| `dock` / `dockActive` / `pencil` | columna icono+label 10px | Barra inferior |
| `mic` | círculo `bg-primary` con `ring-8 ring-primary-soft` | Botón central de captura por voz |
| `energy` | píldora `bg-primary-soft` | Indicador de energía disponible en el header |
| `energyBand` | sin fondo, columna | Barras de franja de energía tocables |
| `swatch` | círculo con `border-2 border-background` | Selector de color de etiqueta |

**Card genérica**: no se usa el componente shadcn `<Card>` (existe en `ui/card.tsx` pero el prototipo no lo importa) — el patrón real en toda la app es un `<div>`/`<section>` con `rounded-2xl border border-border bg-card p-4` (o `p-3.5`). Replicar ESTE patrón, no el componente shadcn por defecto.

**Task card**: `rounded-2xl border border-border border-l-[5px] bg-card p-3.5`, borde izquierdo grueso del color de la etiqueta (`border-l-{color}`), check circular a la izquierda, badge cuadrado con emoji/logo de etiqueta a la derecha, fila de `.tag` chips abajo (hora/fecha, franja, "Colocar en Notion").

**Chips (`.tag` en `styles.css`)**: pill `border-radius: 999px`, `padding: .25rem .5rem`, `font-size: 10px`, 3 variantes — `tag-neutral` (gris), `tag-date` (ámbar), `tag-urgent` (rojo).

**Componentes custom con CSS propio** (en `@layer components` de `styles.css`, no son utilidades Tailwind):
- `.progress-ring` — anillo circular de progreso vía `conic-gradient`, usado en "No negociables" (Mí).
- `.water-bottle` — botella SVG-like en CSS puro (borde + relleno animado por altura), para el tracker de agua.
- `.cycle-chart` — barras verticales simples con línea de promedio punteada, para el ciclo menstrual.
- `.example-chip`, `.typing-cursor`, `.pulse-dot`, `.sheet-enter` — detalles del sheet de captura por voz (cursor parpadeante, punto pulsante mientras "escucha", animación de entrada del sheet desde abajo).

**Sheets (bottom sheets)**: overlay `bg-overlay` a pantalla completa, panel `rounded-t-[24px] bg-background`, barra de arrastre (`h-1 w-10 rounded-full bg-border`) centrada arriba, botón de cerrar (X) en la esquina superior derecha, animación `sheet-enter` (translateY 100%→0, 0.28s ease-out). Se encadenan (voz → fecha, manual → etiqueta).

**Dock inferior**: fijo, `h-[86px]`, `backdrop-blur-xl`, 5 slots — Hoy, Agenda (Calendario), mic central más grande (`h-14 w-14`, elevado visualmente con el `ring-8`), Escribir (lápiz, abre captura manual), Mí. Respeta `env(safe-area-inset-bottom)`.

**Header**: sticky, `backdrop-blur-lg`, respeta `env(safe-area-inset-top)`; a la izquierda pills de navegación con scroll horizontal (`scrollbar-none`), a la derecha indicador de energía y toggle de modo oscuro/ajustes.

## Iconografía

`lucide-react` en todo el prototipo (Mic, Home, CalendarDays, UserRound, CircleDollarSign, Sparkles, Zap, Droplets, Flame, Moon, Camera, Check, Plus, X, ChevronDown, BatteryCharging, Utensils, ImagePlus, Pencil, Settings2, Sun, ArrowLeft/Right, Clock3, Apple). Tamaño por defecto `size-4` dentro de botones; iconos de sección `size={17}` o `size-4` con color `text-primary`.

## Modo oscuro — bug conocido a NO replicar

En el prototipo, el toggle aplica la clase `.dark` al contenedor `<main>` (no a `<html>`/`<body>`). El `body { color: var(--color-foreground) }` global vive en el `<body>` real (fuera de `.dark`), así que cualquier texto sin una utilidad de color explícita (`text-foreground`, etc.) — por ejemplo el `<h1>` de cada pantalla y los títulos de las task cards — **hereda el color claro y queda casi invisible en modo oscuro** (confirmado: `getComputedStyle` devuelve el oklch claro aun con `.dark` activo). Se ve en `reference/lovable/screenshots/12-hoy-dark.png`.

**Al construir la app real: aplicar `.dark` en `<html>` (patrón estándar de shadcn/Tailwind, vía `document.documentElement.classList`) y asegurar que todo texto tenga una utilidad de color explícita** — así se evita este bug en vez de reproducirlo. El checklist final del blueprint ("Funciona en modo oscuro") depende de esto.

## Pantallas cubiertas por el prototipo

Ver `reference/lovable/screenshots/`: `01` Hoy, `02`–`03` Calendario (Día/Mes), `04` Mí, `05`–`06` Finanzas (Gastos/Ingresos), `07` Todo (bandeja general, no está en el blueprint como pantalla propia — es una vista de búsqueda/lista completa), `08` sheet de captura por voz, `09` sheet de pregunta de fecha, `10` sheet de creación manual, `12`–`13` Hoy/Mí en oscuro. Faltan en el prototipo (diseñar con el mismo sistema, como pide el blueprint): Onboarding, editor de etiquetas completo más allá del sheet rápido, detalle de evento de Calendario, estados vacíos, estados de error/reconexión de integraciones.
