# Adaptive Learning Engine (ALE)

## Learning philosophy

AAHAAR should get more personal every day **without AI**.

The Adaptive Learning Engine observes local behaviour signals (accept, skip, like, swap, complete, reminders, shopping) and updates a per-user **LearningProfile**.

It changes **recommendation priority only**.

It never changes:

- medical hard rules
- nutrition targets
- allergen / diet restrictions
- food catalog facts

```
Decision
  → Nutrition / Rules / Knowledge (absolute)
  → Learning adjustments (soft priority)
  → Variety
  → Final meal
```

## Cold start

New users have `eventCount` near zero and `confidence: low`.

Affinity-based score deltas stay **0** until learning activates.

Diversity penalties may still apply (prevents early repeat streaks).

Behaviour matches today’s ranking when no learning map is supplied to ranking.

## Scoring

| Signal | Affinity effect |
|--------|-----------------|
| Liked | Strong increase |
| Completed / prepared | Increase |
| Accepted / repeated | Mild increase |
| Skipped / regenerated | Mild decrease |
| Swapped away | Decrease (replacement gets a small boost) |
| Disliked | Strong decrease |

Cuisine and ingredient affinities move with scaled deltas.

Affinity is stored in `[0, 100]` with neutral `50`.

## Decay

Affinities drift back toward neutral with a ~21-day half-life.

Recent behaviour matters more. Preferences are never permanently locked.

## Confidence

| Level | Meaning |
|-------|---------|
| Low | Few events — tiny caps on score deltas |
| Medium | Stable signals — moderate influence |
| High | Enough evidence — stronger (still capped) influence |

Aggressive reordering only happens at higher confidence.

## Diversity

Recent repeats of the same food receive a diversity penalty so favourites cannot monopolize the week (e.g. Idli five days in a row).

## Privacy

- Fully local (Dexie preferences JSON)
- No cloud analytics
- No third-party tracking
- Export/import is user-controlled

## Developer API

```ts
import {
  recordMealAccepted,
  recordMealSkipped,
  recordMealLiked,
  recordMealDisliked,
  recordMealSwapped,
  recordReminderIgnored,
  recordShoppingCompleted,
  getAffinity,
  getCuisineAffinity,
  getLearningProfile,
  getRecommendationAdjustment,
  getLearningAdjustmentsForFoods,
  exportLearningProfile,
  importLearningProfile,
} from '@/engines/learning'

await recordMealLiked(userId, food, 'breakfast')
const delta = getRecommendationAdjustment(profile, food.id, {
  cuisine: 'Andhra',
  ingredients: ['Rice'],
})

// Optional ranking hook (cold start safe)
rankFoodsForMeal(foods, {
  ...,
  learningAdjustments: getLearningAdjustmentsForFoods(userId, foods),
})
```

## Future AI integration

Future AI / voice / wearables / cloud sync should **read** the LearningProfile.

They must not replace this deterministic engine.

Wearables can emit new learning events later; AI can explain affinity reasons; sync can transport the versioned export bundle.

## Folder layout

```
learning/
  types/
  constants/
  models/
  profiles/
  events/
  scores/
  analytics/
  history/
  strategies/
  api.ts
  index.ts
  README.md
```
