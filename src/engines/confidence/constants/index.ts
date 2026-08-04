import type { ConfidenceWeights } from '@/engines/confidence/types'

export const CONFIDENCE_VERSION = '2.0.0' as const

/** Default weights — Medical > Nutrition > Learning > rest. Sum ≈ 100 for readability. */
export const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = Object.freeze({
  medical: 22,
  nutrition: 16,
  learning: 12,
  knowledge: 8,
  context: 6,
  region: 6,
  budget: 5,
  preference: 5,
  variety: 5,
  history: 5,
  season: 4,
  pantry: 3,
  data_quality: 3,
})

export const CONFIDENCE_MIN = 0
export const CONFIDENCE_MAX = 100

/** Level thresholds on final score. */
export const LEVEL_LOW_MAX = 55
export const LEVEL_MEDIUM_MAX = 80

/** Safety actions from score. */
export const SAFETY_ASK_USER_MAX = 55
export const SAFETY_REVIEW_MAX = 80

/** Soft penalties when information is missing (applied inside signals). */
export const MISSING_PANTRY_PENALTY = 18
export const MISSING_ALLERGEN_PENALTY = 22
export const MISSING_WEIGHT_PENALTY = 15
export const MISSING_WEATHER_PENALTY = 4
export const UNKNOWN_SIGNAL_SCORE = 50

export const ANALYTICS_UNCERTAIN_LIMIT = 10
