import { DECISION_MEMORY_PREF_KEY } from '@/engines/decision-memory/constants'
import {
  deserializeDecisionMemory,
  migrateDecisionMemoryStore,
  serializeDecisionMemory,
} from '@/engines/decision-memory/models/exportImport'
import { createEmptyDecisionMemoryStore } from '@/engines/decision-memory/models/store'
import type { DecisionMemoryStore } from '@/engines/decision-memory/types'
import { db } from '@/database/db'
import { createId } from '@/shared/utils/id'

/**
 * Local persistence via existing preferences table (no schema redesign).
 */
export async function loadDecisionMemoryStore(userId: string): Promise<DecisionMemoryStore> {
  const row = await db.preferences
    .where('[userId+key]')
    .equals([userId, DECISION_MEMORY_PREF_KEY])
    .first()

  if (!row?.value) {
    return createEmptyDecisionMemoryStore(userId, new Date().toISOString())
  }

  try {
    return migrateDecisionMemoryStore(deserializeDecisionMemory(row.value))
  } catch {
    return createEmptyDecisionMemoryStore(userId, new Date().toISOString())
  }
}

export async function saveDecisionMemoryStore(store: DecisionMemoryStore): Promise<void> {
  const now = new Date().toISOString()
  const existing = await db.preferences
    .where('[userId+key]')
    .equals([store.userId, DECISION_MEMORY_PREF_KEY])
    .first()

  await db.preferences.put({
    id: existing?.id ?? createId('pref'),
    userId: store.userId,
    key: DECISION_MEMORY_PREF_KEY,
    value: serializeDecisionMemory(store),
    updatedAt: now,
  })
}
