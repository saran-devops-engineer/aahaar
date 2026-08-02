import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import {
  evaluateConstraints,
  filterFoodsByConstraints,
  strictestVerdict,
} from '@/engines/rules'

describe('rule engine', () => {
  it('blocks misal for hypertension', () => {
    const misal = FOOD_CATALOG.find((f) => f.id === 'food-misal')!
    const evaluations = evaluateConstraints(misal, {
      conditions: ['hypertension'],
      foodPreference: 'veg',
      allergens: [],
      religiousRestrictions: [],
    })
    expect(strictestVerdict(evaluations)).toBe('block')
  })

  it('blocks non-veg for vegan preference', () => {
    const fish = FOOD_CATALOG.find((f) => f.id === 'food-fish-curry-rice')!
    const evaluations = evaluateConstraints(fish, {
      conditions: [],
      foodPreference: 'vegan',
      allergens: [],
      religiousRestrictions: [],
    })
    expect(strictestVerdict(evaluations)).toBe('block')
  })

  it('filters catalog into allowed/limited/blocked buckets', () => {
    const result = filterFoodsByConstraints(FOOD_CATALOG, {
      conditions: ['diabetes'],
      foodPreference: 'veg',
      allergens: [],
      religiousRestrictions: [],
    })
    expect(result.allowed.length + result.limited.length + result.blocked.length).toBe(
      FOOD_CATALOG.length,
    )
    expect(result.blocked.length).toBeGreaterThan(0)
    expect(result.evaluations.length).toBeGreaterThan(0)
  })
})
