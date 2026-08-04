import type { DomainEvaluation, LifeContext } from '@/engines/life-context/types'

export function evaluateWeather(context: LifeContext): DomainEvaluation {
  const available =
    context.weather != null || context.temperature != null || context.humidity != null
  const codes: string[] = []
  if (context.weather) codes.push(`WEATHER_${context.weather.toUpperCase()}`)
  if (context.temperature != null && context.temperature >= 35) codes.push('HOT')
  if (context.temperature != null && context.temperature <= 15) codes.push('COLD')
  if (!available) codes.push('WEATHER_MISSING')

  return Object.freeze({
    domain: 'weather',
    available,
    summary: !available
      ? 'Weather missing — continue without weather bias'
      : [
          context.weather,
          context.temperature != null ? `${context.temperature}°C` : null,
          context.humidity != null ? `${context.humidity}% rh` : null,
        ]
          .filter(Boolean)
          .join(' · '),
    codes: Object.freeze(codes),
    data: Object.freeze({
      weather: context.weather,
      temperature: context.temperature,
      humidity: context.humidity,
    }),
  })
}
