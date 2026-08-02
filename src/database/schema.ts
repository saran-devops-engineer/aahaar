import type {
  ConditionRecord,
  District,
  Feedback,
  Food,
  Meal,
  MealPlan,
  Nutrient,
  PreferenceRecord,
  Profile,
  Region,
  RuleRecord,
  SeasonRecord,
  ShoppingList,
  User,
  WaterLog,
} from '@/types/domain'

/** Dexie table map — single source of truth for IndexedDB shape. */
export interface AahaarTables {
  users: User
  profiles: Profile
  conditions: ConditionRecord
  foods: Food
  nutrients: Nutrient
  regions: Region
  districts: District
  seasons: SeasonRecord
  meal_plans: MealPlan
  meals: Meal
  shopping_lists: ShoppingList
  feedback: Feedback
  preferences: PreferenceRecord
  rules: RuleRecord
  water_logs: WaterLog
}

export const TABLE_INDEXES = {
  users: 'id, createdAt, onboardingComplete',
  profiles: 'id, userId, stateCode, districtId',
  conditions: 'id, userId, conditionId',
  foods: 'id, category, costTier, *stateCodes, *seasons, *mealTypes',
  nutrients: 'id, foodId, key',
  regions: 'id, stateCode',
  districts: 'id, stateCode',
  seasons: 'id, name',
  meal_plans: 'id, [userId+weekStartDate], userId, weekStartDate',
  meals: 'id, [mealPlanId+date], mealPlanId, date, mealType, foodId',
  shopping_lists: 'id, [userId+mealPlanId], userId, mealPlanId',
  feedback: 'id, userId, mealId, foodId',
  preferences: 'id, [userId+key], userId, key',
  rules: 'id, conditionId, priority',
  water_logs: 'id, [userId+date], userId, date',
} as const
