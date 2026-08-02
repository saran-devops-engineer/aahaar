import { rankFoodsForMeal, type RankOptions, type RankedFood } from '@/engines/recommendation'
import type { Food } from '@/types/domain'

export interface SubstitutionSearchOptions extends RankOptions {
  currentFoodId: string
  /** Prefer staying within this calorie band of the current meal food. */
  calorieTolerance?: number
  limit?: number
}

/**
 * Deterministic, rule-pre-filtered substitution search.
 * Callers must pass foods already cleared by the Rule Engine.
 * AI may only reorder / phrase these results — never invent foods.
 */
export function findSubstitutionCandidates(
  safeFoods: Food[],
  options: SubstitutionSearchOptions,
): RankedFood[] {
  const tolerance = options.calorieTolerance ?? 120
  const limit = options.limit ?? 8
  const current = safeFoods.find((food) => food.id === options.currentFoodId)
  const targetCalories = current?.nutrition.calories ?? options.targetCalories

  return rankFoodsForMeal(safeFoods, options)
    .filter((ranked) => ranked.food.id !== options.currentFoodId)
    .filter(
      (ranked) =>
        Math.abs(ranked.food.nutrition.calories - targetCalories) <= tolerance,
    )
    .slice(0, limit)
}
