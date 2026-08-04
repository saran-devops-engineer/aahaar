import type {
  DecisionRecord,
  ReasonCode,
  RejectionReasonCode,
} from '@/engines/decision-memory/types'
import type { ConfidenceResult } from '@/engines/confidence/types'
import type { LearningProfile } from '@/engines/learning/types'
import type { LifeContext } from '@/engines/life-context/types'

export type ExplainabilityVersion = `${number}.${number}.${number}`

export type ExplanationAudience =
  | 'user'
  | 'parent'
  | 'doctor'
  | 'nutritionist'
  | 'developer'
  | 'api'

export type ExplanationTemplateId =
  | 'general_health'
  | 'medical'
  | 'fitness'
  | 'weight_loss'
  | 'kids'
  | 'pregnancy'

export type ExplanationCardKind =
  | 'quick'
  | 'detailed'
  | 'technical'
  | 'doctor'
  | 'developer'

export type ExplanationSectionId =
  | 'why_this_meal'
  | 'why_today'
  | 'why_not_another'
  | 'medical'
  | 'nutrition'
  | 'regional'
  | 'budget'
  | 'preparation'
  | 'learning'
  | 'confidence'
  | 'future_improvements'

/**
 * Localization-ready text unit.
 * UI/i18n layers translate `key`; `defaultText` is a deterministic fallback only.
 */
export interface MessageRef {
  readonly key: string
  readonly params?: Readonly<Record<string, string | number | boolean>>
  readonly defaultText: string
}

export interface EvidenceItem {
  readonly id: string
  readonly code: ReasonCode | RejectionReasonCode | string
  readonly message: MessageRef
  readonly source: 'decision_memory' | 'confidence' | 'life_context' | 'learning' | 'knowledge'
  readonly decisionId?: string
  readonly strength: 'low' | 'medium' | 'high'
}

export interface AlternativeExplanation {
  readonly foodId: string
  readonly foodName?: string
  readonly status: 'considered' | 'rejected' | 'alternative'
  readonly reasonCodes: readonly (ReasonCode | RejectionReasonCode)[]
  readonly messages: readonly MessageRef[]
  readonly score?: number
}

export interface TradeoffItem {
  readonly id: string
  readonly message: MessageRef
  readonly dimension: 'nutrition' | 'medical' | 'budget' | 'variety' | 'learning' | 'time'
}

export interface MissingDataItem {
  readonly id: string
  readonly field: string
  readonly message: MessageRef
  readonly impact: 'low' | 'medium' | 'high'
}

export interface NextActionItem {
  readonly id: string
  readonly message: MessageRef
  readonly action: 'update_pantry' | 'add_weight' | 'enable_weather' | 'log_sleep' | 'review_allergens' | 'accept' | 'swap' | 'ask_user'
}

export interface ExplanationSection {
  readonly id: ExplanationSectionId
  readonly title: MessageRef
  readonly body: readonly MessageRef[]
  readonly evidenceIds: readonly string[]
}

export interface ExplanationCard {
  readonly kind: ExplanationCardKind
  readonly audience: ExplanationAudience
  readonly title: MessageRef
  readonly body: readonly MessageRef[]
}

export interface ExplanationObject {
  readonly version: ExplainabilityVersion
  readonly explanationId: string
  readonly decisionId: string
  readonly audience: ExplanationAudience
  readonly templateId: ExplanationTemplateId
  readonly title: MessageRef
  readonly summary: MessageRef
  readonly reasoning: readonly ExplanationSection[]
  readonly evidence: readonly EvidenceItem[]
  readonly confidence: Readonly<{
    score: number | null
    level: 'low' | 'medium' | 'high' | null
    message: MessageRef
    safetyAction?: string
  }>
  readonly alternatives: readonly AlternativeExplanation[]
  readonly tradeoffs: readonly TradeoffItem[]
  readonly missingData: readonly MissingDataItem[]
  readonly recommendations: readonly MessageRef[]
  readonly nextActions: readonly NextActionItem[]
  readonly cards: readonly ExplanationCard[]
  readonly assumptions: readonly MessageRef[]
  readonly timestamp: string
}

export interface ExplanationInput {
  readonly decision: DecisionRecord
  readonly learningProfile?: LearningProfile
  readonly lifeContext?: LifeContext
  readonly confidence?: ConfidenceResult
  /** Optional display names — never invented nutrition facts. */
  readonly foodNames?: Readonly<Record<string, string>>
  readonly audience?: ExplanationAudience
  readonly templateId?: ExplanationTemplateId
  readonly locale?: string
}

export type ExplanationEventType = 'viewed' | 'confused' | 'accepted' | 'ignored'

export interface ExplanationAnalyticsEvent {
  readonly explanationId: string
  readonly decisionId: string
  readonly type: ExplanationEventType
  readonly timestamp: string
}

export interface ExplanationAnalytics {
  readonly mostViewed: readonly { explanationId: string; count: number }[]
  readonly mostConfusing: readonly { explanationId: string; count: number }[]
  readonly mostAccepted: readonly { explanationId: string; count: number }[]
  readonly mostIgnored: readonly { explanationId: string; count: number }[]
  readonly totalEvents: number
}
