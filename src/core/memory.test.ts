import { describe, expect, it } from 'vitest'
import { fromBits } from './digital'
import { PHONE_BITS, STORED_BITS, STORED_VALUE, bitOfBox, boxesFor, phoneBoxes, readBoxes } from './memory'

// What 💾 Where a photo is stored shows and says must be the real thing.

describe('flash memory boxes', () => {
  it('a full box reads zero, an empty box one', () => {
    expect(bitOfBox(true)).toBe('0')
    expect(bitOfBox(false)).toBe('1')
  })

  it('keeps the sun pixel\'s red number, 250, in eight boxes and reads it back', () => {
    expect(STORED_VALUE).toBe(250)
    expect(STORED_BITS).toBe('11111010')
    const boxes = boxesFor(STORED_BITS)
    expect(boxes.filter(Boolean)).toHaveLength(2) // two boxes full of electrons
    expect(readBoxes(boxes)).toBe(STORED_BITS)
    expect(fromBits(readBoxes(boxes))).toBe(250)
  })

  it('a phone keeps about a trillion bits in hundreds of billions of boxes', () => {
    expect(PHONE_BITS).toBeGreaterThan(1e12)
    expect(phoneBoxes()).toBeGreaterThan(1e11)
    expect(phoneBoxes()).toBeLessThan(1e12)
  })
})
