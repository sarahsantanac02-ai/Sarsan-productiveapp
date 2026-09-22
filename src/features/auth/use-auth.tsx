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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Guarda los tokens de Google que Supabase solo entrega en el evento de login
// (provider_refresh_token únicamente la primera vez que Sarah da consentimiento).
// TODO(fase 7): cifrar con pgsodium desde una Edge Function en vez de guardar
// el texto plano aquí — por ahora la fila solo la puede leer su dueña (RLS).
async function persistGoogleTokens(session: Session) {
  if (!session.provider_token && !session.provider_refresh_token) return;

  const expiraAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null;

  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: session.user.id,
      proveedor: "google",
      access_token: session.provider_token ?? null,
      refresh_token: session.provider_refresh_token ?? undefined,
      scopes: GOOGLE_SCOPES,
      expira_at: expiraAt,
    },
    { onConflict: "user_id,proveedor", ignoreDuplicates: false },
  );

  if (error) console.error("No se pudo guardar la integración de Google:", error.message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_IN" && newSession) {
        void persistGoogleTokens(newSession);
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
      value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}
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
