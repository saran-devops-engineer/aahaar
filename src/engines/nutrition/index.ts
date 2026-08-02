export {
  calculateBmi,
  calculateBmr,
  calculateTdee,
  calculateMacros,
  calculateWaterMl,
  calculateNutritionTargets,
  goalCalorieAdjustment,
  mealCalorieSplit,
  isValidNutrientProfile,
  assertCalorieFloor,
} from '@/engines/nutrition/calculations'

export { classifyBmi, bmiCategoryLabel, type BmiCategory } from '@/engines/nutrition/bmi'

export {
  buildNutritionAdjustment,
  calorieFloorFor,
  type NutritionAdjustment,
} from '@/engines/nutrition/conditionAdjustments'
