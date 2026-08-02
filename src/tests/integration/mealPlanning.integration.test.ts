import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/database/db'
import { syncKnowledgeBase } from '@/engines/knowledge'
import { generateWeekPlan, getMealsForWeek } from '@/services/mealPlanService'
import { completeOnboarding } from '@/services/profileService'
import {
  buildShoppingListFromWeek,
  shoppingProgress,
  toggleShoppingItem,
} from '@/services/shoppingListService'
import { weekStartIso } from '@/shared/utils/date'

describe('meal planning integration', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await syncKnowledgeBase()
  })

  afterEach(async () => {
    await db.delete()
  })

  it('onboards, plans a week, and builds a shopping list', async () => {
    const { profile } = await completeOnboarding({
      age: 30,
      gender: 'female',
      heightCm: 160,
      weightKg: 60,
      stateCode: 'MH',
      districtId: 'mh-mumbai',
      foodPreference: 'veg',
      goal: 'maintain',
      activityLevel: 'moderate',
    })

    const weekStart = weekStartIso()
    const { meals } = await generateWeekPlan(profile, weekStart)

    expect(meals.length).toBeGreaterThanOrEqual(20)
    const stored = await getMealsForWeek(profile.userId, weekStart)
    expect(stored.length).toBe(meals.length)

    const list = await buildShoppingListFromWeek(profile.userId, weekStart)
    expect(list.items.length).toBeGreaterThan(0)

    const first = list.items[0]!
    const toggled = await toggleShoppingItem(list.id, first.id)
    expect(toggled.items.find((item) => item.id === first.id)?.checked).toBe(true)
    expect(shoppingProgress(toggled).checked).toBe(1)
  })
})
