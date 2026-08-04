import { DECISION_MEMORY_VERSION } from '@/engines/decision-memory/constants'
import { createEmptyDecisionMemoryStore, freezeStore } from '@/engines/decision-memory/models/store'
import type {
  DecisionMemoryExportBundle,
  DecisionMemoryStore,
  DecisionMemoryVersion,
} from '@/engines/decision-memory/types'

export function exportDecisionMemory(store: DecisionMemoryStore): DecisionMemoryExportBundle {
  return Object.freeze({
    format: 'aahaar.decision.memory',
    version: store.version,
    exportedAt: new Date().toISOString(),
    store,
  })
}

export function migrateDecisionMemoryStore(
  store: DecisionMemoryStore,
  now = new Date().toISOString(),
): DecisionMemoryStore {
  const major = Number(String(store.version).split('.')[0] ?? 0)
  const currentMajor = Number(DECISION_MEMORY_VERSION.split('.')[0])

  if (major !== currentMajor) {
    const empty = createEmptyDecisionMemoryStore(store.userId, now, store.retentionDays)
    return freezeStore({
      ...empty,
      records: store.records ?? empty.records,
      stats: store.stats ?? empty.stats,
      totalDecisions: store.totalDecisions ?? 0,
      totalOutcomes: store.totalOutcomes ?? 0,
      version: DECISION_MEMORY_VERSION,
      updatedAt: now,
    })
  }

  return freezeStore({
    ...store,
    version: DECISION_MEMORY_VERSION as DecisionMemoryVersion,
  })
}

export function importDecisionMemory(
  bundle: DecisionMemoryExportBundle,
  options?: { userId?: string; now?: string },
): DecisionMemoryStore {
  if (bundle.format !== 'aahaar.decision.memory') {
    throw new Error('Invalid decision memory export format')
  }
  const migrated = migrateDecisionMemoryStore(bundle.store, options?.now)
  if (options?.userId && migrated.userId !== options.userId) {
    return freezeStore({ ...migrated, userId: options.userId })
  }
  return migrated
}

export function serializeDecisionMemory(store: DecisionMemoryStore): string {
  return JSON.stringify(exportDecisionMemory(store))
}

export function deserializeDecisionMemory(raw: string): DecisionMemoryStore {
  const parsed = JSON.parse(raw) as DecisionMemoryExportBundle
  return importDecisionMemory(parsed)
}
