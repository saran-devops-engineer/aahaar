import type {
  InventoryItem,
  MarketAvailability,
  StockAvailability,
} from '@/engines/resources/types'

export function stockAvailabilityForItem(
  item: InventoryItem | undefined,
  market?: MarketAvailability,
  ingredient?: string,
): StockAvailability {
  const key = (ingredient ?? item?.ingredient ?? '').toLowerCase()
  if (market?.unavailableIngredients.some((u) => u.toLowerCase() === key)) {
    return 'market_unavailable'
  }
  if (!item || item.quantity <= 0) return 'out_of_stock'
  if (item.freshness === 'expired') return 'unavailable'
  if (item.quantity <= item.minimumLevel) return 'low_stock'
  return 'available'
}

export function isUsable(status: StockAvailability): boolean {
  return status === 'available' || status === 'low_stock' || status === 'seasonal'
}
