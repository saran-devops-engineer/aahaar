import type { Food } from '@/types/domain'
import type { ScoredFoodRef } from '@/engines/knowledge/graph/types'
import {
  inferCuisines,
  inferCookingMethods,
  proteinFamily,
  stapleBelt,
} from '@/engines/knowledge/graph/builders/inferTraits'

/**
 * Deterministic similarity in [0, 100]. No AI.
 */
export function similarityScore(a: Food, b: Food): { score: number; reasons: string[] } {
  if (a.id === b.id) return { score: 100, reasons: ['Same food'] }

  let score = 0
  const reasons: string[] = []

  const sharedMeals = a.mealTypes.filter((m) => b.mealTypes.includes(m))
  if (sharedMeals.length > 0) {
    score += Math.min(22, sharedMeals.length * 10)
    reasons.push(`Shared meal type (${sharedMeals.join(', ')})`)
  }

  const cuisinesA = new Set(inferCuisines(a))
  const sharedCuisine = inferCuisines(b).filter((c) => cuisinesA.has(c))
  if (sharedCuisine.length > 0) {
    score += Math.min(18, sharedCuisine.length * 8)
    reasons.push(`Shared cuisine (${sharedCuisine[0]})`)
  }

  const sharedStates = a.stateCodes.filter((s) => b.stateCodes.includes(s))
  if (sharedStates.length > 0) {
    score += Math.min(12, sharedStates.length * 4)
    reasons.push('Shared region')
  } else if (a.stateCodes.length === 0 || b.stateCodes.length === 0) {
    score += 4
  }

  const sharedSeasons = a.seasons.filter((s) => b.seasons.includes(s))
  if (sharedSeasons.length > 0) {
    score += 6
    reasons.push('Season overlap')
  }

  const calorieDelta = Math.abs(a.nutrition.calories - b.nutrition.calories)
  const proteinDelta = Math.abs(a.nutrition.proteinG - b.nutrition.proteinG)
  const fiberDelta = Math.abs(a.nutrition.fiberG - b.nutrition.fiberG)
  const nutritionScore =
    Math.max(0, 12 - calorieDelta / 40) +
    Math.max(0, 8 - proteinDelta) +
    Math.max(0, 5 - fiberDelta)
  score += nutritionScore
  if (nutritionScore >= 12) reasons.push('Similar macros')

  const medScore = medicalOverlapScore(a, b)
  score += medScore
  if (medScore >= 8) reasons.push('Similar medical suitability')

  const costDelta = Math.abs(a.costTier - b.costTier)
  score += Math.max(0, 8 - costDelta * 3)
  if (costDelta === 0) reasons.push('Same budget tier')

  const prepDelta = Math.abs(a.prepTimeMinutes - b.prepTimeMinutes)
  score += Math.max(0, 6 - prepDelta / 15)

  if (proteinFamily(a) === proteinFamily(b)) {
    score += 8
    reasons.push(`Same protein family (${proteinFamily(a)})`)
  }

  if (stapleBelt(a) === stapleBelt(b) && stapleBelt(a) !== 'mixed') {
    score += 6
    reasons.push(`Same staple belt (${stapleBelt(a)})`)
  }

  const methodsA = new Set(inferCookingMethods(a))
  if (inferCookingMethods(b).some((m) => methodsA.has(m))) {
    score += 5
    reasons.push('Similar preparation')
  }

  if (a.isVeg === b.isVeg) score += 3
  if (a.isVegan && b.isVegan) score += 2

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons }
}

export function rankSimilarFoods(
  food: Food,
  catalog: readonly Food[],
  limit: number,
): ScoredFoodRef[] {
  return catalog
    .filter((candidate) => candidate.id !== food.id)
    .map((candidate) => {
      const { score, reasons } = similarityScore(food, candidate)
      return { foodId: candidate.id, score, reasons }
    })
    .filter((row) => row.score >= 35)
    .sort((a, b) => b.score - a.score || a.foodId.localeCompare(b.foodId))
    .slice(0, limit)
}

function medicalOverlapScore(a: Food, b: Food): number {
  const keys = new Set([
    ...Object.keys(a.medicalSuitability),
    ...Object.keys(b.medicalSuitability),
  ])
  if (keys.size === 0) return 4
  let agree = 0
  let compared = 0
  for (const key of keys) {
    const av = a.medicalSuitability[key as keyof typeof a.medicalSuitability]
    const bv = b.medicalSuitability[key as keyof typeof b.medicalSuitability]
    if (!av || !bv) continue
    compared += 1
    if (av === bv) agree += 1
    if (av === 'avoid' && bv === 'suitable') agree -= 1
  }
  if (compared === 0) return 4
  return Math.round((agree / compared) * 14)
}
