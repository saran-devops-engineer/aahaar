import type { LearningEventType, LearningVersion } from '@/engines/learning/types'

export const LEARNING_VERSION: LearningVersion = '1.5.0'

export const LEARNING_PREF_KEY = 'learningProfile'

/** Affinity bounds. */
export const AFFINITY_MIN = 0
export const AFFINITY_MAX = 100
export const AFFINITY_NEUTRAL = 50

/** Event deltas (deterministic). */
export const EVENT_DELTAS: Record<LearningEventType, number> = {
  meal_accepted: 4,
  meal_skipped: -2,
  meal_swapped: -3,
  meal_regenerated: -1,
  meal_completed: 6,
  meal_partially_completed: 2,
  meal_liked: 10,
  meal_disliked: -14,
  shopping_completed: 0,
  water_completed: 0,
  reminder_ignored: 0,
  reminder_opened: 0,
  meal_prepared: 5,
  meal_repeated: 3,
}

export const CUISINE_EVENT_SCALE = 0.7
export const INGREDIENT_EVENT_SCALE = 0.6

/** Recent behaviour weight vs older (decay half-life days). */
export const DECAY_HALF_LIFE_DAYS = 21
export const DECAY_FLOOR = 0.35

/** Confidence thresholds by event count + signal strength. */
export const CONFIDENCE_LOW_MAX = 8
export const CONFIDENCE_MEDIUM_MAX = 24

/** Cap how much learning may move recommendation scores. */
export const ADJUSTMENT_CAP_LOW = 4
export const ADJUSTMENT_CAP_MEDIUM = 10
export const ADJUSTMENT_CAP_HIGH = 18

/** Diversity: penalize repeating same food across recent window. */
export const DIVERSITY_WINDOW = 5
export const DIVERSITY_PENALTY_PER_REPEAT = 8
export const DIVERSITY_PENALTY_CAP = 24

export const MAX_FEEDBACK_HISTORY = 80
export const MAX_RECENT_FOODS = 21

export const REMINDER_FREQUENCY_MIN = 0.25
export const REMINDER_FREQUENCY_STEP = 0.1
