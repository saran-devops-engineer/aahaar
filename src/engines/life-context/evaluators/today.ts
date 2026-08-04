import type { DomainEvaluation, LifeContext } from '@/engines/life-context/types'

export function evaluateToday(context: LifeContext): DomainEvaluation {
  const codes: string[] = [`DAY_${context.dayOfWeek.toUpperCase()}`, `SEASON_${context.season.toUpperCase()}`]
  if (context.workingDay === true) codes.push('WORKING_DAY')
  if (context.workingDay === false) codes.push('NON_WORKING_DAY')
  if (context.homeMode === true) codes.push('HOME_MODE')
  if (context.officeMode === true) codes.push('OFFICE_MODE')
  if (context.festival) codes.push('FESTIVAL_TODAY')

  const summary = [
    context.currentDate,
    context.dayOfWeek,
    context.season,
    context.festival ? `festival:${context.festival}` : null,
    context.availableCookingTime != null ? `cook:${context.availableCookingTime}m` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return Object.freeze({
    domain: 'today',
    available: true,
    summary,
    codes: Object.freeze(codes),
    data: Object.freeze({
      date: context.currentDate,
      time: context.currentTime,
      dayOfWeek: context.dayOfWeek,
      season: context.season,
      cookingTime: context.availableCookingTime,
      workingDay: context.workingDay,
    }),
  })
}
