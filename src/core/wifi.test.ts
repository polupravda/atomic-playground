import { describe, expect, it } from 'vitest'
import { asciiCode, toBits } from './digital'
import { ANSWER, CHILD_HAND_CM, FOUR_KINDS, OVEN_W, ROUTER_W, WIFI_GHZ, decodeWaves, encodeWaves, pairOf, pairsOf, wavelengthCm } from './wifi'

// What 📶 How Wi-Fi works shows and says must be the real thing.

describe('the radio wave', () => {
  it('is about as long as a hand: 2.4 GHz → 12.5 cm', () => {
    expect(wavelengthCm(WIFI_GHZ)).toBeCloseTo(12.49, 1)
    expect(Math.abs(wavelengthCm(WIFI_GHZ) - CHILD_HAND_CM)).toBeLessThan(2)
    expect(wavelengthCm(5)).toBeCloseTo(6, 0)
  })

  it('a router is about ten thousand times weaker than a microwave oven', () => {
    expect(OVEN_W / ROUTER_W).toBe(10000)
  })
})

describe('bits on waves', () => {
  it('sends the letter H as four waves, two bits each', () => {
    const h = toBits(asciiCode('H'))
    expect(pairsOf(h)).toEqual(['01', '00', '10', '00'])
    expect(encodeWaves(h)).toEqual([
      { tall: false, flipped: true },
      { tall: false, flipped: false },
      { tall: true, flipped: false },
      { tall: false, flipped: false },
    ])
  })

  it('the router measures the waves and gets exactly the same bits back', () => {
    for (let n = 0; n < 256; n++) expect(decodeWaves(encodeWaves(toBits(n)))).toBe(toBits(n))
  })

  it('has four kinds of wave, one for each pair of bits', () => {
    expect(FOUR_KINDS.map(pairOf)).toEqual(['00', '01', '10', '11'])
  })

  it("Grandma's answer is HI! = 72 73 33", () => {
    expect([...ANSWER].map(asciiCode)).toEqual([72, 73, 33])
  })
})
