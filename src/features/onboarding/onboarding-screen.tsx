import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile, type Profile } from "@/features/onboarding/use-profile";

export function OnboardingScreen({ profile }: { profile: Profile }) {
  const [despertar, setDespertar] = useState(profile.hora_despertar.slice(0, 5));
  const [dormir, setDormir] = useState(profile.hora_dormir.slice(0, 5));
  const [edad, setEdad] = useState("");
  const [estatura, setEstatura] = useState(String(profile.estatura_cm));
  const [peso, setPeso] = useState(String(profile.peso_kg));
  const updateProfile = useUpdateProfile();

  const edadValida = Number(edad) > 0 && Number(edad) < 120;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!edadValida) return;
    updateProfile.mutate({
      hora_despertar: despertar,
      hora_dormir: dormir,
      edad: Number(edad),
      estatura_cm: Number(estatura),
      peso_kg: Number(peso),
    });
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-semibold uppercase text-primary">Un momento antes de arrancar</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Cuéntame de tus días</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Con esto calculo tus franjas de energía y tu meta de energía diaria.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="despertar">Te levantas</Label>
              <Input id="despertar" type="time" value={despertar} onChange={(e) => setDespertar(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="dormir">Te duermes</Label>
              <Input id="dormir" type="time" value={dormir} onChange={(e) => setDormir(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label htmlFor="edad">Edad</Label>
            <Input
              id="edad"
              type="number"
              min={1}
              max={119}
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Ej: 24"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="estatura">Estatura (cm)</Label>
              <Input id="estatura" type="number" value={estatura} onChange={(e) => setEstatura(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input id="peso" type="number" value={peso} onChange={(e) => setPeso(e.target.value)} />
            </div>
          </div>

          <Button type="submit" variant="default" size="lg" className="mt-2 w-full" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Guardando..." : "Listo, seguir"}
          </Button>
          {updateProfile.isError && (
            <p className="text-center text-xs text-destructive">No se pudo guardar. Intenta de nuevo.</p>
          )}
        </form>
      </div>
    </div>
  );
}
