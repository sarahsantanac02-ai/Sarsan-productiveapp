import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Por qué no se pudo guardar la conexión con Google, si falló. Se ve en Ajustes. */
  errorGoogle: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Los access_token de Google duran una hora; el refresh_token es el que
// importa, y Google solo lo entrega cuando Sarah da consentimiento.
const GOOGLE_TOKEN_MIN = 50;

/**
 * Guarda los tokens de Google que vienen en la sesión.
 *
 * `reciente` distingue el login de verdad de una sesión recuperada de
 * localStorage. Solo en el primer caso guardamos el access_token: en una
 * sesión vieja ese token ya puede estar muerto, y marcarlo como vigente
 * dejaría a las Edge Functions llamando a Google con un token vencido en vez
 * de refrescarlo.
 *
 * TODO: cifrar con pgsodium desde una Edge Function en vez de guardar el
 * texto plano aquí — por ahora la fila solo la puede escribir su dueña (RLS)
 * y nadie la puede leer desde el navegador.
 */
async function persistGoogleTokens(session: Session, reciente: boolean): Promise<string | null> {
  if (!session.provider_token && !session.provider_refresh_token) return null;

  const fila: Record<string, unknown> = {
    user_id: session.user.id,
    proveedor: "google",
    scopes: GOOGLE_SCOPES,
  };

  // Sin `??  undefined`: si esta vez no vino refresh_token, no queremos borrar
  // el que ya estaba guardado.
  if (session.provider_refresh_token) fila.refresh_token = session.provider_refresh_token;

  if (reciente && session.provider_token) {
    fila.access_token = session.provider_token;
    fila.expira_at = new Date(Date.now() + GOOGLE_TOKEN_MIN * 60_000).toISOString();
  }

  const { error } = await supabase
    .from("integrations")
    .upsert(fila, { onConflict: "user_id,proveedor", ignoreDuplicates: false });

  if (error) {
    console.error("No se pudo guardar la integración de Google:", error.message);
    return error.message;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Ojo con `SIGNED_IN` a secas: el cliente de Supabase se crea al importar
    // el módulo y procesa la URL del regreso de Google antes de que React
    // monte esto. Para cuando existe la suscripción, ese evento ya pasó y a un
    // suscriptor tardío le llega `INITIAL_SESSION`. Escuchando solo `SIGNED_IN`
    // el refresh_token se perdía y Google quedaba "sin conectar" para siempre.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (!newSession) return;
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        void persistGoogleTokens(newSession, event === "SIGNED_IN").then(setErrorGoogle);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: GOOGLE_SCOPES,
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: window.location.origin,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, errorGoogle, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
