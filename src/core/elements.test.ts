import { describe, expect, it } from 'vitest'
import { ELEMENTS, MAX_ATOMIC_NUMBER, elementForProtons } from './elements'

describe('elements dataset', () => {
  it('contains all 118 elements with consistent atomic numbers', () => {
    expect(MAX_ATOMIC_NUMBER).toBe(118)
    expect(ELEMENTS).toHaveLength(118)
    ELEMENTS.forEach((el, i) => expect(el.atomicNumber).toBe(i + 1))
  })

  it('has unique symbols and names', () => {
    expect(new Set(ELEMENTS.map((e) => e.symbol)).size).toBe(118)
    expect(new Set(ELEMENTS.map((e) => e.name)).size).toBe(118)
  })
})

describe('elementForProtons (A03)', () => {
  it('maps proton counts to elements', () => {
    expect(elementForProtons(1)?.name).toBe('Hydrogen')
    expect(elementForProtons(6)?.symbol).toBe('C')
    expect(elementForProtons(7)?.name).toBe('Nitrogen')
    expect(elementForProtons(79)?.name).toBe('Gold') // A02: gold as easy as hydrogen
    expect(elementForProtons(118)?.symbol).toBe('Og')
  })

  it('returns null outside the supported table', () => {
    expect(elementForProtons(0)).toBeNull()
    expect(elementForProtons(119)).toBeNull()
    expect(elementForProtons(2.5)).toBeNull()
  })
})
