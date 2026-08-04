export type ConfidenceVersion = `${number}.${number}.${number}`

export type ConfidenceSignalType =
  | 'medical'
  | 'nutrition'
  | 'learning'
  | 'knowledge'
  | 'context'
  | 'region'
  | 'budget'
  | 'preference'
  | 'variety'
  | 'history'
  | 'season'
  | 'data_quality'
  | 'pantry'

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export type ConfidenceSafetyAction = 'ask_user' | 'review' | 'auto_recommend'

export type ConfidenceSignalSource =
  | 'rule-engine'
  | 'nutrition-engine'
  | 'learning-engine'
  | 'knowledge-engine'
  | 'context-engine'
  | 'life-context-engine'
  | 'decision-engine'
  | 'confidence-engine'
  | 'data-quality'

export interface ConfidenceSignal {
  readonly signal: ConfidenceSignalType
  readonly weight: number
  readonly score: number
  readonly reason: string
  readonly source: ConfidenceSignalSource
  readonly timestamp: string
  /** True when the signal used a degraded/default path. */
  readonly unknown?: boolean
}

export interface ConfidenceWeights {
  readonly medical: number
  readonly nutrition: number
  readonly learning: number
  readonly knowledge: number
  readonly context: number
  readonly region: number
  readonly budget: number
  readonly preference: number
  readonly variety: number
  readonly history: number
  readonly season: number
  readonly data_quality: number
  readonly pantry: number
}

export interface ConfidenceResult {
  readonly version: ConfidenceVersion
  readonly recommendationId: string
  readonly foodId?: string
  readonly mealType?: string
  readonly score: number
  readonly level: ConfidenceLevel
  readonly safetyAction: ConfidenceSafetyAction
  readonly signals: readonly ConfidenceSignal[]
  readonly weights: ConfidenceWeights
  readonly missingImpact: number
  readonly explanation: string
  readonly reasons: readonly string[]
  readonly timestamp: string
}

export interface ConfidenceInput {
  readonly recommendationId?: string
  readonly foodId?: string
  readonly mealType?: string
  readonly timestamp?: string
  /** Override default weights (partial). */
  readonly weights?: Partial<ConfidenceWeights>
  /** Medical: conditions known + rules applied cleanly. */
  readonly medical?: {
    readonly conditionsKnown?: boolean
    readonly allergensKnown?: boolean
    readonly ruleBlockedCount?: number
    readonly ruleAppliedCount?: number
    readonly hardRulePass?: boolean
  }
  /** Nutrition targets / score fit. */
  readonly nutrition?: {
    readonly targetsAvailable?: boolean
    readonly weightKnown?: boolean
    readonly heightKnown?: boolean
    readonly decisionScore?: number
    readonly calorieFit?: number
  }
  /** Learning profile confidence. */
  readonly learning?: {
    readonly coldStart?: boolean
    readonly confidence?: 'low' | 'medium' | 'high'
    readonly confidenceScore?: number
    readonly eventCount?: number
    readonly affinityKnown?: boolean
  }
  readonly knowledge?: {
    readonly catalogReady?: boolean
    readonly candidateCount?: number
    readonly foodKnown?: boolean
  }
  readonly context?: {
    readonly profileComplete?: boolean
    readonly lifeContextAvailable?: boolean
    readonly missingLifeFields?: number
  }
  readonly region?: {
    readonly stateKnown?: boolean
    readonly districtKnown?: boolean
    readonly regionalMatch?: boolean
  }
  readonly budget?: {
    readonly tierKnown?: boolean
    readonly withinBudget?: boolean
  }
  readonly preference?: {
    readonly foodPreferenceKnown?: boolean
    readonly matchesPreference?: boolean
  }
  readonly variety?: {
    readonly recentRepeat?: boolean
    readonly diversityPenalty?: number
  }
  readonly history?: {
    readonly mealHistoryCount?: number
    readonly previouslyAccepted?: boolean
    readonly previouslyRejected?: boolean
  }
  readonly season?: {
    readonly seasonKnown?: boolean
    readonly inSeason?: boolean
  }
  readonly pantry?: {
    readonly pantryKnown?: boolean
    readonly usesPantry?: boolean
    readonly status?: 'empty' | 'low' | 'adequate' | 'full' | 'unknown'
  }
  readonly weatherUnknown?: boolean
}

export interface ConfidenceAnalytics {
  readonly averageConfidence: number
  readonly highestConfidence: number
  readonly lowestConfidence: number
  readonly mostUncertain: readonly ConfidenceResult[]
  readonly missingInformationImpact: number
  readonly sampleCount: number
  readonly byLevel: Readonly<{ low: number; medium: number; high: number }>
  readonly bySafetyAction: Readonly<{
    ask_user: number
    review: number
    auto_recommend: number
  }>
}

export interface ConfidenceExplanation {
  readonly score: number
  readonly level: ConfidenceLevel
  readonly safetyAction: ConfidenceSafetyAction
  readonly summary: string
  readonly topSignals: readonly ConfidenceSignal[]
  readonly weakestSignals: readonly ConfidenceSignal[]
  readonly missingNotes: readonly string[]
  readonly formula: string
}
