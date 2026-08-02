import { describe, expect, it } from 'vitest'
import {
  addDaysIso,
  weekDates,
  weekStartIso,
} from '@/shared/utils/date'

describe('date utils', () => {
  it('returns Monday as week start', () => {
    // 2026-08-02 is a Sunday
    expect(weekStartIso(new Date(2026, 7, 2))).toBe('2026-07-27')
    // 2026-08-03 is a Monday
    expect(weekStartIso(new Date(2026, 7, 3))).toBe('2026-08-03')
  })

  it('builds seven week dates', () => {
    const dates = weekDates(new Date(2026, 7, 5))
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-08-03')
    expect(dates[6]).toBe('2026-08-09')
  })

  it('adds days across month boundaries', () => {
    expect(addDaysIso('2026-08-31', 1)).toBe('2026-09-01')
  })
})
