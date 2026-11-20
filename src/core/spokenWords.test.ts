import { describe, expect, it } from 'vitest'
import { BOND_SCENARIOS } from './bonding'
import { ELEMENTS } from './elements'
import { SPOKEN_WORDS, WORDS_KEY, bondLine, bondWord, elementWord, spokenFormula } from './spokenWords'

// the rendered clips (listed only, never loaded)
const CLIPS = new Set(
  Object.keys(import.meta.glob('../../public/narration/words/en/*.m4a')).map((p) => p.slice(p.lastIndexOf('/') + 1, -4)),
)

describe('🔊 spoken words (the speak buttons)', () => {
  it('every element has its name line and a rendered clip', () => {
    expect(ELEMENTS).toHaveLength(118)
    for (const e of ELEMENTS) {
      expect(SPOKEN_WORDS[elementWord(e.atomicNumber)]).toBe(`${e.name}.`)
      expect(CLIPS.has(elementWord(e.atomicNumber)), e.name).toBe(true)
    }
  })

  it('every bonding-lab molecule has its line and a rendered clip', () => {
    for (const s of BOND_SCENARIOS) {
      expect(SPOKEN_WORDS[bondWord(s.id)]).toBe(bondLine(s))
      expect(CLIPS.has(bondWord(s.id)), s.id).toBe(true)
    }
  })

  it('formulas are read letter by letter, digits as words', () => {
    expect(spokenFormula('H₂O')).toBe('H two O')
    expect(spokenFormula('CH₄')).toBe('C H four')
    expect(spokenFormula('HCl')).toBe('H C L')
    // a lone A would be read as the article: spelled with commas
    expect(spokenFormula('NaCl')).toBe('N, A, C, L')
    expect(bondLine(BOND_SCENARIOS.find((s) => s.id === 'h2o')!)).toBe('H two O. ... Water.')
  })

  it('lives in the words folder', () => expect(WORDS_KEY).toBe('words'))

  it('has nothing but element and molecule clips', () => {
    expect(Object.keys(SPOKEN_WORDS)).toHaveLength(ELEMENTS.length + BOND_SCENARIOS.length)
  })
})
