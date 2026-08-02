import { describe, expect, it } from 'vitest'
import { localAiAdapter } from '@/ai/localAdapter'
import { offAiAdapter } from '@/ai/offAdapter'
import { setAiMode, getAiAdapter } from '@/ai/adapter'

describe('AI adapters', () => {
  it('explains using provided facts only', async () => {
    const text = await localAiAdapter.explainRecommendation({
      foodName: 'Poha',
      mealType: 'breakfast',
      servings: 1,
      calories: 250,
      reasons: ['Regional match', 'Affordable'],
      ruleNotes: [],
      conditions: ['diabetes'],
      regionStateCode: 'MH',
      season: 'monsoon',
    })
    expect(text).toContain('Poha')
    expect(text).toContain('250')
    expect(text).toContain('diabetes')
    expect(text).toContain('Regional match')
  })

  it('ranks only provided substitution candidates', async () => {
    const ranked = await localAiAdapter.rankSubstitutions({
      current: {
        foodId: 'food-poha',
        foodName: 'Poha',
        mealType: 'breakfast',
        calories: 250,
      },
      candidates: [
        {
          foodId: 'food-upma',
          foodName: 'Vegetable Upma',
          calories: 260,
          score: 80,
          reasons: ['Regional match'],
        },
        {
          foodId: 'food-idli-sambar',
          foodName: 'Idli Sambar',
          calories: 280,
          score: 90,
          reasons: ['Quick to prepare'],
        },
      ],
      conditions: [],
      constraints: ['veg'],
    })
    expect(ranked.every((item) => ['food-upma', 'food-idli-sambar'].includes(item.foodId))).toBe(
      true,
    )
    expect(ranked[0]?.foodId).toBe('food-upma')
  })

  it('preferVariety stays inside candidate ids', async () => {
    const ids = await localAiAdapter.preferVariety({
      mealType: 'lunch',
      candidateFoodIds: ['a', 'b', 'c'],
      recentlyUsedFoodIds: ['a'],
    })
    expect(ids.every((id) => ['a', 'b', 'c'].includes(id))).toBe(true)
    expect(ids[0]).not.toBe('a')
  })

  it('switches modes via registry', () => {
    setAiMode('off')
    expect(getAiAdapter()).toBe(offAiAdapter)
    setAiMode('local')
    expect(getAiAdapter()).toBe(localAiAdapter)
  })
})
