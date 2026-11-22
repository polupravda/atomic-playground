import { describe, expect, it } from 'vitest'
import { ARRIVAL, BLINK_S, BROKEN, FIBRE_KM_S, PACKETS, checkNumber, flipBit, inOrder, oceanTripS } from './internet'

// What 🌊 Internet under the ocean shows and says must be the real thing.

describe('across the ocean', () => {
  it('light in glass crosses the ocean in about three hundredths of a second', () => {
    expect(FIBRE_KM_S).toBeLessThan(299_792)
    expect(oceanTripS()).toBeCloseTo(0.03, 3)
  })

  it('a blink takes about ten times longer', () => {
    expect(BLINK_S / oceanTripS()).toBeCloseTo(10, 0)
  })
})

describe('packets', () => {
  it('are numbered in order', () => {
    expect(PACKETS.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6])
    expect(PACKETS.every((p) => p.bits.length === 8)).toBe(true)
  })

  it('arrive out of order and are put back by their numbers', () => {
    expect(ARRIVAL).not.toEqual([1, 2, 3, 4, 5, 6])
    expect(inOrder(ARRIVAL)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('one flipped lamp changes the check number', () => {
    const p = PACKETS[BROKEN.n - 1]
    const broken = flipBit(p.bits, BROKEN.lamp)
    expect(broken).not.toBe(p.bits)
    expect(checkNumber(broken)).not.toBe(checkNumber(p.bits))
    // the story's numbers: packet 4 is the sun pixel's red, 250
    expect(p.bits).toBe('11111010')
    expect(checkNumber(p.bits)).toBe(6)
    expect(checkNumber(broken)).toBe(7)
  })
})
