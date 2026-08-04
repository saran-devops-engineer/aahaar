/**
 * Nutrition Confidence Engine (NCE).
 * Deterministic confidence 0–100. No AI. No cloud. No UI.
 */
export {
  calculateConfidence,
  calculateConfidenceFor,
  calculateConfidenceFromDecision,
  confidenceInputFromDecision,
  computeConfidenceAnalytics,
  DEFAULT_CONFIDENCE_WEIGHTS,
  explainConfidence,
  explainConfidenceFor,
  getConfidence,
  getConfidenceAnalytics,
  getConfidenceWeights as getWeights,
  getSignals,
  resetConfidenceCache,
  assertMedicalHighest,
  api as confidenceApi,
} from '@/engines/confidence/api'

export { weightedConfidenceScore } from '@/engines/confidence/calculator/calculate'
export { buildConfidenceSignals, computeMissingImpact } from '@/engines/confidence/signals/buildSignals'
export { normalizeWeights } from '@/engines/confidence/weights'
export { CONFIDENCE_VERSION } from '@/engines/confidence/constants'

export type {
  ConfidenceAnalytics,
  ConfidenceExplanation,
  ConfidenceInput,
  ConfidenceLevel,
  ConfidenceResult,
  ConfidenceSafetyAction,
  ConfidenceSignal,
  ConfidenceSignalSource,
  ConfidenceSignalType,
  ConfidenceVersion,
  ConfidenceWeights,
} from '@/engines/confidence/types'
