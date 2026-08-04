import { DEFAULT_CURRENCY } from '@/engines/resources/constants'
import type { BudgetSnapshot } from '@/engines/resources/types'

export interface BudgetInput {
  readonly monthly?: number | null
  readonly weekly?: number | null
  readonly daily?: number | null
  readonly spent?: number
  readonly shoppingBudget?: number | null
  readonly currency?: string
}

export function createBudgetSnapshot(input: BudgetInput = {}): BudgetSnapshot {
  const monthly = input.monthly ?? null
  const weekly =
    input.weekly ?? (monthly != null ? Math.round((monthly / 30) * 7) : null)
  const daily = input.daily ?? (monthly != null ? Math.round(monthly / 30) : null)
  const spent = Math.max(0, input.spent ?? 0)

  let remaining: number | null = null
  if (monthly != null) remaining = Math.max(0, monthly - spent)
  else if (weekly != null) remaining = Math.max(0, weekly - spent)
  else if (daily != null) remaining = Math.max(0, daily - spent)

  const projected =
    remaining != null && daily != null
      ? Math.max(0, remaining - daily)
      : remaining

  const exhausted = remaining != null ? remaining <= 0 : false

  return Object.freeze({
    monthly,
    weekly,
    daily,
    spent,
    remaining,
    projected,
    shoppingBudget: input.shoppingBudget ?? weekly,
    currency: input.currency ?? DEFAULT_CURRENCY,
    exhausted,
  })
}

export function estimateBudgetFit(
  budget: BudgetSnapshot,
  estimatedCost: number | undefined,
): boolean | null {
  if (estimatedCost == null) return null
  if (budget.exhausted) return false
  if (budget.remaining != null) return estimatedCost <= budget.remaining
  if (budget.shoppingBudget != null) return estimatedCost <= budget.shoppingBudget
  return null
}
