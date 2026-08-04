import {
  DEFAULT_AUDIENCE,
  EXPLAINABILITY_VERSION,
} from '@/engines/explainability/constants'
import { buildAlternatives } from '@/engines/explainability/builders/alternatives'
import { buildEvidence } from '@/engines/explainability/builders/evidence'
import { buildMissingData } from '@/engines/explainability/builders/missingData'
import { buildNextActions } from '@/engines/explainability/builders/nextActions'
import {
  buildRecommendations,
  buildSummary,
} from '@/engines/explainability/builders/summary'
import { buildTradeoffs } from '@/engines/explainability/builders/tradeoffs'
import { buildAssumptions } from '@/engines/explainability/insights/assumptions'
import { buildReasoningSections } from '@/engines/explainability/reasoning/sections'
import { buildExplanationCards } from '@/engines/explainability/summaries/cards'
import { msg } from '@/engines/explainability/templates/messages'
import {
  resolveTemplateId,
  templateTitle,
} from '@/engines/explainability/templates/registry'
import type {
  ExplanationInput,
  ExplanationObject,
} from '@/engines/explainability/types'
import { createId } from '@/shared/utils/id'

function mealLabel(input: ExplanationInput): string {
  return (
    input.foodNames?.[input.decision.acceptedMeal] ?? input.decision.acceptedMeal
  )
}

export function buildExplanation(input: ExplanationInput): ExplanationObject {
  const audience = input.audience ?? DEFAULT_AUDIENCE
  const templateId = resolveTemplateId(input.decision, input.templateId)
  const label = mealLabel(input)
  const timestamp = new Date().toISOString()

  const evidence = Object.freeze(buildEvidence(input, templateId))
  const alternatives = Object.freeze(buildAlternatives(input))
  const tradeoffs = Object.freeze(buildTradeoffs(input))
  const missingData = Object.freeze(buildMissingData(input))
  const nextActions = Object.freeze(buildNextActions(input, missingData))
  const summary = buildSummary(input, evidence, label)
  const recommendations = Object.freeze(
    buildRecommendations(input, missingData.length),
  )
  const reasoning = Object.freeze(
    buildReasoningSections(input, evidence, alternatives, missingData, label),
  )
  const assumptions = Object.freeze(buildAssumptions(input))
  const title = templateTitle(templateId, label)

  const confidence = Object.freeze({
    score: input.confidence?.score ?? null,
    level: input.confidence?.level ?? input.decision.confidence,
    safetyAction: input.confidence?.safetyAction,
    message: input.confidence
      ? msg(
          'confidence.full',
          'Confidence {score}/100 ({level})',
          {
            score: input.confidence.score,
            level: input.confidence.level,
          },
        )
      : msg(
          'confidence.band',
          'Decision confidence band: {level}',
          { level: input.decision.confidence },
        ),
  })

  const cards = buildExplanationCards(
    audience,
    title,
    summary,
    reasoning,
    evidence,
    confidence,
  )

  return Object.freeze({
    version: EXPLAINABILITY_VERSION,
    explanationId: createId('xai'),
    decisionId: input.decision.decisionId,
    audience,
    templateId,
    title,
    summary,
    reasoning,
    evidence,
    confidence,
    alternatives,
    tradeoffs,
    missingData,
    recommendations,
    nextActions,
    cards,
    assumptions,
    timestamp,
  })
}
