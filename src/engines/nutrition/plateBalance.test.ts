import { describe, expect, it } from 'vitest'
import { analyzePlateBalance } from '@/engines/nutrition/plateBalance'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'

function foodById(id: string) {
  const food = FOOD_CATALOG.find((item) => item.id === id)
  if (!food) throw new Error(`Missing food ${id}`)
  return food
}

describe('analyzePlateBalance', () => {
  it('explains Idli Sambar as carb + protein/veg and balanced', () => {
    const result = analyzePlateBalance(foodById('food-idli-sambar'), 'breakfast')
    expect(result.partSummaries.some((line) => /Idli.*carb/i.test(line))).toBe(true)
    expect(result.partSummaries.some((line) => /Sambar.*protein/i.test(line))).toBe(true)
    expect(result.isBalanced).toBe(true)
    expect(result.missingCoreRoles).toEqual([])
    expect(result.balanceVerdict).toMatch(/balanced/i)
  })

  it('flags incomplete plates and recommends missing roles', () => {
    const result = analyzePlateBalance(foodById('food-lauki-soup'), 'dinner')
    expect(result.isBalanced).toBe(false)
    expect(result.missingCoreRoles).toContain('carb')
    expect(result.missingCoreRoles).toContain('protein')
    expect(result.gapRecommendations.length).toBeGreaterThan(0)
  })

  it('recommends dal/curd when Roti Sabzi lacks protein', () => {
    const result = analyzePlateBalance(foodById('food-roti-sabzi'), 'lunch')
    expect(result.isBalanced).toBe(false)
    expect(result.missingCoreRoles).toEqual(['protein'])
    expect(result.gapRecommendations[0]).toMatch(/Dal or curd/i)
  })

  it('does not require full thali for snacks', () => {
    const result = analyzePlateBalance(foodById('food-fruit-chaat'), 'snack')
    expect(result.missingCoreRoles).toEqual([])
    expect(result.partSummaries.length).toBeGreaterThan(0)
  })

  it('covers every catalog food id', () => {
    for (const food of FOOD_CATALOG) {
      const result = analyzePlateBalance(food, food.mealTypes[0] ?? 'lunch')
      expect(result.partSummaries.length).toBeGreaterThan(0)
    }
  })
})
