import { db } from '@/database/db'
import type {
  CostTier,
  District,
  Food,
  MealType,
  Region,
  Season,
} from '@/types/domain'

export { syncKnowledgeBase, FOOD_CATALOG_VERSION } from '@/engines/knowledge/catalog'
export { FOOD_CATALOG } from '@/engines/knowledge/data/foods'
export { REGION_RECORDS } from '@/engines/knowledge/data/regions'
export { DISTRICT_RECORDS } from '@/engines/knowledge/data/districts'

export interface FoodQuery {
  mealType?: MealType
  season?: Season
  stateCode?: string
  districtId?: string
  maxCostTier?: CostTier
  pantryFoodIds?: string[]
}

/**
 * Knowledge Base access layer — all food/region reads go through here.
 */
export async function getAllFoods(): Promise<Food[]> {
  return db.foods.toArray()
}

export async function getFoodById(id: string): Promise<Food | undefined> {
  return db.foods.get(id)
}

export async function getFoodsByIds(ids: string[]): Promise<Food[]> {
  if (ids.length === 0) return []
  return db.foods.bulkGet(ids).then((rows) => rows.filter((f): f is Food => Boolean(f)))
}

export async function queryFoods(query: FoodQuery = {}): Promise<Food[]> {
  const foods = await getAllFoods()
  return foods.filter((food) => matchesFoodQuery(food, query))
}

export function matchesFoodQuery(food: Food, query: FoodQuery): boolean {
  if (query.mealType && !food.mealTypes.includes(query.mealType)) return false

  if (query.season) {
    const inSeason =
      food.seasons.includes('all') || food.seasons.includes(query.season)
    if (!inSeason) return false
  }

  if (query.maxCostTier && food.costTier > query.maxCostTier) return false

  if (query.stateCode && food.stateCodes.length > 0) {
    // National/common foods (empty stateCodes) always pass; regional foods must match.
  }

  return true
}

/** Soft regional filter: keep national + matching regional foods. */
export function filterByRegion(foods: Food[], stateCode: string, districtId?: string): Food[] {
  return foods.filter((food) => {
    if (food.stateCodes.length === 0) return true
    if (food.stateCodes.includes(stateCode)) return true
    if (districtId && food.districtIds.includes(districtId)) return true
    return false
  })
}

export function filterBySeason(foods: Food[], season: Season): Food[] {
  return foods.filter(
    (food) => food.seasons.includes('all') || food.seasons.includes(season),
  )
}

export function filterByBudget(foods: Food[], maxCostTier: CostTier): Food[] {
  return foods.filter((food) => food.costTier <= maxCostTier)
}

export async function getRegions(): Promise<Region[]> {
  return db.regions.toArray()
}

export async function getDistrictsByState(stateCode: string): Promise<District[]> {
  return db.districts.where('stateCode').equals(stateCode).toArray()
}

export function currentSeason(month = new Date().getMonth() + 1): Season {
  if (month >= 3 && month <= 5) return 'summer'
  if (month >= 6 && month <= 9) return 'monsoon'
  return 'winter'
}

export function estimateGlycemicLoad(food: Food, servings = 1): number {
  if (food.nutrition.glycemicLoad != null) {
    return Math.round(food.nutrition.glycemicLoad * servings)
  }
  const gi = food.nutrition.glycemicIndex
  if (gi == null) return 0
  // GL ≈ GI × available carbs / 100
  return Math.round(((gi * food.nutrition.carbsG) / 100) * servings)
}
