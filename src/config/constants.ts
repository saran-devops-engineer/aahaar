/** Application-wide constants. No magic numbers in engines or UI. */

export const APP_NAME = 'AAHAAR'
export const APP_TAGLINE = 'What should I eat today?'

export const DB_NAME = 'aahaar'
export const DB_VERSION = 3

/** Default meal calorie split ratios (must sum to 1). */
export const MEAL_SPLIT = {
  breakfast: 0.25,
  lunch: 0.35,
  snack: 0.1,
  dinner: 0.3,
} as const

/** Macro calorie densities (kcal per gram). */
export const MACRO_KCAL_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
  fiber: 2,
} as const

/** Water recommendation baseline (ml per kg body weight). */
export const WATER_ML_PER_KG = 35

/** Activity multipliers for TDEE (Mifflin-St Jeor × activity). */
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
} as const

export type ActivityLevel = keyof typeof ACTIVITY_MULTIPLIERS

/** Calorie floors (kcal/day) — never go below these without clinician override. */
export const CALORIE_FLOOR_ADULT = 1200
export const CALORIE_FLOOR_CHILD = 1400
export const CALORIE_FLOOR_ELDERLY = 1300

/** Extra daily calories in pregnancy (2nd/3rd trimester planning default). */
export const PREGNANCY_EXTRA_KCAL = 300

/** Sodium planning defaults (mg/day). */
export const SODIUM_DEFAULT_MAX_MG = 2000
export const SODIUM_HYPERTENSION_MAX_MG = 1500

/** Glycemic Index thresholds used by rules. */
export const GI_LIMIT_THRESHOLD = 70
export const GI_DIABETES_LIMIT_THRESHOLD = 55
