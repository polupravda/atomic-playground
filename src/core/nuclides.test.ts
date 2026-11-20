import { describe, expect, it } from 'vitest'
import {
  decayMode,
  maxNeutronsFor,
  nuclideStability,
  typicalNeutrons,
} from './nuclides'

const stab = (p: number, n: number) => nuclideStability(p, n)?.stability

describe('nuclideStability (A06)', () => {
  it('returns null for an empty nucleus', () => {
    expect(nuclideStability(0, 0)).toBeNull()
  })

  it('knows the light nuclides exactly', () => {
    expect(stab(1, 0)).toBe('stable') // H-1
    expect(stab(1, 1)).toBe('stable') // deuterium
    expect(stab(1, 2)).toBe('unstable') // tritium
    expect(stab(6, 6)).toBe('stable') // C-12
    expect(stab(6, 7)).toBe('stable') // C-13
    expect(stab(6, 8)).toBe('unstable') // C-14
    expect(stab(19, 20)).toBe('stable') // K-39
    expect(stab(19, 21)).toBe('unstable') // K-40 — charged? no! just unstable
    expect(stab(19, 22)).toBe('stable') // K-41
  })

  it('handles free neutrons and exotic light nuclei', () => {
    expect(stab(0, 1)).toBe('unstable') // free neutron
    expect(stab(2, 8)).toBe('unstable') // absurdly neutron-rich helium
  })

  it('classifies well-known heavier cases', () => {
    expect(stab(26, 30)).toBe('stable') // Fe-56
    expect(stab(79, 118)).toBe('stable') // Au-197
    expect(stab(82, 126)).toBe('stable') // Pb-208
    expect(stab(27, 33)).toBe('unstable') // Co-60
    expect(stab(53, 78)).toBe('unstable') // I-131
    expect(stab(92, 146)).toBe('unstable') // U-238
    expect(stab(43, 55)).toBe('unstable') // Tc: no stable isotopes
    expect(stab(61, 84)).toBe('unstable') // Pm: no stable isotopes
    expect(stab(94, 150)).toBe('unstable') // Pu
  })

  it('suggests a sensible default isotope for loading (P03)', () => {
    expect(typicalNeutrons(1)).toBe(0) // H-1
    expect(typicalNeutrons(6)).toBe(6) // C-12
    expect(typicalNeutrons(8)).toBe(8) // O-16
    expect(typicalNeutrons(17)).toBe(18) // Cl-35
    expect(typicalNeutrons(26)).toBe(30) // Fe-56
    expect(typicalNeutrons(79)).toBe(118) // Au-197 (was Au-198 from the formula)
    expect(typicalNeutrons(92)).toBe(146) // U-238
    expect(typicalNeutrons(43)).toBe(54) // Tc-97, the longest-lived technetium
    expect(typicalNeutrons(94)).toBe(150) // Pu-244
    // the default must always be a legal (bound) nuclide
    for (let z = 1; z <= 118; z++) {
      expect(typicalNeutrons(z)).toBeLessThanOrEqual(maxNeutronsFor(z))
    }
  })

  it('knows the neutron drip line', () => {
    expect(maxNeutronsFor(0)).toBe(1) // a dineutron does not exist
    expect(maxNeutronsFor(1)).toBe(2) // H-3 is the heaviest hydrogen
    expect(maxNeutronsFor(6)).toBe(16) // C-22
    expect(maxNeutronsFor(8)).toBe(16) // O-24
    expect(maxNeutronsFor(11)).toBe(26) // approximation region
    expect(maxNeutronsFor(92)).toBeGreaterThanOrEqual(146) // U-238 buildable
    expect(maxNeutronsFor(118)).toBeLessThanOrEqual(200)
  })

  it('loads every element up to lead as a stable isotope, except the few whose common isotope is radioactive', () => {
    const radioactiveDefault: number[] = []
    for (let z = 1; z <= 82; z++) {
      if (stab(z, typicalNeutrons(z)) !== 'stable') radioactiveDefault.push(z)
    }
    // Tc and Pm have no stable isotope; 96% of indium is In-115 and 63% of
    // rhenium is Re-187, both (very slowly) radioactive
    expect(radioactiveDefault).toEqual([43, 49, 61, 75])
  })

  it('fixes what the old formula got wrong (science audit 2026-11-20)', () => {
    expect(stab(82, 128)).toBe('unstable') // Pb-210
    expect(stab(26, 34)).toBe('unstable') // Fe-60
    expect(stab(53, 72)).toBe('unstable') // I-125
    expect(stab(79, 117)).toBe('unstable') // Au-196
    expect(stab(20, 28)).toBe('stable') // Ca-48: half-life 10¹⁹ years
    expect(stab(83, 126)).toBe('unstable') // Bi-209 decays, measurably
  })

  it('assigns decay modes (A07, simplified)', () => {
    expect(decayMode(6, 6)).toBeNull() // stable C-12 doesn't decay
    expect(decayMode(92, 146)).toBe('alpha') // U-238
    expect(decayMode(84, 126)).toBe('alpha') // Po-210
    expect(decayMode(6, 8)).toBe('beta-minus') // C-14 (neutron-rich)
    expect(decayMode(6, 5)).toBe('beta-plus') // C-11 (proton-rich)
    expect(decayMode(1, 2)).toBe('beta-minus') // tritium
    expect(decayMode(0, 1)).toBe('beta-minus') // free neutron
    expect(decayMode(53, 78)).toBe('beta-minus') // I-131
    expect(decayMode(4, 3)).toBe('electron-capture') // Be-7: too little energy for β⁺
    expect(decayMode(26, 29)).toBe('electron-capture') // Fe-55
    expect(decayMode(19, 21)).toBe('beta-minus') // K-40 (mostly)
    expect(decayMode(83, 127)).toBe('beta-minus') // Bi-210: heavy, yet β⁻
    expect(decayMode(83, 126)).toBe('alpha') // Bi-209
    expect(decayMode(98, 156)).toBe('fission') // Cf-254
  })

  it('grades instability: further from the valley trembles harder', () => {
    const mild = nuclideStability(6, 8)! // C-14: one neutron over
    const wild = nuclideStability(6, 14)! // C-20: far off the valley
    expect(mild.instability).toBeGreaterThan(0)
    expect(wild.instability).toBeGreaterThan(mild.instability)
    expect(nuclideStability(6, 6)!.instability).toBe(0)
  })
})
