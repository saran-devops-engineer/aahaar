import { describe, expect, it, beforeEach } from 'vitest'
import {
  RESOURCE_VERSION,
  createEmptyResourceProfile,
  estimateShopping,
  evaluateResources,
  findAvailableMeals,
  findMissingIngredients,
  findSubstitutes,
  getAvailableIngredients,
  getExpiringFoods,
  resetResourceCache,
  seedResources,
  substitutionChain,
  withBudget,
  withCookingTime,
  withInventory,
  withKitchen,
  withLeftover,
  computeFreshness,
  computeResourceAnalytics,
} from '@/engines/resources'

const userId = 'user-rie-1'

beforeEach(() => {
  resetResourceCache()
})

describe('Resource Intelligence Engine', () => {
  it('tracks inventory with freshness from expiry', () => {
    const profile = withInventory(createEmptyResourceProfile(userId, '2026-08-04T08:00:00.000Z'), [
      {
        ingredient: 'Spinach',
        quantity: 2,
        unit: 'bunch',
        expiryDate: '2026-08-04',
        location: 'refrigerator',
      },
      {
        ingredient: 'Rice',
        quantity: 5,
        unit: 'kg',
        expiryDate: '2027-01-01',
        location: 'pantry',
        minimumLevel: 1,
      },
    ], '2026-08-04T08:00:00.000Z')

    expect(profile.version).toBe(RESOURCE_VERSION)
    expect(computeFreshness('2026-08-04', '2026-08-04T08:00:00.000Z')).toBe('expiring_today')
    expect(profile.inventory.find((i) => i.ingredient === 'Spinach')?.freshness).toBe(
      'expiring_today',
    )
    expect(getExpiringFoods(profile)[0]?.ingredient).toBe('Spinach')
    expect(getAvailableIngredients(profile).some((i) => i.ingredient === 'Rice')).toBe(true)
  })

  it('blocks omelette when eggs are missing', () => {
    const profile = withInventory(createEmptyResourceProfile(userId), [
      { ingredient: 'Onion', quantity: 3, unit: 'pcs' },
      { ingredient: 'Tomato', quantity: 2, unit: 'pcs' },
    ])
    const evaluation = evaluateResources(profile, {
      foodId: 'food-omelette',
      foodName: 'Omelette',
      ingredients: ['Egg', 'Onion', 'Tomato'],
      estimatedPrepMinutes: 15,
    })
    expect(evaluation.possible).toBe(false)
    expect(evaluation.missingIngredients).toContain('Egg')
    expect(findMissingIngredients(profile, {
      foodId: 'food-omelette',
      ingredients: ['Egg', 'Onion', 'Tomato'],
    })).toContain('Egg')
  })

  it('avoids pressure-cooker meals when kitchen has no gas/induction/cooker', () => {
    const profile = withKitchen(createEmptyResourceProfile(userId), ['microwave'])
    const evaluation = evaluateResources(profile, {
      foodId: 'food-dal',
      ingredients: ['Dal', 'Rice'],
      needsGas: true,
      needsPressureCooker: true,
      requiredEquipment: ['pressure_cooker'],
    })
    expect(evaluation.possible).toBe(false)
    expect(evaluation.equipmentGaps.length).toBeGreaterThan(0)
  })

  it('prefers quick meals when cooking time is 20 minutes', () => {
    let profile = withInventory(createEmptyResourceProfile(userId), [
      { ingredient: 'Egg', quantity: 4 },
      { ingredient: 'Onion', quantity: 2 },
    ])
    profile = withCookingTime(profile, 20)
    profile = withKitchen(profile, ['gas_stove', 'mixer'])

    const quick = evaluateResources(profile, {
      foodId: 'food-omelette',
      ingredients: ['Egg', 'Onion'],
      estimatedPrepMinutes: 15,
      needsGas: true,
    })
    const slow = evaluateResources(profile, {
      foodId: 'food-biryani',
      ingredients: ['Egg', 'Onion'],
      estimatedPrepMinutes: 90,
      needsGas: true,
    })
    expect(quick.possible).toBe(true)
    expect(quick.timeOk).toBe(true)
    expect(slow.possible).toBe(false)
    expect(slow.timeOk).toBe(false)
  })

  it('marks budget exhausted for costly meals', () => {
    let profile = withInventory(createEmptyResourceProfile(userId), [
      { ingredient: 'Rice', quantity: 2 },
    ])
    profile = withBudget(profile, { monthly: 1000, spent: 1000 })
    const evaluation = evaluateResources(profile, {
      foodId: 'food-rice',
      ingredients: ['Rice'],
      estimatedCost: 50,
    })
    expect(profile.budget.exhausted).toBe(true)
    expect(evaluation.budgetOk).toBe(false)
    expect(evaluation.possible).toBe(false)
  })

  it('finds available meals and ranks waste-reducing options', () => {
    let profile = withInventory(createEmptyResourceProfile(userId), [
      { ingredient: 'Egg', quantity: 6 },
      { ingredient: 'Onion', quantity: 2 },
      {
        ingredient: 'Spinach',
        quantity: 1,
        expiryDate: '2026-08-05',
        location: 'refrigerator',
      },
    ], '2026-08-04T08:00:00.000Z')
    profile = withKitchen(profile, ['gas_stove'])
    profile = withCookingTime(profile, 30)
    profile = withLeftover(profile, {
      label: 'Curd Rice',
      foodId: 'food-curd-rice',
      quantity: 1,
      unit: 'bowl',
      expiryDate: '2026-08-05',
    }, '2026-08-04T08:00:00.000Z')

    const available = findAvailableMeals(profile, [
      {
        foodId: 'food-omelette',
        ingredients: ['Egg', 'Onion'],
        estimatedPrepMinutes: 15,
        needsGas: true,
      },
      {
        foodId: 'food-spinach-egg',
        ingredients: ['Egg', 'Spinach'],
        estimatedPrepMinutes: 20,
        needsGas: true,
      },
      {
        foodId: 'food-curd-rice',
        ingredients: ['Rice'],
        estimatedPrepMinutes: 5,
      },
    ])
    expect(available.some((a) => a.foodId === 'food-omelette')).toBe(true)
    expect(available.find((a) => a.foodId === 'food-spinach-egg')?.preferBecauseExpiring.length).toBeGreaterThan(
      0,
    )
  })

  it('estimates shopping list with categories and priorities', () => {
    const profile = withInventory(createEmptyResourceProfile(userId), [
      { ingredient: 'Rice', quantity: 2 },
    ])
    const shopping = estimateShopping(profile, [
      {
        foodId: 'food-omelette',
        ingredients: ['Egg', 'Onion', 'Rice'],
      },
    ])
    expect(shopping.missing).toContain('Egg')
    expect(shopping.missing).toContain('Onion')
    expect(shopping.avoidDuplicates).toContain('Rice')
    expect(shopping.budgetEstimate).toBeGreaterThan(0)
    expect(shopping.needed.some((n) => n.priority === 'critical' || n.priority === 'medium')).toBe(
      true,
    )
  })

  it('substitutes paneer chain when paneer is unavailable', () => {
    expect(substitutionChain('Paneer').map((s) => s.toLowerCase())).toEqual(
      expect.arrayContaining(['tofu', 'egg', 'soy', 'curd']),
    )
    const profile = withInventory(createEmptyResourceProfile(userId), [
      { ingredient: 'Tofu', quantity: 1 },
      { ingredient: 'Spinach', quantity: 1 },
    ])
    expect(findSubstitutes('Paneer', profile)).toContain('tofu')
    const evaluation = evaluateResources(profile, {
      foodId: 'food-palak-paneer',
      ingredients: ['Paneer', 'Spinach'],
    })
    expect(evaluation.possible).toBe(true)
    expect(evaluation.reasons.some((r) => /Substitute/i.test(r))).toBe(true)
  })

  it('seeds user resources for API-style access', () => {
    const profile = withInventory(createEmptyResourceProfile(userId), [
      { ingredient: 'Egg', quantity: 2, minimumLevel: 4 },
    ])
    seedResources(profile)
    const analytics = computeResourceAnalytics(profile)
    expect(analytics.lowStockCount).toBe(1)
    expect(analytics.inventoryCount).toBe(1)
  })
})
