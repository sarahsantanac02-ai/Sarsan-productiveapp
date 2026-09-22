import { z } from "npm:zod";

export const TIPOS = ["tarea", "evento", "seguimiento", "idea", "gasto", "ingreso"] as const;
export const URGENCIAS = ["alta", "media", "baja"] as const;
export const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;

/**
 * El modelo responde con NOMBRES (Virrey, Nequi, Comida), no con UUIDs: pedirle
 * que copie un uuid de memoria es justo lo que peor hacen los modelos, y un id
 * inventado terminaba cayendo en General. Los nombres van como `enum` en el
 * schema de la herramienta, y aquí los resolvemos a ids.
 */
export const clasificacionSchema = z.object({
  tipo: z.enum(TIPOS),
  etiqueta: z.string().nullable(),
  urgencia: z.enum(URGENCIAS).nullable(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  hora: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  duracion_min: z.number().int().positive().nullable(),
  recurrencia: z
    .object({
      dias: z.array(z.enum(DIAS)).min(1),
      inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      hasta: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
    })
    .nullable(),
  monto: z.number().positive().nullable(),
  medio: z.string().nullable(),
  categoria: z.string().nullable(),
  pedir_notion: z.boolean(),
  texto_limpio: z.string().min(1),
});

export type Clasificacion = z.infer<typeof clasificacionSchema>;

type Opciones = { etiquetas: string[]; medios: string[]; categorias: string[] };

/** JSON Schema de la herramienta, con los nombres reales de Sarah como enum. */
export function construirToolSchema({ etiquetas, medios, categorias }: Opciones) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      tipo: { type: "string", enum: TIPOS },
      etiqueta: {
        type: ["string", "null"],
        enum: [...etiquetas, null],
        description: "Nombre exacto de una de sus etiquetas.",
      },
      urgencia: { type: ["string", "null"], enum: [...URGENCIAS, null] },
      fecha: { type: ["string", "null"], description: "YYYY-MM-DD, o null si no dijo cuándo." },
      hora: { type: ["string", "null"], description: "HH:MM en 24h." },
      duracion_min: { type: ["integer", "null"] },
      recurrencia: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          dias: { type: "array", items: { type: "string", enum: DIAS } },
          inicio: { type: "string", description: "YYYY-MM-DD" },
          hasta: { type: ["string", "null"], description: "YYYY-MM-DD" },
        },
        required: ["dias", "inicio", "hasta"],
      },
      monto: { type: ["number", "null"], description: "En pesos colombianos, ya multiplicado." },
      medio: {
        type: ["string", "null"],
        enum: [...medios, null],
        description: "Nombre exacto de uno de sus medios de pago.",
      },
      categoria: {
        type: ["string", "null"],
        enum: [...categorias, null],
        description: "Nombre exacto de una de sus categorías de dinero.",
      },
      pedir_notion: { type: "boolean" },
      texto_limpio: { type: "string" },
    },
    required: [
      "tipo",
      "etiqueta",
      "urgencia",
      "fecha",
      "hora",
      "duracion_min",
      "recurrencia",
      "monto",
      "medio",
      "categoria",
      "pedir_notion",
      "texto_limpio",
    ],
  };
}
