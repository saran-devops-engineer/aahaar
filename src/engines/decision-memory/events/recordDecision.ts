import { createDecisionRecord, type CreateDecisionInput } from '@/engines/decision-memory/models/record'
import { freezeStore } from '@/engines/decision-memory/models/store'
import { applyRetention } from '@/engines/decision-memory/history/retention'
import type { DecisionMemoryStore, DecisionRecord } from '@/engines/decision-memory/types'

export function appendDecision(
  store: DecisionMemoryStore,
  input: CreateDecisionInput,
): { store: DecisionMemoryStore; record: DecisionRecord } {
  const record = createDecisionRecord(input)
  const nextRecords = [...store.records, record]
  const withRetention = applyRetention(
    freezeStore({
      ...store,
      records: nextRecords,
      totalDecisions: store.totalDecisions + 1,
      updatedAt: record.timestamp,
    }),
    record.timestamp,
  )
  return { store: withRetention, record }
}

export function appendDecisionRecord(
  store: DecisionMemoryStore,
  record: DecisionRecord,
): DecisionMemoryStore {
  return applyRetention(
    freezeStore({
      ...store,
      records: [...store.records, record],
      totalDecisions: store.totalDecisions + 1,
      updatedAt: record.timestamp,
    }),
    record.timestamp,
  )
}
