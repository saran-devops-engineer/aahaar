import {
  LEARNING_REASON_CODES,
  MEDICAL_REASON_CODES,
  NUTRITION_REASON_CODES,
  REGIONAL_REASON_CODES,
  SECTION_ORDER,
} from '@/engines/explainability/constants'
import { messageForReasonCode, msg } from '@/engines/explainability/templates/messages'
import { resolveMessage } from '@/engines/explainability/templates/messages'
import type {
  AlternativeExplanation,
  EvidenceItem,
  ExplanationInput,
  ExplanationSection,
  MissingDataItem,
} from '@/engines/explainability/types'

function section(
  id: ExplanationSection['id'],
  titleDefault: string,
  body: readonly ReturnType<typeof msg>[],
  evidenceIds: readonly string[],
): ExplanationSection {
  return Object.freeze({
    id,
    title: msg(`section.${id}.title`, titleDefault),
    body: Object.freeze([...body]),
    evidenceIds: Object.freeze([...evidenceIds]),
  })
}

export function buildReasoningSections(
  input: ExplanationInput,
  evidence: readonly EvidenceItem[],
  alternatives: readonly AlternativeExplanation[],
  missing: readonly MissingDataItem[],
  mealLabel: string,
): ExplanationSection[] {
  const { decision } = input
  const byCode = (codes: ReadonlySet<string>) =>
    evidence.filter((e) => codes.has(String(e.code)))

  const medicalEv = byCode(MEDICAL_REASON_CODES)
  const nutritionEv = byCode(NUTRITION_REASON_CODES)
  const regionalEv = byCode(REGIONAL_REASON_CODES)
  const learningEv = byCode(LEARNING_REASON_CODES)

  const whyMealBody = evidence
    .filter((e) => e.source === 'decision_memory')
    .slice(0, 5)
    .map((e) => e.message)

  const whyToday: ReturnType<typeof msg>[] = [
    msg('section.why_today.body', 'Planned for {date} ({mealType})', {
      date: decision.date,
      mealType: decision.mealType,
    }),
  ]
  if (decision.constraints.season) {
    whyToday.push(
      msg('section.why_today.season', 'Season context: {season}', {
        season: decision.constraints.season,
      }),
    )
  }
  if (input.lifeContext?.festival) {
    whyToday.push(
      msg('section.why_today.festival', 'Festival today: {festival}', {
        festival: input.lifeContext.festival,
      }),
    )
  }

  const whyNot: ReturnType<typeof msg>[] = alternatives.slice(0, 4).map((alt) => {
    const label = alt.foodName ?? alt.foodId
    const reason =
      alt.messages[0] != null
        ? resolveMessage(alt.messages[0])
        : 'Not selected'
    return msg('section.why_not.body', '{food}: {reason}', {
      food: label,
      reason,
    })
  })
  if (whyNot.length === 0) {
    whyNot.push(
      msg(
        'section.why_not.empty',
        'No rejected alternatives were stored for this decision',
      ),
    )
  }

  const medicalBody =
    medicalEv.length > 0
      ? medicalEv.map((e) => e.message)
      : decision.constraints.conditions.length > 0
        ? [
            msg('section.medical.conditions', 'Conditions considered: {list}', {
              list: decision.constraints.conditions.join(', '),
            }),
          ]
        : [msg('section.medical.none', 'No medical condition flags on this decision')]

  const nutritionBody =
    nutritionEv.length > 0
      ? nutritionEv.map((e) => e.message)
      : [
          msg(
            'section.nutrition.score',
            'Nutrition score component: {score}',
            { score: decision.decisionScore.nutrition },
          ),
        ]

  const regionalBody =
    regionalEv.length > 0
      ? regionalEv.map((e) => e.message)
      : decision.constraints.stateCode
        ? [
            msg('section.regional.state', 'Region: {state}', {
              state: decision.constraints.stateCode,
            }),
          ]
        : [msg('section.regional.none', 'No regional codes recorded')]

  const budgetBody = decision.reasonCodes.includes('LOW_BUDGET')
    ? [messageForReasonCode('LOW_BUDGET')]
    : [
        msg('section.budget.score', 'Budget score component: {score}', {
          score: decision.decisionScore.budget,
        }),
      ]

  const prepBody = decision.reasonCodes.includes('LOW_PREP_TIME')
    ? [messageForReasonCode('LOW_PREP_TIME')]
    : input.lifeContext?.availableCookingTime != null
      ? [
          msg('section.prep.time', 'Available cooking time: {minutes} minutes', {
            minutes: input.lifeContext.availableCookingTime,
          }),
        ]
      : [msg('section.prep.unknown', 'Preparation effort not specifically recorded')]

  const learningBody =
    learningEv.length > 0
      ? learningEv.map((e) => e.message)
      : [
          msg('section.learning.score', 'Learning score component: {score}', {
            score: decision.decisionScore.learning,
          }),
        ]

  const confidenceBody = input.confidence
    ? [
        msg(
          'section.confidence.body',
          'Confidence {score}/100 ({level}). Safety: {safety}',
          {
            score: input.confidence.score,
            level: input.confidence.level,
            safety: input.confidence.safetyAction,
          },
        ),
      ]
    : [
        msg(
          'section.confidence.memory',
          'Decision memory confidence band: {level}',
          { level: decision.confidence },
        ),
      ]

  const futureBody =
    missing.length > 0
      ? missing.slice(0, 4).map((m) => m.message)
      : [
          msg(
            'section.future.none',
            'No major missing-data gaps recorded for this explanation',
          ),
        ]

  const map: Record<ExplanationSection['id'], ExplanationSection> = {
    why_this_meal: section(
      'why_this_meal',
      'Why this meal?',
      whyMealBody.length > 0
        ? whyMealBody
        : [msg('section.why_meal.fallback', '{meal} was selected from decision memory', { meal: mealLabel })],
      evidence.filter((e) => e.source === 'decision_memory').map((e) => e.id),
    ),
    why_today: section(
      'why_today',
      'Why today?',
      whyToday,
      evidence.filter((e) => e.source === 'life_context').map((e) => e.id),
    ),
    why_not_another: section(
      'why_not_another',
      'Why not another meal?',
      whyNot,
      [],
    ),
    medical: section(
      'medical',
      'Medical considerations',
      medicalBody,
      medicalEv.map((e) => e.id),
    ),
    nutrition: section(
      'nutrition',
      'Nutrition balance',
      nutritionBody,
      nutritionEv.map((e) => e.id),
    ),
    regional: section(
      'regional',
      'Regional suitability',
      regionalBody,
      regionalEv.map((e) => e.id),
    ),
    budget: section('budget', 'Budget impact', budgetBody, []),
    preparation: section('preparation', 'Preparation effort', prepBody, []),
    learning: section(
      'learning',
      'Learning influence',
      learningBody,
      learningEv.map((e) => e.id),
    ),
    confidence: section('confidence', 'Confidence', confidenceBody, [
      ...evidence.filter((e) => e.source === 'confidence').map((e) => e.id),
    ]),
    future_improvements: section(
      'future_improvements',
      'Future improvements',
      futureBody,
      [],
    ),
  }

  return SECTION_ORDER.map((id) => map[id])
}
