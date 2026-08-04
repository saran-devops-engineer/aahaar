import type { LifeContextProvider } from '@/engines/life-context/types'

/**
 * WeatherProvider — placeholder.
 * No network / OpenWeather / IMD. Returns null when signals absent.
 */
export const weatherProvider: LifeContextProvider = {
  id: 'WeatherProvider',
  provide(signals) {
    const temperature = signals.temperatureC ?? null
    const weather = signals.weather ?? null
    const humidity = signals.humidityPercent ?? null
    const missing: string[] = []
    if (temperature == null) missing.push('temperature')
    if (weather == null) missing.push('weather')
    if (humidity == null) missing.push('humidity')

    return {
      providerId: 'WeatherProvider',
      available: temperature != null || weather != null || humidity != null,
      missingFields: missing,
      value: {
        temperature,
        weather,
        humidity,
      },
    }
  },
}
