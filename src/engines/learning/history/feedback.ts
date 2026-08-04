import { MAX_FEEDBACK_HISTORY, MAX_RECENT_FOODS } from '@/engines/learning/constants'
import type {
  FeedbackHistoryItem,
  LearningEvent,
  LearningProfile,
} from '@/engines/learning/types'

export function appendFeedbackHistory(
  profile: LearningProfile,
  event: LearningEvent,
): FeedbackHistoryItem[] {
  const item: FeedbackHistoryItem = Object.freeze({
    type: event.type,
    timestamp: event.timestamp,
    foodId: event.foodId,
    mealType: event.mealType,
  })
  return Object.freeze([item, ...profile.feedbackHistory].slice(0, MAX_FEEDBACK_HISTORY)) as FeedbackHistoryItem[]
}

export function pushRecentFood(
  profile: LearningProfile,
  foodId: string | undefined,
): readonly string[] {
  if (!foodId) return profile.recentFoodIds
  return Object.freeze([foodId, ...profile.recentFoodIds.filter((id) => id !== foodId)].slice(
    0,
    MAX_RECENT_FOODS,
  ))
}
