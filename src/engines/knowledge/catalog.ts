import { db } from '@/database/db'
import { DISTRICT_RECORDS } from '@/engines/knowledge/data/districts'
import { FOOD_CATALOG, FOOD_CATALOG_VERSION } from '@/engines/knowledge/data/foods'
import { REGION_RECORDS } from '@/engines/knowledge/data/regions'
import { RULE_RECORDS } from '@/engines/knowledge/data/rules'
import { SEASON_RECORDS } from '@/engines/knowledge/data/seasons'

const META_KEY = 'knowledgeCatalogVersion'

/**
 * Upsert knowledge base tables to the current catalog version.
 * Safe to call on every app start — only writes when version lags.
 */
export async function syncKnowledgeBase(): Promise<{ version: number; foodCount: number }> {
  const meta = await db.preferences.get(`meta_${META_KEY}`)
  const installedVersion = meta ? Number(meta.value) : 0

  if (installedVersion < FOOD_CATALOG_VERSION) {
    await db.transaction(
      'rw',
      [db.foods, db.regions, db.districts, db.seasons, db.rules, db.preferences],
      async () => {
        await db.foods.bulkPut(FOOD_CATALOG)
        await db.regions.bulkPut(REGION_RECORDS)
        await db.districts.bulkPut(DISTRICT_RECORDS)
        await db.seasons.bulkPut(SEASON_RECORDS)
        await db.rules.bulkPut(RULE_RECORDS)
        await db.preferences.put({
          id: `meta_${META_KEY}`,
          userId: 'system',
          key: META_KEY,
          value: String(FOOD_CATALOG_VERSION),
          updatedAt: new Date().toISOString(),
        })
      },
    )
  }

  return {
    version: FOOD_CATALOG_VERSION,
    foodCount: await db.foods.count(),
  }
}

export { FOOD_CATALOG_VERSION }
