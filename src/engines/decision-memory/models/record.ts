import {
  DECISION_MEMORY_VERSION,
  MAX_CANDIDATES_STORED,
  MAX_REJECTED_STORED,
  NUTRITION_VERSION,
  RULE_VERSION,
} from '@/engines/decision-memory/constants'
import { CONTEXT_VERSION } from '@/engines/context/constants'
import { LEARNING_VERSION } from '@/engines/learning/constants'
import { GRAPH_VERSION } from '@/engines/knowledge/graph/constants'
import {
  mapBlockedToRejection,
  mapRuleIdToReasonCodes,
  mapTextToReasonCodes,
} from '@/engines/decision-memory/reasons/codes'
import type {
  DecisionCandidate,
  DecisionConstraints,
  DecisionRecord,
  DecisionScoreBreakdown,
  RejectedFoodEntry,
} from '@/engines/decision-memory/types'
import type { DecisionResult, Food, MealType } from '@/types/domain'
import { createId } from '@/shared/utils/id'

export interface CreateDecisionInput {
  readonly userId: string
  readonly date: string
  readonly mealType: MealType
  readonly acceptedFoodId: string
  readonly acceptedScore: number
  readonly explanation: string
  readonly reasonTexts?: readonly string[]
  readonly ruleNotes?: readonly string[]
  readonly appliedRuleIds?: readonly string[]
  readonly filtersApplied?: readonly string[]
  readonly constraints?: Partial<DecisionConstraints>
  readonly candidates?: readonly { foodId: string; score: number; reasons?: readonly string[] }[]
  readonly rejected?: readonly {
    foodId: string
    foodName?: string
    ruleId?: string
    reasonText?: string
    reasonCodes?: RejectedFoodEntry['reasonCodes']
    contextTag?: string
  }[]
  readonly alternatives?: readonly string[]
  readonly scoreBreakdown?: Partial<DecisionScoreBreakdown>
  readonly confidence?: DecisionRecord['confidence']
  readonly versions?: Partial<DecisionRecord['versions']>
  readonly timestamp?: string
  readonly decisionId?: string
}

export function createDecisionRecord(input: CreateDecisionInput): DecisionRecord {
  const timestamp = input.timestamp ?? new Date().toISOString()
  const reasonCodes = Object.freeze([
    ...new Set([
      ...mapTextToReasonCodes(input.reasonTexts ?? []),
      ...mapRuleIdToReasonCodes(input.appliedRuleIds ?? []),
      ...mapTextToReasonCodes(input.ruleNotes ?? []),
    ]),
  ])

  const candidates: DecisionCandidate[] = (input.candidates ?? [])
    .slice(0, MAX_CANDIDATES_STORED)
    .map((c) =>
      Object.freeze({
        foodId: c.foodId,
        score: Math.round(c.score),
        reasonCodes: Object.freeze(mapTextToReasonCodes(c.reasons ?? [])),
      }),
    )

  const rejected: RejectedFoodEntry[] = (input.rejected ?? [])
    .slice(0, MAX_REJECTED_STORED)
    .map((r) => {
      if (r.reasonCodes && r.reasonCodes.length > 0) {
        return Object.freeze({
          foodId: r.foodId,
          foodName: r.foodName,
          reasonCodes: Object.freeze([...r.reasonCodes]),
          contextTag: r.contextTag,
        })
      }
      const mapped = mapBlockedToRejection(r.ruleId ?? '', r.reasonText)
      return Object.freeze({
        foodId: r.foodId,
        foodName: r.foodName,
        reasonCodes: Object.freeze(mapped.codes),
        contextTag: r.contextTag ?? mapped.contextTag,
      })
    })

  const overall = input.scoreBreakdown?.overall ?? input.acceptedScore
  const decisionScore: DecisionScoreBreakdown = Object.freeze({
    nutrition: input.scoreBreakdown?.nutrition ?? Math.round(overall * 0.3),
    medical: input.scoreBreakdown?.medical ?? Math.round(overall * 0.25),
    learning: input.scoreBreakdown?.learning ?? 0,
    region: input.scoreBreakdown?.region ?? Math.round(overall * 0.2),
    budget: input.scoreBreakdown?.budget ?? Math.round(overall * 0.15),
    variety: input.scoreBreakdown?.variety ?? Math.round(overall * 0.1),
    overall: Math.round(overall),
  })

  const constraints: DecisionConstraints = Object.freeze({
    conditions: Object.freeze([...(input.constraints?.conditions ?? [])]),
    foodPreference: input.constraints?.foodPreference,
    allergens: Object.freeze([...(input.constraints?.allergens ?? [])]),
    religiousRestrictions: Object.freeze([
      ...(input.constraints?.religiousRestrictions ?? []),
    ]),
    maxCostTier: input.constraints?.maxCostTier,
    season: input.constraints?.season,
    stateCode: input.constraints?.stateCode,
    districtId: input.constraints?.districtId,
  })

  return Object.freeze({
    decisionId: input.decisionId ?? createId('dec'),
    userId: input.userId,
    timestamp,
    date: input.date,
    mealType: input.mealType,
    candidateMeals: Object.freeze(candidates),
    acceptedMeal: input.acceptedFoodId,
    rejectedMeals: Object.freeze(rejected),
    versions: Object.freeze({
      contextVersion: input.versions?.contextVersion ?? CONTEXT_VERSION,
      learningVersion: input.versions?.learningVersion ?? LEARNING_VERSION,
      knowledgeVersion: input.versions?.knowledgeVersion ?? GRAPH_VERSION,
      ruleVersion: input.versions?.ruleVersion ?? RULE_VERSION,
      nutritionVersion: input.versions?.nutritionVersion ?? NUTRITION_VERSION,
      memoryVersion: DECISION_MEMORY_VERSION,
    }),
    decisionScore,
    confidence: input.confidence ?? 'low',
    reasonCodes,
    filtersApplied: Object.freeze([...(input.filtersApplied ?? [])]),
    constraints,
    alternatives: Object.freeze([...(input.alternatives ?? candidates.map((c) => c.foodId).filter((id) => id !== input.acceptedFoodId))]),
    finalExplanation: input.explanation,
    userAction: 'pending',
  })
}

/**
 * Build DecisionRecords from a DecisionResult without changing the Decision Engine.
 * Caller supplies foods for names and optional rejection evaluations.
 */
export function createRecordsFromDecisionResult(
  userId: string,
  date: string,
  result: DecisionResult,
  options?: {
    foods?: readonly Food[]
    constraints?: Partial<DecisionConstraints>
    filtersApplied?: readonly string[]
    confidence?: DecisionRecord['confidence']
    timestamp?: string
  },
): DecisionRecord[] {
  const filters =
    options?.filtersApplied ??
    Object.freeze([
      'season',
      'region',
      'budget',
      'rules',
      'ranking',
      ...result.sources,
    ])

  return result.meals.map((meal) =>
    createDecisionRecord({
      userId,
      date,
      mealType: meal.mealType,
      acceptedFoodId: meal.foodId,
      acceptedScore: meal.score,
      explanation: meal.explanation,
      reasonTexts: [meal.explanation],
      ruleNotes: meal.ruleNotes,
      appliedRuleIds: result.appliedRuleIds,
      filtersApplied: filters,
      constraints: options?.constraints,
      confidence: options?.confidence,
      timestamp: options?.timestamp,
      alternatives: result.meals
        .filter((m) => m.mealType === meal.mealType && m.foodId !== meal.foodId)
        .map((m) => m.foodId),
      rejected: [],
      scoreBreakdown: {
        overall: meal.score,
        nutrition: Math.round(meal.score * 0.35),
        medical: meal.ruleNotes.length > 0 ? Math.round(meal.score * 0.2) : Math.round(meal.score * 0.3),
        learning: 0,
        region: Math.round(meal.score * 0.2),
        budget: Math.round(meal.score * 0.1),
        variety: Math.round(meal.score * 0.05),
      },
    }),
  )
}
