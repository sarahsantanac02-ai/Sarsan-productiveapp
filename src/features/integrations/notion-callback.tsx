import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConectarNotion } from "@/features/integrations/use-notion";

/** Aterrizaje del OAuth de Notion: cambia el code por el token y vuelve a Ajustes. */
export function NotionCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const conectar = useConectarNotion();
  const yaIntentado = useRef(false);

  const code = params.get("code");
  const errorNotion = params.get("error");

  useEffect(() => {
    if (!code || yaIntentado.current) return;
    yaIntentado.current = true;
    conectar.mutate(code);
  }, [code, conectar]);

  const fallo = errorNotion ?? (conectar.isError ? (conectar.error as Error).message : null);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      {conectar.isPending && <p className="text-sm text-muted-foreground">Conectando con Notion...</p>}

      {conectar.isSuccess && (
        <>
          <span className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check size={26} />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">Notion conectado</h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Ya creé la base “SarSan — Tareas”. Desde ahora puedes mandar tareas con el botón de Notion.
            </p>
          </div>
          <Button variant="default" onClick={() => navigate("/ajustes")}>
            Listo
          </Button>
        </>
      )}

      {fallo && (
        <>
          <span className="flex size-14 items-center justify-center rounded-full bg-urgent-soft text-urgent">
            <X size={26} />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">No se pudo conectar</h1>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">{fallo}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/ajustes")}>
            Volver a Ajustes
          </Button>
        </>
      )}
    </div>
  );
}
