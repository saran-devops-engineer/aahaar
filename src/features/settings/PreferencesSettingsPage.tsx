import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AiMode } from '@/ai/types'
import {
  ALLERGEN_OPTIONS,
  BUDGET_OPTIONS,
  PREFERENCE_KEYS,
  RELIGIOUS_OPTIONS,
} from '@/config/profileOptions'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ChipGroup } from '@/shared/components/ChipGroup'
import { Field, TextSelect } from '@/shared/components/FormField'
import { PageHeader } from '@/shared/components/PageHeader'
import { saveAiMode } from '@/services/aiAssistService'
import {
  getPreferencesForUser,
  parsePreferenceList,
  savePlanningPreferences,
} from '@/services/preferenceService'
import {
  requestWaterReminderPermission,
  setWaterReminders,
} from '@/services/waterService'
import type { CostTier, Profile } from '@/types/domain'

interface PreferencesSettingsPageProps {
  profile: Profile
}

export function PreferencesSettingsPage({ profile }: PreferencesSettingsPageProps) {
  const queryClient = useQueryClient()
  const [allergens, setAllergens] = useState<string[]>([])
  const [religious, setReligious] = useState<string[]>([])
  const [budgetTier, setBudgetTier] = useState<CostTier>(3)
  const [waterReminders, setWaterRemindersOn] = useState(false)
  const [aiMode, setAiModeState] = useState<AiMode>('local')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const prefsQuery = useQuery({
    queryKey: ['preferences', profile.userId],
    queryFn: () => getPreferencesForUser(profile.userId),
  })

  useEffect(() => {
    if (!prefsQuery.data) return
    setAllergens(parsePreferenceList(prefsQuery.data.allergens))
    setReligious(parsePreferenceList(prefsQuery.data.religious))
    const tier = Number(prefsQuery.data.budgetTier)
    if (tier >= 1 && tier <= 5) setBudgetTier(tier as CostTier)
    setWaterRemindersOn(prefsQuery.data[PREFERENCE_KEYS.waterReminders] === 'on')
    setAiModeState(prefsQuery.data[PREFERENCE_KEYS.aiMode] === 'off' ? 'off' : 'local')
  }, [prefsQuery.data])

  async function handleSave() {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      if (waterReminders) {
        const permission = await requestWaterReminderPermission()
        if (permission === 'denied') {
          throw new Error('Notification permission denied — reminders stay off')
        }
      }
      await savePlanningPreferences(profile.userId, {
        allergens,
        religious,
        budgetTier,
      })
      await setWaterReminders(profile.userId, waterReminders)
      await saveAiMode(profile.userId, aiMode)
      await queryClient.invalidateQueries({ queryKey: ['preferences', profile.userId] })
      await queryClient.invalidateQueries({ queryKey: ['water-reminders', profile.userId] })
      await queryClient.invalidateQueries({ queryKey: ['ai-motivation'] })
      await queryClient.invalidateQueries({ queryKey: ['ai-explain'] })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save preferences')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-4">
        <Link to="/settings" className="text-sm text-[var(--color-accent)]">
          ← Settings
        </Link>
      </p>
      <PageHeader
        title="Preferences"
        subtitle="Allergies and restrictions are hard blocks in the Rule Engine."
      />

      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Allergies</h2>
          <ChipGroup
            options={[...ALLERGEN_OPTIONS]}
            selected={allergens}
            onChange={setAllergens}
          />
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Dietary restrictions</h2>
          <ChipGroup
            options={[...RELIGIOUS_OPTIONS]}
            selected={religious}
            onChange={setReligious}
          />
        </Card>

        <Card>
          <Field label="Budget tier">
            <TextSelect
              value={budgetTier}
              onChange={(e) => setBudgetTier(Number(e.target.value) as CostTier)}
            >
              {BUDGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextSelect>
          </Field>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">AI assist</h2>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">
            Explains meals and ranks safe swaps. Never invents calories or bypasses rules.
          </p>
          <Field label="Mode">
            <TextSelect
              value={aiMode}
              onChange={(e) => setAiModeState(e.target.value as AiMode)}
            >
              <option value="local">Local (offline phrasing)</option>
              <option value="off">Off (terse engine text)</option>
            </TextSelect>
          </Field>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">Water reminders</h2>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">
            Browser notification nudge while AAHAAR is open. Full schedules come later.
          </p>
          <button
            type="button"
            aria-pressed={waterReminders}
            onClick={() => setWaterRemindersOn((value) => !value)}
            className={`flex w-full min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left ${
              waterReminders
                ? 'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg)]'
            }`}
          >
            <span className="font-semibold">
              {waterReminders ? 'Reminders on' : 'Reminders off'}
            </span>
            <span className="text-[var(--color-accent)]">{waterReminders ? 'On' : 'Off'}</span>
          </button>
        </Card>

        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        {saved ? (
          <p className="text-sm text-[var(--color-accent)]">
            Preferences saved. Refresh Today’s plan to apply food filters.
          </p>
        ) : null}

        <Button className="w-full" disabled={busy} onClick={() => void handleSave()}>
          {busy ? 'Saving…' : 'Save preferences'}
        </Button>
      </div>
    </div>
  )
}
