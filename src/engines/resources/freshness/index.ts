import {
  FRESHNESS_CONSUME_SOON_DAYS,
  FRESHNESS_GOOD_DAYS,
} from '@/engines/resources/constants'
import type { FreshnessStatus } from '@/engines/resources/types'

function startOfDay(isoOrDate: string): number {
  const d = isoOrDate.includes('T') ? new Date(isoOrDate) : new Date(`${isoOrDate}T00:00:00`)
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

export function daysUntilExpiry(
  expiryDate: string | undefined,
  nowIso = new Date().toISOString(),
): number | null {
  if (!expiryDate) return null
  const exp = startOfDay(expiryDate)
  const now = startOfDay(nowIso)
  if (!Number.isFinite(exp) || !Number.isFinite(now)) return null
  return Math.round((exp - now) / (24 * 60 * 60 * 1000))
}

export function computeFreshness(
  expiryDate: string | undefined,
  nowIso = new Date().toISOString(),
): FreshnessStatus {
  const days = daysUntilExpiry(expiryDate, nowIso)
  if (days == null) return 'unknown'
  if (days < 0) return 'expired'
  if (days === 0) return 'expiring_today'
  if (days <= FRESHNESS_CONSUME_SOON_DAYS) return 'consume_soon'
  if (days <= FRESHNESS_GOOD_DAYS) return 'good'
  return 'fresh'
}

export function freshnessPriority(status: FreshnessStatus): number {
  switch (status) {
    case 'expired':
      return 0
    case 'expiring_today':
      return 1
    case 'consume_soon':
      return 2
    case 'good':
      return 3
    case 'fresh':
      return 4
    default:
      return 5
  }
}
