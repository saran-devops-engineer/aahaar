import type { GraphNode, GraphNodeType } from '@/engines/knowledge/graph/types'

export function nodeId(type: GraphNodeType, key: string): string {
  const slug = key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${type}:${slug}`
}

export function createNode(
  type: GraphNodeType,
  key: string,
  label: string,
  meta?: GraphNode['meta'],
): GraphNode {
  return Object.freeze({
    id: nodeId(type, key),
    type,
    label,
    meta: meta ? Object.freeze({ ...meta }) : undefined,
  })
}
