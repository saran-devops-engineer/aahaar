# Context Engine

## Purpose

The Context Engine builds one immutable **UserContext** object that is the single source of truth for planning decisions.

The Decision Engine must **never** fetch profile, medical conditions, preferences, budget, season, or water itself. It only reads `UserContext`.

```
Presentation / Services  (I/O: Dexie, settings)
        ↓
  Context Engine         (pure build + validate)
        ↓
  Decision Engine        (consumes UserContext only)
        ↓
  Knowledge / Nutrition / Rules / Recommendation
```

## Architecture

| File | Role |
|------|------|
| `types.ts` | `UserContext`, `ContextBuildInput`, extension slots |
| `builder.ts` | Pure `buildUserContext(input)` |
| `validators.ts` | Input + context validation, version compatibility |
| `selectors.ts` | Read helpers (no mutation) |
| `constants.ts` | Version, defaults, empty extensions |
| `README.md` | This document |

### Constraints

- Pure functions only
- No React hooks
- No IndexedDB / network
- No UI
- Output is deeply frozen (immutable)

## Example

```ts
import { buildUserContext } from '@/engines/context'

const context = buildUserContext({
  profile,
  date: '2026-08-04',
  conditions: ['diabetes'],
  preferences: { allergens: 'dairy', pantry: 'food-dal-rice' },
  budgetTier: 2,
  season: 'monsoon',
  excludeFoodIds: ['food-idli-sambar'],
  varietySeed: 42,
  waterConsumedMl: 800,
})

// Decision Engine
decide(context, foods)
```

## Extension strategy

Future signals (weather, pantry, wearables, festival, travel, …) are **extension slots** on `UserContext.extensions`, initially `null`.

To add Weather later:

1. Create a **Weather provider** in the service/application layer that loads weather.
2. Pass it into `ContextBuildInput` (or a dedicated builder option) and populate `extensions.weather`.
3. **Do not** change Decision Engine fetch logic — Decision already receives `UserContext`.
4. Decision may later *read* `context.extensions.weather` when scoring; it still never fetches weather itself.

Same pattern for pantry, wearables, lab reports, family members, etc.

Adding a provider should not require reshaping core `UserContext` fields (`profile`, `medical`, `region`, …).

## Version upgrades

`CONTEXT_VERSION` (currently `1.5.0`) tracks the context shape.

- Same major version → compatible
- Major bump → `assertCompatibleVersion` rejects stale builders/inputs

Tests cover generation, validation, defaults, missing values, and version compatibility.

## What does not belong here

- Meal ranking / swaps (Recommendation)
- Hard medical rules (Rules Engine)
- Food catalog access (Knowledge)
- Dexie reads/writes (Services / Storage)
