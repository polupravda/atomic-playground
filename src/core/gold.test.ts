import { describe, expect, it } from 'vitest'
import { EARTH_AGE_YEARS, GOLD_SEEDS, SUN_AGE_YEARS, goldYearsAgo, nucleusAt } from './gold'
import { elementForProtons } from './elements'

describe('💍 the neutron stuffing (r-process) seeds', () => {
  it('starts every seed as iron-56', () => {
    for (const s of GOLD_SEEDS) {
      const st = nucleusAt(s, 0)
      expect(st).toEqual({ protons: 26, nucleons: 56 })
      expect(elementForProtons(st.protons)?.name).toBe('Iron')
    }
  })

  it('ends on real atoms: gold-197 (our hero), platinum-195, uranium-238', () => {
    const end = GOLD_SEEDS.map((s) => nucleusAt(s, 99))
    expect(end).toEqual([
      { protons: 79, nucleons: 197 },
      { protons: 78, nucleons: 195 },
      { protons: 92, nucleons: 238 },
    ])
    expect(end.map((e) => elementForProtons(e.protons)?.name)).toEqual(['Gold', 'Platinum', 'Uranium'])
  })

  it('only ever grows: protons and nucleons never go back, nucleons ≥ protons', () => {
    for (const s of GOLD_SEEDS) {
      let prev = nucleusAt(s, 0)
      for (let t = 0; t <= 12; t += 0.05) {
        const st = nucleusAt(s, t)
        expect(st.protons).toBeGreaterThanOrEqual(prev.protons)
        expect(st.nucleons).toBeGreaterThanOrEqual(prev.nucleons)
        expect(st.nucleons).toBeGreaterThan(st.protons)
        prev = st
      }
    }
  })

  it('makes the hero gold last, after platinum and uranium are done', () => {
    const [hero, pt, u] = GOLD_SEEDS
    expect(hero.decay.to).toBeGreaterThan(pt.decay.to)
    expect(hero.decay.to).toBeGreaterThan(u.decay.to)
    // the hero passes platinum (78) on its way to gold (79)
    expect(nucleusAt(hero, hero.decay.to - 0.1).protons).toBe(78)
  })
})

describe('💍 the year counter', () => {
  it('rewinds from today past the Earth and the Sun', () => {
    expect(goldYearsAgo('rewind', 0)).toBe(0)
    expect(goldYearsAgo('rewind', 9.4)).toBeCloseTo(EARTH_AGE_YEARS, -3)
    expect(goldYearsAgo('rewind', 12)).toBeCloseTo(SUN_AGE_YEARS, -3)
    let prev = -1
    for (let t = 0; t <= 14; t += 0.1) {
      const y = goldYearsAgo('rewind', t)
      expect(y).toBeGreaterThanOrEqual(prev)
      prev = y
    }
  })

  it('counts forward back to today', () => {
    expect(goldYearsAgo('forward', 2.4)).toBeCloseTo(SUN_AGE_YEARS, -3)
    expect(goldYearsAgo('forward', 15)).toBe(0)
    let prev = Infinity
    for (let t = 2.4; t <= 15; t += 0.1) {
      const y = goldYearsAgo('forward', t)
      expect(y).toBeLessThanOrEqual(prev)
      prev = y
    }
  })
})
