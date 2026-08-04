import type { LifeContextProvider } from '@/engines/life-context/types'
import { resolveNow } from '@/engines/life-context/providers/dateProvider'
import { DAY_NAMES } from '@/engines/life-context/constants'

export const travelProvider: LifeContextProvider = {
  id: 'TravelProvider',
  provide(signals) {
    const missing: string[] = []
    const travelMode = signals.travelMode ?? null
    if (travelMode == null) missing.push('travelMode')

    const d = resolveNow(signals)
    const weekend = DAY_NAMES[d.getDay()] === 'saturday' || DAY_NAMES[d.getDay()] === 'sunday'

    let workingDay = signals.isWorkingDay ?? null
    if (workingDay == null && signals.isHoliday === true) workingDay = false
    else if (workingDay == null && weekend) workingDay = false
    else if (workingDay == null && signals.officeMode === true) workingDay = true
    if (workingDay == null) missing.push('workingDay')

    let officeMode = signals.officeMode ?? null
    let homeMode = signals.homeMode ?? null

    if (officeMode == null && homeMode == null && travelMode === true) {
      officeMode = false
      homeMode = false
    } else if (officeMode == null && homeMode == null && workingDay === true) {
      officeMode = true
      homeMode = false
    } else if (officeMode == null && homeMode == null && workingDay === false) {
      officeMode = false
      homeMode = true
    }

    if (officeMode == null) missing.push('officeMode')
    if (homeMode == null) missing.push('homeMode')

    return {
      providerId: 'TravelProvider',
      available: travelMode != null || workingDay != null || officeMode != null || homeMode != null,
      missingFields: missing,
      value: {
        travelMode,
        workingDay,
        officeMode,
        homeMode,
      },
    }
  },
}
