// Pure derivations from raw particle counts. These functions are the single
// place where the scientific rules of the spec live:
//   protons  → element   (A03)
//   neutrons → isotope   (A05)
//   electrons → charge   (A04)
import { elementForProtons } from './elements'

/** A04: charge = protons − electrons. */
export function charge(protons: number, electrons: number): number {
  return protons - electrons
}

/** Ion notation per chemistry convention: '' (neutral), '+', '2+', '−', '3−'. */
export function chargeLabel(protons: number, electrons: number): string {
  const q = charge(protons, electrons)
  if (q === 0) return ''
  const magnitude = Math.abs(q) === 1 ? '' : String(Math.abs(q))
  return magnitude + (q > 0 ? '+' : '−')
}

/** Mass number A = protons + neutrons. */
export function massNumber(protons: number, neutrons: number): number {
  return protons + neutrons
}

/** A05: isotope notation like 'C-14'. Null when there is no element yet. */
export function isotopeLabel(protons: number, neutrons: number): string | null {
  const element = elementForProtons(protons)
  if (!element) return null
  return `${element.symbol}-${massNumber(protons, neutrons)}`
}

// --- Shell model (A11/A12) --------------------------------------------------
//
// Pedagogical model: subshells fill in the idealized aufbau (Madelung) order
// and are grouped by principal quantum number n into shells. This reproduces
// the school-book "electrons per shell" (Na → 2,8,1; Fe → 2,8,14,2). It is a
// simplification (F01): a handful of real elements (Cr, Cu, ...) deviate from
// the idealized order, and shells are not literal orbits.

const SUBSHELL_CAPACITY = [2, 6, 10, 14] // s, p, d, f

interface SubshellId {
  n: number
  l: number
}

// Subshells in Madelung order: ascending (n + l), ties broken by ascending n.
// n ≤ 9 gives capacity 220, covering the store's 200-electron limit (real
// elements need only n ≤ 7; the extra shells are for playful extremes).
const MADELUNG_ORDER: SubshellId[] = []
for (let n = 1; n <= 9; n++) {
  for (let l = 0; l < Math.min(n, SUBSHELL_CAPACITY.length); l++) {
    MADELUNG_ORDER.push({ n, l })
  }
}
MADELUNG_ORDER.sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n)

/**
 * A12: electrons per shell, index 0 = innermost shell (n = 1).
 * shellOccupancy(11) → [2, 8, 1]. Returns [] for 0 electrons.
 */
export function shellOccupancy(electrons: number): number[] {
  const shells: number[] = []
  let remaining = electrons
  for (const { n, l } of MADELUNG_ORDER) {
    if (remaining <= 0) break
    const placed = Math.min(remaining, SUBSHELL_CAPACITY[l])
    shells[n - 1] = (shells[n - 1] ?? 0) + placed
    remaining -= placed
  }
  // Inner shells always exist once filled, so no holes remain — but normalize
  // any trailing gap defensively.
  for (let i = 0; i < shells.length; i++) shells[i] = shells[i] ?? 0
  return shells
}

/**
 * Real ground-state electrons-per-shell for the ~20 elements whose measured
 * configuration deviates from idealized Madelung filling (the textbook
 * "aufbau exceptions"), viewed at shell granularity. Sub-shell notation in
 * the comments; every array sums to the atomic number.
 */
const NEUTRAL_CONFIG_EXCEPTIONS: Readonly<Record<number, readonly number[]>> = {
  24: [2, 8, 13, 1], // Cr: [Ar] 3d⁵ 4s¹
  29: [2, 8, 18, 1], // Cu: [Ar] 3d¹⁰ 4s¹
  41: [2, 8, 18, 12, 1], // Nb: [Kr] 4d⁴ 5s¹
  42: [2, 8, 18, 13, 1], // Mo: [Kr] 4d⁵ 5s¹
  44: [2, 8, 18, 15, 1], // Ru: [Kr] 4d⁷ 5s¹
  45: [2, 8, 18, 16, 1], // Rh: [Kr] 4d⁸ 5s¹
  46: [2, 8, 18, 18], // Pd: [Kr] 4d¹⁰ (no 5s electron)
  47: [2, 8, 18, 18, 1], // Ag: [Kr] 4d¹⁰ 5s¹
  57: [2, 8, 18, 18, 9, 2], // La: [Xe] 5d¹ 6s²
  58: [2, 8, 18, 19, 9, 2], // Ce: [Xe] 4f¹ 5d¹ 6s²
  64: [2, 8, 18, 25, 9, 2], // Gd: [Xe] 4f⁷ 5d¹ 6s²
  78: [2, 8, 18, 32, 17, 1], // Pt: [Xe] 4f¹⁴ 5d⁹ 6s¹
  79: [2, 8, 18, 32, 18, 1], // Au: [Xe] 4f¹⁴ 5d¹⁰ 6s¹
  89: [2, 8, 18, 32, 18, 9, 2], // Ac: [Rn] 6d¹ 7s²
  90: [2, 8, 18, 32, 18, 10, 2], // Th: [Rn] 6d² 7s²
  91: [2, 8, 18, 32, 20, 9, 2], // Pa: [Rn] 5f² 6d¹ 7s²
  92: [2, 8, 18, 32, 21, 9, 2], // U: [Rn] 5f³ 6d¹ 7s²
  93: [2, 8, 18, 32, 22, 9, 2], // Np: [Rn] 5f⁴ 6d¹ 7s²
  96: [2, 8, 18, 32, 25, 9, 2], // Cm: [Rn] 5f⁷ 6d¹ 7s²
  103: [2, 8, 18, 32, 32, 8, 3], // Lr: [Rn] 5f¹⁴ 7s² 7p¹ (not 6d¹)
}

/** Electrons per shell of a NEUTRAL element: idealized aufbau, overridden by
 *  the measured configuration for the exceptional elements above. */
export function neutralShellConfiguration(protons: number): number[] {
  const exception = NEUTRAL_CONFIG_EXCEPTIONS[protons]
  return exception ? exception.slice() : shellOccupancy(protons)
}

/**
 * Shell occupancy of an atom or ion with the given proton and electron
 * counts. The physics: shellOccupancy() describes a NEUTRAL ground state;
 * ions do not simply re-run aufbau for the new count. Cations lose electrons
 * from the outermost shell first (Fe²⁺ is 2,8,14 — it loses its shell-4
 * electrons, not inner ones), so:
 *   - electrons ≤ protons: the element's neutral configuration (including
 *     the aufbau exceptions, so Cu⁺ = 2,8,18 and Au⁺ = 2,8,18,32,18) with
 *     the missing electrons removed outermost-shell-first;
 *   - electrons > protons (anion, or no element yet): aufbau filling by
 *     count — a simplification for anions of exceptional elements, which
 *     are rare enough not to matter pedagogically.
 * Guarantees an outer shell can never hold electrons while a removal drains
 * an inner one.
 */
export function shellConfiguration(protons: number, electrons: number): number[] {
  if (electrons <= 0) return []
  if (electrons > protons) return shellOccupancy(electrons)
  const shells = neutralShellConfiguration(protons)
  let toRemove = protons - electrons
  for (let s = shells.length - 1; s >= 0 && toRemove > 0; s--) {
    const take = Math.min(shells[s], toRemove)
    shells[s] -= take
    toRemove -= take
  }
  while (shells.length > 0 && shells[shells.length - 1] === 0) shells.pop()
  return shells
}

/**
 * Slot capacity of shell n (1-based) in the pedagogical model: 2n², capped at
 * 32 — no known element puts more than 32 electrons in one shell, so showing
 * the formula's 50 slots for n = 5 would mislead more than it teaches.
 */
export function shellCapacity(n: number): number {
  return Math.min(2 * n * n, 32)
}

export interface Subshell {
  n: number
  l: number
  electrons: number
}

/**
 * Occupied subshells (1s, 2s, 2p, ...) in Madelung fill order for a given
 * electron count. Idealized aufbau at subshell granularity — the per-element
 * exceptions and ion rules above apply only to the shell-level view; this
 * feeds the orbitals view, where the idealization is a documented
 * simplification (F01).
 */
export function subshellConfiguration(electrons: number): Subshell[] {
  const result: Subshell[] = []
  let remaining = electrons
  for (const { n, l } of MADELUNG_ORDER) {
    if (remaining <= 0) break
    const placed = Math.min(remaining, SUBSHELL_CAPACITY[l])
    result.push({ n, l, electrons: placed })
    remaining -= placed
  }
  return result
}

/**
 * The aufbau exceptions above at SUBSHELL granularity: only the subshells
 * whose measured occupancy differs from idealized Madelung filling. A test
 * guarantees these agree with NEUTRAL_CONFIG_EXCEPTIONS shell by shell.
 */
const SUBSHELL_EXCEPTIONS: Readonly<Record<number, Readonly<Record<string, number>>>> = {
  24: { '3d': 5, '4s': 1 }, // Cr
  29: { '3d': 10, '4s': 1 }, // Cu
  41: { '4d': 4, '5s': 1 }, // Nb
  42: { '4d': 5, '5s': 1 }, // Mo
  44: { '4d': 7, '5s': 1 }, // Ru
  45: { '4d': 8, '5s': 1 }, // Rh
  46: { '4d': 10, '5s': 0 }, // Pd
  47: { '4d': 10, '5s': 1 }, // Ag
  57: { '4f': 0, '5d': 1 }, // La
  58: { '4f': 1, '5d': 1 }, // Ce
  64: { '4f': 7, '5d': 1 }, // Gd
  78: { '5d': 9, '6s': 1 }, // Pt
  79: { '5d': 10, '6s': 1 }, // Au
  89: { '5f': 0, '6d': 1 }, // Ac
  90: { '5f': 0, '6d': 2 }, // Th
  91: { '5f': 2, '6d': 1 }, // Pa
  92: { '5f': 3, '6d': 1 }, // U
  93: { '5f': 4, '6d': 1 }, // Np
  96: { '5f': 7, '6d': 1 }, // Cm
  103: { '6d': 0, '7p': 1 }, // Lr
}

/**
 * Occupied subshells of an atom or ion — the SAME electrons the shell view
 * shows, split into s/p/d/f (so the shells ⇄ orbitals morph never has to
 * invent or lose an electron). Mirrors shellConfiguration():
 *   - electrons ≤ protons: the element's neutral configuration (with the
 *     aufbau exceptions), then electrons removed from the outermost shell
 *     first — highest n, and within a shell the highest l first. So Fe²⁺
 *     loses its 4s electrons (3d⁶, not 4s² 3d⁴), as real cations do.
 *   - electrons > protons (anion, or no element yet): idealized filling.
 * Subshells come in Madelung order; empty ones are left out.
 */
export function subshellConfigurationFor(protons: number, electrons: number): Subshell[] {
  if (electrons <= 0) return []
  if (electrons > protons) return subshellConfiguration(electrons)
  const neutral = subshellConfiguration(protons)
  const exception = SUBSHELL_EXCEPTIONS[protons]
  if (exception) {
    for (const [label, count] of Object.entries(exception)) {
      const existing = neutral.find((s) => subshellLabel(s.n, s.l) === label)
      if (existing) existing.electrons = count
      else {
        const n = Number(label.slice(0, -1))
        const l = 'spdf'.indexOf(label.slice(-1))
        neutral.push({ n, l, electrons: count })
      }
    }
    const rank = (s: Subshell) =>
      MADELUNG_ORDER.findIndex((m) => m.n === s.n && m.l === s.l)
    neutral.sort((a, b) => rank(a) - rank(b))
  }
  let toRemove = protons - electrons
  const removalOrder = neutral.slice().sort((a, b) => b.n - a.n || b.l - a.l)
  for (const sub of removalOrder) {
    if (toRemove <= 0) break
    const take = Math.min(sub.electrons, toRemove)
    sub.electrons -= take
    toRemove -= take
  }
  return neutral.filter((s) => s.electrons > 0)
}

/** Conventional subshell name: 1s, 2p, 3d... */
export function subshellLabel(n: number, l: number): string {
  return `${n}${'spdf'[l] ?? '?'}`
}

/** Electrons in the outermost occupied shell (P05 valence view, bonding). */
export function outerShellElectrons(electrons: number): number {
  const shells = shellOccupancy(electrons)
  return shells.length === 0 ? 0 : shells[shells.length - 1]
}
