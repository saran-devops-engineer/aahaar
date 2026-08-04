/**
 * Adaptive Learning Engine public API.
 * Pure scoring + local persistence. No AI. No cloud.
 */
export {
  applyLearningEvent,
  buildAdjustmentMap,
  createEmptyLearningProfile,
  deserializeLearningProfile,
  ensureLearningProfile,
  exportLearningProfile,
  getAffinity,
  getCuisineAffinity,
  getLearningAdjustmentsForFoods,
  getLearningProfile,
  getRecommendationAdjustment,
  importLearningProfile,
  isColdStart,
  recordMealAccepted,
  recordMealCompleted,
  recordMealDisliked,
  recordMealLiked,
  recordMealPartiallyCompleted,
  recordMealPrepared,
  recordMealRegenerated,
  recordMealRepeated,
  recordMealSkipped,
  recordMealSwapped,
  recordReminderIgnored,
  recordReminderOpened,
  recordShoppingCompleted,
  recordWaterCompleted,
  serializeLearningProfile,
} from '@/engines/learning/api'
export { LEARNING_VERSION } from '@/engines/learning/constants'
export type {
  AffinityEntry,
  ConfidenceLevel,
  LearningEvent,
  LearningEventType,
  LearningExportBundle,
  LearningProfile,
  RecommendationAdjustment,
} from '@/engines/learning/types'
