import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import { findSubstitutionCandidates } from '@/engines/recommendation/substitutions'

describe('substitution search', () => {
  it('returns other breakfast options near current calories', () => {
    const results = findSubstitutionCandidates(FOOD_CATALOG, {
      currentFoodId: 'food-poha',
      mealType: 'breakfast',
      stateCode: 'MH',
      season: 'all',
      foodPreference: 'veg',
      targetCalories: 250,
      maxCostTier: 3,
      pantryFoodIds: [],
      preferRegional: true,
      calorieTolerance: 150,
      limit: 5,
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((r) => r.food.id !== 'food-poha')).toBe(true)
    expect(results.every((r) => r.food.mealTypes.includes('breakfast'))).toBe(true)
    expect(results.every((r) => r.food.isVeg)).toBe(true)
  })
})
