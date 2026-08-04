import {
  MISSING_ALLERGEN_PENALTY,
  MISSING_PANTRY_PENALTY,
  MISSING_WEIGHT_PENALTY,
  MISSING_WEATHER_PENALTY,
  UNKNOWN_SIGNAL_SCORE,
} from '@/engines/confidence/constants'
import { clampScore } from '@/engines/confidence/validators'
import { weightFor } from '@/engines/confidence/weights'
import type {
  ConfidenceInput,
  ConfidenceSignal,
  ConfidenceWeights,
} from '@/engines/confidence/types'

function signal(
  type: ConfidenceSignal['signal'],
  weights: ConfidenceWeights,
  score: number,
  reason: string,
  source: ConfidenceSignal['source'],
  timestamp: string,
  unknown = false,
): ConfidenceSignal {
  return Object.freeze({
    signal: type,
    weight: weightFor(weights, type),
    score: clampScore(score),
    reason,
    source,
    timestamp,
    unknown: unknown || undefined,
  })
}

export function buildConfidenceSignals(
  input: ConfidenceInput,
  weights: ConfidenceWeights,
  timestamp: string,
): ConfidenceSignal[] {
  const signals: ConfidenceSignal[] = []

  // Medical — highest weight
  {
    const m = input.medical
    let score = 100
    const notes: string[] = []
    if (m?.conditionsKnown === false) {
      score -= 10
      notes.push('conditions unknown')
    }
    if (m?.allergensKnown === false) {
      score -= MISSING_ALLERGEN_PENALTY
      notes.push('allergies unknown')
    }
    if (m?.hardRulePass === false) {
      score -= 40
      notes.push('hard rule concern')
    }
    if ((m?.ruleBlockedCount ?? 0) > 0 && m?.hardRulePass !== false) {
      // Blocking other foods is healthy — slight boost for active medical filter
      score = Math.min(100, score + 2)
      notes.push('medical filters active')
    }
    if (m == null) {
      score = UNKNOWN_SIGNAL_SCORE + 20
      notes.push('medical signals defaulted')
    }
    signals.push(
      signal(
        'medical',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Medical rules satisfied',
        'rule-engine',
        timestamp,
        m?.allergensKnown === false || m == null,
      ),
    )
  }

  // Nutrition
  {
    const n = input.nutrition
    let score = 95
    const notes: string[] = []
    if (n?.targetsAvailable === false) {
      score -= 25
      notes.push('targets missing')
    }
    if (n?.weightKnown === false) {
      score -= MISSING_WEIGHT_PENALTY
      notes.push('weight missing')
    }
    if (n?.heightKnown === false) {
      score -= 8
      notes.push('height missing')
    }
    if (n?.decisionScore != null) {
      // Map typical ranking scores (~40–100) into nutrition confidence contribution
      const fit = Math.min(100, Math.max(40, n.decisionScore))
      score = Math.round(score * 0.55 + fit * 0.45)
      notes.push(`decision score ${Math.round(n.decisionScore)}`)
    }
    if (n?.calorieFit != null) {
      score = Math.round((score + clampScore(n.calorieFit)) / 2)
      notes.push(`calorie fit ${Math.round(n.calorieFit)}`)
    }
    if (n == null) {
      score = UNKNOWN_SIGNAL_SCORE + 15
      notes.push('nutrition signals defaulted')
    }
    signals.push(
      signal(
        'nutrition',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Nutrition targets available',
        'nutrition-engine',
        timestamp,
        n?.weightKnown === false || n?.targetsAvailable === false,
      ),
    )
  }

  // Learning
  {
    const l = input.learning
    let score = 82
    const notes: string[] = []
    if (l?.coldStart === true || l?.confidence === 'low') {
      score = 45
      notes.push('cold start / low learning confidence')
    } else if (l?.confidenceScore != null) {
      score = clampScore(l.confidenceScore)
      notes.push(`learning confidence ${score}`)
    } else if (l?.confidence === 'high') {
      score = 90
      notes.push('high learning confidence')
    } else if (l?.confidence === 'medium') {
      score = 72
      notes.push('medium learning confidence')
    }
    if (l?.affinityKnown === false) {
      score = Math.min(score, 55)
      notes.push('no affinity for food')
    }
    if (l == null) {
      score = UNKNOWN_SIGNAL_SCORE
      notes.push('learning unavailable')
    }
    signals.push(
      signal(
        'learning',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Learning profile active',
        'learning-engine',
        timestamp,
        l == null || l.coldStart === true,
      ),
    )
  }

  // Knowledge
  {
    const k = input.knowledge
    let score = 88
    const notes: string[] = []
    if (k?.catalogReady === false) {
      score -= 30
      notes.push('catalog not ready')
    }
    if (k?.foodKnown === false) {
      score -= 25
      notes.push('food unknown in catalog')
    }
    if (k?.candidateCount != null) {
      if (k.candidateCount < 3) {
        score -= 20
        notes.push('thin candidate pool')
      } else if (k.candidateCount >= 20) {
        score = Math.min(100, score + 5)
        notes.push('rich candidate pool')
      }
    }
    if (k == null) {
      score = UNKNOWN_SIGNAL_SCORE + 10
      notes.push('knowledge defaulted')
    }
    signals.push(
      signal(
        'knowledge',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Knowledge catalog ready',
        'knowledge-engine',
        timestamp,
        k?.catalogReady === false,
      ),
    )
  }

  // Context (UserContext / Life Context completeness)
  {
    const c = input.context
    let score = 85
    const notes: string[] = []
    if (c?.profileComplete === false) {
      score -= 20
      notes.push('profile incomplete')
    }
    if (c?.lifeContextAvailable === false) {
      score -= 10
      notes.push('life context missing')
    }
    if ((c?.missingLifeFields ?? 0) > 8) {
      score -= Math.min(25, (c!.missingLifeFields! - 8) * 2)
      notes.push(`${c!.missingLifeFields} life fields missing`)
    }
    if (c == null) {
      score = UNKNOWN_SIGNAL_SCORE + 5
      notes.push('context defaulted')
    }
    signals.push(
      signal(
        'context',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Context complete enough',
        'context-engine',
        timestamp,
        c?.profileComplete === false,
      ),
    )
  }

  // Region
  {
    const r = input.region
    let score = 90
    const notes: string[] = []
    if (r?.stateKnown === false) {
      score -= 30
      notes.push('state unknown')
    }
    if (r?.districtKnown === false) {
      score -= 10
      notes.push('district unknown')
    }
    if (r?.regionalMatch === true) {
      score = Math.min(100, score + 5)
      notes.push('regional match')
    } else if (r?.regionalMatch === false) {
      score -= 8
      notes.push('non-regional pick')
    }
    if (r == null) {
      score = UNKNOWN_SIGNAL_SCORE + 8
      notes.push('region defaulted')
    }
    signals.push(
      signal(
        'region',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Region known',
        'knowledge-engine',
        timestamp,
        r?.stateKnown === false,
      ),
    )
  }

  // Budget
  {
    const b = input.budget
    let score = 88
    const notes: string[] = []
    if (b?.tierKnown === false) {
      score -= 20
      notes.push('budget unknown')
    }
    if (b?.withinBudget === false) {
      score -= 25
      notes.push('over budget')
    } else if (b?.withinBudget === true) {
      notes.push('within budget')
    }
    if (b == null) {
      score = UNKNOWN_SIGNAL_SCORE + 5
      notes.push('budget defaulted')
    }
    signals.push(
      signal(
        'budget',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Budget known',
        'context-engine',
        timestamp,
        b?.tierKnown === false,
      ),
    )
  }

  // Preference
  {
    const p = input.preference
    let score = 90
    const notes: string[] = []
    if (p?.foodPreferenceKnown === false) {
      score -= 25
      notes.push('preference unknown')
    }
    if (p?.matchesPreference === false) {
      score -= 35
      notes.push('preference mismatch')
    } else if (p?.matchesPreference === true) {
      notes.push('matches preference')
    }
    if (p == null) {
      score = UNKNOWN_SIGNAL_SCORE + 5
      notes.push('preference defaulted')
    }
    signals.push(
      signal(
        'preference',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Preference known',
        'context-engine',
        timestamp,
        p?.foodPreferenceKnown === false,
      ),
    )
  }

  // Variety
  {
    const v = input.variety
    let score = 85
    const notes: string[] = []
    if (v?.recentRepeat === true) {
      score -= 20
      notes.push('recent repeat')
    }
    if (v?.diversityPenalty != null && v.diversityPenalty > 0) {
      score -= Math.min(30, v.diversityPenalty)
      notes.push(`diversity penalty ${v.diversityPenalty}`)
    }
    if (v == null) {
      score = UNKNOWN_SIGNAL_SCORE + 10
      notes.push('variety defaulted')
    }
    signals.push(
      signal(
        'variety',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Variety acceptable',
        'decision-engine',
        timestamp,
        v == null,
      ),
    )
  }

  // History
  {
    const h = input.history
    let score = 70
    const notes: string[] = []
    const count = h?.mealHistoryCount ?? 0
    if (h == null || count === 0) {
      score = 55
      notes.push('no meal history')
    } else {
      score = Math.min(95, 55 + Math.min(40, count * 2))
      notes.push(`${count} history points`)
    }
    if (h?.previouslyAccepted === true) {
      score = Math.min(100, score + 8)
      notes.push('previously accepted')
    }
    if (h?.previouslyRejected === true) {
      score -= 15
      notes.push('previously rejected')
    }
    signals.push(
      signal(
        'history',
        weights,
        score,
        notes.join('; '),
        'decision-engine',
        timestamp,
        h == null || count === 0,
      ),
    )
  }

  // Season
  {
    const s = input.season
    let score = 85
    const notes: string[] = []
    if (s?.seasonKnown === false) {
      score -= 20
      notes.push('season unknown')
    }
    if (s?.inSeason === true) {
      score = Math.min(100, score + 8)
      notes.push('in season')
    } else if (s?.inSeason === false) {
      score -= 12
      notes.push('out of season')
    }
    if (s == null) {
      score = UNKNOWN_SIGNAL_SCORE + 5
      notes.push('season defaulted')
    }
    signals.push(
      signal(
        'season',
        weights,
        score,
        notes.length > 0 ? notes.join('; ') : 'Season known',
        'life-context-engine',
        timestamp,
        s?.seasonKnown === false,
      ),
    )
  }

  // Pantry
  {
    const p = input.pantry
    let score = 80
    const notes: string[] = []
    const unknown = p == null || p.pantryKnown === false || p.status === 'unknown'
    if (unknown) {
      score -= MISSING_PANTRY_PENALTY
      notes.push('pantry unknown')
    } else if (p.usesPantry === true) {
      score = Math.min(100, score + 10)
      notes.push('uses pantry items')
    } else if (p.status === 'empty' || p.status === 'low') {
      score -= 10
      notes.push(`pantry ${p.status}`)
    } else {
      notes.push(`pantry ${p.status}`)
    }
    signals.push(
      signal(
        'pantry',
        weights,
        score,
        notes.join('; '),
        'life-context-engine',
        timestamp,
        unknown,
      ),
    )
  }

  // Data quality (aggregate missing-info impact)
  {
    let score = 100
    const notes: string[] = []
    if (input.medical?.allergensKnown === false) {
      score -= MISSING_ALLERGEN_PENALTY
      notes.push('allergies')
    }
    if (input.nutrition?.weightKnown === false) {
      score -= MISSING_WEIGHT_PENALTY
      notes.push('weight')
    }
    if (input.pantry?.pantryKnown === false || input.pantry?.status === 'unknown' || input.pantry == null) {
      score -= MISSING_PANTRY_PENALTY
      notes.push('pantry')
    }
    if (input.weatherUnknown === true) {
      score -= MISSING_WEATHER_PENALTY
      notes.push('weather')
    }
    if (input.budget?.tierKnown === false) {
      score -= 10
      notes.push('budget')
    }
    if (input.region?.stateKnown === false) {
      score -= 12
      notes.push('region')
    }
    if (notes.length === 0) notes.push('data complete')
    signals.push(
      signal(
        'data_quality',
        weights,
        score,
        notes[0] === 'data complete' ? 'Data complete' : `Missing: ${notes.join(', ')}`,
        'data-quality',
        timestamp,
        notes[0] !== 'data complete',
      ),
    )
  }

  return signals
}

export function computeMissingImpact(signals: readonly ConfidenceSignal[]): number {
  const unknowns = signals.filter((s) => s.unknown)
  if (unknowns.length === 0) return 0
  const impact = unknowns.reduce((acc, s) => acc + (100 - s.score) * (s.weight / 100), 0)
  return Math.round(impact * 10) / 10
}
