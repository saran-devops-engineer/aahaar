# Knowledge Graph Engine

## Why a graph (instead of SQL / array scans)?

AAHAAR already stores foods in Dexie/catalog tables. The Knowledge Graph does **not** replace that database.

It adds an **intelligence layer** of entities + relationships so Decision / Recommendation can ask:

- similar breakfasts
- high-protein Andhra meals
- diabetic-safe options
- replacements for paneer
- foods available in Nellore
- meals using rice / high iron / high-fiber snacks

…via **indexed lookups**, not repeated full-catalog scans.

```
Food Database (unchanged)
        ↓
Knowledge Graph (in-memory, regenerated from catalog)
        ↓
Decision / Recommendation (consume public API)
```

## Node types

Food, Ingredient, Meal, Cuisine, State, District, Season, MedicalCondition, Goal, Nutrient, BudgetTier, MealType, DietType, Allergen, CookingMethod  

Future placeholders (types reserved): Festival, Weather, PantryItem

## Edge types

`FOOD_BELONGS_TO_CUISINE`, `FOOD_AVAILABLE_IN_STATE`, `FOOD_AVAILABLE_IN_DISTRICT`, `FOOD_BEST_IN_SEASON`, `FOOD_CONTAINS_NUTRIENT`, `FOOD_AVOIDS_CONDITION`, `FOOD_RECOMMENDED_FOR_CONDITION`, `FOOD_SIMILAR_TO`, `FOOD_CAN_REPLACE`, `FOOD_PAIRS_WITH`, `FOOD_PART_OF_MEAL`, `FOOD_REQUIRES_INGREDIENT`, `FOOD_HIGH_IN`, `FOOD_LOW_IN`, `FOOD_COST_TIER`, `FOOD_MEAL_TYPE`, `FOOD_DIET_TYPE`, `FOOD_ALLERGEN`, `FOOD_PREPARATION`

## Builder

`buildKnowledgeGraph(foods)` reads the existing catalog and creates nodes/edges automatically.

`getKnowledgeGraph()` caches in memory and rebuilds when the catalog fingerprint changes.

`rebuildKnowledgeGraph()` forces regeneration (called after knowledge catalog sync).

No manual edge maintenance. Adding a food to the catalog regenerates its edges on next build.

## Similarity & replacement

Both are **deterministic** (no AI):

- **Similarity** — cuisine, meal type, nutrition proximity, medical suitability, cost, prep time, season, region, preparation, protein family
- **Replacement** — protein/calorie continuity, medical compatibility, budget, cuisine, region, diet direction

Top-K lists are precomputed into `similarTo` / `canReplace` maps for O(1) reads.

## Developer API

```ts
import {
  getKnowledgeGraph,
  findSimilarFoods,
  findReplacementFoods,
  findFoodsByRegion,
  findFoodsByCondition,
  findFoodsByGoal,
  findFoodsBySeason,
  findFoodsByBudget,
  findFoodsByMealType,
  findFoodsByCuisine,
  findHighProteinFoods,
  findLowGISnacks,
  findFoodsByIngredient,
  findFoodsHighInNutrient,
} from '@/engines/knowledge/graph'

findSimilarFoods('food-curd-rice', { limit: 5 })
findReplacementFoods('food-palak-paneer', { maxCostTier: 2 })
findFoodsByRegion('AP', { districtId: 'ap-sri-potti-sriramulu-nellore', mealType: 'lunch' })
findFoodsByCondition('diabetes', { mealType: 'breakfast' })
findHighProteinFoods({ stateCode: 'AP', maxCostTier: 2 })
findLowGISnacks()
findFoodsByIngredient('Rice', { mealType: 'lunch' })
findFoodsHighInNutrient('ironMg')
```

Decision-facing helper (optional adoption):

```ts
import { graphCandidatesForMeal } from '@/engines/knowledge/graph/adapters/forDecision'
```

## Extension guide

| Future signal | How to plug in |
|---|---|
| Weather | Add `Weather` nodes + edges like `FOOD_BEST_IN_WEATHER` in builder; keep public query wrappers |
| Pantry | Add `PantryItem` nodes linked with `FOOD_REQUIRES_INGREDIENT` / availability edges |
| Festival | Add `Festival` nodes + `FOOD_FESTIVAL_SAFE` edges |
| Lab / biomarkers | Add biomarker nodes; connect foods via suitability edges |

Do **not** reshape the food table. Connect new node types to existing `Food:` nodes by id.

## Folder layout

```
graph/
  types/
  constants/
  nodes/
  edges/
  builders/
  ranking/
  queries/
  adapters/
  README.md
```

Internals stay private; import only from `@/engines/knowledge/graph`.
