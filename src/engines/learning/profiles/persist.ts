import { LEARNING_PREF_KEY } from '@/engines/learning/constants'
import { createEmptyLearningProfile } from '@/engines/learning/models/affinity'
import {
  deserializeLearningProfile,
  migrateLearningProfile,
  serializeLearningProfile,
} from '@/engines/learning/profiles/exportImport'
import type { LearningProfile } from '@/engines/learning/types'
import { db } from '@/database/db'
import { createId } from '@/shared/utils/id'

/**
 * Local persistence via existing preferences table (no schema redesign).
 * Learning engine core remains pure; this adapter is the only I/O boundary.
 */
export async function loadLearningProfile(userId: string): Promise<LearningProfile> {
  const row = await db.preferences
    .where('[userId+key]')
    .equals([userId, LEARNING_PREF_KEY])
    .first()

  if (!row?.value) {
    return createEmptyLearningProfile(userId, new Date().toISOString())
  }

  try {
    return migrateLearningProfile(deserializeLearningProfile(row.value))
  } catch {
    return createEmptyLearningProfile(userId, new Date().toISOString())
  }
}

export async function saveLearningProfile(profile: LearningProfile): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.preferences
    .where('[userId+key]')
    .equals([profile.userId, LEARNING_PREF_KEY])
    .first()

  await db.preferences.put({
    id: existing?.id ?? createId('pref'),
    userId: profile.userId,
    key: LEARNING_PREF_KEY,
    value: serializeLearningProfile(profile),
    updatedAt: now,
  })
}
