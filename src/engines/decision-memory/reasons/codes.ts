import type { ReasonCode, RejectionReasonCode } from '@/engines/decision-memory/types'
import { ALL_REASON_CODES, ALL_REJECTION_CODES } from '@/engines/decision-memory/constants'

const reasonSet = new Set<string>(ALL_REASON_CODES)
const rejectionSet = new Set<string>(ALL_REJECTION_CODES)

export function isReasonCode(value: string): value is ReasonCode {
  return reasonSet.has(value)
}

export function isRejectionReasonCode(value: string): value is RejectionReasonCode {
  return rejectionSet.has(value)
}

/** Map free-text ranking/rule phrases into stable ReasonCodes (deterministic). */
export function mapTextToReasonCodes(texts: readonly string[]): ReasonCode[] {
  const codes = new Set<ReasonCode>()
  for (const text of texts) {
    const t = text.toLowerCase()
    if (/protein/.test(t)) codes.add('HIGH_PROTEIN')
    if (/glycemic|low.?gi|gi\b/.test(t)) codes.add('LOW_GI')
    if (/summer/.test(t)) codes.add('SUMMER')
    if (/monsoon/.test(t)) codes.add('MONSOON')
    if (/winter/.test(t)) codes.add('WINTER')
    if (/rice.?belt|andhra|tamil|south indian|rice meal/.test(t)) codes.add('RICE_BELT')
    if (/afford|budget|cheap|cost/.test(t)) codes.add('LOW_BUDGET')
    if (/iron/.test(t)) codes.add('HIGH_IRON')
    if (/fibre|fiber/.test(t)) codes.add('HIGH_FIBER')
    if (/calcium/.test(t)) codes.add('HIGH_CALCIUM')
    if (/pregnan/.test(t)) codes.add('PREGNANCY_SAFE')
    if (/\bvegan\b/.test(t)) codes.add('VEGAN')
    if (/vegetarian|\bveg\b/.test(t)) codes.add('VEGETARIAN')
    if (/andhra/.test(t)) codes.add('ANDHRA_CUISINE')
    if (/tamil/.test(t)) codes.add('TAMIL_CUISINE')
    if (/south indian/.test(t)) codes.add('SOUTH_INDIAN')
    if (/north indian|punjabi/.test(t)) codes.add('NORTH_INDIAN')
    if (/regional|district|state/.test(t)) codes.add('REGIONAL_MATCH')
    if (/family|child|kid/.test(t)) codes.add('FAMILY_FRIENDLY')
    if (/quick|prep|fast/.test(t)) codes.add('LOW_PREP_TIME')
    if (/satiety|filling/.test(t)) codes.add('HIGH_SATIETY')
    if (/balanced plate|carb \+ protein/.test(t)) codes.add('BALANCED_PLATE')
    if (/pantry/.test(t)) codes.add('PANTRY_MATCH')
    if (/learning preference \(\+/.test(t)) codes.add('LEARNING_BOOST')
    if (/learning preference \(-|diversity penalty/.test(t)) codes.add('LEARNING_PENALTY')
    if (/already used|recent/.test(t)) codes.add('RECENTLY_SERVED')
    if (/diabetes/.test(t)) codes.add('DIABETES_SAFE')
    if (/ckd|kidney/.test(t)) codes.add('CKD_SAFE')
    if (/hypertens|sodium/.test(t)) codes.add('HYPERTENSION_SAFE')
    if (/allergen|allergy/.test(t)) codes.add('ALLERGEN')
    if (/religious|jain|halal/.test(t)) codes.add('RELIGIOUS_RESTRICTION')
  }
  if (codes.size === 0) codes.add('DEFAULT_BALANCE')
  return [...codes]
}

export function mapRuleIdToReasonCodes(ruleIds: readonly string[]): ReasonCode[] {
  const codes = new Set<ReasonCode>()
  for (const id of ruleIds) {
    const r = id.toLowerCase()
    if (r.includes('diabetes')) codes.add('DIABETES_SAFE')
    if (r.includes('ckd')) codes.add('CKD_SAFE')
    if (r.includes('hypertension') || r.includes('sodium')) codes.add('HYPERTENSION_SAFE')
    if (r.includes('pregnancy')) codes.add('PREGNANCY_SAFE')
    if (r.includes('allergen')) codes.add('ALLERGEN')
    if (r.includes('religious')) codes.add('RELIGIOUS_RESTRICTION')
    if (r.includes('food-preference')) codes.add('DIET_MISMATCH')
    if (r.includes('diabetes') || r.includes('ckd') || r.includes('pregnancy')) {
      codes.add('MEDICAL_ALLOW')
    }
  }
  return [...codes]
}

export function mapBlockedToRejection(
  ruleId: string,
  reasonText?: string,
): { codes: RejectionReasonCode[]; contextTag?: string } {
  const r = `${ruleId} ${reasonText ?? ''}`.toLowerCase()
  const codes: RejectionReasonCode[] = []
  let contextTag: string | undefined

  if (/diabetes|gi|glycemic/.test(r)) {
    codes.push('HIGH_GI', 'MEDICAL_BLOCK')
    contextTag = 'diabetes'
  }
  if (/ckd|protein|kidney/.test(r)) {
    codes.push('MEDICAL_BLOCK')
    contextTag = contextTag ?? 'ckd'
  }
  if (/hypertens|sodium/.test(r)) {
    codes.push('HIGH_SODIUM', 'MEDICAL_BLOCK')
    contextTag = contextTag ?? 'hypertension'
  }
  if (/pregnan/.test(r)) {
    codes.push('MEDICAL_BLOCK')
    contextTag = contextTag ?? 'pregnancy'
  }
  if (/allergen|allergy/.test(r)) codes.push('ALLERGEN')
  if (/religious/.test(r)) codes.push('RELIGIOUS_RESTRICTION')
  if (/food-preference|veg|vegan|jain/.test(r)) codes.push('DIET_MISMATCH')
  if (/fat|butter|cream/.test(r)) codes.push('HIGH_SATURATED_FAT')
  if (/budget|cost/.test(r)) codes.push('BUDGET_EXCEEDED')
  if (/season/.test(r)) codes.push('OUT_OF_SEASON')
  if (/dislike/.test(r)) codes.push('USER_DISLIKE')
  if (/yesterday|recent|already/.test(r)) codes.push('ALREADY_SERVED')

  if (codes.length === 0) codes.push('MEDICAL_BLOCK')
  return { codes: [...new Set(codes)], contextTag }
}
