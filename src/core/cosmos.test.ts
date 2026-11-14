import { describe, expect, it } from 'vitest'
import {
  ENERGY_VALLEY,
  MASS_4H_U,
  MASS_HE4_U,
  PP_STEPS,
  SUN_RECIPE,
  sunMassDefectFraction,
} from './cosmos'

describe("the Sun's recipe", () => {
  it('adds up to the whole Sun, hydrogen first', () => {
    expect(SUN_RECIPE.reduce((s, i) => s + i.massPct, 0)).toBe(100)
    expect(SUN_RECIPE[0].id).toBe('h')
    expect(SUN_RECIPE[0].massPct).toBeGreaterThan(SUN_RECIPE[1].massPct)
  })
})

describe('the pp-chain bookkeeping', () => {
  it('never loses a nucleon', () => {
    // step 3's two extra protons count as mass number 1 each
    const outMass = (s: (typeof PP_STEPS)[number]) =>
      s.out.reduce((a, b) => a + b, 0) + s.emits.filter((e) => e === 'proton').length
    for (const s of PP_STEPS) {
      expect(s.in.reduce((a, b) => a + b, 0)).toBe(outMass(s))
    }
  })

  it('tells the honest three steps: positron+neutrino, then γ, then helium', () => {
    expect(PP_STEPS[0].emits).toContain('positron')
    expect(PP_STEPS[0].emits).toContain('neutrino')
    expect(PP_STEPS[1].emits).toContain('gamma')
    expect(PP_STEPS[2].out).toEqual([4])
    expect(PP_STEPS[2].emits.filter((e) => e === 'proton')).toHaveLength(2)
  })
})

describe('the missing mass', () => {
  it('is about 0.7% of what went in', () => {
    expect(MASS_4H_U).toBeGreaterThan(MASS_HE4_U)
    expect(sunMassDefectFraction()).toBeGreaterThan(0.006)
    expect(sunMassDefectFraction()).toBeLessThan(0.008)
  })
})

describe('the energy valley', () => {
  it('rises to iron and falls after it', () => {
    const fe = ENERGY_VALLEY.find((a) => a.symbol === 'Fe')!
    for (const a of ENERGY_VALLEY) expect(a.bindMeV).toBeLessThanOrEqual(fe.bindMeV)
    // monotonic climb up to iron (by mass number), then uranium sits lower
    const upToFe = ENERGY_VALLEY.filter((a) => a.massNumber <= 56)
    for (let i = 1; i < upToFe.length; i++) {
      expect(upToFe[i].bindMeV).toBeGreaterThan(upToFe[i - 1].bindMeV)
    }
    const u = ENERGY_VALLEY.find((a) => a.symbol === 'U')!
    expect(u.bindMeV).toBeLessThan(fe.bindMeV)
  })

  it('fusion H→He and fission U→(mid) both roll downhill', () => {
    const bind = (s: string) => ENERGY_VALLEY.find((a) => a.symbol === s)!.bindMeV
    expect(bind('He')).toBeGreaterThan(bind('H')) // joining releases energy
    expect(bind('Fe')).toBeGreaterThan(bind('U')) // splitting toward the middle too
  })
})
