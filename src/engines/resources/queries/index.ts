import { buildResourceIndex } from '@/engines/resources/inventory'
import { freshnessPriority } from '@/engines/resources/freshness'
import { getAvailableIngredients } from '@/engines/resources/pantry'
import type {
  InventoryItem,
  KitchenCapabilities,
  ResourceProfile,
} from '@/engines/resources/types'

export function getExpiringFoods(
  profile: ResourceProfile,
  options?: { includeExpired?: boolean },
): readonly InventoryItem[] {
  const includeExpired = options?.includeExpired ?? true
  return Object.freeze(
    [...profile.inventory]
      .filter((item) => {
        if (item.freshness === 'expired') return includeExpired
        return (
          item.freshness === 'expiring_today' ||
          item.freshness === 'consume_soon'
        )
      })
      .sort(
        (a, b) =>
          freshnessPriority(a.freshness) - freshnessPriority(b.freshness) ||
          a.ingredient.localeCompare(b.ingredient),
      ),
  )
}

export function getBudgetStatus(profile: ResourceProfile) {
  return profile.budget
}

export function getKitchenCapabilities(profile: ResourceProfile): KitchenCapabilities {
  return profile.kitchen
}

export function getAvailableCookingTime(profile: ResourceProfile): number | null {
  return profile.availableCookingTimeMinutes
}

export function getIndexedLookups(profile: ResourceProfile) {
  return buildResourceIndex(profile.inventory)
}

export { getAvailableIngredients }
