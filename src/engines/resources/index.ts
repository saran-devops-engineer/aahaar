/**
 * Resource Intelligence Engine (RIE).
 * Local pantry / kitchen / budget awareness. No AI. No cloud.
 * Does not modify Decision Engine — Decision may call these APIs later.
 */
export {
  computeResourceAnalytics,
  createBudgetSnapshot,
  createEmptyResourceProfile,
  createInventoryItem,
  deserializeResourceProfile,
  ensureResources,
  estimateBudget,
  estimateBudgetForUser as estimateBudgetApi,
  estimateShopping,
  estimateShoppingForUser as estimateShoppingApi,
  evaluateResources,
  evaluateResourcesForUser,
  exportResourceProfile,
  findAvailableMeals,
  findAvailableMealsForUser,
  findExpiringItems,
  findMissingIngredients,
  findMissingIngredientsForUser,
  findSubstitutes,
  getAvailableCookingTime,
  getAvailableIngredients,
  getBudgetStatus,
  getExpiringFoods,
  getKitchenCapabilities,
  getResources,
  importResourceProfile,
  resetResourceCache,
  seedResources,
  serializeResourceProfile,
  setResourceBudget,
  setResourceCookingTime,
  setResourceInventory,
  setResourceKitchen,
  substitutionChain,
  upsertResourceItem,
  withBudget,
  withCookingTime,
  withHousehold,
  withInventory,
  withKitchen,
  withLeftover,
} from '@/engines/resources/api'

/** Spec-named developer API aliases. */
export {
  evaluateResourcesForUser as evaluateResourcesFor,
  findAvailableMealsForUser as findAvailableMealsFor,
  estimateShoppingForUser as estimateShoppingFor,
  estimateBudgetForUser as estimateBudgetFor,
} from '@/engines/resources/api'

export { RESOURCE_VERSION } from '@/engines/resources/constants'
export { buildResourceIndex } from '@/engines/resources/inventory'
export { computeFreshness, daysUntilExpiry } from '@/engines/resources/freshness'

export type {
  BudgetSnapshot,
  FreshnessStatus,
  InventoryItem,
  KitchenCapabilities,
  KitchenEquipmentId,
  MealResourceRequirement,
  ResourceAnalytics,
  ResourceEvaluation,
  ResourceIndex,
  ResourceProfile,
  ShoppingEstimate,
  StockAvailability,
} from '@/engines/resources/types'
