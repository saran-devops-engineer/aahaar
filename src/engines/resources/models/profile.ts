import { RESOURCE_VERSION } from '@/engines/resources/constants'
import { createBudgetSnapshot } from '@/engines/resources/budget'
import { createKitchenCapabilities } from '@/engines/resources/kitchen'
import {
  createInventoryItem,
  refreshInventoryFreshness,
  type InventoryItemInput,
} from '@/engines/resources/inventory'
import type {
  LeftoverItem,
  ResourceHousehold,
  ResourceProfile,
} from '@/engines/resources/types'
import { createId } from '@/shared/utils/id'
import { computeFreshness } from '@/engines/resources/freshness'

export function createEmptyResourceProfile(
  userId: string,
  now = new Date().toISOString(),
): ResourceProfile {
  return Object.freeze({
    version: RESOURCE_VERSION,
    userId,
    createdAt: now,
    updatedAt: now,
    inventory: Object.freeze([]),
    leftovers: Object.freeze([]),
    kitchen: createKitchenCapabilities(),
    budget: createBudgetSnapshot(),
    household: Object.freeze({ familySize: 1, guests: 0, totalPeople: 1 }),
    availableCookingTimeMinutes: null,
    market: Object.freeze({
      status: 'unknown' as const,
      unavailableIngredients: Object.freeze([]),
    }),
  })
}

export function freezeProfile(profile: ResourceProfile): ResourceProfile {
  return Object.freeze({
    ...profile,
    inventory: Object.freeze([...profile.inventory]),
    leftovers: Object.freeze([...profile.leftovers]),
    kitchen: profile.kitchen,
    budget: profile.budget,
    household: Object.freeze({ ...profile.household }),
    market: Object.freeze({
      status: profile.market.status,
      unavailableIngredients: Object.freeze([
        ...profile.market.unavailableIngredients,
      ]),
    }),
  })
}

export function withInventory(
  profile: ResourceProfile,
  items: InventoryItemInput[],
  now = new Date().toISOString(),
): ResourceProfile {
  const inventory = refreshInventoryFreshness(
    items.map((i) => createInventoryItem(i, now)),
    now,
  )
  return freezeProfile({
    ...profile,
    inventory,
    updatedAt: now,
  })
}

export function withKitchen(
  profile: ResourceProfile,
  equipment: Parameters<typeof createKitchenCapabilities>[0],
  now = new Date().toISOString(),
): ResourceProfile {
  return freezeProfile({
    ...profile,
    kitchen: createKitchenCapabilities(equipment),
    updatedAt: now,
  })
}

export function withBudget(
  profile: ResourceProfile,
  budget: Parameters<typeof createBudgetSnapshot>[0],
  now = new Date().toISOString(),
): ResourceProfile {
  return freezeProfile({
    ...profile,
    budget: createBudgetSnapshot(budget),
    updatedAt: now,
  })
}

export function withCookingTime(
  profile: ResourceProfile,
  minutes: number | null,
  now = new Date().toISOString(),
): ResourceProfile {
  return freezeProfile({
    ...profile,
    availableCookingTimeMinutes: minutes,
    updatedAt: now,
  })
}

export function withHousehold(
  profile: ResourceProfile,
  household: Partial<ResourceHousehold>,
  now = new Date().toISOString(),
): ResourceProfile {
  const familySize = household.familySize ?? profile.household.familySize
  const guests = household.guests ?? profile.household.guests
  return freezeProfile({
    ...profile,
    household: Object.freeze({
      familySize,
      guests,
      totalPeople: familySize + guests,
    }),
    updatedAt: now,
  })
}

export function withLeftover(
  profile: ResourceProfile,
  leftover: Omit<LeftoverItem, 'id' | 'freshness'> & {
    id?: string
    freshness?: LeftoverItem['freshness']
  },
  now = new Date().toISOString(),
): ResourceProfile {
  const item: LeftoverItem = Object.freeze({
    id: leftover.id ?? createId('leftover'),
    foodId: leftover.foodId,
    label: leftover.label,
    quantity: leftover.quantity,
    unit: leftover.unit,
    expiryDate: leftover.expiryDate,
    freshness: leftover.freshness ?? computeFreshness(leftover.expiryDate, now),
  })
  return freezeProfile({
    ...profile,
    leftovers: [...profile.leftovers, item],
    updatedAt: now,
  })
}
