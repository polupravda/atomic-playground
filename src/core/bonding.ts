// B01/B02 — curated bonding scenarios. Per the spec, V1 deliberately does
// NOT ship a universal chemistry engine: whether two atoms bond depends on
// bond type, oxidation states, energetics and conditions, so we curate a
// small set of scientifically valid recipes instead of pretending a simple
// rule decides it (PhET splits atom-building and molecule-building the same
// way).

export interface BondScenario {
  id: string
  formula: string
  name: string
  bondType: 'covalent' | 'ionic'
  /** element symbol → how many atoms the recipe needs */
  atoms: Record<string, number>
  /** kid-friendly account of what happens and why */
  explanation: string
}

export const BOND_SCENARIOS: BondScenario[] = [
  {
    id: 'h2',
    formula: 'H₂',
    name: 'hydrogen molecule',
    bondType: 'covalent',
    atoms: { H: 2 },
    explanation:
      'Each hydrogen atom has just one electron — and room for one more. Watch: both electrons leave their own rings and circle around BOTH nuclei together. That shared pair is a covalent bond!',
  },
  {
    id: 'o2',
    formula: 'O₂',
    name: 'oxygen molecule',
    bondType: 'covalent',
    atoms: { O: 2 },
    explanation:
      'Each oxygen has 6 outer electrons and room for 2 more — so the two atoms share TWO pairs of electrons at once. A double covalent bond! O₂ is the oxygen in every breath you take.',
  },
  {
    id: 'cl2',
    formula: 'Cl₂',
    name: 'chlorine molecule',
    bondType: 'covalent',
    atoms: { Cl: 2 },
    explanation:
      'Each chlorine has 7 outer electrons — one seat free. The two atoms share a single pair: one covalent bond. Chlorine gas is yellow-green; tiny safe amounts of chlorine keep swimming pools clean!',
  },
  {
    id: 'hcl',
    formula: 'HCl',
    name: 'hydrogen chloride',
    bondType: 'covalent',
    atoms: { H: 1, Cl: 1 },
    explanation:
      'Hydrogen brings 1 electron, chlorine has room for exactly 1 more — they share the pair, but chlorine tugs it closer (a polar covalent bond). Dissolved in water, this is the stomach acid that helps you digest food!',
  },
  {
    id: 'nacl',
    formula: 'NaCl',
    name: 'table salt',
    bondType: 'ionic',
    atoms: { Na: 1, Cl: 1 },
    explanation:
      'Sodium has 1 lonely outer electron; chlorine has 7 and room for exactly one more. Sodium hands its electron over — now Na⁺ and Cl⁻ are ions, and their opposite charges snap them together. An ionic bond, just like in the charge playground!',
  },
  {
    id: 'h2o',
    formula: 'H₂O',
    name: 'water',
    bondType: 'covalent',
    atoms: { H: 2, O: 1 },
    explanation:
      'Oxygen has 6 outer electrons with room for 2 more, and each hydrogen brings 1 to share. Oxygen shares one electron pair with each hydrogen — two covalent bonds. That makes water!',
  },
  {
    id: 'h2o2',
    formula: 'H₂O₂',
    name: 'hydrogen peroxide',
    bondType: 'covalent',
    atoms: { H: 2, O: 2 },
    explanation:
      'Like water with one oxygen extra: H–O–O–H, all held by shared pairs. The oxygen–oxygen bond is weak, so this molecule loves to fall apart — that fizzing when a scrape gets cleaned is it breaking up!',
  },
  {
    id: 'co',
    formula: 'CO',
    name: 'carbon monoxide',
    bondType: 'covalent',
    atoms: { C: 1, O: 1 },
    explanation:
      'Carbon and oxygen share THREE pairs of electrons — a triple bond, one of the strongest in chemistry! But carbon monoxide is a sneaky, dangerous gas to breathe — that is why homes have CO alarms.',
  },
  {
    id: 'co2',
    formula: 'CO₂',
    name: 'carbon dioxide',
    bondType: 'covalent',
    atoms: { C: 1, O: 2 },
    explanation:
      'Carbon shares TWO pairs of electrons with EACH oxygen — two double bonds in a straight line, O=C=O. You breathe out CO₂ all day long, and it makes soda fizzy!',
  },
  {
    id: 'ch4',
    formula: 'CH₄',
    name: 'methane',
    bondType: 'covalent',
    atoms: { C: 1, H: 4 },
    explanation:
      'Carbon has 4 outer electrons and room for 4 more — so it shares one electron pair with each of four hydrogens. Four covalent bonds: methane, the gas in a camping stove!',
  },
]

export interface PartialMatch {
  scenario: BondScenario
  /** element symbol → how many more atoms are needed */
  missing: Record<string, number>
  missingCount: number
}

export interface BondMatch {
  /** the recipe these atoms complete exactly, if any */
  exact: BondScenario | null
  /** recipes these atoms are a strict subset of, fewest-missing first */
  partials: PartialMatch[]
}

const totalOf = (counts: Record<string, number>) =>
  Object.values(counts).reduce((a, b) => a + b, 0)

function sameCounts(a: Record<string, number>, b: Record<string, number>) {
  const syms = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const s of syms) if ((a[s] ?? 0) !== (b[s] ?? 0)) return false
  return true
}

function isSubset(counts: Record<string, number>, recipe: Record<string, number>) {
  for (const [s, n] of Object.entries(counts)) {
    if (n > 0 && (recipe[s] ?? 0) < n) return false
  }
  return true
}

/** Matches the atoms currently on the table against the curated recipes. */
export function matchBondScenario(counts: Record<string, number>): BondMatch {
  const exact =
    totalOf(counts) > 0
      ? (BOND_SCENARIOS.find((s) => sameCounts(s.atoms, counts)) ?? null)
      : null
  const partials: PartialMatch[] = []
  if (totalOf(counts) > 0) {
    for (const s of BOND_SCENARIOS) {
      if (s === exact) continue
      if (!isSubset(counts, s.atoms)) continue
      const missing: Record<string, number> = {}
      let missingCount = 0
      for (const [sym, n] of Object.entries(s.atoms)) {
        const need = n - (counts[sym] ?? 0)
        if (need > 0) {
          missing[sym] = need
          missingCount += need
        }
      }
      partials.push({ scenario: s, missing, missingCount })
    }
    partials.sort((a, b) => a.missingCount - b.missingCount)
  }
  return { exact, partials }
}
