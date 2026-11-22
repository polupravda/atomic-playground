import { describe, expect, it } from 'vitest'
import {
  FINGER_WORTHS,
  HEARING_MAX,
  MESSAGE,
  SAMPLE_RATE,
  SUN_RGB,
  WORTHS8,
  asciiChar,
  asciiCode,
  bits16,
  fromBits,
  handValue,
  litWorths,
  sample16,
  songPush,
  toBits,
} from './digital'

// What the 🔢 What "digital" means story shows and says must be the real
// arithmetic (proposal 18: "don't oversimplify").

describe('digits and bits', () => {
  it('counts on one hand in bits: thumb 1, thumb + pointer 3, all five 31', () => {
    expect(FINGER_WORTHS).toEqual([16, 8, 4, 2, 1])
    expect(handValue([false, false, false, false, true])).toBe(1)
    expect(handValue([false, false, false, true, true])).toBe(3)
    expect(handValue([true, true, true, true, true])).toBe(31)
  })

  it('eight lamps count up to two hundred fifty five', () => {
    expect(WORTHS8.reduce((a, b) => a + b, 0)).toBe(255)
    expect(toBits(255)).toBe('11111111')
    expect(toBits(0)).toBe('00000000')
    expect(() => toBits(256)).toThrow()
  })

  it('turns a number into lamps and back', () => {
    for (let n = 0; n < 256; n++) expect(fromBits(toBits(n))).toBe(n)
  })
})

describe('the message HI', () => {
  it('uses the real code table: H = 72 = 64 + 8, I = 73', () => {
    expect([...MESSAGE].map(asciiCode)).toEqual([72, 73])
    expect(toBits(72)).toBe('01001000')
    expect(litWorths(toBits(72))).toEqual([64, 8])
    expect(toBits(73)).toBe('01001001')
    expect(litWorths(toBits(73))).toEqual([64, 8, 1])
  })

  it('decodes back: add up the lit lamps, look up the same table', () => {
    const sent = [...MESSAGE].map((c) => toBits(asciiCode(c)))
    expect(sent.map((b) => asciiChar(litWorths(b).reduce((a, x) => a + x, 0))).join('')).toBe(MESSAGE)
  })
})

describe('the photo and the song', () => {
  it('the sun pixel: lots of red, lots of green, almost no blue', () => {
    const [r, g, b] = SUN_RGB
    expect(r).toBeGreaterThan(200)
    expect(g).toBeGreaterThan(180)
    expect(b).toBeLessThan(40)
    expect(SUN_RGB.map((v) => toBits(v)).join('')).toHaveLength(24)
  })

  it('measures sound often enough to catch every wiggle we hear', () => {
    expect(SAMPLE_RATE).toBe(48000)
    expect(SAMPLE_RATE).toBeGreaterThan(2 * HEARING_MAX)
  })

  it('stores a measurement as a 16-bit number', () => {
    expect(sample16(1)).toBe(32767)
    expect(sample16(-1)).toBe(-32767)
    expect(bits16(sample16(0))).toBe('0000000000000000')
    expect(bits16(-1)).toBe('1111111111111111')
    for (let k = 0; k < 50; k++) expect(Math.abs(songPush(k * 0.137))).toBeLessThanOrEqual(1)
  })
})
