import { z } from "npm:zod";

export const TIPOS = ["tarea", "evento", "seguimiento", "idea", "gasto", "ingreso"] as const;
export const URGENCIAS = ["alta", "media", "baja"] as const;
export const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;

// Lo que la IA devuelve. Todo lo que puede faltar es nullable: la app pregunta
// después (fecha de una tarea, medio de pago de un gasto).
export const clasificacionSchema = z.object({
  tipo: z.enum(TIPOS),
  tag_id: z.string().nullable(),
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
  medio_id: z.string().nullable(),
  categoria: z.string().nullable(),
  pedir_notion: z.boolean(),
  texto_limpio: z.string().min(1),
});

export type Clasificacion = z.infer<typeof clasificacionSchema>;

// El mismo contrato, como JSON Schema para `strict: true`. Con strict, la API
// garantiza que tool_use.input valide contra esto; Zod es el segundo cinturón.
export const toolInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tipo: { type: "string", enum: TIPOS },
    tag_id: { type: ["string", "null"], description: "id exacto de una de las etiquetas dadas" },
    urgencia: { type: ["string", "null"], enum: [...URGENCIAS, null] },
    fecha: { type: ["string", "null"], description: "YYYY-MM-DD" },
    hora: { type: ["string", "null"], description: "HH:MM en 24h" },
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
    monto: { type: ["number", "null"], description: "en pesos colombianos" },
    medio_id: { type: ["string", "null"], description: "id exacto de uno de los medios de pago dados" },
    categoria: { type: ["string", "null"], description: "nombre exacto de una de las categorías dadas" },
    pedir_notion: { type: "boolean" },
    texto_limpio: { type: "string" },
  },
  required: [
    "tipo",
    "tag_id",
    "urgencia",
    "fecha",
    "hora",
    "duracion_min",
    "recurrencia",
    "monto",
    "medio_id",
    "categoria",
    "pedir_notion",
    "texto_limpio",
  ],
} as const;
