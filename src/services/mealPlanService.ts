import { buildUserContext } from '@/engines/context'
import { decide } from '@/engines/decision'
import { currentSeason, getAllFoods } from '@/engines/knowledge'
import { db } from '@/database/db'
import { getConditionIdsForUser } from '@/services/conditionService'
import {
  getBudgetTier,
  getPreferencesForUser,
} from '@/services/preferenceService'
import { createId } from '@/shared/utils/id'
import {
  todayIsoDate,
  weekDates,
  weekStartIso,
} from '@/shared/utils/date'
import type {
  DecisionResult,
  Meal,
  MealPlan,
  MedicalConditionId,
  Profile,
} from '@/types/domain'

export async function getOrCreateWeekPlan(
  userId: string,
  weekStartDate = weekStartIso(),
): Promise<MealPlan> {
  const existing = await db.meal_plans
    .where({ userId, weekStartDate })
    .first()

  if (existing) return existing

  const now = new Date().toISOString()
  const plan: MealPlan = {
    id: createId('plan'),
    userId,
    weekStartDate,
    createdAt: now,
    updatedAt: now,
  }
  await db.meal_plans.put(plan)
  return plan
}

const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'] as const

export async function getMealsForDate(userId: string, date: string): Promise<Meal[]> {
  const weekStart = weekStartIso(new Date(`${date}T12:00:00`))
  const plan = await db.meal_plans.where({ userId, weekStartDate: weekStart }).first()
  if (!plan) return []
  const meals = await db.meals.where({ mealPlanId: plan.id, date }).toArray()
  return meals.sort(
    (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType),
  )
}

export async function getMealsForWeek(
  userId: string,
  weekStartDate = weekStartIso(),
): Promise<Meal[]> {
  const plan = await db.meal_plans.where({ userId, weekStartDate }).first()
  if (!plan) return []
  return db.meals.where('mealPlanId').equals(plan.id).sortBy('date')
}

export async function generateDayPlan(
  profile: Profile,
  date: string,
  options?: {
    conditions?: MedicalConditionId[]
    excludeFoodIds?: string[]
    varietySeed?: number
  },
): Promise<{ plan: MealPlan; meals: Meal[]; decision: DecisionResult }> {
  const foods = await getAllFoods()
  const resolvedConditions =
    options?.conditions ?? (await getConditionIdsForUser(profile.userId))
  const preferences = await getPreferencesForUser(profile.userId)
  const budgetTier = await getBudgetTier(profile.userId)
  const weekStart = weekStartIso(new Date(`${date}T12:00:00`))
  const plan = await getOrCreateWeekPlan(profile.userId, weekStart)

  const weekMeals = await getMealsForWeek(profile.userId, weekStart)
  const recentFoodIds = weekMeals.filter((m) => m.date !== date).map((m) => m.foodId)
  const excludeFoodIds = [
    ...(options?.excludeFoodIds ?? []),
    ...recentFoodIds,
  ]

  // Storage I/O stays in the service; Context Engine remains pure.
  const userContext = buildUserContext({
    profile,
    date,
    conditions: resolvedConditions,
    preferences,
    budgetTier,
    season: currentSeason(new Date(`${date}T12:00:00`).getMonth() + 1),
    excludeFoodIds,
    recentFoodIds,
    varietySeed: options?.varietySeed ?? Date.now(),
    timestamp: new Date().toISOString(),
  })

  const decision = decide(userContext, foods)

  const now = new Date().toISOString()
  const meals: Meal[] = decision.meals.map((m) => ({
    id: createId('meal'),
    mealPlanId: plan.id,
    date,
    mealType: m.mealType,
    foodId: m.foodId,
    servings: m.servings,
    explanation: m.explanation,
    createdAt: now,
  }))

  await db.transaction('rw', db.meal_plans, db.meals, async () => {
    const stale = await db.meals.where({ mealPlanId: plan.id, date }).toArray()
    await db.meals.bulkDelete(stale.map((m) => m.id))
    await db.meals.bulkPut(meals)
    await db.meal_plans.update(plan.id, { updatedAt: now })
  })

  return { plan, meals, decision }
}

/** @deprecated Prefer generateDayPlan — kept for Home “Plan today”. */
export async function generateTodayPlan(
  profile: Profile,
  conditions?: MedicalConditionId[],
): Promise<{ plan: MealPlan; meals: Meal[]; decision: DecisionResult }> {
  return generateDayPlan(profile, todayIsoDate(), { conditions })
}

export async function generateWeekPlan(
  profile: Profile,
  weekStartDate = weekStartIso(),
): Promise<{ plan: MealPlan; meals: Meal[] }> {
  const dates = weekDates(new Date(`${weekStartDate}T12:00:00`))
  const plan = await getOrCreateWeekPlan(profile.userId, weekStartDate)
  const allMeals: Meal[] = []
  const usedAcrossWeek: string[] = []
  const weekSeed = Date.now()

  for (let i = 0; i < dates.length; i += 1) {
    const date = dates[i]!
    const { meals } = await generateDayPlan(profile, date, {
      excludeFoodIds: usedAcrossWeek,
      varietySeed: weekSeed + i * 97,
    })
    allMeals.push(...meals)
    usedAcrossWeek.push(...meals.map((m) => m.foodId))
  }

  return { plan, meals: allMeals }
}

export async function clearDayMeals(userId: string, date: string): Promise<void> {
  const meals = await getMealsForDate(userId, date)
  await db.meals.bulkDelete(meals.map((m) => m.id))
}

export function groupMealsByDate(meals: Meal[]): Record<string, Meal[]> {
  return meals.reduce<Record<string, Meal[]>>((acc, meal) => {
    acc[meal.date] ??= []
    acc[meal.date]!.push(meal)
    return acc
  }, {})
}
