import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router'
import { useBootstrap } from '@/hooks/useBootstrap'
import { APP_NAME } from '@/config/constants'
import { SkipLink } from '@/shared/components/SkipLink'

export default function App() {
  const { ready, user, profile, error, refresh } = useBootstrap()

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6" role="status" aria-live="polite">
        <SkipLink />
        <div className="text-center">
          <p className="animate-soft-pulse font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--color-accent)]">
            {APP_NAME}
          </p>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">Preparing your kitchen…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center px-6 text-center"
        role="alert"
      >
        <div>
          <p className="text-lg font-semibold text-[var(--color-danger)]">Startup error</p>
          <p className="mt-2 text-[var(--color-text-muted)]">{error}</p>
          <button
            type="button"
            className="mt-5 min-h-11 rounded-2xl bg-[var(--color-accent)] px-5 font-semibold text-[#0b1f17]"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppProviders>
      <AppRouter
        user={user}
        profile={profile}
        onOnboardingComplete={refresh}
        onProfileChange={refresh}
      />
    </AppProviders>
  )
}
