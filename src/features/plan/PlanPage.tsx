import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { DocumentTitle } from '@/shared/components/DocumentTitle'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageHeader } from '@/shared/components/PageHeader'
import { MealSkeletonList } from '@/shared/components/Skeleton'
import { useLiveAnnouncer } from '@/shared/components/LiveAnnouncer'
import { MealAssistCard } from '@/features/meals/MealAssistCard'
import {
  generateDayPlan,
  generateWeekPlan,
  getMealsForDate,
  getMealsForWeek,
  groupMealsByDate,
} from '@/services/mealPlanService'
import {
  formatDayLabel,
  formatDayMonth,
  todayIsoDate,
  weekDates,
  weekStartIso,
} from '@/shared/utils/date'
import type { Profile } from '@/types/domain'

interface PlanPageProps {
  profile: Profile
}

export function PlanPage({ profile }: PlanPageProps) {
  const queryClient = useQueryClient()
  const announce = useLiveAnnouncer((s) => s.announce)
  const weekStart = weekStartIso()
  const dates = useMemo(() => weekDates(), [])
  const [selectedDate, setSelectedDate] = useState(todayIsoDate())

  const dayMealsQuery = useQuery({
    queryKey: ['meals', profile.userId, selectedDate],
    queryFn: () => getMealsForDate(profile.userId, selectedDate),
  })

  const weekMealsQuery = useQuery({
    queryKey: ['meals-week', profile.userId, weekStart],
    queryFn: () => getMealsForWeek(profile.userId, weekStart),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['meals', profile.userId] })
    await queryClient.invalidateQueries({ queryKey: ['meals-week', profile.userId] })
    await queryClient.invalidateQueries({ queryKey: ['shopping', profile.userId] })
    await queryClient.invalidateQueries({ queryKey: ['ai-explain'] })
    await queryClient.invalidateQueries({ queryKey: ['ai-swaps'] })
  }

  const dayMutation = useMutation({
    mutationFn: () => generateDayPlan(profile, selectedDate),
    onSuccess: async (result) => {
      await invalidate()
      announce(`Regenerated ${result.meals.length} meals for selected day`)
    },
  })

  const weekMutation = useMutation({
    mutationFn: () => generateWeekPlan(profile, weekStart),
    onSuccess: async (result) => {
      await invalidate()
      announce(`Generated weekly plan with ${result.meals.length} meals`)
    },
  })

  const meals = dayMealsQuery.data ?? []
  const weekGrouped = groupMealsByDate(weekMealsQuery.data ?? [])
  const plannedDays = dates.filter((d) => (weekGrouped[d]?.length ?? 0) > 0).length

  return (
    <div>
      <DocumentTitle title="Plan" />
      <PageHeader
        title="Weekly planner"
        subtitle={`${plannedDays}/7 days planned · week of ${formatDayMonth(weekStart)}`}
      />

      <div className="mb-4 flex gap-2">
        <Button
          className="flex-1"
          data-testid="generate-week"
          onClick={() => weekMutation.mutate()}
          loading={weekMutation.isPending}
          disabled={dayMutation.isPending}
        >
          {weekMutation.isPending ? 'Planning week…' : 'Generate week'}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          data-testid="regenerate-day"
          onClick={() => dayMutation.mutate()}
          loading={dayMutation.isPending}
          disabled={weekMutation.isPending}
        >
          {dayMutation.isPending ? 'Planning…' : 'Regenerate day'}
        </Button>
      </div>

      <div
        className="mb-5 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Week days"
      >
        {dates.map((date) => {
          const active = date === selectedDate
          const count = weekGrouped[date]?.length ?? 0
          return (
            <button
              key={date}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDate(date)}
              className={`min-w-[4.25rem] rounded-2xl border px-2 py-2 text-center transition ${
                active
                  ? 'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]'
              }`}
            >
              <span className="block text-xs text-[var(--color-text-muted)]">
                {formatDayLabel(date)}
              </span>
              <span className="block text-sm font-semibold">
                {formatDayMonth(date).split(' ')[0]}
              </span>
              <span className="mt-1 block text-[10px] text-[var(--color-accent)]">
                {count ? `${count} meals` : '—'}
              </span>
            </button>
          )
        })}
      </div>

      <h2 className="mb-3 text-lg font-semibold">
        {formatDayLabel(selectedDate)} · {formatDayMonth(selectedDate)}
      </h2>

      {dayMealsQuery.isLoading ? (
        <MealSkeletonList />
      ) : meals.length === 0 ? (
        <EmptyState
          title="Day is empty"
          description="Generate this day or the full week to fill meals."
          action={
            <Button data-testid="generate-week-empty" onClick={() => weekMutation.mutate()}>
              Generate week
            </Button>
          }
        />
      ) : (
        <ol className="space-y-3" data-testid="day-meals">
          {meals.map((meal, index) => (
            <li key={meal.id} className={`animate-fade-up stagger-${Math.min(index + 1, 4)}`}>
              <MealAssistCard meal={meal} profile={profile} />
            </li>
          ))}
        </ol>
      )}

      <Card className="mt-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          Swap uses rule-safe alternatives only. When the week looks good, build your list in{' '}
          <Link to="/shop" className="text-[var(--color-accent)]">
            Shop
          </Link>
          .
        </p>
      </Card>
    </div>
  )
}
