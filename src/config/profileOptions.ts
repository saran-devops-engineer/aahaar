import type { ActivityLevel } from '@/config/constants'
import type {
  CostTier,
  FoodPreference,
  Goal,
  MedicalConditionId,
} from '@/types/domain'

export const PREFERENCE_KEYS = {
  allergens: 'allergens',
  religious: 'religious',
  budgetTier: 'budgetTier',
  pantry: 'pantry',
  waterReminders: 'waterReminders',
  aiMode: 'aiMode',
} as const

export type PreferenceKey = (typeof PREFERENCE_KEYS)[keyof typeof PREFERENCE_KEYS]

export const MEDICAL_CONDITION_OPTIONS: Array<{
  id: MedicalConditionId
  label: string
  description: string
}> = [
  {
    id: 'diabetes',
    label: 'Diabetes',
    description: 'Lower GI emphasis and carb moderation',
  },
  {
    id: 'hypertension',
    label: 'Hypertension',
    description: 'Sodium limits on meal picks',
  },
  {
    id: 'ckd',
    label: 'Kidney (CKD)',
    description: 'Moderated protein targets',
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    description: 'Extra calories and protein',
  },
  {
    id: 'thyroid',
    label: 'Thyroid',
    description: 'Suitability-aware food filtering',
  },
  {
    id: 'pcos',
    label: 'PCOS',
    description: 'Lower GI preference',
  },
  {
    id: 'children',
    label: 'Child profile',
    description: 'Growing-years calorie floor',
  },
  {
    id: 'elderly',
    label: 'Elderly',
    description: 'Protein and hydration emphasis',
  },
]

export const ALLERGEN_OPTIONS = [
  { id: 'dairy', label: 'Dairy' },
  { id: 'gluten', label: 'Gluten' },
  { id: 'peanut', label: 'Peanut' },
  { id: 'egg', label: 'Egg' },
  { id: 'fish', label: 'Fish' },
  { id: 'coconut', label: 'Coconut' },
] as const

export const RELIGIOUS_OPTIONS = [
  { id: 'jain', label: 'Jain restrictions' },
  { id: 'vegetarian', label: 'Strict vegetarian' },
  { id: 'hindu-some', label: 'Avoid beef / some meats' },
  { id: 'vegan', label: 'Vegan practice' },
] as const

export const FOOD_PREFERENCE_OPTIONS: Array<{
  value: FoodPreference
  label: string
}> = [
  { value: 'veg', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'nonveg', label: 'Non-vegetarian' },
  { value: 'jain', label: 'Jain' },
]

export const GOAL_OPTIONS: Array<{ value: Goal; label: string }> = [
  { value: 'general_wellness', label: 'Feel better day to day' },
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain_muscle', label: 'Gain muscle' },
  { value: 'manage_condition', label: 'Manage a condition' },
]

export const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string }> = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Lightly active' },
  { value: 'moderate', label: 'Moderately active' },
  { value: 'active', label: 'Active' },
  { value: 'veryActive', label: 'Very active' },
]

export const BUDGET_OPTIONS: Array<{ value: CostTier; label: string }> = [
  { value: 1, label: 'Very tight' },
  { value: 2, label: 'Budget' },
  { value: 3, label: 'Balanced' },
  { value: 4, label: 'Comfortable' },
  { value: 5, label: 'Flexible' },
]
