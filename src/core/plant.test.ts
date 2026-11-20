import { describe, expect, it } from 'vitest'
import { BOMB_SPLITTABLE_PER_100, FUEL_SPLITTABLE_PER_100, splitsAfter, splitsInGeneration } from './plant'

describe('⚡ the power plant story numbers', () => {
  it('the bomb doubles, the plant holds steady', () => {
    expect([0, 1, 2, 3, 7].map((g) => splitsInGeneration(g, 2))).toEqual([1, 2, 4, 8, 128])
    expect([0, 1, 2, 3, 7].map((g) => splitsInGeneration(g, 1))).toEqual([1, 1, 1, 1, 1])
    // eight steps: 255 splits for the bomb, 8 for the plant
    expect(splitsAfter(8, 2)).toBe(255)
    expect(splitsAfter(8, 1)).toBe(8)
  })

  it('power-plant fuel has far less of the splitting uranium than bomb fuel', () => {
    expect(FUEL_SPLITTABLE_PER_100).toBeGreaterThanOrEqual(3)
    expect(FUEL_SPLITTABLE_PER_100).toBeLessThanOrEqual(5)
    expect(BOMB_SPLITTABLE_PER_100 / FUEL_SPLITTABLE_PER_100).toBeGreaterThan(15)
  })
})
