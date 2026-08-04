/**
 * Context Engine public API.
 * Decision and other engines consume UserContext — never fetch profile/prefs themselves.
 */
export { buildUserContext } from '@/engines/context/builder'
export {
  CONTEXT_VERSION,
  DEFAULT_AVAILABLE_MEALS,
  DEFAULT_BUDGET_TIER,
  DEFAULT_LANGUAGE,
  DEFAULT_SEASON,
  EMPTY_EXTENSIONS,
} from '@/engines/context/constants'
export {
  hasExtension,
  selectAllergens,
  selectAvailableMeals,
  selectBudgetTier,
  selectConditions,
  selectDistrictId,
  selectExcludeFoodIds,
  selectFoodPreference,
  selectNutritionTargets,
  selectPantryFoodIds,
  selectPreferLowGi,
  selectReligiousRestrictions,
  selectSeason,
  selectStateCode,
  selectVarietySeed,
  selectWaterProgressPct,
} from '@/engines/context/selectors'
export type {
  ActivityContext,
  BudgetContext,
  ContextBuildInput,
  ContextExtensions,
  ContextVersion,
  FoodRestrictionsContext,
  GoalsContext,
  MealPreferencesContext,
  MedicalContext,
  PlanningContext,
  PreferencesContext,
  ProfileSnapshot,
  RegionContext,
  UserContext,
  WaterContext,
} from '@/engines/context/types'
export {
  assertCompatibleVersion,
  ContextValidationError,
  isCompatibleContextVersion,
  validateBuildInput,
  validateUserContext,
} from '@/engines/context/validators'
