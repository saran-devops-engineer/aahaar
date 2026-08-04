import { freezeStore } from '@/engines/decision-memory/models/store'
import type {
  DecisionMemoryStore,
  DecisionOutcome,
  DecisionRecord,
} from '@/engines/decision-memory/types'

const OUTCOME_SET = new Set<DecisionOutcome>([
  'pending',
  'accepted',
  'rejected',
  'skipped',
  'swapped',
  'completed',
  'repeated',
  'loved',
  'disliked',
])

export function applyOutcome(
  store: DecisionMemoryStore,
  decisionId: string,
  outcome: DecisionOutcome,
  options?: { swappedToFoodId?: string; timestamp?: string },
): DecisionMemoryStore {
  if (!OUTCOME_SET.has(outcome)) {
    throw new Error(`Invalid decision outcome: ${outcome}`)
  }

  const now = options?.timestamp ?? new Date().toISOString()
  let changed = false
  const records = store.records.map((record) => {
    if (record.decisionId !== decisionId) return record
    changed = true
    const next: DecisionRecord = Object.freeze({
      ...record,
      userAction: outcome,
      outcomeAt: now,
      swappedToFoodId:
        outcome === 'swapped' ? options?.swappedToFoodId ?? record.swappedToFoodId : record.swappedToFoodId,
    })
    return next
  })

  if (!changed) return store

  return freezeStore({
    ...store,
    records,
    totalOutcomes: store.totalOutcomes + (outcome === 'pending' ? 0 : 1),
    updatedAt: now,
  })
}
