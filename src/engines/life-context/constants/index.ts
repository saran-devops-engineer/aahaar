import type { LifeContextVersion } from '@/engines/life-context/types'

export const LIFE_CONTEXT_VERSION: LifeContextVersion = '2.0.0'

export const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

/** Default cooking time assumptions by mode (minutes) — used only when signal absent. */
export const COOKING_TIME_HOME_DEFAULT = 45
export const COOKING_TIME_OFFICE_DEFAULT = 20
export const COOKING_TIME_TRAVEL_DEFAULT = 10
export const COOKING_TIME_WEEKEND_DEFAULT = 60

export const MEAL_PREP_WINDOW_DEFAULT = 90

/** Pantry id count thresholds. */
export const PANTRY_EMPTY_MAX = 0
export const PANTRY_LOW_MAX = 3
export const PANTRY_ADEQUATE_MAX = 12

/** Hydration: consumed/goal ratios. */
export const HYDRATION_LOW_RATIO = 0.4
export const HYDRATION_OK_RATIO = 0.75

/** Approximate fixed-date Indian observances (local, offline). Providers look these up. */
export const FIXED_FESTIVALS: readonly { month: number; day: number; name: string }[] =
  Object.freeze([
    { month: 1, day: 14, name: 'Makar Sankranti' },
    { month: 1, day: 26, name: 'Republic Day' },
    { month: 8, day: 15, name: 'Independence Day' },
    { month: 10, day: 2, name: 'Gandhi Jayanti' },
    { month: 12, day: 25, name: 'Christmas' },
  ])

export const NATIONAL_HOLIDAY_NAMES = Object.freeze(
  new Set(['Republic Day', 'Independence Day', 'Gandhi Jayanti']),
)
