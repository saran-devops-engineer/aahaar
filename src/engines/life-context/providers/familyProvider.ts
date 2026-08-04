import type { LifeContextProvider } from '@/engines/life-context/types'

export const familyProvider: LifeContextProvider = {
  id: 'FamilyProvider',
  provide(signals) {
    const missing: string[] = []
    const familyMode = signals.familyMode ?? null
    const guestMode = signals.guestMode ?? null
    if (familyMode == null) missing.push('familyMode')
    if (guestMode == null) missing.push('guestMode')

    return {
      providerId: 'FamilyProvider',
      available: familyMode != null || guestMode != null,
      missingFields: missing,
      value: {
        familyMode,
        guestMode,
      },
    }
  },
}
