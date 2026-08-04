import {
  DEFAULT_TEMPLATE,
  MEDICAL_REASON_CODES,
  NUTRITION_REASON_CODES,
} from '@/engines/explainability/constants'
import { msg } from '@/engines/explainability/templates/messages'
import type {
  ExplanationTemplateId,
  MessageRef,
} from '@/engines/explainability/types'
import type { DecisionRecord, ReasonCode } from '@/engines/decision-memory/types'

export interface TemplateProfile {
  readonly id: ExplanationTemplateId
  readonly titleKey: string
  readonly emphasis: readonly ('medical' | 'nutrition' | 'fitness' | 'kids' | 'pregnancy')[]
  readonly preferCodes: readonly string[]
}

export const TEMPLATES: Readonly<Record<ExplanationTemplateId, TemplateProfile>> = Object.freeze({
  general_health: {
    id: 'general_health',
    titleKey: 'template.general_health.title',
    emphasis: ['nutrition'],
    preferCodes: ['BALANCED_PLATE', 'HIGH_FIBER', 'REGIONAL_MATCH'],
  },
  medical: {
    id: 'medical',
    titleKey: 'template.medical.title',
    emphasis: ['medical'],
    preferCodes: [...MEDICAL_REASON_CODES],
  },
  fitness: {
    id: 'fitness',
    titleKey: 'template.fitness.title',
    emphasis: ['fitness', 'nutrition'],
    preferCodes: ['HIGH_PROTEIN', 'HIGH_SATIETY', 'BALANCED_PLATE'],
  },
  weight_loss: {
    id: 'weight_loss',
    titleKey: 'template.weight_loss.title',
    emphasis: ['nutrition'],
    preferCodes: ['HIGH_FIBER', 'HIGH_SATIETY', 'LOW_GI', 'LOW_BUDGET'],
  },
  kids: {
    id: 'kids',
    titleKey: 'template.kids.title',
    emphasis: ['kids', 'nutrition'],
    preferCodes: ['FAMILY_FRIENDLY', 'HIGH_CALCIUM', 'HIGH_IRON', 'LOW_PREP_TIME'],
  },
  pregnancy: {
    id: 'pregnancy',
    titleKey: 'template.pregnancy.title',
    emphasis: ['pregnancy', 'medical'],
    preferCodes: ['PREGNANCY_SAFE', 'HIGH_IRON', 'HIGH_CALCIUM', 'HIGH_FIBER'],
  },
})

export function resolveTemplateId(
  decision: DecisionRecord,
  requested?: ExplanationTemplateId,
): ExplanationTemplateId {
  if (requested) return requested
  const conditions = decision.constraints.conditions.map((c) => c.toLowerCase())
  if (conditions.includes('pregnancy')) return 'pregnancy'
  if (conditions.includes('children')) return 'kids'
  if (
    conditions.some((c) =>
      ['diabetes', 'ckd', 'hypertension', 'thyroid', 'pcos'].includes(c),
    )
  ) {
    return 'medical'
  }
  if (decision.reasonCodes.includes('HIGH_PROTEIN')) return 'fitness'
  return DEFAULT_TEMPLATE
}

export function templateTitle(
  templateId: ExplanationTemplateId,
  mealLabel: string,
): MessageRef {
  const profile = TEMPLATES[templateId] ?? TEMPLATES.general_health
  const defaults: Record<ExplanationTemplateId, string> = {
    general_health: 'Why {meal} fits today',
    medical: 'Medical-aware reason for {meal}',
    fitness: 'Fitness-focused reason for {meal}',
    weight_loss: 'Weight-goal reason for {meal}',
    kids: 'Family/kids reason for {meal}',
    pregnancy: 'Pregnancy-aware reason for {meal}',
  }
  return msg(profile.titleKey, defaults[templateId], { meal: mealLabel })
}

export function prioritizeCodes(
  codes: readonly ReasonCode[],
  templateId: ExplanationTemplateId,
): ReasonCode[] {
  const prefer = new Set(TEMPLATES[templateId]?.preferCodes ?? [])
  return [...codes].sort((a, b) => {
    const ap = prefer.has(a) ? 0 : NUTRITION_REASON_CODES.has(a) ? 1 : 2
    const bp = prefer.has(b) ? 0 : NUTRITION_REASON_CODES.has(b) ? 1 : 2
    return ap - bp || a.localeCompare(b)
  })
}
