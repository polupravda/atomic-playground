import { describe, expect, it } from 'vitest'
import { BOND_SCENARIOS } from './bonding'
import { ELEMENTS } from './elements'
import {
  BONDING_ELEMENTS,
  BOND_INFO,
  SPOKEN_WORDS,
  SPOKEN_WORDS_DE,
  SPOKEN_WORDS_RU,
  WORDS_KEY,
  bondInfoWord,
  bondLine,
  bondWord,
  elementWord,
  spokenFormula,
  spokenFormulaDe,
} from './spokenWords'

// the rendered clips (listed only, never loaded)
const ALL = Object.keys(import.meta.glob('../../public/narration/words/*/*.m4a'))
const clips = (lang: string) =>
  new Set(ALL.filter((p) => p.includes(`/words/${lang}/`)).map((p) => p.slice(p.lastIndexOf('/') + 1, -4)))
const CLIPS = clips('en')

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
    expect(Object.keys(SPOKEN_WORDS)).toHaveLength(ELEMENTS.length + 2 * BOND_SCENARIOS.length)
  })

  it('every molecule has a one-sentence description in every language, and its clips', () => {
    for (const s of BOND_SCENARIOS) {
      for (const lang of ['en', 'de', 'ru'] as const) {
        const line = BOND_INFO[lang][s.id]
        expect(line, `${lang}:${s.id}`).toBeTruthy()
        expect(line).toMatch(/[.!?]$/)
        expect(line).not.toMatch(/[()=+→×—–:|\d]/)
      }
      expect(CLIPS.has(bondInfoWord(s.id)), s.id).toBe(true)
    }
  })

  it('speaks the bonding lab in German and Russian too', () => {
    expect(spokenFormulaDe('H₂O')).toBe('H zwei O')
    expect(SPOKEN_WORDS_DE[bondWord('h2o')]).toBe('H zwei O. ... Wasser.')
    expect(SPOKEN_WORDS_RU[bondWord('h2o')]).toBe('Аш два О. ... Вода.')
    expect(SPOKEN_WORDS_DE[elementWord(1)]).toBe('Wasserstoff.')
    for (const [lang, words] of [['de', SPOKEN_WORDS_DE], ['ru', SPOKEN_WORDS_RU]] as const) {
      const have = clips(lang)
      expect(Object.keys(words)).toHaveLength(BONDING_ELEMENTS.length + 2 * BOND_SCENARIOS.length)
      for (const id of Object.keys(words)) expect(have.has(id), `${lang}:${id}`).toBe(true)
    }
  })
})
