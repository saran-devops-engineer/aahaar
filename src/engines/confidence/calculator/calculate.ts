import {
  CONFIDENCE_VERSION,
  LEVEL_LOW_MAX,
  LEVEL_MEDIUM_MAX,
  SAFETY_ASK_USER_MAX,
  SAFETY_REVIEW_MAX,
} from '@/engines/confidence/constants'
import {
  buildConfidenceSignals,
  computeMissingImpact,
} from '@/engines/confidence/signals/buildSignals'
import { clampScore, validateInput, validateSignals } from '@/engines/confidence/validators'
import { getWeights, normalizeWeights } from '@/engines/confidence/weights'
import type {
  ConfidenceInput,
  ConfidenceLevel,
  ConfidenceResult,
  ConfidenceSafetyAction,
  ConfidenceSignal,
} from '@/engines/confidence/types'
import { createId } from '@/shared/utils/id'

function levelFromScore(score: number): ConfidenceLevel {
  if (score <= LEVEL_LOW_MAX) return 'low'
  if (score <= LEVEL_MEDIUM_MAX) return 'medium'
  return 'high'
}

function safetyFromScore(score: number): ConfidenceSafetyAction {
  if (score <= SAFETY_ASK_USER_MAX) return 'ask_user'
  if (score <= SAFETY_REVIEW_MAX) return 'review'
  return 'auto_recommend'
}

/**
 * Weighted average of signal scores.
 * Final = Σ(score × weight) / Σ(weight)
 */
export function weightedConfidenceScore(signals: readonly ConfidenceSignal[]): number {
  let num = 0
  let den = 0
  for (const s of signals) {
    if (s.weight <= 0) continue
    num += s.score * s.weight
    den += s.weight
  }
  if (den <= 0) return 0
  return clampScore(num / den)
}

export function calculateConfidence(input: ConfidenceInput = {}): ConfidenceResult {
  validateInput(input)
  const timestamp = input.timestamp ?? new Date().toISOString()
  const weights = normalizeWeights(getWeights(input.weights))
  const signals = Object.freeze(buildConfidenceSignals(input, weights, timestamp))
  validateSignals(signals)

  const score = weightedConfidenceScore(signals)
  const level = levelFromScore(score)
  const safetyAction = safetyFromScore(score)
  const missingImpact = computeMissingImpact(signals)

  const top = [...signals].sort((a, b) => b.score * b.weight - a.score * a.weight)
  const reasons = Object.freeze(
    top.slice(0, 5).map((s) => `${s.signal}: ${s.score} (${s.reason})`),
  )

  const explanation = buildExplanationText(score, level, safetyAction, signals, missingImpact)

  return Object.freeze({
    version: CONFIDENCE_VERSION,
    recommendationId: input.recommendationId ?? createId('conf'),
    foodId: input.foodId,
    mealType: input.mealType,
    score,
    level,
    safetyAction,
    signals,
    weights,
    missingImpact,
    explanation,
    reasons,
    timestamp,
  })
}

function buildExplanationText(
  score: number,
  level: ConfidenceLevel,
  safety: ConfidenceSafetyAction,
  signals: readonly ConfidenceSignal[],
  missingImpact: number,
): string {
  const medical = signals.find((s) => s.signal === 'medical')
  const nutrition = signals.find((s) => s.signal === 'nutrition')
  const learning = signals.find((s) => s.signal === 'learning')
  const pantry = signals.find((s) => s.signal === 'pantry')
  const parts = [
    `Confidence ${score}/100 (${level}).`,
    medical ? `Medical ${medical.score}.` : null,
    nutrition ? `Nutrition ${nutrition.score}.` : null,
    learning ? `Learning ${learning.score}.` : null,
    pantry?.unknown ? 'Pantry unknown.' : pantry ? `Pantry ${pantry.score}.` : null,
    missingImpact > 0 ? `Missing-info impact −${missingImpact}.` : null,
    safety === 'ask_user'
      ? 'Recommend asking the user.'
      : safety === 'auto_recommend'
        ? 'Safe to recommend automatically.'
        : 'Review before auto-apply.',
  ]
  return parts.filter(Boolean).join(' ')
}
