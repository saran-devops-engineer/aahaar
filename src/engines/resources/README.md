# Resource Intelligence Engine (RIE)

## Why

Meal planning without available resources creates impossible recommendations.

RIE answers: **what does the user actually have today?**

```
Nutrition Intelligence
  → Resource Intelligence Engine
  → Knowledge / Life Context / Decision Memory
```

Decision Engine (later) should ask: *Can this meal actually be prepared?*  
This package exposes that answer without modifying Decision / meal planner.

## Architecture

```
resources/
  inventory/     pantry items + indexes
  pantry/        availability helpers
  kitchen/       equipment + fuel
  budget/        monthly/weekly/daily/remaining
  freshness/     expiry → freshness
  availability/  stock status
  shopping/      needed items + cost estimate
  strategies/    evaluate / substitute / find available
  queries/
  analytics/
  models/        profile + persist (preferences JSON)
```

## Resources tracked

Pantry · Refrigerator · Freezer · Kitchen equipment · Cooking fuel · Cooking time · Monthly/weekly/shopping budget · Family size · Guests · Leftovers · Market availability · Food expiry

## Pantry model

Ingredient · Quantity · Unit · Purchase date · Expiry · Minimum level · Category · Location · Freshness

## Freshness

`fresh` → `good` → `consume_soon` → `expiring_today` → `expired`

## Availability

`available` · `low_stock` · `out_of_stock` · `unavailable` · `seasonal` · `market_unavailable`

## Constraints (examples)

| Resource signal | Effect |
|-----------------|--------|
| No eggs | Omelette missing Eggs |
| No gas / induction | Pressure-cooker / gas meals blocked |
| 20 minutes | Long prep fails `timeOk` |
| Budget exhausted | `budgetOk: false` |

## Shopping intelligence

`estimateShopping()` → needed ingredients, missing items, budget estimate, category groups, priority, optional purchases, avoid duplicates.

## Food waste

Prefer expiring produce · leftovers first · avoid duplicate purchases.

## Substitution

Deterministic chains, e.g. Paneer → Tofu → Egg → Soy → Curd.

## Developer API

```ts
import {
  getResources,
  evaluateResources,
  findAvailableMeals,
  findMissingIngredients,
  findExpiringItems,
  estimateShopping,
  estimateBudget,
  setResourceInventory,
  setResourceKitchen,
  setResourceBudget,
  setResourceCookingTime,
} from '@/engines/resources'

const evaluation = evaluateResources(profile, {
  foodId: 'food-masala-omelette',
  ingredients: ['Egg', 'Onion', 'Tomato'],
  estimatedPrepMinutes: 15,
  needsGas: true,
})
```

### Queries

`getAvailableIngredients` · `getExpiringFoods` · `getBudgetStatus` · `getKitchenCapabilities` · `getAvailableCookingTime`

## Performance

In-memory `ResourceIndex` maps by ingredient / location / freshness / category.  
No linear scan of the full catalog per recommendation — evaluate only the meal’s ingredient list.

## Persistence

Local Dexie preferences key `resourceProfile` (same pattern as Learning / Decision Memory). No schema redesign.

## Future integrations

Barcode · OCR bills · image recognition · smart fridge · IoT kitchen · grocery delivery (Blinkit / Zepto / BigBasket / Amazon) — as **providers** feeding this profile, not replacing it.

## Privacy

Fully local · no cloud · no AI.
