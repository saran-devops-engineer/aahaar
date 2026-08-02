import { describe, expect, it } from 'vitest'
import {
  calculateBmi,
  calculateBmr,
  calculateNutritionTargets,
  calculateTdee,
  isValidNutrientProfile,
} from '@/engines/nutrition/calculations'
import type { Profile } from '@/types/domain'

const sampleProfile: Profile = {
  id: 'p1',
  userId: 'u1',
  age: 30,
  gender: 'female',
  heightCm: 160,
  weightKg: 60,
  stateCode: 'MH',
  districtId: 'mh-mumbai',
  foodPreference: 'veg',
  goal: 'maintain',
  activityLevel: 'moderate',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('nutrition engine', () => {
  it('calculates BMI', () => {
    expect(calculateBmi(60, 160)).toBe(23.4)
  })

  it('calculates Mifflin-St Jeor BMR for female', () => {
    expect(calculateBmr(60, 160, 30, 'female')).toBe(1289)
  })

  it('calculates TDEE from activity', () => {
    expect(calculateTdee(1289, 'moderate')).toBe(Math.round(1289 * 1.55))
  })

  it('builds full nutrition targets', () => {
    const targets = calculateNutritionTargets(sampleProfile)
    expect(targets.bmi).toBe(23.4)
    expect(targets.bmiCategory).toBe('Normal')
    expect(targets.calories).toBeGreaterThan(1000)
    expect(targets.waterMl).toBe(2100)
    expect(targets.sodiumMgMax).toBe(2000)
    expect(
      targets.mealSplit.breakfast +
        targets.mealSplit.lunch +
        targets.mealSplit.snack +
        targets.mealSplit.dinner,
    ).toBeCloseTo(targets.calories, -1)
  })

  it('applies pregnancy calorie and protein adjustments', () => {
    const base = calculateNutritionTargets(sampleProfile)
    const pregnant = calculateNutritionTargets(sampleProfile, ['pregnancy'])
    expect(pregnant.calories).toBe(base.calories + 300)
    expect(pregnant.proteinG).toBeGreaterThan(base.proteinG)
    expect(pregnant.adjustmentNotes.some((n) => n.includes('Pregnancy'))).toBe(true)
  })

  it('lowers sodium cap for hypertension', () => {
    const targets = calculateNutritionTargets(sampleProfile, ['hypertension'])
    expect(targets.sodiumMgMax).toBe(1500)
  })

  it('validates nutrient profiles', () => {
    expect(
      isValidNutrientProfile({
        calories: 100,
        proteinG: 1,
        carbsG: 2,
        fatG: 3,
        fiberG: 4,
      }),
    ).toBe(true)
    expect(isValidNutrientProfile({ calories: 100 })).toBe(false)
  })
})
