# Decision Memory Engine

## Why

Every recommendation should leave a memory of **why** it happened — not only what was picked.

The Decision Memory Engine stores immutable `DecisionRecord`s with reason codes, scores, constraints, rejected foods, and outcomes.

```
Decision Engine
  → Decision Memory Engine   (trace + explain later)
  → Adaptive Learning Engine
  → Nutrition Knowledge Engine
```

It does **not** change meal generation or ranking. It only remembers.

## Decision lifecycle

1. **Create** — `recordDecision()` / `recordDecisionResult()` after `decide()`
2. **Pending** — `userAction: 'pending'` until the user responds
3. **Outcome** — `recordDecisionOutcome()` with accepted / skipped / swapped / …
4. **Query** — history, reasons, rejected foods, successful/failed meals
5. **Retain** — old full records compress into stats; counters never discarded
6. **Export** — versioned JSON for backup / future sync

## Reason codes

Stored memory uses **enums only** (`ReasonCode`, `RejectionReasonCode`).

Free-text ranking phrases are mapped deterministically at write time (e.g. “Good protein share” → `HIGH_PROTEIN`).

Future Explainability Engine must **read** these codes from Decision Memory — never recreate explanations from scratch.

## Decision score

Each record stores a deterministic breakdown:

| Component | Role |
|-----------|------|
| nutrition | Fit to targets / plate signals |
| medical | Rule / safety contribution |
| learning | Soft learning delta (if any) |
| region | Regional / rice-belt / cuisine |
| budget | Cost-tier fit |
| variety | Diversity / recent-use |
| overall | Final pick score |

## Versioning

Each record snapshots:

- `contextVersion`
- `learningVersion`
- `knowledgeVersion`
- `ruleVersion`
- `nutritionVersion`
- `memoryVersion`

Export format: `aahaar.decision.memory`. Major-version import migrates while keeping records/stats.

## Retention

- Default: keep full records **90 days** (`DEFAULT_RETENTION_DAYS`)
- Configurable via `configureRetention(userId, days)`
- Older records compress into day / week / month `DecisionStatsBucket`s
- Statistics are never lost
- Hard cap: `MAX_FULL_RECORDS` newest detailed rows

## Analytics

`getDecisionAnalytics(userId)` aggregates live records + compressed stats:

- Most accepted / rejected meals
- Most common reason codes
- Most common cuisine / regional signals
- Most common replacements
- Most skipped items
- Most successful breakfasts

## Privacy

- Fully local (Dexie preferences key `decisionMemory`)
- No telemetry
- No cloud
- Export/import is user-controlled

## Developer guide

```ts
import {
  recordDecision,
  recordDecisionResult,
  recordDecisionOutcome,
  getDecision,
  getDecisionHistory,
  getDecisionReasons,
  getRejectedFoods,
  getRecommendationHistory,
  findSuccessfulMeals,
  findFailedMeals,
  getDecisionAnalytics,
  inspectDecision,
  exportDecisionMemoryForUser,
} from '@/engines/decision-memory'

// After decide() — optional, does not alter planning
await recordDecisionResult(userId, date, decisionResult)

await recordDecisionOutcome(userId, decisionId, 'accepted')

const reasons = getDecisionReasons(userId, decisionId)
const view = inspectDecision(userId, decisionId) // Decision Inspector
```

### Decision Inspector

Developer-only read model (`inspectDecision` / `listDecisionInspector`):

- Decision + reason codes
- Filter / rule chain
- Context snapshot
- Rejected foods
- Score breakdown
- Engine versions

No UI ships with this engine.

## Future compatibility

| Future surface | How it uses memory |
|----------------|--------------------|
| Doctor / Nutritionist Mode | Read records + reason codes |
| AI Explainability | Read `finalExplanation` + codes only |
| Cloud sync | Sync versioned export bundle |
| Research / export | Analytics + export API |

## Folder layout

```
decision-memory/
  types/
  constants/
  models/
  history/
  events/
  reasons/
  analytics/
  queries/
  api.ts
  index.ts
  README.md
```
