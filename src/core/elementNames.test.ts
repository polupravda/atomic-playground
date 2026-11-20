import { describe, expect, it } from 'vitest'
import { ELEMENT_NAMES_DE, ELEMENT_NAMES_RU, searchElements } from './elementNames'

const top = (q: string) => searchElements(q)[0]?.z

describe('element names in EN · DE · RU', () => {
  it('has a German and a Russian name for all 118 elements', () => {
    expect(ELEMENT_NAMES_DE).toHaveLength(118)
    expect(ELEMENT_NAMES_RU).toHaveLength(118)
    expect(new Set(ELEMENT_NAMES_DE).size).toBe(118)
    expect(new Set(ELEMENT_NAMES_RU).size).toBe(118)
    // spot checks along the table
    expect([ELEMENT_NAMES_DE[5], ELEMENT_NAMES_DE[25], ELEMENT_NAMES_DE[78], ELEMENT_NAMES_DE[117]]).toEqual([
      'Kohlenstoff', 'Eisen', 'Gold', 'Oganesson',
    ])
    expect([ELEMENT_NAMES_RU[5], ELEMENT_NAMES_RU[25], ELEMENT_NAMES_RU[78], ELEMENT_NAMES_RU[117]]).toEqual([
      'Углерод', 'Железо', 'Золото', 'Оганесон',
    ])
  })
})

describe('searching the periodic table', () => {
  it('finds gold in every language, by symbol and by number', () => {
    for (const q of ['gold', 'Gold', 'GOLD', 'золото', 'Золото', 'Au', 'au', '79']) expect(top(q), q).toBe(79)
  })

  it('puts the exact symbol first', () => {
    expect(top('C')).toBe(6) // carbon, before calcium, chlorine …
    expect(top('fe')).toBe(26)
    expect(top('Na')).toBe(11)
  })

  it('matches the beginning of a name while typing', () => {
    expect(top('kohl')).toBe(6)
    expect(top('сере')).toBe(47) // серебро
    expect(top('oxy')).toBe(8)
    expect(top('sauer')).toBe(8)
  })

  it('ignores accents and ё, and knows the other spellings', () => {
    expect(top('Molybdan')).toBe(42)
    expect(top('Quecksilber')).toBe(80)
    expect(top('Jod')).toBe(53)
    expect(top('йод')).toBe(53)
    expect(top('Kalzium')).toBe(20)
    expect(top('aluminum')).toBe(13)
  })

  it('lists each element once, and nothing for nonsense', () => {
    const hits = searchElements('ium')
    expect(new Set(hits.map((h) => h.z)).size).toBe(hits.length)
    expect(searchElements('zzzz')).toEqual([])
    expect(searchElements('  ')).toEqual([])
  })
})
