import { filterByTimeline, type TimelineWindow } from '@/engines/decision-memory/history/timeline'
import type {
  DecisionMemoryStore,
  DecisionOutcome,
  DecisionRecord,
  ReasonCode,
  RejectedFoodEntry,
} from '@/engines/decision-memory/types'

export function getDecision(
  store: DecisionMemoryStore,
  decisionId: string,
): DecisionRecord | undefined {
  return store.records.find((r) => r.decisionId === decisionId)
}

export function getDecisionHistory(
  store: DecisionMemoryStore,
  options?: {
    window?: TimelineWindow
    mealType?: DecisionRecord['mealType']
    limit?: number
    now?: string
  },
): readonly DecisionRecord[] {
  let records = options?.window
    ? filterByTimeline(store, options.window, options.now)
    : store.records

  if (options?.mealType) {
    records = records.filter((r) => r.mealType === options.mealType)
  }

  const sorted = [...records].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  )
  if (options?.limit != null) return Object.freeze(sorted.slice(0, options.limit))
  return Object.freeze(sorted)
}

export function getDecisionReasons(
  store: DecisionMemoryStore,
  decisionId: string,
): readonly ReasonCode[] {
  return getDecision(store, decisionId)?.reasonCodes ?? Object.freeze([])
}

export function getRejectedFoods(
  store: DecisionMemoryStore,
  decisionId?: string,
): readonly RejectedFoodEntry[] {
  if (decisionId) {
    return getDecision(store, decisionId)?.rejectedMeals ?? Object.freeze([])
  }
  const all: RejectedFoodEntry[] = []
  for (const record of store.records) {
    all.push(...record.rejectedMeals)
  }
  return Object.freeze(all)
}

export function getRecommendationHistory(
  store: DecisionMemoryStore,
  options?: { window?: TimelineWindow; limit?: number; now?: string },
): readonly {
  decisionId: string
  date: string
  mealType: DecisionRecord['mealType']
  foodId: string
  outcome: DecisionOutcome
  reasonCodes: readonly ReasonCode[]
}[] {
  const history = getDecisionHistory(store, options)
  return Object.freeze(
    history.map((r) =>
      Object.freeze({
        decisionId: r.decisionId,
        date: r.date,
        mealType: r.mealType,
        foodId: r.acceptedMeal,
        outcome: r.userAction,
        reasonCodes: r.reasonCodes,
      }),
    ),
  )
}

const SUCCESS: ReadonlySet<DecisionOutcome> = new Set([
  'accepted',
  'completed',
  'repeated',
  'loved',
])

const FAILURE: ReadonlySet<DecisionOutcome> = new Set([
  'rejected',
  'skipped',
  'disliked',
])

export function findSuccessfulMeals(
  store: DecisionMemoryStore,
  options?: { mealType?: DecisionRecord['mealType']; limit?: number },
): readonly DecisionRecord[] {
  let records = store.records.filter((r) => SUCCESS.has(r.userAction))
  if (options?.mealType) {
    records = records.filter((r) => r.mealType === options.mealType)
  }
  const sorted = [...records].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  )
  return Object.freeze(sorted.slice(0, options?.limit ?? sorted.length))
}

export function findFailedMeals(
  store: DecisionMemoryStore,
  options?: { mealType?: DecisionRecord['mealType']; limit?: number },
): readonly DecisionRecord[] {
  let records = store.records.filter((r) => FAILURE.has(r.userAction))
  if (options?.mealType) {
    records = records.filter((r) => r.mealType === options.mealType)
  }
  const sorted = [...records].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  )
  return Object.freeze(sorted.slice(0, options?.limit ?? sorted.length))
}
