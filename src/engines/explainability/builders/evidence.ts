import { MAX_EVIDENCE } from '@/engines/explainability/constants'
import { messageForReasonCode, msg } from '@/engines/explainability/templates/messages'
import { prioritizeCodes } from '@/engines/explainability/templates/registry'
import type {
  EvidenceItem,
  ExplanationInput,
  ExplanationTemplateId,
} from '@/engines/explainability/types'
import type { ReasonCode } from '@/engines/decision-memory/types'

function strengthFor(code: ReasonCode): EvidenceItem['strength'] {
  if (
    code.startsWith('MEDICAL') ||
    code.includes('SAFE') ||
    code === 'HIGH_PROTEIN' ||
    code === 'REGIONAL_MATCH'
  ) {
    return 'high'
  }
  if (code === 'DEFAULT_BALANCE' || code === 'POOL_WIDENED') return 'low'
  return 'medium'
}

/**
 * Evidence ONLY from Decision Memory reason codes (+ optional confidence/life/learning annotations).
 * Never invents nutrition claims.
 */
export function buildEvidence(
  input: ExplanationInput,
  templateId: ExplanationTemplateId,
): EvidenceItem[] {
  const { decision } = input
  const items: EvidenceItem[] = []
  const codes = prioritizeCodes(decision.reasonCodes, templateId)

  for (const code of codes.slice(0, MAX_EVIDENCE)) {
    items.push(
      Object.freeze({
        id: `ev_${decision.decisionId}_${code}`,
        code,
        message: messageForReasonCode(code),
        source: 'decision_memory',
        decisionId: decision.decisionId,
        strength: strengthFor(code),
      }),
    )
  }

  // Confidence as evidence only if provided (not invented).
  if (input.confidence) {
    items.push(
      Object.freeze({
        id: `ev_${decision.decisionId}_confidence`,
        code: `CONFIDENCE_${input.confidence.level.toUpperCase()}`,
        message: msg(
          'evidence.confidence_score',
          'Confidence {score}/100 ({level})',
          {
            score: input.confidence.score,
            level: input.confidence.level,
          },
        ),
        source: 'confidence',
        decisionId: decision.decisionId,
        strength:
          input.confidence.level === 'high'
            ? 'high'
            : input.confidence.level === 'medium'
              ? 'medium'
              : 'low',
      }),
    )
  }

  // Learning affinity only when profile has recorded affinity for this food.
  const affinity = input.learningProfile?.foodAffinity[decision.acceptedMeal]
  if (affinity && affinity.score >= 65) {
    items.push(
      Object.freeze({
        id: `ev_${decision.decisionId}_liked`,
        code: 'LIKED_PREVIOUSLY',
        message: messageForReasonCode('LIKED_PREVIOUSLY'),
        source: 'learning',
        decisionId: decision.decisionId,
        strength: 'medium',
      }),
    )
  }

  // Life context season only if decision already has season code OR life season matches a decision code.
  if (input.lifeContext?.festival) {
    items.push(
      Object.freeze({
        id: `ev_${decision.decisionId}_festival`,
        code: 'FESTIVAL_TODAY',
        message: msg('evidence.festival', 'Festival context: {name}', {
          name: input.lifeContext.festival,
        }),
        source: 'life_context',
        decisionId: decision.decisionId,
        strength: 'low',
      }),
    )
  }

  return items.slice(0, MAX_EVIDENCE)
}
