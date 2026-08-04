import {
  getExplanationAnalytics,
  recordExplanationEvent,
  resetExplanationAnalytics,
} from '@/engines/explainability/analytics'
import { buildAlternatives } from '@/engines/explainability/builders/alternatives'
import { buildEvidence } from '@/engines/explainability/builders/evidence'
import { buildExplanation } from '@/engines/explainability/builders/explanation'
import { buildMissingData } from '@/engines/explainability/builders/missingData'
import { buildNextActions } from '@/engines/explainability/builders/nextActions'
import { buildSummary } from '@/engines/explainability/builders/summary'
import { buildTradeoffs } from '@/engines/explainability/builders/tradeoffs'
import { resolveTemplateId } from '@/engines/explainability/templates/registry'
import { resolveMessage } from '@/engines/explainability/templates/messages'
import type {
  AlternativeExplanation,
  EvidenceItem,
  ExplanationAudience,
  ExplanationCard,
  ExplanationCardKind,
  ExplanationInput,
  ExplanationObject,
  MissingDataItem,
  NextActionItem,
  TradeoffItem,
} from '@/engines/explainability/types'

const cache = new Map<string, ExplanationObject>()

function mealLabel(input: ExplanationInput): string {
  return input.foodNames?.[input.decision.acceptedMeal] ?? input.decision.acceptedMeal
}

/** Primary API — Decision Memory → ExplanationObject (deterministic). */
export function buildExplanationFor(input: ExplanationInput): ExplanationObject {
  const explanation = buildExplanation(input)
  cache.set(explanation.explanationId, explanation)
  cache.set(explanation.decisionId, explanation)
  return explanation
}

export function getExplanation(
  explanationIdOrDecisionId: string,
): ExplanationObject | undefined {
  return cache.get(explanationIdOrDecisionId)
}

export function buildSummaryFor(input: ExplanationInput) {
  const templateId = resolveTemplateId(input.decision, input.templateId)
  const evidence = buildEvidence(input, templateId)
  return buildSummary(input, evidence, mealLabel(input))
}

export function buildEvidenceFor(input: ExplanationInput): EvidenceItem[] {
  const templateId = resolveTemplateId(input.decision, input.templateId)
  return buildEvidence(input, templateId)
}

export function buildAlternativesFor(input: ExplanationInput): AlternativeExplanation[] {
  return buildAlternatives(input)
}

export function buildTradeoffsFor(input: ExplanationInput): TradeoffItem[] {
  return buildTradeoffs(input)
}

export function buildMissingDataFor(input: ExplanationInput): MissingDataItem[] {
  return buildMissingData(input)
}

export function buildNextActionsFor(input: ExplanationInput): NextActionItem[] {
  return buildNextActions(input, buildMissingData(input))
}

export function getExplanationCard(
  explanation: ExplanationObject,
  kind: ExplanationCardKind,
): ExplanationCard | undefined {
  return explanation.cards.find((c) => c.kind === kind)
}

export function renderExplanationText(
  explanation: ExplanationObject,
  kind: ExplanationCardKind = 'quick',
  locale = 'en',
): string {
  const card = getExplanationCard(explanation, kind) ?? explanation.cards[0]
  if (!card) return resolveMessage(explanation.summary, locale)
  const lines = [
    resolveMessage(card.title, locale),
    ...card.body.map((b) => resolveMessage(b, locale)),
  ]
  return lines.join('\n')
}

export function resetExplanationCache(): void {
  cache.clear()
}

export {
  buildAlternatives,
  buildEvidence,
  buildExplanation,
  buildMissingData,
  buildNextActions,
  buildSummary,
  buildTradeoffs,
  getExplanationAnalytics,
  recordExplanationEvent,
  resetExplanationAnalytics,
  resolveMessage,
}

export type { ExplanationAudience }
