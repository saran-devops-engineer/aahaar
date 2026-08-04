import {
  FIXED_FESTIVALS,
  NATIONAL_HOLIDAY_NAMES,
} from '@/engines/life-context/constants'
import { resolveNow } from '@/engines/life-context/providers/dateProvider'
import type { LifeContextProvider } from '@/engines/life-context/types'

export const festivalProvider: LifeContextProvider = {
  id: 'FestivalProvider',
  provide(signals) {
    const d = resolveNow(signals)
    const month = d.getMonth() + 1
    const day = d.getDate()

    const fromSignal = signals.festivalName?.trim() || null
    const matched = FIXED_FESTIVALS.find((f) => f.month === month && f.day === day)
    const festival = fromSignal ?? matched?.name ?? null

    const holidayFromSignal = signals.isHoliday
    const holiday =
      holidayFromSignal != null
        ? holidayFromSignal
        : festival != null
          ? NATIONAL_HOLIDAY_NAMES.has(festival) || Boolean(fromSignal)
          : null

    const missing: string[] = []
    if (festival == null) missing.push('festival')
    if (holiday == null) missing.push('holiday')

    return {
      providerId: 'FestivalProvider',
      available: festival != null || holiday != null,
      missingFields: missing,
      value: {
        festival,
        holiday,
      },
    }
  },
}
