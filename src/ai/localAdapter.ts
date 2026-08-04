import type { AiAdapter, AiSubstitutionRequest } from '@/ai/types'

/**
 * Offline local adapter — natural-language templates over engine facts.
 * Does not call a network model and never invents nutrition numbers.
 */
export const localAiAdapter: AiAdapter = {
  async explainRecommendation(request) {
    const lead = pick([
      `${request.foodName} earns a place at ${request.mealType}`,
      `Here's why ${request.foodName} works for ${request.mealType}`,
      `${request.foodName} is today's ${request.mealType} pick`,
    ])

    const composition =
      request.platePartSummaries.length > 0
        ? ` On the plate: ${request.platePartSummaries.join('; ')}.`
        : ''

    const balance = ` ${request.balanceVerdict}`

    const gaps =
      request.gapRecommendations.length > 0
        ? ` Missing pieces: ${request.gapRecommendations.join(' ')}`
        : ''

    const why =
      request.reasons.length > 0
        ? ` Also chosen because ${request.reasons.slice(0, 3).join(' · ').toLowerCase()}.`
        : ''

    const calories = ` ${Math.round(request.calories * request.servings)} kcal at ${request.servings}× serving.`
    const region = request.regionStateCode
      ? ` Tuned for ${request.regionStateCode} in ${request.season}.`
      : ''

    const conditions =
      request.conditions.length > 0
        ? ` Conditions considered: ${request.conditions.join(', ')}.`
        : ''

    const rules =
      request.ruleNotes.length > 0
        ? ` Rules note: ${request.ruleNotes[0]}.`
        : ''

    return `${lead}.${composition}${balance}${gaps}${why}${calories}${region}${conditions}${rules}`
  },

  async rankSubstitutions(request) {
    const ranked = [...request.candidates].sort((a, b) => {
      const aClose = Math.abs(a.calories - request.current.calories)
      const bClose = Math.abs(b.calories - request.current.calories)
      if (aClose !== bClose) return aClose - bClose
      return b.score - a.score
    })

    return ranked.slice(0, 5).map((candidate, index) => ({
      foodId: candidate.foodId,
      blurb: buildSwapBlurb(request, candidate, index),
    }))
  },

  async motivate(request) {
    const goalLine = motivationForGoal(request.goal)
    const waterLine =
      request.waterProgressPct < 40
        ? ' A glass of water now beats catching up later.'
        : request.waterProgressPct >= 100
          ? ' Hydration looks solid today.'
          : ' Keep sipping through the afternoon.'

    const planLine =
      request.plannedMealCount > 0
        ? ` You already have ${request.plannedMealCount} meal${request.plannedMealCount === 1 ? '' : 's'} lined up.`
        : ' Start with one planned meal — momentum follows.'

    const conditionLine =
      request.conditions.length > 0
        ? ` Your plan respects ${request.conditions.join(' & ')} rules.`
        : ''

    return `${goalLine}${planLine}${waterLine}${conditionLine}`
  },

  async preferVariety(request) {
    const recent = new Set(request.recentlyUsedFoodIds)
    const fresh = request.candidateFoodIds.filter((id) => !recent.has(id))
    const pool = fresh.length > 0 ? fresh : request.candidateFoodIds
    // Mild shuffle of the top candidates for variety without leaving the safe set.
    return rotate(pool, request.mealType.length + pool.length)
  },
}

function buildSwapBlurb(
  request: AiSubstitutionRequest,
  candidate: AiSubstitutionRequest['candidates'][number],
  index: number,
): string {
  const calorieDelta = Math.round(candidate.calories - request.current.calories)
  const calorieNote =
    Math.abs(calorieDelta) < 40
      ? 'similar energy'
      : calorieDelta < 0
        ? 'lighter'
        : 'a bit heartier'

  const reason = candidate.reasons[0] ?? 'rule-safe alternative'
  const opener = index === 0 ? 'Best swap' : 'Also good'
  return `${opener}: ${candidate.foodName} — ${calorieNote}, ${reason.toLowerCase()}.`
}

function motivationForGoal(goal: string): string {
  switch (goal) {
    case 'lose_weight':
      return 'Steady plates beat crash diets.'
    case 'gain_muscle':
      return 'Protein-aware meals compound quietly.'
    case 'manage_condition':
      return 'Rules keep you safe; consistency keeps you well.'
    case 'maintain':
      return 'Maintenance is a skill — today is practice.'
    default:
      return 'Eat for how you want to feel this evening.'
  }
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function rotate(ids: string[], seed: number): string[] {
  if (ids.length <= 1) return [...ids]
  const offset = Math.abs(seed) % ids.length
  return [...ids.slice(offset), ...ids.slice(0, offset)]
}
