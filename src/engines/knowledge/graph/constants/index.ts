import type { GraphEdgeType, GraphNodeType } from '@/engines/knowledge/graph/types'

export const GRAPH_VERSION = '1.5.0-kg'

export const NODE_TYPES: readonly GraphNodeType[] = [
  'Food',
  'Ingredient',
  'Meal',
  'Cuisine',
  'State',
  'District',
  'Season',
  'MedicalCondition',
  'Goal',
  'Nutrient',
  'BudgetTier',
  'MealType',
  'DietType',
  'Allergen',
  'CookingMethod',
  'Festival',
  'Weather',
  'PantryItem',
] as const

export const EDGE_TYPES: readonly GraphEdgeType[] = [
  'FOOD_BELONGS_TO_CUISINE',
  'FOOD_AVAILABLE_IN_STATE',
  'FOOD_AVAILABLE_IN_DISTRICT',
  'FOOD_BEST_IN_SEASON',
  'FOOD_CONTAINS_NUTRIENT',
  'FOOD_AVOIDS_CONDITION',
  'FOOD_RECOMMENDED_FOR_CONDITION',
  'FOOD_SIMILAR_TO',
  'FOOD_CAN_REPLACE',
  'FOOD_PAIRS_WITH',
  'FOOD_PART_OF_MEAL',
  'FOOD_REQUIRES_INGREDIENT',
  'FOOD_HIGH_IN',
  'FOOD_LOW_IN',
  'FOOD_COST_TIER',
  'FOOD_MEAL_TYPE',
  'FOOD_DIET_TYPE',
  'FOOD_ALLERGEN',
  'FOOD_PREPARATION',
] as const

export const DEFAULT_TOP_SIMILAR = 8
export const DEFAULT_TOP_REPLACEMENTS = 8
export const DEFAULT_QUERY_LIMIT = 20

/** Nutrient high/low thresholds used when creating FOOD_HIGH_IN / FOOD_LOW_IN. */
export const NUTRIENT_THRESHOLDS = {
  proteinG: { high: 14, low: 7 },
  fiberG: { high: 7, low: 3 },
  fatG: { high: 18, low: 6 },
  ironMg: { high: 3, low: 1 },
  calciumMg: { high: 150, low: 50 },
  glycemicIndex: { high: 70, low: 55 },
} as const

export const SEASON_VALUES = ['summer', 'monsoon', 'winter', 'all'] as const

export const MEAL_TYPE_VALUES = ['breakfast', 'lunch', 'snack', 'dinner'] as const

export const GOAL_VALUES = [
  'lose_weight',
  'maintain',
  'gain_muscle',
  'manage_condition',
  'general_wellness',
] as const

export const DIET_VALUES = ['veg', 'vegan', 'jain', 'eggetarian', 'nonveg'] as const
