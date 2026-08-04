import type { Season } from '@/types/domain'
import { resolveNow } from '@/engines/life-context/providers/dateProvider'
import type { LifeContextProvider } from '@/engines/life-context/types'

/** Same deterministic month→season mapping as knowledge.currentSeason. */
export function seasonFromMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'summer'
  if (month >= 6 && month <= 9) return 'monsoon'
  return 'winter'
}

export const seasonProvider: LifeContextProvider = {
  id: 'SeasonProvider',
  provide(signals) {
    const month = resolveNow(signals).getMonth() + 1
    return {
      providerId: 'SeasonProvider',
      available: true,
      value: { season: seasonFromMonth(month) },
    }
  },
}
