/** Core domain types for AAHAAR. Engines and storage share these contracts. */

import type { ActivityLevel } from '@/config/constants'

export type Gender = 'female' | 'male' | 'other'

export type FoodPreference = 'veg' | 'eggetarian' | 'nonveg' | 'vegan' | 'jain'

export type Goal =
  | 'lose_weight'
  | 'maintain'
  | 'gain_muscle'
  | 'manage_condition'
  | 'general_wellness'

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export type CostTier = 1 | 2 | 3 | 4 | 5

export type Season = 'summer' | 'monsoon' | 'winter' | 'all'

export type MedicalConditionId =
  | 'diabetes'
  | 'ckd'
  | 'hypertension'
  | 'pregnancy'
  | 'thyroid'
  | 'pcos'
  | 'children'
  | 'elderly'

export interface NutrientProfile {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  sodiumMg?: number
  potassiumMg?: number
  ironMg?: number
  calciumMg?: number
  vitaminDMcg?: number
  glycemicIndex?: number
  glycemicLoad?: number
}

/** Role a plate part plays toward a balanced Indian meal. */
export type PlateRole = 'carb' | 'protein' | 'vegetable' | 'dairy' | 'fat' | 'fruit'

/** Named component of a meal (not a recipe — what the plate should include). */
export interface PlatePart {
  name: string
  roles: PlateRole[]
  /** Soft add-on; counted as a recommendation if its roles are otherwise missing. */
  optional?: boolean
}

export interface User {
  id: string
  createdAt: string
  updatedAt: string
  onboardingComplete: boolean
}

export interface Profile {
  id: string
  userId: string
  age: number
  gender: Gender
  heightCm: number
  weightKg: number
  stateCode: string
  districtId: string
  foodPreference: FoodPreference
  goal: Goal
  activityLevel: ActivityLevel
  createdAt: string
  updatedAt: string
}

export interface ConditionRecord {
  id: string
  userId: string
  conditionId: MedicalConditionId
  notes?: string
  createdAt: string
}

export interface PreferenceRecord {
  id: string
  userId: string
  key: string
  value: string
  updatedAt: string
}

export interface Region {
  id: string
  stateCode: string
  name: string
  nameHi?: string
}

export interface District {
  id: string
  stateCode: string
  name: string
  nameHi?: string
}

export interface SeasonRecord {
  id: string
  name: Season
  months: number[]
}

export interface Food {
  id: string
  name: string
  translations: Record<string, string>
  mealTypes: MealType[]
  stateCodes: string[]
  districtIds: string[]
  seasons: Season[]
  category: string
  isVeg: boolean
  isVegan: boolean
  isJain: boolean
  costTier: CostTier
  availability: 'common' | 'seasonal' | 'rare'
  nutrition: NutrientProfile
  allergens: string[]
  religiousRestrictions: string[]
  medicalSuitability: Partial<Record<MedicalConditionId, 'suitable' | 'limit' | 'avoid'>>
  popularity: number
  prepTimeMinutes: number
  shelfLifeDays?: number
  storageNotes?: string
}

export interface Nutrient {
  id: string
  foodId: string
  key: keyof NutrientProfile
  value: number
  unit: string
}

export interface MealPlan {
  id: string
  userId: string
  weekStartDate: string
  createdAt: string
  updatedAt: string
}

export interface Meal {
  id: string
  mealPlanId: string
  date: string
  mealType: MealType
  foodId: string
  servings: number
  explanation?: string
  createdAt: string
}

export interface ShoppingList {
  id: string
  userId: string
  mealPlanId: string
  items: ShoppingItem[]
  createdAt: string
  updatedAt: string
}

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: string
  checked: boolean
  foodId?: string
  category?: string
}

export interface Feedback {
  id: string
  userId: string
  mealId?: string
  foodId?: string
  rating: 1 | 2 | 3 | 4 | 5
  note?: string
  createdAt: string
}

export interface RuleRecord {
  id: string
  conditionId: MedicalConditionId
  priority: number
  description: string
  /** Serialized rule payload evaluated by Rule Engine. */
  payload: string
}

export interface WaterLog {
  id: string
  userId: string
  date: string
  amountMl: number
  createdAt: string
}

export interface NutritionTargets {
  bmi: number
  bmiCategory: string
  bmr: number
  tdee: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  waterMl: number
  sodiumMgMax: number
  mealSplit: Record<MealType, number>
  adjustmentNotes: string[]
}

export interface DecisionContext {
  profile: Profile
  conditions: MedicalConditionId[]
  preferences: Record<string, string>
  regionStateCode: string
  districtId: string
  season: Season
  pantryFoodIds: string[]
  budgetTier: CostTier
  schedule: Partial<Record<MealType, boolean>>
  date: string
  /** Soft-avoid these foods for weekly variety (still usable if pool is tiny). */
  excludeFoodIds?: string[]
}

export interface DecisionResult {
  meals: Array<{
    mealType: MealType
    foodId: string
    servings: number
    explanation: string
    score: number
    ruleNotes: string[]
  }>
  targets: NutritionTargets
  appliedRuleIds: string[]
  sources: string[]
  blockedFoodCount: number
  candidateFoodCount: number
}
