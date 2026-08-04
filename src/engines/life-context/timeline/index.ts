import { FIXED_FESTIVALS } from '@/engines/life-context/constants'
import { buildLifeContext } from '@/engines/life-context/models/buildLifeContext'
import { formatDate } from '@/engines/life-context/providers/dateProvider'
import type {
  LifeContext,
  LifeContextSignals,
  TimelineEvaluation,
  TimelineKind,
} from '@/engines/life-context/types'

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(`${dateStr}T12:00:00`).getDay()
  return day === 0 || day === 6
}

function festivalOn(dateStr: string, signalName?: string): string | null {
  if (signalName) return signalName
  const d = new Date(`${dateStr}T12:00:00`)
  const hit = FIXED_FESTIVALS.find(
    (f) => f.month === d.getMonth() + 1 && f.day === d.getDate(),
  )
  return hit?.name ?? null
}

function highlightsFrom(context: LifeContext, weekend: boolean, vacation: boolean) {
  return Object.freeze({
    festival: context.festival,
    travelMode: context.travelMode === true,
    weekend,
    vacation,
    cookingTimeMinutes: context.availableCookingTime,
    pantryStatus: context.pantryStatus,
    weather: context.weather,
  })
}

export function evaluateTimeline(
  kind: TimelineKind,
  signals: LifeContextSignals = {},
  context?: LifeContext,
): TimelineEvaluation {
  const base = context ?? buildLifeContext(signals)
  const today = base.currentDate
  const vacation = signals.vacationMode === true

  switch (kind) {
    case 'today': {
      return Object.freeze({
        kind,
        active: true,
        date: today,
        reasons: Object.freeze(['Current life context date']),
        highlights: highlightsFrom(base, isWeekend(today), vacation),
      })
    }
    case 'tomorrow': {
      const date = addDays(today, 1)
      const tomorrowSignals: LifeContextSignals = {
        ...signals,
        date,
        now: `${date}T12:00:00`,
        festivalName: undefined,
      }
      const tomorrow = buildLifeContext(tomorrowSignals)
      return Object.freeze({
        kind,
        active: true,
        date,
        reasons: Object.freeze(['Projected next calendar day']),
        highlights: highlightsFrom(tomorrow, isWeekend(date), vacation),
      })
    }
    case 'weekend': {
      const weekend = isWeekend(today)
      return Object.freeze({
        kind,
        active: weekend,
        date: today,
        reasons: Object.freeze(
          weekend ? ['Saturday/Sunday'] : ['Not a weekend day'],
        ),
        highlights: highlightsFrom(base, weekend, vacation),
      })
    }
    case 'festival': {
      const name = festivalOn(today, signals.festivalName) ?? base.festival
      const highlights = highlightsFrom(base, isWeekend(today), vacation)
      return Object.freeze({
        kind,
        active: name != null,
        date: today,
        reasons: Object.freeze(
          name != null ? [`Festival: ${name}`] : ['No festival on this date'],
        ),
        highlights: Object.freeze({ ...highlights, festival: name }),
      })
    }
    case 'vacation': {
      return Object.freeze({
        kind,
        active: vacation,
        date: today,
        reasons: Object.freeze(
          vacation ? ['vacationMode signal'] : ['vacationMode not set'],
        ),
        highlights: highlightsFrom(base, isWeekend(today), vacation),
      })
    }
  }
}

export function evaluateAllTimelines(
  signals: LifeContextSignals = {},
): readonly TimelineEvaluation[] {
  const context = buildLifeContext(signals)
  return Object.freeze(
    (['today', 'tomorrow', 'weekend', 'festival', 'vacation'] as const).map((kind) =>
      evaluateTimeline(kind, signals, context),
    ),
  )
}
