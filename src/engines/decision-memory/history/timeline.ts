import type { DecisionMemoryStore, DecisionRecord } from '@/engines/decision-memory/types'

export type TimelineWindow = 'yesterday' | 'today' | 'week' | 'month' | 'all'

function startOfUtcDay(isoOrDate: string): number {
  const d = isoOrDate.includes('T') ? new Date(isoOrDate) : new Date(`${isoOrDate}T00:00:00.000Z`)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function filterByTimeline(
  store: DecisionMemoryStore,
  window: TimelineWindow,
  nowIso = new Date().toISOString(),
): readonly DecisionRecord[] {
  if (window === 'all') return store.records

  const nowStart = startOfUtcDay(nowIso)
  const dayMs = 24 * 60 * 60 * 1000

  return store.records.filter((record) => {
    const ts = Date.parse(record.timestamp)
    if (!Number.isFinite(ts)) return false
    const recordStart = startOfUtcDay(record.timestamp)

    switch (window) {
      case 'today':
        return recordStart === nowStart
      case 'yesterday':
        return recordStart === nowStart - dayMs
      case 'week':
        return ts >= nowStart - 6 * dayMs
      case 'month':
        return ts >= nowStart - 29 * dayMs
      default:
        return true
    }
  })
}

export function groupByDate(
  records: readonly DecisionRecord[],
): ReadonlyMap<string, readonly DecisionRecord[]> {
  const map = new Map<string, DecisionRecord[]>()
  for (const record of records) {
    const list = map.get(record.date) ?? []
    list.push(record)
    map.set(record.date, list)
  }
  return map
}
