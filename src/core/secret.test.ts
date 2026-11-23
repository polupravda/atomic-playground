import { describe, expect, it } from 'vitest'
import { asciiChar } from './digital'
import { FUNNY_JUMBLE, FUNNY_KEY, FUNNY_MESSAGE, JUMBLE_BITS, JUMBLE_TEXT, MESSAGE_BITS, SECRET_KEY, funnyMixed, mixBits, realKeyCount } from './secret'

// What 🔐 Keeping messages secret shows and says must be the real thing.

describe('mixing with a key', () => {
  it('HI mixed with the key reads RG — a jumble', () => {
    expect(MESSAGE_BITS).toEqual(['01001000', '01001001'])
    expect(JUMBLE_BITS).toEqual(['01010010', '01000111'])
    expect(JUMBLE_TEXT).toBe('RG')
  })

  it('the same key flips the very same bits back', () => {
    const back = JUMBLE_BITS.map((b, i) => mixBits(b, SECRET_KEY[i]))
    expect(back).toEqual(MESSAGE_BITS)
    expect(back.map((b) => asciiChar(parseInt(b, 2))).join('')).toBe('HI')
  })

  it('a key bit 1 flips, a key bit 0 keeps', () => {
    expect(mixBits('0101', '1100')).toBe('1001')
  })

  it('I MISS YOU really becomes BLOB ZONKY with its key, and back', () => {
    expect(FUNNY_MESSAGE.length).toBe(FUNNY_JUMBLE.length)
    expect(funnyMixed()).toBe(FUNNY_JUMBLE)
    const back = [...FUNNY_JUMBLE].map((c, i) => asciiChar(parseInt(mixBits(c.charCodeAt(0).toString(2).padStart(8, '0'), FUNNY_KEY[i]), 2))).join('')
    expect(back).toBe(FUNNY_MESSAGE)
  })

  it('a real key has 2^128 possibilities', () => {
    expect(realKeyCount().toString()).toBe('340282366920938463463374607431768211456')
  })
})
