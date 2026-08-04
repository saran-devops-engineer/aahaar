import type { GraphEdge, GraphEdgeType } from '@/engines/knowledge/graph/types'

export function edgeId(
  type: GraphEdgeType,
  fromId: string,
  toId: string,
): string {
  return `${type}|${fromId}|${toId}`
}

export function createEdge(
  type: GraphEdgeType,
  fromId: string,
  toId: string,
  weight = 100,
  meta?: GraphEdge['meta'],
): GraphEdge {
  return Object.freeze({
    id: edgeId(type, fromId, toId),
    type,
    fromId,
    toId,
    weight: clampWeight(weight),
    meta: meta ? Object.freeze({ ...meta }) : undefined,
  })
}

function clampWeight(weight: number): number {
  if (!Number.isFinite(weight)) return 0
  return Math.max(0, Math.min(100, Math.round(weight)))
}
