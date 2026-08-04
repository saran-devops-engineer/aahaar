import { describe, expect, it } from 'vitest'
import { DISTRICT_RECORDS } from '@/engines/knowledge/data/districts'
import { REGION_RECORDS } from '@/engines/knowledge/data/regions'

const MIN_DISTRICTS: Record<string, number> = {
  AP: 26,
  AS: 31,
  BR: 38,
  CT: 33,
  DL: 11,
  GA: 2,
  GJ: 33,
  HR: 22,
  HP: 12,
  JH: 24,
  KA: 31,
  KL: 14,
  MP: 50,
  MH: 36,
  OD: 30,
  PB: 23,
  RJ: 33,
  TN: 38,
  TS: 33,
  UP: 75,
  UK: 13,
  WB: 23,
}

describe('district catalog', () => {
  it('covers every region with complete district lists', () => {
    for (const region of REGION_RECORDS) {
      const districts = DISTRICT_RECORDS.filter((d) => d.stateCode === region.stateCode)
      const min = MIN_DISTRICTS[region.stateCode] ?? 1
      expect(districts.length, `${region.name} (${region.stateCode})`).toBeGreaterThanOrEqual(min)
    }
  })

  it('has unique district ids', () => {
    const ids = DISTRICT_RECORDS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps legacy food-linked district ids', () => {
    const ids = new Set(DISTRICT_RECORDS.map((d) => d.id))
    for (const id of [
      'mh-mumbai',
      'mh-pune',
      'ka-bengaluru',
      'tn-chennai',
      'dl-new-delhi',
      'ts-hyderabad',
      'od-khordha',
      'as-kamrup-metro',
    ]) {
      expect(ids.has(id), id).toBe(true)
    }
  })

  it('sorts districts alphabetically within each state', () => {
    for (const region of REGION_RECORDS) {
      const names = DISTRICT_RECORDS.filter((d) => d.stateCode === region.stateCode).map(
        (d) => d.name,
      )
      const sorted = [...names].sort((a, b) => a.localeCompare(b, 'en'))
      expect(names).toEqual(sorted)
    }
  })
})
