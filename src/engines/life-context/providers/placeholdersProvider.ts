import type { LifeContextProvider, LifeContextPlaceholders } from '@/engines/life-context/types'

/**
 * Future slots: wearables, glucose, BP, heart rate, AQI, GPS accuracy.
 * Never invent values — only pass through signals.
 */
export const placeholdersProvider: LifeContextProvider = {
  id: 'PlaceholdersProvider',
  provide(signals) {
    const placeholders: LifeContextPlaceholders = Object.freeze({
      wearables:
        signals.wearablesConnected != null
          ? Object.freeze({ connected: signals.wearablesConnected })
          : null,
      glucose:
        signals.glucoseMgDl != null
          ? Object.freeze({ mgDl: signals.glucoseMgDl })
          : null,
      bloodPressure: signals.bloodPressure
        ? Object.freeze({ ...signals.bloodPressure })
        : null,
      heartRate:
        signals.heartRateBpm != null
          ? Object.freeze({ bpm: signals.heartRateBpm })
          : null,
      airQuality:
        signals.airQualityIndex != null
          ? Object.freeze({ aqi: signals.airQualityIndex })
          : null,
      locationAccuracy: signals.locationAccuracy ?? 'none',
    })

    const missing: string[] = []
    if (placeholders.wearables == null) missing.push('wearables')
    if (placeholders.glucose == null) missing.push('glucose')
    if (placeholders.bloodPressure == null) missing.push('bloodPressure')
    if (placeholders.heartRate == null) missing.push('heartRate')
    if (placeholders.airQuality == null) missing.push('airQuality')
    if (placeholders.locationAccuracy === 'none' || placeholders.locationAccuracy === 'unknown') {
      missing.push('locationAccuracy')
    }

    return {
      providerId: 'PlaceholdersProvider',
      available:
        placeholders.wearables != null ||
        placeholders.glucose != null ||
        placeholders.bloodPressure != null ||
        placeholders.heartRate != null ||
        placeholders.airQuality != null,
      missingFields: missing,
      value: { placeholders },
    }
  },
}
