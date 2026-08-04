import { FOOD_CATALOG_VERSION } from '@/engines/knowledge/data/foods'
import { inferIngredients } from '@/engines/knowledge/graph/builders/inferIngredients'
import {
  inferCookingMethods,
  inferCuisines,
} from '@/engines/knowledge/graph/builders/inferTraits'
import {
  DEFAULT_TOP_REPLACEMENTS,
  DEFAULT_TOP_SIMILAR,
  DIET_VALUES,
  GOAL_VALUES,
  GRAPH_VERSION,
  MEAL_TYPE_VALUES,
  NUTRIENT_THRESHOLDS,
  SEASON_VALUES,
} from '@/engines/knowledge/graph/constants'
import { createEdge } from '@/engines/knowledge/graph/edges'
import { createNode, nodeId } from '@/engines/knowledge/graph/nodes/ids'
import { rankReplacementFoods } from '@/engines/knowledge/graph/ranking/replacement'
import { rankSimilarFoods } from '@/engines/knowledge/graph/ranking/similarity'
import type {
  GraphBuildOptions,
  GraphEdge,
  GraphEdgeType,
  GraphNode,
  GraphNodeType,
  KnowledgeGraph,
  ScoredFoodRef,
} from '@/engines/knowledge/graph/types'
import type {
  CostTier,
  Food,
  MealType,
  MedicalConditionId,
} from '@/types/domain'

/**
 * Builds an in-memory knowledge graph from the existing food catalog.
 * Regenerates fully whenever the catalog changes — no manual edge maintenance.
 */
export function buildKnowledgeGraph(
  foods: readonly Food[],
  options: GraphBuildOptions = {},
): KnowledgeGraph {
  const topSimilar = options.topSimilar ?? DEFAULT_TOP_SIMILAR
  const topReplacements = options.topReplacements ?? DEFAULT_TOP_REPLACEMENTS

  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const edgeKeys = new Set<string>()

  const ensureNode = (node: GraphNode) => {
    if (!nodes.has(node.id)) nodes.set(node.id, node)
  }

  const addEdge = (
    type: GraphEdgeType,
    fromId: string,
    toId: string,
    weight = 100,
    meta?: GraphEdge['meta'],
  ) => {
    const edge = createEdge(type, fromId, toId, weight, meta)
    if (edgeKeys.has(edge.id)) return
    edgeKeys.add(edge.id)
    edges.push(edge)
  }

  // Static taxonomy nodes
  for (const season of options.seasons ?? SEASON_VALUES) {
    ensureNode(createNode('Season', season, titleCase(season)))
  }
  for (const mealType of MEAL_TYPE_VALUES) {
    ensureNode(createNode('MealType', mealType, titleCase(mealType)))
  }
  for (const goal of GOAL_VALUES) {
    ensureNode(createNode('Goal', goal, titleCase(goal.replaceAll('_', ' '))))
  }
  for (const diet of DIET_VALUES) {
    ensureNode(createNode('DietType', diet, titleCase(diet)))
  }
  for (const tier of [1, 2, 3, 4, 5] as CostTier[]) {
    ensureNode(createNode('BudgetTier', String(tier), `Tier ${tier}`, { tier }))
  }
  for (const nutrient of Object.keys(NUTRIENT_THRESHOLDS)) {
    ensureNode(createNode('Nutrient', nutrient, nutrient))
  }

  const foodIndex = new Map<string, Food>()

  for (const food of foods) {
    foodIndex.set(food.id, food)
    const foodNode = createNode('Food', food.id, food.name, {
      foodId: food.id,
      category: food.category,
    })
    ensureNode(foodNode)

    // Meal composite node (same id namespace distinct type for meal-slot thinking)
    const mealNode = createNode('Meal', food.id, food.name)
    ensureNode(mealNode)
    addEdge('FOOD_PART_OF_MEAL', foodNode.id, mealNode.id, 100)

    for (const cuisine of inferCuisines(food)) {
      const cuisineNode = createNode('Cuisine', cuisine, cuisine)
      ensureNode(cuisineNode)
      addEdge('FOOD_BELONGS_TO_CUISINE', foodNode.id, cuisineNode.id, 100)
    }

    if (food.stateCodes.length === 0) {
      const pan = createNode('State', 'IN', 'Pan India')
      ensureNode(pan)
      addEdge('FOOD_AVAILABLE_IN_STATE', foodNode.id, pan.id, 80)
    } else {
      for (const stateCode of food.stateCodes) {
        const stateNode = createNode('State', stateCode, stateCode)
        ensureNode(stateNode)
        addEdge('FOOD_AVAILABLE_IN_STATE', foodNode.id, stateNode.id, 100)
      }
    }

    for (const districtId of food.districtIds) {
      const districtNode = createNode('District', districtId, districtId)
      ensureNode(districtNode)
      addEdge('FOOD_AVAILABLE_IN_DISTRICT', foodNode.id, districtNode.id, 100)
    }

    for (const season of food.seasons) {
      addEdge(
        'FOOD_BEST_IN_SEASON',
        foodNode.id,
        nodeId('Season', season),
        season === 'all' ? 70 : 100,
      )
    }

    for (const mealType of food.mealTypes) {
      addEdge('FOOD_MEAL_TYPE', foodNode.id, nodeId('MealType', mealType), 100)
    }

    addEdge('FOOD_COST_TIER', foodNode.id, nodeId('BudgetTier', String(food.costTier)), 100)

    const diets = dietTypesFor(food)
    for (const diet of diets) {
      addEdge('FOOD_DIET_TYPE', foodNode.id, nodeId('DietType', diet), 100)
    }

    for (const allergen of food.allergens) {
      const allergenNode = createNode('Allergen', allergen, titleCase(allergen))
      ensureNode(allergenNode)
      addEdge('FOOD_ALLERGEN', foodNode.id, allergenNode.id, 100)
    }

    for (const method of inferCookingMethods(food)) {
      const methodNode = createNode('CookingMethod', method, method)
      ensureNode(methodNode)
      addEdge('FOOD_PREPARATION', foodNode.id, methodNode.id, 100)
    }

    for (const ingredient of inferIngredients(food)) {
      const ingredientNode = createNode('Ingredient', ingredient, ingredient)
      ensureNode(ingredientNode)
      addEdge('FOOD_REQUIRES_INGREDIENT', foodNode.id, ingredientNode.id, 100)
    }

    linkNutrients(food, foodNode.id, ensureNode, addEdge)

    for (const [condition, verdict] of Object.entries(food.medicalSuitability)) {
      const conditionNode = createNode(
        'MedicalCondition',
        condition,
        titleCase(condition),
      )
      ensureNode(conditionNode)
      if (verdict === 'avoid') {
        addEdge('FOOD_AVOIDS_CONDITION', foodNode.id, conditionNode.id, 100)
      } else if (verdict === 'suitable') {
        addEdge('FOOD_RECOMMENDED_FOR_CONDITION', foodNode.id, conditionNode.id, 90)
      } else if (verdict === 'limit') {
        addEdge('FOOD_RECOMMENDED_FOR_CONDITION', foodNode.id, conditionNode.id, 40, {
          limited: true,
        })
      }
    }

    // Goal links are maintained via foodsByGoal index (see buildFoodIndexes).
  }

  // Similarity + replacement (+ pairs_with as soft reciprocal of strong similarity)
  const similarTo = new Map<string, readonly ScoredFoodRef[]>()
  const canReplace = new Map<string, readonly ScoredFoodRef[]>()

  for (const food of foods) {
    const similar = rankSimilarFoods(food, foods, topSimilar)
    similarTo.set(food.id, Object.freeze(similar.map(freezeScore)))
    for (const row of similar) {
      addEdge(
        'FOOD_SIMILAR_TO',
        nodeId('Food', food.id),
        nodeId('Food', row.foodId),
        row.score,
      )
      if (row.score >= 70) {
        addEdge(
          'FOOD_PAIRS_WITH',
          nodeId('Food', food.id),
          nodeId('Food', row.foodId),
          Math.round(row.score * 0.7),
        )
      }
    }

    const replacements = rankReplacementFoods(food, foods, topReplacements)
    canReplace.set(food.id, Object.freeze(replacements.map(freezeScore)))
    for (const row of replacements) {
      addEdge(
        'FOOD_CAN_REPLACE',
        nodeId('Food', food.id),
        nodeId('Food', row.foodId),
        row.score,
      )
    }
  }

  const outgoing = buildOutgoing(edges)
  const nodesByType = buildNodesByType(nodes)
  const indexes = buildFoodIndexes(foods, edges)

  return Object.freeze({
    version: `${GRAPH_VERSION}+foods-${FOOD_CATALOG_VERSION}`,
    builtAt: 'catalog-derived',
    sourceFoodCount: foods.length,
    nodeCount: nodes.size,
    edgeCount: edges.length,
    nodes,
    edges: Object.freeze([...edges]),
    outgoing,
    nodesByType,
    ...indexes,
    similarTo,
    canReplace,
    foodIndex,
  })
}

function linkNutrients(
  food: Food,
  foodNodeId: string,
  ensureNode: (node: GraphNode) => void,
  addEdge: (
    type: GraphEdgeType,
    fromId: string,
    toId: string,
    weight?: number,
    meta?: GraphEdge['meta'],
  ) => void,
) {
  const n = food.nutrition
  const values: Record<string, number | undefined> = {
    proteinG: n.proteinG,
    fiberG: n.fiberG,
    fatG: n.fatG,
    ironMg: n.ironMg,
    calciumMg: n.calciumMg,
    glycemicIndex: n.glycemicIndex,
  }

  for (const [key, value] of Object.entries(values)) {
    if (value == null) continue
    const nutrientNodeId = nodeId('Nutrient', key)
    ensureNode(createNode('Nutrient', key, key))
    addEdge('FOOD_CONTAINS_NUTRIENT', foodNodeId, nutrientNodeId, Math.min(100, value), {
      value,
    })

    const threshold = NUTRIENT_THRESHOLDS[key as keyof typeof NUTRIENT_THRESHOLDS]
    if (!threshold) continue

    // For GI, "high" is less desirable — still model as HIGH_IN glycemicIndex.
    if (value >= threshold.high) {
      addEdge('FOOD_HIGH_IN', foodNodeId, nutrientNodeId, 100, { value })
    } else if (value <= threshold.low) {
      addEdge('FOOD_LOW_IN', foodNodeId, nutrientNodeId, 100, { value })
    }
  }
}

function dietTypesFor(food: Food): string[] {
  const diets: string[] = []
  if (food.isVegan) diets.push('vegan')
  if (food.isJain) diets.push('jain')
  if (food.isVeg) diets.push('veg')
  if (food.allergens.includes('egg') || /egg/i.test(food.name)) diets.push('eggetarian')
  if (!food.isVeg) diets.push('nonveg')
  return diets
}

function buildOutgoing(
  edges: readonly GraphEdge[],
): Map<string, ReadonlyMap<GraphEdgeType, readonly GraphEdge[]>> {
  const map = new Map<string, Map<GraphEdgeType, GraphEdge[]>>()
  for (const edge of edges) {
    let byType = map.get(edge.fromId)
    if (!byType) {
      byType = new Map()
      map.set(edge.fromId, byType)
    }
    const list = byType.get(edge.type) ?? []
    list.push(edge)
    byType.set(edge.type, list)
  }
  const frozen = new Map<string, ReadonlyMap<GraphEdgeType, readonly GraphEdge[]>>()
  for (const [fromId, byType] of map) {
    const inner = new Map<GraphEdgeType, readonly GraphEdge[]>()
    for (const [type, list] of byType) inner.set(type, Object.freeze(list))
    frozen.set(fromId, inner)
  }
  return frozen
}

function buildNodesByType(
  nodes: Map<string, GraphNode>,
): Map<GraphNodeType, ReadonlySet<string>> {
  const map = new Map<GraphNodeType, Set<string>>()
  for (const node of nodes.values()) {
    const set = map.get(node.type) ?? new Set<string>()
    set.add(node.id)
    map.set(node.type, set)
  }
  return map
}

function buildFoodIndexes(foods: readonly Food[], edges: readonly GraphEdge[]) {
  const foodsByState = new Map<string, Set<string>>()
  const foodsByDistrict = new Map<string, Set<string>>()
  const foodsBySeason = new Map<string, Set<string>>()
  const foodsByMealType = new Map<MealType, Set<string>>()
  const foodsByCuisine = new Map<string, Set<string>>()
  const foodsByBudget = new Map<CostTier, Set<string>>()
  const foodsByDiet = new Map<string, Set<string>>()
  const foodsByAllergen = new Map<string, Set<string>>()
  const foodsRecommendedForCondition = new Map<MedicalConditionId, Set<string>>()
  const foodsAvoidedForCondition = new Map<MedicalConditionId, Set<string>>()
  const foodsHighIn = new Map<string, Set<string>>()
  const foodsLowIn = new Map<string, Set<string>>()
  const foodsByIngredient = new Map<string, Set<string>>()
  const foodsByGoal = new Map<string, Set<string>>()

  const add = (map: Map<string, Set<string>>, key: string, foodId: string) => {
    const set = map.get(key) ?? new Set<string>()
    set.add(foodId)
    map.set(key, set)
  }

  for (const food of foods) {
    if (food.stateCodes.length === 0) add(foodsByState, 'IN', food.id)
    for (const state of food.stateCodes) add(foodsByState, state, food.id)
    for (const district of food.districtIds) add(foodsByDistrict, district, food.id)
    for (const season of food.seasons) add(foodsBySeason, season, food.id)
    for (const mealType of food.mealTypes) {
      const set = foodsByMealType.get(mealType) ?? new Set<string>()
      set.add(food.id)
      foodsByMealType.set(mealType, set)
    }
    for (const cuisine of inferCuisines(food)) add(foodsByCuisine, cuisine, food.id)
    {
      const set = foodsByBudget.get(food.costTier) ?? new Set<string>()
      set.add(food.id)
      foodsByBudget.set(food.costTier, set)
    }
    for (const diet of dietTypesFor(food)) add(foodsByDiet, diet, food.id)
    for (const allergen of food.allergens) add(foodsByAllergen, allergen, food.id)
    for (const ingredient of inferIngredients(food)) {
      add(foodsByIngredient, ingredient.toLowerCase(), food.id)
    }

    // Goal heuristics (indexed, not duplicated nutrition)
    if (food.nutrition.proteinG >= 16) add(foodsByGoal, 'gain_muscle', food.id)
    if (food.nutrition.calories <= 350 && food.nutrition.fiberG >= 5) {
      add(foodsByGoal, 'lose_weight', food.id)
    }
    if (food.medicalSuitability.diabetes === 'suitable') {
      add(foodsByGoal, 'manage_condition', food.id)
    }
    add(foodsByGoal, 'maintain', food.id)
    add(foodsByGoal, 'general_wellness', food.id)
  }

  for (const edge of edges) {
    if (!edge.fromId.startsWith('Food:')) continue
    const foodId = edge.fromId.slice('Food:'.length)
    if (edge.type === 'FOOD_HIGH_IN') {
      add(foodsHighIn, edge.toId.replace('Nutrient:', ''), foodId)
    }
    if (edge.type === 'FOOD_LOW_IN') {
      add(foodsLowIn, edge.toId.replace('Nutrient:', ''), foodId)
    }
    if (edge.type === 'FOOD_RECOMMENDED_FOR_CONDITION') {
      const condition = edge.toId.replace('MedicalCondition:', '') as MedicalConditionId
      const set = foodsRecommendedForCondition.get(condition) ?? new Set<string>()
      set.add(foodId)
      foodsRecommendedForCondition.set(condition, set)
    }
    if (edge.type === 'FOOD_AVOIDS_CONDITION') {
      const condition = edge.toId.replace('MedicalCondition:', '') as MedicalConditionId
      const set = foodsAvoidedForCondition.get(condition) ?? new Set<string>()
      set.add(foodId)
      foodsAvoidedForCondition.set(condition, set)
    }
  }

  return {
    foodsByState: freezeMapSet(foodsByState),
    foodsByDistrict: freezeMapSet(foodsByDistrict),
    foodsBySeason: freezeMapSet(foodsBySeason),
    foodsByMealType: freezeMapSet(foodsByMealType),
    foodsByCuisine: freezeMapSet(foodsByCuisine),
    foodsByBudget: freezeMapSet(foodsByBudget),
    foodsByDiet: freezeMapSet(foodsByDiet),
    foodsByAllergen: freezeMapSet(foodsByAllergen),
    foodsRecommendedForCondition: freezeMapSet(foodsRecommendedForCondition),
    foodsAvoidedForCondition: freezeMapSet(foodsAvoidedForCondition),
    foodsHighIn: freezeMapSet(foodsHighIn),
    foodsLowIn: freezeMapSet(foodsLowIn),
    foodsByIngredient: freezeMapSet(foodsByIngredient),
    foodsByGoal: freezeMapSet(foodsByGoal),
  }
}

function freezeMapSet<K>(
  map: Map<K, Set<string>>,
): Map<K, ReadonlySet<string>> {
  const out = new Map<K, ReadonlySet<string>>()
  for (const [key, set] of map) out.set(key, set)
  return out
}

function freezeScore(row: ScoredFoodRef): ScoredFoodRef {
  return Object.freeze({
    foodId: row.foodId,
    score: row.score,
    reasons: Object.freeze([...row.reasons]),
  })
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
