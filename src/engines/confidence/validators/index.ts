import { CONFIDENCE_MAX, CONFIDENCE_MIN } from '@/engines/confidence/constants'
import type { ConfidenceInput, ConfidenceSignal } from '@/engines/confidence/types'

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return CONFIDENCE_MIN
  return Math.max(CONFIDENCE_MIN, Math.min(CONFIDENCE_MAX, Math.round(score)))
}

export function validateInput(input: ConfidenceInput): void {
  if (input.nutrition?.decisionScore != null) {
    const s = input.nutrition.decisionScore
    if (!Number.isFinite(s) || s < 0) {
      throw new Error('nutrition.decisionScore must be a non-negative number')
    }
  }
  if (input.learning?.eventCount != null && input.learning.eventCount < 0) {
    throw new Error('learning.eventCount must be >= 0')
  }
}

export function validateSignals(signals: readonly ConfidenceSignal[]): void {
  for (const signal of signals) {
    if (signal.weight < 0) throw new Error(`Negative weight for ${signal.signal}`)
    if (signal.score < CONFIDENCE_MIN || signal.score > CONFIDENCE_MAX) {
      throw new Error(`Signal score out of range: ${signal.signal}`)
    }
  }
}
