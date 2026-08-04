import {
  DECISION_MEMORY_VERSION,
  DEFAULT_RETENTION_DAYS,
} from '@/engines/decision-memory/constants'
import type { DecisionMemoryStore } from '@/engines/decision-memory/types'

export function createEmptyDecisionMemoryStore(
  userId: string,
  now = new Date().toISOString(),
  retentionDays = DEFAULT_RETENTION_DAYS,
): DecisionMemoryStore {
  return Object.freeze({
    version: DECISION_MEMORY_VERSION,
    userId,
    createdAt: now,
    updatedAt: now,
    records: Object.freeze([]),
    stats: Object.freeze([]),
    retentionDays,
    totalDecisions: 0,
    totalOutcomes: 0,
  })
}

export function freezeStore(store: DecisionMemoryStore): DecisionMemoryStore {
  return Object.freeze({
    ...store,
    records: Object.freeze([...store.records]),
    stats: Object.freeze([...store.stats]),
  })
}
