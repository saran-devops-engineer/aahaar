import { evaluateAllergens, evaluatePreference, evaluateReligious } from '@/engines/rules/constraints'
import { HARD_RULES } from '@/engines/rules/hardRules'
import type {
  ConstraintContext,
  RuleEvaluation,
  RuleVerdict,
} from '@/engines/rules/types'
import type { Food, MedicalConditionId } from '@/types/domain'

export type { HardRule, RuleEvaluation, RuleVerdict, ConstraintContext } from '@/engines/rules/types'
export { HARD_RULES } from '@/engines/rules/hardRules'

/**
 * Rule Engine — hard medical + preference/allergen/religious constraints.
 * Rules override AI.
 */
export function evaluateFoodRules(
  food: Food,
  conditions: MedicalConditionId[],
): RuleEvaluation[] {
  if (conditions.length === 0) return []

  return HARD_RULES.filter((rule) => conditions.includes(rule.conditionId)).map(
    (rule) => {
      const verdict = rule.evaluate(food)
      return {
        ruleId: rule.id,
        conditionId: rule.conditionId,
        foodId: food.id,
        verdict,
        reason: rule.reason(food, verdict),
        priority: rule.priority,
      }
    },
  )
}

export function evaluateConstraints(
  food: Food,
  context: ConstraintContext,
): RuleEvaluation[] {
  const evaluations = [
    ...evaluateFoodRules(food, context.conditions),
  ]

  const preference = evaluatePreference(food, context.foodPreference)
  if (preference) evaluations.push(preference)

  const allergen = evaluateAllergens(food, context.allergens)
  if (allergen) evaluations.push(allergen)

  const religious = evaluateReligious(food, context.religiousRestrictions)
  if (religious) evaluations.push(religious)

  return evaluations
}

export function strictestVerdict(evaluations: RuleEvaluation[]): RuleVerdict {
  if (evaluations.some((e) => e.verdict === 'block')) return 'block'
  if (evaluations.some((e) => e.verdict === 'limit')) return 'limit'
  return 'allow'
}

export function filterFoodsByRules(
  foods: Food[],
  conditions: MedicalConditionId[],
): {
  allowed: Food[]
  limited: Food[]
  blocked: Food[]
  evaluations: RuleEvaluation[]
} {
  return filterFoodsByConstraints(foods, {
    conditions,
    foodPreference: 'nonveg',
    allergens: [],
    religiousRestrictions: [],
  })
}

export function filterFoodsByConstraints(
  foods: Food[],
  context: ConstraintContext,
): {
  allowed: Food[]
  limited: Food[]
  blocked: Food[]
  evaluations: RuleEvaluation[]
} {
  const evaluations: RuleEvaluation[] = []
  const allowed: Food[] = []
  const limited: Food[] = []
  const blocked: Food[] = []

  for (const food of foods) {
    const foodEvals = evaluateConstraints(food, context)
    evaluations.push(...foodEvals)
    const verdict = strictestVerdict(foodEvals)
    if (verdict === 'block') blocked.push(food)
    else if (verdict === 'limit') limited.push(food)
    else allowed.push(food)
  }

  return { allowed, limited, blocked, evaluations }
}
