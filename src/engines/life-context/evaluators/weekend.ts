import type { DomainEvaluation, LifeContext } from '@/engines/life-context/types'

export function evaluateWeekend(context: LifeContext): DomainEvaluation {
  const weekend = context.dayOfWeek === 'saturday' || context.dayOfWeek === 'sunday'
  const codes = weekend ? (['WEEKEND'] as const) : (['WEEKDAY'] as const)

  return Object.freeze({
    domain: 'weekend',
    available: true,
    summary: weekend ? 'Weekend — more cooking time likely' : 'Weekday',
    codes: Object.freeze([...codes]),
    data: Object.freeze({
      weekend,
      dayOfWeek: context.dayOfWeek,
      cookingTime: context.availableCookingTime,
    }),
  })
}
