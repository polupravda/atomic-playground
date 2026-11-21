import { describe, expect, it } from 'vitest'
import { COLUMN_CAP, PUMP_NM, RUBY_NM, columnSize } from './laser'
import { shellConfiguration } from './atom'

describe('the laser story numbers', () => {
  it('the lamp light is a shorter wave (more energy) than the red it makes', () => {
    expect(PUMP_NM).toBeLessThan(RUBY_NM)
  })

  it('chromium has one lone outer electron — the one that jumps', () => {
    expect(shellConfiguration(24, 24)).toEqual([2, 8, 13, 1])
  })

  it('the column starts as a pair and doubles every trip, up to its cap', () => {
    expect(columnSize(0)).toBe(2)
    expect(columnSize(1)).toBe(4)
    expect(columnSize(2)).toBe(8)
    expect(columnSize(10)).toBe(COLUMN_CAP)
    for (let t = 0; t < 6; t += 0.25) expect(columnSize(t + 0.25)).toBeGreaterThanOrEqual(columnSize(t))
  })
})
