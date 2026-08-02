import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '@/config/constants'
import { isIosDevice, isStandaloneDisplayMode } from '@/lib/pwa/platform'
import { useInstallPrompt } from '@/lib/pwa/useInstallPrompt'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { DocumentTitle } from '@/shared/components/DocumentTitle'
import { PageHeader } from '@/shared/components/PageHeader'

export function InstallSettingsPage() {
  const isIos = isIosDevice()
  const installed = isStandaloneDisplayMode()
  const { canNativeInstall, promptInstall } = useInstallPrompt()
  const [isInstalling, setIsInstalling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleInstall() {
    setIsInstalling(true)
    setMessage(null)
    try {
      const accepted = await promptInstall()
      setMessage(
        accepted
          ? `${APP_NAME} install started.`
          : 'Install was dismissed. You can try again from your browser menu.',
      )
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <div>
      <DocumentTitle title="Install" />
      <p className="mb-4">
        <Link to="/settings" className="text-sm text-[var(--color-accent)]">
          ← Settings
        </Link>
      </p>
      <PageHeader
        title="Install app"
        subtitle={`Add ${APP_NAME} to your Home Screen for a faster, offline-first experience.`}
      />

      {installed ? (
        <Card>
          <p className="font-semibold text-[var(--color-accent)]">Already installed</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            You’re using {APP_NAME} from your Home Screen.
          </p>
        </Card>
      ) : isIos ? (
        <Card className="space-y-4">
          <p className="font-semibold">Install on iPhone or iPad</p>
          <ol className="space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
            <li>
              1. Tap <strong className="text-[var(--color-text)]">Share</strong> in Safari’s
              toolbar.
            </li>
            <li>
              2. Tap <strong className="text-[var(--color-text)]">Add to Home Screen</strong>.
            </li>
            <li>
              3. Open <strong className="text-[var(--color-text)]">{APP_NAME}</strong> from
              your Home Screen.
            </li>
          </ol>
        </Card>
      ) : (
        <Card className="space-y-4">
          <p className="font-semibold">Install on Android</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Use the install prompt when available for an app-like experience with offline
            support.
          </p>
          <Button
            className="w-full"
            disabled={!canNativeInstall || isInstalling}
            loading={isInstalling}
            onClick={() => void handleInstall()}
          >
            {isInstalling ? 'Opening install…' : `Install ${APP_NAME}`}
          </Button>
          {!canNativeInstall ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              If Install is unavailable, open your browser menu and choose “Install app” or
              “Add to Home screen”.
            </p>
          ) : null}
          {message ? <p className="text-sm text-[var(--color-accent)]">{message}</p> : null}
        </Card>
      )}
    </div>
  )
}
