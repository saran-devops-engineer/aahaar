import { calculateConfidence } from '@/engines/confidence/calculator/calculate'
import type { ConfidenceInput, ConfidenceResult } from '@/engines/confidence/types'
import type { DecisionResult, MealType } from '@/types/domain'
import type { LearningProfile } from '@/engines/learning/types'
import type { LifeContext } from '@/engines/life-context/types'
import type { UserContext } from '@/engines/context/types'

/**
 * Convenience adapter — builds ConfidenceInput from existing engine outputs.
 * Does not modify Decision / meal generation.
 */
export function confidenceInputFromDecision(options: {
  readonly decision: DecisionResult
  readonly mealType: MealType
  readonly foodId: string
  readonly userContext?: UserContext
  readonly lifeContext?: LifeContext
  readonly learningProfile?: LearningProfile
  readonly recommendationId?: string
  readonly previouslyAccepted?: boolean
  readonly previouslyRejected?: boolean
  readonly mealHistoryCount?: number
  readonly regionalMatch?: boolean
  readonly inSeason?: boolean
  readonly usesPantry?: boolean
  readonly diversityPenalty?: number
}): ConfidenceInput {
  const meal = options.decision.meals.find(
    (m) => m.mealType === options.mealType && m.foodId === options.foodId,
  )
  const ctx = options.userContext
  const life = options.lifeContext
  const learning = options.learningProfile

  return {
    recommendationId: options.recommendationId,
    foodId: options.foodId,
    mealType: options.mealType,
    medical: {
      conditionsKnown: ctx ? true : undefined,
      allergensKnown: ctx ? ctx.preferences.allergens !== undefined : undefined,
      ruleBlockedCount: options.decision.blockedFoodCount,
      ruleAppliedCount: options.decision.appliedRuleIds.length,
      hardRulePass: true,
    },
    nutrition: {
      targetsAvailable: Boolean(options.decision.targets),
      weightKnown: ctx ? ctx.profile.weightKg > 0 : undefined,
      heightKnown: ctx ? ctx.profile.heightCm > 0 : undefined,
      decisionScore: meal?.score,
    },
    learning: learning
      ? {
          coldStart: learning.eventCount <= 8 && learning.confidence === 'low',
          confidence: learning.confidence,
          confidenceScore: learning.confidenceScore,
          eventCount: learning.eventCount,
          affinityKnown: options.foodId in learning.foodAffinity,
        }
      : undefined,
    knowledge: {
      catalogReady: true,
      candidateCount: options.decision.candidateFoodCount,
      foodKnown: true,
    },
    context: ctx
      ? {
          profileComplete: true,
          lifeContextAvailable: life != null,
          missingLifeFields: life?.missingFields.length,
        }
      : undefined,
    region: ctx
      ? {
          stateKnown: Boolean(ctx.state),
          districtKnown: Boolean(ctx.district),
          regionalMatch: options.regionalMatch,
        }
      : undefined,
    budget: ctx
      ? {
          tierKnown: true,
          withinBudget: true,
        }
      : undefined,
    preference: ctx
      ? {
          foodPreferenceKnown: true,
          matchesPreference: true,
        }
      : undefined,
    variety: {
      recentRepeat: (options.diversityPenalty ?? 0) > 0,
      diversityPenalty: options.diversityPenalty,
    },
    history: {
      mealHistoryCount: options.mealHistoryCount ?? ctx?.planning.recentFoodIds.length,
      previouslyAccepted: options.previouslyAccepted,
      previouslyRejected: options.previouslyRejected,
    },
    season: {
      seasonKnown: Boolean(ctx?.season || life?.season),
      inSeason: options.inSeason,
    },
    pantry: life
      ? {
          pantryKnown: life.pantryStatus !== 'unknown',
          status: life.pantryStatus,
          usesPantry: options.usesPantry,
        }
      : {
          pantryKnown: false,
          status: 'unknown',
        },
    weatherUnknown: life ? life.weather == null : true,
  }
}

export function calculateConfidenceFromDecision(
  options: Parameters<typeof confidenceInputFromDecision>[0],
): ConfidenceResult {
  return calculateConfidence(confidenceInputFromDecision(options))
}
