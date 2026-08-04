import {
  evaluateFestival,
  evaluatePantry,
  evaluateToday,
  evaluateTravel,
  evaluateWeather,
  evaluateWeekend,
} from '@/engines/life-context/evaluators'
import { buildLifeContext } from '@/engines/life-context/models/buildLifeContext'
import { createEmptyLifeContext } from '@/engines/life-context/models/empty'
import { DEFAULT_LIFE_CONTEXT_PROVIDERS } from '@/engines/life-context/providers'
import {
  evaluateAllTimelines,
  evaluateTimeline,
} from '@/engines/life-context/timeline'
import type {
  DomainEvaluation,
  LifeContext,
  LifeContextProvider,
  LifeContextSignals,
  TimelineEvaluation,
  TimelineKind,
} from '@/engines/life-context/types'

let cached: { key: string; context: LifeContext } | null = null

function cacheKey(signals: LifeContextSignals): string {
  return JSON.stringify({
    date: signals.date,
    now: signals.now instanceof Date ? signals.now.toISOString() : signals.now,
    travelMode: signals.travelMode,
    officeMode: signals.officeMode,
    homeMode: signals.homeMode,
    budgetTier: signals.budgetTier,
    pantryFoodIds: signals.pantryFoodIds,
    festivalName: signals.festivalName,
    temperatureC: signals.temperatureC,
    weather: signals.weather,
    vacationMode: signals.vacationMode,
    familyMode: signals.familyMode,
    guestMode: signals.guestMode,
    waterConsumedMl: signals.waterConsumedMl,
    waterGoalMl: signals.waterGoalMl,
  })
}

/**
 * Primary API — one immutable LifeContext for TODAY.
 * Pure: no network, no storage. Callers pass signals.
 */
export function getLifeContext(
  signals: LifeContextSignals = {},
  providers: readonly LifeContextProvider[] = DEFAULT_LIFE_CONTEXT_PROVIDERS,
): LifeContext {
  const key = cacheKey(signals)
  if (cached?.key === key) return cached.context
  const context = buildLifeContext(signals, providers)
  cached = { key, context }
  return context
}

/** Force rebuild (tests / signal refresh). */
export function resetLifeContextCache(): void {
  cached = null
}

export function evaluateTodayContext(
  signalsOrContext: LifeContextSignals | LifeContext = {},
): DomainEvaluation {
  const context = isLifeContext(signalsOrContext)
    ? signalsOrContext
    : getLifeContext(signalsOrContext)
  return evaluateToday(context)
}

export function evaluateWeekendContext(
  signalsOrContext: LifeContextSignals | LifeContext = {},
): DomainEvaluation {
  const context = isLifeContext(signalsOrContext)
    ? signalsOrContext
    : getLifeContext(signalsOrContext)
  return evaluateWeekend(context)
}

export function evaluateTravelContext(
  signalsOrContext: LifeContextSignals | LifeContext = {},
): DomainEvaluation {
  const context = isLifeContext(signalsOrContext)
    ? signalsOrContext
    : getLifeContext(signalsOrContext)
  return evaluateTravel(context)
}

export function evaluateFestivalContext(
  signalsOrContext: LifeContextSignals | LifeContext = {},
): DomainEvaluation {
  const context = isLifeContext(signalsOrContext)
    ? signalsOrContext
    : getLifeContext(signalsOrContext)
  return evaluateFestival(context)
}

export function evaluateWeatherContext(
  signalsOrContext: LifeContextSignals | LifeContext = {},
): DomainEvaluation {
  const context = isLifeContext(signalsOrContext)
    ? signalsOrContext
    : getLifeContext(signalsOrContext)
  return evaluateWeather(context)
}

export function evaluatePantryContext(
  signalsOrContext: LifeContextSignals | LifeContext = {},
): DomainEvaluation {
  const context = isLifeContext(signalsOrContext)
    ? signalsOrContext
    : getLifeContext(signalsOrContext)
  return evaluatePantry(context)
}

export function getTimeline(
  kind: TimelineKind,
  signals: LifeContextSignals = {},
): TimelineEvaluation {
  return evaluateTimeline(kind, signals)
}

export function getAllTimelines(signals: LifeContextSignals = {}) {
  return evaluateAllTimelines(signals)
}

function isLifeContext(value: LifeContextSignals | LifeContext): value is LifeContext {
  return (
    typeof value === 'object' &&
    value != null &&
    'version' in value &&
    'currentDate' in value &&
    'providersUsed' in value
  )
}

export {
  buildLifeContext,
  createEmptyLifeContext,
  evaluateAllTimelines,
  evaluateFestival,
  evaluatePantry,
  evaluateTimeline,
  evaluateToday,
  evaluateTravel,
  evaluateWeather,
  evaluateWeekend,
}
