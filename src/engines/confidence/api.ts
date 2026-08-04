import { computeConfidenceAnalytics } from '@/engines/confidence/analytics'
import { calculateConfidence } from '@/engines/confidence/calculator/calculate'
import {
  calculateConfidenceFromDecision,
  confidenceInputFromDecision,
} from '@/engines/confidence/models/fromDecision'
import { explainConfidence } from '@/engines/confidence/models/explain'
import { DEFAULT_CONFIDENCE_WEIGHTS } from '@/engines/confidence/constants'
import { getWeights, normalizeWeights, assertMedicalHighest } from '@/engines/confidence/weights'
import type {
  ConfidenceAnalytics,
  ConfidenceExplanation,
  ConfidenceInput,
  ConfidenceResult,
  ConfidenceSignal,
  ConfidenceWeights,
} from '@/engines/confidence/types'

const memory = new Map<string, ConfidenceResult>()
const history: ConfidenceResult[] = []
const MAX_HISTORY = 200

/**
 * Calculate and cache confidence for a recommendation.
 */
export function calculateConfidenceFor(
  input: ConfidenceInput = {},
): ConfidenceResult {
  const result = calculateConfidence(input)
  memory.set(result.recommendationId, result)
  history.push(result)
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY)
  return result
}

export function getConfidence(recommendationId: string): ConfidenceResult | undefined {
  return memory.get(recommendationId)
}

export function getSignals(recommendationId: string): readonly ConfidenceSignal[] {
  return memory.get(recommendationId)?.signals ?? Object.freeze([])
}

export function getConfidenceWeights(
  overrides?: Partial<ConfidenceWeights>,
): ConfidenceWeights {
  return normalizeWeights(getWeights(overrides))
}

export function explainConfidenceFor(
  recommendationIdOrResult: string | ConfidenceResult,
): ConfidenceExplanation | undefined {
  const result =
    typeof recommendationIdOrResult === 'string'
      ? memory.get(recommendationIdOrResult)
      : recommendationIdOrResult
  if (!result) return undefined
  return explainConfidence(result)
}

export function getConfidenceAnalytics(
  results?: readonly ConfidenceResult[],
): ConfidenceAnalytics {
  return computeConfidenceAnalytics(results ?? history)
}

export function resetConfidenceCache(): void {
  memory.clear()
  history.length = 0
}

// Spec-named exports
export {
  calculateConfidence,
  calculateConfidenceFor as calculateConfidenceCached,
  explainConfidence,
  getWeights as getDefaultWeights,
}

/** Spec alias: calculateConfidence / getConfidence / getSignals / getWeights / explainConfidence */
export const api = {
  calculateConfidence: calculateConfidenceFor,
  getConfidence,
  getSignals,
  getWeights: getConfidenceWeights,
  explainConfidence: explainConfidenceFor,
} as const

export {
  assertMedicalHighest,
  calculateConfidenceFromDecision,
  confidenceInputFromDecision,
  computeConfidenceAnalytics,
  DEFAULT_CONFIDENCE_WEIGHTS,
}
