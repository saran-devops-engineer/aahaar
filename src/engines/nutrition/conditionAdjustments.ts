import {
  CALORIE_FLOOR_ADULT,
  CALORIE_FLOOR_CHILD,
  CALORIE_FLOOR_ELDERLY,
  PREGNANCY_EXTRA_KCAL,
} from '@/config/constants'
import type { MedicalConditionId, Profile } from '@/types/domain'

export interface NutritionAdjustment {
  caloriesDelta: number
  proteinPerKg: number
  carbFraction: number
  fatFraction: number
  fiberPer1000Kcal: number
  sodiumMgMax: number
  waterMlDelta: number
  notes: string[]
}

const DEFAULTS: NutritionAdjustment = {
  caloriesDelta: 0,
  proteinPerKg: 1.6,
  carbFraction: 0.5,
  fatFraction: 0.28,
  fiberPer1000Kcal: 14,
  sodiumMgMax: 2000,
  waterMlDelta: 0,
  notes: [],
}

/**
 * Deterministic condition-aware nutrition adjustments.
 * Rules decide targets — AI never invents these numbers.
 */
export function buildNutritionAdjustment(
  profile: Profile,
  conditions: MedicalConditionId[],
): NutritionAdjustment {
  const adj: NutritionAdjustment = {
    ...DEFAULTS,
    notes: [],
  }

  if (conditions.includes('pregnancy')) {
    adj.caloriesDelta += PREGNANCY_EXTRA_KCAL
    adj.proteinPerKg = Math.max(adj.proteinPerKg, 1.8)
    adj.waterMlDelta += 300
    adj.notes.push('Pregnancy: +300 kcal and higher protein')
  }

  if (conditions.includes('diabetes') || conditions.includes('pcos')) {
    adj.carbFraction = Math.min(adj.carbFraction, 0.42)
    adj.fatFraction = Math.max(adj.fatFraction, 0.3)
    adj.fiberPer1000Kcal = Math.max(adj.fiberPer1000Kcal, 16)
    adj.notes.push('Lower carb emphasis for glucose management')
  }

  if (conditions.includes('ckd')) {
    adj.proteinPerKg = Math.min(adj.proteinPerKg, 0.8)
    adj.notes.push('CKD: moderated protein target')
  }

  if (conditions.includes('hypertension')) {
    adj.sodiumMgMax = 1500
    adj.notes.push('Hypertension: sodium cap 1500 mg')
  }

  if (conditions.includes('thyroid')) {
    adj.notes.push('Thyroid: prefer iodine-friendly balanced meals')
  }

  if (conditions.includes('children') || profile.age < 18) {
    adj.proteinPerKg = Math.max(adj.proteinPerKg, 1.5)
    adj.notes.push('Growing years: protect calorie floor')
  }

  if (conditions.includes('elderly') || profile.age >= 65) {
    adj.proteinPerKg = Math.max(adj.proteinPerKg, 1.2)
    adj.waterMlDelta += 200
    adj.notes.push('Elderly: protein and hydration emphasis')
  }

  return adj
}

export function calorieFloorFor(
  profile: Profile,
  conditions: MedicalConditionId[],
): number {
  if (conditions.includes('children') || profile.age < 18) return CALORIE_FLOOR_CHILD
  if (conditions.includes('elderly') || profile.age >= 65) return CALORIE_FLOOR_ELDERLY
  return CALORIE_FLOOR_ADULT
}
