import { z } from "npm:zod";

export const TIPOS = ["evento", "tarea"] as const;

/**
 * Igual que en classify-capture: el modelo responde con el NOMBRE de la
 * etiqueta, no con un uuid, y tampoco se usa `strict: true` — con estos
 * schemas (enum que incluye null, tipos como ["string","null"]) la API rechaza
 * la llamada entera y el catch termina descartando todo. Zod es la garantía.
 *
 * `indice` es la posición del correo en la lista que le mandamos, y así el
 * modelo no tiene que copiar ids largos de Gmail.
 */
export const hallazgoSchema = z.object({
  indice: z.number().int().nonnegative(),
  tipo: z.enum(TIPOS),
  titulo: z.string().min(1),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  hora: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  duracion_min: z.number().int().positive().nullable(),
  etiqueta: z.string().nullable(),
  razon: z.string().min(1),
});

export const respuestaSchema = z.object({
  hallazgos: z.array(hallazgoSchema),
});

export type Hallazgo = z.infer<typeof hallazgoSchema>;

/** JSON Schema de la herramienta, con las etiquetas reales de Sarah como enum. */
export function construirToolSchema(etiquetas: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      hallazgos: {
        type: "array",
        description:
          "Solo los correos que de verdad piden una acción o son una cita. Si ninguno lo es, un arreglo vacío.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            indice: { type: "integer", description: "El número del correo en la lista." },
            tipo: {
              type: "string",
              enum: TIPOS,
              description: "'evento' si tiene fecha y hora concretas; 'tarea' si es algo que hacer.",
            },
            titulo: {
              type: "string",
              description: "Corto y en imperativo, como lo escribiría ella. Sin el asunto literal del correo.",
            },
            fecha: { type: ["string", "null"], description: "YYYY-MM-DD, o null si el correo no dice cuándo." },
            hora: { type: ["string", "null"], description: "HH:MM en 24h, o null." },
            duracion_min: { type: ["integer", "null"] },
            etiqueta: {
              type: ["string", "null"],
              enum: [...etiquetas, null],
              description: "Nombre exacto de una de sus etiquetas, o null si ninguna encaja.",
            },
            razon: {
              type: "string",
              description: "Una frase corta diciéndole por qué se lo propones. Ella la lee para decidir.",
            },
          },
          required: ["indice", "tipo", "titulo", "fecha", "hora", "duracion_min", "etiqueta", "razon"],
        },
      },
    },
    required: ["hallazgos"],
  };
}
