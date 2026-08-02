import { PREFERENCE_KEYS, type PreferenceKey } from '@/config/profileOptions'
import { db } from '@/database/db'
import { createId } from '@/shared/utils/id'
import type { CostTier, PreferenceRecord } from '@/types/domain'

export async function getPreferencesForUser(
  userId: string,
): Promise<Record<string, string>> {
  const rows = await db.preferences.where('userId').equals(userId).toArray()
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

export async function setPreference(
  userId: string,
  key: PreferenceKey,
  value: string,
): Promise<PreferenceRecord> {
  const now = new Date().toISOString()
  const existing = await db.preferences
    .where('[userId+key]')
    .equals([userId, key])
    .first()

  const record: PreferenceRecord = {
    id: existing?.id ?? createId('pref'),
    userId,
    key,
    value,
    updatedAt: now,
  }

  await db.preferences.put(record)
  return record
}

export async function setPreferenceList(
  userId: string,
  key: PreferenceKey,
  values: string[],
): Promise<PreferenceRecord> {
  return setPreference(userId, key, values.join(','))
}

export function parsePreferenceList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export async function getBudgetTier(userId: string): Promise<CostTier> {
  const prefs = await getPreferencesForUser(userId)
  const tier = Number(prefs[PREFERENCE_KEYS.budgetTier])
  if (tier >= 1 && tier <= 5) return tier as CostTier
  return 3
}

export async function savePlanningPreferences(
  userId: string,
  input: {
    allergens: string[]
    religious: string[]
    budgetTier: CostTier
  },
): Promise<void> {
  await setPreferenceList(userId, PREFERENCE_KEYS.allergens, input.allergens)
  await setPreferenceList(userId, PREFERENCE_KEYS.religious, input.religious)
  await setPreference(userId, PREFERENCE_KEYS.budgetTier, String(input.budgetTier))
}
