import { useEffect, useState, type ReactNode } from 'react'
import { InstallWelcomeScreen } from '@/features/install/InstallWelcomeScreen'
import {
  isInstallPromptDismissed,
  readInstallPromptDismissedAt,
  writeInstallPromptDismissedAt,
} from '@/lib/pwa/installPromptDismissal'
import { isStandaloneDisplayMode } from '@/lib/pwa/platform'
import { useInstallPrompt } from '@/lib/pwa/useInstallPrompt'

interface InstallWelcomeGateProps {
  children: ReactNode
}

type WelcomeGateDecision = 'pending' | 'skip' | 'show'

/**
 * Welcome / install experience.
 * Android: native install prompt when available.
 * iOS: Add to Home Screen guide.
 * Skipped when already installed or recently dismissed.
 */
export function InstallWelcomeGate({ children }: InstallWelcomeGateProps) {
  const [decision, setDecision] = useState<WelcomeGateDecision>('pending')
  const [isInstalling, setIsInstalling] = useState(false)
  const { canNativeInstall, isInstalled, promptInstall } = useInstallPrompt()

  useEffect(() => {
    if (isStandaloneDisplayMode()) {
      setDecision('skip')
      return
    }

    const dismissedAt = readInstallPromptDismissedAt()
    setDecision(isInstallPromptDismissed(dismissedAt) ? 'skip' : 'show')
  }, [])

  useEffect(() => {
    if (isInstalled) setDecision('skip')
  }, [isInstalled])

  if (decision === 'pending') {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6" role="status">
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      </div>
    )
  }

  if (decision === 'skip') {
    return <>{children}</>
  }

  async function handleInstall() {
    setIsInstalling(true)
    try {
      const accepted = await promptInstall()
      if (accepted) setDecision('skip')
    } finally {
      setIsInstalling(false)
    }
  }

  function handleContinue() {
    writeInstallPromptDismissedAt()
    setDecision('skip')
  }

  return (
    <InstallWelcomeScreen
      canNativeInstall={canNativeInstall}
      isInstalling={isInstalling}
      onInstall={() => void handleInstall()}
      onContinue={handleContinue}
    />
  )
}
