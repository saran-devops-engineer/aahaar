import type {
  DecisionAnalytics,
  DecisionMemoryStore,
  DecisionRecord,
  DecisionStatsBucket,
} from '@/engines/decision-memory/types'

function topCounts(
  map: Readonly<Record<string, number>>,
  limit = 10,
): { key: string; count: number }[] {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit)
}

function accumulateFromRecords(records: readonly DecisionRecord[]): {
  accept: Record<string, number>
  reject: Record<string, number>
  reasons: Record<string, number>
  cuisines: Record<string, number>
  replacements: Record<string, number>
  breakfast: Record<string, number>
  ingredients: Record<string, number>
} {
  const accept: Record<string, number> = {}
  const reject: Record<string, number> = {}
  const reasons: Record<string, number> = {}
  const cuisines: Record<string, number> = {}
  const replacements: Record<string, number> = {}
  const breakfast: Record<string, number> = {}
  const ingredients: Record<string, number> = {}

  for (const record of records) {
    for (const code of record.reasonCodes) {
      reasons[code] = (reasons[code] ?? 0) + 1
    }
    if (
      record.userAction === 'accepted' ||
      record.userAction === 'completed' ||
      record.userAction === 'repeated' ||
      record.userAction === 'loved'
    ) {
      accept[record.acceptedMeal] = (accept[record.acceptedMeal] ?? 0) + 1
      if (record.mealType === 'breakfast') {
        breakfast[record.acceptedMeal] = (breakfast[record.acceptedMeal] ?? 0) + 1
      }
    }
    if (record.userAction === 'rejected' || record.userAction === 'disliked') {
      reject[record.acceptedMeal] = (reject[record.acceptedMeal] ?? 0) + 1
    }
    if (record.userAction === 'skipped') {
      // Track skipped accepted meal id as ingredient-skip proxy when no ingredient list.
      ingredients[record.acceptedMeal] = (ingredients[record.acceptedMeal] ?? 0) + 1
    }
    if (record.userAction === 'swapped' && record.swappedToFoodId) {
      const key = `${record.acceptedMeal}->${record.swappedToFoodId}`
      replacements[key] = (replacements[key] ?? 0) + 1
    }
    for (const rejected of record.rejectedMeals) {
      reject[rejected.foodId] = (reject[rejected.foodId] ?? 0) + 1
      for (const code of rejected.reasonCodes) {
        reasons[code] = (reasons[code] ?? 0) + 1
      }
    }
    if (record.constraints.stateCode) {
      const c = `state:${record.constraints.stateCode}`
      cuisines[c] = (cuisines[c] ?? 0) + 1
    }
    for (const code of record.reasonCodes) {
      if (
        code.includes('CUISINE') ||
        code === 'SOUTH_INDIAN' ||
        code === 'NORTH_INDIAN' ||
        code === 'RICE_BELT' ||
        code === 'REGIONAL_MATCH'
      ) {
        cuisines[code] = (cuisines[code] ?? 0) + 1
      }
    }
  }

  return { accept, reject, reasons, cuisines, replacements, breakfast, ingredients }
}

function mergeMaps(
  a: Record<string, number>,
  b: Readonly<Record<string, number>>,
): Record<string, number> {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v
  return out
}

function accumulateFromStats(stats: readonly DecisionStatsBucket[]): {
  accept: Record<string, number>
  reject: Record<string, number>
  reasons: Record<string, number>
  cuisines: Record<string, number>
  replacements: Record<string, number>
  breakfast: Record<string, number>
  ingredients: Record<string, number>
} {
  let accept: Record<string, number> = {}
  let reject: Record<string, number> = {}
  let reasons: Record<string, number> = {}
  let cuisines: Record<string, number> = {}
  let replacements: Record<string, number> = {}
  let breakfast: Record<string, number> = {}
  let ingredients: Record<string, number> = {}

  // Prefer month buckets to avoid triple-counting day/week/month.
  const months = stats.filter((s) => s.period === 'month')
  const source = months.length > 0 ? months : stats.filter((s) => s.period === 'day')

  for (const bucket of source) {
    accept = mergeMaps(accept, bucket.foodAcceptCounts)
    reject = mergeMaps(reject, bucket.foodRejectCounts)
    reasons = mergeMaps(reasons, bucket.reasonCodeCounts)
    cuisines = mergeMaps(cuisines, bucket.cuisineCounts)
    replacements = mergeMaps(replacements, bucket.replacementCounts)
    breakfast = mergeMaps(breakfast, bucket.breakfastSuccessCounts)
    ingredients = mergeMaps(ingredients, bucket.ingredientSkipCounts)
  }

  return { accept, reject, reasons, cuisines, replacements, breakfast, ingredients }
}

export function computeDecisionAnalytics(store: DecisionMemoryStore): DecisionAnalytics {
  const fromRecords = accumulateFromRecords(store.records)
  const fromStats = accumulateFromStats(store.stats)

  const accept = mergeMaps(fromRecords.accept, fromStats.accept)
  const reject = mergeMaps(fromRecords.reject, fromStats.reject)
  const reasons = mergeMaps(fromRecords.reasons, fromStats.reasons)
  const cuisines = mergeMaps(fromRecords.cuisines, fromStats.cuisines)
  const replacements = mergeMaps(fromRecords.replacements, fromStats.replacements)
  const breakfast = mergeMaps(fromRecords.breakfast, fromStats.breakfast)
  const ingredients = mergeMaps(fromRecords.ingredients, fromStats.ingredients)

  return Object.freeze({
    mostAcceptedMeals: Object.freeze(
      topCounts(accept).map((x) => Object.freeze({ foodId: x.key, count: x.count })),
    ),
    mostRejectedMeals: Object.freeze(
      topCounts(reject).map((x) => Object.freeze({ foodId: x.key, count: x.count })),
    ),
    mostCommonRules: Object.freeze(
      topCounts(reasons).map((x) => Object.freeze({ code: x.key, count: x.count })),
    ),
    mostCommonCuisines: Object.freeze(
      topCounts(cuisines).map((x) => Object.freeze({ cuisine: x.key, count: x.count })),
    ),
    mostCommonReplacements: Object.freeze(
      topCounts(replacements).map((x) => Object.freeze({ fromTo: x.key, count: x.count })),
    ),
    mostSkippedIngredients: Object.freeze(
      topCounts(ingredients).map((x) =>
        Object.freeze({ ingredient: x.key, count: x.count }),
      ),
    ),
    mostSuccessfulBreakfast: Object.freeze(
      topCounts(breakfast).map((x) => Object.freeze({ foodId: x.key, count: x.count })),
    ),
    totalRecords: store.records.length,
    totalCompressedPeriods: store.stats.length,
  })
}
