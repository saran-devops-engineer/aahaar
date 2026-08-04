import type { MessageRef } from '@/engines/explainability/types'
import type { ReasonCode, RejectionReasonCode } from '@/engines/decision-memory/types'

/** Message catalog — keys are stable for i18n; defaultText is fallback only. */
export function msg(
  key: string,
  defaultText: string,
  params?: Readonly<Record<string, string | number | boolean>>,
): MessageRef {
  return Object.freeze({
    key,
    defaultText,
    ...(params ? { params: Object.freeze({ ...params }) } : {}),
  })
}

const REASON_MESSAGES: Record<string, { key: string; defaultText: string }> = {
  HIGH_PROTEIN: { key: 'evidence.high_protein', defaultText: 'High protein' },
  LOW_GI: { key: 'evidence.low_gi', defaultText: 'Lower glycemic impact' },
  SUMMER: { key: 'evidence.summer', defaultText: 'Suitable for summer' },
  MONSOON: { key: 'evidence.monsoon', defaultText: 'Suitable for monsoon' },
  WINTER: { key: 'evidence.winter', defaultText: 'Suitable for winter' },
  RICE_BELT: { key: 'evidence.rice_belt', defaultText: 'Fits rice-belt eating pattern' },
  LOW_BUDGET: { key: 'evidence.low_budget', defaultText: 'Budget friendly' },
  HIGH_IRON: { key: 'evidence.high_iron', defaultText: 'Higher iron contribution' },
  HIGH_FIBER: { key: 'evidence.high_fiber', defaultText: 'Higher fibre' },
  HIGH_CALCIUM: { key: 'evidence.high_calcium', defaultText: 'Higher calcium' },
  PREGNANCY_SAFE: { key: 'evidence.pregnancy_safe', defaultText: 'Pregnancy-safe filter passed' },
  VEGAN: { key: 'evidence.vegan', defaultText: 'Matches vegan preference' },
  VEGETARIAN: { key: 'evidence.vegetarian', defaultText: 'Matches vegetarian preference' },
  EGGETARIAN: { key: 'evidence.eggetarian', defaultText: 'Matches eggetarian preference' },
  ANDHRA_CUISINE: { key: 'evidence.andhra', defaultText: 'Matched Andhra cuisine' },
  TAMIL_CUISINE: { key: 'evidence.tamil', defaultText: 'Matched Tamil cuisine' },
  SOUTH_INDIAN: { key: 'evidence.south_indian', defaultText: 'Matched South Indian cuisine' },
  NORTH_INDIAN: { key: 'evidence.north_indian', defaultText: 'Matched North Indian cuisine' },
  REGIONAL_MATCH: { key: 'evidence.regional', defaultText: 'Regional match' },
  FAMILY_FRIENDLY: { key: 'evidence.family', defaultText: 'Family friendly' },
  LOW_PREP_TIME: { key: 'evidence.low_prep', defaultText: 'Lower preparation effort' },
  HIGH_SATIETY: { key: 'evidence.satiety', defaultText: 'Higher satiety' },
  BALANCED_PLATE: { key: 'evidence.balanced_plate', defaultText: 'Balanced plate signals' },
  PANTRY_MATCH: { key: 'evidence.pantry', defaultText: 'Uses pantry items' },
  LIKED_PREVIOUSLY: { key: 'evidence.liked_previously', defaultText: 'Previously liked' },
  LEARNING_BOOST: { key: 'evidence.learning_boost', defaultText: 'Boosted by your past choices' },
  LEARNING_PENALTY: { key: 'evidence.learning_penalty', defaultText: 'Reduced by learning signals' },
  DIVERSITY: { key: 'evidence.diversity', defaultText: 'Variety consideration' },
  RECENTLY_SERVED: { key: 'evidence.recently_served', defaultText: 'Recently served' },
  MEDICAL_ALLOW: { key: 'evidence.medical_allow', defaultText: 'Allowed by medical rules' },
  MEDICAL_LIMIT: { key: 'evidence.medical_limit', defaultText: 'Limited by medical rules' },
  MEDICAL_BLOCK: { key: 'evidence.medical_block', defaultText: 'Blocked by medical rules' },
  DIABETES_SAFE: { key: 'evidence.diabetes_safe', defaultText: 'Aligned with diabetes-safe rules' },
  CKD_SAFE: { key: 'evidence.ckd_safe', defaultText: 'Aligned with kidney-safe rules' },
  HYPERTENSION_SAFE: {
    key: 'evidence.hypertension_safe',
    defaultText: 'Aligned with blood-pressure-safe rules',
  },
  HIGH_SATURATED_FAT: {
    key: 'evidence.high_sat_fat',
    defaultText: 'Higher saturated fat concern',
  },
  HIGH_SODIUM: { key: 'evidence.high_sodium', defaultText: 'Higher sodium concern' },
  HIGH_GI: { key: 'evidence.high_gi', defaultText: 'Higher glycemic impact' },
  ALLERGEN: { key: 'evidence.allergen', defaultText: 'Allergen filter' },
  RELIGIOUS_RESTRICTION: {
    key: 'evidence.religious',
    defaultText: 'Religious restriction filter',
  },
  DIET_MISMATCH: { key: 'evidence.diet_mismatch', defaultText: 'Diet preference mismatch' },
  BUDGET_EXCEEDED: { key: 'evidence.budget_exceeded', defaultText: 'Over budget' },
  OUT_OF_SEASON: { key: 'evidence.out_of_season', defaultText: 'Out of season' },
  USER_DISLIKE: { key: 'evidence.user_dislike', defaultText: 'User dislikes' },
  ALREADY_SERVED: { key: 'evidence.already_served', defaultText: 'Already used recently' },
  EXCLUDED: { key: 'evidence.excluded', defaultText: 'Excluded from pool' },
  POOL_WIDENED: { key: 'evidence.pool_widened', defaultText: 'Candidate pool widened' },
  DEFAULT_BALANCE: { key: 'evidence.default_balance', defaultText: 'Balanced everyday choice' },
  LOW_RANK: { key: 'evidence.low_rank', defaultText: 'Lower ranking score' },
}

export function messageForReasonCode(
  code: ReasonCode | RejectionReasonCode | string,
): MessageRef {
  const entry = REASON_MESSAGES[code]
  if (entry) return msg(entry.key, entry.defaultText, { code })
  // Never invent meaning — surface the code itself.
  return msg('evidence.unknown_code', `Recorded code: ${code}`, { code })
}

export function resolveMessage(ref: MessageRef, _locale = 'en'): string {
  // Future: look up ref.key in locale tables. Deterministic fallback for now.
  let text = ref.defaultText
  if (ref.params) {
    for (const [k, v] of Object.entries(ref.params)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}
