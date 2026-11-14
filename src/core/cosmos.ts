// R04 — 🌟 Cosmic origins (☀️ Why the Sun shines, first story). Pure data
// and rules; the canvas lives in stage/CosmosStage.tsx.
//
// Curated, not a general simulation (spec philosophy): real, rounded
// textbook values throughout — the Sun's recipe, the pp-chain's nucleon
// bookkeeping, the 0.7% missing mass, and the energy valley that unifies
// this demo with the bomb demo (fusion = the left slope, fission = the
// right slope, iron at the bottom).

// ---------- what the Sun is made of (the recipe beat) ----------
// By MASS, rounded: out of every 100 kg of Sun, ~73 kg is hydrogen, ~25 kg
// helium, ~2 kg everything else (oxygen, carbon, neon, iron…). Counted by
// ATOMS hydrogen is even more dominant (~92%) — we show the weighed recipe
// because kilograms are touchable; the info panel says which one it is.

export interface SunIngredient {
  id: 'h' | 'he' | 'other'
  name: string
  massPct: number
}

export const SUN_RECIPE: SunIngredient[] = [
  { id: 'h', name: 'hydrogen', massPct: 73 },
  { id: 'he', name: 'helium', massPct: 25 },
  { id: 'other', name: 'everything else', massPct: 2 },
]

// ---------- the pp-chain (the close-up script's bookkeeping) ----------
// The Sun's main recipe (pp-I), shown honestly in three steps:
//   1. p + p   → ²H (deuterium) + e⁺ (positron) + ν (neutrino)
//   2. ²H + p  → ³He + γ
//   3. ³He + ³He → ⁴He + p + p
// Net: 4 protons in → one helium-4 + 2 e⁺ + 2 ν + light.

export interface PpStep {
  /** mass numbers in */
  in: number[]
  /** mass numbers out (nuclei only) */
  out: number[]
  /** extra outgoing particles */
  emits: Array<'positron' | 'neutrino' | 'gamma' | 'proton'>
  equation: string
}

export const PP_STEPS: PpStep[] = [
  { in: [1, 1], out: [2], emits: ['positron', 'neutrino'], equation: 'p + p → ²H + e⁺ + ν' },
  { in: [2, 1], out: [3], emits: ['gamma'], equation: '²H + p → ³He + γ' },
  { in: [3, 3], out: [4], emits: ['proton', 'proton'], equation: '³He + ³He → ⁴He + p + p' },
]

// ---------- the missing mass (the ⚖️ scale beat) ----------
// Real atomic masses, rounded: 4 hydrogens weigh 4.0313 u; one helium-4
// weighs 4.0026 u. The missing ~0.7% leaves as light (E = mc²).

export const MASS_4H_U = 4 * 1.00783
export const MASS_HE4_U = 4.0026

/** the share of the mass that becomes light, ≈ 0.007 */
export function sunMassDefectFraction(): number {
  return (MASS_4H_U - MASS_HE4_U) / MASS_4H_U
}

/** the Sun gets ~4 million tonnes lighter every second — all of it sunshine */
export const SUN_LIGHTER_TONNES_PER_S = 4_000_000

/** a newborn photon needs ~100,000 years to random-walk OUT of the Sun… */
export const PHOTON_ESCAPE_YEARS = 100_000
/** …and then 8 minutes to reach Earth */
export const SUN_TO_EARTH_MINUTES = 8

// ---------- the energy valley (the payoff beat) ----------
// Binding energy per nucleon (MeV, rounded): rolling DOWN this hill
// releases energy. Light nuclei roll down by JOINING (fusion, the Sun),
// heavy ones by SPLITTING (fission, the bomb demo). Iron sits at the
// bottom — the ash of the universe.

export interface ValleyAnchor {
  symbol: string
  name: string
  massNumber: number
  bindMeV: number
}

export const ENERGY_VALLEY: ValleyAnchor[] = [
  { symbol: 'H', name: 'hydrogen', massNumber: 1, bindMeV: 0 },
  { symbol: '²H', name: 'deuterium', massNumber: 2, bindMeV: 1.11 },
  { symbol: '³He', name: 'helium-3', massNumber: 3, bindMeV: 2.57 },
  { symbol: 'He', name: 'helium-4', massNumber: 4, bindMeV: 7.07 },
  { symbol: 'C', name: 'carbon', massNumber: 12, bindMeV: 7.68 },
  { symbol: 'O', name: 'oxygen', massNumber: 16, bindMeV: 7.98 },
  { symbol: 'Fe', name: 'iron', massNumber: 56, bindMeV: 8.79 },
  { symbol: 'U', name: 'uranium', massNumber: 238, bindMeV: 7.57 },
]
