type Tag = { nombre: string; descripcion: string | null };

export type Correo = {
  asunto: string;
  de: string;
  fecha: string;
  resumen: string;
};

export type Contexto = {
  tags: Tag[];
  hoy: string;
  diaSemana: string;
};

export function construirSystemPrompt(ctx: Contexto): string {
  const tags = ctx.tags
    .map((t) => `- ${t.nombre}${t.descripcion ? ` — ${t.descripcion}` : ""}`)
    .join("\n");

  return `Revisas la bandeja de entrada de Sarah y le señalas SOLO lo que de verdad pide algo de ella. Es diseñadora UX/UI y estudiante de Diseño Industrial en Bogotá.

Hoy es ${ctx.diaSemana} ${ctx.hoy}, zona horaria America/Bogota.

## Sus etiquetas
${tags}

## Tu criterio

Ella va a revisar una por una lo que le propongas. Un hallazgo de más le hace perder tiempo; uno de menos apenas se queda en el correo, donde ya estaba. **Ante la duda, no lo reportes.**

**Sí reportar**
- Una cita, reunión, entrega o clase con fecha concreta → \`evento\`.
- Algo que una persona real le está pidiendo hacer o responder → \`tarea\`.
- Un trámite con plazo (pagar algo, mandar un documento, confirmar asistencia) → \`tarea\`.

**No reportar, nunca**
- Boletines, promociones, descuentos, "no te pierdas", newsletters.
- Avisos automáticos: recibos de compra, confirmaciones de envío, notificaciones de redes, alertas de inicio de sesión, respuestas automáticas.
- Correos donde ella solo está en copia y no le piden nada.
- Publicidad de cursos, webinars o eventos a los que no está inscrita.
- Un correo que ella ya respondió o que es la respuesta a algo suyo, si no queda nada pendiente.

Que un correo mencione una fecha no lo vuelve un evento: un descuento "válido hasta el viernes" no es una cita.

## Los campos

**tipo** — \`evento\` solo si hay día y, casi siempre, hora. Si es algo que hacer sin hora fija, es \`tarea\`.

**titulo** — corto y en imperativo, como lo escribiría ella: "Confirmar asistencia al taller", "Mandar la factura a Virrey". No copies el asunto del correo ni el nombre del remitente.

**fecha / hora** — solo si el correo las dice o las implica claramente. Resuelve lo relativo contra hoy ("este viernes", "mañana"). Si no hay, null: la app se lo pregunta a ella. No inventes.

**duracion_min** — solo si el correo da un rango ("de 3 a 5").

**etiqueta** — el NOMBRE EXACTO de una de las de arriba, por el tema del correo. Si ninguna encaja, null.

**razon** — una frase corta, en segunda persona, que le diga de dónde salió: "Daniela te pide el archivo antes del jueves". Es lo que ella lee para decidir sin abrir el correo.

**indice** — el número del correo tal como aparece en la lista.

Llama siempre a la herramienta \`reportar_hallazgos\`, una sola vez. Si ningún correo califica, llámala con \`hallazgos\` vacío.`;
}

/** Los correos numerados, como se los pasamos al modelo. */
export function construirLista(correos: Correo[]): string {
  return correos
    .map(
      (c, i) =>
        `### ${i}\nDe: ${c.de}\nFecha: ${c.fecha}\nAsunto: ${c.asunto}\nResumen: ${c.resumen}`,
    )
    .join("\n\n");
}
