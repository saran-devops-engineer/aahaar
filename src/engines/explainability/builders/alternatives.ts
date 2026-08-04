import { MAX_ALTERNATIVES } from '@/engines/explainability/constants'
import { messageForReasonCode, msg } from '@/engines/explainability/templates/messages'
import type {
  AlternativeExplanation,
  ExplanationInput,
} from '@/engines/explainability/types'

/**
 * Alternatives / rejections — ONLY from DecisionRecord.rejectedMeals + candidates.
 */
export function buildAlternatives(input: ExplanationInput): AlternativeExplanation[] {
  const { decision, foodNames } = input
  const out: AlternativeExplanation[] = []

  for (const rejected of decision.rejectedMeals.slice(0, MAX_ALTERNATIVES)) {
    out.push(
      Object.freeze({
        foodId: rejected.foodId,
        foodName: rejected.foodName ?? foodNames?.[rejected.foodId],
        status: 'rejected',
        reasonCodes: Object.freeze([...rejected.reasonCodes]),
        messages: Object.freeze(
          rejected.reasonCodes.map((code) => messageForReasonCode(code)),
        ),
      }),
    )
  }

  const rejectedIds = new Set(decision.rejectedMeals.map((r) => r.foodId))
  for (const candidate of decision.candidateMeals) {
    if (candidate.foodId === decision.acceptedMeal) continue
    if (rejectedIds.has(candidate.foodId)) continue
    if (out.length >= MAX_ALTERNATIVES) break
    out.push(
      Object.freeze({
        foodId: candidate.foodId,
        foodName: foodNames?.[candidate.foodId],
        status: 'considered',
        reasonCodes: Object.freeze([...candidate.reasonCodes]),
        messages: Object.freeze(
          candidate.reasonCodes.length > 0
            ? candidate.reasonCodes.map((c) => messageForReasonCode(c))
            : [msg('alt.considered', 'Considered as alternative')],
        ),
        score: candidate.score,
      }),
    )
  }

  for (const altId of decision.alternatives) {
    if (altId === decision.acceptedMeal) continue
    if (out.some((a) => a.foodId === altId)) continue
    if (out.length >= MAX_ALTERNATIVES) break
    out.push(
      Object.freeze({
        foodId: altId,
        foodName: foodNames?.[altId],
        status: 'alternative',
        reasonCodes: Object.freeze([]),
        messages: Object.freeze([
          msg('alt.listed', 'Listed as alternative in decision memory'),
        ]),
      }),
    )
  }

  return out
}
