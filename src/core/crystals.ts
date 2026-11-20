// 🧊 Crystal lab (docs/how-things-work/13-proposal-crystal-lab.md) — the
// pure rules behind it: where carbon atoms sit in graphite and diamond,
// which graphite atom becomes which diamond atom, and when squeezing and
// heating turns one into the other. No drawing here.

export interface P3 {
  x: number
  y: number
  z: number
}

const centre = (pts: P3[]): P3[] => {
  const n = pts.length
  const c = pts.reduce((a, p) => ({ x: a.x + p.x / n, y: a.y + p.y / n, z: a.z + p.z / n }), { x: 0, y: 0, z: 0 })
  return pts.map((p) => ({ x: p.x - c.x, y: p.y - c.y, z: p.z - c.z }))
}
/** one stable order for both lattices, so atom i of graphite becomes atom
 *  i of diamond when the block is squeezed */
const ordered = (pts: P3[]) => [...pts].sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z)

/** how many carbon atoms the block shows */
export const CARBON_COUNT = 63
/** graphite's sheets (y is up); real spacing: 3.35 Å between sheets vs
 *  1.42 Å between neighbours in a sheet */
export const GRAPHITE_LAYERS = 3
export const SHEET_GAP = 2.36

/** graphite: flat honeycomb sheets, bond length 1, stacked AB */
export function graphiteLattice(): P3[] {
  const perLayer = CARBON_COUNT / GRAPHITE_LAYERS
  const out: P3[] = []
  for (let l = 0; l < GRAPHITE_LAYERS; l++) {
    const sheet: P3[] = []
    for (let i = -6; i <= 6; i++) {
      for (let j = -6; j <= 6; j++) {
        for (const b of [0, 1]) {
          const x = Math.sqrt(3) * i + (Math.sqrt(3) / 2) * j
          const z = 1.5 * j + b + (l % 2 ? 1 : 0)
          sheet.push({ x, y: (l - 1) * SHEET_GAP, z })
        }
      }
    }
    // the patch nearest the middle of the sheet
    sheet.sort((a, b) => Math.hypot(a.x - 0.87, a.z - 1) - Math.hypot(b.x - 0.87, b.z - 1))
    out.push(...sheet.slice(0, perLayer))
  }
  return ordered(centre(out))
}

/** which sheet a graphite atom lies in (0 = bottom) */
export const sheetOf = (p: P3) => Math.round(p.y / SHEET_GAP) + 1

/** diamond: every atom holds four neighbours, bond length 1 */
export function diamondLattice(): P3[] {
  const a = 4 / Math.sqrt(3)
  const fcc = [
    [0, 0, 0],
    [0, 0.5, 0.5],
    [0.5, 0, 0.5],
    [0.5, 0.5, 0],
  ]
  const out: P3[] = []
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++)
      for (let k = 0; k < 2; k++)
        for (const f of fcc)
          for (const s of [0, 0.25]) out.push({ x: (i + f[0] + s) * a, y: (j + f[1] + s) * a, z: (k + f[2] + s) * a })
  const c = centre(out)
  // drop the outermost atom(s) to match the graphite block's count
  c.sort((p, q) => Math.hypot(p.x, p.y, p.z) - Math.hypot(q.x, q.y, q.z))
  return ordered(c.slice(0, CARBON_COUNT))
}

/** diamond's atoms re-ordered so that atom i of the diamond is where
 *  atom i of the graphite goes when the block is squeezed: every atom
 *  takes a short trip to a near place (greedy, nearest pairs first), so
 *  the 63 atoms visibly stay 63 — none seem to arrive from elsewhere */
export function diamondFor(graphite: P3[], diamond: P3[]): P3[] {
  const pairs: Array<[number, number, number]> = []
  for (let i = 0; i < graphite.length; i++)
    for (let j = 0; j < diamond.length; j++)
      pairs.push([Math.hypot(graphite[i].x - diamond[j].x, graphite[i].y - diamond[j].y, graphite[i].z - diamond[j].z), i, j])
  pairs.sort((a, b) => a[0] - b[0])
  const out: Array<P3 | undefined> = new Array(graphite.length)
  const taken = new Set<number>()
  for (const [, i, j] of pairs) {
    if (out[i] || taken.has(j)) continue
    out[i] = diamond[j]
    taken.add(j)
  }
  return out as P3[]
}

/** the pairs of atoms that hold hands (closer than 1.25 bond lengths) */
export function bonds(pts: P3[]): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y, pts[i].z - pts[j].z) < 1.25) out.push([i, j])
  return out
}

/** squeeze and heat, 0–1 each: graphite becomes diamond only when BOTH
 *  are high — and the hotter it is, the harder it must be squeezed (the
 *  real boundary slopes that way) */
export function inDiamondZone(pressure: number, heat: number): boolean {
  return heat >= 0.45 && pressure >= 0.5 + 0.2 * heat
}
/** how deep in the Earth that squeeze is found, km (1 = about 250 km) */
export const depthKm = (pressure: number) => Math.round(pressure * 250)
