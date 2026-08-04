import type { DomainEvaluation, LifeContext } from '@/engines/life-context/types'

export function evaluateFestival(context: LifeContext): DomainEvaluation {
  const available = context.festival != null || context.holiday != null
  const codes: string[] = []
  if (context.festival) codes.push('FESTIVAL')
  if (context.holiday === true) codes.push('HOLIDAY')
  if (!available) codes.push('NO_FESTIVAL_SIGNAL')

  return Object.freeze({
    domain: 'festival',
    available,
    summary: context.festival
      ? `Festival: ${context.festival}`
      : context.holiday === true
        ? 'Holiday (unnamed)'
        : 'No festival/holiday signal — continue',
    codes: Object.freeze(codes),
    data: Object.freeze({
      festival: context.festival,
      holiday: context.holiday,
      workingDay: context.workingDay,
    }),
  })
}
