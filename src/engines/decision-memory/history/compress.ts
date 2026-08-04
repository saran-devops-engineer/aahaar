import type {
  DecisionRecord,
  DecisionStatsBucket,
} from '@/engines/decision-memory/types'

function bump(map: Record<string, number>, key: string, by = 1): void {
  map[key] = (map[key] ?? 0) + by
}

function weekKey(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return date.slice(0, 7)
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function emptyBucket(
  period: DecisionStatsBucket['period'],
  key: string,
): {
  period: DecisionStatsBucket['period']
  key: string
  acceptedCount: number
  rejectedCount: number
  skippedCount: number
  swappedCount: number
  completedCount: number
  lovedCount: number
  dislikedCount: number
  foodAcceptCounts: Record<string, number>
  foodRejectCounts: Record<string, number>
  reasonCodeCounts: Record<string, number>
  cuisineCounts: Record<string, number>
  replacementCounts: Record<string, number>
  breakfastSuccessCounts: Record<string, number>
  ingredientSkipCounts: Record<string, number>
} {
  return {
    period,
    key,
    acceptedCount: 0,
    rejectedCount: 0,
    skippedCount: 0,
    swappedCount: 0,
    completedCount: 0,
    lovedCount: 0,
    dislikedCount: 0,
    foodAcceptCounts: {},
    foodRejectCounts: {},
    reasonCodeCounts: {},
    cuisineCounts: {},
    replacementCounts: {},
    breakfastSuccessCounts: {},
    ingredientSkipCounts: {},
  }
}

function applyRecordToBucket(
  bucket: ReturnType<typeof emptyBucket>,
  record: DecisionRecord,
): void {
  const action = record.userAction
  if (action === 'accepted' || action === 'completed' || action === 'repeated' || action === 'loved') {
    bucket.acceptedCount += 1
    bump(bucket.foodAcceptCounts, record.acceptedMeal)
    if (record.mealType === 'breakfast') {
      bump(bucket.breakfastSuccessCounts, record.acceptedMeal)
    }
  }
  if (action === 'rejected' || action === 'disliked') {
    bucket.rejectedCount += 1
    bump(bucket.foodRejectCounts, record.acceptedMeal)
  }
  if (action === 'skipped') bucket.skippedCount += 1
  if (action === 'swapped') {
    bucket.swappedCount += 1
    if (record.swappedToFoodId) {
      bump(bucket.replacementCounts, `${record.acceptedMeal}->${record.swappedToFoodId}`)
    }
  }
  if (action === 'completed') bucket.completedCount += 1
  if (action === 'loved') bucket.lovedCount += 1
  if (action === 'disliked') bucket.dislikedCount += 1

  for (const code of record.reasonCodes) bump(bucket.reasonCodeCounts, code)
  for (const rejected of record.rejectedMeals) {
    bump(bucket.foodRejectCounts, rejected.foodId)
    for (const code of rejected.reasonCodes) bump(bucket.reasonCodeCounts, code)
  }

  const season = record.constraints.season
  if (season) bump(bucket.cuisineCounts, season)
  const state = record.constraints.stateCode
  if (state) bump(bucket.cuisineCounts, `state:${state}`)
}

function mergeBucket(
  a: ReturnType<typeof emptyBucket>,
  b: DecisionStatsBucket,
): ReturnType<typeof emptyBucket> {
  const out = emptyBucket(a.period, a.key)
  out.acceptedCount = a.acceptedCount + b.acceptedCount
  out.rejectedCount = a.rejectedCount + b.rejectedCount
  out.skippedCount = a.skippedCount + b.skippedCount
  out.swappedCount = a.swappedCount + b.swappedCount
  out.completedCount = a.completedCount + b.completedCount
  out.lovedCount = a.lovedCount + b.lovedCount
  out.dislikedCount = a.dislikedCount + b.dislikedCount
  for (const [k, v] of Object.entries(a.foodAcceptCounts)) bump(out.foodAcceptCounts, k, v)
  for (const [k, v] of Object.entries(b.foodAcceptCounts)) bump(out.foodAcceptCounts, k, v)
  for (const [k, v] of Object.entries(a.foodRejectCounts)) bump(out.foodRejectCounts, k, v)
  for (const [k, v] of Object.entries(b.foodRejectCounts)) bump(out.foodRejectCounts, k, v)
  for (const [k, v] of Object.entries(a.reasonCodeCounts)) bump(out.reasonCodeCounts, k, v)
  for (const [k, v] of Object.entries(b.reasonCodeCounts)) bump(out.reasonCodeCounts, k, v)
  for (const [k, v] of Object.entries(a.cuisineCounts)) bump(out.cuisineCounts, k, v)
  for (const [k, v] of Object.entries(b.cuisineCounts)) bump(out.cuisineCounts, k, v)
  for (const [k, v] of Object.entries(a.replacementCounts)) bump(out.replacementCounts, k, v)
  for (const [k, v] of Object.entries(b.replacementCounts)) bump(out.replacementCounts, k, v)
  for (const [k, v] of Object.entries(a.breakfastSuccessCounts)) {
    bump(out.breakfastSuccessCounts, k, v)
  }
  for (const [k, v] of Object.entries(b.breakfastSuccessCounts)) {
    bump(out.breakfastSuccessCounts, k, v)
  }
  for (const [k, v] of Object.entries(a.ingredientSkipCounts)) {
    bump(out.ingredientSkipCounts, k, v)
  }
  for (const [k, v] of Object.entries(b.ingredientSkipCounts)) {
    bump(out.ingredientSkipCounts, k, v)
  }
  return out
}

function freezeBucket(b: ReturnType<typeof emptyBucket>): DecisionStatsBucket {
  return Object.freeze({
    period: b.period,
    key: b.key,
    acceptedCount: b.acceptedCount,
    rejectedCount: b.rejectedCount,
    skippedCount: b.skippedCount,
    swappedCount: b.swappedCount,
    completedCount: b.completedCount,
    lovedCount: b.lovedCount,
    dislikedCount: b.dislikedCount,
    foodAcceptCounts: Object.freeze({ ...b.foodAcceptCounts }),
    foodRejectCounts: Object.freeze({ ...b.foodRejectCounts }),
    reasonCodeCounts: Object.freeze({ ...b.reasonCodeCounts }),
    cuisineCounts: Object.freeze({ ...b.cuisineCounts }),
    replacementCounts: Object.freeze({ ...b.replacementCounts }),
    breakfastSuccessCounts: Object.freeze({ ...b.breakfastSuccessCounts }),
    ingredientSkipCounts: Object.freeze({ ...b.ingredientSkipCounts }),
  })
}

/**
 * Fold full records into day/week/month stats. Never drops counters.
 */
export function compressRecordsIntoStats(
  existing: readonly DecisionStatsBucket[],
  records: readonly DecisionRecord[],
): readonly DecisionStatsBucket[] {
  const map = new Map<string, ReturnType<typeof emptyBucket>>()

  for (const bucket of existing) {
    map.set(`${bucket.period}:${bucket.key}`, {
      ...emptyBucket(bucket.period, bucket.key),
      acceptedCount: bucket.acceptedCount,
      rejectedCount: bucket.rejectedCount,
      skippedCount: bucket.skippedCount,
      swappedCount: bucket.swappedCount,
      completedCount: bucket.completedCount,
      lovedCount: bucket.lovedCount,
      dislikedCount: bucket.dislikedCount,
      foodAcceptCounts: { ...bucket.foodAcceptCounts },
      foodRejectCounts: { ...bucket.foodRejectCounts },
      reasonCodeCounts: { ...bucket.reasonCodeCounts },
      cuisineCounts: { ...bucket.cuisineCounts },
      replacementCounts: { ...bucket.replacementCounts },
      breakfastSuccessCounts: { ...bucket.breakfastSuccessCounts },
      ingredientSkipCounts: { ...bucket.ingredientSkipCounts },
    })
  }

  for (const record of records) {
    const day = record.date
    const week = weekKey(day)
    const month = monthKey(day)
    for (const [period, key] of [
      ['day', day],
      ['week', week],
      ['month', month],
    ] as const) {
      const id = `${period}:${key}`
      const bucket = map.get(id) ?? emptyBucket(period, key)
      applyRecordToBucket(bucket, record)
      map.set(id, bucket)
    }
  }

  return Object.freeze([...map.values()].map(freezeBucket))
}

export function mergeStatsBuckets(
  a: readonly DecisionStatsBucket[],
  b: readonly DecisionStatsBucket[],
): readonly DecisionStatsBucket[] {
  const map = new Map<string, ReturnType<typeof emptyBucket>>()
  for (const bucket of [...a, ...b]) {
    const id = `${bucket.period}:${bucket.key}`
    const prev = map.get(id) ?? emptyBucket(bucket.period, bucket.key)
    map.set(id, mergeBucket(prev, bucket))
  }
  return Object.freeze([...map.values()].map(freezeBucket))
}
