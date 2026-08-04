/**
 * Public Knowledge Graph API.
 * Graph internals (adjacency maps, builders) are not exported.
 */
export {
  getGraphStats,
  getKnowledgeGraph,
  rebuildKnowledgeGraph,
} from '@/engines/knowledge/graph/builders/registry'
export {
  findFoodsByBudget,
  findFoodsByCondition,
  findFoodsByCuisine,
  findFoodsByGoal,
  findFoodsByIngredient,
  findFoodsByMealType,
  findFoodsByRegion,
  findFoodsBySeason,
  findFoodsHighInNutrient,
  findHighProteinFoods,
  findLowGISnacks,
  findReplacementFoods,
  findSimilarFoods,
} from '@/engines/knowledge/graph/queries/publicApi'
export type {
  GraphQueryOptions,
  KnowledgeGraph,
  ScoredFoodRef,
} from '@/engines/knowledge/graph/types'
