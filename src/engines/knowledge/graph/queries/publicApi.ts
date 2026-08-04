import { getKnowledgeGraph } from '@/engines/knowledge/graph/builders/registry'
import { DEFAULT_QUERY_LIMIT } from '@/engines/knowledge/graph/constants'
import type {
  GraphQueryOptions,
  KnowledgeGraph,
  ScoredFoodRef,
} from '@/engines/knowledge/graph/types'
import type {
  CostTier,
  Food,
  MealType,
  MedicalConditionId,
  Season,
} from '@/types/domain'

function resolveFoods(
  foodIds: Iterable<string>,
  graph: KnowledgeGraph,
): Food[] {
  const out: Food[] = []
  for (const id of foodIds) {
    const food = graph.foodIndex.get(id)
    if (food) out.push(food)
  }
  return out
}

function intersect(sets: Array<ReadonlySet<string> | undefined>): Set<string> {
  const defined = sets.filter((set): set is ReadonlySet<string> => Boolean(set && set.size >= 0))
  if (defined.length === 0) return new Set()
  let result = new Set(defined[0])
  for (let i = 1; i < defined.length; i += 1) {
    const next = defined[i]!
    result = new Set([...result].filter((id) => next.has(id)))
  }
  return result
}

function applyFilters(
  foodIds: Iterable<string>,
  graph: KnowledgeGraph,
  options: GraphQueryOptions = {},
): Food[] {
  const exclude = new Set(options.excludeFoodIds ?? [])
  let ids = [...foodIds].filter((id) => !exclude.has(id))

  if (options.stateCode) {
    const regional = new Set([
      ...(graph.foodsByState.get(options.stateCode) ?? []),
      ...(graph.foodsByState.get('IN') ?? []),
    ])
    ids = ids.filter((id) => regional.has(id))
  }
  if (options.districtId) {
    const district = graph.foodsByDistrict.get(options.districtId)
    if (district) {
      // Soft: keep district hits first, but do not drop regional-only foods here.
      const preferred = ids.filter((id) => district.has(id))
      if (preferred.length > 0) ids = [...preferred, ...ids.filter((id) => !district.has(id))]
    }
  }
  if (options.mealType) {
    const set = graph.foodsByMealType.get(options.mealType)
    if (set) ids = ids.filter((id) => set.has(id))
  }
  if (options.season) {
    const set = new Set([
      ...(graph.foodsBySeason.get(options.season) ?? []),
      ...(graph.foodsBySeason.get('all') ?? []),
    ])
    ids = ids.filter((id) => set.has(id))
  }
  if (options.maxCostTier) {
    ids = ids.filter((id) => {
      const food = graph.foodIndex.get(id)
      return food != null && food.costTier <= options.maxCostTier!
    })
  }
  if (options.dietType) {
    const set = graph.foodsByDiet.get(options.dietType)
    if (set) ids = ids.filter((id) => set.has(id))
  }
  if (options.condition) {
    const avoided = graph.foodsAvoidedForCondition.get(options.condition)
    if (avoided) ids = ids.filter((id) => !avoided.has(id))
  }

  const limit = options.limit ?? DEFAULT_QUERY_LIMIT
  return resolveFoods(ids.slice(0, limit), graph)
}

export function findSimilarFoods(
  foodId: string,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): ScoredFoodRef[] {
  const rows = graph.similarTo.get(foodId) ?? []
  const exclude = new Set(options.excludeFoodIds ?? [])
  return rows
    .filter((row) => !exclude.has(row.foodId))
    .filter((row) => {
      if (!options.mealType) return true
      return graph.foodsByMealType.get(options.mealType)?.has(row.foodId)
    })
    .slice(0, options.limit ?? DEFAULT_QUERY_LIMIT)
}

export function findReplacementFoods(
  foodId: string,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): ScoredFoodRef[] {
  const rows = graph.canReplace.get(foodId) ?? []
  const exclude = new Set(options.excludeFoodIds ?? [])
  return rows
    .filter((row) => !exclude.has(row.foodId))
    .filter((row) => {
      if (options.condition) {
        const avoided = graph.foodsAvoidedForCondition.get(options.condition)
        if (avoided?.has(row.foodId)) return false
      }
      if (options.maxCostTier) {
        const food = graph.foodIndex.get(row.foodId)
        if (!food || food.costTier > options.maxCostTier) return false
      }
      return true
    })
    .slice(0, options.limit ?? DEFAULT_QUERY_LIMIT)
}

export function findFoodsByRegion(
  stateCode: string,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const ids = new Set([
    ...(graph.foodsByState.get(stateCode) ?? []),
    ...(graph.foodsByState.get('IN') ?? []),
  ])
  if (options.districtId) {
    const districtIds = graph.foodsByDistrict.get(options.districtId)
    if (districtIds && districtIds.size > 0) {
      return applyFilters(
        [...districtIds, ...ids],
        graph,
        { ...options, stateCode },
      )
    }
  }
  return applyFilters(ids, graph, { ...options, stateCode })
}

export function findFoodsByCondition(
  condition: MedicalConditionId,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const recommended = graph.foodsRecommendedForCondition.get(condition) ?? new Set()
  const avoided = graph.foodsAvoidedForCondition.get(condition) ?? new Set()
  const ids = [...recommended].filter((id) => !avoided.has(id))
  return applyFilters(ids, graph, { ...options, condition })
}

export function findFoodsByGoal(
  goal: string,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const ids = graph.foodsByGoal.get(goal) ?? new Set()
  return applyFilters(ids, graph, options)
}

export function findFoodsBySeason(
  season: Season,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const ids = new Set([
    ...(graph.foodsBySeason.get(season) ?? []),
    ...(graph.foodsBySeason.get('all') ?? []),
  ])
  return applyFilters(ids, graph, { ...options, season })
}

export function findFoodsByBudget(
  maxCostTier: CostTier,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const ids = new Set<string>()
  for (let tier = 1; tier <= maxCostTier; tier += 1) {
    for (const id of graph.foodsByBudget.get(tier as CostTier) ?? []) ids.add(id)
  }
  return applyFilters(ids, graph, { ...options, maxCostTier })
}

export function findFoodsByMealType(
  mealType: MealType,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const ids = graph.foodsByMealType.get(mealType) ?? new Set()
  return applyFilters(ids, graph, { ...options, mealType })
}

export function findFoodsByCuisine(
  cuisine: string,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const ids = graph.foodsByCuisine.get(cuisine) ?? new Set()
  return applyFilters(ids, graph, options)
}

export function findHighProteinFoods(
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const ids =
    graph.foodsHighIn.get('proteing') ??
    graph.foodsHighIn.get('proteinG') ??
    collectHighProteinFallback(graph)
  return applyFilters(ids, graph, options)
}

export function findLowGISnacks(
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const lowGi =
    graph.foodsLowIn.get('glycemicindex') ??
    graph.foodsLowIn.get('glycemicIndex') ??
    new Set<string>()
  const snacks = graph.foodsByMealType.get('snack') ?? new Set<string>()
  const ids = intersect([lowGi.size > 0 ? lowGi : null, snacks].filter(Boolean) as Array<
    ReadonlySet<string>
  >)
  const fallback =
    ids.size > 0
      ? ids
      : new Set(
          [...snacks].filter((id) => {
            const food = graph.foodIndex.get(id)
            return food != null && (food.nutrition.glycemicIndex ?? 100) <= 55
          }),
        )
  return applyFilters(fallback, graph, { ...options, mealType: 'snack' })
}

export function findFoodsHighInNutrient(
  nutrientKey: string,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const slug = nutrientKey.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const ids =
    graph.foodsHighIn.get(nutrientKey) ??
    graph.foodsHighIn.get(slug) ??
    new Set<string>()
  return applyFilters(ids, graph, options)
}

export function findFoodsByIngredient(
  ingredient: string,
  options: GraphQueryOptions = {},
  graph: KnowledgeGraph = getKnowledgeGraph(),
): Food[] {
  const key = ingredient.trim().toLowerCase()
  const exact = graph.foodsByIngredient.get(key)
  if (exact) return applyFilters(exact, graph, options)

  const matched = new Set<string>()
  for (const [label, ids] of graph.foodsByIngredient) {
    if (label.includes(key) || key.includes(label)) {
      for (const id of ids) matched.add(id)
    }
  }
  return applyFilters(matched, graph, options)
}

function collectHighProteinFallback(graph: KnowledgeGraph): Set<string> {
  const ids = new Set<string>()
  for (const food of graph.foodIndex.values()) {
    if (food.nutrition.proteinG >= 14) ids.add(food.id)
  }
  return ids
}
