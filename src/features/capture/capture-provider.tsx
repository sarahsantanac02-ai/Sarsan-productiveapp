import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { useCapture } from "@/features/capture/use-items";
import { VoiceSheet } from "@/features/capture/voice-sheet";
import { ManualSheet } from "@/features/capture/manual-sheet";
import { DateSheet } from "@/features/capture/date-sheet";
import { PaymentSheet } from "@/features/capture/payment-sheet";

type Seguimiento =
  | { tipo: "fecha"; itemId: string; texto: string }
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

  const capturar = useCallback(
    (texto: string) => {
      setAviso(null);
      capture.mutate(texto, {
        onSuccess: ({ itemId, clasificacion }) => {
          if (!clasificacion) return;

          if (clasificacion.fallback) {
            setAviso("No pude ordenarlo esta vez. Lo dejé como tarea en General para que lo edites.");
            return;
          }

          // Blueprint: tarea sin fecha → pregunta cuándo; gasto sin medio → pregunta con qué pagó.
          const necesitaFecha =
            (clasificacion.tipo === "tarea" || clasificacion.tipo === "seguimiento") && !clasificacion.fecha;
          const necesitaMedio =
            clasificacion.tipo === "gasto" && !clasificacion.medio_id && !!clasificacion.transaction_id;

          if (necesitaFecha) {
            setSeguimiento({ tipo: "fecha", itemId, texto: clasificacion.texto_limpio });
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
    [capture],
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
            className="w-full cursor-pointer rounded-2xl border border-border bg-card p-3.5 text-left text-xs leading-relaxed shadow-lg"
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
