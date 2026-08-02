import type { CostTier, Food, MealType, Season } from '@/types/domain'

export { findSubstitutionCandidates } from '@/engines/recommendation/substitutions'
export type { SubstitutionSearchOptions } from '@/engines/recommendation/substitutions'

export interface RankedFood {
  food: Food
  score: number
  reasons: string[]
}

export interface RankOptions {
  mealType: MealType
  stateCode: string
  districtId?: string
  season: Season
  foodPreference: 'veg' | 'eggetarian' | 'nonveg' | 'vegan' | 'jain'
  targetCalories: number
  maxCostTier: CostTier
  pantryFoodIds: string[]
  preferRegional: boolean
  preferLowGi?: boolean
}

/**
 * Recommendation Engine — deterministic ranking.
 * AI may only add variety/explanations later; scores stay rule-based.
 */
export function rankFoodsForMeal(foods: Food[], options: RankOptions): RankedFood[] {
  return foods
    .filter((food) => food.mealTypes.includes(options.mealType))
    .filter((food) => food.costTier <= options.maxCostTier)
    .filter((food) => inSeason(food, options.season))
    .filter((food) => matchesPreference(food, options.foodPreference))
    .map((food) => scoreFood(food, options))
    .sort((a, b) => b.score - a.score)
}

function inSeason(food: Food, season: Season): boolean {
  return food.seasons.includes('all') || food.seasons.includes(season)
}

function matchesPreference(food: Food, preference: RankOptions['foodPreference']): boolean {
  switch (preference) {
    case 'vegan':
      return food.isVegan
    case 'jain':
      return food.isJain
    case 'veg':
      return food.isVeg
    case 'eggetarian':
      return food.isVeg || food.allergens.includes('egg') || food.id.includes('egg')
    case 'nonveg':
      return true
  }
}

function scoreFood(food: Food, options: RankOptions): RankedFood {
  const reasons: string[] = []
  let score = food.popularity

  if (options.preferRegional) {
    if (food.stateCodes.includes(options.stateCode)) {
      score += 25
      reasons.push('Regional match')
    }
    if (options.districtId && food.districtIds.includes(options.districtId)) {
      score += 10
      reasons.push('District favourite')
    }
    if (food.stateCodes.length === 0) {
      score += 8
      reasons.push('Pan-India staple')
    }
  }

  if (options.pantryFoodIds.includes(food.id)) {
    score += 20
    reasons.push('Uses pantry item')
  }

  const calorieDelta = Math.abs(food.nutrition.calories - options.targetCalories)
  const calorieScore = Math.max(0, 30 - calorieDelta / 20)
  score += calorieScore
  if (calorieDelta < 80) reasons.push('Fits meal calorie target')

  score += (6 - food.costTier) * 4
  if (food.costTier <= 2) reasons.push('Affordable')

  if (food.prepTimeMinutes <= 25) {
    score += 8
    reasons.push('Quick to prepare')
  }

  if (options.preferLowGi) {
    const gi = food.nutrition.glycemicIndex ?? 60
    if (gi <= 55) {
      score += 15
      reasons.push('Lower glycemic impact')
    } else if (gi >= 70) {
      score -= 12
    }
  }

  if (options.season !== 'all' && food.seasons.includes(options.season)) {
    score += 12
    reasons.push(`In season (${options.season})`)
  }

  return { food, score, reasons }
}
