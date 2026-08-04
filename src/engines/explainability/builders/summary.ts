import { msg } from '@/engines/explainability/templates/messages'
import { resolveMessage } from '@/engines/explainability/templates/messages'
import type {
  EvidenceItem,
  ExplanationInput,
  MessageRef,
} from '@/engines/explainability/types'

export function buildSummary(
  input: ExplanationInput,
  evidence: readonly EvidenceItem[],
  mealLabel: string,
): MessageRef {
  const top = evidence
    .filter((e) => e.source === 'decision_memory')
    .slice(0, 3)
    .map((e) => resolveMessage(e.message))

  const why =
    top.length > 0
      ? top.join(' · ')
      : input.decision.finalExplanation || 'Recorded decision factors'

  return msg(
    'summary.default',
    '{meal} was chosen because: {why}',
    { meal: mealLabel, why },
  )
}

export function buildRecommendations(
  input: ExplanationInput,
  missingCount: number,
): MessageRef[] {
  const out: MessageRef[] = []
  out.push(
    msg(
      'recommend.follow_plan',
      'Follow this meal unless medical needs change',
    ),
  )
  if (input.confidence?.level === 'low') {
    out.push(
      msg(
        'recommend.confirm',
        'Double-check ingredients against your allergies and conditions',
      ),
    )
  }
  if (missingCount > 0) {
    out.push(
      msg(
        'recommend.fill_gaps',
        'Add missing context ({count} gaps) to raise confidence',
        { count: missingCount },
      ),
    )
  }
  return out
}
