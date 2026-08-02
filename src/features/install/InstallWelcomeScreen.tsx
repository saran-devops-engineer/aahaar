import { useRef, type RefObject } from 'react'
import { APP_NAME, APP_TAGLINE } from '@/config/constants'
import { isIosDevice } from '@/lib/pwa/platform'
import { Button } from '@/shared/components/Button'

const BENEFITS = ['Faster launch', 'App-like experience', 'Works offline'] as const

interface InstallWelcomeScreenProps {
  canNativeInstall: boolean
  onInstall: () => void
  onContinue: () => void
  isInstalling?: boolean
}

export function InstallWelcomeScreen({
  canNativeInstall,
  onInstall,
  onContinue,
  isInstalling = false,
}: InstallWelcomeScreenProps) {
  const isIos = isIosDevice()
  const iosInstructionsRef = useRef<HTMLElement | null>(null)

  function handleInstallClick() {
    if (isIos) {
      iosInstructionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onInstall()
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-10 md:max-w-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(198,242,122,0.18),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(240,194,122,0.14),transparent_35%),linear-gradient(180deg,#0b1f17_0%,#122a20_55%,#0b1f17_100%)]"
      />

      <div className="flex flex-1 flex-col justify-center space-y-8 animate-fade-up">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-[1.75rem] bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <img src="/favicon.svg" alt="" width={56} height={56} aria-hidden />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
            Welcome
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--color-accent)]">
            {APP_NAME}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-base text-[var(--color-text-muted)]">
            For the best experience, add {APP_NAME} to your Home Screen. {APP_TAGLINE}
          </p>
        </div>

        <ul className="mx-auto w-full max-w-sm space-y-3">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm"
            >
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-[#0b1f17]"
                aria-hidden
              >
                ✓
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {isIos ? <IosInstallInstructions sectionRef={iosInstructionsRef} /> : null}
      </div>

      <div className="sticky bottom-0 space-y-3 pt-6 animate-fade-up-delay">
        <Button
          className="w-full"
          data-testid="install-app"
          disabled={!isIos && (!canNativeInstall || isInstalling)}
          loading={isInstalling}
          onClick={() => void handleInstallClick()}
        >
          {isInstalling ? 'Opening install…' : `Install ${APP_NAME}`}
        </Button>

        {!isIos && !canNativeInstall ? (
          <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
            Install is not available in this browser session yet. Use your browser menu to add{' '}
            {APP_NAME} to your Home Screen, or continue in the browser.
          </p>
        ) : null}

        {isIos ? (
          <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
            Tap Install to jump to the Home Screen steps above.
          </p>
        ) : null}

        <Button
          className="w-full"
          variant="secondary"
          data-testid="continue-without-install"
          onClick={onContinue}
        >
          Continue without installing
        </Button>
      </div>
    </div>
  )
}

function IosInstallInstructions({
  sectionRef,
}: {
  sectionRef: RefObject<HTMLElement | null>
}) {
  return (
    <section
      ref={sectionRef}
      className="mx-auto w-full max-w-sm space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5"
      aria-labelledby="ios-install-heading"
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]"
          aria-hidden
        >
          <ShareIcon />
        </div>
        <div>
          <p id="ios-install-heading" className="font-semibold">
            Install on iPhone or iPad
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Add {APP_NAME} to your Home Screen
          </p>
        </div>
      </div>

      <ol className="space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
        <li className="flex gap-3">
          <Step n={1} />
          <span>
            Tap <strong className="text-[var(--color-text)]">Share</strong> in Safari’s
            toolbar.
          </span>
        </li>
        <li className="flex gap-3">
          <Step n={2} />
          <span>
            Tap <strong className="text-[var(--color-text)]">Add to Home Screen</strong>.
          </span>
        </li>
        <li className="flex gap-3">
          <Step n={3} />
          <span>
            Open <strong className="text-[var(--color-text)]">{APP_NAME}</strong> from your
            Home Screen.
          </span>
        </li>
      </ol>
    </section>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-[#0b1f17]">
      {n}
    </span>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12M12 3l-4 4M12 3l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
