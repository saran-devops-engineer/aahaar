import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import {
  applyLearningEvent,
  createEmptyLearningProfile,
  deserializeLearningProfile,
  exportLearningProfile,
  getRecommendationAdjustment,
  importLearningProfile,
  isColdStart,
  serializeLearningProfile,
} from '@/engines/learning'
import { applyDecayToProfile } from '@/engines/learning/scores/decay'
import { rankFoodsForMeal } from '@/engines/recommendation'

const userId = 'user-learning-1'
const idli = FOOD_CATALOG.find((f) => f.id === 'food-idli-sambar')!
const paneer = FOOD_CATALOG.find((f) => f.id === 'food-palak-paneer')!

describe('Adaptive Learning Engine', () => {
  it('starts cold with no affinity influence', () => {
    const profile = createEmptyLearningProfile(userId, '2026-08-04T08:00:00.000Z')
    expect(isColdStart(profile)).toBe(true)
    const adjustment = getRecommendationAdjustment(profile, idli.id)
    expect(adjustment.scoreDelta).toBe(0)
    expect(adjustment.reasons.some((r) => /Cold start/i.test(r))).toBe(true)
  })

  it('increases affinity on like and decreases on dislike', () => {
    let profile = createEmptyLearningProfile(userId, '2026-08-04T08:00:00.000Z')
    for (let i = 0; i < 12; i += 1) {
      profile = applyLearningEvent(profile, {
        type: 'meal_liked',
        timestamp: `2026-08-04T0${(8 + (i % 2)).toString()}:00:00.000Z`,
        foodId: idli.id,
        cuisine: 'Andhra',
        ingredients: ['Rice'],
        mealType: 'breakfast',
      })
    }
    expect(profile.foodAffinity[idli.id]?.score ?? 50).toBeGreaterThan(50)
    expect(profile.cuisineAffinity.Andhra?.score ?? 50).toBeGreaterThan(50)

    profile = applyLearningEvent(profile, {
      type: 'meal_disliked',
      timestamp: '2026-08-04T10:00:00.000Z',
      foodId: paneer.id,
      cuisine: 'North Indian',
      mealType: 'lunch',
    })
    expect(profile.foodAffinity[paneer.id]?.score ?? 50).toBeLessThan(50)
  })

  it('decays old affinities toward neutral', () => {
    let profile = createEmptyLearningProfile(userId, '2026-01-01T08:00:00.000Z')
    profile = applyLearningEvent(profile, {
      type: 'meal_liked',
      timestamp: '2026-01-01T08:00:00.000Z',
      foodId: idli.id,
    })
    const before = profile.foodAffinity[idli.id]!.score
    const decayed = applyDecayToProfile(profile, '2026-08-01T08:00:00.000Z')
    const after = decayed.foodAffinity[idli.id]!.score
    expect(Math.abs(after - 50)).toBeLessThan(Math.abs(before - 50))
  })

  it('raises confidence and applies capped adjustments after enough events', () => {
    let profile = createEmptyLearningProfile(userId, '2026-08-01T08:00:00.000Z')
    for (let i = 0; i < 30; i += 1) {
      profile = applyLearningEvent(profile, {
        type: i % 5 === 0 ? 'meal_completed' : 'meal_liked',
        timestamp: `2026-08-${String((i % 28) + 1).padStart(2, '0')}T08:00:00.000Z`,
        foodId: idli.id,
        cuisine: 'South Indian',
        mealType: 'breakfast',
      })
    }
    expect(profile.confidence === 'medium' || profile.confidence === 'high').toBe(true)
    expect(isColdStart(profile)).toBe(false)
    const adjustment = getRecommendationAdjustment(profile, idli.id, {
      cuisine: 'South Indian',
    })
    expect(adjustment.scoreDelta).toBeGreaterThan(0)
    expect(Math.abs(adjustment.scoreDelta)).toBeLessThanOrEqual(18)
  })

  it('applies diversity penalty for repeated recent foods', () => {
    let profile = createEmptyLearningProfile(userId, '2026-08-04T08:00:00.000Z')
    for (let i = 0; i < 20; i += 1) {
      profile = applyLearningEvent(profile, {
        type: 'meal_accepted',
        timestamp: `2026-08-04T${String(8 + (i % 10)).padStart(2, '0')}:00:00.000Z`,
        foodId: idli.id,
        mealType: 'breakfast',
      })
    }
    const adjustment = getRecommendationAdjustment(profile, idli.id)
    expect(adjustment.diversityPenalty).toBeGreaterThan(0)
  })

  it('exports and imports a versioned learning profile', () => {
    let profile = createEmptyLearningProfile(userId, '2026-08-04T08:00:00.000Z')
    profile = applyLearningEvent(profile, {
      type: 'meal_liked',
      timestamp: '2026-08-04T08:00:00.000Z',
      foodId: idli.id,
    })
    const bundle = exportLearningProfile(profile)
    expect(bundle.format).toBe('aahaar.learning.profile')
    const raw = serializeLearningProfile(profile)
    const restored = deserializeLearningProfile(raw)
    expect(restored.userId).toBe(userId)
    expect(restored.foodAffinity[idli.id]?.score).toBe(profile.foodAffinity[idli.id]?.score)

    const migrated = importLearningProfile(bundle, { userId: 'user-2' })
    expect(migrated.userId).toBe('user-2')
  })

  it('migrates major-version export while keeping affinities', () => {
    let profile = createEmptyLearningProfile(userId, '2026-08-04T08:00:00.000Z')
    profile = applyLearningEvent(profile, {
      type: 'meal_liked',
      timestamp: '2026-08-04T08:00:00.000Z',
      foodId: idli.id,
    })
    const legacy = exportLearningProfile({
      ...profile,
      version: '0.9.0',
    })
    const migrated = importLearningProfile(legacy)
    expect(migrated.version.startsWith('1.')).toBe(true)
    expect(migrated.foodAffinity[idli.id]?.score).toBe(profile.foodAffinity[idli.id]?.score)
  })

  it('does not change ranking when learning adjustments are omitted (cold path)', () => {
    const base = {
      mealType: 'breakfast' as const,
      stateCode: 'TN',
      season: 'summer' as const,
      foodPreference: 'veg' as const,
      targetCalories: 400,
      maxCostTier: 3 as const,
      pantryFoodIds: [] as string[],
      preferRegional: true,
    }
    const a = rankFoodsForMeal(FOOD_CATALOG, base).map((r) => r.food.id)
    const b = rankFoodsForMeal(FOOD_CATALOG, base).map((r) => r.food.id)
    expect(a).toEqual(b)
  })
})
