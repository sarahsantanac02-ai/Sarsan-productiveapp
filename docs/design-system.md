# Sistema de diseño — SarSan

**Bloqueado.** Este archivo debe extraerse de las pantallas de Lovable en `reference/lovable/` (colores, tipografías, radios, espaciados y componentes), pero esa carpeta no existe todavía en el repo — solo hay un `README.md`.

No se pueden inventar tokens de color ni medidas: se necesita el export real (o capturas de pantalla) de Lovable para que la réplica sea fiel, tal como pide el blueprint ("replicando fielmente su estética").

## Qué falta

Agregar en `reference/lovable/` una de estas dos cosas:

1. El export de código de Lovable (carpeta con los `.tsx`/`.css` y `tailwind.config`), o
2. Capturas de pantalla de cada pantalla principal (Onboarding, Hoy, Captura, Calendario, Mí, Finanzas, Etiquetas) en claro y oscuro.

Con cualquiera de las dos, esta fase continúa extrayendo:

- Paleta de color (marca, fondo, superficie, texto, estados, colores de franja de energía)
- Tipografía (familia, escalas, pesos)
- Radios de borde y espaciados
- Estilos de componentes clave (cards, chips de etiqueta, bottom sheets, botones, barras de progreso)
- Soporte de modo oscuro y de las safe areas de iPhone (mencionados en el checklist final del blueprint)

## Mientras tanto

`CLAUDE.md` y `docs/plan.md` ya están listos y no dependen de este archivo — la Fase 0 solo queda pendiente en este punto.
