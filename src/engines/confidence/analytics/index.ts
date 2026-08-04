import { ANALYTICS_UNCERTAIN_LIMIT } from '@/engines/confidence/constants'
import type { ConfidenceAnalytics, ConfidenceResult } from '@/engines/confidence/types'

export function computeConfidenceAnalytics(
  results: readonly ConfidenceResult[],
): ConfidenceAnalytics {
  if (results.length === 0) {
    return Object.freeze({
      averageConfidence: 0,
      highestConfidence: 0,
      lowestConfidence: 0,
      mostUncertain: Object.freeze([]),
      missingInformationImpact: 0,
      sampleCount: 0,
      byLevel: Object.freeze({ low: 0, medium: 0, high: 0 }),
      bySafetyAction: Object.freeze({
        ask_user: 0,
        review: 0,
        auto_recommend: 0,
      }),
    })
  }

  const scores = results.map((r) => r.score)
  const averageConfidence = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length,
  )
  const highestConfidence = Math.max(...scores)
  const lowestConfidence = Math.min(...scores)
  const mostUncertain = Object.freeze(
    [...results]
      .sort((a, b) => a.score - b.score || b.missingImpact - a.missingImpact)
      .slice(0, ANALYTICS_UNCERTAIN_LIMIT),
  )
  const missingInformationImpact =
    Math.round(
      (results.reduce((a, r) => a + r.missingImpact, 0) / results.length) * 10,
    ) / 10

  const byLevel = { low: 0, medium: 0, high: 0 }
  const bySafetyAction = { ask_user: 0, review: 0, auto_recommend: 0 }
  for (const r of results) {
    byLevel[r.level] += 1
    bySafetyAction[r.safetyAction] += 1
  }

  return Object.freeze({
    averageConfidence,
    highestConfidence,
    lowestConfidence,
    mostUncertain,
    missingInformationImpact,
    sampleCount: results.length,
    byLevel: Object.freeze(byLevel),
    bySafetyAction: Object.freeze(bySafetyAction),
  })
}
