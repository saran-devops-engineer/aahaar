import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { calculateNutritionTargets } from '@/engines/nutrition'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { DocumentTitle } from '@/shared/components/DocumentTitle'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageHeader } from '@/shared/components/PageHeader'
import { MealSkeletonList } from '@/shared/components/Skeleton'
import { useLiveAnnouncer } from '@/shared/components/LiveAnnouncer'
import { MealAssistCard } from '@/features/meals/MealAssistCard'
import { getMotivation } from '@/services/aiAssistService'
import { getConditionIdsForUser } from '@/services/conditionService'
import { generateTodayPlan, getMealsForDate } from '@/services/mealPlanService'
import { getShoppingListForWeek, shoppingProgress } from '@/services/shoppingListService'
import {
  addWater,
  areWaterRemindersEnabled,
  getTodayWaterMl,
  getWaterHistory,
  nudgeWaterReminder,
  undoLastWater,
} from '@/services/waterService'
import { formatDayLabel, todayIsoDate, weekStartIso } from '@/shared/utils/date'
import type { Profile, User } from '@/types/domain'

interface HomePageProps {
  profile: Profile
  user: User
}

export function HomePage({ profile, user }: HomePageProps) {
  const queryClient = useQueryClient()
  const announce = useLiveAnnouncer((s) => s.announce)
  const date = todayIsoDate()
  const weekStart = weekStartIso()

  const conditionsQuery = useQuery({
    queryKey: ['conditions', user.id],
    queryFn: () => getConditionIdsForUser(user.id),
  })

  const conditions = conditionsQuery.data ?? []
  const targets = calculateNutritionTargets(profile, conditions)

  const mealsQuery = useQuery({
    queryKey: ['meals', user.id, date],
    queryFn: () => getMealsForDate(user.id, date),
  })

  const waterQuery = useQuery({
    queryKey: ['water', user.id, date],
    queryFn: () => getTodayWaterMl(user.id),
  })

  const historyQuery = useQuery({
    queryKey: ['water-history', user.id],
    queryFn: () => getWaterHistory(user.id, 7),
  })

  const shoppingQuery = useQuery({
    queryKey: ['shopping', user.id, weekStart],
    queryFn: () => getShoppingListForWeek(user.id, weekStart),
  })

  const remindersQuery = useQuery({
    queryKey: ['water-reminders', user.id],
    queryFn: () => areWaterRemindersEnabled(user.id),
  })

  const meals = mealsQuery.data ?? []
  const waterMl = waterQuery.data ?? 0
  const waterPct = Math.min(100, Math.round((waterMl / targets.waterMl) * 100))

  const motivationQuery = useQuery({
    queryKey: ['ai-motivation', user.id, meals.length, waterPct],
    queryFn: () => getMotivation(profile, meals.length, waterPct),
  })

  const generateMutation = useMutation({
    mutationFn: () => generateTodayPlan(profile),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['meals', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['meals-week', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['ai-motivation', user.id] })
      announce(`Planned ${result.meals.length} meals for today`)
    },
  })

  const waterMutation = useMutation({
    mutationFn: (amount: number) => addWater(user.id, amount),
    onSuccess: async (_log, amount) => {
      await queryClient.invalidateQueries({ queryKey: ['water', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['water-history', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['ai-motivation', user.id] })
      announce(`Added ${amount} milliliters of water`)
    },
  })

  const undoMutation = useMutation({
    mutationFn: () => undoLastWater(user.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['water', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['water-history', user.id] })
      await queryClient.invalidateQueries({ queryKey: ['ai-motivation', user.id] })
    },
  })

  const shopping = shoppingQuery.data
  const shopProgress = shopping ? shoppingProgress(shopping) : null
  const history = historyQuery.data ?? []
  const maxHistory = Math.max(targets.waterMl, ...history.map((h) => h.amountMl), 1)

  return (
    <div>
      <DocumentTitle title="Today" />
      <PageHeader
        title="Today"
        subtitle={`${targets.calories} kcal · ${targets.proteinG}g protein · ${targets.waterMl} ml water${
          conditions.length ? ` · ${conditions.length} condition${conditions.length > 1 ? 's' : ''}` : ''
        }`}
      />

      {motivationQuery.data ? (
        <Card className="mb-6 animate-fade-up">
          <p className="text-sm text-[var(--color-text-muted)]">Coach</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl leading-snug">
            {motivationQuery.data}
          </p>
        </Card>
      ) : null}

      <section className="animate-fade-up space-y-3" aria-labelledby="today-meals-heading">
        <div className="flex items-center justify-between">
          <h2 id="today-meals-heading" className="text-lg font-semibold">
            Meals
          </h2>
          <Button
            variant="secondary"
            className="min-h-10 px-4 text-sm"
            data-testid="plan-today"
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
          >
            {meals.length ? 'Refresh' : 'Plan today'}
          </Button>
        </div>

        {mealsQuery.isLoading ? (
          <MealSkeletonList />
        ) : meals.length === 0 ? (
          <EmptyState
            title="No meals yet"
            description="Generate today, or open Plan for the full week."
            action={
              <Button data-testid="plan-today-empty" onClick={() => generateMutation.mutate()}>
                Plan today
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {meals.map((meal, index) => (
              <li
                key={meal.id}
                className={`animate-fade-up stagger-${Math.min(index + 1, 4)}`}
              >
                <MealAssistCard meal={meal} profile={profile} compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 animate-fade-up-delay">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Water</h2>
          {remindersQuery.data && waterPct < 60 ? (
            <button
              type="button"
              className="text-xs text-[var(--color-accent)]"
              onClick={() => void nudgeWaterReminder(targets.waterMl, waterMl)}
            >
              Nudge me
            </button>
          ) : null}
        </div>
        <Card>
          <div className="mb-3 flex items-end justify-between">
            <p className="font-[family-name:var(--font-display)] text-3xl font-semibold">
              {waterMl}
              <span className="ml-1 text-base font-normal text-[var(--color-text-muted)]">
                / {targets.waterMl} ml
              </span>
            </p>
            <p className="text-sm text-[var(--color-accent)]">{waterPct}%</p>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${waterPct}%` }}
            />
          </div>
          <div className="mb-4 flex items-end gap-1.5" aria-label="Last 7 days">
            {history.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-12 w-full items-end rounded-md bg-[var(--color-surface)]">
                  <div
                    className="w-full rounded-md bg-[var(--color-accent)] transition-all"
                    style={{
                      height: `${Math.max(6, Math.round((day.amountMl / maxHistory) * 100))}%`,
                      opacity: day.date === date ? 1 : 0.55,
                    }}
                  />
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {formatDayLabel(day.date).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="min-h-11 flex-1 text-sm"
              onClick={() => waterMutation.mutate(250)}
            >
              +250 ml
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 flex-1 text-sm"
              onClick={() => waterMutation.mutate(500)}
            >
              +500 ml
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 px-3 text-sm"
              onClick={() => undoMutation.mutate()}
              disabled={waterMl === 0 || undoMutation.isPending}
            >
              Undo
            </Button>
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Shopping</h2>
        <Card>
          {shopProgress ? (
            <p className="text-[var(--color-text-muted)]">
              <Link className="font-semibold text-[var(--color-accent)]" to="/shop">
                {shopProgress.checked}/{shopProgress.total} items
              </Link>{' '}
              checked on this week’s list.
            </p>
          ) : (
            <p className="text-[var(--color-text-muted)]">
              Plan the week, then{' '}
              <Link className="text-[var(--color-accent)]" to="/shop">
                build your shopping list
              </Link>
              .
            </p>
          )}
        </Card>
      </section>
    </div>
  )
}
