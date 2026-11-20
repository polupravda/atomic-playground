// 🔼 Prism scene optics (Light lab): a real 2D ray trace — Snell's law at
// every surface, total internal reflection where the angle is too steep,
// and each color's own refractive index (Cauchy's formula with textbook
// coefficients for crown glass, water and diamond). Pure functions, so the
// tests can check the physics without a canvas.
//
// Honest: the colors' spread (dispersion) is BOOSTED so kids can see the
// fan on a small screen — a real glass prism spreads white light by only
// about a degree; the order of the colors and which material spreads more
// stay true. Partial reflections at each surface are left out.

export type PrismMaterial = 'glass' | 'water' | 'diamond'
export type PrismShape = 'prism' | 'drop'

export interface Vec {
  x: number
  y: number
}

/** Cauchy coefficients: n(λ) = A + B / λ², λ in µm */
const CAUCHY: Record<PrismMaterial, [number, number]> = {
  glass: [1.5046, 0.0042], // crown glass (BK7)
  water: [1.3199, 0.00309],
  diamond: [2.3818, 0.0121],
}

/** how many times wider than real the colors fan out */
export const DISPERSION_BOOST = 6

/** the material's refractive index for this wavelength (boosted spread
 *  around its middle, 550 nm) */
export function refractiveIndex(m: PrismMaterial, nm: number, boost = DISPERSION_BOOST): number {
  const [A, B] = CAUCHY[m]
  const at = (um: number) => A + B / (um * um)
  const mid = at(0.55)
  return mid + (at(nm / 1000) - mid) * boost
}

const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y
const norm = (v: Vec): Vec => {
  const l = Math.hypot(v.x, v.y) || 1
  return { x: v.x / l, y: v.y / l }
}

/** bend `d` crossing into a medium (n1 → n2); `nrm` faces the incoming
 *  ray. null = total internal reflection (it cannot get out) */
export function refract(d: Vec, nrm: Vec, n1: number, n2: number): Vec | null {
  const eta = n1 / n2
  const cosi = -dot(nrm, d)
  const k = 1 - eta * eta * (1 - cosi * cosi)
  if (k < 0) return null
  return norm({ x: eta * d.x + (eta * cosi - Math.sqrt(k)) * nrm.x, y: eta * d.y + (eta * cosi - Math.sqrt(k)) * nrm.y })
}

export function reflect(d: Vec, nrm: Vec): Vec {
  const c = dot(d, nrm)
  return { x: d.x - 2 * c * nrm.x, y: d.y - 2 * c * nrm.y }
}

export interface RayPath {
  /** the corners of the path, from the start to the last surface */
  pts: Vec[]
  /** the direction it leaves in */
  dir: Vec
  /** where it bounced inside (total internal reflection) — the sparkle */
  bounces: Vec[]
  /** it never got out (trapped after the bounce limit) */
  trapped: boolean
}

/** a triangle (any convex polygon) turned by `angle` about its centroid */
export function turnedPolygon(pts: Vec[], center: Vec, angle: number): Vec[] {
  const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length
  const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return pts.map((p) => ({
    x: center.x + (p.x - cx) * c - (p.y - cy) * s,
    y: center.y + (p.x - cx) * s + (p.y - cy) * c,
  }))
}

/** trace one color through a convex polygon of index `n` */
export function tracePolygon(origin: Vec, dir: Vec, poly: Vec[], n: number, maxSteps = 8): RayPath {
  const cx = poly.reduce((a, p) => a + p.x, 0) / poly.length
  const cy = poly.reduce((a, p) => a + p.y, 0) / poly.length
  const pts: Vec[] = [origin]
  const bounces: Vec[] = []
  let p = origin
  let d = norm(dir)
  let inside = false
  let lastEdge = -1
  for (let step = 0; step < maxSteps; step++) {
    let best = Infinity
    let edge = -1
    for (let i = 0; i < poly.length; i++) {
      if (i === lastEdge) continue
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const e = { x: b.x - a.x, y: b.y - a.y }
      const den = d.x * e.y - d.y * e.x
      if (Math.abs(den) < 1e-9) continue
      const t = ((a.x - p.x) * e.y - (a.y - p.y) * e.x) / den
      const u = ((a.x - p.x) * d.y - (a.y - p.y) * d.x) / den
      if (t > 1e-6 && u >= 0 && u <= 1 && t < best) {
        best = t
        edge = i
      }
    }
    if (edge < 0) return { pts, dir: d, bounces, trapped: false }
    const hit = { x: p.x + d.x * best, y: p.y + d.y * best }
    pts.push(hit)
    const a = poly[edge]
    const b = poly[(edge + 1) % poly.length]
    let out = norm({ x: b.y - a.y, y: -(b.x - a.x) })
    // the edge's outward normal points away from the centre
    if (dot(out, { x: (a.x + b.x) / 2 - cx, y: (a.y + b.y) / 2 - cy }) < 0) out = { x: -out.x, y: -out.y }
    if (!inside) {
      const nd = refract(d, out, 1, n)
      if (!nd) return { pts, dir: reflect(d, out), bounces, trapped: false }
      d = nd
      inside = true
    } else {
      const facing = { x: -out.x, y: -out.y }
      const nd = refract(d, facing, n, 1)
      if (nd) {
        d = nd
        inside = false
      } else {
        d = reflect(d, facing)
        bounces.push(hit)
      }
    }
    p = hit
    lastEdge = edge
    if (!inside) return { pts, dir: d, bounces, trapped: false }
  }
  return { pts, dir: d, bounces, trapped: true }
}

/** trace one color through a round raindrop: in, ONE bounce off the back
 *  (the rainbow's own path), and out */
export function traceDrop(origin: Vec, dir: Vec, c: Vec, R: number, n: number): RayPath | null {
  const pts: Vec[] = [origin]
  const bounces: Vec[] = []
  let p = origin
  let d = norm(dir)
  const hitCircle = (from: Vec, dd: Vec, inside: boolean): Vec | null => {
    const f = { x: from.x - c.x, y: from.y - c.y }
    const b = dot(f, dd)
    const q = dot(f, f) - R * R
    const disc = b * b - q
    if (disc < 0) return null
    const t = inside ? -b + Math.sqrt(disc) : -b - Math.sqrt(disc)
    if (t <= 1e-6) return null
    return { x: from.x + dd.x * t, y: from.y + dd.y * t }
  }
  const outward = (h: Vec) => norm({ x: h.x - c.x, y: h.y - c.y })
  const enter = hitCircle(p, d, false)
  if (!enter) return null // misses the drop
  pts.push(enter)
  const nd = refract(d, outward(enter), 1, n)
  if (!nd) return null
  d = nd
  p = enter
  // the bounce off the back of the drop
  const back = hitCircle(p, d, true)
  if (!back) return null
  pts.push(back)
  bounces.push(back)
  const nIn = outward(back)
  d = reflect(d, { x: -nIn.x, y: -nIn.y })
  p = back
  const exit = hitCircle(p, d, true)
  if (!exit) return null
  pts.push(exit)
  const facing = outward(exit)
  const od = refract(d, { x: -facing.x, y: -facing.y }, n, 1)
  return { pts, dir: od ?? reflect(d, { x: -facing.x, y: -facing.y }), bounces, trapped: !od }
}

/** how far (deg) a color's path turns in total — for the rainbow's ~42° */
export function turnDeg(from: Vec, to: Vec): number {
  return (Math.acos(Math.max(-1, Math.min(1, dot(norm(from), norm(to))))) * 180) / Math.PI
}
