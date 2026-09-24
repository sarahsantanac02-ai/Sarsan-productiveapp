import { Bell, BellOff, Link2, Moon, Share, Sun, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScreenTitle } from "@/components/app-shell";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { useState } from "react";
import { useAuth } from "@/features/auth/use-auth";
import {
  esIOS,
  estaInstalada,
  soportaPush,
  useActivarPush,
  useDesactivarPush,
  useNotificationPrefs,
  usePushSubscriptions,
} from "@/features/notifications/use-push";
import { puedeConectarNotion, urlDeAutorizacionNotion } from "@/features/integrations/use-notion";
import { HistorialCard } from "@/features/historial/historial-card";

export function SettingsScreen() {
  const { signOut, user, errorGoogle, signInWithGoogle } = useAuth();
  const { data: suscripciones } = usePushSubscriptions();
  const { data: prefs, update } = useNotificationPrefs();
  const activar = useActivarPush();
  const desactivar = useDesactivarPush();
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  const necesitaInstalar = esIOS() && !estaInstalada();
  const activas = (suscripciones?.length ?? 0) > 0;

  function cambiarTema(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="pb-4">
      <ScreenTitle eyebrow="Tu app, a tu manera" title="Ajustes" />

      <div className="space-y-5 px-4 pt-5">
        <Card>
          <h2 className="font-display font-semibold">Apariencia</h2>
          <div className="mt-3 flex rounded-xl bg-muted p-1">
            {(
              [
                ["light", "Claro", <Sun key="s" />],
                ["dark", "Oscuro", <Moon key="m" />],
              ] as const
            ).map(([id, label, icono]) => (
              <Button
                key={id}
                variant={theme === id ? "segmentActive" : "segment"}
                size="sm"
                onClick={() => cambiarTema(id)}
              >
                {icono} {label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display font-semibold">Notificaciones</h2>

          {necesitaInstalar && (
            <div className="mt-3 rounded-xl bg-amber-soft p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-strong">
                <Share size={13} /> Primero instálala en tu iPhone
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-strong">
                Safari solo deja mandar avisos si la app está en tu pantalla de inicio. Toca el botón de compartir
                abajo y elige “Añadir a pantalla de inicio”, luego vuelve aquí.
              </p>
            </div>
          )}

          {!soportaPush() && (
            <p className="mt-3 text-xs text-muted-foreground">Este navegador no soporta notificaciones.</p>
          )}

          {soportaPush() && !necesitaInstalar && (
            <>
              <p className="mt-2 text-xs text-muted-foreground">
                {activas
                  ? `Activas en ${suscripciones!.length} ${suscripciones!.length === 1 ? "dispositivo" : "dispositivos"}.`
                  : "Te aviso al arrancar Foco y Segundo aire, lo que vence hoy, y lo que falta al cerrar el día."}
              </p>

              <Button
                variant={activas ? "outline" : "default"}
                className="mt-3 w-full"
                onClick={() => activar.mutate()}
                disabled={activar.isPending}
              >
                <Bell /> {activar.isPending ? "Activando..." : activas ? "Activar en este dispositivo" : "Activar"}
              </Button>

              {activar.isError && (
                <p className="mt-2 text-xs text-destructive">
                  {activar.error instanceof Error ? activar.error.message : "No se pudo activar"}
                </p>
              )}

              {suscripciones?.map((sub) => (
                <div key={sub.id} className="mt-2 flex items-center gap-2 rounded-xl bg-muted p-2.5">
                  <BellOff size={14} className="shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-xs">{sub.dispositivo ?? "Dispositivo"}</span>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => desactivar.mutate(sub.id)}
                    aria-label="Quitar este dispositivo"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </>
          )}

          {prefs && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <Interruptor
                label="Al arrancar Foco y Segundo aire"
                activo={prefs.por_franja}
                onCambiar={(v) => update.mutate({ por_franja: v })}
              />
              <Interruptor
                label="Lo que vence hoy (9am)"
                activo={prefs.vencimientos}
                onCambiar={(v) => update.mutate({ vencimientos: v })}
              />
              <div>
                <Label htmlFor="cierre">Recordatorio de cierre</Label>
                <Input
                  id="cierre"
                  type="time"
                  value={prefs.cierre_hora.slice(0, 5)}
                  onChange={(e) => update.mutate({ cierre_hora: e.target.value })}
                />
              </div>
              <Interruptor
                label="Un aviso por cada pendiente de Hoy"
                activo={prefs.pendientes_individuales}
                onCambiar={(v) => update.mutate({ pendientes_individuales: v })}
              />
              {prefs.pendientes_individuales && (
                <div>
                  <Label htmlFor="pendientes-hora">A qué hora</Label>
                  <Input
                    id="pendientes-hora"
                    type="time"
                    value={prefs.pendientes_hora.slice(0, 5)}
                    onChange={(e) => update.mutate({ pendientes_hora: e.target.value })}
                  />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Sin límite: si tienes 8 pendientes hoy, te llegan 8 avisos separados.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        <HistorialCard />

        <Card>
          <h2 className="font-display font-semibold">Integraciones</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Google Calendar y Gmail ya quedaron conectados cuando entraste.
          </p>

          {errorGoogle && (
            <div className="mt-3 rounded-xl bg-amber-soft p-3">
              <p className="text-[11px] font-semibold text-amber-strong">
                No pude guardar tu conexión con Google
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-strong">{errorGoogle}</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => void signInWithGoogle()}>
                <Link2 /> Volver a entrar con Google
              </Button>
            </div>
          )}

          {puedeConectarNotion() ? (
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                window.location.href = urlDeAutorizacionNotion();
              }}
            >
              <Link2 /> Conectar Notion
            </Button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Para conectar Notion falta configurar <code>VITE_NOTION_CLIENT_ID</code> en Vercel.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-display font-semibold">Cuenta</h2>
          <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="outline" className="mt-3 w-full" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Interruptor({
  label,
  activo,
  onCambiar,
}: {
  label: string;
  activo: boolean;
  onCambiar: (valor: boolean) => void;
}) {
  return (
    <button
      onClick={() => onCambiar(!activo)}
      className="flex w-full cursor-pointer items-center gap-3 text-left"
      role="switch"
      aria-checked={activo}
    >
      <span className="flex-1 text-sm">{label}</span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${activo ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-card transition-all ${activo ? "left-5" : "left-1"}`}
        />
      </span>
    </button>
  );
}
