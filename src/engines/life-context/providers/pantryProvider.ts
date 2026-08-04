import {
  PANTRY_ADEQUATE_MAX,
  PANTRY_EMPTY_MAX,
  PANTRY_LOW_MAX,
} from '@/engines/life-context/constants'
import type { LifeContextProvider, PantryStatus } from '@/engines/life-context/types'

function statusFromCount(count: number): PantryStatus {
  if (count <= PANTRY_EMPTY_MAX) return 'empty'
  if (count <= PANTRY_LOW_MAX) return 'low'
  if (count <= PANTRY_ADEQUATE_MAX) return 'adequate'
  return 'full'
}

export const pantryProvider: LifeContextProvider = {
  id: 'PantryProvider',
  provide(signals) {
    const missing: string[] = []
    let pantryStatus: PantryStatus = signals.pantryStatus ?? 'unknown'
    const leftovers = Object.freeze([...(signals.leftoverFoodIds ?? [])])

    if (signals.pantryStatus == null && signals.pantryFoodIds != null) {
      pantryStatus = statusFromCount(signals.pantryFoodIds.length)
    }
    if (pantryStatus === 'unknown') missing.push('pantryStatus')

    let shoppingStatus = signals.shoppingStatus ?? 'unknown'
    if (signals.shoppingStatus == null && pantryStatus !== 'unknown') {
      if (pantryStatus === 'empty' || pantryStatus === 'low') shoppingStatus = 'needed'
      else shoppingStatus = 'done'
    }
    if (shoppingStatus === 'unknown') missing.push('shoppingStatus')

    const marketAvailability = signals.marketAvailability ?? 'unknown'
    if (marketAvailability === 'unknown') missing.push('marketAvailability')

    return {
      providerId: 'PantryProvider',
      available: pantryStatus !== 'unknown' || leftovers.length > 0,
      missingFields: missing,
      value: {
        pantryStatus,
        shoppingStatus,
        leftovers,
        marketAvailability,
      },
    }
  },
}
