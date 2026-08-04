import { LEARNING_VERSION } from '@/engines/learning/constants'
import { createEmptyLearningProfile } from '@/engines/learning/models/affinity'
import type {
  LearningExportBundle,
  LearningProfile,
  LearningVersion,
} from '@/engines/learning/types'

export function exportLearningProfile(profile: LearningProfile): LearningExportBundle {
  return Object.freeze({
    format: 'aahaar.learning.profile',
    version: profile.version,
    exportedAt: new Date().toISOString(),
    profile,
  })
}

export function importLearningProfile(
  bundle: LearningExportBundle,
  options?: { userId?: string; now?: string },
): LearningProfile {
  if (bundle.format !== 'aahaar.learning.profile') {
    throw new Error('Invalid learning export format')
  }
  const migrated = migrateLearningProfile(bundle.profile, options?.now)
  if (options?.userId && migrated.userId !== options.userId) {
    return Object.freeze({ ...migrated, userId: options.userId })
  }
  return migrated
}

export function migrateLearningProfile(
  profile: LearningProfile,
  now = new Date().toISOString(),
): LearningProfile {
  const major = Number(String(profile.version).split('.')[0] ?? 0)
  const currentMajor = Number(LEARNING_VERSION.split('.')[0])
  if (major !== currentMajor) {
    // Major mismatch: keep affinities but reset to current version shell.
    const empty = createEmptyLearningProfile(profile.userId, now)
    return Object.freeze({
      ...empty,
      foodAffinity: profile.foodAffinity ?? empty.foodAffinity,
      cuisineAffinity: profile.cuisineAffinity ?? empty.cuisineAffinity,
      ingredientAffinity: profile.ingredientAffinity ?? empty.ingredientAffinity,
      eventCount: profile.eventCount ?? 0,
      recentFoodIds: profile.recentFoodIds ?? empty.recentFoodIds,
      feedbackHistory: profile.feedbackHistory ?? empty.feedbackHistory,
      version: LEARNING_VERSION as LearningVersion,
      updatedAt: now,
    })
  }
  return Object.freeze({
    ...profile,
    version: LEARNING_VERSION as LearningVersion,
  })
}

export function serializeLearningProfile(profile: LearningProfile): string {
  return JSON.stringify(exportLearningProfile(profile))
}

export function deserializeLearningProfile(raw: string): LearningProfile {
  const parsed = JSON.parse(raw) as LearningExportBundle
  return importLearningProfile(parsed)
}
