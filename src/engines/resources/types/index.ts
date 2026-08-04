export type ResourceVersion = `${number}.${number}.${number}`

export type InventoryLocation = 'pantry' | 'refrigerator' | 'freezer' | 'counter' | 'other'

export type IngredientCategory =
  | 'grain'
  | 'pulse'
  | 'vegetable'
  | 'fruit'
  | 'dairy'
  | 'protein'
  | 'spice'
  | 'oil'
  | 'condiment'
  | 'beverage'
  | 'other'

export type FreshnessStatus =
  | 'fresh'
  | 'good'
  | 'consume_soon'
  | 'expiring_today'
  | 'expired'
  | 'unknown'

export type StockAvailability =
  | 'available'
  | 'unavailable'
  | 'low_stock'
  | 'out_of_stock'
  | 'seasonal'
  | 'market_unavailable'

export type KitchenEquipmentId =
  | 'gas_stove'
  | 'induction'
  | 'pressure_cooker'
  | 'air_fryer'
  | 'microwave'
  | 'mixer'
  | 'oven'
  | 'rice_cooker'
  | 'slow_cooker'
  | string

export type CookingFuel = 'gas' | 'induction' | 'electric' | 'none' | 'unknown'

export interface InventoryItem {
  readonly id: string
  readonly ingredient: string
  readonly quantity: number
  readonly unit: string
  readonly purchaseDate?: string
  readonly expiryDate?: string
  readonly minimumLevel: number
  readonly category: IngredientCategory
  readonly location: InventoryLocation
  readonly freshness: FreshnessStatus
  readonly updatedAt: string
}

export interface KitchenCapabilities {
  readonly equipment: readonly KitchenEquipmentId[]
  readonly fuels: readonly CookingFuel[]
  readonly hasGas: boolean
  readonly hasInduction: boolean
  readonly hasPressureCooker: boolean
  readonly hasMicrowave: boolean
  readonly hasMixer: boolean
  readonly hasOven: boolean
  readonly hasRiceCooker: boolean
  readonly hasAirFryer: boolean
  readonly hasSlowCooker: boolean
}

export interface BudgetSnapshot {
  readonly monthly: number | null
  readonly weekly: number | null
  readonly daily: number | null
  readonly spent: number
  readonly remaining: number | null
  readonly projected: number | null
  readonly shoppingBudget: number | null
  readonly currency: string
  readonly exhausted: boolean
}

export interface ResourceHousehold {
  readonly familySize: number
  readonly guests: number
  readonly totalPeople: number
}

export interface LeftoverItem {
  readonly id: string
  readonly foodId?: string
  readonly label: string
  readonly quantity: number
  readonly unit: string
  readonly expiryDate?: string
  readonly freshness: FreshnessStatus
}

export interface MarketAvailability {
  readonly status: 'low' | 'normal' | 'high' | 'unknown'
  readonly unavailableIngredients: readonly string[]
}

export interface ResourceProfile {
  readonly version: ResourceVersion
  readonly userId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly inventory: readonly InventoryItem[]
  readonly leftovers: readonly LeftoverItem[]
  readonly kitchen: KitchenCapabilities
  readonly budget: BudgetSnapshot
  readonly household: ResourceHousehold
  readonly availableCookingTimeMinutes: number | null
  readonly market: MarketAvailability
}

/** Indexed view for O(1) ingredient lookups. */
export interface ResourceIndex {
  readonly byIngredient: ReadonlyMap<string, InventoryItem>
  readonly byLocation: ReadonlyMap<InventoryLocation, readonly InventoryItem[]>
  readonly byFreshness: ReadonlyMap<FreshnessStatus, readonly InventoryItem[]>
  readonly byCategory: ReadonlyMap<IngredientCategory, readonly InventoryItem[]>
  readonly expiringIds: readonly string[]
  readonly lowStockIds: readonly string[]
}

export interface MealResourceRequirement {
  readonly foodId: string
  readonly foodName?: string
  readonly ingredients: readonly string[]
  readonly requiredEquipment?: readonly KitchenEquipmentId[]
  readonly estimatedPrepMinutes?: number
  readonly estimatedCost?: number
  readonly needsGas?: boolean
  readonly needsPressureCooker?: boolean
}

export interface ResourceEvaluation {
  readonly foodId: string
  readonly possible: boolean
  readonly score: number
  readonly missingIngredients: readonly string[]
  readonly lowStockIngredients: readonly string[]
  readonly equipmentGaps: readonly string[]
  readonly timeOk: boolean | null
  readonly budgetOk: boolean | null
  readonly preferBecauseExpiring: readonly string[]
  readonly preferBecauseLeftover: boolean
  readonly reasons: readonly string[]
}

export interface ShoppingItemEstimate {
  readonly ingredient: string
  readonly quantity: number
  readonly unit: string
  readonly category: IngredientCategory
  readonly priority: 'critical' | 'high' | 'medium' | 'optional'
  readonly estimatedCost: number
  readonly optional: boolean
}

export interface ShoppingEstimate {
  readonly needed: readonly ShoppingItemEstimate[]
  readonly missing: readonly string[]
  readonly budgetEstimate: number
  readonly withinShoppingBudget: boolean | null
  readonly grouped: Readonly<Record<IngredientCategory, readonly ShoppingItemEstimate[]>>
  readonly avoidDuplicates: readonly string[]
}

export interface ResourceAnalytics {
  readonly inventoryCount: number
  readonly expiringCount: number
  readonly expiredCount: number
  readonly lowStockCount: number
  readonly leftoverCount: number
  readonly budgetRemaining: number | null
  readonly wasteRiskScore: number
}

export interface ResourceExportBundle {
  readonly format: 'aahaar.resources.profile'
  readonly version: ResourceVersion
  readonly exportedAt: string
  readonly profile: ResourceProfile
}
