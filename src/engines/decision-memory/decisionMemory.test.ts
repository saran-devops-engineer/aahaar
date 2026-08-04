import { describe, expect, it, beforeEach } from 'vitest'
import {
  ALL_REASON_CODES,
  appendDecision,
  applyOutcome,
  applyRetention,
  computeDecisionAnalytics,
  createEmptyDecisionMemoryStore,
  createDecisionRecord,
  createRecordsFromDecisionResult,
  deserializeDecisionMemory,
  exportDecisionMemory,
  findSuccessfulMealsInStore,
  getDecisionHistoryInStore,
  getDecisionInStore,
  getDecisionReasonsInStore,
  getRejectedFoodsInStore,
  importDecisionMemory,
  inspectDecisionInStore,
  mapTextToReasonCodes,
  resetDecisionMemoryCache,
  serializeDecisionMemory,
} from '@/engines/decision-memory'
import { DEFAULT_RETENTION_DAYS } from '@/engines/decision-memory/constants'
import type { DecisionResult } from '@/types/domain'

const userId = 'user-dm-1'

beforeEach(() => {
  resetDecisionMemoryCache()
})

describe('Decision Memory Engine', () => {
  it('creates a decision with enum reason codes', () => {
    const record = createDecisionRecord({
      userId,
      date: '2026-08-04',
      mealType: 'breakfast',
      acceptedFoodId: 'food-idli-sambar',
      acceptedScore: 82,
      explanation: 'Idli for breakfast: Good protein share · Regional match',
      reasonTexts: ['Good protein share', 'Regional match', 'Lower glycemic impact'],
      appliedRuleIds: ['rule-diabetes-gi'],
      filtersApplied: ['season', 'region', 'budget', 'rules'],
      constraints: {
        conditions: ['diabetes'],
        foodPreference: 'veg',
        allergens: [],
        religiousRestrictions: [],
        stateCode: 'AP',
        season: 'summer',
      },
      rejected: [
        {
          foodId: 'food-butter-chicken',
          foodName: 'Butter Chicken',
          ruleId: 'rule-diabetes-gi',
          reasonText: 'High GI / diabetes',
        },
        {
          foodId: 'food-palak-paneer',
          foodName: 'Paneer',
          reasonCodes: ['USER_DISLIKE'],
        },
        {
          foodId: 'food-curd-rice',
          foodName: 'Curd Rice',
          reasonCodes: ['ALREADY_SERVED'],
        },
      ],
      candidates: [
        { foodId: 'food-idli-sambar', score: 82, reasons: ['Good protein share'] },
        { foodId: 'food-upma', score: 70, reasons: ['Quick to prepare'] },
      ],
    })

    expect(record.decisionId).toMatch(/^dec_/)
    expect(record.reasonCodes).toContain('HIGH_PROTEIN')
    expect(record.reasonCodes).toContain('REGIONAL_MATCH')
    expect(record.reasonCodes).toContain('LOW_GI')
    expect(record.reasonCodes).toContain('DIABETES_SAFE')
    expect(record.userAction).toBe('pending')
    expect(record.versions.memoryVersion).toBe('1.5.0')
    expect(record.decisionScore.overall).toBe(82)

    const butter = record.rejectedMeals.find((r) => r.foodId === 'food-butter-chicken')
    expect(butter?.reasonCodes).toContain('HIGH_GI')
    expect(butter?.contextTag).toBe('diabetes')
    expect(record.rejectedMeals.find((r) => r.foodId === 'food-palak-paneer')?.reasonCodes).toContain(
      'USER_DISLIKE',
    )
    expect(record.rejectedMeals.find((r) => r.foodId === 'food-curd-rice')?.reasonCodes).toContain(
      'ALREADY_SERVED',
    )
  })

  it('maps ranking phrases to reason codes without free-text storage', () => {
    const codes = mapTextToReasonCodes(['Learning preference (+6)', 'Balanced plate (carb + protein + veg)'])
    expect(codes).toContain('LEARNING_BOOST')
    expect(codes).toContain('BALANCED_PLATE')
    for (const code of codes) {
      expect(ALL_REASON_CODES).toContain(code)
    }
  })

  it('appends decisions and supports query API', () => {
    let store = createEmptyDecisionMemoryStore(userId, '2026-08-04T08:00:00.000Z')
    const { store: next, record } = appendDecision(store, {
      userId,
      date: '2026-08-04',
      mealType: 'lunch',
      acceptedFoodId: 'food-dal-rice',
      acceptedScore: 75,
      explanation: 'Dal Rice for lunch: Affordable',
      reasonTexts: ['Affordable'],
      timestamp: '2026-08-04T13:00:00.000Z',
      constraints: {
        conditions: [],
        allergens: [],
        religiousRestrictions: [],
        stateCode: 'TN',
      },
    })
    store = next
    store = applyOutcome(store, record.decisionId, 'accepted', {
      timestamp: '2026-08-04T13:05:00.000Z',
    })

    expect(getDecisionInStore(store, record.decisionId)?.userAction).toBe('accepted')
    expect(getDecisionReasonsInStore(store, record.decisionId)).toContain('LOW_BUDGET')
    expect(getDecisionHistoryInStore(store, { window: 'today', now: '2026-08-04T20:00:00.000Z' })).toHaveLength(
      1,
    )
    expect(findSuccessfulMealsInStore(store)).toHaveLength(1)
    expect(getRejectedFoodsInStore(store)).toHaveLength(0)

    const inspector = inspectDecisionInStore(store, record.decisionId)
    expect(inspector?.ruleChain).toBeDefined()
    expect(inspector?.contextSnapshot.stateCode).toBe('TN')
    expect(inspector?.decisionScore.overall).toBe(75)
  })

  it('tracks outcomes and analytics', () => {
    let store = createEmptyDecisionMemoryStore(userId, '2026-08-01T08:00:00.000Z')
    for (let i = 0; i < 3; i += 1) {
      const { store: s, record } = appendDecision(store, {
        userId,
        date: '2026-08-02',
        mealType: 'breakfast',
        acceptedFoodId: 'food-idli-sambar',
        acceptedScore: 80,
        explanation: 'Idli',
        reasonTexts: ['Regional match'],
        timestamp: `2026-08-02T0${8 + i}:00:00.000Z`,
      })
      store = applyOutcome(s, record.decisionId, 'loved')
    }
    const { store: s2, record: swapped } = appendDecision(store, {
      userId,
      date: '2026-08-02',
      mealType: 'dinner',
      acceptedFoodId: 'food-curd-rice',
      acceptedScore: 60,
      explanation: 'Curd Rice',
      timestamp: '2026-08-02T20:00:00.000Z',
    })
    store = applyOutcome(s2, swapped.decisionId, 'swapped', {
      swappedToFoodId: 'food-lemon-rice',
    })

    const analytics = computeDecisionAnalytics(store)
    expect(analytics.mostAcceptedMeals[0]?.foodId).toBe('food-idli-sambar')
    expect(analytics.mostSuccessfulBreakfast[0]?.foodId).toBe('food-idli-sambar')
    expect(analytics.mostCommonReplacements[0]?.fromTo).toContain('food-curd-rice')
  })

  it('compresses old records and never loses statistics', () => {
    let store = createEmptyDecisionMemoryStore(userId, '2026-01-01T08:00:00.000Z', 30)
    const { store: s1, record } = appendDecision(store, {
      userId,
      date: '2026-01-02',
      mealType: 'breakfast',
      acceptedFoodId: 'food-idli-sambar',
      acceptedScore: 80,
      explanation: 'Idli',
      reasonTexts: ['High fibre'],
      timestamp: '2026-01-02T08:00:00.000Z',
    })
    store = applyOutcome(s1, record.decisionId, 'accepted', {
      timestamp: '2026-01-02T08:05:00.000Z',
    })

    store = applyRetention(store, '2026-08-04T08:00:00.000Z')
    expect(store.records).toHaveLength(0)
    expect(store.stats.length).toBeGreaterThan(0)

    const analytics = computeDecisionAnalytics(store)
    expect(analytics.mostAcceptedMeals.some((m) => m.foodId === 'food-idli-sambar')).toBe(true)
    expect(analytics.totalCompressedPeriods).toBeGreaterThan(0)
    expect(DEFAULT_RETENTION_DAYS).toBeGreaterThan(0)
  })

  it('exports, imports, and migrates major versions', () => {
    let store = createEmptyDecisionMemoryStore(userId, '2026-08-04T08:00:00.000Z')
    const { store: next, record } = appendDecision(store, {
      userId,
      date: '2026-08-04',
      mealType: 'snack',
      acceptedFoodId: 'food-sprouts',
      acceptedScore: 55,
      explanation: 'Sprouts',
      timestamp: '2026-08-04T16:00:00.000Z',
    })
    store = next

    const raw = serializeDecisionMemory(store)
    const restored = deserializeDecisionMemory(raw)
    expect(restored.records[0]?.decisionId).toBe(record.decisionId)

    const bundle = exportDecisionMemory({
      ...store,
      version: '0.9.0',
    })
    const migrated = importDecisionMemory(bundle, { userId: 'user-2' })
    expect(migrated.userId).toBe('user-2')
    expect(migrated.version.startsWith('1.')).toBe(true)
    expect(migrated.records).toHaveLength(1)
  })

  it('builds records from DecisionResult without changing decide()', () => {
    const result: DecisionResult = {
      meals: [
        {
          mealType: 'breakfast',
          foodId: 'food-idli-sambar',
          servings: 1,
          explanation: 'Idli for breakfast: Regional match',
          score: 88,
          ruleNotes: [],
        },
      ],
      targets: {
        bmi: 22,
        bmiCategory: 'normal',
        bmr: 1400,
        tdee: 1800,
        calories: 1800,
        proteinG: 60,
        carbsG: 220,
        fatG: 50,
        fiberG: 25,
        waterMl: 2500,
        sodiumMgMax: 2300,
        mealSplit: { breakfast: 400, lunch: 600, snack: 200, dinner: 600 },
        adjustmentNotes: [],
      },
      appliedRuleIds: ['rule-food-preference'],
      sources: ['context-engine', 'knowledge-base'],
      blockedFoodCount: 2,
      candidateFoodCount: 40,
    }

    const records = createRecordsFromDecisionResult(userId, '2026-08-04', result, {
      constraints: {
        conditions: [],
        allergens: [],
        religiousRestrictions: [],
        foodPreference: 'veg',
        stateCode: 'TN',
      },
    })
    expect(records).toHaveLength(1)
    expect(records[0]!.acceptedMeal).toBe('food-idli-sambar')
    expect(records[0]!.reasonCodes.length).toBeGreaterThan(0)
  })
})
