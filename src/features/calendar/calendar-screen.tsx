import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenTitle } from "@/components/app-shell";
import { todayBogota } from "@/lib/date";
import { sumarDias } from "@/lib/urgencia";
import { minutosDelDia } from "@/lib/agenda";
import { construirFranjas, minutosAHora } from "@/lib/franjas";
import { useMinutoBogota } from "@/hooks/use-minuto";
import { useAuth } from "@/features/auth/use-auth";
import { useProfile } from "@/features/onboarding/use-profile";
import { useItems } from "@/features/capture/use-items";
import { useGoogleEvents } from "@/features/calendar/use-calendar";
import { DayView } from "@/features/calendar/day-view";
import { MonthView } from "@/features/calendar/month-view";

type Vista = "dia" | "tres" | "mes";

export function CalendarScreen() {
  const hoy = todayBogota();
  const [vista, setVista] = useState<Vista>("dia");
  const [ancla, setAncla] = useState(hoy);
  const minutosAhora = useMinutoBogota();

  const { signInWithGoogle } = useAuth();
  const { data: profile } = useProfile();
  const { data: items } = useItems();

  const dias = useMemo(() => {
    if (vista === "dia") return [ancla];
    if (vista === "tres") return [ancla, sumarDias(ancla, 1), sumarDias(ancla, 2)];
    return [];
  }, [vista, ancla]);

  const { desde, hasta } =
    vista === "mes"
      ? { desde: `${ancla.slice(0, 7)}-01`, hasta: `${ancla.slice(0, 7)}-31` }
      : { desde: dias[0], hasta: dias[dias.length - 1] };

  const { data: eventos, isLoading, error, refetch, isFetching } = useGoogleEvents(desde, hasta);
  const fallo = error as (Error & { reconectar?: boolean }) | null;

  const franjas = useMemo(
    () => construirFranjas(profile?.hora_despertar ?? "06:00", profile?.hora_dormir ?? "22:00"),
    [profile?.hora_despertar, profile?.hora_dormir],
  );

  // Resumen de ocupación del día ancla, sobre las horas que Sarah está despierta.
  const resumen = useMemo(() => {
    const delDia = (eventos ?? []).filter((e) => e.fecha === ancla && !e.dia_completo && e.inicio && e.fin);
    const ocupados = delDia.reduce((suma, e) => suma + (minutosDelDia(e.fin!) - minutosDelDia(e.inicio!)), 0);
    const despierta = franjas[franjas.length - 1].hasta - franjas[0].desde;
    return {
      ocupadas: Math.round((ocupados / 60) * 10) / 10,
      libres: Math.max(0, Math.round(((despierta - ocupados) / 60) * 10) / 10),
      porcentaje: Math.min(100, (ocupados / despierta) * 100),
    };
  }, [eventos, ancla, franjas]);

  function mover(pasos: number) {
    if (vista === "mes") {
      const [anio, mes] = ancla.slice(0, 7).split("-").map(Number);
      const nuevo = new Date(Date.UTC(anio, mes - 1 + pasos, 1));
      setAncla(nuevo.toISOString().slice(0, 10));
    } else {
      setAncla(sumarDias(ancla, pasos * (vista === "tres" ? 3 : 1)));
    }
  }

  const titulo =
    vista === "mes"
      ? new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(
          new Date(`${ancla}T12:00:00Z`),
        )
      : new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(
          new Date(`${ancla}T12:00:00Z`),
        );

  return (
    <div className="pb-4">
      <ScreenTitle eyebrow="Google Calendar" title="Calendario" />

      <div className="space-y-4 px-4 pt-5">
        <div className="flex rounded-xl bg-muted p-1">
          {(
            [
              ["dia", "Día"],
              ["tres", "3 días"],
              ["mes", "Mes"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant={vista === id ? "segmentActive" : "segment"}
              size="sm"
              onClick={() => setVista(id)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="iconSm" onClick={() => mover(-1)} aria-label="Anterior">
            <ArrowLeft />
          </Button>
          <p className="flex-1 text-center text-sm font-semibold capitalize">{titulo}</p>
          <Button variant="ghost" size="iconSm" onClick={() => mover(1)} aria-label="Siguiente">
            <ArrowRight />
          </Button>
          {ancla !== hoy && (
            <Button variant="chip" size="sm" onClick={() => setAncla(hoy)}>
              Hoy
            </Button>
          )}
        </div>

        {fallo && (
          <Card className="text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-urgent-soft text-urgent">
              <CalendarDays />
            </span>
            <p className="mt-3 font-display text-sm font-semibold">No pude leer tu calendario</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{fallo.message}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => refetch()}>
                <RefreshCw /> Reintentar
              </Button>
              {fallo.reconectar && (
                <Button variant="default" className="flex-1" onClick={() => void signInWithGoogle()}>
                  Reconectar Google
                </Button>
              )}
            </div>
          </Card>
        )}

        {!fallo && vista !== "mes" && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">
                Ocupada {resumen.ocupadas} h{" "}
                <span className="font-normal text-muted-foreground">· Libre {resumen.libres} h</span>
              </p>
              <span className="text-xs text-muted-foreground">
                {minutosAHora(franjas[0].desde)}–{minutosAHora(franjas[franjas.length - 1].hasta)}
              </span>
            </div>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
              <span className="bg-primary" style={{ width: `${resumen.porcentaje}%` }} />
            </div>
          </Card>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Cargando tu agenda...</p>}

        {!fallo && !isLoading && vista === "mes" && (
          <MonthView
            mes={ancla.slice(0, 7)}
            eventos={eventos ?? []}
            hoy={hoy}
            onElegirDia={(dia) => {
              setAncla(dia);
              setVista("dia");
            }}
          />
        )}

        {!fallo &&
          !isLoading &&
          vista !== "mes" &&
          dias.map((dia) => (
            <div key={dia}>
              {vista === "tres" && (
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(
                    new Date(`${dia}T12:00:00Z`),
                  )}
                </p>
              )}
              <DayView
                dia={dia}
                eventos={eventos ?? []}
                tareas={items ?? []}
                franjas={franjas}
                minutosAhora={minutosAhora}
                esHoy={dia === hoy}
              />
            </div>
          ))}

        {isFetching && !isLoading && <p className="text-center text-xs text-muted-foreground">Actualizando...</p>}
      </div>
    </div>
  );
}
