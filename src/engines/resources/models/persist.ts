import { RESOURCE_PREF_KEY } from '@/engines/resources/constants'
import {
  deserializeResourceProfile,
  migrateResourceProfile,
  serializeResourceProfile,
} from '@/engines/resources/models/exportImport'
import { createEmptyResourceProfile } from '@/engines/resources/models/profile'
import type { ResourceProfile } from '@/engines/resources/types'
import { db } from '@/database/db'
import { createId } from '@/shared/utils/id'

/** Local persistence via preferences table — no schema redesign. */
export async function loadResourceProfile(userId: string): Promise<ResourceProfile> {
  const row = await db.preferences
    .where('[userId+key]')
    .equals([userId, RESOURCE_PREF_KEY])
    .first()

  if (!row?.value) {
    return createEmptyResourceProfile(userId)
  }

  try {
    return migrateResourceProfile(deserializeResourceProfile(row.value))
  } catch {
    return createEmptyResourceProfile(userId)
  }
}

export async function saveResourceProfile(profile: ResourceProfile): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.preferences
    .where('[userId+key]')
    .equals([profile.userId, RESOURCE_PREF_KEY])
    .first()

  await db.preferences.put({
    id: existing?.id ?? createId('pref'),
    userId: profile.userId,
    key: RESOURCE_PREF_KEY,
    value: serializeResourceProfile(profile),
    updatedAt: now,
  })
}
