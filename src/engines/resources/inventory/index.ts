import { computeFreshness } from '@/engines/resources/freshness'
import {
  inferCategory,
  normalizeIngredientKey,
} from '@/engines/resources/inventory/normalize'
import type {
  IngredientCategory,
  InventoryItem,
  InventoryLocation,
  ResourceIndex,
} from '@/engines/resources/types'
import { createId } from '@/shared/utils/id'

export interface InventoryItemInput {
  readonly ingredient: string
  readonly quantity: number
  readonly unit?: string
  readonly purchaseDate?: string
  readonly expiryDate?: string
  readonly minimumLevel?: number
  readonly category?: IngredientCategory
  readonly location?: InventoryLocation
  readonly id?: string
  readonly updatedAt?: string
}

export function createInventoryItem(
  input: InventoryItemInput,
  now = new Date().toISOString(),
): InventoryItem {
  const freshness = computeFreshness(input.expiryDate, now)
  return Object.freeze({
    id: input.id ?? createId('inv'),
    ingredient: input.ingredient.trim(),
    quantity: Math.max(0, input.quantity),
    unit: input.unit ?? 'unit',
    purchaseDate: input.purchaseDate,
    expiryDate: input.expiryDate,
    minimumLevel: input.minimumLevel ?? 1,
    category: input.category ?? inferCategory(input.ingredient),
    location: input.location ?? 'pantry',
    freshness,
    updatedAt: input.updatedAt ?? now,
  })
}

export function refreshInventoryFreshness(
  items: readonly InventoryItem[],
  now = new Date().toISOString(),
): InventoryItem[] {
  return items.map((item) =>
    Object.freeze({
      ...item,
      freshness: computeFreshness(item.expiryDate, now),
      updatedAt: now,
    }),
  )
}

export function buildResourceIndex(items: readonly InventoryItem[]): ResourceIndex {
  const byIngredient = new Map<string, InventoryItem>()
  const byLocation = new Map<InventoryLocation, InventoryItem[]>()
  const byFreshness = new Map<string, InventoryItem[]>()
  const byCategory = new Map<string, InventoryItem[]>()
  const expiringIds: string[] = []
  const lowStockIds: string[] = []

  for (const item of items) {
    const key = normalizeIngredientKey(item.ingredient)
    const existing = byIngredient.get(key)
    if (!existing || item.quantity > existing.quantity) {
      byIngredient.set(key, item)
    }

    const loc = byLocation.get(item.location) ?? []
    loc.push(item)
    byLocation.set(item.location, loc)

    const fresh = byFreshness.get(item.freshness) ?? []
    fresh.push(item)
    byFreshness.set(item.freshness, fresh)

    const cat = byCategory.get(item.category) ?? []
    cat.push(item)
    byCategory.set(item.category, cat)

    if (
      item.freshness === 'consume_soon' ||
      item.freshness === 'expiring_today' ||
      item.freshness === 'expired'
    ) {
      expiringIds.push(item.id)
    }
    if (item.quantity <= item.minimumLevel) lowStockIds.push(item.id)
  }

  return Object.freeze({
    byIngredient,
    byLocation: byLocation as ResourceIndex['byLocation'],
    byFreshness: byFreshness as ResourceIndex['byFreshness'],
    byCategory: byCategory as ResourceIndex['byCategory'],
    expiringIds: Object.freeze(expiringIds),
    lowStockIds: Object.freeze(lowStockIds),
  })
}

export function upsertInventoryItem(
  items: readonly InventoryItem[],
  input: InventoryItemInput,
  now = new Date().toISOString(),
): InventoryItem[] {
  const next = createInventoryItem(input, now)
  const key = normalizeIngredientKey(next.ingredient)
  const without = items.filter((i) => {
    if (input.id && i.id === input.id) return false
    if (!input.id && normalizeIngredientKey(i.ingredient) === key) return false
    return true
  })
  return [...without, next]
}

export function removeInventoryItem(
  items: readonly InventoryItem[],
  ingredientOrId: string,
): InventoryItem[] {
  const key = normalizeIngredientKey(ingredientOrId)
  return items.filter(
    (i) => i.id !== ingredientOrId && normalizeIngredientKey(i.ingredient) !== key,
  )
}
