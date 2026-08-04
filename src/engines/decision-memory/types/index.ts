import type { MealType } from '@/types/domain'

export type DecisionMemoryVersion = `${number}.${number}.${number}`

/** Deterministic reason codes — never free-text in stored memory. */
export type ReasonCode =
  | 'HIGH_PROTEIN'
  | 'LOW_GI'
  | 'SUMMER'
  | 'MONSOON'
  | 'WINTER'
  | 'RICE_BELT'
  | 'LOW_BUDGET'
  | 'HIGH_IRON'
  | 'HIGH_FIBER'
  | 'HIGH_CALCIUM'
  | 'PREGNANCY_SAFE'
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'EGGETARIAN'
  | 'ANDHRA_CUISINE'
  | 'TAMIL_CUISINE'
  | 'SOUTH_INDIAN'
  | 'NORTH_INDIAN'
  | 'REGIONAL_MATCH'
  | 'FAMILY_FRIENDLY'
  | 'LOW_PREP_TIME'
  | 'HIGH_SATIETY'
  | 'BALANCED_PLATE'
  | 'PANTRY_MATCH'
  | 'LIKED_PREVIOUSLY'
  | 'LEARNING_BOOST'
  | 'LEARNING_PENALTY'
  | 'DIVERSITY'
  | 'RECENTLY_SERVED'
  | 'MEDICAL_ALLOW'
  | 'MEDICAL_LIMIT'
  | 'MEDICAL_BLOCK'
  | 'DIABETES_SAFE'
  | 'CKD_SAFE'
  | 'HYPERTENSION_SAFE'
  | 'HIGH_SATURATED_FAT'
  | 'HIGH_SODIUM'
  | 'HIGH_GI'
  | 'ALLERGEN'
  | 'RELIGIOUS_RESTRICTION'
  | 'DIET_MISMATCH'
  | 'BUDGET_EXCEEDED'
  | 'OUT_OF_SEASON'
  | 'USER_DISLIKE'
  | 'ALREADY_SERVED'
  | 'EXCLUDED'
  | 'POOL_WIDENED'
  | 'DEFAULT_BALANCE'

export type DecisionOutcome =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'skipped'
  | 'swapped'
  | 'completed'
  | 'repeated'
  | 'loved'
  | 'disliked'

export type RejectionReasonCode =
  | 'HIGH_SATURATED_FAT'
  | 'HIGH_SODIUM'
  | 'HIGH_GI'
  | 'MEDICAL_BLOCK'
  | 'DIABETES_SAFE'
  | 'CKD_SAFE'
  | 'HYPERTENSION_SAFE'
  | 'PREGNANCY_SAFE'
  | 'ALLERGEN'
  | 'RELIGIOUS_RESTRICTION'
  | 'DIET_MISMATCH'
  | 'BUDGET_EXCEEDED'
  | 'OUT_OF_SEASON'
  | 'USER_DISLIKE'
  | 'ALREADY_SERVED'
  | 'EXCLUDED'
  | 'RECENTLY_SERVED'
  | 'LEARNING_PENALTY'
  | 'DIVERSITY'
  | 'LOW_RANK'

export interface DecisionScoreBreakdown {
  readonly nutrition: number
  readonly medical: number
  readonly learning: number
  readonly region: number
  readonly budget: number
  readonly variety: number
  readonly overall: number
}

export interface RejectedFoodEntry {
  readonly foodId: string
  readonly foodName?: string
  readonly reasonCodes: readonly RejectionReasonCode[]
  /** Optional condition or context tag, e.g. diabetes. */
  readonly contextTag?: string
}

export interface DecisionCandidate {
  readonly foodId: string
  readonly score: number
  readonly reasonCodes: readonly ReasonCode[]
}

export interface DecisionConstraints {
  readonly conditions: readonly string[]
  readonly foodPreference?: string
  readonly allergens: readonly string[]
  readonly religiousRestrictions: readonly string[]
  readonly maxCostTier?: number
  readonly season?: string
  readonly stateCode?: string
  readonly districtId?: string
}

export interface DecisionVersions {
  readonly contextVersion: string
  readonly learningVersion: string
  readonly knowledgeVersion: string
  readonly ruleVersion: string
  readonly nutritionVersion: string
  readonly memoryVersion: DecisionMemoryVersion
}

export interface DecisionRecord {
  readonly decisionId: string
  readonly userId: string
  readonly timestamp: string
  readonly date: string
  readonly mealType: MealType
  readonly candidateMeals: readonly DecisionCandidate[]
  readonly acceptedMeal: string
  readonly rejectedMeals: readonly RejectedFoodEntry[]
  readonly versions: DecisionVersions
  readonly decisionScore: DecisionScoreBreakdown
  readonly confidence: 'low' | 'medium' | 'high'
  readonly reasonCodes: readonly ReasonCode[]
  readonly filtersApplied: readonly string[]
  readonly constraints: DecisionConstraints
  readonly alternatives: readonly string[]
  readonly finalExplanation: string
  readonly userAction: DecisionOutcome
  readonly outcomeAt?: string
  readonly swappedToFoodId?: string
}

/** Compressed historical aggregate — statistics preserved after retention. */
export interface DecisionStatsBucket {
  readonly period: 'day' | 'week' | 'month'
  readonly key: string
  readonly acceptedCount: number
  readonly rejectedCount: number
  readonly skippedCount: number
  readonly swappedCount: number
  readonly completedCount: number
  readonly lovedCount: number
  readonly dislikedCount: number
  readonly foodAcceptCounts: Readonly<Record<string, number>>
  readonly foodRejectCounts: Readonly<Record<string, number>>
  readonly reasonCodeCounts: Readonly<Record<string, number>>
  readonly cuisineCounts: Readonly<Record<string, number>>
  readonly replacementCounts: Readonly<Record<string, number>>
  readonly breakfastSuccessCounts: Readonly<Record<string, number>>
  readonly ingredientSkipCounts: Readonly<Record<string, number>>
}

export interface DecisionMemoryStore {
  readonly version: DecisionMemoryVersion
  readonly userId: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly records: readonly DecisionRecord[]
  readonly stats: readonly DecisionStatsBucket[]
  readonly retentionDays: number
  readonly totalDecisions: number
  readonly totalOutcomes: number
}

export interface DecisionMemoryExportBundle {
  readonly format: 'aahaar.decision.memory'
  readonly version: DecisionMemoryVersion
  readonly exportedAt: string
  readonly store: DecisionMemoryStore
}

export interface DecisionInspectorView {
  readonly decisionId: string
  readonly timestamp: string
  readonly mealType: MealType
  readonly acceptedMeal: string
  readonly reasonCodes: readonly ReasonCode[]
  readonly filtersApplied: readonly string[]
  readonly constraints: DecisionConstraints
  readonly rejectedMeals: readonly RejectedFoodEntry[]
  readonly decisionScore: DecisionScoreBreakdown
  readonly confidence: 'low' | 'medium' | 'high'
  readonly versions: DecisionVersions
  readonly candidateMeals: readonly DecisionCandidate[]
  readonly alternatives: readonly string[]
  readonly finalExplanation: string
  readonly userAction: DecisionOutcome
  readonly ruleChain: readonly string[]
  readonly contextSnapshot: Readonly<{
    date: string
    season?: string
    stateCode?: string
    districtId?: string
    foodPreference?: string
    conditions: readonly string[]
  }>
}

export interface DecisionAnalytics {
  readonly mostAcceptedMeals: readonly { foodId: string; count: number }[]
  readonly mostRejectedMeals: readonly { foodId: string; count: number }[]
  readonly mostCommonRules: readonly { code: string; count: number }[]
  readonly mostCommonCuisines: readonly { cuisine: string; count: number }[]
  readonly mostCommonReplacements: readonly { fromTo: string; count: number }[]
  readonly mostSkippedIngredients: readonly { ingredient: string; count: number }[]
  readonly mostSuccessfulBreakfast: readonly { foodId: string; count: number }[]
  readonly totalRecords: number
  readonly totalCompressedPeriods: number
}
