import type { Food, MealType } from '@/types/domain'

/** States where rice (not wheat roti) is the default lunch/dinner staple. */
export const RICE_BELT_STATES = new Set([
  'AP',
  'TS',
  'TN',
  'KA',
  'KL',
  'OD',
  'WB',
  'AS',
])

/** States where wheat roti / paratha is a common main-meal staple. */
export const WHEAT_BELT_STATES = [
  'PB',
  'HR',
  'DL',
  'UP',
  'UK',
  'HP',
  'RJ',
  'MP',
  'JH',
  'BR',
] as const

const WHEAT_MEAL_PATTERN =
  /\b(roti|paratha|phulka|thepla|kulche|kulcha|naan|bhakri|thalipeeth)\b/i

/**
 * Detect wheat-flatbread centred meals that should not be default lunch/dinner
 * in rice-belt states such as Andhra Pradesh.
 */
export function isWheatRotiMeal(food: Food): boolean {
  return WHEAT_MEAL_PATTERN.test(`${food.id} ${food.name}`)
}

/**
 * Regional cuisine gate used by ranking.
 * Rice-belt lunch/dinner must not receive North-style roti plates unless the
 * dish is explicitly tagged for that state (e.g. Akki Roti in Karnataka breakfast).
 */
export function isCuisineCompatible(
  food: Food,
  stateCode: string,
  mealType: MealType,
): boolean {
  if (!isWheatRotiMeal(food)) return true

  const explicitlyRegional = food.stateCodes.includes(stateCode)

  if (mealType === 'lunch' || mealType === 'dinner') {
    if (RICE_BELT_STATES.has(stateCode) && !explicitlyRegional) return false
  }

  if (mealType === 'breakfast' && RICE_BELT_STATES.has(stateCode)) {
    // Keep north parathas out of coastal Andhra breakfasts unless tagged.
    if (!explicitlyRegional && food.stateCodes.length > 0) return false
    if (!explicitlyRegional && food.stateCodes.length === 0) return false
  }

  return true
}
