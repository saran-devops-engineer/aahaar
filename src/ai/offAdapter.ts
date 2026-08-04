import type { AiAdapter } from '@/ai/types'

/** Explicit AI-off mode — returns engine facts with minimal phrasing. */
export const offAiAdapter: AiAdapter = {
  async explainRecommendation(request) {
    const composition =
      request.platePartSummaries.length > 0
        ? ` Plate: ${request.platePartSummaries.join('; ')}.`
        : ''
    const gaps =
      request.gapRecommendations.length > 0
        ? ` Gaps: ${request.gapRecommendations.join(' ')}`
        : ''
    const why = request.reasons.join(' · ') || 'Fits targets'
    return `${request.foodName}: ${why}.${composition} ${request.balanceVerdict}${gaps}`
  },

  async rankSubstitutions(request) {
    return request.candidates.slice(0, 5).map((candidate) => ({
      foodId: candidate.foodId,
      blurb: candidate.foodName,
    }))
  },

  async motivate() {
    return 'Plan your meals. Rules decide; you choose.'
  },

  async preferVariety(request) {
    return request.candidateFoodIds
  },
}
