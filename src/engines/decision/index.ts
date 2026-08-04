import {
  selectAllergens,
  selectAvailableMeals,
  selectBudgetTier,
  selectConditions,
  selectDistrictId,
  selectExcludeFoodIds,
  selectFoodPreference,
  selectNutritionTargets,
  selectPantryFoodIds,
  selectPreferLowGi,
  selectReligiousRestrictions,
  selectSeason,
  selectStateCode,
  selectVarietySeed,
} from '@/engines/context'
import type { UserContext } from '@/engines/context'
import { filterByBudget, filterByRegion, filterBySeason } from '@/engines/knowledge'
import { pickFromTopRanked, rankFoodsForMeal } from '@/engines/recommendation'
import { filterFoodsByConstraints } from '@/engines/rules'
import type { DecisionResult, Food, MealType } from '@/types/domain'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner']

/**
 * Decision Engine — single entry point for recommendations.
 * Consumes immutable UserContext only — never fetches profile/preferences/storage.
 * AI Adapter is never consulted for nutrition values.
 */
export function decide(context: UserContext, foods: Food[]): DecisionResult {
  const targets = selectNutritionTargets(context)
  const season = selectSeason(context)
  const stateCode = selectStateCode(context)
  const districtId = selectDistrictId(context)
  const budgetTier = selectBudgetTier(context)
  const conditions = selectConditions(context)
  const foodPreference = selectFoodPreference(context)
  const allergens = [...selectAllergens(context)]
  const religiousRestrictions = [...selectReligiousRestrictions(context)]
  const pantryFoodIds = [...selectPantryFoodIds(context)]
  const excludeFoodIds = [...selectExcludeFoodIds(context)]
  const availableMeals = selectAvailableMeals(context)
  const varietySeed = selectVarietySeed(context)
  const preferLowGi = selectPreferLowGi(context)

  const seasonal = filterBySeason(foods, season)
  const regional = filterByRegion(seasonal, stateCode, districtId)
  const affordable = filterByBudget(regional, budgetTier)
  const nationalAffordable = filterByBudget(filterBySeason(foods, season), budgetTier)

  const { allowed, limited, blocked, evaluations } = filterFoodsByConstraints(
    affordable,
    {
      conditions: [...conditions],
      foodPreference,
      allergens,
      religiousRestrictions,
    },
  )

  const nationalFiltered = filterFoodsByConstraints(nationalAffordable, {
    conditions: [...conditions],
    foodPreference,
    allergens,
    religiousRestrictions,
  })

  const basePool = allowed.length > 0 ? allowed : limited
  const nationalPool =
    nationalFiltered.allowed.length > 0
      ? nationalFiltered.allowed
      : nationalFiltered.limited
  const excluded = new Set(excludeFoodIds)
  const appliedRuleIds = [...new Set(evaluations.map((e) => e.ruleId))]
  const sources: string[] = [
    'context-engine',
    'knowledge-base',
    'nutrition-engine',
    'rule-engine',
    'recommendation-engine',
  ]

  const usedFoodIds = new Set<string>()
  const meals: DecisionResult['meals'] = []

  for (const mealType of MEAL_ORDER) {
    if (availableMeals[mealType] === false) continue

    let pool = widenPoolForMeal(basePool, nationalPool, mealType, excluded)
    const fresh = pool.filter((food) => !excluded.has(food.id) && !usedFoodIds.has(food.id))
    pool = fresh.length > 0 ? fresh : pool.filter((food) => !usedFoodIds.has(food.id))

    const ranked = rankFoodsForMeal(pool, {
      mealType,
      stateCode,
      districtId,
      season,
      foodPreference,
      targetCalories: targets.mealSplit[mealType],
      maxCostTier: budgetTier,
      pantryFoodIds,
      preferRegional: true,
      preferLowGi,
      recentFoodIds: excludeFoodIds,
    })

    const pick = pickFromTopRanked(
      ranked,
      mealType,
      `${varietySeed}:${context.date}:${mealType}`,
      5,
    )
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
    candidateFoodCount: basePool.length,
  }
}

function widenPoolForMeal(
  regionalPool: Food[],
  nationalPool: Food[],
  mealType: MealType,
  excluded: Set<string>,
): Food[] {
  const regionalForMeal = regionalPool.filter(
    (food) => food.mealTypes.includes(mealType) && !excluded.has(food.id),
  )
  if (regionalForMeal.length >= 6) return regionalPool

  const byId = new Map<string, Food>()
  for (const food of regionalPool) byId.set(food.id, food)
  for (const food of nationalPool) {
    if (food.mealTypes.includes(mealType)) byId.set(food.id, food)
  }
  return [...byId.values()]
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
