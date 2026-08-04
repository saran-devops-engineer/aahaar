import { msg } from '@/engines/explainability/templates/messages'
import type { ExplanationInput, TradeoffItem } from '@/engines/explainability/types'

/**
 * Tradeoffs derived only from DecisionScoreBreakdown + rejection presence.
 */
export function buildTradeoffs(input: ExplanationInput): TradeoffItem[] {
  const { decision } = input
  const score = decision.decisionScore
  const items: TradeoffItem[] = []

  if (score.variety < score.nutrition && score.variety < 40) {
    items.push(
      Object.freeze({
        id: 'trade_variety',
        dimension: 'variety',
        message: msg(
          'tradeoff.variety_vs_nutrition',
          'Nutrition fit was prioritized over maximum variety',
        ),
      }),
    )
  }

  if (score.learning > 0 && score.learning < score.medical) {
    items.push(
      Object.freeze({
        id: 'trade_learning',
        dimension: 'learning',
        message: msg(
          'tradeoff.medical_over_learning',
          'Medical safety outweighed personal preference signals',
        ),
      }),
    )
  }

  if (score.budget < score.region && score.budget < 35) {
    items.push(
      Object.freeze({
        id: 'trade_budget',
        dimension: 'budget',
        message: msg(
          'tradeoff.region_over_budget',
          'Regional suitability was weighted above budget stretch',
        ),
      }),
    )
  }

  if (decision.rejectedMeals.some((r) => r.reasonCodes.includes('ALREADY_SERVED'))) {
    items.push(
      Object.freeze({
        id: 'trade_repeat',
        dimension: 'variety',
        message: msg(
          'tradeoff.avoid_repeat',
          'A recent favourite was skipped to protect variety',
        ),
      }),
    )
  }

  if (decision.reasonCodes.includes('LOW_PREP_TIME')) {
    items.push(
      Object.freeze({
        id: 'trade_time',
        dimension: 'time',
        message: msg(
          'tradeoff.prep_time',
          'Shorter preparation time influenced the final pick',
        ),
      }),
    )
  }

  return items
}
