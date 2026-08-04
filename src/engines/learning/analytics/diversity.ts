import {
  DIVERSITY_PENALTY_CAP,
  DIVERSITY_PENALTY_PER_REPEAT,
  DIVERSITY_WINDOW,
} from '@/engines/learning/constants'
import type { LearningProfile } from '@/engines/learning/types'

/** Count repeats of foodId in the recent window. */
export function countRecentRepeats(profile: LearningProfile, foodId: string): number {
  return profile.recentFoodIds
    .slice(0, DIVERSITY_WINDOW)
    .filter((id) => id === foodId).length
}

export function diversityPenalty(profile: LearningProfile, foodId: string): number {
  const repeats = countRecentRepeats(profile, foodId)
  if (repeats <= 0) return 0
  return Math.min(DIVERSITY_PENALTY_CAP, repeats * DIVERSITY_PENALTY_PER_REPEAT)
}

export function computeDiversityScore(profile: LearningProfile): number {
  const window = profile.recentFoodIds.slice(0, DIVERSITY_WINDOW)
  if (window.length === 0) return 50
  const unique = new Set(window).size
  return Math.round((unique / window.length) * 100)
}

export function computeConsistencyScore(profile: LearningProfile): number {
  const affinities = Object.values(profile.foodAffinity)
  if (affinities.length < 3) return 50
  const top = [...affinities].sort((a, b) => b.score - a.score).slice(0, 5)
  const avgSamples = top.reduce((sum, entry) => sum + entry.samples, 0) / top.length
  return Math.max(0, Math.min(100, Math.round(40 + avgSamples * 8)))
}
