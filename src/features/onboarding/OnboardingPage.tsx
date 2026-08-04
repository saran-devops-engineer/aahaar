import { useMemo, useState } from 'react'
import {
  ACTIVITY_OPTIONS,
  FOOD_PREFERENCE_OPTIONS,
  GOAL_OPTIONS,
} from '@/config/profileOptions'
import { APP_NAME, APP_TAGLINE } from '@/config/constants'
import { DISTRICT_RECORDS } from '@/engines/knowledge/data/districts'
import { REGION_RECORDS } from '@/engines/knowledge/data/regions'
import { Button } from '@/shared/components/Button'
import { Field, TextInput, TextSelect } from '@/shared/components/FormField'
import { completeOnboarding } from '@/services/profileService'
import type { ActivityLevel } from '@/config/constants'
import type { FoodPreference, Gender, Goal } from '@/types/domain'

interface OnboardingPageProps {
  onComplete: () => Promise<void>
}

type Step = 0 | 1 | 2

const STEPS = ['You', 'Place', 'Eat'] as const

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState<Step>(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [age, setAge] = useState(28)
  const [gender, setGender] = useState<Gender>('female')
  const [heightCm, setHeightCm] = useState(160)
  const [weightKg, setWeightKg] = useState(60)
  const [stateCode, setStateCode] = useState('MH')
  const [districtId, setDistrictId] = useState('mh-mumbai')
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('veg')
  const [goal, setGoal] = useState<Goal>('general_wellness')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate')

  const districts = useMemo(
    () => DISTRICT_RECORDS.filter((d) => d.stateCode === stateCode),
    [stateCode],
  )

  function onStateChange(next: string) {
    setStateCode(next)
    const first = DISTRICT_RECORDS.find((d) => d.stateCode === next)
    setDistrictId(first?.id ?? `${next.toLowerCase()}-default`)
  }

  function canContinue(): boolean {
    if (step === 0) {
      return age >= 5 && age <= 100 && heightCm >= 100 && weightKg >= 25
    }
    if (step === 1) {
      return Boolean(stateCode && districtId)
    }
    return Boolean(foodPreference && goal)
  }

  async function finish() {
    setBusy(true)
    setError(null)
    try {
      await completeOnboarding({
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
      await onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-hidden px-4 pb-8 pt-10 md:max-w-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(198,242,122,0.18),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(240,194,122,0.14),transparent_35%),linear-gradient(180deg,#0b1f17_0%,#122a20_55%,#0b1f17_100%)]"
      />

      <div className="animate-fade-up">
        <p className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-[var(--color-accent)] md:text-6xl">
          {APP_NAME}
        </p>
        <p className="mt-3 max-w-sm text-lg text-[var(--color-text-muted)]">{APP_TAGLINE}</p>
      </div>

      <ol className="mt-8 flex gap-2" aria-label="Onboarding progress">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? 'step' : undefined}
            className={`flex-1 rounded-full px-2 py-2 text-center text-xs font-semibold tracking-wide ${
              index === step
                ? 'bg-[var(--color-accent)] text-[#0b1f17]'
                : index < step
                  ? 'bg-[var(--color-surface)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      <div
        className="mt-6 animate-fade-up-delay space-y-4 rounded-[2rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-elevated)_92%,transparent)] p-5 backdrop-blur"
        data-testid="onboarding-panel"
        aria-live="polite"
      >
        {step === 0 ? (
          <>
            <p className="text-sm text-[var(--color-text-muted)]">
              Essentials only — medical details come later in Settings.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age">
                <TextInput
                  type="number"
                  min={5}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
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
                  required
                />
              </Field>
              <Field label="Weight (kg)">
                <TextInput
                  type="number"
                  min={25}
                  max={250}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  required
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-sm text-[var(--color-text-muted)]">
              Region shapes seasonal and local meal picks.
            </p>
            <Field label="State">
              <TextSelect
                value={stateCode}
                onChange={(e) => onStateChange(e.target.value)}
              >
                {REGION_RECORDS.map((region) => (
                  <option key={region.id} value={region.stateCode}>
                    {region.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label={`District (${districts.length})`}>
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
                  <option value={`${stateCode.toLowerCase()}-default`}>
                    Statewide default
                  </option>
                )}
              </TextSelect>
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-sm text-[var(--color-text-muted)]">
              How you eat — allergies and conditions can wait.
            </p>
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
              <TextSelect
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
              >
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
          </>
        ) : null}

        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

        <div className="flex gap-2 pt-1">
          {step > 0 ? (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setStep((step - 1) as Step)}
              disabled={busy}
            >
              Back
            </Button>
          ) : null}
          {step < 2 ? (
            <Button
              type="button"
              className="flex-1"
              data-testid="onboarding-continue"
              disabled={!canContinue()}
              onClick={() => setStep((step + 1) as Step)}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1"
              data-testid="onboarding-finish"
              disabled={busy || !canContinue()}
              loading={busy}
              onClick={() => void finish()}
            >
              {busy ? 'Saving…' : 'Start AAHAAR'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
