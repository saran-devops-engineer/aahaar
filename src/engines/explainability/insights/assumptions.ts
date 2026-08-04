import { msg } from '@/engines/explainability/templates/messages'
import type { ExplanationInput, MessageRef } from '@/engines/explainability/types'

/** Explicit assumptions — only what inputs actually imply. */
export function buildAssumptions(input: ExplanationInput): MessageRef[] {
  const out: MessageRef[] = [
    msg(
      'assumption.memory_source',
      'Reasons come only from Decision Memory for this decision',
    ),
  ]

  if (!input.lifeContext) {
    out.push(
      msg(
        'assumption.no_life_context',
        'Life context was not provided for this explanation',
      ),
    )
  }
  if (!input.learningProfile) {
    out.push(
      msg(
        'assumption.no_learning',
        'Learning profile was not provided for this explanation',
      ),
    )
  }
  if (!input.confidence) {
    out.push(
      msg(
        'assumption.no_confidence',
        'Confidence engine result was not provided; using decision memory band only',
      ),
    )
  }
  if (input.decision.filtersApplied.length > 0) {
    out.push(
      msg('assumption.filters', 'Filters applied: {filters}', {
        filters: input.decision.filtersApplied.join(', '),
      }),
    )
  }

  return out
}
