import { db } from '@/database/db'
import {
  DISTRICT_CATALOG_VERSION,
  DISTRICT_RECORDS,
} from '@/engines/knowledge/data/districts'
import { FOOD_CATALOG, FOOD_CATALOG_VERSION } from '@/engines/knowledge/data/foods'
import { rebuildKnowledgeGraph } from '@/engines/knowledge/graph/builders/registry'
import { REGION_RECORDS } from '@/engines/knowledge/data/regions'
import { RULE_RECORDS } from '@/engines/knowledge/data/rules'
import { SEASON_RECORDS } from '@/engines/knowledge/data/seasons'

const META_KEY = 'knowledgeCatalogVersion'

/** Combined knowledge version — bump either catalog when regions/districts/foods change. */
export const KNOWLEDGE_CATALOG_VERSION =
  FOOD_CATALOG_VERSION * 1000 + DISTRICT_CATALOG_VERSION

/**
 * Upsert knowledge base tables to the current catalog version.
 * Safe to call on every app start — only writes when version lags.
 */
export async function syncKnowledgeBase(): Promise<{ version: number; foodCount: number }> {
  const meta = await db.preferences.get(`meta_${META_KEY}`)
  const installedVersion = meta ? Number(meta.value) : 0

  if (installedVersion < KNOWLEDGE_CATALOG_VERSION) {
    await db.transaction(
      'rw',
      [db.foods, db.regions, db.districts, db.seasons, db.rules, db.preferences, db.profiles],
      async () => {
        await db.foods.bulkPut(FOOD_CATALOG)
        await db.regions.clear()
        await db.regions.bulkPut(REGION_RECORDS)
        await db.districts.clear()
        await db.districts.bulkPut(DISTRICT_RECORDS)
        await db.seasons.bulkPut(SEASON_RECORDS)
        await db.rules.bulkPut(RULE_RECORDS)
        await remapLegacyDistrictIds()
        await db.preferences.put({
          id: `meta_${META_KEY}`,
          userId: 'system',
          key: META_KEY,
          value: String(KNOWLEDGE_CATALOG_VERSION),
          updatedAt: new Date().toISOString(),
        })
      },
    )
  }

  // Keep in-memory graph aligned with the catalog (no Dexie inside the graph engine).
  rebuildKnowledgeGraph(FOOD_CATALOG)

  return {
    version: KNOWLEDGE_CATALOG_VERSION,
    foodCount: await db.foods.count(),
  }
}

const LEGACY_DISTRICT_IDS: Record<string, string> = {
  'od-bhubaneswar': 'od-khordha',
  'as-guwahati': 'as-kamrup-metro',
}

async function remapLegacyDistrictIds(): Promise<void> {
  const profiles = await db.profiles.toArray()
  for (const profile of profiles) {
    const next = LEGACY_DISTRICT_IDS[profile.districtId]
    if (!next) continue
    await db.profiles.put({ ...profile, districtId: next, updatedAt: new Date().toISOString() })
  }
}

export { FOOD_CATALOG_VERSION, DISTRICT_CATALOG_VERSION }
