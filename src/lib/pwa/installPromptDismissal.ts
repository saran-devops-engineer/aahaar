/** How long "Continue without installing" suppresses the welcome screen. */
export const INSTALL_PROMPT_DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export const INSTALL_PROMPT_DISMISS_KEY = 'aahaar.installPromptDismissedAt'

/**
 * Returns true when the user dismissed the install welcome within the last 30 days.
 * Uses localStorage for non-primary UX state only (not nutrition/profile data).
 */
export function isInstallPromptDismissed(
  dismissedAt: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (!dismissedAt) return false
  const dismissedMs = Date.parse(dismissedAt)
  if (Number.isNaN(dismissedMs)) return false
  return nowMs - dismissedMs < INSTALL_PROMPT_DISMISS_DURATION_MS
}

export function readInstallPromptDismissedAt(): string | null {
  try {
    return localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY)
  } catch {
    return null
  }
}

export function writeInstallPromptDismissedAt(iso = new Date().toISOString()): void {
  try {
    localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, iso)
  } catch {
    // Ignore quota / private-mode failures.
  }
}
