import {
  ACTIVITY_MULTIPLIERS,
  CALORIE_FLOOR_ADULT,
  MEAL_SPLIT,
  WATER_ML_PER_KG,
  type ActivityLevel,
} from '@/config/constants'
import { bmiCategoryLabel, classifyBmi } from '@/engines/nutrition/bmi'
import {
  buildNutritionAdjustment,
  calorieFloorFor,
} from '@/engines/nutrition/conditionAdjustments'
import type {
  Gender,
  MealType,
  MedicalConditionId,
  NutritionTargets,
  Profile,
} from '@/types/domain'

/**
 * Nutrition Engine — pure deterministic calculations.
 * Never call AI from this module.
 */

export function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error('Height and weight must be positive')
  }
  const heightM = heightCm / 100
  return round1(weightKg / (heightM * heightM))
}

/** Mifflin-St Jeor BMR (kcal/day). */
export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  if (gender === 'male') return Math.round(base + 5)
  if (gender === 'female') return Math.round(base - 161)
  return Math.round(base - 78)
}

export function calculateTdee(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activity])
}

export function goalCalorieAdjustment(tdee: number, goal: Profile['goal']): number {
  switch (goal) {
    case 'lose_weight':
      return Math.round(tdee - 400)
    case 'gain_muscle':
      return Math.round(tdee + 300)
    case 'maintain':
    case 'manage_condition':
    case 'general_wellness':
    default:
      return tdee
  }
}

export function calculateMacros(
  calories: number,
  weightKg: number,
  options?: {
    proteinPerKg?: number
    fatFraction?: number
    fiberPer1000Kcal?: number
  },
): {
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
} {
  const proteinPerKg = options?.proteinPerKg ?? 1.6
  const fatFraction = options?.fatFraction ?? 0.28
  const fiberPer1000 = options?.fiberPer1000Kcal ?? 14

  const proteinG = Math.round(weightKg * proteinPerKg)
  const fatG = Math.round((calories * fatFraction) / 9)
  const proteinKcal = proteinG * 4
  const fatKcal = fatG * 9
  const carbsG = Math.max(0, Math.round((calories - proteinKcal - fatKcal) / 4))
  const fiberG = Math.round((calories / 1000) * fiberPer1000)
  return { proteinG, carbsG, fatG, fiberG }
}

export function calculateWaterMl(weightKg: number, extraMl = 0): number {
  return Math.round(weightKg * WATER_ML_PER_KG + extraMl)
}

export function mealCalorieSplit(totalCalories: number): Record<MealType, number> {
  return {
    breakfast: Math.round(totalCalories * MEAL_SPLIT.breakfast),
    lunch: Math.round(totalCalories * MEAL_SPLIT.lunch),
    snack: Math.round(totalCalories * MEAL_SPLIT.snack),
    dinner: Math.round(totalCalories * MEAL_SPLIT.dinner),
  }
}

export function calculateNutritionTargets(
  profile: Profile,
  conditions: MedicalConditionId[] = [],
): NutritionTargets {
  const bmi = calculateBmi(profile.weightKg, profile.heightCm)
  const bmiCategory = bmiCategoryLabel(classifyBmi(bmi))
  const bmr = calculateBmr(
    profile.weightKg,
    profile.heightCm,
    profile.age,
    profile.gender,
  )
  const tdee = calculateTdee(bmr, profile.activityLevel)
  const adjustment = buildNutritionAdjustment(profile, conditions)
  const floor = calorieFloorFor(profile, conditions)
  const goalCalories = goalCalorieAdjustment(tdee, profile.goal) + adjustment.caloriesDelta
  const calories = Math.max(floor, goalCalories)
  const macros = calculateMacros(calories, profile.weightKg, {
    proteinPerKg: adjustment.proteinPerKg,
    fatFraction: adjustment.fatFraction,
    fiberPer1000Kcal: adjustment.fiberPer1000Kcal,
  })
  const waterMl = calculateWaterMl(profile.weightKg, adjustment.waterMlDelta)
  const mealSplit = mealCalorieSplit(calories)

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    calories,
    ...macros,
    waterMl,
    sodiumMgMax: adjustment.sodiumMgMax,
    mealSplit,
    adjustmentNotes: adjustment.notes,
  }
}

/** Validate a food nutrient profile shape (knowledge ingest guard). */
export function isValidNutrientProfile(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const n = value as Record<string, unknown>
  const required = ['calories', 'proteinG', 'carbsG', 'fatG', 'fiberG'] as const
  return required.every((key) => typeof n[key] === 'number' && Number.isFinite(n[key]))
}

export function assertCalorieFloor(calories: number): number {
  return Math.max(CALORIE_FLOOR_ADULT, calories)
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
