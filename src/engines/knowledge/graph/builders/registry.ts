import { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
import { FOOD_CATALOG_VERSION } from '@/engines/knowledge/data/foods'
import { buildKnowledgeGraph } from '@/engines/knowledge/graph/builders/buildKnowledgeGraph'
import type { KnowledgeGraph } from '@/engines/knowledge/graph/types'
import type { Food } from '@/types/domain'

let cached: KnowledgeGraph | null = null
let cachedKey = ''

function cacheKey(foods: readonly Food[]): string {
  return `${FOOD_CATALOG_VERSION}:${foods.length}`
}

/** Returns the in-memory graph, rebuilding when the catalog fingerprint changes. */
export function getKnowledgeGraph(foods: readonly Food[] = FOOD_CATALOG): KnowledgeGraph {
  const key = cacheKey(foods)
  if (!cached || cachedKey !== key) {
    cached = buildKnowledgeGraph(foods)
    cachedKey = key
  }
  return cached
}

/** Force rebuild (e.g. after catalog sync upserts). */
export function rebuildKnowledgeGraph(foods: readonly Food[] = FOOD_CATALOG): KnowledgeGraph {
  cached = buildKnowledgeGraph(foods)
  cachedKey = cacheKey(foods)
  return cached
}

export function getGraphStats(graph: KnowledgeGraph = getKnowledgeGraph()) {
  return Object.freeze({
    version: graph.version,
    foods: graph.sourceFoodCount,
    nodes: graph.nodeCount,
    edges: graph.edgeCount,
  })
}
