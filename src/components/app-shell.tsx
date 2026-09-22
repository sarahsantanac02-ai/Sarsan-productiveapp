import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { CalendarDays, Home, Mic, Pencil, Settings2, Sun, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { useCaptureSheets } from "@/features/capture/capture-provider";

const headerLinks = [
  { to: "/calendario", label: "Calendario" },
  { to: "/mi", label: "Mí" },
  { to: "/finanzas", label: "Finanzas" },
];

export function AppShell() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const { abrirVoz, abrirManual } = useCaptureSheets();

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <main className="min-h-dvh bg-app-shell sm:px-6 sm:py-7">
      <div className="relative mx-auto min-h-dvh w-full overflow-hidden bg-background sm:min-h-[844px] sm:max-w-[390px] sm:rounded-[28px] sm:border sm:border-border">
        <header className="sticky top-0 z-30 bg-background/95 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-lg">
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
            <Button
              variant="ghost"
              size="iconSm"
              aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun /> : <Settings2 />}
            </Button>
          </div>
        </header>

        <div className="pb-32">
          <Outlet />
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[86px] w-full max-w-[390px] items-center justify-around border-t border-border bg-background/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-xl">
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
