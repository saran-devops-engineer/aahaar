# Life Context Engine

## Why

The Decision Engine knows **who** the user is (via Context Engine).

Life Context Engine answers **what TODAY looks like**.

```
Presentation
  → Decision Engine
  → Life Context Engine   ← today's reality
  → Context Engine        ← who / medical / targets
  → Learning Engine
  → Knowledge Engine
```

## Architecture

Every field comes from a **Provider**. Nothing is hardcoded as “truth” in the assembler.

Missing weather / pantry / wearables → **continue** (graceful degradation).

Life Context never overrides **Medical**.

Priority (for future Decision wiring):

```
Medical → Life Context → Learning → Knowledge → Variety
```

## LifeContext

One immutable object:

| Field | Source provider |
|-------|-----------------|
| currentDate / currentTime / dayOfWeek | DateProvider |
| season | SeasonProvider |
| festival / holiday | FestivalProvider |
| budgetStatus / salaryCycle | BudgetProvider |
| travel / office / home / workingDay | TravelProvider |
| availableCookingTime / mealPreparationWindow | CookingTimeProvider |
| pantry / shopping / leftovers / market | PantryProvider |
| temperature / weather / humidity | WeatherProvider (placeholder) |
| family / guest | FamilyProvider |
| sleep / stress / activity / hydration | WellbeingProvider |
| wearables / glucose / BP / HR / AQI / GPS | PlaceholdersProvider |

## Timeline

`getTimeline(kind)` / `getAllTimelines()`:

- `today`
- `tomorrow`
- `weekend`
- `festival`
- `vacation`

## Developer API

```ts
import {
  getLifeContext,
  evaluateToday,
  evaluateWeekend,
  evaluateTravel,
  evaluateFestival,
  evaluateWeather,
  evaluatePantry,
  getTimeline,
} from '@/engines/life-context'

const life = getLifeContext({
  date: '2026-08-15',
  budgetTier: 2,
  pantryFoodIds: ['food-idli-sambar'],
  travelMode: false,
  homeMode: true,
})

evaluateWeather(life) // available: false if no weather signals — safe to continue
evaluatePantry(life)
getTimeline('festival', { date: '2026-08-15' })
```

## Extension guide

1. Add fields to `LifeContext` / `LifeContextSignals` (nullable).
2. Create `providers/myProvider.ts` implementing `LifeContextProvider`.
3. Register in `DEFAULT_LIFE_CONTEXT_PROVIDERS`.
4. Optional evaluator under `evaluators/`.
5. Never call network from a provider — pass signals from the app layer later.

### Future providers (not implemented)

OpenWeather / IMD, wearables, calendar, GPS, smart kitchen, voice, pantry scanner, shopping history.

## Examples

**Minimal (date only)** — season + dayOfWeek filled; weather/pantry unknown; Decision can still run.

**Travel day** — `travelMode: true` → short cooking time via CookingTimeProvider.

**Independence Day** — FestivalProvider fills `festival` from local fixed calendar.

## Privacy

- Local / pure
- No cloud APIs in this engine
- No telemetry

## Folder layout

```
life-context/
  providers/
  evaluators/
  models/
  timeline/
  strategies/
  queries/
  types/
  constants/
  api.ts
  index.ts
  README.md
```
