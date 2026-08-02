export function todayIsoDate(date = new Date()): string {
  return toIsoDate(date)
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Monday-start ISO date for the week containing `date`. */
export function weekStartIso(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toIsoDate(d)
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = parseIsoDate(isoDate)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function parseIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

/** Mon–Sun ISO dates for the week containing `date`. */
export function weekDates(date = new Date()): string[] {
  const start = weekStartIso(date)
  return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i))
}

export function formatDayLabel(isoDate: string): string {
  const d = parseIsoDate(isoDate)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

export function formatDayMonth(isoDate: string): string {
  const d = parseIsoDate(isoDate)
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function isSameIsoDay(a: string, b: string): boolean {
  return a === b
}
