import type { ActivityLevel } from '@/config/constants'
import { db } from '@/database/db'
import { createId } from '@/shared/utils/id'
import type {
  FoodPreference,
  Gender,
  Goal,
  Profile,
  User,
} from '@/types/domain'

export interface OnboardingInput {
  age: number
  gender: Gender
  heightCm: number
  weightKg: number
  stateCode: string
  districtId: string
  foodPreference: FoodPreference
  goal: Goal
  activityLevel?: ActivityLevel
}

export type ProfileUpdateInput = OnboardingInput

export async function getPrimaryUser(): Promise<User | undefined> {
  const users = await db.users.toArray()
  if (users.length === 0) return undefined
  return users.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
}

export async function getProfileForUser(userId: string): Promise<Profile | undefined> {
  return db.profiles.where('userId').equals(userId).first()
}

export async function completeOnboarding(input: OnboardingInput): Promise<{
  user: User
  profile: Profile
}> {
  const now = new Date().toISOString()
  const existing = await getPrimaryUser()

  const user: User = existing
    ? { ...existing, onboardingComplete: true, updatedAt: now }
    : {
        id: createId('user'),
        createdAt: now,
        updatedAt: now,
        onboardingComplete: true,
      }

  const existingProfile = existing
    ? await getProfileForUser(existing.id)
    : undefined

  const profile = buildProfile(user.id, input, existingProfile, now)

  await db.transaction('rw', db.users, db.profiles, async () => {
    await db.users.put(user)
    await db.profiles.put(profile)
  })

  return { user, profile }
}

export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<Profile> {
  const existing = await getProfileForUser(userId)
  if (!existing) {
    throw new Error('Profile not found')
  }

  const profile = buildProfile(userId, input, existing, new Date().toISOString())
  await db.profiles.put(profile)
  return profile
}

function buildProfile(
  userId: string,
  input: OnboardingInput,
  existing: Profile | undefined,
  now: string,
): Profile {
  validateProfileInput(input)

  return {
    id: existing?.id ?? createId('profile'),
    userId,
    age: input.age,
    gender: input.gender,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    stateCode: input.stateCode,
    districtId: input.districtId,
    foodPreference: input.foodPreference,
    goal: input.goal,
    activityLevel: input.activityLevel ?? existing?.activityLevel ?? 'moderate',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export function validateProfileInput(input: OnboardingInput): void {
  if (!Number.isFinite(input.age) || input.age < 5 || input.age > 100) {
    throw new Error('Age must be between 5 and 100')
  }
  if (!Number.isFinite(input.heightCm) || input.heightCm < 100 || input.heightCm > 230) {
    throw new Error('Height must be between 100 and 230 cm')
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < 25 || input.weightKg > 250) {
    throw new Error('Weight must be between 25 and 250 kg')
  }
  if (!input.stateCode) throw new Error('State is required')
  if (!input.districtId) throw new Error('District is required')
}
