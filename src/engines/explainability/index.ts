/**
 * Explainability Engine (XAI).
 * Decision Memory → human explanations. Deterministic. No AI generation.
 */
export {
  buildAlternativesFor as buildAlternatives,
  buildEvidenceFor as buildEvidence,
  buildExplanationFor as buildExplanation,
  buildMissingDataFor as buildMissingData,
  buildNextActionsFor as buildNextActions,
  buildSummaryFor as buildSummary,
  buildTradeoffsFor as buildTradeoffs,
  getExplanation,
  getExplanationAnalytics,
  getExplanationCard,
  recordExplanationEvent,
  renderExplanationText,
  resetExplanationAnalytics,
  resetExplanationCache,
  resolveMessage,
} from '@/engines/explainability/api'

/** Pure builders (also available for tests). */
export {
  buildAlternatives as buildAlternativesFromInput,
  buildEvidence as buildEvidenceFromInput,
  buildExplanation as buildExplanationObject,
  buildMissingData as buildMissingDataFromInput,
  buildNextActions as buildNextActionsFromInput,
  buildSummary as buildSummaryMessage,
  buildTradeoffs as buildTradeoffsFromInput,
} from '@/engines/explainability/api'

export { TEMPLATES, resolveTemplateId } from '@/engines/explainability/templates/registry'
export { messageForReasonCode, msg } from '@/engines/explainability/templates/messages'
export { EXPLAINABILITY_VERSION } from '@/engines/explainability/constants'

export type {
  AlternativeExplanation,
  EvidenceItem,
  ExplanationAnalytics,
  ExplanationAnalyticsEvent,
  ExplanationAudience,
  ExplanationCard,
  ExplanationCardKind,
  ExplanationInput,
  ExplanationObject,
  ExplanationSection,
  ExplanationSectionId,
  ExplanationTemplateId,
  ExplainabilityVersion,
  MessageRef,
  MissingDataItem,
  NextActionItem,
  TradeoffItem,
} from '@/engines/explainability/types'
