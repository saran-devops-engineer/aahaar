import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/layout/AppShell'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { MealSkeletonList } from '@/shared/components/Skeleton'
import type { Profile, User } from '@/types/domain'

const HomePage = lazy(() =>
  import('@/features/home/HomePage').then((m) => ({ default: m.HomePage })),
)
const PlanPage = lazy(() =>
  import('@/features/plan/PlanPage').then((m) => ({ default: m.PlanPage })),
)
const ShopPage = lazy(() =>
  import('@/features/shop/ShopPage').then((m) => ({ default: m.ShopPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const ProfileSettingsPage = lazy(() =>
  import('@/features/settings/ProfileSettingsPage').then((m) => ({
    default: m.ProfileSettingsPage,
  })),
)
const MedicalSettingsPage = lazy(() =>
  import('@/features/settings/MedicalSettingsPage').then((m) => ({
    default: m.MedicalSettingsPage,
  })),
)
const PreferencesSettingsPage = lazy(() =>
  import('@/features/settings/PreferencesSettingsPage').then((m) => ({
    default: m.PreferencesSettingsPage,
  })),
)

interface AppRouterProps {
  user: User | null
  profile: Profile | null
  onOnboardingComplete: () => Promise<void>
  onProfileChange: () => Promise<void>
}

function RouteFallback() {
  return (
    <div className="space-y-4 pt-2" role="status" aria-live="polite">
      <div className="skeleton h-10 w-40 rounded-2xl" />
      <div className="skeleton h-5 w-64 rounded-xl" />
      <MealSkeletonList count={2} />
    </div>
  )
}

export function AppRouter({
  user,
  profile,
  onOnboardingComplete,
  onProfileChange,
}: AppRouterProps) {
  const needsOnboarding = !user?.onboardingComplete || !profile

  return (
    <BrowserRouter>
      <Routes>
        {needsOnboarding ? (
          <>
            <Route
              path="/onboarding"
              element={<OnboardingPage onComplete={onOnboardingComplete} />}
            />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </>
        ) : (
          <>
            <Route element={<AppShell />}>
              <Route
                index
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <HomePage profile={profile} user={user} />
                  </Suspense>
                }
              />
              <Route
                path="plan"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PlanPage profile={profile} />
                  </Suspense>
                }
              />
              <Route
                path="shop"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <ShopPage profile={profile} />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <SettingsPage profile={profile} />
                  </Suspense>
                }
              />
              <Route
                path="settings/profile"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <ProfileSettingsPage profile={profile} onSaved={onProfileChange} />
                  </Suspense>
                }
              />
              <Route
                path="settings/medical"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <MedicalSettingsPage profile={profile} />
                  </Suspense>
                }
              />
              <Route
                path="settings/preferences"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PreferencesSettingsPage profile={profile} />
                  </Suspense>
                }
              />
            </Route>
            <Route path="/onboarding" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
