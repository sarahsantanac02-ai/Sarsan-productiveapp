import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Check, ExternalLink, Inbox, ListPlus, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { etiquetaFecha, etiquetaHora, todayBogota } from "@/lib/date";
import { nombreDelRemitente } from "@/features/integrations/use-gmail";
import {
  useAceptarSugerencia,
  useDescartarSugerencia,
  useRevisarCorreo,
  useSugerenciasCorreo,
  type SugerenciaCorreo,
} from "@/features/integrations/use-mail-triage";

// Cada revisión le cuesta una llamada a la IA, así que no se dispara en cada
// render: como mucho una vez cada seis horas, y siempre a mano con el botón.
const CADA_MS = 6 * 60 * 60 * 1000;
const CLAVE_ULTIMA = "sarsan:ultima-revision-correo";

function tocaRevisar(): boolean {
  try {
    const ultima = Number(localStorage.getItem(CLAVE_ULTIMA) ?? 0);
    return Date.now() - ultima > CADA_MS;
  } catch {
    // Safari en modo privado puede negar localStorage; ahí solo revisa a mano.
    return false;
  }
}

function marcarRevisado() {
  try {
    localStorage.setItem(CLAVE_ULTIMA, String(Date.now()));
  } catch {
    /* sin localStorage no pasa nada, solo se revisa a mano */
  }
}

export function MailInbox() {
  const { data: sugerencias } = useSugerenciasCorreo();
  const revisar = useRevisarCorreo();
  const yaIntento = useRef(false);
  // El aviso vive aquí y no en la fila: al aceptar, la fila sale de la lista y
  // se desmonta, así que un mensaje suyo se perdería antes de que ella lo lea.
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (yaIntento.current || !tocaRevisar()) return;
    yaIntento.current = true;
    revisar.mutate(undefined, { onSuccess: marcarRevisado });
  }, [revisar]);

  const fallo = revisar.error as (Error & { reconectar?: boolean }) | null;
  const hay = (sugerencias?.length ?? 0) > 0;

  // Sin nada que mostrar y sin error, la sección no ocupa espacio en Hoy.
  if (!hay && !fallo && !aviso && !revisar.isPending) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Del correo</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => revisar.mutate(undefined, { onSuccess: marcarRevisado })}
          disabled={revisar.isPending}
        >
          <RefreshCw className={revisar.isPending ? "animate-spin" : ""} />
          {revisar.isPending ? "Leyendo..." : "Revisar"}
        </Button>
      </div>

      {fallo && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          No pude leer tu correo: {fallo.message}
        </p>
      )}

      {revisar.isPending && !hay && (
        <p className="text-sm text-muted-foreground">Leyendo tu bandeja de los últimos días...</p>
      )}

      {aviso && (
        <div className="rounded-xl bg-amber-soft p-3">
          <p className="text-[11px] leading-relaxed text-amber-strong">{aviso}</p>
          <button
            onClick={() => setAviso(null)}
            className="mt-1.5 text-[11px] font-semibold text-amber-strong underline underline-offset-2"
          >
            Entendido
          </button>
        </div>
      )}

      {sugerencias?.map((s) => (
        <FilaSugerencia key={s.id} sugerencia={s} onAviso={setAviso} />
      ))}
    </section>
  );
}

function FilaSugerencia({
  sugerencia,
  onAviso,
}: {
  sugerencia: SugerenciaCorreo;
  onAviso: (mensaje: string | null) => void;
}) {
  const aceptar = useAceptarSugerencia();
  const descartar = useDescartarSugerencia();

  const hoy = todayBogota();
  const esEvento = sugerencia.tipo === "evento";
  const ocupada = aceptar.isPending || descartar.isPending;

  const cuando = [
    sugerencia.fecha ? etiquetaFecha(sugerencia.fecha, hoy) : null,
    sugerencia.hora ? etiquetaHora(sugerencia.hora) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="p-3.5">
      <div className="flex gap-3">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
            esEvento ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {esEvento ? <CalendarPlus size={15} /> : <Inbox size={15} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold leading-snug">{sugerencia.titulo}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span>{esEvento ? "Evento" : "Pendiente"}</span>
            {cuando && <span>· {cuando}</span>}
            {sugerencia.etiqueta && <span>· {sugerencia.etiqueta}</span>}
          </div>

          {sugerencia.razon && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{sugerencia.razon}</p>
          )}

          <a
            href={sugerencia.link}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground underline underline-offset-2"
          >
            <ExternalLink size={11} />
            <span className="max-w-[12rem] truncate">{nombreDelRemitente(sugerencia.de)}</span>
          </a>
        </div>
      </div>

      {aceptar.isError && (
        <p className="mt-2 text-[11px] text-destructive">
          {aceptar.error instanceof Error ? aceptar.error.message : "No se pudo crear"}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          disabled={ocupada}
          onClick={() =>
            aceptar.mutate(sugerencia, {
              onSuccess: ({ avisoCalendario }) => onAviso(avisoCalendario),
            })
          }
        >
          {esEvento ? <CalendarPlus /> : <ListPlus />}
          {esEvento ? "Agendar" : "Agregar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={ocupada}
          onClick={() => descartar.mutate(sugerencia.id)}
        >
          {descartar.isSuccess ? <Check /> : <X />} Ignorar
        </Button>
      </div>
    </Card>
  );
}
