import { DEFAULT_CONFIDENCE_WEIGHTS } from '@/engines/confidence/constants'
import type { ConfidenceSignalType, ConfidenceWeights } from '@/engines/confidence/types'

export function getWeights(
  overrides?: Partial<ConfidenceWeights>,
): ConfidenceWeights {
  if (!overrides) return DEFAULT_CONFIDENCE_WEIGHTS
  return Object.freeze({
    ...DEFAULT_CONFIDENCE_WEIGHTS,
    ...overrides,
  })
}

export function weightFor(
  weights: ConfidenceWeights,
  signal: ConfidenceSignalType,
): number {
  return weights[signal] ?? 0
}

/** Normalize so weights sum to 100 (deterministic). */
export function normalizeWeights(weights: ConfidenceWeights): ConfidenceWeights {
  const entries = Object.entries(weights) as [keyof ConfidenceWeights, number][]
  const sum = entries.reduce((acc, [, w]) => acc + Math.max(0, w), 0)
  if (sum <= 0) return DEFAULT_CONFIDENCE_WEIGHTS
  const scale = 100 / sum
  const next = {} as Record<keyof ConfidenceWeights, number>
  for (const [key, w] of entries) {
    next[key] = Math.round(Math.max(0, w) * scale * 100) / 100
  }
  return Object.freeze(next as ConfidenceWeights)
}

export function assertMedicalHighest(weights: ConfidenceWeights): boolean {
  return (
    weights.medical >= weights.nutrition &&
    weights.nutrition >= weights.learning &&
    weights.learning >= weights.knowledge
  )
}
