import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import { REGION_RECORDS } from '@/engines/knowledge/data/regions'

describe('food catalog coverage', () => {
  it('has a large multi-meal catalog', () => {
    expect(FOOD_CATALOG.length).toBeGreaterThanOrEqual(70)
    const byMeal = {
      breakfast: FOOD_CATALOG.filter((f) => f.mealTypes.includes('breakfast')),
      lunch: FOOD_CATALOG.filter((f) => f.mealTypes.includes('lunch')),
      snack: FOOD_CATALOG.filter((f) => f.mealTypes.includes('snack')),
      dinner: FOOD_CATALOG.filter((f) => f.mealTypes.includes('dinner')),
    }
    expect(byMeal.breakfast.length).toBeGreaterThanOrEqual(15)
    expect(byMeal.lunch.length).toBeGreaterThanOrEqual(20)
    expect(byMeal.dinner.length).toBeGreaterThanOrEqual(18)
    expect(byMeal.snack.length).toBeGreaterThanOrEqual(12)
  })

  it('covers every AAHAAR region with multiple foods', () => {
    for (const region of REGION_RECORDS) {
      const regional = FOOD_CATALOG.filter(
        (f) => f.stateCodes.length === 0 || f.stateCodes.includes(region.stateCode),
      )
      expect(regional.length, region.name).toBeGreaterThanOrEqual(8)
    }
  })

  it('keeps unique food ids', () => {
    const ids = FOOD_CATALOG.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
