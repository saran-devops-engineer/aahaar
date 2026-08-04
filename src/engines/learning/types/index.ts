import type { MealType } from '@/types/domain'

export type LearningVersion = `${number}.${number}.${number}`

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type LearningEventType =
  | 'meal_accepted'
  | 'meal_skipped'
  | 'meal_swapped'
  | 'meal_regenerated'
  | 'meal_completed'
  | 'meal_partially_completed'
  | 'meal_liked'
  | 'meal_disliked'
  | 'shopping_completed'
  | 'water_completed'
  | 'reminder_ignored'
  | 'reminder_opened'
  | 'meal_prepared'
  | 'meal_repeated'

export interface LearningEvent {
  readonly type: LearningEventType
  readonly timestamp: string
  readonly foodId?: string
  readonly cuisine?: string
  readonly ingredients?: readonly string[]
  readonly mealType?: MealType
  readonly replacedFoodId?: string
  readonly hour?: number
  readonly minute?: number
  readonly meta?: Readonly<Record<string, string | number | boolean>>
}

export interface AffinityEntry {
  readonly id: string
  /** Score in [0, 100]. */
  readonly score: number
  readonly samples: number
  readonly updatedAt: string
}

export interface MealTimingStats {
  readonly breakfastMinutes?: number
  readonly lunchMinutes?: number
  readonly snackMinutes?: number
  readonly dinnerMinutes?: number
  readonly samples: Partial<Record<MealType, number>>
}

export interface FeedbackHistoryItem {
  readonly type: LearningEventType
  readonly timestamp: string
  readonly foodId?: string
  readonly mealType?: MealType
}

export interface LearningProfile {
  readonly version: LearningVersion
  readonly userId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly foodAffinity: Readonly<Record<string, AffinityEntry>>
  readonly cuisineAffinity: Readonly<Record<string, AffinityEntry>>
  readonly ingredientAffinity: Readonly<Record<string, AffinityEntry>>
  readonly mealTiming: MealTimingStats
  readonly diversityScore: number
  readonly consistencyScore: number
  readonly confidence: ConfidenceLevel
  readonly confidenceScore: number
  readonly eventCount: number
  readonly recentFoodIds: readonly string[]
  readonly feedbackHistory: readonly FeedbackHistoryItem[]
  /** Reminder frequency multiplier in [0.25, 1]. */
  readonly reminderFrequency: number
  readonly shoppingConfidence: number
  readonly preferenceSignals: Readonly<{
    spicyBias: number
    complexityBias: number
    prepTimeBiasMinutes: number
    budgetBias: number
  }>
}

export interface RecommendationAdjustment {
  readonly foodId: string
  /** Additive score delta for ranking (capped). */
  readonly scoreDelta: number
  readonly reasons: readonly string[]
  readonly confidence: ConfidenceLevel
  readonly diversityPenalty: number
}

export interface LearningExportBundle {
  readonly format: 'aahaar.learning.profile'
  readonly version: LearningVersion
  readonly exportedAt: string
  readonly profile: LearningProfile
}
