import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { useCapture } from "@/features/capture/use-items";
import { useCrearEnGoogle } from "@/features/calendar/use-calendar";
import type { TipoMovimiento } from "@/features/finance/use-transactions";
import { VoiceSheet } from "@/features/capture/voice-sheet";
import { ManualSheet } from "@/features/capture/manual-sheet";
import { DateSheet } from "@/features/capture/date-sheet";
import { AmountSheet } from "@/features/capture/amount-sheet";
import { PaymentSheet } from "@/features/capture/payment-sheet";

type Seguimiento =
  | { tipo: "fecha"; itemId: string; texto: string }
  | { tipo: "monto"; tipoMovimiento: TipoMovimiento; fecha: string | null; texto: string }
  | { tipo: "medio"; transactionId: string; monto: number; texto: string };

type CaptureContextValue = {
  abrirVoz: () => void;
  abrirManual: () => void;
  capturando: boolean;
};

const CaptureContext = createContext<CaptureContextValue | null>(null);

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<"voz" | "manual" | null>(null);
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const capture = useCapture();
  const crearEnGoogle = useCrearEnGoogle();

  const capturar = useCallback(
    (texto: string) => {
      setAviso(null);
      capture.mutate(texto, {
        onSuccess: ({ itemId, clasificacion }) => {
          if (!clasificacion) return;

          if (clasificacion.fallback) {
            // App personal de una sola usuaria: mostrar el error de verdad le
            // sirve más que un mensaje bonito, y evita ir a buscar los logs.
            setAviso(
              `No pude ordenarlo esta vez. Lo dejé como tarea en General.\n\nRazón: ${
                clasificacion.error ?? "desconocida"
              }`,
            );
            return;
          }

          // Blueprint: tarea sin fecha → pregunta cuándo; gasto/ingreso sin monto
          // → pregunta cuánto (si no, no queda registrado en Finanzas); si ya
          // tiene monto pero no medio → pregunta con qué pagó.
          const esMovimiento = clasificacion.tipo === "gasto" || clasificacion.tipo === "ingreso";
          const necesitaFecha =
            (clasificacion.tipo === "tarea" || clasificacion.tipo === "seguimiento") && !clasificacion.fecha;
          const necesitaMonto = esMovimiento && !clasificacion.monto;
          const necesitaMedio = clasificacion.tipo === "gasto" && !clasificacion.medio_id && !!clasificacion.transaction_id;

          // Un evento con fecha se agenda solo en Google (flujo del blueprint).
          // Si Google falla, el evento igual quedó guardado acá.
          if (clasificacion.tipo === "evento" && clasificacion.fecha) {
            crearEnGoogle.mutate(itemId, {
              onError: (error) =>
                setAviso(
                  `Lo guardé, pero no pude agendarlo en Google: ${
                    error instanceof Error ? error.message : "error desconocido"
                  }`,
                ),
            });
          }

          if (necesitaFecha) {
            setSeguimiento({ tipo: "fecha", itemId, texto: clasificacion.texto_limpio });
          } else if (necesitaMonto) {
            setSeguimiento({
              tipo: "monto",
              tipoMovimiento: clasificacion.tipo as TipoMovimiento,
              fecha: clasificacion.fecha,
              texto: clasificacion.texto_limpio,
            });
          } else if (necesitaMedio) {
            setSeguimiento({
              tipo: "medio",
              transactionId: clasificacion.transaction_id!,
              monto: clasificacion.monto ?? 0,
              texto: clasificacion.texto_limpio,
            });
          }
        },
        onError: () => setAviso("No se pudo guardar la captura. Revisa tu conexión e intenta otra vez."),
      });
    },
    [capture, crearEnGoogle],
  );

  return (
    <CaptureContext.Provider
      value={{
        abrirVoz: () => setSheet("voz"),
        abrirManual: () => setSheet("manual"),
        capturando: capture.isPending,
      }}
    >
      {children}

      {sheet === "voz" && <VoiceSheet onClose={() => setSheet(null)} onCapturar={capturar} />}
      {sheet === "manual" && <ManualSheet onClose={() => setSheet(null)} onCapturar={capturar} />}

      {seguimiento?.tipo === "fecha" && (
        <DateSheet itemId={seguimiento.itemId} texto={seguimiento.texto} onClose={() => setSeguimiento(null)} />
      )}
      {seguimiento?.tipo === "monto" && (
        <AmountSheet
          texto={seguimiento.texto}
          tipo={seguimiento.tipoMovimiento}
          fecha={seguimiento.fecha}
          onClose={() => setSeguimiento(null)}
          onListo={(transactionId, monto) => {
            // Solo seguimos preguntando el medio para gastos (igual que si la
            // IA ya hubiera tenido el monto desde el principio).
            if (seguimiento.tipoMovimiento === "gasto") {
              setSeguimiento({ tipo: "medio", transactionId, monto, texto: seguimiento.texto });
            } else {
              setSeguimiento(null);
            }
          }}
        />
      )}
      {seguimiento?.tipo === "medio" && (
        <PaymentSheet
          transactionId={seguimiento.transactionId}
          monto={seguimiento.monto}
          texto={seguimiento.texto}
          onClose={() => setSeguimiento(null)}
        />
      )}

      {aviso && (
        <div className="fixed inset-x-0 bottom-[96px] z-50 mx-auto w-full max-w-[390px] px-4">
          <button
            onClick={() => setAviso(null)}
            className="w-full cursor-pointer whitespace-pre-line rounded-2xl border border-border bg-card p-3.5 text-left text-xs leading-relaxed shadow-lg"
          >
            {aviso}
          </button>
        </div>
      )}
    </CaptureContext.Provider>
  );
}

export function useCaptureSheets() {
  const ctx = useContext(CaptureContext);
  if (!ctx) throw new Error("useCaptureSheets debe usarse dentro de <CaptureProvider>");
  return ctx;
}
