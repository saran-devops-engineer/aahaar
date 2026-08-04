import { describe, expect, it, beforeEach } from 'vitest'
import { createDecisionRecord } from '@/engines/decision-memory'
import { calculateConfidence } from '@/engines/confidence'
import { getLifeContext } from '@/engines/life-context'
import {
  EXPLAINABILITY_VERSION,
  buildAlternatives,
  buildEvidence,
  buildExplanation,
  buildMissingData,
  buildNextActions,
  buildSummary,
  buildTradeoffs,
  getExplanationAnalytics,
  getExplanationCard,
  messageForReasonCode,
  recordExplanationEvent,
  renderExplanationText,
  resetExplanationAnalytics,
  resetExplanationCache,
  resolveMessage,
} from '@/engines/explainability'

beforeEach(() => {
  resetExplanationCache()
  resetExplanationAnalytics()
})

function sampleDecision() {
  return createDecisionRecord({
    userId: 'user-xai',
    date: '2026-08-04',
    mealType: 'breakfast',
    acceptedFoodId: 'food-idli-sambar',
    acceptedScore: 88,
    explanation: 'Idli for breakfast: Good protein share · Regional match',
    reasonTexts: ['Good protein share', 'Regional match', 'Lower glycemic impact', 'Affordable'],
    appliedRuleIds: ['rule-diabetes-gi'],
    filtersApplied: ['season', 'region', 'budget', 'rules'],
    constraints: {
      conditions: ['diabetes'],
      foodPreference: 'veg',
      allergens: [],
      religiousRestrictions: [],
      stateCode: 'AP',
      season: 'summer',
      maxCostTier: 3,
    },
    rejected: [
      {
        foodId: 'food-butter-chicken',
        foodName: 'Butter Chicken',
        reasonCodes: ['HIGH_GI', 'MEDICAL_BLOCK'],
        contextTag: 'diabetes',
      },
      {
        foodId: 'food-curd-rice',
        foodName: 'Curd Rice',
        reasonCodes: ['ALREADY_SERVED'],
      },
      {
        foodId: 'food-palak-paneer',
        foodName: 'Paneer',
        reasonCodes: ['USER_DISLIKE'],
      },
    ],
    candidates: [
      {
        foodId: 'food-idli-sambar',
        score: 88,
        reasons: ['Good protein share', 'Regional match'],
      },
      { foodId: 'food-upma', score: 70, reasons: ['Quick to prepare'] },
    ],
    confidence: 'medium',
  })
}

describe('Explainability Engine', () => {
  it('builds an explanation object from Decision Memory only for reasons', () => {
    const decision = sampleDecision()
    const explanation = buildExplanation({
      decision,
      foodNames: { 'food-idli-sambar': 'Idli Sambar' },
      audience: 'user',
    })

    expect(explanation.version).toBe(EXPLAINABILITY_VERSION)
    expect(explanation.decisionId).toBe(decision.decisionId)
    expect(resolveMessage(explanation.title)).toContain('Idli Sambar')
    expect(explanation.title.params?.meal).toBe('Idli Sambar')
    expect(explanation.evidence.length).toBeGreaterThan(0)
    expect(explanation.reasoning.some((s) => s.id === 'why_this_meal')).toBe(true)
    expect(explanation.cards.map((c) => c.kind)).toEqual([
      'quick',
      'detailed',
      'technical',
      'doctor',
      'developer',
    ])

    // Every decision_memory evidence code must exist on the record (or be derived rejection).
    for (const ev of explanation.evidence.filter((e) => e.source === 'decision_memory')) {
      expect(decision.reasonCodes).toContain(ev.code)
    }
  })

  it('traces alternative rejections to Decision Memory reason codes', () => {
    const decision = sampleDecision()
    const alternatives = buildAlternatives({ decision })
    const paneer = alternatives.find((a) => a.foodId === 'food-palak-paneer')
    const curd = alternatives.find((a) => a.foodId === 'food-curd-rice')
    const butter = alternatives.find((a) => a.foodId === 'food-butter-chicken')

    expect(paneer?.reasonCodes).toContain('USER_DISLIKE')
    expect(curd?.reasonCodes).toContain('ALREADY_SERVED')
    expect(butter?.reasonCodes).toContain('HIGH_GI')
    expect(butter?.messages[0]?.key).toMatch(/evidence\./)
  })

  it('does not invent evidence for unknown codes', () => {
    const ref = messageForReasonCode('NOT_A_REAL_CODE')
    expect(ref.defaultText).toContain('NOT_A_REAL_CODE')
    expect(ref.key).toBe('evidence.unknown_code')
  })

  it('builds summary, tradeoffs, missing data, and next actions', () => {
    const decision = sampleDecision()
    const lifeContext = getLifeContext({
      date: '2026-08-04',
      now: '2026-08-04T08:00:00',
    })
    const confidence = calculateConfidence({
      medical: { allergensKnown: true, hardRulePass: true },
      nutrition: { weightKnown: false, targetsAvailable: true, decisionScore: 88 },
      pantry: { pantryKnown: false, status: 'unknown' },
      weatherUnknown: true,
    })

    const input = { decision, lifeContext, confidence }
    const evidence = buildEvidence(input)
    const summary = buildSummary(input)
    const tradeoffs = buildTradeoffs(input)
    const missing = buildMissingData(input)
    const next = buildNextActions(input)

    expect(resolveMessage(summary)).toMatch(/Idli|food-idli|chosen|because/i)
    expect(evidence.some((e) => e.code === 'HIGH_PROTEIN' || e.code === 'REGIONAL_MATCH')).toBe(
      true,
    )
    expect(missing.some((m) => m.field === 'pantry')).toBe(true)
    expect(missing.some((m) => m.field === 'weather')).toBe(true)
    expect(next.some((a) => a.action === 'update_pantry')).toBe(true)
    expect(Array.isArray(tradeoffs)).toBe(true)
  })

  it('selects medical template when conditions include diabetes', () => {
    const decision = sampleDecision()
    const explanation = buildExplanation({ decision, templateId: undefined })
    expect(explanation.templateId).toBe('medical')
  })

  it('renders audience cards without inventing sections', () => {
    const explanation = buildExplanation({
      decision: sampleDecision(),
      audience: 'doctor',
    })
    const doctor = getExplanationCard(explanation, 'doctor')
    expect(doctor?.audience).toBe('doctor')
    const text = renderExplanationText(explanation, 'quick')
    expect(text.length).toBeGreaterThan(0)
    expect(text).not.toMatch(/hallucin/i)
  })

  it('tracks explanation analytics events locally', () => {
    const explanation = buildExplanation({ decision: sampleDecision() })
    recordExplanationEvent(explanation.explanationId, explanation.decisionId, 'viewed')
    recordExplanationEvent(explanation.explanationId, explanation.decisionId, 'viewed')
    recordExplanationEvent(explanation.explanationId, explanation.decisionId, 'confused')
    recordExplanationEvent(explanation.explanationId, explanation.decisionId, 'accepted')
    recordExplanationEvent(explanation.explanationId, explanation.decisionId, 'ignored')

    const analytics = getExplanationAnalytics()
    expect(analytics.totalEvents).toBe(5)
    expect(analytics.mostViewed[0]?.count).toBe(2)
    expect(analytics.mostConfusing[0]?.explanationId).toBe(explanation.explanationId)
  })

  it('message refs are localization-ready (stable keys)', () => {
    const evidence = buildEvidence({ decision: sampleDecision() })
    for (const item of evidence.filter((e) => e.source === 'decision_memory')) {
      expect(item.message.key.startsWith('evidence.')).toBe(true)
      expect(item.message.defaultText.length).toBeGreaterThan(0)
    }
  })
})
