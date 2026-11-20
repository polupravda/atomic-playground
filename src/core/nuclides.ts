import { HALF_LIFE_ALPHABET, HALF_LIFE_OFFSET, NUCLIDES } from './nuclideData'

// A06: nuclear stability. Depends ONLY on the nucleus (protons + neutrons) —
// never on electrons: charge and radioactivity are independent properties.

export interface NuclideInfo {
  stability: 'stable' | 'unstable'
  /** 0..1 — how violently radioactive; drives how strongly the nucleus
   *  trembles in the UI. From the real half-life where it is known (shorter
   *  life → stronger tremble), else from the distance to the valley of
   *  stability. 0 for stable nuclides. */
  instability: number
}

// Stability, decay modes and default isotopes come from evaluated data —
// the IAEA chart of nuclides, compiled into nuclideData.ts by
// scripts/nuclide-data/generate.mjs. "Stable" = never seen to decay, or a
// half-life over 10¹⁸ years (Ca-48, Te-128 …); nothing beyond lead. The
// valley-of-stability formula below is only a FALLBACK for proton/neutron
// combinations nobody has ever made or measured. (Until 2026-11-20 the
// formula decided everything from Z = 21 up and got famous cases wrong:
// Pb-210 and Fe-60 "stable", gold loading as radioactive Au-198.)

/** The data's one-letter code for this nuclide, or null if unmeasured. */
function dataCode(protons: number, neutrons: number): string | null {
  const el = NUCLIDES[protons]
  if (!el) return null
  const c = el.modes[neutrons - el.n0]
  return c && c !== '?' ? c : null
}

/** Measured half-life in seconds, or null if stable / unknown. */
export function halfLifeSeconds(protons: number, neutrons: number): number | null {
  const el = NUCLIDES[protons]
  const c = el?.halfLives[neutrons - el.n0]
  if (!c || c === '.') return null
  return Math.pow(10, HALF_LIFE_ALPHABET.indexOf(c) - HALF_LIFE_OFFSET)
}

/** Nothing is stable beyond lead (bismuth's α decay was measured in 2003). */
const HEAVIEST_STABLE_Z = 82

/** Neutron drip line: the most neutrons a nucleus with Z protons can hold —
 *  one more simply falls off (in ~10⁻²² s). Measured values for Z ≤ 10; for
 *  heavier elements an approximation, raised where needed so every isotope
 *  in the chart can be built. Z = 0: a single neutron exists, a "dineutron"
 *  does not. */
const NEUTRON_DRIP_LIGHT: Record<number, number> = {
  0: 1, // n
  1: 2, // H-3
  2: 6, // He-8
  3: 8, // Li-11
  4: 10, // Be-14
  5: 14, // B-19
  6: 16, // C-22
  7: 16, // N-23
  8: 16, // O-24
  9: 22, // F-31
  10: 24, // Ne-34
}

export function maxNeutronsFor(protons: number): number {
  if (protons <= 10) return NEUTRON_DRIP_LIGHT[Math.max(0, protons)] ?? 1
  const el = NUCLIDES[protons]
  const heaviestKnown = el ? el.n0 + el.modes.length - 1 : 0
  return Math.min(200, Math.max(Math.round(1.75 * protons + 7), heaviestKnown))
}

/** The default neutron count when loading an element (P03): the most
 *  abundant isotope in nature (Au-197, Fe-56, U-238), else the longest-lived
 *  one (Tc-97, Pm-145, Pu-244). A few common isotopes are themselves very
 *  slightly radioactive — 96% of indium is In-115, 63% of rhenium Re-187 —
 *  and the app shows them that way, because they are. */
export function typicalNeutrons(protons: number): number {
  if (protons < 1) return 0
  const el = NUCLIDES[protons]
  if (el) return Math.min(maxNeutronsFor(protons), el.typical)
  return Math.min(maxNeutronsFor(protons), Math.round(valleyMassNumber(protons)) - protons)
}

/** Mass number at the bottom of the valley of stability for Z protons. */
function valleyMassNumber(protons: number): number {
  // solve A ≈ Z·(1.98 + 0.0155·A^⅔) by fixed-point iteration
  let a = 2 * protons
  for (let i = 0; i < 6; i++) a = protons * (1.98 + 0.0155 * Math.pow(a, 2 / 3))
  return a
}

/**
 * How an unstable nuclide decays (A07): its main measured decay mode.
 *  - beta-plus: a positron flies out (the nucleus may ALSO capture an
 *    electron; the data lists both together when there is energy enough)
 *  - electron-capture: the nucleus swallows one of the atom's own inner
 *    electrons — the only option when there isn't energy for a positron
 *  - proton / neutron: the nucleus is so lopsided that a single nucleon
 *    just falls out (beyond the drip lines)
 *  - fission: the nucleus splits in two (very heavy elements)
 * Unmeasured nuclides fall back to the textbook rule: heavy → α,
 * neutron-rich → β⁻, proton-rich → β⁺. Returns null for stable nuclides.
 */
export type DecayMode =
  | 'alpha'
  | 'beta-minus'
  | 'beta-plus'
  | 'electron-capture'
  | 'proton'
  | 'neutron'
  | 'fission'

const MODE_BY_CODE: Record<string, DecayMode> = {
  A: 'alpha',
  M: 'beta-minus',
  P: 'beta-plus',
  E: 'electron-capture',
  p: 'proton',
  n: 'neutron',
  F: 'fission',
}

export function decayMode(protons: number, neutrons: number): DecayMode | null {
  const info = nuclideStability(protons, neutrons)
  if (!info || info.stability === 'stable') return null
  const code = dataCode(protons, neutrons)
  if (code && MODE_BY_CODE[code]) return MODE_BY_CODE[code]
  // fallback for unmeasured nuclides
  if (protons === 0) return 'beta-minus'
  if (protons > HEAVIEST_STABLE_Z && neutrons >= 2) return 'alpha'
  const a = protons + neutrons
  const zOptimal = a / (1.98 + 0.0155 * Math.pow(a, 2 / 3))
  return protons < zOptimal ? 'beta-minus' : 'beta-plus'
}

/** Tremble strength from a half-life: ~3 billion years or longer → 0.12
 *  (barely), a free neutron's 10 minutes → ~0.7, a millisecond → 1. */
function instabilityFromHalfLife(seconds: number): number {
  return Math.min(1, Math.max(0.12, (17 - Math.log10(seconds)) / 20))
}

export function nuclideStability(
  protons: number,
  neutrons: number,
): NuclideInfo | null {
  const a = protons + neutrons
  if (a === 0) return null
  const code = dataCode(protons, neutrons)
  if (code === 'S') return { stability: 'stable', instability: 0 }
  if (code) {
    const t = halfLifeSeconds(protons, neutrons)
    return {
      stability: 'unstable',
      instability: t === null ? 0.6 : instabilityFromHalfLife(t),
    }
  }
  // Fallback: a combination nobody has measured — far from the valley.
  if (protons === 0) return { stability: 'unstable', instability: 1 }
  const zOptimal = a / (1.98 + 0.0155 * Math.pow(a, 2 / 3))
  const deviation = Math.abs(protons - zOptimal)
  return { stability: 'unstable', instability: Math.min(1, 0.6 + deviation / 10) }
}
