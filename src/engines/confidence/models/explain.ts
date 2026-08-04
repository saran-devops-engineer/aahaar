import type {
  ConfidenceExplanation,
  ConfidenceResult,
} from '@/engines/confidence/types'

export function explainConfidence(result: ConfidenceResult): ConfidenceExplanation {
  const sorted = [...result.signals].sort((a, b) => b.score - a.score)
  const weakest = [...result.signals].sort((a, b) => a.score - b.score)
  const missingNotes = result.signals
    .filter((s) => s.unknown)
    .map((s) => `${s.signal}: ${s.reason}`)

  const formulaParts = result.signals.map(
    (s) => `${s.signal}(${s.score}×${s.weight})`,
  )
  const den = result.signals.reduce((acc, s) => acc + s.weight, 0)

  return Object.freeze({
    score: result.score,
    level: result.level,
    safetyAction: result.safetyAction,
    summary: result.explanation,
    topSignals: Object.freeze(sorted.slice(0, 4)),
    weakestSignals: Object.freeze(weakest.slice(0, 4)),
    missingNotes: Object.freeze(missingNotes),
    formula: `(${formulaParts.join(' + ')}) / ${den} = ${result.score}`,
  })
}
