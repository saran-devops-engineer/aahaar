import type { SeasonRecord } from '@/types/domain'

export const SEASON_RECORDS: SeasonRecord[] = [
  { id: 'summer', name: 'summer', months: [3, 4, 5, 6] },
  { id: 'monsoon', name: 'monsoon', months: [6, 7, 8, 9] },
  { id: 'winter', name: 'winter', months: [10, 11, 12, 1, 2] },
  { id: 'all', name: 'all', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
]
