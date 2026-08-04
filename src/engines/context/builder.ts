import { calculateNutritionTargets } from '@/engines/nutrition'
import {
  CONTEXT_VERSION,
  DEFAULT_AVAILABLE_MEALS,
  DEFAULT_BUDGET_TIER,
  DEFAULT_LANGUAGE,
  DEFAULT_SEASON,
  EMPTY_EXTENSIONS,
  PREFERENCE_KEYS,
} from '@/engines/context/constants'
import type { ContextBuildInput, UserContext } from '@/engines/context/types'
import {
  assertCompatibleVersion,
  validateBuildInput,
  validateUserContext,
} from '@/engines/context/validators'

/**
 * ContextBuilder — pure assembly of UserContext.
 * No IndexedDB, no React, no network. Callers supply already-loaded inputs.
 */
export function buildUserContext(input: ContextBuildInput): UserContext {
  validateBuildInput(input)
  assertCompatibleVersion(input.contextVersion)

  const conditions = Object.freeze([...(input.conditions ?? [])])
  const preferencesRaw = freezeRecord(input.preferences ?? {})
  const allergens = Object.freeze(parseList(preferencesRaw[PREFERENCE_KEYS.allergens]))
  const religiousRestrictions = Object.freeze(
    parseList(preferencesRaw[PREFERENCE_KEYS.religious]),
  )
  const pantryFoodIds = Object.freeze(parseList(preferencesRaw[PREFERENCE_KEYS.pantry]))

  const nutritionTargets = Object.freeze(
    calculateNutritionTargets(input.profile, [...conditions]),
  )

  const waterGoalMl = input.waterGoalMl ?? nutritionTargets.waterMl
  const waterConsumedMl = Math.max(0, input.waterConsumedMl ?? 0)

  const availableMeals = Object.freeze({
    ...DEFAULT_AVAILABLE_MEALS,
    ...(input.availableMeals ?? {}),
  })

  const excludeFoodIds = Object.freeze([...(input.excludeFoodIds ?? [])])
  const recentFoodIds = Object.freeze([...(input.recentFoodIds ?? [])])
  const varietySeed =
    input.varietySeed ?? hashSeed(`${input.date}:${input.profile.userId}`)

  const context: UserContext = {
    version: input.contextVersion ?? CONTEXT_VERSION,
    timestamp: input.timestamp ?? `${input.date}T00:00:00.000Z`,
    date: input.date,
    language: input.language ?? DEFAULT_LANGUAGE,
    profile: Object.freeze({
      userId: input.profile.userId,
      age: input.profile.age,
      gender: input.profile.gender,
      heightCm: input.profile.heightCm,
      weightKg: input.profile.weightKg,
      foodPreference: input.profile.foodPreference,
      goal: input.profile.goal,
      activityLevel: input.profile.activityLevel,
    }),
    nutritionTargets,
    medical: Object.freeze({ conditions }),
    preferences: Object.freeze({
      raw: preferencesRaw,
      allergens,
      religiousRestrictions,
    }),
    activity: Object.freeze({ level: input.profile.activityLevel }),
    region: Object.freeze({
      stateCode: input.profile.stateCode,
      districtId: input.profile.districtId,
      stateName: input.stateName,
      districtName: input.districtName,
    }),
    state: input.profile.stateCode,
    district: input.profile.districtId,
    season: input.season ?? DEFAULT_SEASON,
    budget: Object.freeze({ tier: input.budgetTier ?? DEFAULT_BUDGET_TIER }),
    mealPreferences: Object.freeze({
      foodPreference: input.profile.foodPreference,
      pantryFoodIds,
    }),
    water: Object.freeze({
      goalMl: waterGoalMl,
      consumedMl: waterConsumedMl,
    }),
    waterGoal: waterGoalMl,
    foodRestrictions: Object.freeze({
      allergens,
      religiousRestrictions,
      conditions,
    }),
    goals: Object.freeze({ primary: input.profile.goal }),
    availableMeals,
    planning: Object.freeze({
      excludeFoodIds,
      varietySeed,
      recentFoodIds,
    }),
    extensions: EMPTY_EXTENSIONS,
  }

  const immutable = deepFreeze(context)
  validateUserContext(immutable)
  return immutable
}

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function freezeRecord(
  record: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return Object.freeze({ ...record })
}

function hashSeed(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Recursively freeze plain objects/arrays for immutability guarantees. */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  if (Object.isFrozen(value)) return value

  for (const key of Object.keys(value as object)) {
    const child = (value as Record<string, unknown>)[key]
    if (child && typeof child === 'object') deepFreeze(child)
  }
  return Object.freeze(value)
}
