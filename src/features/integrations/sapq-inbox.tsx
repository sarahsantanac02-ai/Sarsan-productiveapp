import { Mail } from "lucide-react";

import { Card } from "@/components/ui/card";
import { nombreDelRemitente, useHilosSapq } from "@/features/integrations/use-gmail";

export function SapqInbox({ activo }: { activo: boolean }) {
  const { data: hilos, isLoading, error } = useHilosSapq(activo);

  if (!activo) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Correos de SAPQ</h2>

      {isLoading && <p className="text-sm text-muted-foreground">Buscando en tu Gmail...</p>}

      {error && (
        <p className="text-xs text-muted-foreground">
          No pude leer tu Gmail: {(error as Error).message}
        </p>
      )}

      {hilos?.length === 0 && (
        <p className="text-xs text-muted-foreground">Nada nuevo que mencione SunAce, SAPQ o sunacepq.</p>
      )}

      {hilos?.map((hilo) => (
        <a key={hilo.id} href={hilo.link} target="_blank" rel="noreferrer" className="block">
          <Card className="p-3.5 transition-colors hover:border-primary">
            <div className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Mail size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold leading-snug">{hilo.asunto}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {nombreDelRemitente(hilo.de)}
                  {hilo.mensajes > 1 ? ` · ${hilo.mensajes} mensajes` : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{hilo.resumen}</p>
              </div>
            </div>
          </Card>
        </a>
      ))}
    </section>
  );
}
