import { describe, expect, it } from 'vitest'
import { tablePosition } from './periodicTable'

describe('tablePosition (P01)', () => {
  it('places the anchor elements correctly', () => {
    expect(tablePosition(1)).toEqual({ row: 1, col: 1 }) // H
    expect(tablePosition(2)).toEqual({ row: 1, col: 18 }) // He
    expect(tablePosition(6)).toEqual({ row: 2, col: 14 }) // C, group 14
    expect(tablePosition(11)).toEqual({ row: 3, col: 1 }) // Na
    expect(tablePosition(18)).toEqual({ row: 3, col: 18 }) // Ar
    expect(tablePosition(26)).toEqual({ row: 4, col: 8 }) // Fe, group 8
    expect(tablePosition(57)).toEqual({ row: 9, col: 3 }) // La → f-block row
    expect(tablePosition(71)).toEqual({ row: 9, col: 17 }) // Lu
    expect(tablePosition(72)).toEqual({ row: 6, col: 4 }) // Hf
    expect(tablePosition(79)).toEqual({ row: 6, col: 11 }) // Au, group 11
    expect(tablePosition(92)).toEqual({ row: 10, col: 6 }) // U
    expect(tablePosition(118)).toEqual({ row: 7, col: 18 }) // Og
  })

  it('gives every element a unique cell within the grid', () => {
    const seen = new Set<string>()
    for (let z = 1; z <= 118; z++) {
      const { row, col } = tablePosition(z)
      expect(row).toBeGreaterThanOrEqual(1)
      expect(row).toBeLessThanOrEqual(10)
      expect(col).toBeGreaterThanOrEqual(1)
      expect(col).toBeLessThanOrEqual(18)
      const key = `${row}:${col}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })
})
