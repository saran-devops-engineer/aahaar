import { describe, expect, it } from 'vitest'
import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import { buildKnowledgeGraph } from '@/engines/knowledge/graph/builders/buildKnowledgeGraph'
import { EDGE_TYPES } from '@/engines/knowledge/graph/constants'
import {
  findFoodsByCondition,
  findFoodsByIngredient,
  findFoodsByRegion,
  findHighProteinFoods,
  findLowGISnacks,
  findReplacementFoods,
  findSimilarFoods,
  getKnowledgeGraph,
  rebuildKnowledgeGraph,
} from '@/engines/knowledge/graph'
import { similarityScore } from '@/engines/knowledge/graph/ranking/similarity'
import { replacementScore } from '@/engines/knowledge/graph/ranking/replacement'

describe('Knowledge Graph Engine', () => {
  it('generates nodes and edges from the food catalog automatically', () => {
    const graph = rebuildKnowledgeGraph(FOOD_CATALOG)
    expect(graph.sourceFoodCount).toBe(FOOD_CATALOG.length)
    expect(graph.nodeCount).toBeGreaterThan(FOOD_CATALOG.length)
    expect(graph.edgeCount).toBeGreaterThan(FOOD_CATALOG.length * 5)
    expect(graph.nodesByType.get('Food')?.size).toBe(FOOD_CATALOG.length)
    expect(graph.foodIndex.size).toBe(FOOD_CATALOG.length)
  })

  it('creates expected relationship types', () => {
    const graph = getKnowledgeGraph()
    const present = new Set(graph.edges.map((edge) => edge.type))
    for (const type of [
      'FOOD_BELONGS_TO_CUISINE',
      'FOOD_AVAILABLE_IN_STATE',
      'FOOD_MEAL_TYPE',
      'FOOD_SIMILAR_TO',
      'FOOD_CAN_REPLACE',
      'FOOD_REQUIRES_INGREDIENT',
      'FOOD_COST_TIER',
    ] as const) {
      expect(present.has(type), type).toBe(true)
    }
    expect(EDGE_TYPES.length).toBeGreaterThan(10)
  })

  it('computes deterministic similarity', () => {
    const idli = FOOD_CATALOG.find((f) => f.id === 'food-idli-sambar')!
    const dosa = FOOD_CATALOG.find((f) => f.id === 'food-masala-dosa')!
    const roti = FOOD_CATALOG.find((f) => f.id === 'food-roti-sabzi')!
    const a = similarityScore(idli, dosa)
    const b = similarityScore(idli, dosa)
    expect(a.score).toBe(b.score)
    expect(a.score).toBeGreaterThan(similarityScore(idli, roti).score)

    const similar = findSimilarFoods('food-idli-sambar', { limit: 5 })
    expect(similar.length).toBeGreaterThan(0)
    expect(similar[0]!.score).toBeGreaterThanOrEqual(similar.at(-1)!.score)
  })

  it('ranks replacements with protein/diet awareness', () => {
    const paneer = FOOD_CATALOG.find((f) => f.id === 'food-palak-paneer')!
    const chicken = FOOD_CATALOG.find((f) => f.id === 'food-chicken-millet')
    if (chicken) {
      expect(replacementScore(paneer, chicken).score).toBeLessThan(50)
    }
    const replacements = findReplacementFoods('food-palak-paneer', { limit: 8 })
    expect(replacements.length).toBeGreaterThan(0)
    for (const row of replacements) {
      const food = FOOD_CATALOG.find((f) => f.id === row.foodId)!
      expect(food.isVeg).toBe(true)
    }
  })

  it('answers regional and condition queries via indexes', () => {
    const nelloreLunch = findFoodsByRegion('AP', {
      districtId: 'ap-sri-potti-sriramulu-nellore',
      mealType: 'lunch',
      limit: 15,
    })
    expect(nelloreLunch.length).toBeGreaterThan(0)
    expect(nelloreLunch.every((f) => f.mealTypes.includes('lunch'))).toBe(true)

    const diabetic = findFoodsByCondition('diabetes', { mealType: 'breakfast', limit: 10 })
    expect(diabetic.length).toBeGreaterThan(0)
    expect(diabetic.every((f) => f.medicalSuitability.diabetes !== 'avoid')).toBe(true)
  })

  it('finds high protein, low GI snacks, and ingredient meals', () => {
    const protein = findHighProteinFoods({ limit: 10 })
    expect(protein.length).toBeGreaterThan(0)
    expect(protein.every((f) => f.nutrition.proteinG >= 10)).toBe(true)

    const snacks = findLowGISnacks({ limit: 10 })
    expect(snacks.every((f) => f.mealTypes.includes('snack'))).toBe(true)

    const riceMeals = findFoodsByIngredient('Rice', { mealType: 'lunch', limit: 10 })
    expect(riceMeals.length).toBeGreaterThan(0)
  })

  it('validates edge endpoints exist as nodes', () => {
    const graph = buildKnowledgeGraph(FOOD_CATALOG)
    for (const edge of graph.edges) {
      expect(graph.nodes.has(edge.fromId), edge.fromId).toBe(true)
      expect(graph.nodes.has(edge.toId), edge.toId).toBe(true)
      expect(edge.weight).toBeGreaterThanOrEqual(0)
      expect(edge.weight).toBeLessThanOrEqual(100)
    }
  })

  it('stays fast for repeated lookups (indexed)', () => {
    const graph = getKnowledgeGraph()
    const start = performance.now()
    for (let i = 0; i < 200; i += 1) {
      findSimilarFoods('food-curd-rice', { limit: 5 }, graph)
      findFoodsByRegion('AP', { mealType: 'lunch', limit: 10 }, graph)
      findHighProteinFoods({ maxCostTier: 2, limit: 10 }, graph)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(250)
  })
})
