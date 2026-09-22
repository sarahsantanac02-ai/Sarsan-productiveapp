import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/features/auth/use-auth";
import { SignInScreen } from "@/features/auth/sign-in-screen";
import { OnboardingScreen } from "@/features/onboarding/onboarding-screen";
import { useProfile } from "@/features/onboarding/use-profile";
import { AppShell } from "@/components/app-shell";
import { TodayScreen } from "@/features/today/today-screen";
import { CalendarScreen } from "@/features/calendar/calendar-screen";
import { MeScreen } from "@/features/me/me-screen";
import { FinanceScreen } from "@/features/finance/finance-screen";

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Cargando SarSan...</p>
    </div>
  );
}

function Gate() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading) return <FullScreenLoader />;
  if (!user) return <SignInScreen />;
  if (profileLoading || !profile) return <FullScreenLoader />;
  if (profile.edad === null) return <OnboardingScreen profile={profile} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayScreen />} />
          <Route path="calendario" element={<CalendarScreen />} />
          <Route path="mi" element={<MeScreen />} />
          <Route path="finanzas" element={<FinanceScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
