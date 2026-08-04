import { describe, expect, it, beforeEach } from 'vitest'
import {
  CONFIDENCE_VERSION,
  assertMedicalHighest,
  buildConfidenceSignals,
  calculateConfidence,
  calculateConfidenceFor,
  computeConfidenceAnalytics,
  explainConfidence,
  getConfidence,
  getSignals,
  getWeights,
  normalizeWeights,
  resetConfidenceCache,
  weightedConfidenceScore,
} from '@/engines/confidence'
import { DEFAULT_CONFIDENCE_WEIGHTS } from '@/engines/confidence/constants'
import { getWeights as rawWeights } from '@/engines/confidence/weights'

beforeEach(() => {
  resetConfidenceCache()
})

describe('Nutrition Confidence Engine', () => {
  it('calculates a weighted confidence score from signals', () => {
    const result = calculateConfidence({
      recommendationId: 'rec-1',
      foodId: 'food-idli-sambar',
      mealType: 'breakfast',
      medical: {
        conditionsKnown: true,
        allergensKnown: true,
        hardRulePass: true,
        ruleAppliedCount: 3,
      },
      nutrition: {
        targetsAvailable: true,
        weightKnown: true,
        heightKnown: true,
        decisionScore: 95,
      },
      learning: {
        coldStart: false,
        confidence: 'medium',
        confidenceScore: 82,
        affinityKnown: true,
      },
      knowledge: { catalogReady: true, candidateCount: 40, foodKnown: true },
      context: { profileComplete: true, lifeContextAvailable: true, missingLifeFields: 2 },
      region: { stateKnown: true, districtKnown: true, regionalMatch: true },
      budget: { tierKnown: true, withinBudget: true },
      preference: { foodPreferenceKnown: true, matchesPreference: true },
      variety: { recentRepeat: false },
      history: { mealHistoryCount: 12, previouslyAccepted: true },
      season: { seasonKnown: true, inSeason: true },
      pantry: { pantryKnown: true, status: 'adequate', usesPantry: true },
      weatherUnknown: false,
    })

    expect(result.version).toBe(CONFIDENCE_VERSION)
    expect(result.score).toBeGreaterThanOrEqual(85)
    expect(result.level).toBe('high')
    expect(result.safetyAction).toBe('auto_recommend')
    expect(result.signals.length).toBeGreaterThanOrEqual(10)

    const medical = result.signals.find((s) => s.signal === 'medical')
    const nutrition = result.signals.find((s) => s.signal === 'nutrition')
    const learning = result.signals.find((s) => s.signal === 'learning')
    expect(medical?.score).toBeGreaterThanOrEqual(95)
    expect(nutrition?.score).toBeGreaterThanOrEqual(90)
    expect(learning?.score).toBe(82)
  })

  it('lowers confidence when pantry, allergies, and weight are missing', () => {
    const full = calculateConfidence({
      medical: { allergensKnown: true, conditionsKnown: true, hardRulePass: true },
      nutrition: { targetsAvailable: true, weightKnown: true, decisionScore: 90 },
      pantry: { pantryKnown: true, status: 'full' },
      weatherUnknown: false,
    })
    const missing = calculateConfidence({
      medical: { allergensKnown: false, conditionsKnown: true, hardRulePass: true },
      nutrition: { targetsAvailable: true, weightKnown: false, decisionScore: 90 },
      pantry: { pantryKnown: false, status: 'unknown' },
      weatherUnknown: true,
    })

    expect(missing.score).toBeLessThan(full.score)
    expect(missing.missingImpact).toBeGreaterThan(0)
    expect(missing.signals.find((s) => s.signal === 'pantry')?.unknown).toBe(true)
    expect(missing.signals.find((s) => s.signal === 'data_quality')?.reason).toMatch(/Missing/)
  })

  it('uses Medical > Nutrition > Learning weight order', () => {
    const weights = getWeights()
    expect(assertMedicalHighest(weights)).toBe(true)
    expect(weights.medical).toBeGreaterThanOrEqual(weights.nutrition)
    expect(weights.nutrition).toBeGreaterThanOrEqual(weights.learning)
  })

  it('supports weight overrides and normalization', () => {
    const weights = normalizeWeights(
      rawWeights({ medical: 50, nutrition: 30, learning: 20 }),
    )
    const sum = Object.values(weights).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(100, 0)

    const result = calculateConfidence({
      weights: { medical: 50, nutrition: 1, learning: 1 },
      medical: { hardRulePass: false, allergensKnown: true },
      nutrition: { targetsAvailable: true, weightKnown: true, decisionScore: 100 },
    })
    expect(result.score).toBeLessThan(70)
  })

  it('cold-start learning lowers learning signal', () => {
    const cold = calculateConfidence({
      learning: { coldStart: true, confidence: 'low', eventCount: 0 },
    })
    const warm = calculateConfidence({
      learning: { coldStart: false, confidence: 'high', confidenceScore: 92 },
    })
    const coldLearning = cold.signals.find((s) => s.signal === 'learning')!.score
    const warmLearning = warm.signals.find((s) => s.signal === 'learning')!.score
    expect(coldLearning).toBeLessThan(warmLearning)
  })

  it('maps low confidence to ask_user safety action', () => {
    const result = calculateConfidence({
      medical: { hardRulePass: false, allergensKnown: false },
      nutrition: { targetsAvailable: false, weightKnown: false },
      learning: { coldStart: true },
      knowledge: { catalogReady: false, candidateCount: 1 },
      pantry: { pantryKnown: false, status: 'unknown' },
      preference: { foodPreferenceKnown: false, matchesPreference: false },
    })
    expect(result.level).toBe('low')
    expect(result.safetyAction).toBe('ask_user')
  })

  it('caches getConfidence / getSignals and explains results', () => {
    const result = calculateConfidenceFor({
      recommendationId: 'rec-cache',
      medical: { allergensKnown: true, hardRulePass: true },
      nutrition: { targetsAvailable: true, weightKnown: true, decisionScore: 88 },
    })
    expect(getConfidence('rec-cache')?.score).toBe(result.score)
    expect(getSignals('rec-cache').length).toBe(result.signals.length)

    const explanation = explainConfidence(result)
    expect(explanation.formula).toContain('medical')
    expect(explanation.topSignals.length).toBeGreaterThan(0)
    expect(explanation.summary).toMatch(/Confidence/)
  })

  it('computes analytics across results', () => {
    const a = calculateConfidenceFor({
      recommendationId: 'a',
      medical: { hardRulePass: true, allergensKnown: true },
      nutrition: { targetsAvailable: true, weightKnown: true, decisionScore: 95 },
      pantry: { pantryKnown: true, status: 'full' },
    })
    const b = calculateConfidenceFor({
      recommendationId: 'b',
      medical: { hardRulePass: false, allergensKnown: false },
      nutrition: { weightKnown: false },
      pantry: { pantryKnown: false, status: 'unknown' },
    })
    const analytics = computeConfidenceAnalytics([a, b])
    expect(analytics.sampleCount).toBe(2)
    expect(analytics.highestConfidence).toBeGreaterThanOrEqual(analytics.lowestConfidence)
    expect(analytics.mostUncertain[0]?.recommendationId).toBe('b')
    expect(analytics.missingInformationImpact).toBeGreaterThanOrEqual(0)
  })

  it('signal builder produces one signal per type and weighted score is deterministic', () => {
    const weights = DEFAULT_CONFIDENCE_WEIGHTS
    const input = {
      medical: { allergensKnown: true, hardRulePass: true },
      nutrition: { weightKnown: true, targetsAvailable: true, decisionScore: 80 },
    }
    const s1 = buildConfidenceSignals(input, weights, '2026-08-04T10:00:00.000Z')
    const s2 = buildConfidenceSignals(input, weights, '2026-08-04T10:00:00.000Z')
    expect(s1.map((s) => s.score)).toEqual(s2.map((s) => s.score))
    expect(weightedConfidenceScore(s1)).toBe(weightedConfidenceScore(s2))
    expect(new Set(s1.map((s) => s.signal)).size).toBe(s1.length)
  })

  it('handles empty input edge case without throwing', () => {
    const result = calculateConfidence({})
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.signals.length).toBeGreaterThan(0)
  })
})
