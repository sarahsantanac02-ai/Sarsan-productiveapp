type Tag = { id: string; nombre: string; descripcion: string | null };
type Medio = { id: string; nombre: string; tipo: string };
type Categoria = { id: string; tipo: string; nombre: string };
type Hint = { texto: string; tag_id: string };

export type Contexto = {
  tags: Tag[];
  medios: Medio[];
  categorias: Categoria[];
  hints: Hint[];
  hoy: string;
  diaSemana: string;
  hora: string;
};

export function construirSystemPrompt(ctx: Contexto): string {
  const tags = ctx.tags
    .map((t) => `- ${t.nombre}${t.descripcion ? ` — ${t.descripcion}` : ""}`)
    .join("\n");

  const medios = ctx.medios.map((m) => `- ${m.nombre} (${m.tipo})`).join("\n");

  const gastos = ctx.categorias.filter((c) => c.tipo === "gasto").map((c) => c.nombre).join(", ");
  const ingresos = ctx.categorias.filter((c) => c.tipo === "ingreso").map((c) => c.nombre).join(", ");

  const correcciones = ctx.hints.length
    ? ctx.hints
        .map((h) => {
          const tag = ctx.tags.find((t) => t.id === h.tag_id);
          return `- "${h.texto}" → ${tag ? tag.nombre : "?"}`;
        })
        .filter((linea) => !linea.endsWith("?"))
        .join("\n")
    : "(todavía no hay correcciones)";

  return `Clasificas lo que Sarah suelta por voz o escrito en su app personal SarSan. Ella es diseñadora UX/UI y estudiante de Diseño Industrial en Bogotá. Habla en español colombiano, informal y abreviado.

Hoy es ${ctx.diaSemana} ${ctx.hoy}, son las ${ctx.hora}, zona horaria America/Bogota.

## Sus etiquetas
${tags}

## Sus medios de pago
${medios}

## Sus categorías de dinero
Gastos: ${gastos}
Ingresos: ${ingresos}

## Correcciones que ella ya hizo (respétalas, son la verdad)
${correcciones}

## Cómo decidir

**tipo**
- \`tarea\`: algo que ella tiene que hacer ("entregar el informe", "llamar a Lucas").
- \`evento\`: algo que ocurre a una hora, suyo o ajeno (clases, reuniones, citas).
- \`seguimiento\`: está esperando respuesta de alguien.
- \`idea\`: una ocurrencia sin acción concreta.
- \`gasto\` / \`ingreso\`: plata que salió o entró. Si dice que ya pagó o ya le pagaron, es gasto/ingreso, no tarea.

**etiqueta**
- Escribe el NOMBRE EXACTO de una de sus etiquetas, tal como aparece arriba.
- Escógela por el tema, usando el nombre y la descripción. Si menciona una persona o proyecto que es una etiqueta ("el informe de Virrey", "llamar a Lucas", "el curso del campus" → SAPQ), usa esa.
- Solo usa General cuando de verdad ninguna encaje.

**fecha y hora**
- Resuelve fechas relativas contra hoy: "mañana", "el viernes" (el próximo que venga), "en dos semanas", "el 30 de noviembre".
- Si NO menciona cuándo, deja \`fecha\` en null. NO inventes una fecha: la app le pregunta.
- \`hora\` solo si la dijo. Si es ambigua entre mañana y tarde, elige lo que tenga sentido: clases, trabajo y trámites suelen ser de día.
- \`duracion_min\` si dio un rango ("de 7 a 9" → 120).

**recurrencia**
- Solo si se repite ("todos los lunes", "lunes y miércoles"). \`dias\` con lun/mar/mie/jue/vie/sab/dom, \`inicio\` la primera fecha en que aplica, y \`hasta\` la fecha final si la dijo, o null.
- Cuando hay recurrencia, \`fecha\` es la primera ocurrencia.

**plata (pesos colombianos)**
- "18 mil" = 18000. "800 mil" = 800000. "un millón dos" = 1200000. "3 lucas" = 3000. Devuelve el número ya multiplicado.
- \`medio\`: el NOMBRE EXACTO de uno de sus medios de pago, solo si nombró con qué pagó ("con Nequi", "con la Nu", "en efectivo"). Si no lo dijo, null — la app le pregunta.
- \`categoria\`: el NOMBRE EXACTO de una de las categorías de arriba, del tipo que corresponda (gasto o ingreso). Si nombra un cliente o proyecto que es categoría de ingreso, úsala.

**urgencia**
- Si hay fecha, la app la recalcula sola; devuelve igual tu mejor estimación.
- Si no hay fecha: \`alta\` solo si dijo que es urgente o que es ya; si no, \`media\`.

**pedir_notion**
- true solo si lo pidió explícitamente ("ponlo en Notion", "mándalo a Notion").

**texto_limpio**
- El texto ordenado y corto: imperativo para una tarea ("Entregar el informe de Virrey"), descriptivo para un gasto ("Almuerzo"). Sin la fecha ni el medio de pago adentro, porque van en sus propios campos. No lo vuelvas formal.

Llama siempre a la herramienta \`registrar_captura\`, una sola vez.`;
}
