import {
  COOKING_TIME_HOME_DEFAULT,
  COOKING_TIME_OFFICE_DEFAULT,
  COOKING_TIME_TRAVEL_DEFAULT,
  COOKING_TIME_WEEKEND_DEFAULT,
  MEAL_PREP_WINDOW_DEFAULT,
  DAY_NAMES,
} from '@/engines/life-context/constants'
import { resolveNow } from '@/engines/life-context/providers/dateProvider'
import type { LifeContextProvider } from '@/engines/life-context/types'

export const cookingTimeProvider: LifeContextProvider = {
  id: 'CookingTimeProvider',
  provide(signals) {
    const missing: string[] = []
    let availableCookingTime = signals.availableCookingTimeMinutes ?? null
    let mealPreparationWindow = signals.mealPreparationWindowMinutes ?? null

    if (availableCookingTime == null) {
      if (signals.travelMode === true) availableCookingTime = COOKING_TIME_TRAVEL_DEFAULT
      else if (signals.officeMode === true) availableCookingTime = COOKING_TIME_OFFICE_DEFAULT
      else if (signals.homeMode === true) availableCookingTime = COOKING_TIME_HOME_DEFAULT
      else {
        const day = DAY_NAMES[resolveNow(signals).getDay()]
        if (day === 'saturday' || day === 'sunday') {
          availableCookingTime = COOKING_TIME_WEEKEND_DEFAULT
        } else {
          missing.push('availableCookingTime')
        }
      }
    }

    if (mealPreparationWindow == null) {
      if (availableCookingTime != null) {
        mealPreparationWindow = Math.max(availableCookingTime, MEAL_PREP_WINDOW_DEFAULT)
      } else {
        missing.push('mealPreparationWindow')
      }
    }

    return {
      providerId: 'CookingTimeProvider',
      available: availableCookingTime != null || mealPreparationWindow != null,
      missingFields: missing,
      value: {
        availableCookingTime,
        mealPreparationWindow,
      },
    }
  },
}
