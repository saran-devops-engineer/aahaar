import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useUiStore } from '@/app/store/uiStore'
import { calculateNutritionTargets } from '@/engines/nutrition'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { DocumentTitle } from '@/shared/components/DocumentTitle'
import { PageHeader } from '@/shared/components/PageHeader'
import { getConditionIdsForUser } from '@/services/conditionService'
import { getPreferencesForUser, parsePreferenceList } from '@/services/preferenceService'
import type { Profile } from '@/types/domain'

interface SettingsPageProps {
  profile: Profile
}

const LINKS = [
  {
    to: '/settings/profile',
    title: 'Profile',
    subtitle: 'Age, body metrics, region, goal',
  },
  {
    to: '/settings/medical',
    title: 'Medical',
    subtitle: 'Conditions that shape hard rules',
  },
  {
    to: '/settings/preferences',
    title: 'Preferences',
    subtitle: 'Allergies, restrictions, budget',
  },
]

export function SettingsPage({ profile }: SettingsPageProps) {
  const { theme, toggleTheme } = useUiStore()

  const conditionsQuery = useQuery({
    queryKey: ['conditions', profile.userId],
    queryFn: () => getConditionIdsForUser(profile.userId),
  })

  const prefsQuery = useQuery({
    queryKey: ['preferences', profile.userId],
    queryFn: () => getPreferencesForUser(profile.userId),
  })

  const conditions = conditionsQuery.data ?? []
  const targets = calculateNutritionTargets(profile, conditions)
  const allergens = parsePreferenceList(prefsQuery.data?.allergens)

  return (
    <div>
      <DocumentTitle title="Settings" />
      <PageHeader
        title="Settings"
        subtitle="Profile first. Medical and preferences when you need them."
      />

      <div className="space-y-4">
        <Card>
          <nav aria-label="Settings sections">
            <ul className="divide-y divide-[var(--color-border)]">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex min-h-14 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span>
                      <span className="block font-semibold">{link.title}</span>
                      <span className="block text-sm text-[var(--color-text-muted)]">
                        {link.subtitle}
                      </span>
                    </span>
                    <span className="text-[var(--color-accent)]" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Active planning inputs</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--color-text-muted)]">Conditions</dt>
              <dd>{conditions.length ? conditions.join(', ') : 'None'}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Allergies</dt>
              <dd>{allergens.length ? allergens.join(', ') : 'None'}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Calories</dt>
              <dd>{targets.calories} kcal</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">BMI</dt>
              <dd>
                {targets.bmi} ({targets.bmiCategory})
              </dd>
            </div>
          </dl>
          {targets.adjustmentNotes.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-[var(--color-text-muted)]">
              {targets.adjustmentNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Appearance</h2>
          <Button variant="secondary" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </Button>
        </Card>
      </div>
    </div>
  )
}
