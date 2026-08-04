import {
  ADJUSTMENT_CAP_HIGH,
  ADJUSTMENT_CAP_LOW,
  ADJUSTMENT_CAP_MEDIUM,
  AFFINITY_NEUTRAL,
  CONFIDENCE_LOW_MAX,
} from '@/engines/learning/constants'
import { diversityPenalty } from '@/engines/learning/analytics/diversity'
import { getAffinityScore } from '@/engines/learning/models/affinity'
import type {
  LearningProfile,
  RecommendationAdjustment,
} from '@/engines/learning/types'

/**
 * Cold start: no aggressive learning influence until enough events.
 * Never encodes medical/nutrition overrides — only priority deltas.
 */
export function getRecommendationAdjustment(
  profile: LearningProfile,
  foodId: string,
  options?: {
    cuisine?: string
    ingredients?: readonly string[]
  },
): RecommendationAdjustment {
  const divPenalty = diversityPenalty(profile, foodId)

  if (isColdStart(profile)) {
    const scoreDelta = divPenalty > 0 ? -divPenalty : 0
    return Object.freeze({
      foodId,
      scoreDelta,
      reasons: Object.freeze(
        divPenalty > 0
          ? [`Diversity penalty (−${divPenalty})`, 'Cold start — affinity inactive']
          : ['Cold start — no learning adjustment'],
      ),
      confidence: profile.confidence,
      diversityPenalty: divPenalty,
    })
  }

  const foodScore = getAffinityScore(profile.foodAffinity, foodId)
  let delta = (foodScore - AFFINITY_NEUTRAL) / 5
  const reasons: string[] = []

  if (foodScore >= 65) reasons.push(`High food affinity (${foodScore})`)
  if (foodScore <= 35) reasons.push(`Low food affinity (${foodScore})`)

  if (options?.cuisine) {
    const cuisineScore = getAffinityScore(profile.cuisineAffinity, options.cuisine)
    delta += (cuisineScore - AFFINITY_NEUTRAL) / 8
    if (cuisineScore >= 70) reasons.push(`Prefers ${options.cuisine}`)
  }

  if (options?.ingredients) {
    let ingredientBias = 0
    for (const ingredient of options.ingredients) {
      const score = getAffinityScore(profile.ingredientAffinity, ingredient)
      ingredientBias += (score - AFFINITY_NEUTRAL) / 12
    }
    if (options.ingredients.length > 0) {
      delta += ingredientBias / options.ingredients.length
    }
  }

  if (divPenalty > 0) {
    reasons.push(`Diversity penalty (−${divPenalty})`)
  }

  const cap = adjustmentCap(profile)
  const confidenceScale =
    profile.confidence === 'high' ? 1 : profile.confidence === 'medium' ? 0.65 : 0.35
  const scoreDelta = clamp(
    Math.round(delta * confidenceScale) - divPenalty,
    -cap,
    cap,
  )

  if (scoreDelta === 0 && reasons.length === 0) {
    reasons.push('Neutral learning signal')
  }

  return Object.freeze({
    foodId,
    scoreDelta,
    reasons: Object.freeze(reasons),
    confidence: profile.confidence,
    diversityPenalty: divPenalty,
  })
}

export function isColdStart(profile: LearningProfile): boolean {
  return profile.eventCount <= CONFIDENCE_LOW_MAX && profile.confidence === 'low'
}

function adjustmentCap(profile: LearningProfile): number {
  if (profile.confidence === 'high') return ADJUSTMENT_CAP_HIGH
  if (profile.confidence === 'medium') return ADJUSTMENT_CAP_MEDIUM
  return ADJUSTMENT_CAP_LOW
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Build a map of foodId → scoreDelta for ranking integration. */
export function buildAdjustmentMap(
  profile: LearningProfile,
  foodIds: readonly string[],
  resolveMeta?: (foodId: string) => { cuisine?: string; ingredients?: readonly string[] },
): ReadonlyMap<string, number> {
  const map = new Map<string, number>()
  for (const foodId of foodIds) {
    const meta = resolveMeta?.(foodId)
    const adjustment = getRecommendationAdjustment(profile, foodId, meta)
    if (adjustment.scoreDelta !== 0) map.set(foodId, adjustment.scoreDelta)
  }
  return map
}
