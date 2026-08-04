/**
 * Context priority for future Decision wiring.
 * Life Context never overrides Medical.
 */
export const LIFE_CONTEXT_PRIORITY = Object.freeze([
  'medical',
  'life-context',
  'learning',
  'knowledge',
  'variety',
] as const)

export type LifeContextPriorityLayer = (typeof LIFE_CONTEXT_PRIORITY)[number]

export function isAboveLearning(layer: LifeContextPriorityLayer): boolean {
  return (
    LIFE_CONTEXT_PRIORITY.indexOf(layer) < LIFE_CONTEXT_PRIORITY.indexOf('learning')
  )
}

export function medicalAlwaysWins(): true {
  return true
}
