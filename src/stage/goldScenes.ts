import { clamp01, easeIn, easeInOut, easeOut, makeCanvasSprite, blit, type Sprite } from './canvasUtil'
import { drawGlossyParticle } from './particleStyle'
import { shellConfiguration } from '../core/atom'
import { elementForProtons } from '../core/elements'
import { GOLD_SEEDS, goldYearsAgo, nucleusAt, type GoldSeed } from '../core/gold'
import { bounce, callout, replayFrame, rewindSweep, stepRing } from './laserCutScenes'

// R04 — 💍 Where gold comes from (story design: docs/how-things-work/
// 12-story-designs-for-kids.md — told BACKWARDS from the ring). Nine beats,
// one hero: a single gold atom ringed in amber, followed back in time and
// then forward again:
//   ring      a hand with a gold ring — no fire, no factory can make gold:
//             so who made it? (the question, in big letters)
//   zoom      into the metal: gold atoms; one gets the amber ring
//   rewind    ⏪ the picture runs backwards: ring → nugget in a river →
//             rock → the young glowing Earth → a dust cloud → dark space,
//             a year counter spinning past 4.6 billion
//   stars     two small dead stars circle each other: NEUTRON STARS (the
//             one new term) — inside, neutrons squeezed tight
//   teaspoon  show first: one teaspoon of it balances a mountain; the
//             whole star is no wider than a city
//   crash     they spiral in, faster and faster (the ripples speed up),
//             crash — a blinding spray full of free neutrons
//   stuff     in the spray, small atoms are stuffed with neutrons; some
//             neutrons turn into protons (an electron flies off); they
//             climb to platinum and uranium — and with 79 protons our
//             hero is born: gold
//   stuffDrill 🔁 the drill-in (playbook 25): a rewind sweep, then the
//             replay frame on the same spray, the other atoms faded back:
//             ① our hero swallows neutron after neutron, ② a callout
//             circle zooms in on its nucleus — one neutron turns into a
//             proton, an electron flies off — while the element tag
//             climbs, ③ the 79th proton: gold, the hero's amber ring
//   forward   ⏩ the hero drifts, joins the cloud that becomes the Sun and
//             the Earth, sinks into rock, washes into a river, ends on
//             the hand
//   older     the ring again, the hero atom beside it, a dashed amber line
//             up to two tiny stars: older than the Earth it is worn on
// Key motion runs on story time `t`; life (gleams, ripples, orbits,
// electrons, the marker's pulse) on the idle clock.

export const GOLD_ORDER = ['ring', 'zoom', 'rewind', 'stars', 'teaspoon', 'crash', 'stuff', 'stuffDrill', 'forward', 'older'] as const
export type GoldPhase = (typeof GOLD_ORDER)[number]

/** story seconds per beat */
export const GOLD_T: Record<GoldPhase, number> = {
  ring: 9.5,
  zoom: 7,
  rewind: 14,
  stars: 9.5,
  teaspoon: 7.5,
  crash: 11,
  stuff: 13,
  // science pacing: four pieces, held at 0, 2.5, 5, 7.5
  stuffDrill: 10,
  forward: 15,
  older: 8,
}

const AMBER = 'rgba(251, 191, 36, 0.95)'
const AMBER_SOFT = 'rgba(253, 230, 138, 0.95)'
const GREY = 'rgba(203, 213, 225, 0.95)'

// ---------- shared ----------

const frac = (v: number) => v - Math.floor(v)
const rnd = (i: number, salt: number) => frac(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453)
const lerp = (a: number, b: number, q: number) => a + (b - a) * q

function space(ctx: CanvasRenderingContext2D, W: number, H: number, alpha = 1) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(226, 232, 240, ${(0.2 + 0.5 * rnd(i, 3)) * alpha})`
    const s = rnd(i, 4) > 0.88 ? 2 : 1
    ctx.fillRect(rnd(i, 1) * W, rnd(i, 2) * H, s, s)
  }
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color = 'rgba(148, 163, 184, 0.9)',
  size = 12,
  weight = '',
  align: CanvasTextAlign = 'center',
) {
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}

/** a caption on a dark pill */
function tag(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, size = 13, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
  const w = ctx.measureText(s).width + 14
  ctx.fillStyle = 'rgba(2, 6, 23, 0.75)'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - 12, w, 24, 7)
  ctx.fill()
  text(ctx, s, x, y, color, size)
  ctx.restore()
}

/** the amber ring that marks OUR atom, pulsing on the idle clock */
function marker(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, idle: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha * (0.75 + 0.25 * Math.sin(idle * 5))
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/** a tiny gold speck: the hero seen from far away */
function speck(ctx: CanvasRenderingContext2D, x: number, y: number, r = 3) {
  ctx.fillStyle = '#fcd34d'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

const fadeIn = (t: number, at: number, len = 0.8) => clamp01((t - at) / len)

// ---------- sprites (built once, blitted every frame) ----------

let electronSprites: { inner: Sprite; outer: Sprite } | null = null
function electrons() {
  if (!electronSprites) {
    const make = (r: number) =>
      makeCanvasSprite(Math.ceil(r * 3.2), (c) => drawGlossyParticle(c, 'electrons', r * 1.6, r * 1.6, r))
    electronSprites = { inner: make(1.7), outer: make(2.8) }
  }
  return electronSprites
}

let neutronSprite: Sprite | null = null
function neutron(): Sprite {
  if (!neutronSprite) neutronSprite = makeCanvasSprite(16, (c) => drawGlossyParticle(c, 'neutrons', 8, 8, 4.4))
  return neutronSprite
}

/** a nucleus as a phyllotaxis cluster of `n` nucleons, `p` of them
 *  protons. Each nucleon keeps a fixed rank, so as `p` grows a neutron
 *  visibly turns red in place (never a reshuffle) and new nucleons join
 *  on the outside. Cached: the stuff beat redraws the same few sizes. */
const nucleusCache = new Map<string, Sprite>()
function nucleusSprite(n: number, p: number, pr: number): Sprite {
  const key = `${n}:${p}:${pr}`
  let s = nucleusCache.get(key)
  if (s) return s
  const golden = Math.PI * (3 - Math.sqrt(5))
  const R = pr * 1.08 * Math.sqrt(n) + pr * 2
  // rank nucleons: the p lowest-ranked are protons
  const ranks = Array.from({ length: n }, (_, j) => ({ j, r: rnd(j, 61) })).sort((a, b) => a.r - b.r)
  const isP = new Set(ranks.slice(0, p).map((x) => x.j))
  s = makeCanvasSprite(Math.ceil(R * 2), (c) => {
    for (let j = n - 1; j >= 0; j--) {
      const r = pr * 1.08 * Math.sqrt(j)
      const a = j * golden
      drawGlossyParticle(c, isP.has(j) ? 'protons' : 'neutrons', R + r * Math.cos(a), R + r * Math.sin(a), pr)
    }
  })
  nucleusCache.set(key, s)
  if (nucleusCache.size > 24) nucleusCache.delete(nucleusCache.keys().next().value!)
  return s
}

const GOLD_SHELLS = shellConfiguration(79, 79)

/** a gold atom in the bomb demo's atom language: the nucleus, one ring
 *  per shell, its 79 electrons circling (the lone outer one drawn larger) */
function goldAtom(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, idle: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const r0 = 17 * k
  const gap = 9 * k
  for (let i = 0; i < GOLD_SHELLS.length; i++) {
    ctx.strokeStyle = i === GOLD_SHELLS.length - 1 ? '#4a6b91' : '#3b5a7d'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, r0 + gap * i, 0, Math.PI * 2)
    ctx.stroke()
  }
  const nuc = nucleusSprite(197, 79, 0.82)
  ctx.drawImage(nuc.canvas, x - (nuc.size / 2) * k, y - (nuc.size / 2) * k, nuc.size * k, nuc.size * k)
  const e = electrons()
  for (let i = 0; i < GOLD_SHELLS.length; i++) {
    const r = r0 + gap * i
    const outer = i === GOLD_SHELLS.length - 1
    const a0 = (idle * 1.1 * (i % 2 === 0 ? 1 : -0.7)) / (1 + i * 0.25) + i * 1.3
    for (let j = 0; j < GOLD_SHELLS[i]; j++) {
      const a = a0 + (j * 2 * Math.PI) / GOLD_SHELLS[i]
      blit(ctx, outer ? e.outer : e.inner, x + r * Math.cos(a), y + r * Math.sin(a))
    }
  }
  ctx.restore()
}
const goldAtomR = (k: number) => (17 + 9 * (GOLD_SHELLS.length - 1)) * k

// ---------- the hand and its ring ----------

const SKIN = '#f1c9a5'
const SKIN_EDGE = '#d9a882'

/** a hand reaching up from the bottom edge, a gold ring on its ring
 *  finger; returns where the ring sits */
function hand(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, H: number, idle: number) {
  ctx.save()
  ctx.fillStyle = SKIN
  ctx.strokeStyle = SKIN_EDGE
  ctx.lineWidth = 2
  // back to front: the fingers, the thumb, then the palm over their roots,
  // then the forearm (it hides the palm's lower edge: a clean wrist)
  // fingers: index, middle, RING, little
  const fingers: Array<[number, number]> = [
    [-41, 92],
    [-14, 108],
    [14, 100],
    [41, 78],
  ]
  for (const [dx, h] of fingers) {
    ctx.beginPath()
    ctx.roundRect(cx + (dx - 12.5) * s, cy - (24 + h) * s, 25 * s, (h + 30) * s, 12.5 * s)
    ctx.fill()
    ctx.stroke()
    // a knuckle crease
    ctx.beginPath()
    ctx.moveTo(cx + (dx - 7) * s, cy - (24 + h * 0.55) * s)
    ctx.lineTo(cx + (dx + 7) * s, cy - (24 + h * 0.55) * s)
    ctx.stroke()
  }
  // thumb
  ctx.save()
  ctx.translate(cx - 50 * s, cy + 22 * s)
  ctx.rotate(-0.65)
  ctx.beginPath()
  ctx.roundRect(-13 * s, -74 * s, 26 * s, 80 * s, 13 * s)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  // palm
  ctx.beginPath()
  ctx.roundRect(cx - 56 * s, cy - 34 * s, 112 * s, 104 * s, 30 * s)
  ctx.fill()
  ctx.stroke()
  // forearm
  ctx.beginPath()
  ctx.roundRect(cx - 40 * s, cy + 40 * s, 80 * s, H - cy, 18 * s)
  ctx.fill()
  ctx.restore()
  // the ring, at the base of the ring finger
  const rx = cx + 14 * s
  const ry = cy - 50 * s
  const bw = 31 * s
  const bh = 15 * s
  ctx.save()
  const g = ctx.createLinearGradient(rx, ry - bh / 2, rx, ry + bh / 2)
  g.addColorStop(0, '#fef3c7')
  g.addColorStop(0.35, '#fbbf24')
  g.addColorStop(0.8, '#b45309')
  g.addColorStop(1, '#78350f')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(rx - bw / 2, ry - bh / 2, bw, bh, 5 * s)
  ctx.fill()
  // a gleam sweeping across the band (idle)
  ctx.clip()
  const sweep = frac(idle / 2.6) * 2.2 - 0.6
  const gx = rx - bw / 2 + sweep * bw
  const gl = ctx.createLinearGradient(gx - 8 * s, 0, gx + 8 * s, 0)
  gl.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gl.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)')
  gl.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gl
  ctx.fillRect(rx - bw / 2, ry - bh / 2, bw, bh)
  ctx.restore()
  // a sparkle on its top edge
  const tw = Math.max(0, Math.sin(idle * 2.3))
  if (tw > 0.05) {
    const sx = rx + bw * 0.32
    const sy = ry - bh * 0.45
    const L = 9 * s * tw
    ctx.save()
    ctx.strokeStyle = `rgba(255, 251, 235, ${0.9 * tw})`
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(sx - L, sy)
    ctx.lineTo(sx + L, sy)
    ctx.moveTo(sx, sy - L)
    ctx.lineTo(sx, sy + L)
    ctx.stroke()
    ctx.restore()
  }
  return { x: rx, y: ry }
}

/** the warm backdrop behind the hand: a soft spotlight */
function handBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number, cx: number, cy: number) {
  ctx.fillStyle = '#0b0a1f'
  ctx.fillRect(0, 0, W, H)
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6)
  g.addColorStop(0, 'rgba(120, 72, 30, 0.45)')
  g.addColorStop(1, 'rgba(120, 72, 30, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

interface Box {
  W: number
  UH: number
  H: number
}

const handLayout = ({ W, UH }: Box) => ({ cx: W * 0.42, cy: UH * 0.62, s: Math.min(1.5, UH / 470) })

function ringScene(ctx: CanvasRenderingContext2D, b: Box, idle: number, rise = 1) {
  const { cx, cy, s } = handLayout(b)
  handBackdrop(ctx, b.W, b.H, cx, cy - 40 * s)
  return hand(ctx, cx, cy + (1 - easeOut(rise)) * b.UH * 0.6, s, b.H, idle)
}

// ---------- the stations of the gold's journey (rewound, then replayed) ----------

/** `dir` = -1 while rewinding (rivers run upstream, clouds unswirl) */
type Station = (ctx: CanvasRenderingContext2D, b: Box, idle: number, dir: number) => { x: number; y: number; r: number }

const stationRing: Station = (ctx, b, idle) => {
  const p = ringScene(ctx, b, idle)
  return { ...p, r: 26 }
}

const stationRiver: Station = (ctx, { W, UH, H }, idle, dir) => {
  // the bank
  ctx.fillStyle = '#14532d'
  ctx.fillRect(0, 0, W, H)
  // grass blades along the bank
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 2
  for (let i = 0; i < 110; i++) {
    const x = rnd(i, 71) * W
    const y = UH * (0.08 + rnd(i, 72) * 0.24)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rnd(i, 73) - 0.5) * 8, y - 8 - rnd(i, 70) * 10)
    ctx.stroke()
  }
  // the riverbed: gravel under shallow water
  const y0 = UH * 0.32
  ctx.fillStyle = '#5b4a3a'
  ctx.fillRect(0, y0, W, H - y0)
  for (let i = 0; i < 120; i++) {
    const v = 90 + rnd(i, 74) * 60
    ctx.fillStyle = `rgb(${v + 12}, ${v}, ${v - 14})`
    ctx.beginPath()
    ctx.ellipse(rnd(i, 77) * W, y0 + rnd(i, 78) * (H - y0), 5 + rnd(i, 79) * 12, 4 + rnd(i, 80) * 7, rnd(i, 81) * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  // the water over it, rippling (upstream when rewound)
  const wg = ctx.createLinearGradient(0, y0, 0, H)
  wg.addColorStop(0, 'rgba(14, 116, 144, 0.55)')
  wg.addColorStop(1, 'rgba(8, 51, 68, 0.55)')
  ctx.fillStyle = wg
  ctx.fillRect(0, y0, W, H - y0)
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)'
  ctx.lineWidth = 2
  for (let i = 0; i < 14; i++) {
    const y = y0 + 20 + rnd(i, 83) * (UH - y0 - 30)
    const x = frac(rnd(i, 84) + dir * idle * 0.08) * (W + 160) - 80
    ctx.beginPath()
    ctx.moveTo(x - 40, y)
    ctx.quadraticCurveTo(x, y - 6, x + 40, y)
    ctx.stroke()
  }
  // the nugget, glinting through the shallow water
  const nx = W * 0.5
  const ny = UH * 0.64
  const g = ctx.createRadialGradient(nx - 6, ny - 6, 2, nx, ny, 26)
  g.addColorStop(0, '#fef3c7')
  g.addColorStop(0.4, '#fbbf24')
  g.addColorStop(1, '#92400e')
  ctx.fillStyle = g
  ctx.beginPath()
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const r = 20 + rnd(k, 82) * 9
    ctx[k === 0 ? 'moveTo' : 'lineTo'](nx + Math.cos(a) * r * 1.25, ny + Math.sin(a) * r * 0.85)
  }
  ctx.closePath()
  ctx.fill()
  tag(ctx, 'a gold nugget, in a river', nx, ny + 52, AMBER_SOFT)
  return { x: nx, y: ny, r: 40 }
}

const stationRock: Station = (ctx, { W, UH, H }) => {
  ctx.fillStyle = '#1c1917'
  ctx.fillRect(0, 0, W, H)
  // a rock, broken open
  const cx = W * 0.5
  const cy = UH * 0.5
  ctx.fillStyle = '#57534e'
  ctx.beginPath()
  for (let k = 0; k <= 14; k++) {
    const a = (k / 14) * Math.PI * 2
    const r = UH * (0.3 + rnd(k, 85) * 0.06)
    ctx[k === 0 ? 'moveTo' : 'lineTo'](cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r)
  }
  ctx.closePath()
  ctx.fill()
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(${rnd(i, 86) > 0.5 ? '120, 113, 108' : '41, 37, 36'}, 0.7)`
    const a = rnd(i, 87) * Math.PI * 2
    const r = Math.sqrt(rnd(i, 88)) * UH * 0.28
    ctx.fillRect(cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r, 3, 3)
  }
  // a white quartz vein with gold flecks in it
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.35)
  ctx.fillStyle = '#e7e5e4'
  ctx.beginPath()
  ctx.moveTo(-UH * 0.42, -10)
  ctx.bezierCurveTo(-UH * 0.15, -26, UH * 0.15, 6, UH * 0.42, -12)
  ctx.lineTo(UH * 0.42, 14)
  ctx.bezierCurveTo(UH * 0.15, 30, -UH * 0.15, -2, -UH * 0.42, 16)
  ctx.closePath()
  ctx.fill()
  for (let i = 0; i < 16; i++) {
    const x = (rnd(i, 89) - 0.5) * UH * 0.75
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(x, (rnd(i, 90) - 0.5) * 16, 2 + rnd(i, 91) * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  // the hero's fleck
  const hx = cx + 14
  const hy = cy - 4
  speck(ctx, hx, hy, 4)
  tag(ctx, 'gold, hidden inside a rock', cx, cy + UH * 0.36, AMBER_SOFT)
  return { x: hx, y: hy, r: 16 }
}

const stationYoungEarth: Station = (ctx, { W, UH, H }, idle) => {
  space(ctx, W, H)
  const cx = W * 0.5
  const cy = UH * 0.48
  const R = UH * 0.26
  const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.5)
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.35)')
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R)
  g.addColorStop(0, '#fed7aa')
  g.addColorStop(0.45, '#f97316')
  g.addColorStop(1, '#7c2d12')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fill()
  // a dark crust breaking over the glowing rock
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.clip()
  for (let i = 0; i < 26; i++) {
    const a = rnd(i, 92) * Math.PI * 2
    const r = Math.sqrt(rnd(i, 93)) * R
    ctx.fillStyle = `rgba(41, 20, 10, ${0.35 + 0.2 * Math.sin(idle * 0.8 + i)})`
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 10 + rnd(i, 94) * 22, 6 + rnd(i, 95) * 12, rnd(i, 96) * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  const hx = cx + R * 0.45
  const hy = cy - R * 0.35
  speck(ctx, hx, hy)
  tag(ctx, 'the young Earth, glowing hot', cx, cy + R + 34, AMBER_SOFT)
  return { x: hx, y: hy, r: 12 }
}

const stationCloud: Station = (ctx, { W, UH, H }, idle, dir) => {
  space(ctx, W, H)
  const cx = W * 0.5
  const cy = UH * 0.48
  // a flat, swirling disk of dust around a young star
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1.4, 0.42)
  const haze = ctx.createRadialGradient(0, 0, 10, 0, 0, UH * 0.4)
  haze.addColorStop(0, 'rgba(214, 179, 140, 0.35)')
  haze.addColorStop(0.6, 'rgba(165, 140, 190, 0.18)')
  haze.addColorStop(1, 'rgba(165, 140, 190, 0)')
  ctx.fillStyle = haze
  ctx.beginPath()
  ctx.arc(0, 0, UH * 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  for (let i = 0; i < 420; i++) {
    const r = 30 + Math.sqrt(rnd(i, 97)) * UH * 0.36
    const a = rnd(i, 98) * Math.PI * 2 + (dir * idle * 14) / r
    const x = cx + Math.cos(a) * r * 1.4
    const y = cy + Math.sin(a) * r * 0.42
    ctx.fillStyle = `rgba(${rnd(i, 99) > 0.5 ? '230, 196, 150' : '190, 165, 220'}, ${0.4 + 0.5 * rnd(i, 100)})`
    ctx.fillRect(x, y, 2.5, 2.5)
  }
  const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34)
  sg.addColorStop(0, 'rgba(255, 247, 214, 0.95)')
  sg.addColorStop(0.4, 'rgba(251, 191, 36, 0.6)')
  sg.addColorStop(1, 'rgba(251, 191, 36, 0)')
  ctx.fillStyle = sg
  ctx.beginPath()
  ctx.arc(cx, cy, 34, 0, Math.PI * 2)
  ctx.fill()
  const ha = 1.1 + (dir * idle * 14) / 160
  const hx = cx + Math.cos(ha) * 160 * 1.4
  const hy = cy + Math.sin(ha) * 160 * 0.42
  speck(ctx, hx, hy)
  tag(ctx, 'a cloud of dust: it will become the Sun and the Earth', cx, cy + UH * 0.3, AMBER_SOFT)
  return { x: hx, y: hy, r: 12 }
}

const stationSpace: Station = (ctx, { W, UH, H }, idle) => {
  space(ctx, W, H, 0.7)
  const hx = W * 0.5 + Math.sin(idle * 0.4) * 20
  const hy = UH * 0.46 + Math.cos(idle * 0.33) * 12
  speck(ctx, hx, hy)
  tag(ctx, 'dark space', W * 0.5, UH * 0.46 + 60, GREY)
  return { x: hx, y: hy, r: 12 }
}

/** forward only: the crash's spray fading as the hero flies off */
const stationSpray: Station = (ctx, b, idle) => {
  space(ctx, b.W, b.H)
  const cx = b.W * 0.3
  const cy = b.UH * 0.48
  const hz = ctx.createRadialGradient(cx, cy, 20, cx, cy, b.UH * 0.45)
  hz.addColorStop(0, 'rgba(251, 146, 60, 0.28)')
  hz.addColorStop(1, 'rgba(251, 146, 60, 0)')
  ctx.fillStyle = hz
  ctx.fillRect(0, 0, b.W, b.H)
  for (let i = 0; i < 160; i++) {
    const a = rnd(i, 101) * Math.PI * 2
    const r = 120 + rnd(i, 102) * 160 + idle * 4
    ctx.fillStyle = `rgba(253, 186, 116, ${0.3 + 0.4 * rnd(i, 103)})`
    ctx.fillRect(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 0.6, 2.5, 2.5)
  }
  const hx = b.W * 0.62 + Math.sin(idle * 0.5) * 10
  const hy = b.UH * 0.42
  speck(ctx, hx, hy)
  tag(ctx, 'off into space, for millions of years', hx, hy + 40, AMBER_SOFT)
  return { x: hx, y: hy, r: 12 }
}

interface Leg {
  at: number
  draw: Station
}

/** the rewind: each station shows from `at` (story s) */
const REWIND_LEGS: Leg[] = [
  { at: 0, draw: stationRing },
  { at: 1.6, draw: stationRiver },
  { at: 4.2, draw: stationRock },
  { at: 6.8, draw: stationYoungEarth },
  { at: 9.4, draw: stationCloud },
  { at: 12, draw: stationSpace },
]

const FORWARD_LEGS: Leg[] = [
  { at: 0, draw: stationSpray },
  { at: 2.4, draw: stationCloud },
  { at: 4.8, draw: stationYoungEarth },
  { at: 7.2, draw: stationRock },
  { at: 9.6, draw: stationRiver },
  { at: 12, draw: stationRing },
]

const XFADE = 0.6

/** play a journey of stations at story time t: crossfade between legs,
 *  the hero's marker gliding from one station's spot to the next */
function journey(ctx: CanvasRenderingContext2D, b: Box, legs: Leg[], t: number, idle: number, dir: number) {
  let i = legs.findIndex((_, k) => k === legs.length - 1 || t < legs[k + 1].at)
  if (i < 0) i = legs.length - 1
  const cur = legs[i].draw(ctx, b, idle, dir)
  let hero = cur
  const next = legs[i + 1]
  if (next) {
    const q = clamp01((t - (next.at - XFADE)) / XFADE)
    if (q > 0) {
      ctx.save()
      ctx.globalAlpha = q
      const nx = next.draw(ctx, b, idle, dir)
      ctx.restore()
      const e = easeInOut(q)
      hero = { x: lerp(cur.x, nx.x, e), y: lerp(cur.y, nx.y, e), r: lerp(cur.r, nx.r, e) }
    }
  }
  marker(ctx, hero.x, hero.y, hero.r, idle)
}

/** the year counter in the top-right corner — a plain readout (no
 *  border, no ⏪ glyph: it must not look like a button, Elena 2026-11-20) */
function counter(ctx: CanvasRenderingContext2D, W: number, years: number | null) {
  const s =
    years === null
      ? 'more than 4,600,000,000 years ago'
      : years < 1
        ? 'today'
        : `${Math.round(years).toLocaleString('en-US')} years ago`
  ctx.save()
  ctx.font = '600 16px ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.fillStyle = '#fde68a'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(2, 6, 23, 0.9)'
  ctx.shadowBlur = 6
  ctx.fillText(s, W - 20, 31)
  ctx.restore()
}

/** faint tape lines rolling across the picture (up while rewinding, down
 *  going forward). No "⏪ rewind" badge: it looked like a button */
function tapeFx(ctx: CanvasRenderingContext2D, W: number, H: number, idle: number, dir: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(226, 232, 240, 0.05)'
  for (let k = 0; k < 3; k++) {
    const y = frac(k / 3 - (dir * idle) / 1.7) * H
    ctx.fillRect(0, y, W, 14)
  }
  ctx.restore()
}

// ---------- beat 1: the ring and the question ----------

function drawRing(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const ring = ringScene(ctx, b, idle, clamp01(t / 1.2))
  // "no fire, no factory" — in before the piece that says it
  const chips = fadeIn(t, 4)
  if (chips > 0) {
    const x = b.W * 0.76
    for (const [i, s] of ['🔥 fire can\'t make gold', '🏭 no factory can make gold'].entries()) {
      const y = b.UH * 0.38 + i * 46
      tag(ctx, s, x, y, GREY, 14, chips)
      ctx.font = '14px ui-sans-serif, system-ui, sans-serif'
      const half = ctx.measureText(s).width / 2
      ctx.save()
      ctx.globalAlpha = chips
      text(ctx, '✗', x + half + 22, y, '#f87171', 20, '700')
      ctx.restore()
    }
  }
  // the question, in big letters
  const q = fadeIn(t, 6.6)
  if (q > 0) {
    ctx.save()
    ctx.globalAlpha = q
    text(ctx, 'Who made the gold in this ring?', b.W / 2, b.UH * 0.12 + (1 - easeOut(q)) * 12, '#fef3c7', Math.min(30, b.W / 22), '700')
    ctx.restore()
  }
  return ring
}

// ---------- beat 2: into the metal ----------

/** the gold atoms around the hero: a close-packed layer */
function lattice(b: Box) {
  const cx = b.W / 2
  const cy = b.UH / 2
  const d = 150
  const out: Array<{ x: number; y: number; hero: boolean }> = []
  for (let row = -3; row <= 3; row++) {
    for (let col = -4; col <= 4; col++) {
      const x = cx + col * d + (row % 2 ? d / 2 : 0)
      const y = cy + row * d * 0.87
      if (x < -80 || x > b.W + 80 || y < -80 || y > b.UH + 80) continue
      out.push({ x, y, hero: row === 0 && col === 0 })
    }
  }
  return out
}

function drawZoom(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const z = easeIn(clamp01(t / 2))
  const metal = clamp01((t - 1.3) / 0.8)
  if (metal < 1) {
    // dive into the ring
    const { cx, cy, s } = handLayout(b)
    const rx = cx + 14 * s
    const ry = cy - 50 * s
    const zoom = 1 + 9 * z
    ctx.save()
    ctx.translate(rx + (b.W / 2 - rx) * z, ry + (b.UH / 2 - ry) * z)
    ctx.scale(zoom, zoom)
    ctx.translate(-rx, -ry)
    ringScene(ctx, b, idle)
    ctx.restore()
  }
  if (metal <= 0) return
  ctx.save()
  ctx.globalAlpha = metal
  // the metal's warm glow behind its atoms
  const g = ctx.createRadialGradient(b.W / 2, b.UH / 2, 0, b.W / 2, b.UH / 2, Math.max(b.W, b.H) * 0.7)
  g.addColorStop(0, '#3b2a06')
  g.addColorStop(1, '#140d02')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, b.W, b.H)
  const k = 0.55 + 0.45 * easeOut(clamp01((t - 1.3) / 1))
  const heroFocus = fadeIn(t, 2.6, 1)
  for (const a of lattice(b)) {
    const x = b.W / 2 + (a.x - b.W / 2) * k
    const y = b.UH / 2 + (a.y - b.UH / 2) * k
    goldAtom(ctx, x, y, k, idle, a.hero ? 1 : 1 - 0.45 * heroFocus)
  }
  ctx.restore()
  // the amber ring lands on our atom
  const land = clamp01((t - 2) / 0.5)
  if (land > 0) marker(ctx, b.W / 2, b.UH / 2, lerp(220, goldAtomR(1) + 10, easeOut(land)), idle, land)
  tag(ctx, 'gold is made of atoms, packed side by side', b.W / 2, 34, GREY, 13, fadeIn(t, 2.2, 0.5))
  tag(ctx, 'our hero: one gold atom', b.W / 2, b.UH / 2 + goldAtomR(1) + 32, AMBER, 14, fadeIn(t, 2.4, 0.5))
  tag(ctx, 'let\'s follow it back in time…', b.W / 2, b.UH - 30, '#e2e8f0', 14, fadeIn(t, 5.2, 0.6))
}

// ---------- beat 3: the rewind ----------

function drawRewind(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  journey(ctx, b, REWIND_LEGS, t, idle, -1)
  tapeFx(ctx, b.W, b.H, idle, -1)
  counter(ctx, b.W, t >= 12.6 ? null : goldYearsAgo('rewind', t))
}

// ---------- beat 4: two dead stars ----------

/** a neutron star: small and dull, a faint blue rim */
function neutronStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.4)
  halo.addColorStop(0, 'rgba(147, 197, 253, 0.25)')
  halo.addColorStop(1, 'rgba(147, 197, 253, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, r * 2.4, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r)
  g.addColorStop(0, '#f1f5f9')
  g.addColorStop(0.5, '#94a3b8')
  g.addColorStop(1, '#475569')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

/** ripples in space, spreading from the pair */
function ripples(ctx: CanvasRenderingContext2D, cx: number, cy: number, ages: number[], alpha = 1) {
  ctx.save()
  ctx.lineWidth = 1.5
  for (const age of ages) {
    if (age < 0) continue
    const r = 30 + age * 150
    const a = Math.max(0, 0.35 - age * 0.09) * alpha
    if (a <= 0) continue
    ctx.strokeStyle = `rgba(148, 163, 184, ${a})`
    ctx.beginPath()
    ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

const pairCenter = (b: Box) => ({ x: b.W * 0.42, y: b.UH * 0.48 })
const ORBIT_R = 78
const NS_R = 15

function drawStars(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  space(ctx, b.W, b.H)
  const { x: cx, y: cy } = pairCenter(b)
  const show = fadeIn(t, 0.3, 1.6)
  ripples(ctx, cx, cy, [0, 1, 2, 3].map((k) => frac(idle / 4 + k / 4) * 4), show)
  const a = idle * 1.2
  ctx.save()
  ctx.globalAlpha = show
  const pts = [0, Math.PI].map((d) => ({ x: cx + Math.cos(a + d) * ORBIT_R, y: cy + Math.sin(a + d) * ORBIT_R * 0.55 }))
  for (const p of pts) neutronStar(ctx, p.x, p.y, NS_R)
  ctx.restore()
  tag(ctx, 'two small, dead stars', cx, cy + ORBIT_R + 40, GREY, 13, fadeIn(t, 1.2))
  // the term, on both of them (in before it is named)
  const named = fadeIn(t, 4.2)
  for (const p of pts) tag(ctx, 'neutron star', p.x, p.y - 34, AMBER, 13, named)
  // inside: neutrons, squeezed tight (in before it is said)
  const inside = fadeIn(t, 6.6)
  if (inside > 0) {
    const bx = b.W * 0.8
    const by = b.UH * 0.4
    const R = Math.min(96, b.W * 0.12)
    ctx.save()
    ctx.globalAlpha = inside
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.setLineDash([4, 5])
    ctx.beginPath()
    ctx.moveTo(pts[1].x + NS_R, pts[1].y)
    ctx.lineTo(bx - R, by)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#0b1226'
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(bx, by, R, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.save()
    ctx.clip()
    const n = neutron()
    const d = 9.6
    for (let row = -12; row <= 12; row++) {
      for (let col = -12; col <= 12; col++) {
        const x = bx + col * d + (row % 2 ? d / 2 : 0) + Math.sin(idle * 9 + row * 3 + col) * 0.6
        const y = by + row * d * 0.87
        blit(ctx, n, x, y)
      }
    }
    ctx.restore()
    ctx.restore()
    tag(ctx, 'inside: neutrons, squeezed tight', bx, by + R + 22, GREY, 13, inside)
  }
  counter(ctx, b.W, null)
}

// ---------- beat 5: a teaspoon weighs a mountain ----------

function drawTeaspoon(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  space(ctx, b.W, b.H)
  const sc = Math.min(1.25, b.UH / 560, b.W / 860)
  const cx = b.W * 0.3
  const cy = b.UH * 0.44
  const arm = 140 * sc
  // the beam wobbles as the loads land, then settles LEVEL: same weight
  const settle = clamp01((t - 1.2) / 1.2)
  const tilt = t < 0.6 ? 0 : 0.16 * Math.sin((t - 0.6) * 5) * (1 - settle)
  ctx.save()
  ctx.strokeStyle = '#64748b'
  ctx.lineCap = 'round'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(cx, cy + 150 * sc)
  ctx.lineTo(cx, cy)
  ctx.moveTo(cx - 60 * sc, cy + 150 * sc)
  ctx.lineTo(cx + 60 * sc, cy + 150 * sc)
  ctx.stroke()
  ctx.translate(cx, cy)
  ctx.rotate(tilt)
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(-arm, 0)
  ctx.lineTo(arm, 0)
  ctx.stroke()
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(side * arm, 0)
    ctx.rotate(-tilt) // pans hang straight down
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-34 * sc, 60 * sc)
    ctx.moveTo(0, 0)
    ctx.lineTo(34 * sc, 60 * sc)
    ctx.stroke()
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(-44 * sc, 62 * sc)
    ctx.lineTo(44 * sc, 62 * sc)
    ctx.stroke()
    const drop = side < 0 ? clamp01(t / 0.6) : clamp01((t - 0.3) / 0.6)
    const dy = (1 - easeIn(drop)) * -120 * sc
    ctx.globalAlpha = drop
    if (side < 0) {
      // a teaspoon with a heap of neutron-star stuff
      ctx.translate(0, 56 * sc + dy)
      ctx.fillStyle = '#cbd5e1'
      ctx.beginPath()
      ctx.ellipse(-6 * sc, 0, 16 * sc, 6 * sc, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 3 * sc
      ctx.beginPath()
      ctx.moveTo(10 * sc, -1 * sc)
      ctx.lineTo(36 * sc, -6 * sc)
      ctx.stroke()
      const g = ctx.createRadialGradient(-6 * sc, -6 * sc, 0, -6 * sc, -4 * sc, 12 * sc)
      g.addColorStop(0, '#f1f5f9')
      g.addColorStop(1, '#475569')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(-6 * sc, -4 * sc, 11 * sc, 6 * sc, 0, Math.PI, 0)
      ctx.fill()
      // its faint blue glow (idle)
      ctx.fillStyle = `rgba(147, 197, 253, ${0.15 + 0.1 * Math.sin(idle * 3)})`
      ctx.beginPath()
      ctx.arc(-6 * sc, -6 * sc, 18 * sc, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // a whole mountain, snow on top
      ctx.translate(0, 60 * sc + dy)
      ctx.fillStyle = '#78716c'
      ctx.beginPath()
      ctx.moveTo(-42 * sc, 0)
      ctx.lineTo(-8 * sc, -78 * sc)
      ctx.lineTo(4 * sc, -64 * sc)
      ctx.lineTo(16 * sc, -82 * sc)
      ctx.lineTo(42 * sc, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.moveTo(-8 * sc, -78 * sc)
      ctx.lineTo(-16 * sc, -62 * sc)
      ctx.lineTo(-4 * sc, -66 * sc)
      ctx.lineTo(4 * sc, -64 * sc)
      ctx.lineTo(10 * sc, -72 * sc)
      ctx.lineTo(16 * sc, -82 * sc)
      ctx.lineTo(24 * sc, -64 * sc)
      ctx.lineTo(-8 * sc, -78 * sc)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }
  ctx.restore()
  const lbl = fadeIn(t, 1.2)
  tag(ctx, '1 teaspoon of neutron star', cx - arm, cy + 96 * sc, GREY, 13, lbl)
  tag(ctx, 'a whole mountain', cx + arm, cy + 96 * sc, GREY, 13, lbl)
  tag(ctx, '= the same weight!', cx, cy - 46 * sc, AMBER, 15, fadeIn(t, 2))
  // …and the whole star no wider than a city (in before it is said)
  const city = fadeIn(t, 3.6, 1)
  if (city > 0) {
    ctx.save()
    ctx.globalAlpha = city
    const w = Math.min(190, b.W * 0.24)
    const x0 = b.W * 0.66
    const base = b.UH * 0.74
    // the skyline
    for (let i = 0; i < 11; i++) {
      const bw = w / 11
      const h = (34 + rnd(i, 111) * 70) * sc
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(x0 + i * bw, base - h, bw - 2, h)
      ctx.fillStyle = 'rgba(253, 224, 71, 0.55)'
      for (let wy = base - h + 6; wy < base - 6; wy += 9) {
        for (let wx = x0 + i * bw + 3; wx < x0 + (i + 1) * bw - 5; wx += 6) {
          if (rnd(wx * 7 + wy, 112) > 0.55) ctx.fillRect(wx, wy, 2, 3)
        }
      }
    }
    // the neutron star above it, exactly as wide
    neutronStar(ctx, x0 + w / 2, base - 120 * sc - w / 2, w / 2)
    // the same width, twice
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 1.5
    for (const y of [base + 14, base - 120 * sc - w - 12]) {
      ctx.beginPath()
      ctx.moveTo(x0, y)
      ctx.lineTo(x0 + w, y)
      ctx.moveTo(x0, y - 5)
      ctx.lineTo(x0, y + 5)
      ctx.moveTo(x0 + w, y - 5)
      ctx.lineTo(x0 + w, y + 5)
      ctx.stroke()
    }
    ctx.restore()
    tag(ctx, 'a whole neutron star', x0 + w / 2, base - 120 * sc - w - 32, AMBER, 13, city)
    tag(ctx, 'a city: about 20 km across', x0 + w / 2, base + 36, GREY, 13, city)
  }
  counter(ctx, b.W, null)
}

// ---------- beat 6: the crash ----------

/** the spiral: separation shrinks and the orbit speeds up (a chirp) */
export const CRASH_AT = 5.5
const SPIRAL_TURNS = 6
function spiralPhase(t: number) {
  const u = clamp01(t / CRASH_AT)
  return SPIRAL_TURNS * 2 * Math.PI * (1 - Math.pow(1 - u, 5 / 8))
}
/** when the spiral passed phase φ (for the ripples it sends out) */
function spiralTimeAt(phi: number) {
  const x = 1 - phi / (SPIRAL_TURNS * 2 * Math.PI)
  return CRASH_AT * (1 - Math.pow(Math.max(0, x), 8 / 5))
}

function drawCrash(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  space(ctx, b.W, b.H)
  const { x: cx, y: cy } = pairCenter(b)
  // ripples leave every half turn, closer and closer together
  const ages: number[] = []
  for (let k = 0; k <= SPIRAL_TURNS * 2; k++) ages.push(t - spiralTimeAt(k * Math.PI))
  ripples(ctx, cx, cy, ages)
  if (t < CRASH_AT) {
    const u = t / CRASH_AT
    const sep = ORBIT_R * Math.pow(1 - u, 1 / 4)
    const a = spiralPhase(t)
    for (const d of [0, Math.PI]) {
      neutronStar(ctx, cx + Math.cos(a + d) * Math.max(NS_R * 0.9, sep), cy + Math.sin(a + d) * Math.max(NS_R * 0.9, sep) * 0.55, NS_R)
    }
    tag(ctx, 'closer and closer… faster and faster', cx, cy + ORBIT_R + 40, GREY, 13, fadeIn(t, 1.4))
  } else {
    const q = t - CRASH_AT
    // the spray's glow, spreading and slowly cooling
    const glowR = 60 + 260 * easeOut(clamp01(q / 4))
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(1.5, 0.6)
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR)
    sg.addColorStop(0, `rgba(254, 215, 170, ${0.55 - q * 0.03})`)
    sg.addColorStop(0.5, `rgba(251, 146, 60, ${0.3 - q * 0.015})`)
    sg.addColorStop(1, 'rgba(251, 146, 60, 0)')
    ctx.fillStyle = sg
    ctx.beginPath()
    ctx.arc(0, 0, glowR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // the spray: hot star stuff flung out, most of it in the orbit's plane
    for (let i = 0; i < 240; i++) {
      const a = rnd(i, 121) * Math.PI * 2
      const v = (60 + rnd(i, 122) * 120) * easeOut(clamp01(q / 4)) * (1 + q * 0.25)
      const flat = rnd(i, 123) > 0.35 ? 0.45 : 0.95
      const x = cx + Math.cos(a) * v * 1.5
      const y = cy + Math.sin(a) * v * flat
      ctx.fillStyle = rnd(i, 124) > 0.5 ? `rgba(254, 215, 170, ${0.85 - q * 0.04})` : `rgba(251, 146, 60, ${0.8 - q * 0.04})`
      ctx.beginPath()
      ctx.arc(x, y, 1.6 + rnd(i, 125) * 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    // free neutrons in it
    const nOut = fadeIn(t, CRASH_AT + 2, 1.2)
    const n = neutron()
    let lx = cx
    let ly = cy
    for (let i = 0; i < 26; i++) {
      const a = rnd(i, 126) * Math.PI * 2
      const v = (70 + rnd(i, 127) * 110) * easeOut(clamp01(q / 4)) * (1 + q * 0.25)
      const x = cx + Math.cos(a) * v * 1.5 + Math.sin(idle * 7 + i) * 1.5
      const y = cy + Math.sin(a) * v * 0.5
      ctx.save()
      ctx.globalAlpha = nOut
      blit(ctx, n, x, y)
      ctx.restore()
      if (i === 3) {
        lx = x
        ly = y
      }
    }
    // the blinding flash
    if (q < 1.4) {
      const r = 40 + 520 * easeOut(q / 1.4)
      const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      fg.addColorStop(0, `rgba(255, 255, 255, ${0.95 * (1 - q / 1.4)})`)
      fg.addColorStop(1, 'rgba(255, 237, 190, 0)')
      ctx.fillStyle = fg
      ctx.fillRect(0, 0, b.W, b.H)
    }
    // what is left in the middle
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16)
    rg.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
    rg.addColorStop(1, 'rgba(191, 219, 254, 0)')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(cx, cy, 16, 0, Math.PI * 2)
    ctx.fill()
    tag(ctx, 'CRASH!', cx, cy - 70, '#fef3c7', 18, q < 2.4 ? 1 : Math.max(0, 1 - (q - 2.4) / 0.6))
    tag(ctx, 'a blinding spray of hot star stuff', cx, b.UH - 40, AMBER_SOFT, 14, fadeIn(t, CRASH_AT + 1.2))
    tag(ctx, 'free neutrons', lx, ly - 22, GREY, 12, nOut)
  }
  counter(ctx, b.W, null)
}

// ---------- beat 7: stuffed with neutrons ----------

interface Placed {
  seed: GoldSeed
  x: number
  y: number
  pr: number
}

function places(b: Box): Placed[] {
  return [
    { seed: GOLD_SEEDS[1], x: b.W * 0.17, y: b.UH * 0.4, pr: 2.1 },
    { seed: GOLD_SEEDS[0], x: b.W * 0.5, y: b.UH * 0.5, pr: 2.9 },
    { seed: GOLD_SEEDS[2], x: b.W * 0.83, y: b.UH * 0.4, pr: 2.1 },
  ]
}

const nucR = (n: number, pr: number) => pr * 1.08 * Math.sqrt(n) + pr

/** inside the spray: the hot orange haze, a drizzle of free neutrons and
 *  free electrons (idle motion — it never stops) */
function sprayBackdrop(ctx: CanvasRenderingContext2D, b: Box, idle: number) {
  // inside the spray: hot, orange haze, a drizzle of free neutrons
  const g = ctx.createRadialGradient(b.W / 2, b.UH / 2, 0, b.W / 2, b.UH / 2, Math.max(b.W, b.H) * 0.75)
  g.addColorStop(0, '#2a1206')
  g.addColorStop(1, '#0e0603')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, b.W, b.H)
  const n = neutron()
  ctx.save()
  ctx.globalAlpha = 0.45
  for (let i = 0; i < 40; i++) {
    const x = frac(rnd(i, 131) + idle * (0.02 + rnd(i, 132) * 0.03)) * (b.W + 40) - 20
    const y = rnd(i, 133) * b.UH
    blit(ctx, n, x, y)
  }
  ctx.restore()
  // …and FREE electrons. The app draws an atom with its electrons, but here
  // that would be false: the spray is billions of degrees hot, far too hot
  // for any electron to stay on a nucleus. The atoms are bare cores; their
  // electrons zip around loose and only settle into shells days later, once
  // the cloud has cooled (the zoom and the closing bubble show the dressed
  // gold atom). Idle motion: fast, jittery, never still.
  const e = electrons().outer
  for (let i = 0; i < 46; i++) {
    const sp = 0.05 + rnd(i, 141) * 0.07
    const x = frac(rnd(i, 142) + idle * sp * (rnd(i, 143) > 0.5 ? 1 : -1)) * (b.W + 20) - 10
    const y = frac(rnd(i, 144) + idle * sp * 0.6 * (rnd(i, 145) > 0.5 ? 1 : -1)) * b.UH + Math.sin(idle * 9 + i) * 3
    blit(ctx, e, x, y)
  }
}

function drawStuff(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  sprayBackdrop(ctx, b, idle)
  const n = neutron()
  tag(ctx, 'the blue dots: free electrons, too hot to hold on', b.W / 2, 108, 'rgba(125, 211, 252, 0.95)', 12, fadeIn(t, 1.2))
  for (const p of places(b)) {
    const s = p.seed
    const st = nucleusAt(s, t)
    // the neutrons being swallowed: each flies in for 0.6 s and sticks
    const R = nucR(st.nucleons, p.pr)
    for (let j = 0; j < s.capture.count; j++) {
      const at = s.capture.from + ((s.capture.to - s.capture.from) * (j + 1)) / s.capture.count
      const q = (t - (at - 0.6)) / 0.6
      if (q < 0 || q >= 1) continue
      const a = rnd(j + s.protonsEnd * 7, 134) * Math.PI * 2
      const d = R + 8 + (1 - easeIn(q)) * 140
      blit(ctx, n, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d)
    }
    const sp = nucleusSprite(st.nucleons, st.protons, p.pr)
    blit(ctx, sp, p.x, p.y)
    // a neutron turning into a proton: a red flash, an electron flies off
    for (let k = 1; k <= s.protonsEnd - s.protonsStart; k++) {
      const at = s.decay.from + ((s.decay.to - s.decay.from) * k) / (s.protonsEnd - s.protonsStart)
      const q = (t - at) / 0.7
      if (q < 0 || q >= 1) continue
      const a = rnd(k + s.protonsEnd * 3, 135) * Math.PI * 2
      if (q < 0.35) {
        ctx.strokeStyle = `rgba(248, 113, 113, ${0.8 * (1 - q / 0.35)})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, R + 4, 0, Math.PI * 2)
        ctx.stroke()
      }
      const d = R + q * 90
      ctx.save()
      ctx.globalAlpha = 1 - q
      blit(ctx, electrons().outer, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d)
      ctx.restore()
    }
    const el = elementForProtons(st.protons)
    const done = st.protons === s.protonsEnd
    const isHero = s.protonsEnd === 79
    const color = done ? (isHero ? AMBER : AMBER_SOFT) : GREY
    tag(ctx, `${el?.name ?? ''} · ${st.protons} protons`, p.x, p.y + R + 26, color, isHero ? 14 : 13)
    if (isHero && done) {
      const born = fadeIn(t, s.decay.to, 0.6)
      marker(ctx, p.x, p.y, R + 14, idle, born)
      tag(ctx, 'Gold! 79 protons: our hero is born', p.x, p.y - R - 32, AMBER, 15, born)
    }
  }
  tag(ctx, 'in the spray: bare atom cores swallow neutrons, very fast', b.W / 2, 76, GREY, 13, fadeIn(t, 0.4))
  tag(ctx, 'a neutron turns into a proton — an electron flies off', b.W / 2, b.UH - 36, GREY, 13, fadeIn(t, 2.2))
  counter(ctx, b.W, null)
}

// ---------- 🔁 the drill-in: our hero made once more ----------

/** where nucleon number `rank` (the `rank`-th to turn into a proton) sits
 *  in nucleusSprite(n, …, pr), from the nucleus' centre */
function nucleonAt(n: number, rank: number, pr: number) {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const ranks = Array.from({ length: n }, (_, j) => ({ j, r: rnd(j, 61) })).sort((a, b) => a.r - b.r)
  const j = ranks[rank].j
  const r = pr * 1.08 * Math.sqrt(j)
  return { x: r * Math.cos(j * golden), y: r * Math.sin(j * golden) }
}

const HERO = GOLD_SEEDS[0]
const HERO_PR = 2.9
// the replay's own clock (holds at 0, 2.5, 5, 7.5 while a piece is said):
// ① the neutrons fly in, ② one neutron turns (in the callout) and the
// rest follow up to platinum's 78, ③ the 79th: gold
const DR_CAPTURE = { from: 2.6, to: 4.85 }
const DR_FIRST_TURN = 5.3
const DR_TURNS = { from: 5.6, to: 6.7 }
const DR_GOLD = 7.7
const DR_ZOOM = 4

const DR_TURN_COUNT = HERO.protonsEnd - HERO.protonsStart // 53
/** when the k-th new proton (1-based) is born in the replay: the first
 *  alone (the callout), the 2nd … 52nd together (to platinum's 78), the
 *  53rd alone (gold) */
function drillTurnAt(k: number): number {
  if (k === 1) return DR_FIRST_TURN
  if (k === DR_TURN_COUNT) return DR_GOLD
  return DR_TURNS.from + ((DR_TURNS.to - DR_TURNS.from) * (k - 2)) / (DR_TURN_COUNT - 3)
}
/** the hero's protons at replay time t */
function drillProtons(t: number): number {
  let p = HERO.protonsStart
  for (let k = 1; k <= DR_TURN_COUNT; k++) if (t >= drillTurnAt(k)) p++
  return p
}

// holds at 0, 2.5, 5, 7.5. The opener is said over the spray as the stuff
// beat left it (alive on the idle clock); a rewind sweep wipes it to the
// start: our hero a small iron atom again, the other two faded back.
// "First, the small atom swallows neutron after neutron…" → ① they fly in
// and stick, the nucleus grows; "Then some of its neutrons turn into
// protons…" → ② a callout circle opens on the nucleus: one neutron flashes
// and turns red, an electron flies off — then the rest follow, the tag
// climbing through the elements to platinum; "How many protons make
// gold? … Seventy nine!" → ③ the 79th turns: gold, and the hero's amber
// ring. The neutrons and electrons fly on story time, never across a hold.
function drawStuffDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const pre = 1 - fadeIn(t, 0.45, 0.5)
  if (pre > 0) {
    ctx.save()
    ctx.globalAlpha *= pre
    drawStuff(ctx, b, GOLD_T.stuff, idle)
    ctx.restore()
  }
  ctx.save()
  ctx.globalAlpha *= open
  sprayBackdrop(ctx, b, idle)
  const [left, heroPlace, right] = places(b)
  // the other two seeds: back at their start, faded back
  for (const p of [left, right]) {
    ctx.save()
    ctx.globalAlpha *= 0.22
    blit(ctx, nucleusSprite(p.seed.nucleonsStart, p.seed.protonsStart, p.pr), p.x, p.y)
    ctx.restore()
  }
  const { x, y } = heroPlace
  const count = HERO.capture.count
  const landAt = (j: number) => DR_CAPTURE.from + 0.6 + ((DR_CAPTURE.to - DR_CAPTURE.from - 0.6) * (j + 1)) / count
  let nucleons = HERO.nucleonsStart
  for (let j = 0; j < count; j++) if (t >= landAt(j)) nucleons++
  const protons = drillProtons(t)
  const R = nucR(nucleons, HERO_PR)
  // ① the neutrons flying in (0.6 s each, then they stick)
  const n = neutron()
  for (let j = 0; j < count; j++) {
    const q = (t - (landAt(j) - 0.6)) / 0.6
    if (q < 0 || q >= 1) continue
    const a = rnd(j + 79 * 7, 134) * Math.PI * 2
    const d = R + 8 + (1 - easeIn(q)) * 160
    blit(ctx, n, x + Math.cos(a) * d, y + Math.sin(a) * d)
  }
  blit(ctx, nucleusSprite(nucleons, protons, HERO_PR), x, y)
  // ② ③ each new proton: a red flash, an electron flies off
  for (let k = 1; k <= DR_TURN_COUNT; k++) {
    const q = (t - drillTurnAt(k)) / 0.7
    if (q < 0 || q >= 1) continue
    const a = rnd(k + 79 * 3, 135) * Math.PI * 2
    if (q < 0.35) {
      ctx.strokeStyle = `rgba(248, 113, 113, ${0.8 * (1 - q / 0.35)})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, R + 4, 0, Math.PI * 2)
      ctx.stroke()
    }
    const d = R + q * 90
    ctx.save()
    ctx.globalAlpha *= 1 - q
    blit(ctx, electrons().outer, x + Math.cos(a) * d, y + Math.sin(a) * d)
    ctx.restore()
  }
  const el = elementForProtons(protons)
  const gold = protons === HERO.protonsEnd
  tag(ctx, `${el?.name ?? ''} · ${protons} protons`, x, y + R + 40, gold ? AMBER : GREY, 14)
  stepRing(ctx, x, y, R + 18, 1, idle, fadeIn(t, 2.6, 0.4) * (1 - fadeIn(t, 5, 0.4)))
  // ② the callout: the nucleus seen close, centred on the neutron that
  // turns first (it sits where nucleusSprite puts that rank)
  const pop = bounce(t - 5.1, 0.4, 999, 0.1)
  const shut = 1 - fadeIn(t, 7.55, 0.4)
  const cr = Math.min(b.W, b.UH) * 0.17
  const cc = { x: b.W * 0.76, y: b.UH * 0.34 }
  const first = nucleonAt(HERO.nucleonsEnd, HERO.protonsStart, HERO_PR)
  const from = { x: x + first.x, y: y + first.y }
  const inset = pop > 0 ? 0.6 + 0.4 * Math.min(1.1, pop) : 0
  callout(ctx, from, cc, cr * inset, clamp01(pop * 2) * shut, () => {
    const zr = HERO_PR * DR_ZOOM
    const big = nucleusSprite(nucleons, protons, zr)
    const f = nucleonAt(HERO.nucleonsEnd, HERO.protonsStart, zr)
    blit(ctx, big, cc.x - f.x, cc.y - f.y)
    // the turning neutron: a red flash around it, an electron flies off
    const q = (t - DR_FIRST_TURN) / 1.2
    if (q >= 0 && q < 1) {
      if (q < 0.4) {
        ctx.strokeStyle = `rgba(248, 113, 113, ${0.9 * (1 - q / 0.4)})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(cc.x, cc.y, zr * (1.4 + q), 0, Math.PI * 2)
        ctx.stroke()
      }
      const a = -0.6
      const d = zr * 1.2 + easeOut(q) * cr * 1.1
      ctx.save()
      ctx.globalAlpha *= 1 - q * q
      drawGlossyParticle(ctx, 'electrons', cc.x + Math.cos(a) * d, cc.y + Math.sin(a) * d, 2.8 * DR_ZOOM * 0.6)
      ctx.restore()
    }
  })
  if (pop > 0) stepRing(ctx, cc.x, cc.y, cr + 8, 2, idle, fadeIn(t, 5.3, 0.4) * shut)
  // ③ gold: the step ring, then the hero's amber ring
  stepRing(ctx, x, y, R + 24, 3, idle, fadeIn(t, 7.6, 0.4))
  const born = fadeIn(t, DR_GOLD + 0.3, 0.6)
  marker(ctx, x, y, R + 11, idle, born)
  tag(ctx, 'Gold! 79 protons: our hero is born', x, y - R - 50, AMBER, 15, born)
  ctx.restore()
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- beat 8: forward again ----------

function drawForward(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  journey(ctx, b, FORWARD_LEGS, t, idle, 1)
  tapeFx(ctx, b.W, b.H, idle, 1)
  counter(ctx, b.W, t < 2.4 ? null : goldYearsAgo('forward', t))
}

// ---------- beat 9: older than the Earth ----------

function drawOlder(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const ring = ringScene(ctx, b, idle)
  // far above: the two tiny stars where it all began
  const sx = b.W * 0.78
  const sy = b.UH * 0.13
  for (const d of [-1, 1]) {
    const a = idle * 1.2 + (d > 0 ? Math.PI : 0)
    neutronStar(ctx, sx + Math.cos(a) * 12, sy + Math.sin(a) * 6, 3)
  }
  const up = fadeIn(t, 1.4, 1.2)
  if (up > 0) {
    marker(ctx, sx, sy, 20, idle, up)
    ctx.save()
    ctx.globalAlpha = up
    ctx.setLineDash([3, 7])
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(ring.x + 18, ring.y - 12)
    ctx.lineTo(ring.x + (sx - ring.x) * easeOut(up), ring.y + (sy - ring.y) * easeOut(up))
    ctx.stroke()
    ctx.restore()
  }
  // the hero, in a bubble beside the ring
  const bub = fadeIn(t, 0.4, 0.8)
  if (bub > 0) {
    const bx = b.W * 0.78
    const by = b.UH * 0.52
    const R = goldAtomR(0.8) + 16
    ctx.save()
    ctx.globalAlpha = bub
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(ring.x + 18, ring.y)
    ctx.lineTo(bx - R, by)
    ctx.stroke()
    ctx.fillStyle = '#140d02'
    ctx.beginPath()
    ctx.arc(bx, by, R, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    goldAtom(ctx, bx, by, 0.8, idle, bub)
    marker(ctx, bx, by, R - 6, idle, bub)
    tag(ctx, 'our hero, in the ring', bx, by + R + 22, AMBER, 13, bub)
  }
  tag(ctx, 'made by two dead stars, before the Earth was born', b.W / 2, b.UH * 0.06 + 18, AMBER_SOFT, 14, fadeIn(t, 2.6))
  tag(ctx, 'older than the Earth it is worn on', b.W / 2, b.UH - 30, '#fef3c7', 16, fadeIn(t, 4.4))
}

// ---------- the beats ----------

/** draw one beat of the gold story at story time `t` */
export function drawGold(
  ctx: CanvasRenderingContext2D,
  phase: GoldPhase,
  t: number,
  W: number,
  UH: number,
  H: number,
  idle: number,
) {
  const b: Box = { W, UH, H }
  if (phase === 'ring') drawRing(ctx, b, t, idle)
  else if (phase === 'zoom') drawZoom(ctx, b, t, idle)
  else if (phase === 'rewind') drawRewind(ctx, b, t, idle)
  else if (phase === 'stars') drawStars(ctx, b, t, idle)
  else if (phase === 'teaspoon') drawTeaspoon(ctx, b, t, idle)
  else if (phase === 'crash') drawCrash(ctx, b, t, idle)
  else if (phase === 'stuff') drawStuff(ctx, b, t, idle)
  else if (phase === 'stuffDrill') drawStuffDrill(ctx, b, t, idle)
  else if (phase === 'forward') drawForward(ctx, b, t, idle)
  else drawOlder(ctx, b, t, idle)
}
