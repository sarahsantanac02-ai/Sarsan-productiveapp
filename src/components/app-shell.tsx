import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, Home, Mic, Pencil, Settings2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCaptureSheets } from "@/features/capture/capture-provider";

const headerLinks = [
  { to: "/calendario", label: "Calendario" },
  { to: "/mi", label: "Mí" },
  { to: "/finanzas", label: "Finanzas" },
];

export function AppShell() {
  const { abrirVoz, abrirManual } = useCaptureSheets();
  const navigate = useNavigate();

  return (
    <main className="h-dvh overflow-hidden bg-app-shell sm:px-6 sm:py-7">
      {/* Antes el nav era `position: fixed` y el scroll era del documento entero:
          en el PWA instalado en iOS eso hace que el nav se despegue y "viaje"
          con el contenido mientras se hace scroll (bug real de Safari con fixed
          + viewport dinámico). Ahora el marco mide exacto el viewport y solo el
          panel del medio hace scroll, así que el nav nunca se mueve. */}
      <div className="relative mx-auto flex h-full w-full flex-col overflow-hidden bg-background sm:h-[844px] sm:max-w-[390px] sm:rounded-[28px] sm:border sm:border-border">
        <header className="z-30 shrink-0 bg-background/95 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-lg">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-none" aria-label="Navegación principal">
              {headerLinks.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {({ isActive }) => (
                    <Button variant={isActive ? "pillActive" : "pill"} size="sm" asChild={false}>
                      {link.label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </div>
            <Button variant="ghost" size="iconSm" aria-label="Ajustes" onClick={() => navigate("/ajustes")}>
              <Settings2 />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        <nav className="z-40 flex h-[86px] shrink-0 items-center justify-around border-t border-border bg-background/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <NavLink to="/">
            {({ isActive }) => (
              <Button variant={isActive ? "dockActive" : "dock"} size="dock">
                <Home />
                <span>Hoy</span>
              </Button>
            )}
          </NavLink>
          <NavLink to="/calendario">
            {({ isActive }) => (
              <Button variant={isActive ? "dockActive" : "dock"} size="dock">
                <CalendarDays />
                <span>Agenda</span>
              </Button>
            )}
          </NavLink>
          <Button variant="mic" size="mic" onClick={abrirVoz} aria-label="Soltar por voz">
            <Mic />
          </Button>
          <Button variant="pencil" size="dock" onClick={abrirManual}>
            <Pencil />
            <span>Escribir</span>
          </Button>
          <NavLink to="/mi">
            {({ isActive }) => (
              <Button variant={isActive ? "dockActive" : "dock"} size="dock">
                <UserRound />
                <span>Mí</span>
              </Button>
            )}
          </NavLink>
        </nav>
      </div>
    </main>
  );
}

export function ScreenTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="px-4 pt-3">
      <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{eyebrow}</p>
      <h1 className="font-display text-[32px] font-bold leading-none">{title}</h1>
    </div>
  );
}
