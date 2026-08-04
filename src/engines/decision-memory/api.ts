import { computeDecisionAnalytics } from '@/engines/decision-memory/analytics/stats'
import {
  inspectDecision,
  listInspectableDecisions,
} from '@/engines/decision-memory/analytics/inspector'
import { appendDecision, appendDecisionRecord } from '@/engines/decision-memory/events/recordDecision'
import { applyOutcome } from '@/engines/decision-memory/events/recordOutcome'
import { applyRetention, setRetentionDays } from '@/engines/decision-memory/history/retention'
import {
  loadDecisionMemoryStore,
  saveDecisionMemoryStore,
} from '@/engines/decision-memory/history/persist'
import {
  createDecisionRecord,
  createRecordsFromDecisionResult,
  type CreateDecisionInput,
} from '@/engines/decision-memory/models/record'
import {
  deserializeDecisionMemory,
  exportDecisionMemory,
  importDecisionMemory,
  serializeDecisionMemory,
} from '@/engines/decision-memory/models/exportImport'
import { createEmptyDecisionMemoryStore } from '@/engines/decision-memory/models/store'
import {
  findFailedMeals,
  findSuccessfulMeals,
  getDecision,
  getDecisionHistory,
  getDecisionReasons,
  getRecommendationHistory,
  getRejectedFoods,
} from '@/engines/decision-memory/queries'
import type {
  DecisionAnalytics,
  DecisionInspectorView,
  DecisionMemoryExportBundle,
  DecisionMemoryStore,
  DecisionOutcome,
  DecisionRecord,
  ReasonCode,
  RejectedFoodEntry,
} from '@/engines/decision-memory/types'
import type { DecisionResult, MealType } from '@/types/domain'
import type { TimelineWindow } from '@/engines/decision-memory/history/timeline'

const memory = new Map<string, DecisionMemoryStore>()

export function getDecisionMemoryStore(userId: string): DecisionMemoryStore {
  return memory.get(userId) ?? createEmptyDecisionMemoryStore(userId)
}

export async function ensureDecisionMemoryStore(userId: string): Promise<DecisionMemoryStore> {
  if (memory.has(userId)) return memory.get(userId)!
  const loaded = await loadDecisionMemoryStore(userId)
  memory.set(userId, loaded)
  return loaded
}

async function commit(store: DecisionMemoryStore): Promise<DecisionMemoryStore> {
  memory.set(store.userId, store)
  await saveDecisionMemoryStore(store)
  return store
}

/** Record a single meal decision into memory. */
export async function recordDecision(
  input: CreateDecisionInput,
): Promise<DecisionRecord> {
  const current = await ensureDecisionMemoryStore(input.userId)
  const { store, record } = appendDecision(current, input)
  await commit(store)
  return record
}

/** Record all meals from a DecisionResult (does not change Decision Engine). */
export async function recordDecisionResult(
  userId: string,
  date: string,
  result: DecisionResult,
  options?: Parameters<typeof createRecordsFromDecisionResult>[3],
): Promise<readonly DecisionRecord[]> {
  const current = await ensureDecisionMemoryStore(userId)
  const records = createRecordsFromDecisionResult(userId, date, result, options)
  let store = current
  for (const record of records) {
    store = appendDecisionRecord(store, record)
  }
  await commit(store)
  return records
}

export async function recordDecisionOutcome(
  userId: string,
  decisionId: string,
  outcome: DecisionOutcome,
  options?: { swappedToFoodId?: string; timestamp?: string },
): Promise<DecisionMemoryStore> {
  const current = await ensureDecisionMemoryStore(userId)
  return commit(applyOutcome(current, decisionId, outcome, options))
}

export function getDecisionForUser(
  userId: string,
  decisionId: string,
): DecisionRecord | undefined {
  return getDecision(getDecisionMemoryStore(userId), decisionId)
}

export function getDecisionHistoryForUser(
  userId: string,
  options?: {
    window?: TimelineWindow
    mealType?: MealType
    limit?: number
    now?: string
  },
): readonly DecisionRecord[] {
  return getDecisionHistory(getDecisionMemoryStore(userId), options)
}

export function getDecisionReasonsForUser(
  userId: string,
  decisionId: string,
): readonly ReasonCode[] {
  return getDecisionReasons(getDecisionMemoryStore(userId), decisionId)
}

export function getRejectedFoodsForUser(
  userId: string,
  decisionId?: string,
): readonly RejectedFoodEntry[] {
  return getRejectedFoods(getDecisionMemoryStore(userId), decisionId)
}

export function getRecommendationHistoryForUser(
  userId: string,
  options?: { window?: TimelineWindow; limit?: number; now?: string },
) {
  return getRecommendationHistory(getDecisionMemoryStore(userId), options)
}

export function findSuccessfulMealsForUser(
  userId: string,
  options?: { mealType?: MealType; limit?: number },
): readonly DecisionRecord[] {
  return findSuccessfulMeals(getDecisionMemoryStore(userId), options)
}

export function findFailedMealsForUser(
  userId: string,
  options?: { mealType?: MealType; limit?: number },
): readonly DecisionRecord[] {
  return findFailedMeals(getDecisionMemoryStore(userId), options)
}

export function getDecisionAnalytics(userId: string): DecisionAnalytics {
  return computeDecisionAnalytics(getDecisionMemoryStore(userId))
}

export function inspectDecisionForUser(
  userId: string,
  decisionId: string,
): DecisionInspectorView | undefined {
  return inspectDecision(getDecisionMemoryStore(userId), decisionId)
}

export function listDecisionInspector(
  userId: string,
  limit?: number,
): readonly DecisionInspectorView[] {
  return listInspectableDecisions(getDecisionMemoryStore(userId), limit)
}

export async function configureRetention(
  userId: string,
  days: number,
): Promise<DecisionMemoryStore> {
  const current = await ensureDecisionMemoryStore(userId)
  return commit(setRetentionDays(current, days))
}

export async function compressDecisionMemory(
  userId: string,
  now?: string,
): Promise<DecisionMemoryStore> {
  const current = await ensureDecisionMemoryStore(userId)
  return commit(applyRetention(current, now))
}

export function exportDecisionMemoryForUser(userId: string): DecisionMemoryExportBundle {
  return exportDecisionMemory(getDecisionMemoryStore(userId))
}

export async function importDecisionMemoryForUser(
  userId: string,
  bundle: DecisionMemoryExportBundle,
): Promise<DecisionMemoryStore> {
  const imported = importDecisionMemory(bundle, { userId })
  return commit(imported)
}

/** Test / process helper — clears in-memory cache only. */
export function resetDecisionMemoryCache(userId?: string): void {
  if (userId) memory.delete(userId)
  else memory.clear()
}

// Spec-named aliases
export {
  getDecisionForUser as getDecisionApi,
  getDecisionHistoryForUser as getDecisionHistoryApi,
  getDecisionReasonsForUser as getDecisionReasonsApi,
  getRejectedFoodsForUser as getRejectedFoodsApi,
  getRecommendationHistoryForUser as getRecommendationHistoryApi,
  findSuccessfulMealsForUser as findSuccessfulMealsApi,
  findFailedMealsForUser as findFailedMealsApi,
}

export {
  appendDecision,
  applyOutcome,
  applyRetention,
  computeDecisionAnalytics,
  createDecisionRecord,
  createEmptyDecisionMemoryStore,
  createRecordsFromDecisionResult,
  deserializeDecisionMemory,
  exportDecisionMemory,
  findFailedMeals,
  findSuccessfulMeals,
  getDecision,
  getDecisionHistory,
  getDecisionReasons,
  getRecommendationHistory,
  getRejectedFoods,
  importDecisionMemory,
  inspectDecision,
  listInspectableDecisions,
  serializeDecisionMemory,
}
