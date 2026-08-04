import { DEFAULT_RETENTION_DAYS, MAX_FULL_RECORDS } from '@/engines/decision-memory/constants'
import { compressRecordsIntoStats } from '@/engines/decision-memory/history/compress'
import { freezeStore } from '@/engines/decision-memory/models/store'
import type { DecisionMemoryStore, DecisionRecord } from '@/engines/decision-memory/types'

function dayMs(days: number): number {
  return days * 24 * 60 * 60 * 1000
}

/**
 * Compress records older than retentionDays into stats buckets.
 * Statistics are never discarded.
 */
export function applyRetention(
  store: DecisionMemoryStore,
  nowIso = new Date().toISOString(),
): DecisionMemoryStore {
  const retentionDays = store.retentionDays > 0 ? store.retentionDays : DEFAULT_RETENTION_DAYS
  const now = Date.parse(nowIso)
  if (!Number.isFinite(now)) return store

  const cutoff = now - dayMs(retentionDays)
  const keep: DecisionRecord[] = []
  const compress: DecisionRecord[] = []

  for (const record of store.records) {
    const ts = Date.parse(record.timestamp)
    if (Number.isFinite(ts) && ts < cutoff) {
      compress.push(record)
    } else {
      keep.push(record)
    }
  }

  // Secondary cap: keep newest MAX_FULL_RECORDS fully detailed.
  if (keep.length > MAX_FULL_RECORDS) {
    keep.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    const overflow = keep.splice(0, keep.length - MAX_FULL_RECORDS)
    compress.push(...overflow)
  }

  if (compress.length === 0) {
    return freezeStore({ ...store, records: keep, updatedAt: nowIso })
  }

  const mergedStats = compressRecordsIntoStats(store.stats, compress)
  return freezeStore({
    ...store,
    records: keep,
    stats: mergedStats,
    updatedAt: nowIso,
  })
}

export function setRetentionDays(
  store: DecisionMemoryStore,
  days: number,
  nowIso = new Date().toISOString(),
): DecisionMemoryStore {
  const retentionDays = Math.max(7, Math.min(3650, Math.floor(days)))
  return applyRetention(
    freezeStore({
      ...store,
      retentionDays,
      updatedAt: nowIso,
    }),
    nowIso,
  )
}
