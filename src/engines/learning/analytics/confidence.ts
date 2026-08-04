import {
  CONFIDENCE_LOW_MAX,
  CONFIDENCE_MEDIUM_MAX,
} from '@/engines/learning/constants'
import type { ConfidenceLevel, LearningProfile } from '@/engines/learning/types'

export function computeConfidence(profile: LearningProfile): {
  level: ConfidenceLevel
  score: number
} {
  const foodSamples = Object.values(profile.foodAffinity).reduce(
    (sum, entry) => sum + entry.samples,
    0,
  )
  const cuisineSamples = Object.values(profile.cuisineAffinity).reduce(
    (sum, entry) => sum + entry.samples,
    0,
  )
  const signal = profile.eventCount + foodSamples * 0.5 + cuisineSamples * 0.35
  const score = Math.max(0, Math.min(100, Math.round(signal * 2.2)))

  let level: ConfidenceLevel = 'low'
  if (profile.eventCount > CONFIDENCE_MEDIUM_MAX && score >= 55) level = 'high'
  else if (profile.eventCount > CONFIDENCE_LOW_MAX && score >= 25) level = 'medium'

  return { level, score }
}
