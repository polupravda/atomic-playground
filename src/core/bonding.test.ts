import { describe, expect, it } from 'vitest'
import { matchBondScenario } from './bonding'

describe('matchBondScenario', () => {
  it('matches each curated recipe exactly', () => {
    expect(matchBondScenario({ H: 2 }).exact?.id).toBe('h2')
    expect(matchBondScenario({ O: 2 }).exact?.id).toBe('o2')
    expect(matchBondScenario({ Cl: 2 }).exact?.id).toBe('cl2')
    expect(matchBondScenario({ H: 1, Cl: 1 }).exact?.id).toBe('hcl')
    expect(matchBondScenario({ Na: 1, Cl: 1 }).exact?.id).toBe('nacl')
    expect(matchBondScenario({ H: 2, O: 1 }).exact?.id).toBe('h2o')
    expect(matchBondScenario({ H: 2, O: 2 }).exact?.id).toBe('h2o2')
    expect(matchBondScenario({ C: 1, O: 1 }).exact?.id).toBe('co')
    expect(matchBondScenario({ C: 1, O: 2 }).exact?.id).toBe('co2')
    expect(matchBondScenario({ C: 1, H: 4 }).exact?.id).toBe('ch4')
  })

  it('treats CO as one oxygen away from CO₂', () => {
    const m = matchBondScenario({ C: 1, O: 1 })
    expect(m.exact?.id).toBe('co')
    expect(m.partials[0].scenario.id).toBe('co2')
    expect(m.partials[0].missing).toEqual({ O: 1 })
  })

  it('ignores zero-count entries when matching', () => {
    expect(matchBondScenario({ H: 2, O: 0, Na: 0 }).exact?.id).toBe('h2')
  })

  it('returns no match for an empty table', () => {
    const m = matchBondScenario({})
    expect(m.exact).toBeNull()
    expect(m.partials).toHaveLength(0)
  })

  it('suggests the nearest recipe for a partial set', () => {
    const m = matchBondScenario({ H: 1 })
    expect(m.exact).toBeNull()
    expect(m.partials[0].scenario.id).toBe('h2')
    expect(m.partials[0].missing).toEqual({ H: 1 })
  })

  it('finds the only recipe 3 hydrogens can still become', () => {
    const m = matchBondScenario({ H: 3 })
    expect(m.exact).toBeNull()
    expect(m.partials).toHaveLength(1)
    expect(m.partials[0].scenario.id).toBe('ch4')
    expect(m.partials[0].missing).toEqual({ C: 1, H: 1 })
  })

  it('offers further recipes alongside an exact match', () => {
    const m = matchBondScenario({ H: 2 })
    expect(m.exact?.id).toBe('h2')
    const ids = m.partials.map((p) => p.scenario.id)
    expect(ids).toContain('h2o') // add 1 O
    expect(ids).toContain('ch4') // add 1 C + 2 H
    expect(m.partials[0].scenario.id).toBe('h2o') // fewest missing first
  })

  it('reports no partials for a mix outside every recipe', () => {
    const m = matchBondScenario({ Na: 1, H: 1 })
    expect(m.exact).toBeNull()
    expect(m.partials).toHaveLength(0)
  })

  it('does not treat an overfilled recipe as partial', () => {
    const m = matchBondScenario({ Cl: 3 })
    expect(m.exact).toBeNull()
    expect(m.partials).toHaveLength(0) // Cl₂ needs only two Cl
  })
})
