import { describe, expect, it } from 'vitest'
import { buildUserContext } from '@/engines/context'
import { decide } from '@/engines/decision'
import { isCuisineCompatible, isWheatRotiMeal } from '@/engines/knowledge/cuisineRegions'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import type { Profile } from '@/types/domain'

const apProfile: Profile = {
  id: 'p-ap',
  userId: 'u-ap',
  age: 32,
  gender: 'male',
  heightCm: 170,
  weightKg: 70,
  stateCode: 'AP',
  districtId: 'ap-sri-potti-sriramulu-nellore',
  foodPreference: 'veg',
  goal: 'maintain',
  activityLevel: 'moderate',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('Andhra regional cuisine mapping', () => {
  it('blocks wheat roti plates for AP lunch/dinner', () => {
    const roti = FOOD_CATALOG.find((f) => f.id === 'food-palak-dal-roti')
    const sabzi = FOOD_CATALOG.find((f) => f.id === 'food-roti-sabzi')
    expect(roti).toBeTruthy()
    expect(sabzi).toBeTruthy()
    expect(isWheatRotiMeal(roti!)).toBe(true)
    expect(isCuisineCompatible(roti!, 'AP', 'lunch')).toBe(false)
    expect(isCuisineCompatible(sabzi!, 'AP', 'dinner')).toBe(false)
    expect(isCuisineCompatible(roti!, 'PB', 'lunch')).toBe(true)
  })

  it('never picks roti lunch for Nellore Andhra across variety seeds', () => {
    for (const varietySeed of [1, 7, 13, 21, 42, 77, 99]) {
      const context = buildUserContext({
        profile: apProfile,
        date: '2026-08-04',
        conditions: [],
        preferences: {},
        budgetTier: 3,
        season: 'summer',
        varietySeed,
      })
      const result = decide(context, FOOD_CATALOG)
      const lunch = result.meals.find((m) => m.mealType === 'lunch')
      const dinner = result.meals.find((m) => m.mealType === 'dinner')
      expect(lunch).toBeTruthy()
      expect(dinner).toBeTruthy()

      const lunchFood = FOOD_CATALOG.find((f) => f.id === lunch!.foodId)!
      const dinnerFood = FOOD_CATALOG.find((f) => f.id === dinner!.foodId)!
      expect(isWheatRotiMeal(lunchFood), lunchFood.name).toBe(false)
      expect(isWheatRotiMeal(dinnerFood), dinnerFood.name).toBe(false)
      expect(lunchFood.name.toLowerCase()).not.toMatch(/roti|paratha|phulka/)
      expect(dinnerFood.name.toLowerCase()).not.toMatch(/roti|paratha|phulka/)
    }
  })

  it('prefers Andhra-tagged rice meals in top lunch ranks for Nellore', () => {
    const context = buildUserContext({
      profile: apProfile,
      date: '2026-08-04',
      conditions: [],
      preferences: {},
      budgetTier: 3,
      season: 'summer',
      varietySeed: 3,
    })
    const result = decide(context, FOOD_CATALOG)
    const lunchId = result.meals.find((m) => m.mealType === 'lunch')?.foodId
    const lunchFood = FOOD_CATALOG.find((f) => f.id === lunchId)
    expect(lunchFood?.stateCodes.includes('AP') || lunchFood?.stateCodes.length === 0).toBe(true)
    expect(lunchFood?.name.toLowerCase()).not.toContain('roti')
  })
})
