import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { SubstitutionOption } from '@/ai/types'
import { getFoodById } from '@/engines/knowledge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  applyMealSubstitution,
  explainMeal,
  getMealSubstitutions,
} from '@/services/aiAssistService'
import type { Meal, Profile } from '@/types/domain'

interface MealAssistCardProps {
  meal: Meal
  profile: Profile
  compact?: boolean
}

export function MealAssistCard({ meal, profile, compact = false }: MealAssistCardProps) {
  const queryClient = useQueryClient()
  const [showWhy, setShowWhy] = useState(false)
  const [showSwaps, setShowSwaps] = useState(false)

  const foodQuery = useQuery({
    queryKey: ['food', meal.foodId],
    queryFn: () => getFoodById(meal.foodId),
  })

  const explainQuery = useQuery({
    queryKey: ['ai-explain', meal.id, meal.foodId],
    queryFn: () => explainMeal(profile, meal),
    enabled: showWhy,
  })

  const swapsQuery = useQuery({
    queryKey: ['ai-swaps', meal.id, meal.foodId],
    queryFn: () => getMealSubstitutions(profile, meal),
    enabled: showSwaps,
  })

  const swapMutation = useMutation({
    mutationFn: async (option: SubstitutionOption) => {
      const explanation = await explainMeal(profile, {
        ...meal,
        foodId: option.food.id,
        explanation: `${option.food.name}: ${option.reasons.join(' · ')}`,
      })
      return applyMealSubstitution(meal.id, option.food.id, explanation)
    },
    onSuccess: async () => {
      setShowSwaps(false)
      setShowWhy(false)
      await queryClient.invalidateQueries({ queryKey: ['meals', profile.userId] })
      await queryClient.invalidateQueries({ queryKey: ['meals-week', profile.userId] })
      await queryClient.invalidateQueries({ queryKey: ['food'] })
      await queryClient.invalidateQueries({ queryKey: ['ai-explain'] })
      await queryClient.invalidateQueries({ queryKey: ['shopping', profile.userId] })
    },
  })

  const name = foodQuery.data?.name ?? '…'
  const kcal = foodQuery.data
    ? Math.round(foodQuery.data.nutrition.calories * meal.servings)
    : null

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {meal.mealType}
          </p>
          <p className="mt-1 text-lg font-semibold">{name}</p>
          {!compact && meal.explanation ? (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{meal.explanation}</p>
          ) : null}
        </div>
        <div className="text-right text-sm text-[var(--color-accent)]">
          {kcal != null ? `${kcal} kcal` : ''}
          <div className="text-[var(--color-text-muted)]">{meal.servings}×</div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="min-h-10 flex-1 px-3 text-sm"
          onClick={() => {
            setShowWhy((value) => !value)
            setShowSwaps(false)
          }}
        >
          {showWhy ? 'Hide why' : 'Why?'}
        </Button>
        <Button
          variant="secondary"
          className="min-h-10 flex-1 px-3 text-sm"
          onClick={() => {
            setShowSwaps((value) => !value)
            setShowWhy(false)
          }}
        >
          {showSwaps ? 'Close swaps' : 'Swap'}
        </Button>
      </div>

      {showWhy ? (
        <div className="mt-3 rounded-2xl bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-text-muted)]">
          {explainQuery.isLoading
            ? 'Writing explanation…'
            : explainQuery.data ?? 'No explanation available.'}
          <p className="mt-2 text-xs opacity-80">
            AI phrases engine reasons — it never invents nutrition values.
          </p>
        </div>
      ) : null}

      {showSwaps ? (
        <div className="mt-3 space-y-2">
          {swapsQuery.isLoading ? (
            <p className="text-sm text-[var(--color-text-muted)]">Finding safe swaps…</p>
          ) : null}
          {(swapsQuery.data ?? []).length === 0 && !swapsQuery.isLoading ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No rule-safe substitutes in range right now.
            </p>
          ) : null}
          <ul className="space-y-2">
            {(swapsQuery.data ?? []).map((option) => (
              <li key={option.food.id}>
                <button
                  type="button"
                  disabled={swapMutation.isPending}
                  onClick={() => swapMutation.mutate(option)}
                  className="flex w-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-left transition hover:border-[var(--color-accent)]"
                >
                  <span className="font-semibold">{option.food.name}</span>
                  <span className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {option.blurb}
                  </span>
                  <span className="mt-1 text-xs text-[var(--color-accent)]">
                    {option.food.nutrition.calories} kcal · score {Math.round(option.score)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
