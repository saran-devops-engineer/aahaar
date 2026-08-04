import type { CostTier } from '@/types/domain'
import { resolveNow } from '@/engines/life-context/providers/dateProvider'
import type {
  BudgetStatus,
  LifeContextProvider,
  SalaryCyclePhase,
} from '@/engines/life-context/types'

function statusFromTier(tier: CostTier | undefined): BudgetStatus {
  if (tier == null) return 'unknown'
  if (tier <= 2) return 'tight'
  if (tier >= 4) return 'comfortable'
  return 'normal'
}

function salaryPhase(dayOfMonth: number, salaryDay: number): SalaryCyclePhase {
  const delta = ((dayOfMonth - salaryDay) % 30 + 30) % 30
  if (delta <= 5) return 'post_salary'
  if (delta >= 25) return 'pre_salary'
  return 'mid_cycle'
}

export const budgetProvider: LifeContextProvider = {
  id: 'BudgetProvider',
  provide(signals) {
    const missing: string[] = []
    const budgetStatus =
      signals.budgetStatus ?? statusFromTier(signals.budgetTier)
    if (budgetStatus === 'unknown') missing.push('budgetStatus')

    let salaryCycle: SalaryCyclePhase = signals.salaryCycle ?? 'unknown'
    if (signals.salaryCycle == null && signals.salaryDayOfMonth != null) {
      const day = resolveNow(signals).getDate()
      salaryCycle = salaryPhase(day, signals.salaryDayOfMonth)
    }
    if (salaryCycle === 'unknown') missing.push('salaryCycle')

    return {
      providerId: 'BudgetProvider',
      available: budgetStatus !== 'unknown' || salaryCycle !== 'unknown',
      missingFields: missing,
      value: { budgetStatus, salaryCycle },
    }
  },
}
