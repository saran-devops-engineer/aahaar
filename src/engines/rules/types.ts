import type { Food, FoodPreference, MedicalConditionId } from '@/types/domain'

export type RuleVerdict = 'allow' | 'limit' | 'block'

export interface RuleEvaluation {
  ruleId: string
  conditionId?: MedicalConditionId
  foodId: string
  verdict: RuleVerdict
  reason: string
  priority: number
}

export interface HardRule {
  id: string
  conditionId: MedicalConditionId
  priority: number
  description: string
  evaluate: (food: Food) => RuleVerdict
  reason: (food: Food, verdict: RuleVerdict) => string
}

export interface ConstraintContext {
  conditions: MedicalConditionId[]
  foodPreference: FoodPreference
  allergens: string[]
  religiousRestrictions: string[]
}
