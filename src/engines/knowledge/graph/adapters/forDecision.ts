import type { UserContext } from '@/engines/context'
import {
  findFoodsByBudget,
  findFoodsByCondition,
  findFoodsByMealType,
  findFoodsByRegion,
  findFoodsBySeason,
  getKnowledgeGraph,
} from '@/engines/knowledge/graph'
import type { Food, MealType } from '@/types/domain'

/**
 * Adapter for Decision Engine consumers.
 * Returns indexed candidate foods for a meal slot without scanning the full catalog in the caller.
 * Decision may adopt this later without changing Context or UI.
 */
export function graphCandidatesForMeal(
  context: UserContext,
  mealType: MealType,
  limit = 40,
): Food[] {
  const graph = getKnowledgeGraph()
  const byMeal = findFoodsByMealType(mealType, { limit: 80 }, graph)
  const byRegion = new Set(
    findFoodsByRegion(context.state, { limit: 80 }, graph).map((f) => f.id),
  )
  const bySeason = new Set(
    findFoodsBySeason(context.season === 'all' ? 'summer' : context.season, { limit: 80 }, graph).map(
      (f) => f.id,
    ),
  )
  const byBudget = new Set(
    findFoodsByBudget(context.budget.tier, { limit: 80 }, graph).map((f) => f.id),
  )

  let pool = byMeal.filter(
    (food) => byRegion.has(food.id) && bySeason.has(food.id) && byBudget.has(food.id),
  )

  for (const condition of context.medical.conditions) {
    const safe = new Set(findFoodsByCondition(condition, { limit: 80 }, graph).map((f) => f.id))
    // Prefer recommended; if empty, keep prior pool minus avoids (handled inside findFoodsByCondition)
    if (safe.size > 0) {
      const narrowed = pool.filter((food) => safe.has(food.id))
      if (narrowed.length >= 3) pool = narrowed
    }
  }

  const exclude = new Set(context.planning.excludeFoodIds)
  return pool.filter((food) => !exclude.has(food.id)).slice(0, limit)
}
