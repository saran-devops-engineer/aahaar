import {
  AFFINITY_MAX,
  AFFINITY_MIN,
  AFFINITY_NEUTRAL,
  LEARNING_VERSION,
} from '@/engines/learning/constants'
import type {
  AffinityEntry,
  LearningProfile,
  MealTimingStats,
} from '@/engines/learning/types'

export function createEmptyLearningProfile(userId: string, now: string): LearningProfile {
  const emptyTiming: MealTimingStats = Object.freeze({
    samples: Object.freeze({}),
  })

  return Object.freeze({
    version: LEARNING_VERSION,
    userId,
    createdAt: now,
    updatedAt: now,
    foodAffinity: Object.freeze({}),
    cuisineAffinity: Object.freeze({}),
    ingredientAffinity: Object.freeze({}),
    mealTiming: emptyTiming,
    diversityScore: 50,
    consistencyScore: 50,
    confidence: 'low',
    confidenceScore: 0,
    eventCount: 0,
    recentFoodIds: Object.freeze([]),
    feedbackHistory: Object.freeze([]),
    reminderFrequency: 1,
    shoppingConfidence: 50,
    preferenceSignals: Object.freeze({
      spicyBias: 0,
      complexityBias: 0,
      prepTimeBiasMinutes: 0,
      budgetBias: 0,
    }),
  })
}

export function clampAffinity(score: number): number {
  return Math.max(AFFINITY_MIN, Math.min(AFFINITY_MAX, Math.round(score)))
}

export function upsertAffinity(
  map: Readonly<Record<string, AffinityEntry>>,
  id: string,
  delta: number,
  now: string,
): Record<string, AffinityEntry> {
  const prev = map[id]
  const base = prev?.score ?? AFFINITY_NEUTRAL
  const samples = (prev?.samples ?? 0) + 1
  const score = clampAffinity(base + delta / Math.sqrt(samples))
  return {
    ...map,
    [id]: Object.freeze({
      id,
      score,
      samples,
      updatedAt: now,
    }),
  }
}

export function getAffinityScore(
  map: Readonly<Record<string, AffinityEntry>>,
  id: string,
): number {
  return map[id]?.score ?? AFFINITY_NEUTRAL
}
