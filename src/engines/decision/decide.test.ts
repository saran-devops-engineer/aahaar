import { describe, expect, it } from 'vitest'
import { buildUserContext } from '@/engines/context'
import { decide } from '@/engines/decision'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import type { Profile } from '@/types/domain'

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
    const context = buildUserContext({
      profile,
      date: '2026-08-02',
      conditions: [],
      preferences: {},
      budgetTier: 3,
      season: 'summer',
      varietySeed: 1,
    })

    const result = decide(context, FOOD_CATALOG)
    expect(result.targets.calories).toBeGreaterThan(1000)
    expect(result.meals.length).toBeGreaterThanOrEqual(3)
    expect(result.sources).toContain('context-engine')
    expect(result.candidateFoodCount).toBeGreaterThan(0)
    expect(result.meals.every((m) => m.explanation.length > 0)).toBe(true)
    expect(result.meals.every((m) => m.score > 0)).toBe(true)
  })

  it('blocks high-sodium regional foods for hypertension', () => {
    const context = buildUserContext({
      profile,
      date: '2026-08-02',
      conditions: ['hypertension'],
      preferences: {},
      budgetTier: 3,
      season: 'monsoon',
      varietySeed: 1,
    })

    const result = decide(context, FOOD_CATALOG)
    const foodIds = result.meals.map((m) => m.foodId)
    expect(foodIds).not.toContain('food-misal')
    expect(result.targets.sodiumMgMax).toBe(1500)
    expect(result.blockedFoodCount).toBeGreaterThan(0)
  })

  it('respects allergen preferences', () => {
    const context = buildUserContext({
      profile: { ...profile, stateCode: 'TN', districtId: 'tn-chennai' },
      date: '2026-08-02',
      conditions: [],
      preferences: { allergens: 'dairy' },
      budgetTier: 3,
      season: 'summer',
      varietySeed: 1,
    })

    const result = decide(context, FOOD_CATALOG)
    expect(result.meals.map((m) => m.foodId)).not.toContain('food-curd-rice')
    expect(result.meals.map((m) => m.foodId)).not.toContain('food-buttermilk')
  })

  it('rotates among balanced candidates when variety seed changes', () => {
    const mealsBySeed = [11, 29, 47, 83, 101].map((varietySeed) =>
      decide(
        buildUserContext({
          profile,
          date: '2026-08-02',
          conditions: [],
          preferences: {},
          budgetTier: 3,
          season: 'summer',
          varietySeed,
        }),
        FOOD_CATALOG,
      ).meals.map((m) => m.foodId),
    )
    const uniqueBreakfasts = new Set(mealsBySeed.map((ids) => ids[0]))
    expect(FOOD_CATALOG.length).toBeGreaterThan(60)
    expect(uniqueBreakfasts.size).toBeGreaterThan(1)
  })
})
