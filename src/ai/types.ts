import type { Food, MealType, MedicalConditionId } from '@/types/domain'

/**
 * AI may ONLY: variety, substitutions phrasing, explanations, motivation, NL.
 * AI must NEVER invent nutrition values or food IDs outside the provided candidates.
 */

export interface AiExplainRequest {
  foodName: string
  mealType: MealType
  servings: number
  calories: number
  reasons: string[]
  ruleNotes: string[]
  conditions: MedicalConditionId[]
  regionStateCode: string
  season: string
  /** What each part of the plate contributes (engine facts). */
  platePartSummaries: string[]
  /** Why the combination is / isn't balanced. */
  balanceVerdict: string
  /** Concrete add-ons when the plate is incomplete. */
  gapRecommendations: string[]
}

export interface AiSubstitutionCandidate {
  foodId: string
  foodName: string
  calories: number
  score: number
  reasons: string[]
}

export interface AiSubstitutionRequest {
  current: {
    foodId: string
    foodName: string
    mealType: MealType
    calories: number
  }
  candidates: AiSubstitutionCandidate[]
  conditions: MedicalConditionId[]
  constraints: string[]
}

export interface AiSubstitutionSuggestion {
  foodId: string
  blurb: string
}

export interface AiMotivateRequest {
  goal: string
  foodPreference: string
  conditions: MedicalConditionId[]
  plannedMealCount: number
  waterProgressPct: number
}

export interface AiVarietyRequest {
  mealType: MealType
  /** Already rule-ranked candidates — AI may only reorder within this list. */
  candidateFoodIds: string[]
  recentlyUsedFoodIds: string[]
}

export interface AiAdapter {
  explainRecommendation(request: AiExplainRequest): Promise<string>
  rankSubstitutions(request: AiSubstitutionRequest): Promise<AiSubstitutionSuggestion[]>
  motivate(request: AiMotivateRequest): Promise<string>
  /** Returns preferred food IDs from the provided candidate list only. */
  preferVariety(request: AiVarietyRequest): Promise<string[]>
}

export type AiMode = 'local' | 'off'

export interface SubstitutionOption {
  food: Food
  score: number
  reasons: string[]
  blurb: string
}
