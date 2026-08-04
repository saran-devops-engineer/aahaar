import { isUsable, stockAvailabilityForItem } from '@/engines/resources/availability'
import { estimateBudgetFit } from '@/engines/resources/budget'
import { freshnessPriority } from '@/engines/resources/freshness'
import { buildResourceIndex } from '@/engines/resources/inventory'
import { normalizeIngredientKey } from '@/engines/resources/inventory/normalize'
import { equipmentGaps } from '@/engines/resources/kitchen'
import {
  findSubstitutes,
  resolveIngredientWithSubstitution,
} from '@/engines/resources/strategies/substitute'
import type {
  MealResourceRequirement,
  ResourceEvaluation,
  ResourceProfile,
} from '@/engines/resources/types'

/**
 * Can this meal actually be prepared with today's resources?
 * Pure — does not modify Decision Engine.
 */
export function evaluateResources(
  profile: ResourceProfile,
  requirement: MealResourceRequirement,
): ResourceEvaluation {
  const index = buildResourceIndex(profile.inventory)
  const missingIngredients: string[] = []
  const lowStockIngredients: string[] = []
  const preferBecauseExpiring: string[] = []
  const reasons: string[] = []

  for (const ingredient of requirement.ingredients) {
    const resolved = resolveIngredientWithSubstitution(ingredient, profile)
    const item = index.byIngredient.get(normalizeIngredientKey(resolved.ingredient))
    const status = stockAvailabilityForItem(item, profile.market, resolved.ingredient)

    if (!isUsable(status)) {
      const subs = findSubstitutes(ingredient, profile)
      if (subs.length === 0) {
        missingIngredients.push(ingredient)
        reasons.push(`Missing: ${ingredient}`)
      }
      continue
    }

    if (status === 'low_stock') {
      lowStockIngredients.push(resolved.ingredient)
      reasons.push(`Low stock: ${resolved.ingredient}`)
    }
    if (resolved.substituted) {
      reasons.push(`Substitute ${resolved.from} → ${resolved.ingredient}`)
    }
    if (
      item &&
      (item.freshness === 'consume_soon' ||
        item.freshness === 'expiring_today' ||
        item.freshness === 'good')
    ) {
      if (freshnessPriority(item.freshness) <= 3) {
        preferBecauseExpiring.push(item.ingredient)
      }
    }
  }

  const gaps = equipmentGaps(profile.kitchen, requirement.requiredEquipment, {
    needsGas: requirement.needsGas,
    needsPressureCooker: requirement.needsPressureCooker,
  })
  if (gaps.length > 0) {
    reasons.push(`Equipment gap: ${gaps.join(', ')}`)
  }

  // No gas → avoid pressure-cooker heavy path when gas required and no induction.
  if (requirement.needsGas && !profile.kitchen.hasGas && !profile.kitchen.hasInduction) {
    if (!gaps.includes('gas_or_induction')) gaps.push('gas_or_induction')
  }

  let timeOk: boolean | null = null
  if (
    requirement.estimatedPrepMinutes != null &&
    profile.availableCookingTimeMinutes != null
  ) {
    timeOk = requirement.estimatedPrepMinutes <= profile.availableCookingTimeMinutes
    if (!timeOk) reasons.push('Needs more cooking time than available')
    else if (requirement.estimatedPrepMinutes <= 20) {
      reasons.push('Fits quick cooking window')
    }
  }

  const budgetOk = estimateBudgetFit(profile.budget, requirement.estimatedCost)
  if (budgetOk === false) {
    reasons.push(profile.budget.exhausted ? 'Budget exhausted' : 'Over remaining budget')
  } else if (budgetOk === true && profile.budget.exhausted === false) {
    reasons.push('Within budget')
  }

  const preferBecauseLeftover = profile.leftovers.some(
    (l) => l.foodId === requirement.foodId || normalizeIngredientKey(l.label) === normalizeIngredientKey(requirement.foodName ?? ''),
  )
  if (preferBecauseLeftover) reasons.push('Leftover available — prefer consume first')
  if (preferBecauseExpiring.length > 0) {
    reasons.push(`Uses expiring: ${preferBecauseExpiring.join(', ')}`)
  }

  const possible =
    missingIngredients.length === 0 &&
    gaps.length === 0 &&
    timeOk !== false &&
    budgetOk !== false

  let score = possible ? 70 : 20
  score += Math.min(20, preferBecauseExpiring.length * 5)
  if (preferBecauseLeftover) score += 10
  if (timeOk === true) score += 5
  if (budgetOk === true) score += 5
  score -= missingIngredients.length * 15
  score -= gaps.length * 12
  score -= lowStockIngredients.length * 3
  score = Math.max(0, Math.min(100, score))

  if (possible) reasons.unshift('Meal is realistically possible')
  else reasons.unshift('Meal is not possible with current resources')

  return Object.freeze({
    foodId: requirement.foodId,
    possible,
    score,
    missingIngredients: Object.freeze(missingIngredients),
    lowStockIngredients: Object.freeze(lowStockIngredients),
    equipmentGaps: Object.freeze(gaps),
    timeOk,
    budgetOk,
    preferBecauseExpiring: Object.freeze(preferBecauseExpiring),
    preferBecauseLeftover,
    reasons: Object.freeze(reasons),
  })
}

export function findAvailableMeals(
  profile: ResourceProfile,
  requirements: readonly MealResourceRequirement[],
): readonly ResourceEvaluation[] {
  return Object.freeze(
    requirements
      .map((req) => evaluateResources(profile, req))
      .filter((e) => e.possible)
      .sort((a, b) => b.score - a.score || a.foodId.localeCompare(b.foodId)),
  )
}

export function findMissingIngredients(
  profile: ResourceProfile,
  requirement: MealResourceRequirement,
): readonly string[] {
  return evaluateResources(profile, requirement).missingIngredients
}
