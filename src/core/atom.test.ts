import { describe, expect, it } from 'vitest'
import {
  charge,
  chargeLabel,
  isotopeLabel,
  massNumber,
  neutralShellConfiguration,
  outerShellElectrons,
  shellCapacity,
  shellConfiguration,
  shellOccupancy,
  subshellConfiguration,
  subshellLabel,
} from './atom'

describe('charge (A04)', () => {
  it('is protons − electrons', () => {
    expect(charge(6, 6)).toBe(0)
    expect(charge(11, 10)).toBe(1) // Na⁺
    expect(charge(17, 18)).toBe(-1) // Cl⁻
  })

  it('formats with chemistry convention', () => {
    expect(chargeLabel(6, 6)).toBe('')
    expect(chargeLabel(11, 10)).toBe('+')
    expect(chargeLabel(12, 10)).toBe('2+')
    expect(chargeLabel(17, 18)).toBe('−')
    expect(chargeLabel(7, 10)).toBe('3−')
  })
})

describe('isotopes (A05)', () => {
  it('mass number is protons + neutrons', () => {
    expect(massNumber(6, 6)).toBe(12)
    expect(massNumber(6, 8)).toBe(14)
  })

  it('formats isotope notation; element identity ignores neutrons', () => {
    expect(isotopeLabel(6, 6)).toBe('C-12')
    expect(isotopeLabel(6, 7)).toBe('C-13')
    expect(isotopeLabel(6, 8)).toBe('C-14')
    expect(isotopeLabel(0, 5)).toBeNull()
  })
})

describe('shell model (A11/A12)', () => {
  it('fills shells pedagogically', () => {
    expect(shellOccupancy(0)).toEqual([])
    expect(shellOccupancy(1)).toEqual([1]) // H
    expect(shellOccupancy(2)).toEqual([2]) // He
    expect(shellOccupancy(3)).toEqual([2, 1]) // Li
    expect(shellOccupancy(10)).toEqual([2, 8]) // Ne
    expect(shellOccupancy(11)).toEqual([2, 8, 1]) // Na
    expect(shellOccupancy(18)).toEqual([2, 8, 8]) // Ar
    expect(shellOccupancy(19)).toEqual([2, 8, 8, 1]) // K: 4s before 3d
    expect(shellOccupancy(26)).toEqual([2, 8, 14, 2]) // Fe
  })

  it('conserves the electron count', () => {
    for (const n of [1, 7, 26, 79, 118, 200]) {
      const total = shellOccupancy(n).reduce((a, b) => a + b, 0)
      expect(total).toBe(n)
    }
  })

  it('defines shell capacities as 2n² capped at 32', () => {
    expect([1, 2, 3, 4, 5].map(shellCapacity)).toEqual([2, 8, 18, 32, 32])
  })

  it('never fills a shell beyond its capacity', () => {
    for (const n of [1, 11, 19, 26, 79, 118, 200]) {
      shellOccupancy(n).forEach((count, si) => {
        expect(count).toBeLessThanOrEqual(shellCapacity(si + 1))
      })
    }
  })

  it('configures ions by removing from the outermost shell first', () => {
    expect(shellConfiguration(11, 11)).toEqual([2, 8, 1]) // Na
    expect(shellConfiguration(11, 10)).toEqual([2, 8]) // Na⁺
    expect(shellConfiguration(26, 26)).toEqual([2, 8, 14, 2]) // Fe
    expect(shellConfiguration(26, 24)).toEqual([2, 8, 14]) // Fe²⁺: loses shell 4
    expect(shellConfiguration(26, 23)).toEqual([2, 8, 13]) // Fe³⁺
    expect(shellConfiguration(17, 18)).toEqual([2, 8, 8]) // Cl⁻: aufbau
    expect(shellConfiguration(0, 3)).toEqual([2, 1]) // electrons without element
    expect(shellConfiguration(6, 0)).toEqual([])
  })

  it('uses measured configurations for the aufbau-exception elements', () => {
    expect(neutralShellConfiguration(24)).toEqual([2, 8, 13, 1]) // Cr
    expect(neutralShellConfiguration(29)).toEqual([2, 8, 18, 1]) // Cu
    expect(neutralShellConfiguration(46)).toEqual([2, 8, 18, 18]) // Pd
    expect(neutralShellConfiguration(79)).toEqual([2, 8, 18, 32, 18, 1]) // Au
    expect(neutralShellConfiguration(103)).toEqual([2, 8, 18, 32, 32, 8, 3]) // Lr
    // non-exceptional elements keep idealized aufbau
    expect(neutralShellConfiguration(26)).toEqual(shellOccupancy(26)) // Fe
  })

  it('derives ions of exceptional elements from their real base', () => {
    expect(shellConfiguration(29, 28)).toEqual([2, 8, 18]) // Cu⁺: 3d¹⁰
    expect(shellConfiguration(79, 78)).toEqual([2, 8, 18, 32, 18]) // Au⁺: 5d¹⁰
    expect(shellConfiguration(46, 45)).toEqual([2, 8, 18, 17]) // Pd⁺: 4d⁹
  })

  it('keeps every neutral configuration consistent for all 118 elements', () => {
    for (let z = 1; z <= 118; z++) {
      const shells = neutralShellConfiguration(z)
      expect(shells.reduce((a, b) => a + b, 0)).toBe(z)
      shells.forEach((count, si) => {
        expect(count).toBeGreaterThanOrEqual(0)
        expect(count).toBeLessThanOrEqual(shellCapacity(si + 1))
      })
      expect(shells[shells.length - 1]).toBeGreaterThan(0)
    }
  })

  it('never drains an inner shell while an outer one is occupied', () => {
    for (const p of [19, 26, 79, 118]) {
      for (let e = 0; e <= p; e++) {
        const shells = shellConfiguration(p, e)
        // every shell except the outermost must be at its neutral-atom level
        const neutral = neutralShellConfiguration(p)
        shells.slice(0, -1).forEach((count, si) => {
          expect(count).toBe(neutral[si])
        })
        expect(shells.reduce((a, b) => a + b, 0)).toBe(e)
      }
    }
  })

  it('builds potassium sensibly while protons are already in place', () => {
    // With 19 protons fixed, the 4th shell appears only for the 19th electron.
    expect(shellConfiguration(19, 18)).toEqual([2, 8, 8])
    expect(shellConfiguration(19, 19)).toEqual([2, 8, 8, 1])
  })

  it('fills subshells in Madelung order (A16 orbitals view)', () => {
    expect(subshellConfiguration(6)).toEqual([
      { n: 1, l: 0, electrons: 2 },
      { n: 2, l: 0, electrons: 2 },
      { n: 2, l: 1, electrons: 2 },
    ]) // carbon: 1s² 2s² 2p²
    const sodium = subshellConfiguration(11)
    expect(sodium[sodium.length - 1]).toEqual({ n: 3, l: 0, electrons: 1 }) // 3s¹
    const potassium = subshellConfiguration(19)
    expect(potassium[potassium.length - 1]).toEqual({ n: 4, l: 0, electrons: 1 }) // 4s before 3d
    expect(subshellConfiguration(0)).toEqual([])
    // conservation
    for (const e of [1, 11, 26, 79, 118]) {
      expect(subshellConfiguration(e).reduce((a, s) => a + s.electrons, 0)).toBe(e)
    }
  })

  it('names subshells conventionally', () => {
    expect(subshellLabel(1, 0)).toBe('1s')
    expect(subshellLabel(2, 1)).toBe('2p')
    expect(subshellLabel(3, 2)).toBe('3d')
    expect(subshellLabel(4, 3)).toBe('4f')
  })

  it('reports outer-shell electrons (P05)', () => {
    expect(outerShellElectrons(0)).toBe(0)
    expect(outerShellElectrons(11)).toBe(1) // Na
    expect(outerShellElectrons(17)).toBe(7) // Cl
  })
})
