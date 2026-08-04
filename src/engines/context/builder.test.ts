import { describe, expect, it } from 'vitest'
import {
  buildUserContext,
  CONTEXT_VERSION,
  ContextValidationError,
  hasExtension,
  isCompatibleContextVersion,
  selectPreferLowGi,
  selectWaterProgressPct,
  validateUserContext,
} from '@/engines/context'
import type { Profile } from '@/types/domain'

const baseProfile: Profile = {
  id: 'p1',
  userId: 'u1',
  age: 30,
  gender: 'female',
  heightCm: 160,
  weightKg: 60,
  stateCode: 'AP',
  districtId: 'ap-sri-potti-sriramulu-nellore',
  foodPreference: 'veg',
  goal: 'maintain',
  activityLevel: 'moderate',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('Context Engine', () => {
  it('builds an immutable UserContext with nutrition targets', () => {
    const context = buildUserContext({
      profile: baseProfile,
      date: '2026-08-04',
      conditions: ['diabetes'],
      preferences: { allergens: 'dairy', pantry: 'food-dal-rice' },
      budgetTier: 2,
      season: 'monsoon',
      waterConsumedMl: 700,
      varietySeed: 9,
    })

    expect(context.version).toBe(CONTEXT_VERSION)
    expect(context.state).toBe('AP')
    expect(context.district).toBe('ap-sri-potti-sriramulu-nellore')
    expect(context.season).toBe('monsoon')
    expect(context.budget.tier).toBe(2)
    expect(context.medical.conditions).toEqual(['diabetes'])
    expect(context.foodRestrictions.allergens).toEqual(['dairy'])
    expect(context.mealPreferences.pantryFoodIds).toEqual(['food-dal-rice'])
    expect(context.nutritionTargets.calories).toBeGreaterThan(1000)
    expect(context.waterGoal).toBe(context.water.goalMl)
    expect(context.water.consumedMl).toBe(700)
    expect(selectPreferLowGi(context)).toBe(true)
    expect(selectWaterProgressPct(context)).toBeGreaterThan(0)
    expect(hasExtension(context, 'weather')).toBe(false)
    expect(context.extensions.pantry).toBeNull()

    expect(Object.isFrozen(context)).toBe(true)
    expect(Object.isFrozen(context.profile)).toBe(true)
    expect(() => {
      // @ts-expect-error immutability guard
      context.state = 'TN'
    }).toThrow()
  })

  it('applies defaults for missing optional values', () => {
    const context = buildUserContext({
      profile: baseProfile,
      date: '2026-08-04',
    })

    expect(context.language).toBe('en')
    expect(context.budget.tier).toBe(3)
    expect(context.season).toBe('all')
    expect(context.availableMeals.breakfast).toBe(true)
    expect(context.medical.conditions).toEqual([])
    expect(context.planning.excludeFoodIds).toEqual([])
    expect(context.water.consumedMl).toBe(0)
    expect(context.timestamp).toBe('2026-08-04T00:00:00.000Z')
  })

  it('rejects missing profile fields', () => {
    expect(() =>
      buildUserContext({
        profile: { ...baseProfile, stateCode: '' },
        date: '2026-08-04',
      }),
    ).toThrow(ContextValidationError)

    expect(() =>
      buildUserContext({
        profile: baseProfile,
        date: '04-08-2026',
      }),
    ).toThrow(/YYYY-MM-DD/)
  })

  it('validates assembled context invariants', () => {
    const context = buildUserContext({
      profile: baseProfile,
      date: '2026-08-04',
    })
    expect(() => validateUserContext(context)).not.toThrow()
  })

  it('supports same-major version upgrades and rejects incompatible majors', () => {
    expect(isCompatibleContextVersion('1.5.0')).toBe(true)
    expect(isCompatibleContextVersion('1.9.0')).toBe(true)
    expect(isCompatibleContextVersion('2.0.0')).toBe(false)

    const ok = buildUserContext({
      profile: baseProfile,
      date: '2026-08-04',
      contextVersion: '1.9.0',
    })
    expect(ok.version).toBe('1.9.0')

    expect(() =>
      buildUserContext({
        profile: baseProfile,
        date: '2026-08-04',
        contextVersion: '2.0.0',
      }),
    ).toThrow(/incompatible/i)
  })
})
