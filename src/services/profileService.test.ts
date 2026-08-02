import { describe, expect, it } from 'vitest'
import { validateProfileInput } from '@/services/profileService'
import { parsePreferenceList } from '@/services/preferenceService'

describe('profile validation', () => {
  const base = {
    age: 30,
    gender: 'female' as const,
    heightCm: 160,
    weightKg: 60,
    stateCode: 'MH',
    districtId: 'mh-mumbai',
    foodPreference: 'veg' as const,
    goal: 'maintain' as const,
  }

  it('accepts valid essentials', () => {
    expect(() => validateProfileInput(base)).not.toThrow()
  })

  it('rejects invalid age', () => {
    expect(() => validateProfileInput({ ...base, age: 2 })).toThrow(/Age/)
  })

  it('rejects missing district', () => {
    expect(() => validateProfileInput({ ...base, districtId: '' })).toThrow(/District/)
  })
})

describe('preference parsing', () => {
  it('parses comma lists', () => {
    expect(parsePreferenceList('dairy, gluten ,peanut')).toEqual([
      'dairy',
      'gluten',
      'peanut',
    ])
  })

  it('handles empty values', () => {
    expect(parsePreferenceList(undefined)).toEqual([])
    expect(parsePreferenceList('')).toEqual([])
  })
})
