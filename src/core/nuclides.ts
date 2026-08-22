// A06: nuclear stability. Depends ONLY on the nucleus (protons + neutrons) —
// never on electrons: charge and radioactivity are independent properties.

export interface NuclideInfo {
  stability: 'stable' | 'unstable'
  /** 0..1 — how far outside the valley of stability; drives how strongly
   *  the nucleus trembles in the UI. 0 for stable nuclides. */
  instability: number
}

/** Exact stable neutron counts for the light elements (Z ≤ 20), from the
 *  chart of nuclides. (Ca-48 included: its half-life of ~6×10¹⁹ years is
 *  longer than the universe has existed.) */
const STABLE_N_LIGHT: Record<number, number[]> = {
  1: [0, 1], // H, D
  2: [1, 2], // He-3, He-4
  3: [3, 4], // Li-6, Li-7
  4: [5], // Be-9
  5: [5, 6], // B-10, B-11
  6: [6, 7], // C-12, C-13
  7: [7, 8], // N-14, N-15
  8: [8, 9, 10], // O-16..18
  9: [10], // F-19
  10: [10, 11, 12], // Ne-20..22
  11: [12], // Na-23
  12: [12, 13, 14], // Mg-24..26
  13: [14], // Al-27
  14: [14, 15, 16], // Si-28..30
  15: [16], // P-31
  16: [16, 17, 18, 20], // S-32..34, S-36
  17: [18, 20], // Cl-35, Cl-37
  18: [18, 20, 22], // Ar-36, Ar-38, Ar-40
  19: [20, 22], // K-39, K-41 (K-40 is radioactive!)
  20: [20, 22, 23, 24, 26, 28], // Ca-40..48
}

/** Technetium and promethium: no stable isotopes at all. */
const NO_STABLE_ISOTOPES = new Set([43, 61])

/** Nothing is stable beyond lead (bismuth's α decay was measured in 2003). */
const HEAVIEST_STABLE_Z = 82

/**
 * Stability of a nuclide. Exact for Z ≤ 20 (curated data above); for
 * 21 ≤ Z ≤ 82 an approximate valley-of-stability model is used
 * (Z_optimal = A / (1.98 + 0.0155·A^⅔), with the odd-odd rule — a
 * simplification that gets the common cases right but not every nuclide).
 * Returns null for an empty nucleus.
 */
/** Neutron drip line: the most neutrons a nucleus with Z protons can hold —
 *  one more simply falls off (in ~10⁻²² s; beyond it there is no nucleus at
 *  all). Measured values for Z ≤ 10; a documented approximation beyond.
 *  Z = 0: a single neutron exists, a "dineutron" does not. */
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
  return Math.min(200, Math.round(1.75 * protons + 7))
}

/** A sensible default neutron count when loading an element (P03): the
 *  lightest stable isotope for Z ≤ 20 (which is also the most common one
 *  there), and the valley-of-stability optimum beyond — e.g. gold loads as
 *  roughly Au-197, uranium as roughly U-237. */
export function typicalNeutrons(protons: number): number {
  if (protons < 1) return 0
  if (protons <= 20) return STABLE_N_LIGHT[protons][0]
  // solve A ≈ Z·(1.98 + 0.0155·A^⅔) by fixed-point iteration
  let a = 2 * protons
  for (let i = 0; i < 6; i++) {
    a = protons * (1.98 + 0.0155 * Math.pow(a, 2 / 3))
  }
  return Math.min(maxNeutronsFor(protons), Math.round(a) - protons)
}

export type DecayMode = 'alpha' | 'beta-minus' | 'beta-plus'

/**
 * How an unstable nuclide decays — simplified (A07): heavy elements
 * (Z > 82) α-decay; lighter unstable nuclides β⁻ when neutron-rich and β⁺
 * when proton-rich. Real decay chains mix modes (e.g. Th-234 is actually
 * β⁻); this model keeps the pedagogy clean. Returns null for stable nuclides.
 */
export function decayMode(protons: number, neutrons: number): DecayMode | null {
  const info = nuclideStability(protons, neutrons)
  if (!info || info.stability === 'stable') return null
  if (protons === 0) return 'beta-minus' // a free neutron β⁻-decays
  if (protons > HEAVIEST_STABLE_Z && protons >= 2 && neutrons >= 2) return 'alpha'
  if (protons <= 20) {
    const stableNs = STABLE_N_LIGHT[protons] ?? []
    if (stableNs.length > 0) {
      const nearest = stableNs.reduce((best, cand) =>
        Math.abs(cand - neutrons) < Math.abs(best - neutrons) ? cand : best,
      )
      return neutrons > nearest ? 'beta-minus' : 'beta-plus'
    }
    return 'beta-minus'
  }
  const a = protons + neutrons
  const zOptimal = a / (1.98 + 0.0155 * Math.pow(a, 2 / 3))
  return protons < zOptimal ? 'beta-minus' : 'beta-plus'
}

export function nuclideStability(
  protons: number,
  neutrons: number,
): NuclideInfo | null {
  const a = protons + neutrons
  if (a === 0) return null
  if (protons === 0) {
    // free neutrons decay in about 15 minutes
    return { stability: 'unstable', instability: 0.6 }
  }
  if (protons <= 20) {
    const stableNs = STABLE_N_LIGHT[protons] ?? []
    if (stableNs.includes(neutrons)) return { stability: 'stable', instability: 0 }
    const distance = Math.min(
      99,
      ...stableNs.map((n) => Math.abs(n - neutrons)),
    )
    return { stability: 'unstable', instability: Math.min(1, distance / 4) }
  }
  if (protons > HEAVIEST_STABLE_Z) {
    return {
      stability: 'unstable',
      instability: Math.min(1, 0.4 + (protons - HEAVIEST_STABLE_Z) * 0.03),
    }
  }
  if (NO_STABLE_ISOTOPES.has(protons)) {
    return { stability: 'unstable', instability: 0.35 }
  }
  const zOptimal = a / (1.98 + 0.0155 * Math.pow(a, 2 / 3))
  const deviation = Math.abs(protons - zOptimal)
  const bothOdd = protons % 2 === 1 && neutrons % 2 === 1
  if (bothOdd) {
    // beyond the few light exceptions, odd-odd nuclides are radioactive
    return { stability: 'unstable', instability: Math.min(1, 0.3 + deviation / 4) }
  }
  const bothEven = protons % 2 === 0 && neutrons % 2 === 0
  const tolerance = bothEven ? 2 : 1.1
  if (deviation <= tolerance) return { stability: 'stable', instability: 0 }
  return {
    stability: 'unstable',
    instability: Math.min(1, (deviation - tolerance) / 4),
  }
}
