import type { RuleEvaluation } from '@/engines/rules/types'
import type { Food, FoodPreference } from '@/types/domain'

export function evaluatePreference(
  food: Food,
  preference: FoodPreference,
): RuleEvaluation | null {
  const allowed = matchesPreference(food, preference)
  if (allowed) return null
  return {
    ruleId: 'rule-food-preference',
    foodId: food.id,
    verdict: 'block',
    reason: `${food.name} does not match ${preference} preference`,
    priority: 200,
  }
}

export function evaluateAllergens(
  food: Food,
  allergens: string[],
): RuleEvaluation | null {
  if (allergens.length === 0) return null
  const hit = food.allergens.find((a) =>
    allergens.map((x) => x.toLowerCase()).includes(a.toLowerCase()),
  )
  if (!hit) return null
  return {
    ruleId: 'rule-allergen',
    foodId: food.id,
    verdict: 'block',
    reason: `${food.name} contains allergen: ${hit}`,
    priority: 250,
  }
}

export function evaluateReligious(
  food: Food,
  restrictions: string[],
): RuleEvaluation | null {
  if (restrictions.length === 0) return null
  const normalized = restrictions.map((r) => r.toLowerCase())
  const hit = food.religiousRestrictions.find((r) =>
    normalized.includes(r.toLowerCase()),
  )
  if (!hit) return null
  return {
    ruleId: 'rule-religious',
    foodId: food.id,
    verdict: 'block',
    reason: `${food.name} conflicts with dietary restriction: ${hit}`,
    priority: 220,
  }
}

function matchesPreference(food: Food, preference: FoodPreference): boolean {
  switch (preference) {
    case 'vegan':
      return food.isVegan
    case 'jain':
      return food.isJain
    case 'veg':
      return food.isVeg
    case 'eggetarian':
      return food.isVeg || food.allergens.includes('egg') || food.id.includes('egg')
    case 'nonveg':
      return true
  }
}
