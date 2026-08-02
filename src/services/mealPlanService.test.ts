import { describe, expect, it } from 'vitest'
import { groupMealsByDate } from '@/services/mealPlanService'
import type { Meal } from '@/types/domain'

describe('meal plan helpers', () => {
  it('groups meals by date', () => {
    const meals: Meal[] = [
      {
        id: '1',
        mealPlanId: 'p',
        date: '2026-08-03',
        mealType: 'breakfast',
        foodId: 'a',
        servings: 1,
        createdAt: '',
      },
      {
        id: '2',
        mealPlanId: 'p',
        date: '2026-08-04',
        mealType: 'lunch',
        foodId: 'b',
        servings: 1,
        createdAt: '',
      },
      {
        id: '3',
        mealPlanId: 'p',
        date: '2026-08-03',
        mealType: 'dinner',
        foodId: 'c',
        servings: 1,
        createdAt: '',
      },
    ]

    const grouped = groupMealsByDate(meals)
    expect(grouped['2026-08-03']).toHaveLength(2)
    expect(grouped['2026-08-04']).toHaveLength(1)
  })
})
