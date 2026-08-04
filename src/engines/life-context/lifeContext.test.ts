import { describe, expect, it, beforeEach } from 'vitest'
import {
  DEFAULT_LIFE_CONTEXT_PROVIDERS,
  LIFE_CONTEXT_PRIORITY,
  buildLifeContext,
  canContinueWithout,
  dateProvider,
  evaluateFestival,
  evaluatePantry,
  evaluateToday,
  evaluateTravel,
  evaluateWeather,
  evaluateWeekend,
  getAllTimelines,
  getLifeContext,
  getTimeline,
  medicalAlwaysWins,
  resetLifeContextCache,
  seasonProvider,
  weatherProvider,
} from '@/engines/life-context'
import type { LifeContextProvider } from '@/engines/life-context/types'

beforeEach(() => {
  resetLifeContextCache()
})

describe('Life Context Engine', () => {
  it('builds LifeContext from DateProvider and SeasonProvider', () => {
    const ctx = getLifeContext({
      now: '2026-08-04T09:30:00',
      date: '2026-08-04',
    })
    expect(ctx.currentDate).toBe('2026-08-04')
    expect(ctx.currentTime).toMatch(/^\d{2}:\d{2}$/)
    expect(ctx.dayOfWeek).toBe('tuesday')
    expect(ctx.season).toBe('monsoon')
    expect(ctx.providersUsed).toContain('DateProvider')
    expect(ctx.providersUsed).toContain('SeasonProvider')
  })

  it('each default provider can run in isolation', () => {
    const signals = {
      now: '2026-01-26T10:00:00',
      date: '2026-01-26',
      budgetTier: 2 as const,
      pantryFoodIds: ['a', 'b'],
      travelMode: false,
      homeMode: true,
      familyMode: true,
      temperatureC: 28,
      weather: 'clear' as const,
      waterConsumedMl: 500,
      waterGoalMl: 2500,
    }
    for (const provider of DEFAULT_LIFE_CONTEXT_PROVIDERS) {
      const result = provider.provide(signals)
      expect(result.providerId).toBe(provider.id)
      expect(result.value).toBeTypeOf('object')
    }
  })

  it('degrades gracefully when weather and pantry are missing', () => {
    const ctx = buildLifeContext({ date: '2026-08-04', now: '2026-08-04T08:00:00' })
    expect(ctx.weather).toBeNull()
    expect(ctx.temperature).toBeNull()
    expect(ctx.pantryStatus).toBe('unknown')
    expect(ctx.missingFields).toContain('weather')
    expect(ctx.missingFields).toContain('pantryStatus')
    expect(canContinueWithout('weather')).toBe(true)
    expect(canContinueWithout('pantryStatus')).toBe(true)
    expect(evaluateWeather(ctx).available).toBe(false)
    expect(evaluatePantry(ctx).available).toBe(false)
    expect(evaluateWeather(ctx).codes).toContain('WEATHER_MISSING')
    expect(evaluatePantry(ctx).codes).toContain('PANTRY_MISSING')
  })

  it('fills festival from FestivalProvider on Republic Day', () => {
    const ctx = getLifeContext({ date: '2026-01-26', now: '2026-01-26T09:00:00' })
    expect(ctx.festival).toBe('Republic Day')
    expect(ctx.holiday).toBe(true)
    expect(evaluateFestival(ctx).available).toBe(true)
    expect(evaluateFestival(ctx).codes).toContain('FESTIVAL')
  })

  it('evaluates travel and cooking time from signals', () => {
    const ctx = getLifeContext({
      date: '2026-08-04',
      now: '2026-08-04T08:00:00',
      travelMode: true,
    })
    expect(ctx.travelMode).toBe(true)
    expect(ctx.availableCookingTime).toBe(10)
    expect(evaluateTravel(ctx).codes).toContain('TRAVEL_MODE')
  })

  it('evaluates weekend timeline', () => {
    const saturday = getLifeContext({ date: '2026-08-01', now: '2026-08-01T10:00:00' })
    expect(saturday.dayOfWeek).toBe('saturday')
    expect(evaluateWeekend(saturday).codes).toContain('WEEKEND')
    const weekend = getTimeline('weekend', { date: '2026-08-01', now: '2026-08-01T10:00:00' })
    expect(weekend.active).toBe(true)

    const timelines = getAllTimelines({ date: '2026-08-04', now: '2026-08-04T10:00:00' })
    expect(timelines.map((t) => t.kind)).toEqual([
      'today',
      'tomorrow',
      'weekend',
      'festival',
      'vacation',
    ])
  })

  it('evaluateToday returns stable codes', () => {
    const evaluation = evaluateToday({
      date: '2026-08-15',
      now: '2026-08-15T08:00:00',
      homeMode: true,
      isWorkingDay: false,
    })
    expect(evaluation.domain).toBe('today')
    expect(evaluation.available).toBe(true)
    expect(evaluation.codes).toContain('SEASON_MONSOON')
    expect(evaluation.codes).toContain('FESTIVAL_TODAY')
  })

  it('pantry provider derives status from food ids', () => {
    const ctx = getLifeContext({
      date: '2026-08-04',
      pantryFoodIds: ['x'],
      leftoverFoodIds: ['food-curd-rice'],
    })
    expect(ctx.pantryStatus).toBe('low')
    expect(ctx.shoppingStatus).toBe('needed')
    expect(ctx.leftovers).toContain('food-curd-rice')
    expect(evaluatePantry(ctx).codes).toContain('HAS_LEFTOVERS')
  })

  it('provider failure does not break assembly', () => {
    const broken: LifeContextProvider = {
      id: 'BrokenProvider',
      provide() {
        throw new Error('boom')
      },
    }
    const ctx = buildLifeContext({ date: '2026-08-04' }, [dateProvider, seasonProvider, broken, weatherProvider])
    expect(ctx.currentDate).toBe('2026-08-04')
    expect(ctx.season).toBe('monsoon')
    expect(ctx.missingFields).toContain('BrokenProvider')
  })

  it('medical priority is above life context', () => {
    expect(LIFE_CONTEXT_PRIORITY[0]).toBe('medical')
    expect(LIFE_CONTEXT_PRIORITY[1]).toBe('life-context')
    expect(medicalAlwaysWins()).toBe(true)
  })
})
