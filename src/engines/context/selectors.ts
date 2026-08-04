import type { MealType, MedicalConditionId } from '@/types/domain'
import type { UserContext } from '@/engines/context/types'

export function selectStateCode(context: UserContext): string {
  return context.state
}

export function selectDistrictId(context: UserContext): string {
  return context.district
}

export function selectSeason(context: UserContext): UserContext['season'] {
  return context.season
}

export function selectBudgetTier(context: UserContext): UserContext['budget']['tier'] {
  return context.budget.tier
}

export function selectConditions(context: UserContext): readonly MedicalConditionId[] {
  return context.medical.conditions
}

export function selectFoodPreference(context: UserContext): UserContext['profile']['foodPreference'] {
  return context.profile.foodPreference
}

export function selectAllergens(context: UserContext): readonly string[] {
  return context.foodRestrictions.allergens
}

export function selectReligiousRestrictions(context: UserContext): readonly string[] {
  return context.foodRestrictions.religiousRestrictions
}

export function selectPantryFoodIds(context: UserContext): readonly string[] {
  return context.mealPreferences.pantryFoodIds
}

export function selectExcludeFoodIds(context: UserContext): readonly string[] {
  return context.planning.excludeFoodIds
}

export function selectVarietySeed(context: UserContext): number {
  return context.planning.varietySeed
}

export function selectAvailableMeals(
  context: UserContext,
): Readonly<Partial<Record<MealType, boolean>>> {
  return context.availableMeals
}

export function selectNutritionTargets(context: UserContext): UserContext['nutritionTargets'] {
  return context.nutritionTargets
}

export function selectWaterProgressPct(context: UserContext): number {
  if (context.water.goalMl <= 0) return 0
  return Math.round((context.water.consumedMl / context.water.goalMl) * 100)
}

export function selectPreferLowGi(context: UserContext): boolean {
  return (
    context.medical.conditions.includes('diabetes') ||
    context.medical.conditions.includes('pcos')
  )
}

/** True when a future extension slot has been populated by a provider. */
export function hasExtension(
  context: UserContext,
  key: keyof UserContext['extensions'],
): boolean {
  return context.extensions[key] != null
}
