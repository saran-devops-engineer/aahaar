/**
 * Life Context Engine — today's reality as one immutable object.
 * No UI. No cloud. No Decision Engine changes.
 */
export {
  buildLifeContext,
  createEmptyLifeContext,
  evaluateAllTimelines,
  evaluateFestivalContext as evaluateFestival,
  evaluatePantryContext as evaluatePantry,
  evaluateTimeline,
  evaluateTodayContext as evaluateToday,
  evaluateTravelContext as evaluateTravel,
  evaluateWeatherContext as evaluateWeather,
  evaluateWeekendContext as evaluateWeekend,
  getAllTimelines,
  getLifeContext,
  getTimeline,
  resetLifeContextCache,
} from '@/engines/life-context/api'

export { DEFAULT_LIFE_CONTEXT_PROVIDERS } from '@/engines/life-context/providers'
export {
  budgetProvider,
  cookingTimeProvider,
  dateProvider,
  familyProvider,
  festivalProvider,
  pantryProvider,
  placeholdersProvider,
  seasonProvider,
  travelProvider,
  weatherProvider,
  wellbeingProvider,
} from '@/engines/life-context/providers'

export {
  getCookingTimeMinutes,
  getMissingSoftFields,
  hasPantrySignal,
  hasWeatherSignal,
  isFestivalDay,
  isTraveling,
} from '@/engines/life-context/queries'

export {
  LIFE_CONTEXT_PRIORITY,
  isAboveLearning,
  medicalAlwaysWins,
} from '@/engines/life-context/strategies/priority'
export {
  canContinueWithout,
  describeDegradation,
} from '@/engines/life-context/strategies/degrade'

export { LIFE_CONTEXT_VERSION } from '@/engines/life-context/constants'

export type {
  BudgetStatus,
  DayOfWeek,
  DomainEvaluation,
  HydrationStatus,
  LifeContext,
  LifeContextPlaceholders,
  LifeContextProvider,
  LifeContextProviderResult,
  LifeContextSignals,
  LifeContextVersion,
  PantryStatus,
  SalaryCyclePhase,
  ShoppingStatus,
  SleepQuality,
  StressLevel,
  TimelineEvaluation,
  TimelineKind,
  WeatherCondition,
} from '@/engines/life-context/types'
