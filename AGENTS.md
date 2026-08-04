# AAHAAR — Agent Handoff Document

> **Give this file to any coding agent (Cursor, Claude, ChatGPT, Codex, Gemini, etc.) before continuing work.**  
> It is the project source of truth for architecture, constraints, engines, wiring status, and how to extend safely.

**Last updated:** 2026-08-04  
**Product version focus:** V1 → V1.5 / V2 intelligence layers  
**Default branch:** `main`

---

## 1. What this product is

**AAHAAR** is an **offline-first Indian Progressive Web App** meal planner.

Core question the app answers:

> **What should I eat today?**

It plans meals for Indian users with:

- Regional cuisine awareness (state / district)
- Medical hard rules (diabetes, CKD, hypertension, pregnancy, etc.)
- Deterministic nutrition (BMI / BMR / TDEE / macros / water)
- Shopping lists, water tracking, onboarding, PWA install
- **No cloud required for core planning**
- **AI assists; rules decide** — AI must never invent nutrition values or override medical rules

Local path: `D:\cursor_projects\aahaar` (or clone of the GitHub remotes below).

---

## 2. Remotes (important)

This repo has **two** GitHub remotes. Keep them in sync when the user asks to push.

| Remote | URL |
|--------|-----|
| `origin` | https://github.com/saran-devops-engineer/aahaar.git |
| `aahaar-new` | https://github.com/saran-devops-engineer/aahaar-new.git |

If the user says “I don’t see the commit,” they may be looking at the other remote. Push to **both** unless told otherwise:

```bash
git push origin HEAD:main
git push aahaar-new HEAD:main
```

---

## 3. Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript |
| Bundler | Vite 7 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Client state | Zustand |
| Server/async state | TanStack Query |
| Local DB | Dexie (IndexedDB) |
| PWA | vite-plugin-pwa / Workbox |
| Unit tests | Vitest (+ fake-indexeddb) |
| E2E | Playwright |

Path alias: `@/*` → `src/*` (see `tsconfig.app.json`).

---

## 4. Commands

```bash
npm install
npm run dev          # Vite dev server
npm test             # Vitest unit + integration
npm run test:watch
npm run test:e2e     # Playwright
npm run build        # tsc -b && vite build
npm run lint
```

Always prefer running tests after engine changes: `npm test`.

---

## 5. Frozen architecture rules (DO NOT violate)

These rules were repeatedly enforced across V1.5 / V2 phases. Treat them as **non-negotiable** unless the user explicitly redesigns:

1. **Architecture is frozen** — do not redesign the overall system for convenience.
2. **Do not modify UI** unless the user explicitly asks for UI work.
3. **Do not modify meal generation / recommendation logic** unless the user explicitly asks.
4. **Do not add cloud services** for core intelligence layers.
5. **Do not add AI** that invents nutrition, medical advice, or explanation reasons.
6. **Medical rules are absolute** — learning / life context / confidence / resources never override them.
7. **Deterministic > probabilistic** for nutrition, rules, confidence, learning scores, explanations.
8. **Offline-first / privacy-first** — user data stays in IndexedDB / local preferences JSON.
9. **Prefer additive engines** under `src/engines/<name>/` with their own `README.md`, types, tests.
10. **No Dexie schema redesign** for new intelligence engines — persist via existing `preferences` table JSON keys (pattern used by Learning, Decision Memory, Resources).
11. **Decision Engine consumes `UserContext` only** — it must not fetch profile/preferences/storage itself.
12. **AI Adapter** may phrase / motivate later; never supply nutrient numbers as truth.

Principle:

```text
AI assists. Rules decide.
```

---

## 6. High-level architecture

### Runtime product path (what users get today)

```text
UI (features/*)
  → Services (mealPlanService, preferenceService, …)
      → Context Engine (buildUserContext)     ✅ WIRED
      → Decision Engine (decide)              ✅ WIRED
          → Knowledge filters (season/region/budget)
          → Rule Engine (medical / diet / allergen)
          → Recommendation ranking (+ optional learningAdjustments hook)
      → Dexie persistence (meals, plans, shopping, …)
```

### Intelligence layers (V1.5 / V2) — mostly built, not all wired into UI/decide

```text
Presentation
  → Decision Engine
  → Life Context Engine          ✅ built (optional signals)
  → Context Engine               ✅ wired into decide via mealPlanService
  → Adaptive Learning Engine     ✅ built (optional ranking hook exists)
  → Decision Memory Engine       ✅ built (record API ready)
  → Confidence Engine            ✅ built
  → Explainability Engine        ✅ built (reads Decision Memory)
  → Resource Intelligence Engine ✅ built (can this meal be prepared?)
  → Knowledge Graph Engine       ✅ built (catalog-derived graph)
  → Nutrition / Rules / Knowledge (classic) ✅ wired
```

**Critical wiring status for agents:**

| Engine | Path | Status |
|--------|------|--------|
| Nutrition | `src/engines/nutrition/` | Wired (targets) |
| Rules | `src/engines/rules/` | Wired into `decide` |
| Knowledge (catalog/filters) | `src/engines/knowledge/` | Wired |
| Recommendation | `src/engines/recommendation/` | Wired |
| Decision | `src/engines/decision/` | Wired — entry `decide(UserContext, foods)` |
| Context | `src/engines/context/` | Wired via `mealPlanService.generateDayPlan` |
| Knowledge Graph | `src/engines/knowledge/graph/` | Built; rebuild after catalog sync; **not required by decide** |
| Learning (ALE) | `src/engines/learning/` | Built; ranking accepts optional `learningAdjustments`; **decide does not pass it yet** |
| Decision Memory | `src/engines/decision-memory/` | Built; **not auto-recorded from mealPlanService yet** |
| Life Context | `src/engines/life-context/` | Built; **not fed into decide yet** |
| Confidence (NCE) | `src/engines/confidence/` | Built; **not shown in UI yet** |
| Explainability (XAI) | `src/engines/explainability/` | Built; **not shown in UI yet** |
| Resources (RIE) | `src/engines/resources/` | Built; **not gating recommendations yet** |
| AI Adapter | `src/ai/` | Local stub; Settings can disable |

When the user says “only implement Engine X / do not modify recommendations,” **add or extend that engine only** — do not secretly wire it into `decide` / UI unless asked.

---

## 7. Source tree map

```text
src/
  app/                 # providers, layout, zustand store
  ai/                  # local AI adapter (stub)
  config/              # constants, profile options
  database/            # Dexie db + schema
  engines/
    nutrition/         # BMI/BMR/TDEE, plate balance
    rules/             # medical hard/soft rules
    knowledge/         # foods/districts catalogs, filters, cuisineRegions
      graph/           # Knowledge Graph Engine
    recommendation/    # ranking, substitutions helpers
    decision/          # decide() orchestrator
    context/           # UserContext builder (Phase 1)
    learning/          # Adaptive Learning Engine (Phase 3)
    decision-memory/   # Decision Memory Engine (Phase 4)
    life-context/      # Life Context Engine (Phase 5)
    confidence/        # Nutrition Confidence Engine (Phase 6)
    explainability/    # Explainability Engine (Phase 7)
    resources/         # Resource Intelligence Engine (Phase 8)
  features/            # UI pages: home, onboarding, plan, meals, shop, settings, install
  hooks/
  lib/pwa/             # install prompt dismissal, etc.
  services/            # I/O orchestration (meal plans, prefs, shopping, profile, conditions)
  shared/              # components, utils (date, id)
  tests/integration/
  types/domain.ts      # shared domain contracts
```

Each newer engine typically has:

- `types/`, `constants/`, `api.ts` or `index.ts`, `README.md`, `*.test.ts`
- Pure core + thin persistence adapter (when needed)

---

## 8. Engine deep-dives (what each does)

### 8.1 Context Engine — `src/engines/context/`

- Pure `buildUserContext(input)` → immutable frozen `UserContext`
- Version: `CONTEXT_VERSION = 1.5.0`
- Extension slots (`weather`, `pantry`, `wearables`, …) currently `null`
- Decision must use selectors from context; never re-fetch storage
- Docs: `src/engines/context/README.md`

### 8.2 Knowledge Graph — `src/engines/knowledge/graph/`

- Built from food catalog (does **not** replace food tables)
- Similarity / replacement queries, region/cuisine/condition indexes
- Rebuild hooked after `syncKnowledgeBase` in catalog
- Docs: `src/engines/knowledge/graph/README.md`

### 8.3 Adaptive Learning Engine — `src/engines/learning/`

- Learns from behaviour events (accept/skip/like/dislike/swap/…)
- Updates affinities; **only changes recommendation priority**, never medical/nutrition rules
- Cold start = no affinity influence; diversity penalty can still apply
- Decay toward neutral; confidence low/medium/high caps adjustment size
- Persist key: preferences `learningProfile`
- Ranking hook: `RankOptions.learningAdjustments?: ReadonlyMap<string, number>`
- Docs: `src/engines/learning/README.md`

### 8.4 Decision Memory — `src/engines/decision-memory/`

- Stores **why** a recommendation happened (`DecisionRecord` + reason **codes**, not free text)
- Outcomes, rejected foods with codes, score breakdown, versions snapshot
- Retention + compression into stats; export/import versioned
- Persist key: preferences `decisionMemory`
- Future Explainability must **read** this — never recreate reasons
- Docs: `src/engines/decision-memory/README.md`

### 8.5 Life Context — `src/engines/life-context/`

- Represents **TODAY** via providers (date, season, festival, travel, pantry, weather placeholder, …)
- Graceful degradation: missing weather/pantry → continue
- Never overrides medical
- API: `getLifeContext(signals)`, `evaluateToday`, `evaluateTravel`, …
- Docs: `src/engines/life-context/README.md`

### 8.6 Confidence (NCE) — `src/engines/confidence/`

- Deterministic confidence 0–100 from weighted signals
- Weights: Medical > Nutrition > Learning > rest
- Missing pantry/allergies/weight lowers score
- Safety: `ask_user` / `review` / `auto_recommend`
- Docs: `src/engines/confidence/README.md`

### 8.7 Explainability (XAI) — `src/engines/explainability/`

- Transforms Decision Memory (+ optional learning/life/confidence) into `ExplanationObject`
- Evidence items + message keys for localization (`MessageRef`)
- Cards: quick / detailed / technical / doctor / developer
- **No AI-generated reasons** — unknown codes surface as recorded codes only
- Docs: `src/engines/explainability/README.md`

### 8.8 Resources (RIE) — `src/engines/resources/`

- Pantry/fridge/freezer inventory, kitchen equipment, budget, cooking time, leftovers
- `evaluateResources(profile, mealRequirement)` → possible? missing? equipment gaps? time/budget?
- Shopping estimate, substitutions (e.g. Paneer → Tofu → Egg → Soy → Curd)
- Persist key: preferences `resourceProfile`
- Docs: `src/engines/resources/README.md`

### 8.9 Classic engines still in use

- **Nutrition** — calculations + plate balance (`analyzePlateBalance`) for Why? explanations
- **Rules** — `filterFoodsByConstraints` verdicts allow/limit/block
- **Knowledge** — `FOOD_CATALOG`, districts (~655), `filterBySeason/Region/Budget`, `cuisineRegions.ts`
- **Recommendation** — `rankFoodsForMeal`, `pickFromTopRanked`
- **Decision** — orchestrates the above for a day plan

---

## 9. Product / domain rules agents must preserve

### Rice-belt cuisine

States in `RICE_BELT_STATES` (`src/engines/knowledge/cuisineRegions.ts`) such as AP, TS, TN, KA, KL must **not** get wheat/roti as default lunch/dinner. Andhra plans stay rice-based.

### Why? / plate balance

Meal explanations use plate compositions + gap analysis (carbs/protein/veg). Do not invent micronutrient claims.

### Variety

Plans use `varietySeed` / recent food exclusion so the week does not collapse to Idli / Curd Rice / Dal Rice every day.

### Medical conditions

Hard rules for diabetes (GI), CKD protein, hypertension sodium, pregnancy, thyroid, PCOS, children, elderly — see rule IDs in rules engine.

### Preferences

Stored in Dexie `preferences` with typed keys (`allergens`, `religious`, `budgetTier`, `pantry`, `waterReminders`, `aiMode`) plus engine JSON keys (`learningProfile`, `decisionMemory`, `resourceProfile`).

---

## 10. Data flow for a day plan (current)

File: `src/services/mealPlanService.ts` → `generateDayPlan`

1. Load foods from knowledge DB/catalog  
2. Load conditions + preferences + budget  
3. Collect recent week food IDs for variety exclusion  
4. `buildUserContext({ profile, date, conditions, preferences, … })`  
5. `decide(userContext, foods)`  
6. Persist `Meal` rows with explanation strings  
7. Return `{ plan, meals, decision }`

**Not yet in this path:** learning adjustments, life context, resource gating, decision-memory recording, confidence, explainability UI.

Likely future wiring (only when user asks):

```text
buildUserContext + getLifeContext
  → decide(+ learningAdjustments?)
  → evaluateResources (filter/score)
  → recordDecisionResult
  → calculateConfidence
  → buildExplanation
  → UI “Why?”
```

---

## 11. Storage (Dexie)

- DB name/version: see `src/config/constants.ts` (`DB_NAME`, `DB_VERSION`)
- Schema: `src/database/schema.ts` — users, profiles, conditions, foods, districts, meal_plans, meals, shopping_lists, feedback, preferences, rules, water_logs, …
- **Do not bump schema** for Learning / Decision Memory / Resources — they use `preferences` JSON blobs.

Preference JSON keys:

| Key | Engine |
|-----|--------|
| `learningProfile` | Learning |
| `decisionMemory` | Decision Memory |
| `resourceProfile` | Resources |

---

## 12. UI features (do not casually redesign)

| Feature folder | Purpose |
|----------------|---------|
| `features/onboarding` | First-run profile / region / medical |
| `features/home` | Today’s meals |
| `features/plan` | Week plan |
| `features/meals` | Meal assist / Why? |
| `features/shop` | Shopping list |
| `features/settings` | Profile, medical, preferences, install |
| `features/install` | PWA install welcome (Android BIP + iOS A2HS) |

---

## 13. Testing expectations

- Engine work must include Vitest coverage for core behaviours.
- Full suite should stay green: `npm test`
- Integration: `src/tests/integration/mealPlanning.integration.test.ts` (onboard → week plan → shopping)
- Do not break rice-belt / decide / catalog tests when adding engines.

Approximate suite size after Phase 8: **~115 tests / 23 files** (grows over time).

---

## 14. Coding conventions for agents

1. Match existing TypeScript style; prefer pure functions + frozen objects for engine outputs.
2. Use `@/` imports.
3. Keep engine public surface in `index.ts`; put docs in that engine’s `README.md`.
4. **Do not invent nutrition facts** or medical claims.
5. Prefer enums / reason codes over free-text in stored intelligence (Decision Memory pattern).
6. For localization-ready UX copy in XAI, use `MessageRef` (`key` + `defaultText` + params).
7. When user says “Stop after implementation,” do not start the next phase.
8. When user says “commit and push,” commit then push **both remotes** if both exist.
9. Windows shell is PowerShell — HEREDOC/`cat <<EOF` may not work; use PowerShell here-strings for commit messages.
10. Avoid drive-by refactors and unsolicited UI polish.

---

## 15. Phase history (already implemented)

| Phase | Name | Location |
|------:|------|----------|
| 1 | Context Engine | `src/engines/context/` |
| 2 | Knowledge Graph Engine | `src/engines/knowledge/graph/` |
| 3 | Adaptive Learning Engine | `src/engines/learning/` |
| 4 | Decision Memory Engine | `src/engines/decision-memory/` |
| 5 | Life Context Engine | `src/engines/life-context/` |
| 6 | Nutrition Confidence Engine | `src/engines/confidence/` |
| 7 | Explainability Engine | `src/engines/explainability/` |
| 8 | Resource Intelligence Engine | `src/engines/resources/` |

Earlier V1 work also includes: expanded food catalog, full districts, plate-balance Why?, PWA install UX, rice-belt cuisine fix.

---

## 16. Sensible next work (only if user asks)

These are **not** instructions to start now — backlog hints:

1. Wire Learning adjustments into `decide` / `mealPlanService` (cold-start safe).
2. Record Decision Memory after each `decide`.
3. Gate or score meals with Resource Intelligence before final pick.
4. Surface Confidence + Explainability in Why? UI (user must allow UI changes).
5. Feed Life Context into planning (cooking time, travel, festival).
6. Optional AI formatter for explanation wording only (never new reasons).

---

## 17. Quick “read this first” file list for a new agent

1. This file — `AGENTS.md`
2. Root `README.md`
3. `src/types/domain.ts`
4. `src/engines/decision/index.ts`
5. `src/services/mealPlanService.ts`
6. `src/engines/knowledge/cuisineRegions.ts`
7. Relevant engine `README.md` under `src/engines/<engine>/`
8. `src/database/schema.ts`

---

## 18. One-paragraph brief you can paste into any agent

```text
AAHAAR is an offline-first Indian PWA meal planner (React 19 + Vite + Tailwind + Dexie).
Architecture is frozen: Decision consumes UserContext only; medical rules absolute;
AI must not invent nutrition. Classic path: mealPlanService → buildUserContext → decide
→ knowledge/rules/recommendation. V1.5/V2 added local deterministic engines under
src/engines/: context, knowledge/graph, learning, decision-memory, life-context,
confidence, explainability, resources — most are built+tested but not all wired into
decide/UI yet. Do not redesign UI or meal generation unless asked. Persist new engine
state via preferences JSON, not schema redesign. Remotes: origin=aahaar and
aahaar-new; push both when asked. Read AGENTS.md and the engine README before editing.
```

---

## 19. Verification checklist for continuing agents

Before claiming done:

- [ ] Did not modify UI / onboarding / meal generation unless requested  
- [ ] Did not add cloud or generative AI as source of truth  
- [ ] Medical / nutrition rules still absolute  
- [ ] `npm test` passes  
- [ ] Engine has README + tests if new/changed  
- [ ] Preferential keys / versions documented if persistence added  
- [ ] Pushed to the remote(s) the user actually uses  

---

*End of handoff. Prefer updating this file when architecture wiring status changes.*
