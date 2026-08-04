# Nutrition Confidence Engine (NCE)

## Why

AAHAAR makes recommendations. NCE answers **how certain** each recommendation is.

Every recommendation can receive a deterministic **Confidence Score (0–100)** with explainable signals.

```
Decision Engine
  → Confidence Engine
  → Knowledge / Learning / Rule engines (as signal sources)
```

NCE does **not** change meal generation or ranking. It only measures certainty.

## Architecture

```
confidence/
  calculator/   weighted score
  signals/      per-source signal builders
  weights/      configurable weights (Medical > Nutrition > Learning)
  validators/   clamp + input checks
  models/       explain + Decision adapter
  analytics/    averages / uncertain picks
  types/
  constants/
```

## Signals

Each `ConfidenceSignal` has:

| Field | Meaning |
|-------|---------|
| signal | type enum |
| weight | contribution weight |
| score | 0–100 for that source |
| reason | short deterministic note |
| source | engine origin |
| timestamp | ISO time |
| unknown | degraded / missing path |

### Signal types

Medical · Nutrition · Learning · Knowledge · Context · Region · Budget · Preference · Variety · History · Season · Pantry · Data Quality

### Example

| Signal | Score |
|--------|------:|
| Medical | 100 |
| Nutrition | 95 |
| Learning | 82 |
| Pantry | unknown → lowered |
| Weather | unknown → data quality dip |
| **Final** | **~91** |

## Weight model

Default weights (sum normalized to 100):

1. **Medical** — highest  
2. **Nutrition** — second  
3. **Learning** — third  
4. Everything else below  

Override via `calculateConfidence({ weights: { … } })`.

Final score:

```
Σ (scoreᵢ × weightᵢ) / Σ weightᵢ
```

## Data quality

Missing information lowers confidence:

- Unknown pantry  
- Unknown allergies  
- Missing weight  
- Unknown weather (small)  
- Unknown budget / region  

## Safety actions

| Score | Action |
|------:|--------|
| ≤ 55 | `ask_user` |
| ≤ 80 | `review` |
| > 80 | `auto_recommend` |

## Developer API

```ts
import {
  calculateConfidence,
  getConfidence,
  getSignals,
  getWeights,
  explainConfidence,
  getConfidenceAnalytics,
  calculateConfidenceFromDecision,
} from '@/engines/confidence'

const result = calculateConfidence({
  foodId: 'food-idli-sambar',
  mealType: 'breakfast',
  medical: { allergensKnown: true, hardRulePass: true, conditionsKnown: true },
  nutrition: { targetsAvailable: true, weightKnown: true, decisionScore: 88 },
  learning: { coldStart: false, confidence: 'medium', confidenceScore: 82 },
  pantry: { pantryKnown: false, status: 'unknown' },
  weatherUnknown: true,
})

explainConfidence(result)
getWeights()
getConfidenceAnalytics()
```

## Analytics

- Average / highest / lowest confidence  
- Most uncertain recommendations  
- Missing-information impact  
- Counts by level and safety action  

## Future

Doctor / Nutritionist portals, medical review, research, and clinical studies should **read** NCE results — never replace this deterministic calculator with opaque AI scores.

## Privacy

Local · pure · no telemetry · no cloud.
