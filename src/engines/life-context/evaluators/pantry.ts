import type { DomainEvaluation, LifeContext } from '@/engines/life-context/types'

export function evaluatePantry(context: LifeContext): DomainEvaluation {
  const available = context.pantryStatus !== 'unknown' || context.leftovers.length > 0
  const codes: string[] = []
  if (context.pantryStatus !== 'unknown') {
    codes.push(`PANTRY_${context.pantryStatus.toUpperCase()}`)
  }
  if (context.shoppingStatus !== 'unknown') {
    codes.push(`SHOPPING_${context.shoppingStatus.toUpperCase()}`)
  }
  if (context.leftovers.length > 0) codes.push('HAS_LEFTOVERS')
  if (!available) codes.push('PANTRY_MISSING')

  return Object.freeze({
    domain: 'pantry',
    available,
    summary: !available
      ? 'Pantry missing — continue without pantry constraints'
      : `Pantry ${context.pantryStatus}; shopping ${context.shoppingStatus}; leftovers ${context.leftovers.length}`,
    codes: Object.freeze(codes),
    data: Object.freeze({
      pantryStatus: context.pantryStatus,
      shoppingStatus: context.shoppingStatus,
      leftoverCount: context.leftovers.length,
      marketAvailability: context.marketAvailability,
    }),
  })
}
