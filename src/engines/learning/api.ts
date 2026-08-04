import { inferCuisines } from '@/engines/knowledge/graph/builders/inferTraits'
import { inferIngredients } from '@/engines/knowledge/graph/builders/inferIngredients'
import { applyLearningEvent } from '@/engines/learning/events/applyEvent'
import { getAffinityScore } from '@/engines/learning/models/affinity'
import { createEmptyLearningProfile } from '@/engines/learning/models/affinity'
import {
  exportLearningProfile,
  importLearningProfile,
  serializeLearningProfile,
  deserializeLearningProfile,
} from '@/engines/learning/profiles/exportImport'
import {
  loadLearningProfile,
  saveLearningProfile,
} from '@/engines/learning/profiles/persist'
import {
  buildAdjustmentMap,
  getRecommendationAdjustment,
  isColdStart,
} from '@/engines/learning/strategies/adjustment'
import type {
  LearningEvent,
  LearningEventType,
  LearningExportBundle,
  LearningProfile,
  RecommendationAdjustment,
} from '@/engines/learning/types'
import type { Food, MealType } from '@/types/domain'

const memory = new Map<string, LearningProfile>()

function nowIso(): string {
  return new Date().toISOString()
}

export function getLearningProfile(userId: string): LearningProfile {
  return memory.get(userId) ?? createEmptyLearningProfile(userId, nowIso())
}

export async function ensureLearningProfile(userId: string): Promise<LearningProfile> {
  if (memory.has(userId)) return memory.get(userId)!
  const loaded = await loadLearningProfile(userId)
  memory.set(userId, loaded)
  return loaded
}

async function commit(profile: LearningProfile): Promise<LearningProfile> {
  memory.set(profile.userId, profile)
  await saveLearningProfile(profile)
  return profile
}

async function record(
  userId: string,
  type: LearningEventType,
  payload: Omit<LearningEvent, 'type' | 'timestamp'> & { timestamp?: string } = {},
): Promise<LearningProfile> {
  const current = await ensureLearningProfile(userId)
  const event: LearningEvent = {
    type,
    timestamp: payload.timestamp ?? nowIso(),
    foodId: payload.foodId,
    cuisine: payload.cuisine,
    ingredients: payload.ingredients,
    mealType: payload.mealType,
    replacedFoodId: payload.replacedFoodId,
    hour: payload.hour,
    minute: payload.minute,
    meta: payload.meta,
  }
  return commit(applyLearningEvent(current, event))
}

export async function recordMealAccepted(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_accepted', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordMealSkipped(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_skipped', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordMealLiked(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_liked', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordMealDisliked(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_disliked', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordMealSwapped(
  userId: string,
  fromFood: Food,
  toFood: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_swapped', {
    foodId: fromFood.id,
    replacedFoodId: toFood.id,
    mealType,
    cuisine: inferCuisines(fromFood)[0],
    ingredients: inferIngredients(fromFood),
  })
}

export async function recordMealRegenerated(
  userId: string,
  food?: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_regenerated', {
    foodId: food?.id,
    mealType,
    cuisine: food ? inferCuisines(food)[0] : undefined,
    ingredients: food ? inferIngredients(food) : undefined,
  })
}

export async function recordMealCompleted(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_completed', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordMealPartiallyCompleted(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_partially_completed', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordMealPrepared(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_prepared', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordMealRepeated(
  userId: string,
  food: Food,
  mealType?: MealType,
): Promise<LearningProfile> {
  return record(userId, 'meal_repeated', {
    foodId: food.id,
    mealType,
    cuisine: inferCuisines(food)[0],
    ingredients: inferIngredients(food),
  })
}

export async function recordReminderIgnored(userId: string): Promise<LearningProfile> {
  return record(userId, 'reminder_ignored')
}

export async function recordReminderOpened(userId: string): Promise<LearningProfile> {
  return record(userId, 'reminder_opened')
}

export async function recordShoppingCompleted(userId: string): Promise<LearningProfile> {
  return record(userId, 'shopping_completed')
}

export async function recordWaterCompleted(userId: string): Promise<LearningProfile> {
  return record(userId, 'water_completed')
}

export function getAffinity(userId: string, foodId: string): number {
  return getAffinityScore(getLearningProfile(userId).foodAffinity, foodId)
}

export function getCuisineAffinity(userId: string, cuisine: string): number {
  return getAffinityScore(getLearningProfile(userId).cuisineAffinity, cuisine)
}

export { getRecommendationAdjustment, buildAdjustmentMap, isColdStart }

export function getLearningAdjustmentsForFoods(
  userId: string,
  foods: readonly Food[],
): ReadonlyMap<string, number> {
  const profile = getLearningProfile(userId)
  return buildAdjustmentMap(profile, foods.map((f) => f.id), (foodId) => {
    const food = foods.find((f) => f.id === foodId)
    if (!food) return {}
    return {
      cuisine: inferCuisines(food)[0],
      ingredients: inferIngredients(food),
    }
  })
}

export {
  applyLearningEvent,
  createEmptyLearningProfile,
  exportLearningProfile,
  importLearningProfile,
  serializeLearningProfile,
  deserializeLearningProfile,
}

export type {
  LearningEvent,
  LearningExportBundle,
  LearningProfile,
  RecommendationAdjustment,
}
