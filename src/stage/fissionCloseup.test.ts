import { describe, expect, it } from 'vitest'
import { CLOSEUP_STEP_COUNT, CLOSEUP_TOTAL, closeupStep, closeupStory } from './fissionCloseup'
import { BOMB_DESIGNS } from '../core/fission'

const FUELS = [...new Set(Object.values(BOMB_DESIGNS).map((d) => d.fuel))]

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const unsup = (s: string) => Number([...s].map((c) => SUP.indexOf(c)).join(''))

describe('close-up story', () => {
  it('has one text entry per step, for every fuel', () => {
    for (const fuel of FUELS) expect(closeupStory(fuel)).toHaveLength(CLOSEUP_STEP_COUNT)
  })

  it('steps run 0 … last in order over the close-up', () => {
    let prev = 0
    const seen = new Set<number>()
    for (let t = 0; t <= CLOSEUP_TOTAL; t += 0.05) {
      const s = closeupStep(t)
      expect(s).toBeGreaterThanOrEqual(prev)
      expect(s).toBeLessThan(CLOSEUP_STEP_COUNT)
      seen.add(s)
      prev = s
    }
    expect(seen.size).toBe(CLOSEUP_STEP_COUNT)
  })

  it('shows the bomb’s own fuel: uranium for Little Boy, plutonium for Fat Man', () => {
    expect(closeupStory(BOMB_DESIGNS.gun.fuel)[1].title).toBe('Uranium-236 wobbles')
    expect(closeupStory(BOMB_DESIGNS.implosion.fuel)[1].title).toBe('Plutonium-240 wobbles')
    expect(closeupStory(BOMB_DESIGNS.tsar.fuel)[0].equation).toBe('n + ²³⁹Pu')
  })

  it('every split equation conserves nucleons (mass numbers add up)', () => {
    for (const fuel of FUELS) {
      let checked = 0
      for (const st of closeupStory(fuel)) {
        const m = st.equation.match(/^n \+ (\S+)[A-Z][a-z]? → (\S+?)[A-Z][a-z]? → (\S+?)[A-Z][a-z]? \+ (\S+?)[A-Z][a-z]? \+ (\d) n/)
        if (!m) continue
        const [, fuelA, compound, heavy, light, n] = m
        expect(unsup(fuelA) + 1).toBe(unsup(compound))
        expect(unsup(heavy) + unsup(light) + Number(n)).toBe(unsup(compound))
        checked++
      }
      expect(checked).toBe(3)
    }
  })
})
