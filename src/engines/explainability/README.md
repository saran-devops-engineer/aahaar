# Explainability Engine (XAI)

## Why

AAHAAR should never only say “Eat this.”

Every recommendation must answer:

- Why?
- What influenced it?
- What alternatives existed?
- How confident are we?
- What assumptions / missing data remain?

## Architecture

```
Decision Memory  (+ Learning / Life Context / Confidence)
        ↓
Explainability Engine   ← deterministic, evidence-based
        ↓
AI Formatter (optional, future)  ← wording only, never new reasons
        ↓
UI
```

**Never generate explanations from AI.**  
AI may only rephrase `MessageRef` text later. Reasons must already exist in Decision Memory.

## Reason model

1. Read `DecisionRecord.reasonCodes` and `rejectedMeals`.
2. Map codes → `MessageRef` (`key` + `defaultText` + params).
3. Build sections, evidence, alternatives, tradeoffs, missing data, next actions.
4. Optionally attach Confidence / Life Context / Learning **only when supplied**.

No hallucinations: unknown codes surface as `Recorded code: X`, never invented nutrition claims.

## Explanation object

`title` · `summary` · `reasoning` · `evidence` · `confidence` · `alternatives` · `tradeoffs` · `missingData` · `recommendations` · `nextActions` · `cards` · `assumptions` · `version`

### Sections

Why this meal? · Why today? · Why not another? · Medical · Nutrition · Regional · Budget · Preparation · Learning · Confidence · Future improvements

### Cards / audiences

| Card | Audience |
|------|----------|
| quick | user / parent |
| detailed | user |
| technical | developer / api |
| doctor | doctor / nutritionist |
| developer | developer |

Templates: `general_health`, `medical`, `fitness`, `weight_loss`, `kids`, `pregnancy`

## Localization

Explanations are structured as `MessageRef`:

```ts
{ key: 'evidence.high_protein', defaultText: 'High protein', params?: {…} }
```

Do not treat `defaultText` as the source of truth for product copy — translate via `key` later. Use `resolveMessage()` for deterministic fallback rendering.

## Developer API

```ts
import {
  buildExplanation,
  buildSummary,
  buildEvidence,
  buildAlternatives,
  buildTradeoffs,
  buildMissingData,
  buildNextActions,
  getExplanationCard,
  renderExplanationText,
  recordExplanationEvent,
  getExplanationAnalytics,
} from '@/engines/explainability'

const explanation = buildExplanation({
  decision,                 // required DecisionRecord
  learningProfile,          // optional
  lifeContext,              // optional
  confidence,               // optional
  foodNames: { 'food-idli-sambar': 'Idli Sambar' },
  audience: 'user',
  templateId: 'general_health',
})

renderExplanationText(explanation, 'quick')
```

## Analytics (local)

`viewed` · `confused` · `accepted` · `ignored`  
→ most viewed / confusing / accepted / ignored

## Future AI integration

Optional AI formatter may:

- rewrite `defaultText` for tone  
- never add evidence codes  
- never invent rejected reasons  

Doctor / Nutritionist portals should consume `doctor` / detailed cards as-is.

## Folder layout

```
explainability/
  builders/
  templates/
  reasoning/
  summaries/
  insights/
  analytics/
  types/
  constants/
  api.ts
  index.ts
  README.md
```
