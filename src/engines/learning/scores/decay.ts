import {
  DECAY_FLOOR,
  DECAY_HALF_LIFE_DAYS,
  AFFINITY_NEUTRAL,
} from '@/engines/learning/constants'
import { clampAffinity } from '@/engines/learning/models/affinity'
import type { AffinityEntry, LearningProfile } from '@/engines/learning/types'

/**
 * Exponential decay of affinity toward neutral based on age of last update.
 * Recent behaviour keeps stronger influence.
 */
export function decayAffinityEntry(
  entry: AffinityEntry,
  nowMs: number,
): AffinityEntry {
  const updatedMs = Date.parse(entry.updatedAt)
  if (!Number.isFinite(updatedMs)) return entry
  const ageDays = Math.max(0, (nowMs - updatedMs) / (1000 * 60 * 60 * 24))
  const keep = Math.max(
    DECAY_FLOOR,
    Math.pow(0.5, ageDays / DECAY_HALF_LIFE_DAYS),
  )
  const decayed = AFFINITY_NEUTRAL + (entry.score - AFFINITY_NEUTRAL) * keep
  return Object.freeze({
    ...entry,
    score: clampAffinity(decayed),
  })
}

export function decayAffinityMap(
  map: Readonly<Record<string, AffinityEntry>>,
  nowMs: number,
): Record<string, AffinityEntry> {
  const next: Record<string, AffinityEntry> = {}
  for (const [id, entry] of Object.entries(map)) {
    next[id] = decayAffinityEntry(entry, nowMs)
  }
  return next
}

export function applyDecayToProfile(
  profile: LearningProfile,
  nowIso: string,
): LearningProfile {
  const nowMs = Date.parse(nowIso)
  return Object.freeze({
    ...profile,
    updatedAt: nowIso,
    foodAffinity: Object.freeze(decayAffinityMap(profile.foodAffinity, nowMs)),
    cuisineAffinity: Object.freeze(decayAffinityMap(profile.cuisineAffinity, nowMs)),
    ingredientAffinity: Object.freeze(
      decayAffinityMap(profile.ingredientAffinity, nowMs),
    ),
  })
}
