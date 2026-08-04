import { DAY_NAMES } from '@/engines/life-context/constants'
import type {
  DayOfWeek,
  LifeContextProvider,
  LifeContextSignals,
} from '@/engines/life-context/types'

function resolveDate(signals: LifeContextSignals): Date {
  if (signals.now instanceof Date) return signals.now
  if (typeof signals.now === 'string' && signals.now) {
    const parsed = new Date(signals.now)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  if (signals.date) {
    const parsed = new Date(`${signals.date}T12:00:00`)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return new Date()
}

export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

export const dateProvider: LifeContextProvider = {
  id: 'DateProvider',
  provide(signals) {
    const d = resolveDate(signals)
    const currentDate = signals.date ?? formatDate(d)
    const dayOfWeek = DAY_NAMES[d.getDay()] as DayOfWeek
    return {
      providerId: 'DateProvider',
      available: true,
      value: {
        currentDate,
        currentTime: formatTime(d),
        dayOfWeek,
        timestamp: d.toISOString(),
      },
    }
  },
}

export function resolveNow(signals: LifeContextSignals): Date {
  return resolveDate(signals)
}
