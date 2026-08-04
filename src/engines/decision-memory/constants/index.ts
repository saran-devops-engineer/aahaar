import type { DecisionMemoryVersion, ReasonCode, RejectionReasonCode } from '@/engines/decision-memory/types'

export const DECISION_MEMORY_VERSION: DecisionMemoryVersion = '1.5.0'

export const DECISION_MEMORY_PREF_KEY = 'decisionMemory'

/** Keep full DecisionRecords for this many days; older ones compress into stats. */
export const DEFAULT_RETENTION_DAYS = 90

/** Hard cap on in-memory full records even within retention window. */
export const MAX_FULL_RECORDS = 400

/** Max candidates stored per decision (top ranked). */
export const MAX_CANDIDATES_STORED = 8

/** Max rejected foods stored per decision. */
export const MAX_REJECTED_STORED = 24

export const ALL_REASON_CODES: readonly ReasonCode[] = Object.freeze([
  'HIGH_PROTEIN',
  'LOW_GI',
  'SUMMER',
  'MONSOON',
  'WINTER',
  'RICE_BELT',
  'LOW_BUDGET',
  'HIGH_IRON',
  'HIGH_FIBER',
  'HIGH_CALCIUM',
  'PREGNANCY_SAFE',
  'VEGAN',
  'VEGETARIAN',
  'EGGETARIAN',
  'ANDHRA_CUISINE',
  'TAMIL_CUISINE',
  'SOUTH_INDIAN',
  'NORTH_INDIAN',
  'REGIONAL_MATCH',
  'FAMILY_FRIENDLY',
  'LOW_PREP_TIME',
  'HIGH_SATIETY',
  'BALANCED_PLATE',
  'PANTRY_MATCH',
  'LIKED_PREVIOUSLY',
  'LEARNING_BOOST',
  'LEARNING_PENALTY',
  'DIVERSITY',
  'RECENTLY_SERVED',
  'MEDICAL_ALLOW',
  'MEDICAL_LIMIT',
  'MEDICAL_BLOCK',
  'DIABETES_SAFE',
  'CKD_SAFE',
  'HYPERTENSION_SAFE',
  'HIGH_SATURATED_FAT',
  'HIGH_SODIUM',
  'HIGH_GI',
  'ALLERGEN',
  'RELIGIOUS_RESTRICTION',
  'DIET_MISMATCH',
  'BUDGET_EXCEEDED',
  'OUT_OF_SEASON',
  'USER_DISLIKE',
  'ALREADY_SERVED',
  'EXCLUDED',
  'POOL_WIDENED',
  'DEFAULT_BALANCE',
])

export const ALL_REJECTION_CODES: readonly RejectionReasonCode[] = Object.freeze([
  'HIGH_SATURATED_FAT',
  'HIGH_SODIUM',
  'HIGH_GI',
  'MEDICAL_BLOCK',
  'DIABETES_SAFE',
  'CKD_SAFE',
  'HYPERTENSION_SAFE',
  'PREGNANCY_SAFE',
  'ALLERGEN',
  'RELIGIOUS_RESTRICTION',
  'DIET_MISMATCH',
  'BUDGET_EXCEEDED',
  'OUT_OF_SEASON',
  'USER_DISLIKE',
  'ALREADY_SERVED',
  'EXCLUDED',
  'RECENTLY_SERVED',
  'LEARNING_PENALTY',
  'DIVERSITY',
  'LOW_RANK',
])

/** Engine version placeholders when upstream engines do not export versions. */
export const RULE_VERSION = '1.5.0'
export const NUTRITION_VERSION = '1.5.0'
