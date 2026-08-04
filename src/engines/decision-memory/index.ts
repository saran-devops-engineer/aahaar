/**
 * Decision Memory Engine public API.
 * Immutable local decision history. No AI. No cloud. No UI.
 */
export {
  compressDecisionMemory,
  configureRetention,
  createDecisionRecord,
  createEmptyDecisionMemoryStore,
  createRecordsFromDecisionResult,
  deserializeDecisionMemory,
  ensureDecisionMemoryStore,
  exportDecisionMemory,
  exportDecisionMemoryForUser,
  findFailedMealsForUser as findFailedMeals,
  findSuccessfulMealsForUser as findSuccessfulMeals,
  getDecisionAnalytics,
  getDecisionForUser as getDecision,
  getDecisionHistoryForUser as getDecisionHistory,
  getDecisionMemoryStore,
  getDecisionReasonsForUser as getDecisionReasons,
  getRecommendationHistoryForUser as getRecommendationHistory,
  getRejectedFoodsForUser as getRejectedFoods,
  importDecisionMemory,
  importDecisionMemoryForUser,
  inspectDecisionForUser as inspectDecision,
  listDecisionInspector,
  recordDecision,
  recordDecisionOutcome,
  recordDecisionResult,
  resetDecisionMemoryCache,
  serializeDecisionMemory,
} from '@/engines/decision-memory/api'

/** Pure store-level helpers for tests and engines. */
export {
  appendDecision,
  applyOutcome,
  applyRetention,
  computeDecisionAnalytics,
  findFailedMeals as findFailedMealsInStore,
  findSuccessfulMeals as findSuccessfulMealsInStore,
  getDecision as getDecisionInStore,
  getDecisionHistory as getDecisionHistoryInStore,
  getDecisionReasons as getDecisionReasonsInStore,
  getRecommendationHistory as getRecommendationHistoryInStore,
  getRejectedFoods as getRejectedFoodsInStore,
  inspectDecision as inspectDecisionInStore,
  listInspectableDecisions,
} from '@/engines/decision-memory/api'

export {
  ALL_REASON_CODES,
  DECISION_MEMORY_VERSION,
  DEFAULT_RETENTION_DAYS,
} from '@/engines/decision-memory/constants'

export {
  isReasonCode,
  isRejectionReasonCode,
  mapBlockedToRejection,
  mapTextToReasonCodes,
} from '@/engines/decision-memory/reasons/codes'

export type {
  DecisionAnalytics,
  DecisionCandidate,
  DecisionConstraints,
  DecisionInspectorView,
  DecisionMemoryExportBundle,
  DecisionMemoryStore,
  DecisionMemoryVersion,
  DecisionOutcome,
  DecisionRecord,
  DecisionScoreBreakdown,
  DecisionStatsBucket,
  ReasonCode,
  RejectedFoodEntry,
  RejectionReasonCode,
} from '@/engines/decision-memory/types'
