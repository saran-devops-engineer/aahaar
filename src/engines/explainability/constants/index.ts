import type {
  ExplanationAudience,
  ExplanationSectionId,
  ExplanationTemplateId,
  ExplainabilityVersion,
} from '@/engines/explainability/types'

export const EXPLAINABILITY_VERSION: ExplainabilityVersion = '2.0.0'

export const DEFAULT_AUDIENCE: ExplanationAudience = 'user'
export const DEFAULT_TEMPLATE: ExplanationTemplateId = 'general_health'
export const DEFAULT_LOCALE = 'en'

export const SECTION_ORDER: readonly ExplanationSectionId[] = Object.freeze([
  'why_this_meal',
  'why_today',
  'why_not_another',
  'medical',
  'nutrition',
  'regional',
  'budget',
  'preparation',
  'learning',
  'confidence',
  'future_improvements',
])

/** Reason codes treated as medical evidence. */
export const MEDICAL_REASON_CODES = Object.freeze(
  new Set([
    'PREGNANCY_SAFE',
    'MEDICAL_ALLOW',
    'MEDICAL_LIMIT',
    'MEDICAL_BLOCK',
    'DIABETES_SAFE',
    'CKD_SAFE',
    'HYPERTENSION_SAFE',
    'HIGH_GI',
    'HIGH_SODIUM',
    'HIGH_SATURATED_FAT',
    'ALLERGEN',
  ]),
)

export const NUTRITION_REASON_CODES = Object.freeze(
  new Set([
    'HIGH_PROTEIN',
    'LOW_GI',
    'HIGH_IRON',
    'HIGH_FIBER',
    'HIGH_CALCIUM',
    'HIGH_SATIETY',
    'BALANCED_PLATE',
  ]),
)

export const REGIONAL_REASON_CODES = Object.freeze(
  new Set([
    'RICE_BELT',
    'ANDHRA_CUISINE',
    'TAMIL_CUISINE',
    'SOUTH_INDIAN',
    'NORTH_INDIAN',
    'REGIONAL_MATCH',
  ]),
)

export const LEARNING_REASON_CODES = Object.freeze(
  new Set(['LIKED_PREVIOUSLY', 'LEARNING_BOOST', 'LEARNING_PENALTY']),
)

export const MAX_EVIDENCE = 16
export const MAX_ALTERNATIVES = 8
export const MAX_ANALYTICS_TOP = 10
