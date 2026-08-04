import type { ActivityLevel } from '@/config/constants'
import type {
  CostTier,
  FoodPreference,
  Goal,
  MealType,
  MedicalConditionId,
  NutritionTargets,
  Profile,
  Season,
} from '@/types/domain'

/** Semantic version of the UserContext shape. Bump on breaking field changes. */
export type ContextVersion = `${number}.${number}.${number}`

export interface ProfileSnapshot {
  readonly userId: string
  readonly age: number
  readonly gender: Profile['gender']
  readonly heightCm: number
  readonly weightKg: number
  readonly foodPreference: FoodPreference
  readonly goal: Goal
  readonly activityLevel: ActivityLevel
}

export interface MedicalContext {
  readonly conditions: readonly MedicalConditionId[]
}

export interface PreferencesContext {
  /** Raw preference map from storage/settings (engine does not fetch). */
  readonly raw: Readonly<Record<string, string>>
  readonly allergens: readonly string[]
  readonly religiousRestrictions: readonly string[]
}

export interface ActivityContext {
  readonly level: ActivityLevel
}

export interface RegionContext {
  readonly stateCode: string
  readonly districtId: string
  /** Optional display names when caller has them. */
  readonly stateName?: string
  readonly districtName?: string
}

export interface BudgetContext {
  readonly tier: CostTier
}

export interface MealPreferencesContext {
  readonly foodPreference: FoodPreference
  readonly pantryFoodIds: readonly string[]
}

export interface WaterContext {
  readonly goalMl: number
  /** Intake so far for `date`, when known. */
  readonly consumedMl: number
}

export interface FoodRestrictionsContext {
  readonly allergens: readonly string[]
  readonly religiousRestrictions: readonly string[]
  readonly conditions: readonly MedicalConditionId[]
}

export interface GoalsContext {
  readonly primary: Goal
}

export interface PlanningContext {
  /** Soft-avoid these foods for variety. */
  readonly excludeFoodIds: readonly string[]
  /** Rotates top-N picks when regenerating. */
  readonly varietySeed: number
  /** Recent food ids from meal history (informational). */
  readonly recentFoodIds: readonly string[]
}

/**
 * Future extension slots.
 * New engines plug in by populating a slot via a provider — do not reshape core fields.
 */
export interface ContextExtensions {
  readonly weather: null
  readonly travel: null
  readonly festival: null
  readonly pantry: null
  readonly inventory: null
  readonly labReports: null
  readonly wearables: null
  readonly sleep: null
  readonly stress: null
  readonly glucose: null
  readonly heartRate: null
  readonly stepCount: null
  readonly familyMembers: null
  readonly workout: null
}

/**
 * Immutable single source of truth for Decision (and future engines).
 * Decision must never fetch profile/preferences itself — only read UserContext.
 */
export interface UserContext {
  readonly version: ContextVersion
  readonly timestamp: string
  readonly date: string
  readonly language: string
  readonly profile: ProfileSnapshot
  readonly nutritionTargets: NutritionTargets
  readonly medical: MedicalContext
  readonly preferences: PreferencesContext
  readonly activity: ActivityContext
  readonly region: RegionContext
  /** Alias convenience mirrors used by product language. */
  readonly state: string
  readonly district: string
  readonly season: Season
  readonly budget: BudgetContext
  readonly mealPreferences: MealPreferencesContext
  readonly water: WaterContext
  readonly waterGoal: number
  readonly foodRestrictions: FoodRestrictionsContext
  readonly goals: GoalsContext
  readonly availableMeals: Readonly<Partial<Record<MealType, boolean>>>
  readonly planning: PlanningContext
  readonly extensions: ContextExtensions
}

/**
 * Raw inputs collected by the application/service layer.
 * ContextBuilder is pure — callers perform storage I/O before invoking it.
 */
export interface ContextBuildInput {
  profile: Profile
  date: string
  conditions?: readonly MedicalConditionId[]
  preferences?: Readonly<Record<string, string>>
  budgetTier?: CostTier
  season?: Season
  language?: string
  availableMeals?: Partial<Record<MealType, boolean>>
  excludeFoodIds?: readonly string[]
  recentFoodIds?: readonly string[]
  varietySeed?: number
  waterConsumedMl?: number
  /** Override water goal; default comes from nutrition targets. */
  waterGoalMl?: number
  stateName?: string
  districtName?: string
  timestamp?: string
  /** For version-upgrade tests / migrations. */
  contextVersion?: ContextVersion
}
