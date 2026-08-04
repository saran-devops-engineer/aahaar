import {
  CUISINE_EVENT_SCALE,
  EVENT_DELTAS,
  INGREDIENT_EVENT_SCALE,
  REMINDER_FREQUENCY_MIN,
  REMINDER_FREQUENCY_STEP,
} from '@/engines/learning/constants'
import { computeConfidence } from '@/engines/learning/analytics/confidence'
import {
  computeConsistencyScore,
  computeDiversityScore,
} from '@/engines/learning/analytics/diversity'
import {
  appendFeedbackHistory,
  pushRecentFood,
} from '@/engines/learning/history/feedback'
import { upsertAffinity } from '@/engines/learning/models/affinity'
import {
  timingFromEvent,
  updateMealTiming,
} from '@/engines/learning/profiles/mealTiming'
import { applyDecayToProfile } from '@/engines/learning/scores/decay'
import type { LearningEvent, LearningProfile } from '@/engines/learning/types'

/**
 * Pure event application. Never mutates medical/nutrition rules.
 */
export function applyLearningEvent(
  profile: LearningProfile,
  event: LearningEvent,
): LearningProfile {
  if (profile.userId === '') {
    throw new Error('LearningProfile.userId is required')
  }

  let next = applyDecayToProfile(profile, event.timestamp)
  const delta = EVENT_DELTAS[event.type] ?? 0

  let foodAffinity = { ...next.foodAffinity }
  let cuisineAffinity = { ...next.cuisineAffinity }
  let ingredientAffinity = { ...next.ingredientAffinity }
  let reminderFrequency = next.reminderFrequency
  let shoppingConfidence = next.shoppingConfidence
  let recentFoodIds = next.recentFoodIds

  if (event.foodId && delta !== 0) {
    foodAffinity = upsertAffinity(foodAffinity, event.foodId, delta, event.timestamp)
  }

  if (event.cuisine && delta !== 0) {
    cuisineAffinity = upsertAffinity(
      cuisineAffinity,
      event.cuisine,
      delta * CUISINE_EVENT_SCALE,
      event.timestamp,
    )
  }

  if (event.ingredients && delta !== 0) {
    for (const ingredient of event.ingredients) {
      ingredientAffinity = upsertAffinity(
        ingredientAffinity,
        ingredient,
        delta * INGREDIENT_EVENT_SCALE,
        event.timestamp,
      )
    }
  }

  // Swap: slight boost for replacement target if provided
  if (event.type === 'meal_swapped' && event.replacedFoodId) {
    foodAffinity = upsertAffinity(
      foodAffinity,
      event.replacedFoodId,
      EVENT_DELTAS.meal_accepted * 0.5,
      event.timestamp,
    )
  }

  if (event.type === 'reminder_ignored') {
    reminderFrequency = Math.max(
      REMINDER_FREQUENCY_MIN,
      round1(reminderFrequency - REMINDER_FREQUENCY_STEP),
    )
  }
  if (event.type === 'reminder_opened') {
    reminderFrequency = Math.min(1, round1(reminderFrequency + REMINDER_FREQUENCY_STEP / 2))
  }
  if (event.type === 'shopping_completed') {
    shoppingConfidence = Math.min(100, shoppingConfidence + 6)
  }
  if (event.type === 'water_completed') {
    shoppingConfidence = Math.min(100, shoppingConfidence + 1)
  }

  if (
    event.foodId &&
    (event.type === 'meal_accepted' ||
      event.type === 'meal_completed' ||
      event.type === 'meal_prepared' ||
      event.type === 'meal_repeated' ||
      event.type === 'meal_liked')
  ) {
    recentFoodIds = pushRecentFood(next, event.foodId)
  }

  const { hour, minute } = timingFromEvent(event)
  const mealTiming = updateMealTiming(next.mealTiming, event.mealType, hour, minute)

  const draft: LearningProfile = {
    ...next,
    updatedAt: event.timestamp,
    eventCount: next.eventCount + 1,
    foodAffinity: Object.freeze(foodAffinity),
    cuisineAffinity: Object.freeze(cuisineAffinity),
    ingredientAffinity: Object.freeze(ingredientAffinity),
    mealTiming,
    recentFoodIds,
    feedbackHistory: appendFeedbackHistory(next, event),
    reminderFrequency,
    shoppingConfidence,
    diversityScore: 50,
    consistencyScore: 50,
    confidence: 'low',
    confidenceScore: 0,
  }

  const diversityScore = computeDiversityScore(draft)
  const consistencyScore = computeConsistencyScore(draft)
  const { level, score } = computeConfidence({
    ...draft,
    diversityScore,
    consistencyScore,
  })

  return Object.freeze({
    ...draft,
    diversityScore,
    consistencyScore,
    confidence: level,
    confidenceScore: score,
  })
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
