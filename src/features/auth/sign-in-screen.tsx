import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";

export function SignInScreen() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-primary-soft text-primary">
        <Sparkles size={28} />
      </span>
      <div>
        <h1 className="font-display text-3xl font-bold">SarSan</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Suelta todo lo que tienes en la cabeza. Yo lo ordeno.
        </p>
      </div>
      <Button variant="default" size="lg" className="w-full max-w-xs" onClick={() => void signInWithGoogle()}>
        Entrar con Google
      </Button>
      <p className="max-w-xs text-xs text-muted-foreground">
        Al entrar aceptas conectar tu Google Calendar y Gmail — SarSan los usa para leer tus eventos y crear los
        nuevos, y para mostrarte los correos de SAPQ.
      </p>
    </div>
  );
}
