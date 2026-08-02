import { PREFERENCE_KEYS } from '@/config/profileOptions'
import { db } from '@/database/db'
import { setPreference } from '@/services/preferenceService'
import { createId } from '@/shared/utils/id'
import { addDaysIso, todayIsoDate } from '@/shared/utils/date'
import type { WaterLog } from '@/types/domain'

export async function getWaterForDate(userId: string, date: string): Promise<number> {
  const logs = await db.water_logs.where({ userId, date }).toArray()
  return logs.reduce((sum, log) => sum + log.amountMl, 0)
}

export async function getTodayWaterMl(userId: string): Promise<number> {
  return getWaterForDate(userId, todayIsoDate())
}

export async function addWater(
  userId: string,
  amountMl: number,
  date = todayIsoDate(),
): Promise<WaterLog> {
  if (amountMl <= 0) throw new Error('Water amount must be positive')
  const log: WaterLog = {
    id: createId('water'),
    userId,
    date,
    amountMl,
    createdAt: new Date().toISOString(),
  }
  await db.water_logs.add(log)
  return log
}

export async function undoLastWater(userId: string, date = todayIsoDate()): Promise<void> {
  const logs = await db.water_logs.where({ userId, date }).sortBy('createdAt')
  const last = logs.at(-1)
  if (last) await db.water_logs.delete(last.id)
}

export async function getWaterHistory(
  userId: string,
  days = 7,
): Promise<Array<{ date: string; amountMl: number }>> {
  const today = todayIsoDate()
  const start = addDaysIso(today, -(days - 1))
  const logs = await db.water_logs.where('userId').equals(userId).toArray()
  const byDate = new Map<string, number>()

  for (const log of logs) {
    if (log.date < start || log.date > today) continue
    byDate.set(log.date, (byDate.get(log.date) ?? 0) + log.amountMl)
  }

  return Array.from({ length: days }, (_, index) => {
    const date = addDaysIso(start, index)
    return { date, amountMl: byDate.get(date) ?? 0 }
  })
}

export async function setWaterReminders(userId: string, enabled: boolean): Promise<void> {
  await setPreference(
    userId,
    PREFERENCE_KEYS.waterReminders,
    enabled ? 'on' : 'off',
  )
}

export async function areWaterRemindersEnabled(userId: string): Promise<boolean> {
  const row = await db.preferences
    .where('[userId+key]')
    .equals([userId, PREFERENCE_KEYS.waterReminders])
    .first()
  return row?.value === 'on'
}

/**
 * Browser notification stub — requests permission and shows one nudge.
 * Full scheduling lands with a future reminders plugin.
 */
export async function requestWaterReminderPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export async function nudgeWaterReminder(goalMl: number, currentMl: number): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') return false
  if (currentMl >= goalMl) return false

  new Notification('AAHAAR · Water', {
    body: `You've had ${currentMl} ml of ${goalMl} ml today. A glass keeps you on track.`,
    tag: 'aahaar-water',
  })
  return true
}
