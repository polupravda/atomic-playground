import { describe, expect, it } from 'vitest'
import { MATTER_DATA, matterData, matterPhaseAt } from './matter'

describe('matter phases (P08/P09)', () => {
  it('gets the everyday states right at room temperature', () => {
    expect(matterPhaseAt(26, 20)).toBe('solid') // iron
    expect(matterPhaseAt(8, 20)).toBe('gas') // oxygen
    expect(matterPhaseAt(80, 20)).toBe('liquid') // mercury
    expect(matterPhaseAt(35, 20)).toBe('liquid') // bromine
  })

  it('walks iron through its phase changes', () => {
    expect(matterPhaseAt(26, 1000)).toBe('solid')
    expect(matterPhaseAt(26, 2000)).toBe('liquid')
    expect(matterPhaseAt(26, 3000)).toBe('gas')
  })

  it('liquefies air-like gases only at very low temperatures', () => {
    expect(matterPhaseAt(8, -200)).toBe('liquid')
    expect(matterPhaseAt(8, -250)).toBe('solid')
    expect(matterPhaseAt(2, -270)).toBe('liquid') // helium
  })

  it('returns null for elements without data', () => {
    expect(matterPhaseAt(104, 20)).toBeNull()
    expect(matterData(61)).toBeNull()
  })

  it('keeps melt below boil everywhere', () => {
    for (const { melt, boil } of Object.values(MATTER_DATA)) {
      expect(melt).toBeLessThan(boil)
    }
  })
})
