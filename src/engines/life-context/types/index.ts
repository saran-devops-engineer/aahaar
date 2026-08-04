import type { ActivityLevel } from '@/config/constants'
import type { CostTier, Season } from '@/types/domain'

export type LifeContextVersion = `${number}.${number}.${number}`

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'storm'
  | 'haze'
  | 'hot'
  | 'cold'
  | 'unknown'

export type BudgetStatus = 'tight' | 'normal' | 'comfortable' | 'unknown'
export type SalaryCyclePhase = 'pre_salary' | 'post_salary' | 'mid_cycle' | 'unknown'
export type PantryStatus = 'empty' | 'low' | 'adequate' | 'full' | 'unknown'
export type ShoppingStatus = 'needed' | 'planned' | 'done' | 'unknown'
export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent' | 'unknown'
export type StressLevel = 'low' | 'moderate' | 'high' | 'unknown'
export type HydrationStatus = 'low' | 'ok' | 'good' | 'unknown'
export type LocationAccuracy = 'none' | 'coarse' | 'fine' | 'unknown'

export type TimelineKind =
  | 'today'
  | 'tomorrow'
  | 'weekend'
  | 'festival'
  | 'vacation'

/** Optional signals supplied by the app layer — providers never fetch storage/network. */
export interface LifeContextSignals {
  readonly now?: Date | string
  readonly date?: string
  readonly timeZone?: string
  readonly temperatureC?: number
  readonly weather?: WeatherCondition
  readonly humidityPercent?: number
  readonly festivalName?: string
  readonly isHoliday?: boolean
  readonly isWorkingDay?: boolean
  readonly travelMode?: boolean
  readonly officeMode?: boolean
  readonly homeMode?: boolean
  readonly availableCookingTimeMinutes?: number
  readonly mealPreparationWindowMinutes?: number
  readonly budgetTier?: CostTier
  readonly budgetStatus?: BudgetStatus
  readonly salaryDayOfMonth?: number
  readonly salaryCycle?: SalaryCyclePhase
  readonly pantryFoodIds?: readonly string[]
  readonly pantryStatus?: PantryStatus
  readonly shoppingStatus?: ShoppingStatus
  readonly sleepQuality?: SleepQuality
  readonly stressLevel?: StressLevel
  readonly activityLevel?: ActivityLevel
  readonly waterConsumedMl?: number
  readonly waterGoalMl?: number
  readonly hydrationStatus?: HydrationStatus
  readonly familyMode?: boolean
  readonly guestMode?: boolean
  readonly leftoverFoodIds?: readonly string[]
  readonly marketAvailability?: 'low' | 'normal' | 'high' | 'unknown'
  readonly wearablesConnected?: boolean
  readonly glucoseMgDl?: number
  readonly bloodPressure?: Readonly<{ systolic: number; diastolic: number }>
  readonly heartRateBpm?: number
  readonly airQualityIndex?: number
  readonly locationAccuracy?: LocationAccuracy
  readonly vacationMode?: boolean
  readonly stateCode?: string
}

export interface LifeContextPlaceholders {
  readonly wearables: null | Readonly<{ connected: boolean }>
  readonly glucose: null | Readonly<{ mgDl: number }>
  readonly bloodPressure: null | Readonly<{ systolic: number; diastolic: number }>
  readonly heartRate: null | Readonly<{ bpm: number }>
  readonly airQuality: null | Readonly<{ aqi: number }>
  readonly locationAccuracy: LocationAccuracy
}

/**
 * Immutable snapshot of TODAY's reality for Decision / future engines.
 * Missing fields are null — never invent weather/pantry/wearables.
 */
export interface LifeContext {
  readonly version: LifeContextVersion
  readonly timestamp: string
  readonly currentDate: string
  readonly currentTime: string
  readonly dayOfWeek: DayOfWeek
  readonly season: Season
  readonly temperature: number | null
  readonly weather: WeatherCondition | null
  readonly humidity: number | null
  readonly festival: string | null
  readonly holiday: boolean | null
  readonly workingDay: boolean | null
  readonly travelMode: boolean | null
  readonly officeMode: boolean | null
  readonly homeMode: boolean | null
  readonly availableCookingTime: number | null
  readonly mealPreparationWindow: number | null
  readonly budgetStatus: BudgetStatus
  readonly salaryCycle: SalaryCyclePhase
  readonly pantryStatus: PantryStatus
  readonly shoppingStatus: ShoppingStatus
  readonly sleepQuality: SleepQuality
  readonly stressLevel: StressLevel
  readonly activityLevel: ActivityLevel | null
  readonly hydrationStatus: HydrationStatus
  readonly familyMode: boolean | null
  readonly guestMode: boolean | null
  readonly leftovers: readonly string[]
  readonly marketAvailability: 'low' | 'normal' | 'high' | 'unknown'
  readonly placeholders: LifeContextPlaceholders
  /** Which providers contributed non-null / non-unknown values. */
  readonly providersUsed: readonly string[]
  /** Fields that degraded to null/unknown because signals were missing. */
  readonly missingFields: readonly string[]
}

export interface LifeContextProviderResult<T> {
  readonly providerId: string
  readonly value: T
  readonly available: boolean
  readonly missingFields?: readonly string[]
}

export interface LifeContextProvider {
  readonly id: string
  provide(signals: LifeContextSignals): LifeContextProviderResult<Partial<LifeContext>>
}

export interface TimelineEvaluation {
  readonly kind: TimelineKind
  readonly active: boolean
  readonly reasons: readonly string[]
  readonly date: string
  readonly highlights: Readonly<{
    festival: string | null
    travelMode: boolean
    weekend: boolean
    vacation: boolean
    cookingTimeMinutes: number | null
    pantryStatus: PantryStatus
    weather: WeatherCondition | null
  }>
}

export interface DomainEvaluation {
  readonly domain: string
  readonly available: boolean
  readonly summary: string
  readonly codes: readonly string[]
  readonly data: Readonly<Record<string, string | number | boolean | null>>
}
