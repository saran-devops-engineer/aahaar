import { db } from '@/database/db'
import { createId } from '@/shared/utils/id'
import type { ConditionRecord, MedicalConditionId } from '@/types/domain'

export async function getConditionsForUser(userId: string): Promise<ConditionRecord[]> {
  return db.conditions.where('userId').equals(userId).toArray()
}

export async function getConditionIdsForUser(
  userId: string,
): Promise<MedicalConditionId[]> {
  const rows = await getConditionsForUser(userId)
  return rows.map((row) => row.conditionId)
}

export async function setConditionsForUser(
  userId: string,
  conditionIds: MedicalConditionId[],
): Promise<ConditionRecord[]> {
  const unique = [...new Set(conditionIds)]
  const now = new Date().toISOString()
  const existing = await getConditionsForUser(userId)
  const keep = new Set(unique)

  await db.transaction('rw', db.conditions, async () => {
    for (const row of existing) {
      if (!keep.has(row.conditionId)) {
        await db.conditions.delete(row.id)
      }
    }

    for (const conditionId of unique) {
      const found = existing.find((row) => row.conditionId === conditionId)
      if (found) continue
      await db.conditions.add({
        id: createId('cond'),
        userId,
        conditionId,
        createdAt: now,
      })
    }
  })

  return getConditionsForUser(userId)
}
