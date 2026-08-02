import { filterByBudget, filterByRegion, filterBySeason } from '@/engines/knowledge'
import { calculateNutritionTargets } from '@/engines/nutrition'
import { rankFoodsForMeal } from '@/engines/recommendation'
import { filterFoodsByConstraints } from '@/engines/rules'
import type {
  DecisionContext,
  DecisionResult,
  Food,
  MealType,
} from '@/types/domain'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

/**
 * Decision Engine — single entry point for recommendations.
 * Flow: Knowledge filters → Nutrition → Rules → Recommendation → explainable result.
 * AI Adapter is never consulted for nutrition values.
 */
export function decide(
  context: DecisionContext,
  foods: Food[],
): DecisionResult {
  const targets = calculateNutritionTargets(context.profile, context.conditions)

  const seasonal = filterBySeason(foods, context.season)
  const regional = filterByRegion(
    seasonal,
    context.regionStateCode,
    context.districtId,
  )
  const affordable = filterByBudget(regional, context.budgetTier)

  const allergens = parseList(context.preferences.allergens)
  const religiousRestrictions = parseList(context.preferences.religious)

  const { allowed, limited, blocked, evaluations } = filterFoodsByConstraints(
    affordable,
    {
      conditions: context.conditions,
      foodPreference: context.profile.foodPreference,
      allergens,
      religiousRestrictions,
    },
  )

  // Prefer fully allowed foods; fall back to limited when necessary.
  const basePool = allowed.length > 0 ? allowed : limited
  const excluded = new Set(context.excludeFoodIds ?? [])
  const freshPool = basePool.filter((food) => !excluded.has(food.id))
  const candidatePool = freshPool.length > 0 ? freshPool : basePool
  const appliedRuleIds = [...new Set(evaluations.map((e) => e.ruleId))]
  const sources: string[] = [
    'knowledge-base',
    'nutrition-engine',
    'rule-engine',
    'recommendation-engine',
  ]

  const preferLowGi =
    context.conditions.includes('diabetes') || context.conditions.includes('pcos')

  const usedFoodIds = new Set<string>()
  const meals: DecisionResult['meals'] = []

  for (const mealType of MEAL_ORDER) {
    if (context.schedule[mealType] === false) continue

    const ranked = rankFoodsForMeal(candidatePool, {
      mealType,
      stateCode: context.regionStateCode,
      districtId: context.districtId,
      season: context.season,
      foodPreference: context.profile.foodPreference,
      targetCalories: targets.mealSplit[mealType],
      maxCostTier: context.budgetTier,
      pantryFoodIds: context.pantryFoodIds,
      preferRegional: true,
      preferLowGi,
    }).filter((r) => !usedFoodIds.has(r.food.id))

    const pick = ranked[0]
    if (!pick) continue

    usedFoodIds.add(pick.food.id)
    const servings = estimateServings(
      pick.food.nutrition.calories,
      targets.mealSplit[mealType],
    )

    const ruleNotes = evaluations
      .filter((e) => e.foodId === pick.food.id && e.verdict !== 'allow')
      .map((e) => e.reason)

    meals.push({
      mealType,
      foodId: pick.food.id,
      servings,
      score: Math.round(pick.score),
      ruleNotes,
      explanation: buildExplanation(
        pick.food.name,
        mealType,
        pick.reasons,
        ruleNotes,
        targets.adjustmentNotes,
      ),
    })
  }

  return {
    meals,
    targets,
    appliedRuleIds,
    sources,
    blockedFoodCount: blocked.length,
    candidateFoodCount: candidatePool.length,
  }
}

function estimateServings(foodCalories: number, targetCalories: number): number {
  if (foodCalories <= 0) return 1
  const raw = targetCalories / foodCalories
  return Math.max(0.5, Math.round(raw * 2) / 2)
}

function buildExplanation(
  foodName: string,
  mealType: MealType,
  reasons: string[],
  ruleNotes: string[],
  adjustmentNotes: string[],
): string {
  const why = reasons.length > 0 ? reasons.join(' · ') : 'Balanced everyday choice'
  const parts = [`${foodName} for ${mealType}: ${why}`]
  if (ruleNotes.length > 0) {
    parts.push(`Rules: ${ruleNotes.slice(0, 2).join('; ')}`)
  }
  if (adjustmentNotes.length > 0 && mealType === 'breakfast') {
    parts.push(adjustmentNotes[0]!)
  }
  return parts.join(' — ')
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}
