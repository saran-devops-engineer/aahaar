import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ACTIVITY_OPTIONS,
  FOOD_PREFERENCE_OPTIONS,
  GOAL_OPTIONS,
} from '@/config/profileOptions'
import type { ActivityLevel } from '@/config/constants'
import { DISTRICT_RECORDS } from '@/engines/knowledge/data/districts'
import { REGION_RECORDS } from '@/engines/knowledge/data/regions'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Field, TextInput, TextSelect } from '@/shared/components/FormField'
import { PageHeader } from '@/shared/components/PageHeader'
import { updateProfile } from '@/services/profileService'
import type { FoodPreference, Gender, Goal, Profile } from '@/types/domain'

interface ProfileSettingsPageProps {
  profile: Profile
  onSaved: () => Promise<void>
}

export function ProfileSettingsPage({ profile, onSaved }: ProfileSettingsPageProps) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [age, setAge] = useState(profile.age)
  const [gender, setGender] = useState<Gender>(profile.gender)
  const [heightCm, setHeightCm] = useState(profile.heightCm)
  const [weightKg, setWeightKg] = useState(profile.weightKg)
  const [stateCode, setStateCode] = useState(profile.stateCode)
  const [districtId, setDistrictId] = useState(profile.districtId)
  const [foodPreference, setFoodPreference] = useState<FoodPreference>(
    profile.foodPreference,
  )
  const [goal, setGoal] = useState<Goal>(profile.goal)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile.activityLevel,
  )

  const districts = useMemo(
    () => DISTRICT_RECORDS.filter((d) => d.stateCode === stateCode),
    [stateCode],
  )

  function onStateChange(next: string) {
    setStateCode(next)
    const first = DISTRICT_RECORDS.find((d) => d.stateCode === next)
    setDistrictId(first?.id ?? `${next.toLowerCase()}-default`)
  }

  async function handleSave() {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await updateProfile(profile.userId, {
        age,
        gender,
        heightCm,
        weightKg,
        stateCode,
        districtId,
        foodPreference,
        goal,
        activityLevel,
      })
      await onSaved()
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile')
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
      <PageHeader title="Profile" subtitle="Update the basics used by nutrition targets." />

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <TextInput
              type="number"
              min={5}
              max={100}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </Field>
          <Field label="Gender">
            <TextSelect
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </TextSelect>
          </Field>
          <Field label="Height (cm)">
            <TextInput
              type="number"
              min={100}
              max={230}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
            />
          </Field>
          <Field label="Weight (kg)">
            <TextInput
              type="number"
              min={25}
              max={250}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="State">
          <TextSelect value={stateCode} onChange={(e) => onStateChange(e.target.value)}>
            {REGION_RECORDS.map((region) => (
              <option key={region.id} value={region.stateCode}>
                {region.name}
              </option>
            ))}
          </TextSelect>
        </Field>

        <Field label="District">
          <TextSelect
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
          >
            {districts.length > 0 ? (
              districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))
            ) : (
              <option value={districtId}>Current district</option>
            )}
          </TextSelect>
        </Field>

        <Field label="Food preference">
          <TextSelect
            value={foodPreference}
            onChange={(e) => setFoodPreference(e.target.value as FoodPreference)}
          >
            {FOOD_PREFERENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextSelect>
        </Field>

        <Field label="Goal">
          <TextSelect value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
            {GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextSelect>
        </Field>

        <Field label="Activity level">
          <TextSelect
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
          >
            {ACTIVITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextSelect>
        </Field>

        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        {saved ? (
          <p className="text-sm text-[var(--color-accent)]">Profile saved.</p>
        ) : null}

        <div className="flex gap-2">
          <Button className="flex-1" disabled={busy} onClick={() => void handleSave()}>
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/settings')}
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  )
}
