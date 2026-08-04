import { LIFE_CONTEXT_VERSION } from '@/engines/life-context/constants'
import { createEmptyLifeContext } from '@/engines/life-context/models/empty'
import { DEFAULT_LIFE_CONTEXT_PROVIDERS } from '@/engines/life-context/providers'
import type {
  LifeContext,
  LifeContextProvider,
  LifeContextSignals,
} from '@/engines/life-context/types'

/**
 * Assemble immutable LifeContext from providers.
 * Missing provider data → graceful degradation (null / unknown). Never throws.
 */
export function buildLifeContext(
  signals: LifeContextSignals = {},
  providers: readonly LifeContextProvider[] = DEFAULT_LIFE_CONTEXT_PROVIDERS,
): LifeContext {
  const base = createEmptyLifeContext(
    typeof signals.now === 'string'
      ? new Date(signals.now)
      : signals.now instanceof Date
        ? signals.now
        : signals.date
          ? new Date(`${signals.date}T12:00:00`)
          : new Date(),
  )

  let merged: LifeContext = { ...base }
  const providersUsed: string[] = []
  const missing = new Set<string>(base.missingFields)

  for (const provider of providers) {
    try {
      const result = provider.provide(signals)
      if (result.available) providersUsed.push(result.providerId)
      merged = { ...merged, ...result.value }
      for (const field of result.missingFields ?? []) missing.add(field)
      // Clear fields that this provider successfully filled.
      for (const key of Object.keys(result.value) as (keyof LifeContext)[]) {
        const value = result.value[key]
        if (value != null && value !== 'unknown' && !(Array.isArray(value) && value.length === 0)) {
          missing.delete(key as string)
        }
      }
      if (result.value.placeholders) {
        const p = result.value.placeholders
        if (p.wearables != null) missing.delete('wearables')
        if (p.glucose != null) missing.delete('glucose')
        if (p.bloodPressure != null) missing.delete('bloodPressure')
        if (p.heartRate != null) missing.delete('heartRate')
        if (p.airQuality != null) missing.delete('airQuality')
        if (p.locationAccuracy !== 'none' && p.locationAccuracy !== 'unknown') {
          missing.delete('locationAccuracy')
        }
      }
    } catch {
      // Provider failure must not break LifeContext assembly.
      missing.add(provider.id)
    }
  }

  return Object.freeze({
    ...merged,
    version: LIFE_CONTEXT_VERSION,
    leftovers: Object.freeze([...(merged.leftovers ?? [])]),
    placeholders: Object.freeze({
      wearables: merged.placeholders.wearables,
      glucose: merged.placeholders.glucose,
      bloodPressure: merged.placeholders.bloodPressure,
      heartRate: merged.placeholders.heartRate,
      airQuality: merged.placeholders.airQuality,
      locationAccuracy: merged.placeholders.locationAccuracy,
    }),
    providersUsed: Object.freeze([...new Set(providersUsed)]),
    missingFields: Object.freeze([...missing].sort()),
  })
}
