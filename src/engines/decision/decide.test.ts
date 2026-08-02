import { describe, expect, it } from 'vitest'
import { decide } from '@/engines/decision'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import type { DecisionContext, Profile } from '@/types/domain'

const profile: Profile = {
  id: 'p1',
  userId: 'u1',
  age: 30,
  gender: 'female',
  heightCm: 160,
  weightKg: 60,
  stateCode: 'MH',
  districtId: 'mh-mumbai',
  foodPreference: 'veg',
  goal: 'maintain',
  activityLevel: 'moderate',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('decision engine', () => {
  it('returns explainable meals with nutrition targets from catalog', () => {
    const context: DecisionContext = {
      profile,
      conditions: [],
      preferences: {},
      regionStateCode: 'MH',
      districtId: 'mh-mumbai',
      season: 'summer',
      pantryFoodIds: [],
      budgetTier: 3,
      schedule: {
        breakfast: true,
        lunch: true,
        snack: true,
        dinner: true,
      },
      date: '2026-08-02',
    }

    const result = decide(context, FOOD_CATALOG)
    expect(result.targets.calories).toBeGreaterThan(1000)
    expect(result.meals.length).toBeGreaterThanOrEqual(3)
    expect(result.sources).toContain('knowledge-base')
    expect(result.candidateFoodCount).toBeGreaterThan(0)
    expect(result.meals.every((m) => m.explanation.length > 0)).toBe(true)
    expect(result.meals.every((m) => m.score > 0)).toBe(true)
  })

  it('blocks high-sodium regional foods for hypertension', () => {
    const context: DecisionContext = {
      profile,
      conditions: ['hypertension'],
      preferences: {},
      regionStateCode: 'MH',
      districtId: 'mh-pune',
      season: 'monsoon',
      pantryFoodIds: [],
      budgetTier: 3,
      schedule: {
        breakfast: true,
        lunch: true,
        snack: true,
        dinner: true,
      },
      date: '2026-08-02',
    }

    const result = decide(context, FOOD_CATALOG)
    const foodIds = result.meals.map((m) => m.foodId)
    expect(foodIds).not.toContain('food-misal')
    expect(result.targets.sodiumMgMax).toBe(1500)
    expect(result.blockedFoodCount).toBeGreaterThan(0)
  })

  it('respects allergen preferences', () => {
    const context: DecisionContext = {
      profile,
      conditions: [],
      preferences: { allergens: 'dairy' },
      regionStateCode: 'TN',
      districtId: 'tn-chennai',
      season: 'summer',
      pantryFoodIds: [],
      budgetTier: 3,
      schedule: {
        breakfast: true,
        lunch: true,
        snack: true,
        dinner: true,
      },
      date: '2026-08-02',
    }

    const result = decide(context, FOOD_CATALOG)
    expect(result.meals.map((m) => m.foodId)).not.toContain('food-curd-rice')
    expect(result.meals.map((m) => m.foodId)).not.toContain('food-buttermilk')
  })
})
