// Builds src/core/nuclideData.ts from the IAEA LiveChart of Nuclides
// (ground states, evaluated ENSDF/NUBASE data). Real data instead of a
// valley-of-stability formula: the formula marked Pb-210 and Fe-60 stable
// and loaded gold as radioactive Au-198 (science audit, 2026-11-20).
//
//   node scripts/nuclide-data/generate.mjs              # downloads the CSV
//   node scripts/nuclide-data/generate.mjs file.csv     # uses a saved copy
//
// Source: https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const URL = 'https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=all'
const YEAR_S = 3.15576e7
/** "Stable" for the app (and most textbooks): no decay ever seen, or a
 *  half-life over 10¹⁸ years — about 100 million times the age of the
 *  universe (Ca-48, Te-128, Xe-136 …). Nothing beyond lead counts: Bi-209
 *  decays, measurably. */
const STABLE_HALF_LIFE_S = 1e18 * YEAR_S
const HEAVIEST_STABLE_Z = 82

const csv = process.argv[2]
  ? readFileSync(process.argv[2], 'utf8')
  : await (await fetch(URL, { headers: { 'User-Agent': 'atomic-playground data script' } })).text()

/** One CSV line → fields (quoted fields may contain commas, e.g. spins
 *  like "(1/2,3/2)+"). */
function parseLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

const [header, ...lines] = csv.trim().split(/\r?\n/)
const cols = parseLine(header)
const col = (name) => cols.indexOf(name)
const rows = lines.map(parseLine)

/** One character per decay mode the app knows. */
function modeChar(r) {
  const z = Number(r[col('z')])
  const hl = r[col('half_life')]
  const op = r[col('operator_hl')]
  const sec = Number(r[col('half_life_sec')])
  if (z <= HEAVIEST_STABLE_Z) {
    if (hl === 'STABLE') return 'S'
    if (op === 'GT' || op === 'GE') return 'S' // only a lower limit: never seen to decay
    if (sec >= STABLE_HALF_LIFE_S) return 'S'
  }
  const d = r[col('decay_1')]
  const qec = Number(r[col('qec')])
  switch (d) {
    case 'A':
      return 'A'
    case 'B-':
    case 'B-N':
    case 'B-2N':
    case 'B-A':
    case '2B-':
      return 'M' // β⁻ (minus)
    case 'B+':
    case 'B+P':
    case '2B+':
      return 'P' // β⁺ (plus)
    case 'EC+B+':
      // a positron needs at least 1.022 MeV; below that only capture works
      return Number.isFinite(qec) && qec > 0 && qec < 1022 ? 'E' : 'P'
    case 'EC':
    case '2EC':
    case 'ECP':
    case 'ECSF':
      return 'E' // electron capture
    case 'P':
    case '2P':
      return 'p' // proton emission
    case 'N':
    case '2N':
      return 'n' // neutron emission
    case 'SF':
      return 'F' // spontaneous fission
    default:
      return '?'
  }
}

/** log10(half-life in seconds), rounded, as one character ('.' unknown). */
const HL_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const HL_OFFSET = 25 // char 0 = 10⁻²⁵ s
function halfLifeChar(r) {
  const sec = Number(r[col('half_life_sec')])
  if (r[col('half_life')] === 'STABLE' || !Number.isFinite(sec) || sec <= 0) return '.'
  const i = Math.round(Math.log10(sec)) + HL_OFFSET
  return HL_ALPHABET[Math.max(0, Math.min(HL_ALPHABET.length - 1, i))]
}

const byZ = new Map()
for (const r of rows) {
  const z = Number(r[col('z')])
  const n = Number(r[col('n')])
  if (!byZ.has(z)) byZ.set(z, new Map())
  byZ.get(z).set(n, r)
}

const entries = []
for (const z of [...byZ.keys()].sort((a, b) => a - b)) {
  if (z > 118) continue
  const nuclides = byZ.get(z)
  const ns = [...nuclides.keys()].sort((a, b) => a - b)
  const n0 = ns[0]
  const n1 = ns[ns.length - 1]
  let modes = ''
  let halfLives = ''
  for (let n = n0; n <= n1; n++) {
    const r = nuclides.get(n)
    modes += r ? modeChar(r) : '?'
    halfLives += r ? halfLifeChar(r) : '.'
  }
  // default isotope when loading an element: the most abundant in nature,
  // else the longest-lived
  let typical = n0
  let best = -1
  for (const n of ns) {
    const rawAb = nuclides.get(n)[col('abundance')]
    const ab = rawAb === '' ? NaN : Number(rawAb)
    if (Number.isFinite(ab) && ab > best) {
      best = ab
      typical = n
    }
  }
  if (best < 0) {
    let longest = -1
    for (const n of ns) {
      const r = nuclides.get(n)
      const raw = r[col('half_life_sec')]
      const sec = r[col('half_life')] === 'STABLE' ? Infinity : raw === '' ? -1 : Number(raw)
      if (sec > longest) {
        longest = sec
        typical = n
      }
    }
  }
  entries.push(`  ${z}: { n0: ${n0}, modes: '${modes}', halfLives: '${halfLives}', typical: ${typical} },`)
}

const extraction = rows[0][col('Extraction_date')]
const out = `// GENERATED by scripts/nuclide-data/generate.mjs — do not edit by hand.
// Source: IAEA LiveChart of Nuclides, ground states (extracted ${extraction}).
//
// Per element (Z): one character per neutron count from n0 upward.
//   modes:     S stable · A α · M β⁻ · P β⁺ · E electron capture ·
//              p proton emission · n neutron emission · F spontaneous fission ·
//              ? not measured / not in the chart
//   halfLives: round(log10(half-life in s)) + ${HL_OFFSET}, as a digit of
//              '${HL_ALPHABET}' ('.' = stable or unknown)
//   typical:   neutron count of the most abundant isotope in nature, else
//              the longest-lived one
// "Stable" = never seen to decay, or a half-life over 10¹⁸ years (Z ≤ 82).

export interface ElementNuclides {
  n0: number
  modes: string
  halfLives: string
  typical: number
}

export const HALF_LIFE_ALPHABET = '${HL_ALPHABET}'
export const HALF_LIFE_OFFSET = ${HL_OFFSET}

export const NUCLIDES: Readonly<Record<number, ElementNuclides>> = {
${entries.join('\n')}
}
`
writeFileSync(resolve(import.meta.dirname, '../../src/core/nuclideData.ts'), out)
console.log(`wrote ${entries.length} elements`)
