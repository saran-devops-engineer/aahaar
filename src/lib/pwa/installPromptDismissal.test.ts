import { describe, expect, it } from 'vitest'
import {
  INSTALL_PROMPT_DISMISS_DURATION_MS,
  isInstallPromptDismissed,
} from '@/lib/pwa/installPromptDismissal'

describe('install prompt dismissal', () => {
  it('returns false when never dismissed', () => {
    expect(isInstallPromptDismissed(null)).toBe(false)
  })

  it('returns true within the dismiss window', () => {
    const now = Date.UTC(2026, 7, 2)
    const dismissedAt = new Date(now - 24 * 60 * 60 * 1000).toISOString()
    expect(isInstallPromptDismissed(dismissedAt, now)).toBe(true)
  })

  it('returns false after the dismiss window', () => {
    const now = Date.UTC(2026, 7, 2)
    const dismissedAt = new Date(
      now - INSTALL_PROMPT_DISMISS_DURATION_MS - 1000,
    ).toISOString()
    expect(isInstallPromptDismissed(dismissedAt, now)).toBe(false)
  })
})
