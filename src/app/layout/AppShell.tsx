import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { SkipLink } from '@/shared/components/SkipLink'
import { LiveAnnouncer } from '@/shared/components/LiveAnnouncer'

const nav = [
  { to: '/', label: 'Today', end: true },
  { to: '/plan', label: 'Plan' },
  { to: '/shop', label: 'Shop' },
  { to: '/settings', label: 'Settings' },
]

export function AppShell() {
  const location = useLocation()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-28 pt-6 md:max-w-2xl">
      <SkipLink />
      <LiveAnnouncer />

      <header className="mb-6 flex items-baseline justify-between">
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-wide text-[var(--color-accent)]">
          {APP_NAME}
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Nutrition Intelligence
        </p>
      </header>

      <main id="main-content" className="flex-1 animate-page-in" key={location.pathname} tabIndex={-1}>
        <Outlet />
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] backdrop-blur-md"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2 md:max-w-2xl">
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                aria-label={item.label}
                className={({ isActive }) =>
                  `flex min-h-12 items-center justify-center rounded-2xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-[var(--color-surface)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive ? <span className="sr-only">(current)</span> : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
