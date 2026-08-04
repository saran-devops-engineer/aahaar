import type { Food } from '@/types/domain'
import type { ScoredFoodRef } from '@/engines/knowledge/graph/types'
import {
  inferCuisines,
  proteinFamily,
  stapleBelt,
} from '@/engines/knowledge/graph/builders/inferTraits'

/**
 * Deterministic replacement ranking.
 * Prefers protein/calorie continuity, medical safety, budget, cuisine, region.
 */
export function replacementScore(
  current: Food,
  candidate: Food,
): { score: number; reasons: string[] } {
  if (current.id === candidate.id) return { score: 0, reasons: [] }

  let score = 0
  const reasons: string[] = []

  const proteinDelta = Math.abs(current.nutrition.proteinG - candidate.nutrition.proteinG)
  const proteinPts = Math.max(0, 28 - proteinDelta * 2)
  score += proteinPts
  if (proteinPts >= 18) reasons.push('Similar protein')

  const calorieDelta = Math.abs(current.nutrition.calories - candidate.nutrition.calories)
  const caloriePts = Math.max(0, 22 - calorieDelta / 25)
  score += caloriePts
  if (caloriePts >= 14) reasons.push('Similar energy')

  if (proteinFamily(current) === proteinFamily(candidate)) {
    score += 16
    reasons.push('Same protein family')
  } else if (isCompatibleProteinSwap(current, candidate)) {
    score += 10
    reasons.push('Compatible protein swap')
  }

  const medicalPts = medicalSafetyScore(current, candidate)
  score += medicalPts
  if (medicalPts >= 10) reasons.push('Medically compatible')

  const costDelta = Math.abs(current.costTier - candidate.costTier)
  score += Math.max(0, 10 - costDelta * 3)
  if (costDelta === 0) reasons.push('Same budget tier')

  const cuisines = new Set(inferCuisines(current))
  if (inferCuisines(candidate).some((c) => cuisines.has(c))) {
    score += 10
    reasons.push('Cuisine fit')
  }

  const sharedStates = current.stateCodes.filter((s) => candidate.stateCodes.includes(s))
  if (sharedStates.length > 0 || current.stateCodes.length === 0 || candidate.stateCodes.length === 0) {
    score += 8
    reasons.push('Region fit')
  }

  if (stapleBelt(current) === stapleBelt(candidate)) {
    score += 6
  }

  const sharedMeals = current.mealTypes.filter((m) => candidate.mealTypes.includes(m))
  if (sharedMeals.length > 0) {
    score += 8
    reasons.push('Same meal slot')
  } else {
    score -= 12
  }

  // Diet direction: do not suggest non-veg as replacement for vegan/jain items in graph defaults.
  if (current.isVegan && !candidate.isVegan) score -= 40
  if (current.isJain && !candidate.isJain) score -= 20
  if (current.isVeg && !candidate.isVeg) score -= 45

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons }
}

export function rankReplacementFoods(
  food: Food,
  catalog: readonly Food[],
  limit: number,
): ScoredFoodRef[] {
  return catalog
    .filter((candidate) => candidate.id !== food.id)
    .map((candidate) => {
      const { score, reasons } = replacementScore(food, candidate)
      return { foodId: candidate.id, score, reasons }
    })
    .filter((row) => row.score >= 40)
    .sort((a, b) => b.score - a.score || a.foodId.localeCompare(b.foodId))
    .slice(0, limit)
}

function isCompatibleProteinSwap(current: Food, candidate: Food): boolean {
  const a = proteinFamily(current)
  const b = proteinFamily(candidate)
  const animal = new Set(['poultry', 'fish', 'egg'])
  const vegProtein = new Set(['paneer', 'soy', 'legume', 'dairy', 'high-protein'])
  if (animal.has(a) && animal.has(b)) return true
  if (vegProtein.has(a) && vegProtein.has(b)) return true
  if (a === 'poultry' && b === 'egg') return true
  if (a === 'egg' && (b === 'paneer' || b === 'soy')) return true
  if (a === 'paneer' && (b === 'soy' || b === 'legume')) return true
  return false
}

function medicalSafetyScore(current: Food, candidate: Food): number {
  let score = 12
  for (const [condition, verdict] of Object.entries(current.medicalSuitability)) {
    const other =
      candidate.medicalSuitability[
        condition as keyof typeof candidate.medicalSuitability
      ]
    if (verdict === 'suitable' && other === 'avoid') score -= 12
    if (verdict === 'avoid' && other === 'suitable') score += 4
    if (verdict === 'limit' && other === 'avoid') score -= 6
  }
  return Math.max(0, score)
}
