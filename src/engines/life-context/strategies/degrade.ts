import type { LifeContext } from '@/engines/life-context/types'

/** True when a soft field can be skipped safely. */
export function canContinueWithout(field: keyof LifeContext | string): boolean {
  const required = new Set(['currentDate', 'currentTime', 'dayOfWeek', 'season', 'version'])
  return !required.has(field)
}

export function describeDegradation(context: LifeContext): string {
  if (context.missingFields.length === 0) return 'Full life context available'
  return `Degraded — missing: ${context.missingFields.slice(0, 8).join(', ')}${
    context.missingFields.length > 8 ? '…' : ''
  }`
}
