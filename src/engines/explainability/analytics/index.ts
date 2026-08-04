import { MAX_ANALYTICS_TOP } from '@/engines/explainability/constants'
import type {
  ExplanationAnalytics,
  ExplanationAnalyticsEvent,
  ExplanationEventType,
} from '@/engines/explainability/types'

const events: ExplanationAnalyticsEvent[] = []
const MAX_EVENTS = 500

export function recordExplanationEvent(
  explanationId: string,
  decisionId: string,
  type: ExplanationEventType,
  timestamp = new Date().toISOString(),
): ExplanationAnalyticsEvent {
  const event = Object.freeze({ explanationId, decisionId, type, timestamp })
  events.push(event)
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS)
  return event
}

function topByType(type: ExplanationEventType) {
  const counts = new Map<string, number>()
  for (const e of events) {
    if (e.type !== type) continue
    counts.set(e.explanationId, (counts.get(e.explanationId) ?? 0) + 1)
  }
  return Object.freeze(
    [...counts.entries()]
      .map(([explanationId, count]) => Object.freeze({ explanationId, count }))
      .sort((a, b) => b.count - a.count || a.explanationId.localeCompare(b.explanationId))
      .slice(0, MAX_ANALYTICS_TOP),
  )
}

export function getExplanationAnalytics(): ExplanationAnalytics {
  return Object.freeze({
    mostViewed: topByType('viewed'),
    mostConfusing: topByType('confused'),
    mostAccepted: topByType('accepted'),
    mostIgnored: topByType('ignored'),
    totalEvents: events.length,
  })
}

export function resetExplanationAnalytics(): void {
  events.length = 0
}
