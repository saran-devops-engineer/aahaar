import type { ContextBuildInput, ContextVersion, UserContext } from '@/engines/context/types'
import { CONTEXT_VERSION } from '@/engines/context/constants'

export class ContextValidationError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ContextValidationError'
    this.code = code
  }
}

export function validateBuildInput(input: ContextBuildInput): void {
  if (!input.profile) {
    throw new ContextValidationError('MISSING_PROFILE', 'Profile is required to build UserContext')
  }
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new ContextValidationError('INVALID_DATE', 'date must be YYYY-MM-DD')
  }

  const { profile } = input
  if (!profile.userId) {
    throw new ContextValidationError('MISSING_USER', 'profile.userId is required')
  }
  if (!Number.isFinite(profile.age) || profile.age < 1 || profile.age > 120) {
    throw new ContextValidationError('INVALID_AGE', 'profile.age must be between 1 and 120')
  }
  if (!Number.isFinite(profile.heightCm) || profile.heightCm < 50 || profile.heightCm > 250) {
    throw new ContextValidationError('INVALID_HEIGHT', 'profile.heightCm is out of range')
  }
  if (!Number.isFinite(profile.weightKg) || profile.weightKg < 10 || profile.weightKg > 400) {
    throw new ContextValidationError('INVALID_WEIGHT', 'profile.weightKg is out of range')
  }
  if (!profile.stateCode) {
    throw new ContextValidationError('MISSING_STATE', 'profile.stateCode is required')
  }
  if (!profile.districtId) {
    throw new ContextValidationError('MISSING_DISTRICT', 'profile.districtId is required')
  }
}

export function validateUserContext(context: UserContext): void {
  if (!context.version) {
    throw new ContextValidationError('MISSING_VERSION', 'UserContext.version is required')
  }
  if (!context.nutritionTargets || context.nutritionTargets.calories <= 0) {
    throw new ContextValidationError(
      'INVALID_TARGETS',
      'UserContext.nutritionTargets must include positive calories',
    )
  }
  if (!context.region.stateCode || !context.region.districtId) {
    throw new ContextValidationError('INVALID_REGION', 'region.stateCode and districtId are required')
  }
  if (context.state !== context.region.stateCode || context.district !== context.region.districtId) {
    throw new ContextValidationError(
      'REGION_MISMATCH',
      'state/district aliases must match region fields',
    )
  }
  if (context.waterGoal !== context.water.goalMl) {
    throw new ContextValidationError(
      'WATER_GOAL_MISMATCH',
      'waterGoal must equal water.goalMl',
    )
  }
}

/** Returns true when an incoming version can be accepted by this builder generation. */
export function isCompatibleContextVersion(version: ContextVersion | undefined): boolean {
  if (!version) return true
  const [major] = version.split('.').map(Number)
  const [currentMajor] = CONTEXT_VERSION.split('.').map(Number)
  return major === currentMajor
}

export function assertCompatibleVersion(version: ContextVersion | undefined): void {
  if (!isCompatibleContextVersion(version)) {
    throw new ContextValidationError(
      'INCOMPATIBLE_VERSION',
      `Context version ${version} is incompatible with engine ${CONTEXT_VERSION}`,
    )
  }
}
