import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { DocumentTitle } from '@/shared/components/DocumentTitle'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageHeader } from '@/shared/components/PageHeader'
import { useLiveAnnouncer } from '@/shared/components/LiveAnnouncer'
import { getMealsForWeek } from '@/services/mealPlanService'
import {
  buildShoppingListFromWeek,
  clearCheckedShoppingItems,
  getShoppingListForWeek,
  groupShoppingItems,
  shoppingProgress,
  toggleShoppingItem,
} from '@/services/shoppingListService'
import { weekStartIso } from '@/shared/utils/date'
import type { Profile } from '@/types/domain'

interface ShopPageProps {
  profile: Profile
}

export function ShopPage({ profile }: ShopPageProps) {
  const queryClient = useQueryClient()
  const announce = useLiveAnnouncer((s) => s.announce)
  const weekStart = weekStartIso()

  const listQuery = useQuery({
    queryKey: ['shopping', profile.userId, weekStart],
    queryFn: () => getShoppingListForWeek(profile.userId, weekStart),
  })

  const mealsQuery = useQuery({
    queryKey: ['meals-week', profile.userId, weekStart],
    queryFn: () => getMealsForWeek(profile.userId, weekStart),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['shopping', profile.userId] })
  }

  const buildMutation = useMutation({
    mutationFn: () => buildShoppingListFromWeek(profile.userId, weekStart),
    onSuccess: async (list) => {
      await invalidate()
      announce(`Shopping list ready with ${list.items.length} items`)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      toggleShoppingItem(listId, itemId),
    onSuccess: invalidate,
  })

  const clearMutation = useMutation({
    mutationFn: (listId: string) => clearCheckedShoppingItems(listId),
    onSuccess: async () => {
      await invalidate()
      announce('Cleared checked shopping items')
    },
  })

  const list = listQuery.data
  const mealCount = mealsQuery.data?.length ?? 0
  const progress = list ? shoppingProgress(list) : null
  const groups = list ? groupShoppingItems(list.items) : []

  return (
    <div>
      <DocumentTitle title="Shop" />
      <PageHeader
        title="Shopping"
        subtitle={
          list
            ? `${progress?.checked}/${progress?.total} checked`
            : 'Built from your weekly meal plan'
        }
      />

      <div className="mb-4 flex gap-2">
        <Button
          className="flex-1"
          data-testid="build-shopping-list"
          onClick={() => buildMutation.mutate()}
          loading={buildMutation.isPending}
          disabled={mealCount === 0}
        >
          {buildMutation.isPending
            ? 'Building…'
            : list
              ? 'Refresh list'
              : 'Build from plan'}
        </Button>
        {list && progress && progress.checked > 0 ? (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => clearMutation.mutate(list.id)}
            loading={clearMutation.isPending}
          >
            Clear checked
          </Button>
        ) : null}
      </div>

      {mealCount === 0 ? (
        <EmptyState
          title="No plan to shop from"
          description="Generate a weekly plan first, then build your list."
          action={
            <Link
              to="/plan"
              className="inline-flex min-h-12 items-center rounded-2xl bg-[var(--color-accent)] px-5 font-semibold text-[#0b1f17]"
            >
              Open Plan
            </Link>
          }
        />
      ) : null}

      {buildMutation.isError ? (
        <p className="mb-3 text-sm text-[var(--color-danger)]" role="alert">
          {(buildMutation.error as Error).message}
        </p>
      ) : null}

      {list && progress ? (
        <>
          <div
            className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            aria-label="Shopping progress"
          >
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          {groups.length === 0 ? (
            <Card>
              <p className="text-[var(--color-text-muted)]">List is empty.</p>
            </Card>
          ) : (
            <div className="space-y-5" data-testid="shopping-groups">
              {groups.map((group) => (
                <section key={group.category} aria-labelledby={`shop-${group.category}`}>
                  <h2
                    id={`shop-${group.category}`}
                    className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                  >
                    {group.category}
                  </h2>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          aria-pressed={item.checked}
                          onClick={() =>
                            toggleMutation.mutate({ listId: list.id, itemId: item.id })
                          }
                          className={`flex w-full min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                            item.checked
                              ? 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-70'
                              : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]'
                          }`}
                        >
                          <span
                            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              item.checked
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[#0b1f17]'
                                : 'border-[var(--color-border)]'
                            }`}
                            aria-hidden
                          >
                            {item.checked ? '✓' : ''}
                          </span>
                          <span className="flex-1">
                            <span
                              className={`block font-semibold ${
                                item.checked ? 'line-through' : ''
                              }`}
                            >
                              {item.name}
                            </span>
                          </span>
                          <span className="text-sm text-[var(--color-text-muted)]">
                            {item.quantity} {item.unit}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
