import { describe, expect, it } from 'vitest'
import { FUN_FACTS, PHOTO_ELEMENTS, elementFacts, funFactFor } from './elementFacts'

describe('elementFacts (P07/P10/P11)', () => {
  it('knows states at room temperature', () => {
    expect(elementFacts(8).state).toBe('gas') // O
    expect(elementFacts(35).state).toBe('liquid') // Br
    expect(elementFacts(80).state).toBe('liquid') // Hg
    expect(elementFacts(26).state).toBe('solid') // Fe
    expect(elementFacts(2).state).toBe('gas') // He
    expect(elementFacts(104).state).toBe('unknown') // Rf: atom-by-atom only
    expect(elementFacts(118).state).toBe('unknown')
  })

  it('carries rich facts for common elements', () => {
    const gold = elementFacts(79)
    expect(gold.appearance).toContain('yellow')
    expect(gold.examples!.length).toBeGreaterThan(0)
    expect(gold.foundIn!.length).toBeGreaterThan(0)
    expect(elementFacts(6).examples).toContain('diamonds')
  })

  it('lists photos only for elements we actually bundle', () => {
    expect(PHOTO_ELEMENTS.size).toBe(93)
    expect(PHOTO_ELEMENTS.has(79)).toBe(true) // gold
    expect(PHOTO_ELEMENTS.has(91)).toBe(true) // protactinium, surprisingly!
    expect(PHOTO_ELEMENTS.has(43)).toBe(false) // technetium
    expect(PHOTO_ELEMENTS.has(45)).toBe(false) // rhodium (odd source gap)
    expect(PHOTO_ELEMENTS.has(92)).toBe(false) // no uranium photo available
    expect(PHOTO_ELEMENTS.has(118)).toBe(false) // oganesson
    for (const z of PHOTO_ELEMENTS) {
      expect(z).toBeGreaterThanOrEqual(1)
      expect(z).toBeLessThanOrEqual(118)
    }
  })

  it('sparks curiosity with fun facts', () => {
    expect(funFactFor(79)).toContain('cube')
    expect(funFactFor(19)).toContain('radioactive')
    expect(funFactFor(105)).toBeNull()
    for (const [z, fact] of Object.entries(FUN_FACTS)) {
      expect(Number(z)).toBeGreaterThanOrEqual(1)
      expect(Number(z)).toBeLessThanOrEqual(118)
      expect(fact.length).toBeGreaterThan(20)
    }
  })

  it('returns a valid state for every element', () => {
    for (let z = 1; z <= 118; z++) {
      expect(['solid', 'liquid', 'gas', 'unknown']).toContain(elementFacts(z).state)
    }
  })
})
