import {
  HYDRATION_LOW_RATIO,
  HYDRATION_OK_RATIO,
} from '@/engines/life-context/constants'
import type { HydrationStatus, LifeContextProvider } from '@/engines/life-context/types'

function hydrationFromWater(
  consumed: number | undefined,
  goal: number | undefined,
): HydrationStatus {
  if (consumed == null || goal == null || goal <= 0) return 'unknown'
  const ratio = consumed / goal
  if (ratio < HYDRATION_LOW_RATIO) return 'low'
  if (ratio < HYDRATION_OK_RATIO) return 'ok'
  return 'good'
}

export const wellbeingProvider: LifeContextProvider = {
  id: 'WellbeingProvider',
  provide(signals) {
    const missing: string[] = []
    const sleepQuality = signals.sleepQuality ?? 'unknown'
    const stressLevel = signals.stressLevel ?? 'unknown'
    const activityLevel = signals.activityLevel ?? null
    const hydrationStatus =
      signals.hydrationStatus ??
      hydrationFromWater(signals.waterConsumedMl, signals.waterGoalMl)

    if (sleepQuality === 'unknown') missing.push('sleepQuality')
    if (stressLevel === 'unknown') missing.push('stressLevel')
    if (activityLevel == null) missing.push('activityLevel')
    if (hydrationStatus === 'unknown') missing.push('hydrationStatus')

    return {
      providerId: 'WellbeingProvider',
      available:
        sleepQuality !== 'unknown' ||
        stressLevel !== 'unknown' ||
        activityLevel != null ||
        hydrationStatus !== 'unknown',
      missingFields: missing,
      value: {
        sleepQuality,
        stressLevel,
        activityLevel,
        hydrationStatus,
      },
    }
  },
}
