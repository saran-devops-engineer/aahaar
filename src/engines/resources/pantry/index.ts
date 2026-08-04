import { stockAvailabilityForItem, isUsable } from '@/engines/resources/availability'
import { buildResourceIndex } from '@/engines/resources/inventory'
import { normalizeIngredientKey } from '@/engines/resources/inventory/normalize'
import type {
  InventoryItem,
  ResourceProfile,
  StockAvailability,
} from '@/engines/resources/types'

export function getAvailableIngredients(
  profile: ResourceProfile,
): readonly InventoryItem[] {
  const index = buildResourceIndex(profile.inventory)
  return Object.freeze(
    [...index.byIngredient.values()].filter((item) =>
      isUsable(stockAvailabilityForItem(item, profile.market, item.ingredient)),
    ),
  )
}

export function getIngredientAvailability(
  profile: ResourceProfile,
  ingredient: string,
): StockAvailability {
  const index = buildResourceIndex(profile.inventory)
  const item = index.byIngredient.get(normalizeIngredientKey(ingredient))
  return stockAvailabilityForItem(item, profile.market, ingredient)
}

export function findInventoryItem(
  profile: ResourceProfile,
  ingredient: string,
): InventoryItem | undefined {
  return buildResourceIndex(profile.inventory).byIngredient.get(
    normalizeIngredientKey(ingredient),
  )
}
