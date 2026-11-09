import { describe, expect, it } from 'vitest'
import {
  BOMB_DESIGNS,
  FISSION_VS_BURNING,
  damageZones,
  tntText,
  hiroshimas,
  formatTinySeconds,
  neutronsFromSplit,
  realChainTime,
} from './fission'

describe('fission rules', () => {
  it('frees 2 or 3 neutrons per split, averaging the design mean', () => {
    for (const d of Object.values(BOMB_DESIGNS)) {
      const samples = 1000
      let sum = 0
      for (let i = 0; i < samples; i++) {
        const n = neutronsFromSplit(d.neutronsMean, (i + 0.5) / samples)
        expect([2, 3]).toContain(n)
        sum += n
      }
      expect(sum / samples).toBeCloseTo(d.neutronsMean, 2)
    }
  })

  it('uses real neutron yields: plutonium frees more than uranium', () => {
    expect(BOMB_DESIGNS.gun.neutronsMean).toBeCloseTo(2.4)
    expect(BOMB_DESIGNS.implosion.neutronsMean).toBeCloseTo(2.9)
  })

  it('Tsar Bomba is a hydrogen bomb: fission trigger + fusion fuel', () => {
    expect(BOMB_DESIGNS.tsar.fuel).toBe('plutonium-239')
    expect(BOMB_DESIGNS.tsar.fusionPairs).toBeGreaterThan(0)
    expect(BOMB_DESIGNS.gun.fusionPairs).toBeUndefined()
    expect(hiroshimas('tsar')).toBe(3333)
    expect(hiroshimas('gun')).toBe(1)
  })

  it('damage radii: Hiroshima-like reference, cube-root scaling for bigger bombs', () => {
    const lb = damageZones('gun')
    expect(lb.map((z) => z.id)).toEqual(['heavy', 'houses', 'burns', 'windows'])
    expect(lb.find((z) => z.id === 'houses')!.km).toBeCloseTo(1.7)
    // 50 Mt is 3,333× the yield → blast reaches ~15× farther
    const tsar = damageZones('tsar')
    expect(tsar.find((z) => z.id === 'houses')!.km).toBeGreaterThan(24)
    expect(tsar.find((z) => z.id === 'houses')!.km).toBeLessThan(27)
    // heat reaches relatively farther than the blast for huge bombs
    expect(tsar.find((z) => z.id === 'burns')!.km).toBeGreaterThan(50)
    expect(tntText('gun')).toBe('15,000 tonnes of TNT')
    expect(tntText('tsar')).toBe('50,000,000 tonnes of TNT')
  })

  it('one split beats burning one carbon atom ~50 million times', () => {
    expect(FISSION_VS_BURNING).toBe(50_000_000)
  })

  it('formats tiny durations for kids', () => {
    expect(formatTinySeconds(3e-8)).toBe('30 billionths of a second')
    expect(formatTinySeconds(1e-9)).toBe('1 billionth of a second')
    expect(formatTinySeconds(8e-7)).toBe('800 billionths of a second')
    expect(formatTinySeconds(2e-6)).toBe('2 millionths of a second')
    expect(realChainTime(80)).toBe('800 billionths of a second')
  })
})
