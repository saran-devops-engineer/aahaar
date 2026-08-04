import { RESOURCE_VERSION } from '@/engines/resources/constants'
import {
  createEmptyResourceProfile,
  freezeProfile,
} from '@/engines/resources/models/profile'
import { refreshInventoryFreshness } from '@/engines/resources/inventory'
import type {
  ResourceExportBundle,
  ResourceProfile,
  ResourceVersion,
} from '@/engines/resources/types'

export function exportResourceProfile(profile: ResourceProfile): ResourceExportBundle {
  return Object.freeze({
    format: 'aahaar.resources.profile',
    version: profile.version,
    exportedAt: new Date().toISOString(),
    profile,
  })
}

export function migrateResourceProfile(
  profile: ResourceProfile,
  now = new Date().toISOString(),
): ResourceProfile {
  const major = Number(String(profile.version).split('.')[0] ?? 0)
  const currentMajor = Number(RESOURCE_VERSION.split('.')[0])
  const inventory = refreshInventoryFreshness(profile.inventory ?? [], now)

  if (major !== currentMajor) {
    const empty = createEmptyResourceProfile(profile.userId, now)
    return freezeProfile({
      ...empty,
      inventory,
      leftovers: profile.leftovers ?? empty.leftovers,
      kitchen: profile.kitchen ?? empty.kitchen,
      budget: profile.budget ?? empty.budget,
      household: profile.household ?? empty.household,
      availableCookingTimeMinutes:
        profile.availableCookingTimeMinutes ?? empty.availableCookingTimeMinutes,
      market: profile.market ?? empty.market,
      version: RESOURCE_VERSION,
      updatedAt: now,
    })
  }

  return freezeProfile({
    ...profile,
    inventory,
    version: RESOURCE_VERSION as ResourceVersion,
    updatedAt: now,
  })
}

export function importResourceProfile(
  bundle: ResourceExportBundle,
  options?: { userId?: string; now?: string },
): ResourceProfile {
  if (bundle.format !== 'aahaar.resources.profile') {
    throw new Error('Invalid resource export format')
  }
  const migrated = migrateResourceProfile(bundle.profile, options?.now)
  if (options?.userId && migrated.userId !== options.userId) {
    return freezeProfile({ ...migrated, userId: options.userId })
  }
  return migrated
}

export function serializeResourceProfile(profile: ResourceProfile): string {
  return JSON.stringify(exportResourceProfile(profile))
}

export function deserializeResourceProfile(raw: string): ResourceProfile {
  return importResourceProfile(JSON.parse(raw) as ResourceExportBundle)
}
