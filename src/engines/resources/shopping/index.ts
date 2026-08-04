import { DEFAULT_UNIT_COSTS } from '@/engines/resources/constants'
import { getIngredientAvailability } from '@/engines/resources/pantry'
import { inferCategory, normalizeIngredientKey } from '@/engines/resources/inventory/normalize'
import { findSubstitutes } from '@/engines/resources/strategies/substitute'
import type {
  IngredientCategory,
  MealResourceRequirement,
  ResourceProfile,
  ShoppingEstimate,
  ShoppingItemEstimate,
} from '@/engines/resources/types'

function unitCost(ingredient: string): number {
  const key = normalizeIngredientKey(ingredient)
  for (const [k, cost] of Object.entries(DEFAULT_UNIT_COSTS)) {
    if (key.includes(k)) return cost
  }
  return DEFAULT_UNIT_COSTS.default
}

export function estimateShopping(
  profile: ResourceProfile,
  requirements: readonly MealResourceRequirement[],
): ShoppingEstimate {
  const neededMap = new Map<string, ShoppingItemEstimate>()
  const missing: string[] = []
  const avoidDuplicates: string[] = []

  const owned = new Set(
    profile.inventory.map((i) => normalizeIngredientKey(i.ingredient)),
  )

  for (const req of requirements) {
    for (const ingredient of req.ingredients) {
      const key = normalizeIngredientKey(ingredient)
      const status = getIngredientAvailability(profile, ingredient)
      if (status === 'available') {
        if (owned.has(key)) avoidDuplicates.push(ingredient)
        continue
      }

      missing.push(ingredient)
      const substitutes = findSubstitutes(ingredient, profile)
      const optional = substitutes.length > 0
      const priority =
        status === 'out_of_stock' || status === 'unavailable'
          ? optional
            ? 'medium'
            : 'critical'
          : status === 'low_stock'
            ? 'high'
            : 'optional'

      const existing = neededMap.get(key)
      const next: ShoppingItemEstimate = Object.freeze({
        ingredient,
        quantity: (existing?.quantity ?? 0) + 1,
        unit: existing?.unit ?? 'unit',
        category: inferCategory(ingredient),
        priority: existing?.priority === 'critical' ? 'critical' : priority,
        estimatedCost: unitCost(ingredient) * ((existing?.quantity ?? 0) + 1),
        optional,
      })
      neededMap.set(key, next)
    }
  }

  const needed = Object.freeze([...neededMap.values()])
  const budgetEstimate = needed.reduce((sum, i) => sum + i.estimatedCost, 0)
  const shoppingBudget = profile.budget.shoppingBudget
  const withinShoppingBudget =
    shoppingBudget == null ? null : budgetEstimate <= shoppingBudget

  const grouped = {} as Record<IngredientCategory, ShoppingItemEstimate[]>
  for (const item of needed) {
    const list = grouped[item.category] ?? []
    list.push(item)
    grouped[item.category] = list
  }
  const frozenGrouped = Object.freeze(
    Object.fromEntries(
      Object.entries(grouped).map(([k, v]) => [k, Object.freeze(v)]),
    ),
  ) as ShoppingEstimate['grouped']

  return Object.freeze({
    needed,
    missing: Object.freeze([...new Set(missing)]),
    budgetEstimate,
    withinShoppingBudget,
    grouped: frozenGrouped,
    avoidDuplicates: Object.freeze([...new Set(avoidDuplicates)]),
  })
}

export function estimateBudget(
  profile: ResourceProfile,
  requirements: readonly MealResourceRequirement[],
): {
  readonly mealCostEstimate: number
  readonly shopping: ShoppingEstimate
  readonly remainingAfter: number | null
  readonly exhausted: boolean
} {
  const shopping = estimateShopping(profile, requirements)
  const mealCostEstimate =
    requirements.reduce((sum, r) => sum + (r.estimatedCost ?? 0), 0) +
    shopping.budgetEstimate
  const remaining = profile.budget.remaining
  const remainingAfter =
    remaining == null ? null : Math.max(0, remaining - mealCostEstimate)
  return Object.freeze({
    mealCostEstimate,
    shopping,
    remainingAfter,
    exhausted: profile.budget.exhausted || (remainingAfter != null && remainingAfter <= 0),
  })
}
