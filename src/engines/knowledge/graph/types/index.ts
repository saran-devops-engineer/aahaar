import type {
  CostTier,
  Food,
  MealType,
  MedicalConditionId,
  Season,
} from '@/types/domain'

export type GraphNodeType =
  | 'Food'
  | 'Ingredient'
  | 'Meal'
  | 'Cuisine'
  | 'State'
  | 'District'
  | 'Season'
  | 'MedicalCondition'
  | 'Goal'
  | 'Nutrient'
  | 'BudgetTier'
  | 'MealType'
  | 'DietType'
  | 'Allergen'
  | 'CookingMethod'
  | 'Festival'
  | 'Weather'
  | 'PantryItem'

export type GraphEdgeType =
  | 'FOOD_BELONGS_TO_CUISINE'
  | 'FOOD_AVAILABLE_IN_STATE'
  | 'FOOD_AVAILABLE_IN_DISTRICT'
  | 'FOOD_BEST_IN_SEASON'
  | 'FOOD_CONTAINS_NUTRIENT'
  | 'FOOD_AVOIDS_CONDITION'
  | 'FOOD_RECOMMENDED_FOR_CONDITION'
  | 'FOOD_SIMILAR_TO'
  | 'FOOD_CAN_REPLACE'
  | 'FOOD_PAIRS_WITH'
  | 'FOOD_PART_OF_MEAL'
  | 'FOOD_REQUIRES_INGREDIENT'
  | 'FOOD_HIGH_IN'
  | 'FOOD_LOW_IN'
  | 'FOOD_COST_TIER'
  | 'FOOD_MEAL_TYPE'
  | 'FOOD_DIET_TYPE'
  | 'FOOD_ALLERGEN'
  | 'FOOD_PREPARATION'

export interface GraphNode {
  readonly id: string
  readonly type: GraphNodeType
  readonly label: string
  /** Opaque metadata — never copies full Food nutrition payloads. */
  readonly meta?: Readonly<Record<string, string | number | boolean>>
}

export interface GraphEdge {
  readonly id: string
  readonly type: GraphEdgeType
  readonly fromId: string
  readonly toId: string
  /** Deterministic weight in [0, 100]. */
  readonly weight: number
  readonly meta?: Readonly<Record<string, string | number | boolean>>
}

export interface ScoredFoodRef {
  readonly foodId: string
  readonly score: number
  readonly reasons: readonly string[]
}

/**
 * In-memory knowledge graph with adjacency + reverse indexes.
 * Food payloads are referenced by id only (resolved via foodIndex).
 */
export interface KnowledgeGraph {
  readonly version: string
  readonly builtAt: string
  readonly sourceFoodCount: number
  readonly nodeCount: number
  readonly edgeCount: number
  readonly nodes: ReadonlyMap<string, GraphNode>
  readonly edges: readonly GraphEdge[]
  /** fromId → edgeType → edges */
  readonly outgoing: ReadonlyMap<string, ReadonlyMap<GraphEdgeType, readonly GraphEdge[]>>
  /** nodeType → node ids */
  readonly nodesByType: ReadonlyMap<GraphNodeType, ReadonlySet<string>>
  /** Fast food-id indexes (sets of food ids). */
  readonly foodsByState: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsByDistrict: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsBySeason: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsByMealType: ReadonlyMap<MealType, ReadonlySet<string>>
  readonly foodsByCuisine: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsByBudget: ReadonlyMap<CostTier, ReadonlySet<string>>
  readonly foodsByDiet: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsByAllergen: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsRecommendedForCondition: ReadonlyMap<
    MedicalConditionId,
    ReadonlySet<string>
  >
  readonly foodsAvoidedForCondition: ReadonlyMap<
    MedicalConditionId,
    ReadonlySet<string>
  >
  readonly foodsHighIn: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsLowIn: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsByIngredient: ReadonlyMap<string, ReadonlySet<string>>
  readonly foodsByGoal: ReadonlyMap<string, ReadonlySet<string>>
  /** Precomputed top similar / replacement lists. */
  readonly similarTo: ReadonlyMap<string, readonly ScoredFoodRef[]>
  readonly canReplace: ReadonlyMap<string, readonly ScoredFoodRef[]>
  /** Food id → catalog object reference (not a deep copy). */
  readonly foodIndex: ReadonlyMap<string, Food>
}

export interface GraphBuildOptions {
  readonly seasons?: readonly Season[]
  readonly topSimilar?: number
  readonly topReplacements?: number
}

export interface GraphQueryOptions {
  readonly limit?: number
  readonly stateCode?: string
  readonly districtId?: string
  readonly mealType?: MealType
  readonly season?: Season
  readonly maxCostTier?: CostTier
  readonly condition?: MedicalConditionId
  readonly dietType?: 'veg' | 'vegan' | 'jain' | 'eggetarian' | 'nonveg'
  readonly excludeFoodIds?: readonly string[]
}
