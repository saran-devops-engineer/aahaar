import { getDecision } from '@/engines/decision-memory/queries'
import type {
  DecisionInspectorView,
  DecisionMemoryStore,
} from '@/engines/decision-memory/types'

/**
 * Decision Inspector — developer-only read model.
 * No UI. Future Explainability Engine should read this view only.
 */
export function inspectDecision(
  store: DecisionMemoryStore,
  decisionId: string,
): DecisionInspectorView | undefined {
  const record = getDecision(store, decisionId)
  if (!record) return undefined

  return Object.freeze({
    decisionId: record.decisionId,
    timestamp: record.timestamp,
    mealType: record.mealType,
    acceptedMeal: record.acceptedMeal,
    reasonCodes: record.reasonCodes,
    filtersApplied: record.filtersApplied,
    constraints: record.constraints,
    rejectedMeals: record.rejectedMeals,
    decisionScore: record.decisionScore,
    confidence: record.confidence,
    versions: record.versions,
    candidateMeals: record.candidateMeals,
    alternatives: record.alternatives,
    finalExplanation: record.finalExplanation,
    userAction: record.userAction,
    ruleChain: Object.freeze([...record.filtersApplied]),
    contextSnapshot: Object.freeze({
      date: record.date,
      season: record.constraints.season,
      stateCode: record.constraints.stateCode,
      districtId: record.constraints.districtId,
      foodPreference: record.constraints.foodPreference,
      conditions: record.constraints.conditions,
    }),
  })
}

export function listInspectableDecisions(
  store: DecisionMemoryStore,
  limit = 50,
): readonly DecisionInspectorView[] {
  const sorted = [...store.records].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  )
  return Object.freeze(
    sorted
      .slice(0, limit)
      .map((r) => inspectDecision(store, r.decisionId)!)
      .filter(Boolean),
  )
}
