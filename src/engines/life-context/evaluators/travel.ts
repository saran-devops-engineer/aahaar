import type { DomainEvaluation, LifeContext } from '@/engines/life-context/types'

export function evaluateTravel(context: LifeContext): DomainEvaluation {
  const available = context.travelMode != null
  const traveling = context.travelMode === true
  const codes: string[] = []
  if (traveling) codes.push('TRAVEL_MODE')
  if (context.travelMode === false) codes.push('LOCAL_MODE')
  if (!available) codes.push('TRAVEL_UNKNOWN')

  return Object.freeze({
    domain: 'travel',
    available,
    summary: !available
      ? 'Travel mode unknown — continue without travel constraints'
      : traveling
        ? 'Travel mode — short prep windows'
        : 'Not traveling',
    codes: Object.freeze(codes),
    data: Object.freeze({
      travelMode: context.travelMode,
      cookingTime: context.availableCookingTime,
      homeMode: context.homeMode,
      officeMode: context.officeMode,
    }),
  })
}
