import { msg } from '@/engines/explainability/templates/messages'
import type { ExplanationInput, MissingDataItem } from '@/engines/explainability/types'

/**
 * Missing data from Life Context / Confidence unknowns only — never invented.
 */
export function buildMissingData(input: ExplanationInput): MissingDataItem[] {
  const items: MissingDataItem[] = []
  const life = input.lifeContext
  const confidence = input.confidence

  const push = (
    field: string,
    key: string,
    defaultText: string,
    impact: MissingDataItem['impact'],
  ) => {
    items.push(
      Object.freeze({
        id: `missing_${field}`,
        field,
        impact,
        message: msg(key, defaultText, { field }),
      }),
    )
  }

  if (life) {
    if (life.pantryStatus === 'unknown' || life.missingFields.includes('pantryStatus')) {
      push('pantry', 'missing.pantry', 'Pantry unknown', 'high')
    }
    if (life.weather == null || life.missingFields.includes('weather')) {
      push('weather', 'missing.weather', 'Weather unavailable', 'low')
    }
    if (life.sleepQuality === 'unknown' || life.missingFields.includes('sleepQuality')) {
      push('sleep', 'missing.sleep', 'Sleep unavailable', 'medium')
    }
    if (life.stressLevel === 'unknown') {
      push('stress', 'missing.stress', 'Stress level unavailable', 'low')
    }
    if (life.placeholders.wearables == null) {
      push('wearables', 'missing.wearables', 'Wearables not connected', 'low')
    }
  } else {
    push('life_context', 'missing.life_context', 'Life context not supplied', 'medium')
  }

  if (confidence) {
    for (const signal of confidence.signals) {
      if (!signal.unknown) continue
      if (signal.signal === 'pantry' && items.some((i) => i.field === 'pantry')) continue
      if (signal.signal === 'data_quality') continue
      push(
        signal.signal,
        `missing.confidence.${signal.signal}`,
        signal.reason,
        signal.signal === 'medical' || signal.signal === 'nutrition' ? 'high' : 'medium',
      )
    }
  }

  // Weight outdated — only if confidence nutrition signal mentions weight missing.
  const weightMissing = confidence?.signals.some(
    (s) => s.signal === 'nutrition' && /weight/i.test(s.reason),
  )
  if (weightMissing) {
    push('weight', 'missing.weight', 'Weight outdated or missing', 'high')
  }

  return items
}
