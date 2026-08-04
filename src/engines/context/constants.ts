import type { CostTier, MealType, Season } from '@/types/domain'
import type { ContextExtensions, ContextVersion } from '@/engines/context/types'

export const CONTEXT_VERSION: ContextVersion = '1.5.0'

export const DEFAULT_LANGUAGE = 'en'

export const DEFAULT_BUDGET_TIER: CostTier = 3

export const DEFAULT_AVAILABLE_MEALS: Readonly<Record<MealType, boolean>> = {
  breakfast: true,
  lunch: true,
  snack: true,
  dinner: true,
}

export const DEFAULT_SEASON: Season = 'all'

export const EMPTY_EXTENSIONS: ContextExtensions = Object.freeze({
  weather: null,
  travel: null,
  festival: null,
  pantry: null,
  inventory: null,
  labReports: null,
  wearables: null,
  sleep: null,
  stress: null,
  glucose: null,
  heartRate: null,
  stepCount: null,
  familyMembers: null,
  workout: null,
})

/** Preference keys understood when flattening food restrictions. */
export const PREFERENCE_KEYS = {
  allergens: 'allergens',
  religious: 'religious',
  pantry: 'pantry',
} as const
