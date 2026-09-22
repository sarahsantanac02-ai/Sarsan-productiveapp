import { ScreenTitle } from "@/components/app-shell";
import { useProfile } from "@/features/onboarding/use-profile";
import { HabitsCard } from "@/features/me/habits-card";
import { WaterCard } from "@/features/me/water-card";
import { FoodCard } from "@/features/me/food-card";
import { EnergyCard } from "@/features/me/energy-card";
import { CycleCard } from "@/features/me/cycle-card";

export function MeScreen() {
  const { data: profile } = useProfile();

  return (
    <div className="pb-4">
      <ScreenTitle eyebrow="Cuidarme también cuenta" title="Mí" />

      <div className="space-y-5 px-4 pt-5">
        <HabitsCard />
        {profile && <WaterCard botellaMl={profile.botella_ml} meta={profile.botellas_meta} />}
        {profile && <FoodCard profile={profile} />}
        {profile && <EnergyCard horaDormir={profile.hora_dormir} />}
        <CycleCard />
      </div>
    </div>
  );
}
