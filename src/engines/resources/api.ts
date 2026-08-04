import { computeResourceAnalytics } from '@/engines/resources/analytics'
import {
  createBudgetSnapshot,
  estimateBudgetFit,
} from '@/engines/resources/budget'
import {
  createInventoryItem,
  removeInventoryItem,
  upsertInventoryItem,
  type InventoryItemInput,
} from '@/engines/resources/inventory'
import {
  createEmptyResourceProfile,
  freezeProfile,
  withBudget,
  withCookingTime,
  withHousehold,
  withInventory,
  withKitchen,
  withLeftover,
} from '@/engines/resources/models/profile'
import {
  deserializeResourceProfile,
  exportResourceProfile,
  importResourceProfile,
  serializeResourceProfile,
} from '@/engines/resources/models/exportImport'
import {
  loadResourceProfile,
  saveResourceProfile,
} from '@/engines/resources/models/persist'
import {
  getAvailableCookingTime,
  getAvailableIngredients,
  getBudgetStatus,
  getExpiringFoods,
  getKitchenCapabilities,
} from '@/engines/resources/queries'
import { estimateBudget, estimateShopping } from '@/engines/resources/shopping'
import {
  evaluateResources,
  findAvailableMeals,
  findMissingIngredients,
} from '@/engines/resources/strategies/evaluate'
import {
  findSubstitutes,
  substitutionChain,
} from '@/engines/resources/strategies/substitute'
import type {
  MealResourceRequirement,
  ResourceEvaluation,
  ResourceProfile,
} from '@/engines/resources/types'

const memory = new Map<string, ResourceProfile>()

export function getResources(userId: string): ResourceProfile {
  return memory.get(userId) ?? createEmptyResourceProfile(userId)
}

export async function ensureResources(userId: string): Promise<ResourceProfile> {
  if (memory.has(userId)) return memory.get(userId)!
  const loaded = await loadResourceProfile(userId)
  memory.set(userId, loaded)
  return loaded
}

async function commit(profile: ResourceProfile): Promise<ResourceProfile> {
  const frozen = freezeProfile(profile)
  memory.set(frozen.userId, frozen)
  await saveResourceProfile(frozen)
  return frozen
}

export async function setResourceInventory(
  userId: string,
  items: InventoryItemInput[],
): Promise<ResourceProfile> {
  const current = await ensureResources(userId)
  return commit(withInventory(current, items))
}

export async function upsertResourceItem(
  userId: string,
  item: InventoryItemInput,
): Promise<ResourceProfile> {
  const current = await ensureResources(userId)
  const inventory = upsertInventoryItem(current.inventory, item)
  return commit(freezeProfile({ ...current, inventory, updatedAt: new Date().toISOString() }))
}

export async function setResourceKitchen(
  userId: string,
  equipment: Parameters<typeof withKitchen>[1],
): Promise<ResourceProfile> {
  const current = await ensureResources(userId)
  return commit(withKitchen(current, equipment))
}

export async function setResourceBudget(
  userId: string,
  budget: Parameters<typeof withBudget>[1],
): Promise<ResourceProfile> {
  const current = await ensureResources(userId)
  return commit(withBudget(current, budget))
}

export async function setResourceCookingTime(
  userId: string,
  minutes: number | null,
): Promise<ResourceProfile> {
  const current = await ensureResources(userId)
  return commit(withCookingTime(current, minutes))
}

export function evaluateResourcesForUser(
  userId: string,
  requirement: MealResourceRequirement,
): ResourceEvaluation {
  return evaluateResources(getResources(userId), requirement)
}

export function findAvailableMealsForUser(
  userId: string,
  requirements: readonly MealResourceRequirement[],
) {
  return findAvailableMeals(getResources(userId), requirements)
}

export function findMissingIngredientsForUser(
  userId: string,
  requirement: MealResourceRequirement,
) {
  return findMissingIngredients(getResources(userId), requirement)
}

export function findExpiringItemsForUser(userId: string) {
  return getExpiringFoods(getResources(userId))
}

export function estimateShoppingForUser(
  userId: string,
  requirements: readonly MealResourceRequirement[],
) {
  return estimateShopping(getResources(userId), requirements)
}

export function estimateBudgetForUser(
  userId: string,
  requirements: readonly MealResourceRequirement[],
) {
  return estimateBudget(getResources(userId), requirements)
}

export function resetResourceCache(userId?: string): void {
  if (userId) memory.delete(userId)
  else memory.clear()
}

/** Seed in-memory profile (tests / pure flows without Dexie). */
export function seedResources(profile: ResourceProfile): ResourceProfile {
  const frozen = freezeProfile(profile)
  memory.set(frozen.userId, frozen)
  return frozen
}

export {
  computeResourceAnalytics,
  createBudgetSnapshot,
  createEmptyResourceProfile,
  createInventoryItem,
  deserializeResourceProfile,
  estimateBudget,
  estimateBudgetFit,
  estimateShopping,
  evaluateResources,
  exportResourceProfile,
  findAvailableMeals,
  findExpiringItemsForUser as findExpiringItems,
  findMissingIngredients,
  findSubstitutes,
  getAvailableCookingTime,
  getAvailableIngredients,
  getBudgetStatus,
  getExpiringFoods,
  getKitchenCapabilities,
  importResourceProfile,
  removeInventoryItem,
  serializeResourceProfile,
  substitutionChain,
  withBudget,
  withCookingTime,
  withHousehold,
  withInventory,
  withKitchen,
  withLeftover,
}
