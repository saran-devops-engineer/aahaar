import type { LifeContext } from '@/engines/life-context/types'

export function getCookingTimeMinutes(context: LifeContext): number | null {
  return context.availableCookingTime
}

export function isTraveling(context: LifeContext): boolean {
  return context.travelMode === true
}

export function isFestivalDay(context: LifeContext): boolean {
  return context.festival != null || context.holiday === true
}

export function hasPantrySignal(context: LifeContext): boolean {
  return context.pantryStatus !== 'unknown' || context.leftovers.length > 0
}

export function hasWeatherSignal(context: LifeContext): boolean {
  return context.weather != null || context.temperature != null
}

export function getMissingSoftFields(context: LifeContext): readonly string[] {
  return context.missingFields
}
