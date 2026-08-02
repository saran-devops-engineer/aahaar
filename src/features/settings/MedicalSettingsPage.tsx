import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MEDICAL_CONDITION_OPTIONS } from '@/config/profileOptions'
import { calculateNutritionTargets } from '@/engines/nutrition'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ChipGroup } from '@/shared/components/ChipGroup'
import { PageHeader } from '@/shared/components/PageHeader'
import {
  getConditionIdsForUser,
  setConditionsForUser,
} from '@/services/conditionService'
import type { MedicalConditionId, Profile } from '@/types/domain'

interface MedicalSettingsPageProps {
  profile: Profile
}

export function MedicalSettingsPage({ profile }: MedicalSettingsPageProps) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<MedicalConditionId[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const conditionsQuery = useQuery({
    queryKey: ['conditions', profile.userId],
    queryFn: () => getConditionIdsForUser(profile.userId),
  })

  useEffect(() => {
    if (conditionsQuery.data) {
      setSelected(conditionsQuery.data)
    }
  }, [conditionsQuery.data])

  const preview = calculateNutritionTargets(profile, selected)

  async function handleSave() {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await setConditionsForUser(profile.userId, selected)
      await queryClient.invalidateQueries({ queryKey: ['conditions', profile.userId] })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save conditions')
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
        title="Medical"
        subtitle="Hard rules override AI. This is planning support, not medical advice."
      />

      <Card className="mb-4">
        <ChipGroup
          options={MEDICAL_CONDITION_OPTIONS}
          selected={selected}
          onChange={(next) => setSelected(next as MedicalConditionId[])}
        />
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-lg font-semibold">Target preview</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {preview.calories} kcal · {preview.proteinG}g protein · sodium cap{' '}
          {preview.sodiumMgMax} mg
        </p>
        {preview.adjustmentNotes.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-muted)]">
            {preview.adjustmentNotes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            No condition adjustments yet.
          </p>
        )}
      </Card>

      {error ? <p className="mb-3 text-sm text-[var(--color-danger)]">{error}</p> : null}
      {saved ? (
        <p className="mb-3 text-sm text-[var(--color-accent)]">
          Medical profile saved. Refresh Today’s plan to apply.
        </p>
      ) : null}

      <Button className="w-full" disabled={busy} onClick={() => void handleSave()}>
        {busy ? 'Saving…' : 'Save medical profile'}
      </Button>
    </div>
  )
}
