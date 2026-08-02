/** PWA platform detection for the install welcome flow. */

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = window.navigator.userAgent
  const isClassicIos = /iPad|iPhone|iPod/.test(userAgent)
  const isIpadOs =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1

  return isClassicIos || isIpadOs
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android/.test(window.navigator.userAgent)
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
