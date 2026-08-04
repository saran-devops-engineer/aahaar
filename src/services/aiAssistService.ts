import { getAiAdapter, getAiMode, setAiMode, type AiMode } from '@/ai/adapter'
import type { SubstitutionOption } from '@/ai/types'
import { currentSeason, getAllFoods, getFoodById } from '@/engines/knowledge'
import { calculateNutritionTargets } from '@/engines/nutrition'
import { analyzePlateBalance } from '@/engines/nutrition/plateBalance'
import { findSubstitutionCandidates } from '@/engines/recommendation'
import { filterFoodsByConstraints } from '@/engines/rules'
import { PREFERENCE_KEYS } from '@/config/profileOptions'
import { db } from '@/database/db'
import { getConditionIdsForUser } from '@/services/conditionService'
import {
  getBudgetTier,
  getPreferencesForUser,
  parsePreferenceList,
  setPreference,
} from '@/services/preferenceService'
import type { Meal, MealType, Profile } from '@/types/domain'

export async function loadAiMode(userId: string): Promise<AiMode> {
  const prefs = await getPreferencesForUser(userId)
  const mode = prefs[PREFERENCE_KEYS.aiMode] === 'off' ? 'off' : 'local'
  setAiMode(mode)
  return mode
}

export async function saveAiMode(userId: string, mode: AiMode): Promise<void> {
  await setPreference(userId, PREFERENCE_KEYS.aiMode, mode)
  setAiMode(mode)
}

export async function explainMeal(
  profile: Profile,
  meal: Meal,
): Promise<string> {
  await loadAiMode(profile.userId)
  const food = await getFoodById(meal.foodId)
  if (!food) return 'Meal details unavailable.'

  const conditions = await getConditionIdsForUser(profile.userId)
  const reasons = extractReasons(meal.explanation)
  const ruleNotes = extractRuleNotes(meal.explanation)
  const plate = analyzePlateBalance(food, meal.mealType as MealType)

  return getAiAdapter().explainRecommendation({
    foodName: food.name,
    mealType: meal.mealType,
    servings: meal.servings,
    calories: food.nutrition.calories,
    reasons,
    ruleNotes,
    conditions,
    regionStateCode: profile.stateCode,
    season: currentSeason(),
    platePartSummaries: plate.partSummaries,
    balanceVerdict: plate.balanceVerdict,
    gapRecommendations: plate.gapRecommendations,
  })
}

export async function getMotivation(
  profile: Profile,
  plannedMealCount: number,
  waterProgressPct: number,
): Promise<string> {
  await loadAiMode(profile.userId)
  const conditions = await getConditionIdsForUser(profile.userId)
  return getAiAdapter().motivate({
    goal: profile.goal,
    foodPreference: profile.foodPreference,
    conditions,
    plannedMealCount,
    waterProgressPct,
  })
}

export async function getMealSubstitutions(
  profile: Profile,
  meal: Meal,
): Promise<SubstitutionOption[]> {
  await loadAiMode(profile.userId)
  const food = await getFoodById(meal.foodId)
  if (!food) return []

  const conditions = await getConditionIdsForUser(profile.userId)
  const preferences = await getPreferencesForUser(profile.userId)
  const budgetTier = await getBudgetTier(profile.userId)
  const targets = calculateNutritionTargets(profile, conditions)
  const foods = await getAllFoods()

  const { allowed, limited } = filterFoodsByConstraints(foods, {
    conditions,
    foodPreference: profile.foodPreference,
    allergens: parsePreferenceList(preferences.allergens),
    religiousRestrictions: parsePreferenceList(preferences.religious),
  })

  const safePool = allowed.length > 0 ? allowed : limited
  const preferLowGi =
    conditions.includes('diabetes') || conditions.includes('pcos')

  const candidates = findSubstitutionCandidates(safePool, {
    currentFoodId: meal.foodId,
    mealType: meal.mealType,
    stateCode: profile.stateCode,
    districtId: profile.districtId,
    season: currentSeason(),
    foodPreference: profile.foodPreference,
    targetCalories: targets.mealSplit[meal.mealType],
    maxCostTier: budgetTier,
    pantryFoodIds: parsePreferenceList(preferences.pantry),
    preferRegional: true,
    preferLowGi,
    calorieTolerance: 140,
    limit: 8,
  })

  const ranked = await getAiAdapter().rankSubstitutions({
    current: {
      foodId: food.id,
      foodName: food.name,
      mealType: meal.mealType,
      calories: food.nutrition.calories,
    },
    candidates: candidates.map((c) => ({
      foodId: c.food.id,
      foodName: c.food.name,
      calories: c.food.nutrition.calories,
      score: c.score,
      reasons: c.reasons,
    })),
    conditions,
    constraints: [
      ...conditions,
      profile.foodPreference,
      ...parsePreferenceList(preferences.allergens),
    ],
  })

  const byId = new Map(candidates.map((c) => [c.food.id, c]))
  return ranked
    .map((suggestion) => {
      const rankedFood = byId.get(suggestion.foodId)
      if (!rankedFood) return null
      return {
        food: rankedFood.food,
        score: rankedFood.score,
        reasons: rankedFood.reasons,
        blurb: suggestion.blurb,
      }
    })
    .filter((item): item is SubstitutionOption => Boolean(item))
}

export async function applyMealSubstitution(
  mealId: string,
  nextFoodId: string,
  explanation: string,
): Promise<Meal> {
  const meal = await db.meals.get(mealId)
  if (!meal) throw new Error('Meal not found')

  const food = await getFoodById(nextFoodId)
  if (!food) throw new Error('Substitute food not found')
  if (!food.mealTypes.includes(meal.mealType as MealType)) {
    throw new Error('Substitute is not valid for this meal type')
  }

  const updated: Meal = {
    ...meal,
    foodId: nextFoodId,
    explanation,
    servings: meal.servings,
  }
  await db.meals.put(updated)
  return updated
}

export function getActiveAiMode(): AiMode {
  return getAiMode()
}

function extractReasons(explanation?: string): string[] {
  if (!explanation) return []
  const main = explanation.split(' — ')[0] ?? explanation
  const afterColon = main.includes(':') ? main.split(':').slice(1).join(':') : main
  return afterColon
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean)
}

function extractRuleNotes(explanation?: string): string[] {
  if (!explanation) return []
  const rulePart = explanation
    .split(' — ')
    .find((part) => part.toLowerCase().startsWith('rules:'))
  if (!rulePart) return []
  return [rulePart.replace(/^rules:\s*/i, '').trim()]
}
