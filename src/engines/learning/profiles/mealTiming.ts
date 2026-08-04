import type { MealType } from '@/types/domain'
import type { LearningEvent, MealTimingStats } from '@/engines/learning/types'

export function updateMealTiming(
  timing: MealTimingStats,
  mealType: MealType | undefined,
  hour?: number,
  minute?: number,
): MealTimingStats {
  if (mealType == null || hour == null || minute == null) return timing
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return timing

  const minutes = hour * 60 + minute
  const samples = { ...timing.samples }
  const prevCount = samples[mealType] ?? 0
  const nextCount = prevCount + 1
  samples[mealType] = nextCount

  const prevAvg = readTiming(timing, mealType)
  const nextAvg =
    prevAvg == null
      ? minutes
      : Math.round((prevAvg * prevCount + minutes) / nextCount)

  return Object.freeze({
    samples: Object.freeze(samples),
    breakfastMinutes: mealType === 'breakfast' ? nextAvg : timing.breakfastMinutes,
    lunchMinutes: mealType === 'lunch' ? nextAvg : timing.lunchMinutes,
    snackMinutes: mealType === 'snack' ? nextAvg : timing.snackMinutes,
    dinnerMinutes: mealType === 'dinner' ? nextAvg : timing.dinnerMinutes,
  })
}

function readTiming(timing: MealTimingStats, mealType: MealType): number | undefined {
  switch (mealType) {
    case 'breakfast':
      return timing.breakfastMinutes
    case 'lunch':
      return timing.lunchMinutes
    case 'snack':
      return timing.snackMinutes
    case 'dinner':
      return timing.dinnerMinutes
  }
}

export function timingFromEvent(event: LearningEvent): {
  hour?: number
  minute?: number
} {
  if (event.hour != null && event.minute != null) {
    return { hour: event.hour, minute: event.minute }
  }
  const ms = Date.parse(event.timestamp)
  if (!Number.isFinite(ms)) return {}
  const date = new Date(ms)
  return { hour: date.getHours(), minute: date.getMinutes() }
}
