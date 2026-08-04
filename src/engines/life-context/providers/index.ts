import { budgetProvider } from '@/engines/life-context/providers/budgetProvider'
import { cookingTimeProvider } from '@/engines/life-context/providers/cookingTimeProvider'
import { dateProvider } from '@/engines/life-context/providers/dateProvider'
import { familyProvider } from '@/engines/life-context/providers/familyProvider'
import { festivalProvider } from '@/engines/life-context/providers/festivalProvider'
import { pantryProvider } from '@/engines/life-context/providers/pantryProvider'
import { placeholdersProvider } from '@/engines/life-context/providers/placeholdersProvider'
import { seasonProvider } from '@/engines/life-context/providers/seasonProvider'
import { travelProvider } from '@/engines/life-context/providers/travelProvider'
import { weatherProvider } from '@/engines/life-context/providers/weatherProvider'
import { wellbeingProvider } from '@/engines/life-context/providers/wellbeingProvider'
import type { LifeContextProvider } from '@/engines/life-context/types'

/** Default provider pipeline — order is compositional, not medical priority. */
export const DEFAULT_LIFE_CONTEXT_PROVIDERS: readonly LifeContextProvider[] = Object.freeze([
  dateProvider,
  seasonProvider,
  festivalProvider,
  budgetProvider,
  travelProvider,
  cookingTimeProvider,
  pantryProvider,
  weatherProvider,
  familyProvider,
  wellbeingProvider,
  placeholdersProvider,
])

export {
  budgetProvider,
  cookingTimeProvider,
  dateProvider,
  familyProvider,
  festivalProvider,
  pantryProvider,
  placeholdersProvider,
  seasonProvider,
  travelProvider,
  weatherProvider,
  wellbeingProvider,
}
