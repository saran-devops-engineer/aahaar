import { analyzePlateBalance } from '@/engines/nutrition/plateBalance'
import { isCuisineCompatible } from '@/engines/knowledge/cuisineRegions'
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
  /** Soft-penalize these for weekly / regenerate variety. */
  recentFoodIds?: string[]
}

/**
 * Recommendation Engine — deterministic ranking with balance + variety.
 * AI may only add variety/explanations later; scores stay rule-based.
 */
export function rankFoodsForMeal(foods: Food[], options: RankOptions): RankedFood[] {
  return foods
    .filter((food) => food.mealTypes.includes(options.mealType))
    .filter((food) => food.costTier <= options.maxCostTier)
    .filter((food) => inSeason(food, options.season))
    .filter((food) => matchesPreference(food, options.foodPreference))
    .filter((food) => isCuisineCompatible(food, options.stateCode, options.mealType))
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
  // Cap popularity influence so a few staples cannot monopolize every plan.
  let score = Math.min(food.popularity, 88) * 0.55

  if (options.preferRegional) {
    if (food.stateCodes.includes(options.stateCode)) {
      score += 28
      reasons.push('Regional match')
    }
    if (options.districtId && food.districtIds.includes(options.districtId)) {
      score += 12
      reasons.push('District favourite')
    }
    if (food.stateCodes.length === 0) {
      // Pan-India is a fallback, not a peer of true regional dishes.
      score += 4
      reasons.push('Pan-India staple')
    } else if (!food.stateCodes.includes(options.stateCode)) {
      score -= 20
    }
  }

  if (options.pantryFoodIds.includes(food.id)) {
    score += 18
    reasons.push('Uses pantry item')
  }

  const calorieDelta = Math.abs(food.nutrition.calories - options.targetCalories)
  const calorieScore = Math.max(0, 28 - calorieDelta / 20)
  score += calorieScore
  if (calorieDelta < 80) reasons.push('Fits meal calorie target')

  score += (6 - food.costTier) * 3
  if (food.costTier <= 2) reasons.push('Affordable')

  if (food.prepTimeMinutes <= 25) {
    score += 6
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
    score += 10
    reasons.push(`In season (${options.season})`)
  }

  // Macro / micronutrient balance (engine facts only).
  const n = food.nutrition
  const proteinDensity = n.calories > 0 ? (n.proteinG * 4) / n.calories : 0
  if (proteinDensity >= 0.15) {
    score += 14
    reasons.push('Good protein share')
  } else if (proteinDensity < 0.1) {
    score -= 8
  }

  if (n.fiberG >= 7) {
    score += 12
    reasons.push('High fibre')
  } else if (n.fiberG >= 4) {
    score += 6
  } else if (n.fiberG < 3 && options.mealType !== 'snack') {
    score -= 6
  }

  const iron = n.ironMg ?? 0
  const calcium = n.calciumMg ?? 0
  const potassium = n.potassiumMg ?? 0
  if (iron >= 3 || calcium >= 150 || potassium >= 400) {
    score += 8
    reasons.push('Micronutrient-rich')
  }

  const plate = analyzePlateBalance(food, options.mealType)
  if (plate.isBalanced) {
    score += 18
    reasons.push('Balanced plate (carb + protein + veg)')
  } else if (options.mealType !== 'snack' && plate.missingCoreRoles.length > 0) {
    score -= 10 * plate.missingCoreRoles.length
  }

  if (options.recentFoodIds?.includes(food.id)) {
    score -= 35
    reasons.push('Already used recently')
  }

  return { food, score, reasons }
}

/** Stable pick among top candidates for variety without inventing foods. */
export function pickFromTopRanked(
  ranked: RankedFood[],
  mealType: MealType,
  seed: string,
  topN = 5,
): RankedFood | undefined {
  if (ranked.length === 0) return undefined
  const balanced = ranked.filter((r) => analyzePlateBalance(r.food, mealType).isBalanced)
  const poolSource = balanced.length >= 2 ? balanced : ranked
  const pool = poolSource.slice(0, Math.min(topN, poolSource.length))
  const index = stableIndex(seed, pool.length)
  return pool[index]
}

function stableIndex(seed: string, modulo: number): number {
  if (modulo <= 1) return 0
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % modulo
}
