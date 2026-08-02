# AAHAAR

Offline-first Progressive Web App — **AI Nutrition Intelligence for India**.

> What should I eat today?

## Stack

React · TypeScript · Vite · Tailwind · Dexie (IndexedDB) · TanStack Query · React Router · Zustand · vite-plugin-pwa / Workbox

## Architecture

```
Presentation → Application → Decision Engine → Nutrition / Recommendation / Rules
→ Knowledge Base → Storage → AI Adapter
```

- **Nutrition Engine** — deterministic BMI/BMR/TDEE/macros/water
- **Rule Engine** — medical hard rules override AI
- **Decision Engine** — single entry point for recommendations
- **AI Adapter** — stub only (variety/explanations later); never invents nutrition values

## Develop

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

## Phases

1. Foundation
2. Knowledge Base + engines depth
3. Onboarding / medical profile
4. Meal planning / shopping / water polish
5. AI substitutions & explanations
6. Polish, a11y, performance, E2E (current)

### AI rules
- AI only phrases explanations, ranks safe swaps, and motivates
- Nutrition values and hard rules stay deterministic
- Default adapter is offline `local`; set Off in Settings → Preferences

### Test
```bash
npm test          # unit + integration (includes IndexedDB meal/shopping flow)
npm run test:e2e  # Playwright via system Chrome: onboarding → week plan → shop
```
