import { clamp01, easeInOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, lerp, marker, text } from './storyDraw'
import { sinceLaunch } from './laserScenes'
import { ghostCss } from './lightPacket'
import { backdrop, bounce, callout, fadeIn, replayFrame, rewindSweep, scaledAbout, stepRing, type Box, type Pt } from './laserCutScenes'
import { BRIGHT, HINT, K, arrow, big, drawingCard, faded, lamp, lampRow, lampX, stars, tween } from './digitalScenes'
import { cross, router, tablet } from './wifiScenes'
import { ARRIVAL, BROKEN, PACKETS, checkNumber, flipBit, oceanTripS, BLINK_S } from '../core/internet'

// R09 — 🌊 Internet under the ocean (proposal: docs/how-things-work/18-
// proposal-digital-information.md, story 3). One question — Grandma's house
// is thousands of kilometres away, across the ocean: how does the drawing
// get there faster than a blink? — one aha — it is cut into numbered
// packets with an address and a check number; laser blinks carry their
// bits through glass threads on the ocean floor, bouncing off the glass
// wall; routers pass each packet on; a broken one is sent again. Words
// taught: packet, internet, optical fiber. Hero: packet 1, then packet 4.
//   question  the boy's house, the ocean, Grandma's house; the drawing; a
//             long arc and the distance; an eye starts to blink and the
//             light is across before it shuts; "?"
//   packets   the drawing → one long row of lamps → cut into six parcels;
//             each label: to (Grandma's house), from (the boy's), its
//             number; the check number: the lit lamps counted; a look
//   map       out by the cable, router to router, town to coast, down to
//             the ocean floor and across; all the roads between all the
//             routers: the internet
//   cable     the camera dives into the cable: plastic, steel, a tube of
//             glass threads; a fiber beside a hair; the fiber named
//   trick     a laser blinks the bits in (a lamp on = a flash); the light
//             zigzags, bumping the glass wall; the thread bends, the light
//             follows; under water, the surface is a mirror
//   drill     🔁 ① a slant ② the wall a mirror ③ all the way across
//   routers   a crossing: the router reads the label, picks the road;
//             packet 3 takes a longer road; they arrive 1 2 4 5 3 6; the
//             tablet puts them back in order
//   broken    noise flips a lamp of packet 4; counted: seven, the check
//             number says six ✕; "send number four again" runs back; a
//             fresh copy, six = six ✓
//   blink     a stopwatch: 0.03 s across the ocean; a blink (slowed) ten
//             times longer; the drawing on Grandma's tablet; it dims
// Every line is science pacing (piece k spoken while story time stands at
// 2.5·(k−1) s, its event in the watch break after it).

export const INTERNET_ORDER = ['question', 'packets', 'map', 'cable', 'trick', 'drill', 'routers', 'broken', 'blink'] as const
export type InternetBeat = (typeof INTERNET_ORDER)[number]

/** story seconds per beat: 2.5 s per piece (plus a look where noted) */
export const INTERNET_T: Record<InternetBeat, number> = {
  question: 7.5,
  // + 2.5 s after the check number: time to look (data)
  packets: 12.5,
  map: 10,
  cable: 7.5,
  trick: 10,
  drill: 10,
  routers: 10,
  broken: 10,
  // the end plays out, then the picture dims before the menu returns
  blink: 11.5,
}

/** the fibre's light is infrared — invisible, drawn ghost-pale */
const IR = (a: number) => ghostCss(a < 0.5 ? 0.6 : a)
const CARDBOARD = '#b7793d'

// ---------- 🏠 the world: two shores and the ocean ----------

/** a small house (the boy's has a slate roof, Grandma's a red one) */
function miniHouse(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, roof: string, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#475569'
    ctx.fillRect(x - 26 * k, y - 34 * k, 52 * k, 34 * k)
    ctx.fillStyle = roof
    ctx.beginPath()
    ctx.moveTo(x - 33 * k, y - 33 * k)
    ctx.lineTo(x, y - 60 * k)
    ctx.lineTo(x + 33 * k, y - 33 * k)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(x - 16 * k, y - 25 * k, 12 * k, 11 * k)
  })
}
const BOY_ROOF = '#475e8a'
const GRAN_ROOF = '#9a3412'

function worldGeo(b: Box) {
  const k = K(b)
  const ground = b.UH * 0.56
  const floor = b.UH * 0.88
  const deep = ground + 26 * k
  const X = (q: number) => b.W * q
  const nodes = [
    { x: X(0.12), kind: 'street' },
    { x: X(0.19), kind: 'town' },
    { x: X(0.26), kind: 'coast' },
    { x: X(0.74), kind: 'coast' },
    { x: X(0.81), kind: 'town' },
    { x: X(0.88), kind: 'street' },
  ]
  // the cable: from the boy's house, under the ground, router to router,
  // down to the ocean floor, across, up, to Grandma's house
  const cable: Pt[] = [
    { x: X(0.05), y: ground },
    { x: X(0.05), y: deep },
    { x: X(0.26), y: deep },
    { x: X(0.33), y: floor },
    { x: X(0.67), y: floor },
    { x: X(0.74), y: deep },
    { x: X(0.95), y: deep },
    { x: X(0.95), y: ground },
  ]
  return { k, ground, floor, deep, nodes, cable, boy: { x: X(0.05), y: ground }, gran: { x: X(0.95), y: ground }, coastL: X(0.3), coastR: X(0.7) }
}

const pathLen = (p: Pt[]) => p.slice(1).reduce((n, q, i) => n + Math.hypot(q.x - p[i].x, q.y - p[i].y), 0)
function along(p: Pt[], d: number): Pt {
  d = Math.max(0, d)
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y)
    if (d <= L) return { x: lerp(p[i - 1].x, p[i].x, d / L), y: lerp(p[i - 1].y, p[i].y, d / L) }
    d -= L
  }
  return p[p.length - 1]
}
/** how far along the cable (px) a point of x lies, on the land parts */
function distAt(p: Pt[], x: number): number {
  let d = 0
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]
    const c = p[i]
    const L = Math.hypot(c.x - a.x, c.y - a.y)
    if ((x - a.x) * (x - c.x) <= 0 && c.x !== a.x) return d + (L * (x - a.x)) / (c.x - a.x)
    d += L
  }
  return d
}

/** the land on the globe, seen from above the Atlantic (u right, v down,
 *  radius 1): rough but recognisable outlines */
const LANDS: Array<Array<[number, number]>> = [
  // North America
  [[-0.98, -0.42], [-0.86, -0.66], [-0.62, -0.8], [-0.4, -0.78], [-0.3, -0.62], [-0.22, -0.5], [-0.34, -0.42], [-0.4, -0.3], [-0.5, -0.22], [-0.56, -0.08], [-0.66, -0.06], [-0.72, -0.2], [-0.86, -0.26]],
  // Greenland
  [[-0.32, -0.92], [-0.12, -0.96], [-0.04, -0.82], [-0.14, -0.68], [-0.26, -0.72]],
  // South America
  [[-0.56, -0.04], [-0.42, -0.02], [-0.26, 0.08], [-0.16, 0.2], [-0.2, 0.36], [-0.3, 0.52], [-0.38, 0.78], [-0.46, 0.72], [-0.48, 0.48], [-0.54, 0.26], [-0.62, 0.1]],
  // Europe
  [[0.1, -0.56], [0.18, -0.7], [0.32, -0.8], [0.52, -0.78], [0.62, -0.6], [0.56, -0.44], [0.42, -0.36], [0.3, -0.4], [0.2, -0.36], [0.12, -0.44]],
  // Africa
  [[0.1, -0.26], [0.28, -0.32], [0.44, -0.3], [0.56, -0.14], [0.66, 0.0], [0.58, 0.24], [0.48, 0.46], [0.38, 0.62], [0.3, 0.6], [0.26, 0.36], [0.2, 0.12], [0.08, 0.04], [0.02, -0.1]],
]
/** routers (u, v) and the cables between them — `true` = on the ocean floor */
const ROUTERS: Array<[number, number]> = [
  [-0.7, -0.5], [-0.46, -0.6], [-0.52, -0.28], [-0.36, 0.3], [-0.4, 0.56],
  [0.3, -0.62], [0.42, -0.46], [0.26, -0.1], [0.4, 0.3],
]
const LINKS: Array<[number, number, boolean]> = [
  [0, 1, false], [0, 2, false], [1, 2, false], [2, 3, false], [3, 4, false],
  [5, 6, false], [6, 7, false], [7, 8, false], [5, 7, false],
  [1, 5, true], [2, 6, true], [3, 7, true], [4, 8, true],
]

interface WorldOpts {
  /** 0…1: the internet's other roads appear */
  web?: number
  /** each router node's glow (0…1) */
  glow?: (i: number) => number
  cableHi?: number
}

function world(ctx: CanvasRenderingContext2D, b: Box, idle: number, o: WorldOpts = {}) {
  const g = worldGeo(b)
  const k = g.k
  backdrop(ctx, b)
  stars(ctx, b, idle, 40)
  // the ocean between the coasts
  ctx.fillStyle = '#0c3b5c'
  ctx.beginPath()
  ctx.moveTo(g.coastL - 30 * k, g.ground + 4)
  ctx.lineTo(g.coastR + 30 * k, g.ground + 4)
  ctx.lineTo(b.W * 0.68, g.floor + 10 * k)
  ctx.lineTo(b.W * 0.32, g.floor + 10 * k)
  ctx.closePath()
  ctx.fill()
  ctx.fillRect(b.W * 0.32, g.floor, b.W * 0.36, 10 * k)
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = g.coastL - 26 * k; x <= g.coastR + 26 * k; x += 6) {
    const y = g.ground + 6 + Math.sin(x / 20 + idle * 1.4) * 2.5
    if (x === g.coastL - 26 * k) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  // the land: two shores, the sea floor
  ctx.fillStyle = '#16233a'
  ctx.beginPath()
  ctx.moveTo(0, g.ground)
  ctx.lineTo(g.coastL - 30 * k, g.ground)
  ctx.lineTo(b.W * 0.32, g.floor + 10 * k)
  ctx.lineTo(b.W * 0.68, g.floor + 10 * k)
  ctx.lineTo(g.coastR + 30 * k, g.ground)
  ctx.lineTo(b.W, g.ground)
  ctx.lineTo(b.W, b.UH)
  ctx.lineTo(0, b.UH)
  ctx.closePath()
  ctx.fill()
  // the internet: the globe (the Atlantic in the middle — the ocean the
  // story crosses), its land, the routers, and the cables between them:
  // over land and on the ocean floor (Elena, 2026-11-22: real land shapes,
  // and cables named)
  if (o.web) {
    const G = { x: b.W * 0.5, y: b.UH * 0.2, r: Math.min(b.W, b.UH) * 0.16 }
    const P = (u: number, v: number) => ({ x: G.x + u * G.r, y: G.y + v * G.r })
    faded(ctx, o.web, () => {
      ctx.fillStyle = '#0c2a4a'
      ctx.beginPath()
      ctx.arc(G.x, G.y, G.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.save()
      ctx.clip()
      ctx.fillStyle = '#2f5d3a'
      for (const land of LANDS) {
        ctx.beginPath()
        land.forEach(([u, v], n) => {
          const p = P(u, v)
          if (n === 0) ctx.moveTo(p.x, p.y)
          else {
            const [pu, pv] = land[n - 1]
            const m = P((pu + u) / 2, (pv + v) / 2)
            ctx.quadraticCurveTo(P(pu, pv).x, P(pu, pv).y, m.x, m.y)
          }
        })
        ctx.closePath()
        ctx.fill()
      }
      // cables: over land (thin), across the ocean floor (bright)
      for (const [a, c, sea] of LINKS) {
        const p0 = P(...ROUTERS[a])
        const p1 = P(...ROUTERS[c])
        ctx.strokeStyle = sea ? 'rgba(253, 230, 138, 0.9)' : 'rgba(253, 230, 138, 0.45)'
        ctx.lineWidth = sea ? 2.5 : 1.5
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        if (sea) ctx.quadraticCurveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2 + G.r * 0.12, p1.x, p1.y)
        else ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }
      for (const [u, v] of ROUTERS) {
        const p = P(u, v)
        lamp(ctx, p.x, p.y, 3.5 * k, 1)
      }
      ctx.restore()
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(G.x, G.y, G.r, 0, Math.PI * 2)
      ctx.stroke()
    })
  }
  // the cable
  ctx.strokeStyle = o.cableHi ? `rgba(251, 191, 36, ${0.5 + 0.5 * o.cableHi})` : '#334155'
  ctx.lineWidth = 4 * k
  ctx.beginPath()
  g.cable.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()
  // the routers along the way, on posts down to the cable
  g.nodes.forEach((n, i) => {
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(n.x, g.ground)
    ctx.lineTo(n.x, g.deep)
    ctx.stroke()
    const gl = o.glow ? o.glow(i) : 0
    if (gl > 0) {
      const gr = ctx.createRadialGradient(n.x, g.ground - 6 * k, 2, n.x, g.ground - 6 * k, 30 * k)
      gr.addColorStop(0, `rgba(251, 191, 36, ${0.6 * gl})`)
      gr.addColorStop(1, 'rgba(251, 191, 36, 0)')
      ctx.fillStyle = gr
      ctx.fillRect(n.x - 30 * k, g.ground - 36 * k, 60 * k, 60 * k)
    }
    router(ctx, n.x, g.ground, k * 0.6, idle + i)
  })
  miniHouse(ctx, g.boy.x + 8 * k, g.ground, k * 1.2, BOY_ROOF)
  miniHouse(ctx, g.gran.x - 8 * k, g.ground, k * 1.2, GRAN_ROOF)
  return g
}

// ---------- 📦 a packet ----------

interface ParcelOpts {
  /** the label's parts popping in: to · from · number · check */
  to?: number
  from?: number
  num?: number
  check?: number
  /** lamps lit differently (a broken packet) */
  bits?: string
  alpha?: number
  /** a red tint on one lamp */
  badLamp?: number
  /** "look!" bounces (0…1): the packet's number, its check number, and
   *  each of its lamps (a one being counted) */
  numPop?: number
  checkPop?: number
  lampPop?: (j: number) => number
}

/** a label badge that bounces and turns amber while it is emphasised */
function badge(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, pop = 0) {
  if (pop > 0.02) {
    const k = 1 + 0.5 * pop
    const w = size * (s.length * 0.62 + 0.9) * k
    const h = size * 1.5 * k
    ctx.save()
    ctx.globalAlpha *= Math.min(1, pop * 1.5)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)'
    ctx.beginPath()
    ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2)
    ctx.fill()
    ctx.restore()
  }
  scaledAbout(ctx, x, y, 1 + 0.6 * pop, () => text(ctx, s, x, y, pop > 0.3 ? '#0f172a' : color, size, '800'))
}

/** a packet: a parcel of eight lamps, its label on top. Scale s (1 = the
 *  packets beat's size), centred on (x, y). */
function parcel(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, n: number, o: ParcelOpts = {}) {
  const p = PACKETS[n - 1]
  const bits = o.bits ?? p.bits
  const gap = 15 * s
  const w = 8 * gap + 10 * s
  const h = 26 * s
  faded(ctx, o.alpha ?? 1, () => {
    ctx.fillStyle = CARDBOARD
    ctx.beginPath()
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 5 * s)
    ctx.fill()
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.6)'
    ctx.lineWidth = 1.2
    ctx.stroke()
    lampRow(ctx, x, y, bits, { r: 5 * s, gap, grow: o.lampPop })
    if (o.badLamp !== undefined) {
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.95)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(lampX(x, 8, gap, o.badLamp), y, 8 * s, 0, Math.PI * 2)
      ctx.stroke()
    }
    // the label: to · from · number, and the check number on the right
    const ly = y - h / 2 - 13 * s
    const parts: Array<[number | undefined, () => void]> = [
      [o.to, () => miniHouse(ctx, x - w / 2 + 14 * s, ly + 9 * s, s * 0.32, GRAN_ROOF)],
      [o.from, () => miniHouse(ctx, x - w / 2 + 36 * s, ly + 9 * s, s * 0.32, BOY_ROOF)],
      [o.num, () => badge(ctx, `#${n}`, x - w / 2 + 62 * s, ly, 12 * s, '#0f172a', o.numPop ?? 0)],
      [o.check, () => badge(ctx, `✓${checkNumber(p.bits)}`, x + w / 2 - 16 * s, ly, 12 * s, '#065f46', o.checkPop ?? 0)],
    ]
    if (parts.some(([a]) => (a ?? 0) > 0)) {
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.roundRect(x - w / 2 + 2 * s, ly - 9 * s, w - 4 * s, 18 * s, 4 * s)
      ctx.fill()
      for (const [a, draw] of parts) if ((a ?? 0) > 0) faded(ctx, a!, draw)
    }
  })
  return { w, h }
}

// ---------- ❓ the question ----------

/** an eye from the front, its lid closed by `shut` (0 open … 1 shut) */
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, shut: number) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x - r, y)
  ctx.quadraticCurveTo(x, y - r * 0.9, x + r, y)
  ctx.quadraticCurveTo(x, y + r * 0.9, x - r, y)
  ctx.closePath()
  ctx.fillStyle = '#f8fafc'
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = '#2563eb'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.38, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.17, 0, Math.PI * 2)
  ctx.fill()
  // the lid comes down from the top
  ctx.fillStyle = '#e8b796'
  ctx.fillRect(x - r, y - r, 2 * r, r * 1.9 * shut)
  ctx.restore()
  ctx.strokeStyle = '#b9876b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - r, y)
  ctx.quadraticCurveTo(x, y - r * 0.9, x + r, y)
  ctx.quadraticCurveTo(x, y + r * 0.9, x - r, y)
  ctx.stroke()
}

function drawQuestion(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const g = world(ctx, b, idle)
  const k = g.k
  // piece 1: the two houses bounce as they are named
  const said = sinceLaunch('iq:said', t, 0, idle)
  const boyN = bounce(said, 0.4, 0.9, 0.4)
  const granN = bounce(said - 2.2, 0.4, 1.4, 0.45)
  if (boyN > 0) marker(ctx, g.boy.x + 8 * k, g.ground - 30 * k, 40 * k, idle, Math.min(1, boyN))
  if (granN > 0) marker(ctx, g.gran.x - 8 * k, g.ground - 30 * k, 40 * k, idle, Math.min(1, granN))
  // piece 2's event: the drawing, a long arc over the ocean, the distance
  const dIn = bounce(sinceLaunch('iq:draw', t, 2.6, idle), 0.35, 999, 0.1)
  if (dIn > 0) scaledAbout(ctx, g.boy.x + 34 * k, g.ground - 110 * k, Math.min(1.15, dIn), () => drawingCard(ctx, g.boy.x + 34 * k, g.ground - 110 * k, 60 * k))
  const arc = tween(t, 3.2, 1.2)
  if (arc > 0) {
    ctx.save()
    ctx.setLineDash([8, 8])
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    const x0 = g.boy.x + 60 * k
    const x1 = g.gran.x - 30 * k
    for (let q = 0; q <= arc; q += 0.02) {
      const x = lerp(x0, x1, q)
      const y = g.ground - 110 * k - Math.sin(q * Math.PI) * b.UH * 0.12
      if (q === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()
    faded(ctx, tween(t, 4.2, 0.4), () => big(ctx, '6,000 km', b.W / 2, g.ground - 110 * k - b.UH * 0.15, 26 * k, AMBER_SOFT))
  }
  // piece 3's event: an eye begins to blink — and the light is across the
  // ocean before it shuts (slowed a lot); then "?"
  const blink = sinceLaunch('iq:blink', t, 5.1, idle)
  if (blink >= 0) {
    const shut = Math.min(1, blink / 1.6)
    eye(ctx, b.W * 0.5, b.UH * 0.13, 44 * k, Math.sin(Math.min(1, shut) * Math.PI) * 0.95)
    const L = pathLen(g.cable)
    const d = Math.min(1, blink / 0.35) * L
    for (let i = 0; i < 6; i++) {
      const p = along(g.cable, d - i * 14)
      lamp(ctx, p.x, p.y, 4.5 * k, 1, 1 - i / 6)
    }
  }
  const ask = bounce(sinceLaunch('iq:ask', t, 6.4, idle), 0.4, 999, 0.1)
  if (ask > 0) scaledAbout(ctx, b.W * 0.78, b.UH * 0.14, Math.min(1.15, ask), () => big(ctx, '?', b.W * 0.78, b.UH * 0.14, 72 * k, AMBER_SOFT))
}

// ---------- 📦 packets ----------

function packetRow(b: Box) {
  const k = K(b)
  const pos = [0, 1, 2, 3, 4, 5].map((i) => ({ x: b.W * (0.2 + 0.3 * (i % 3)), y: b.UH * (i < 3 ? 0.44 : 0.62) }))
  return { k, pos, s: k * 1.25 }
}

function drawPackets(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const R = packetRow(b)
  const all = PACKETS.map((p) => p.bits).join('')
  // piece 1's event: the drawing becomes one long row of lamps
  const card = 1 - tween(t, 0.3, 0.5)
  drawingCard(ctx, b.W * 0.12, b.UH * 0.18, 90 * k, card + (t < 0.3 ? 1 : 0))
  const rowGap = (b.W * 0.86) / 47
  const rowY = b.UH * 0.3
  // piece 2's event: the row is cut into six parcels, which drop into place
  const cut = tween(t, 2.6, 0.7)
  const drop = tween(t, 3.4, 0.9)
  const named = bounce(sinceLaunch('ip:named', t, 2.35, idle) - 1.7, 0.4, 1.6, 0.45)
  for (let n = 1; n <= 6; n++) {
    const i = n - 1
    const x0 = lerp(lampX(b.W / 2, 48, rowGap, i * 8 + 3.5), lampX(b.W / 2, 48, rowGap, i * 8 + 3.5) + (i - 2.5) * 14 * k, cut)
    if (drop <= 0) {
      lampRow(ctx, x0, rowY, all.slice(i * 8, i * 8 + 8), {
        r: Math.min(5, rowGap * 0.35),
        gap: rowGap,
        pop: (j) => tween(t, 0.6 + ((i * 8 + j) / 48) * 1.6, 0.2),
      })
      if (cut > 0) {
        ctx.strokeStyle = `rgba(183, 121, 61, ${cut})`
        ctx.lineWidth = 2
        ctx.strokeRect(x0 - 4 * rowGap - 3, rowY - 9, 8 * rowGap + 6, 18)
      }
    } else {
      const x = lerp(x0, R.pos[i].x, drop)
      const y = lerp(rowY, R.pos[i].y, drop)
      // piece 3: the label's parts pop in as they are said (on every
      // parcel: to · from), then the numbers one by one
      const said3 = sinceLaunch('ip:said3', t, 4.85, idle)
      const toA = clamp01((said3 - 1.4) * 3)
      const fromA = clamp01((said3 - 2.5) * 3)
      const numA = tween(t, 5.2 + i * 0.3, 0.3)
      const checkA = n === 1 ? tween(t, 9.3, 0.3) : tween(t, 10.2 + i * 0.15, 0.3)
      // the numbers: all bounce while "its number in the line" is said,
      // then each one again as it is stamped on (1, 2, 3 … in order)
      const numPop = Math.max(bounce(said3 - 3.3, 0.3, 0.7, 0.35), bounce(sinceLaunch(`ip:num${i}`, t, 5.2 + i * 0.3, idle), 0.3, 0.4, 0.35))
      const checkPop = n === 1 ? 0 : bounce(sinceLaunch(`ip:chk${i}`, t, 10.2 + i * 0.15, idle), 0.3, 0.4, 0.35)
      scaledAbout(ctx, x, y, 1 + 0.12 * named, () =>
        parcel(ctx, x, y, R.s * lerp(0.6, 1, drop), n, { to: toA, from: fromA, num: numA, check: checkA, numPop, checkPop }),
      )
    }
  }
  // piece 4's event: packet 1, big — its lit lamps counted: the check number
  const big1 = tween(t, 7.6, 0.6)
  if (big1 > 0) {
    const cx = b.W * 0.5
    const cy = b.UH * 0.86
    const s = k * 1.9
    faded(ctx, big1, () => {
      const bits = PACKETS[0].bits
      const countAt: number[] = []
      for (let j = 0, c = 0; j < 8; j++) countAt.push(bits[j] === '1' ? 8.0 + c++ * 0.2 : -1)
      parcel(ctx, cx, cy, s, 1, {
        to: 1,
        from: 1,
        num: 1,
        check: tween(t, 9.3, 0.3),
        checkPop: bounce(sinceLaunch('ip:check1', t, 9.3, idle), 0.35, 1.4, 0.4),
        lampPop: (j) => (countAt[j] < 0 ? 0 : bounce(sinceLaunch(`ip:l${j}`, t, countAt[j], idle), 0.18, 0.25, 0.3)),
      })
      let c = 0
      for (let j = 0; j < 8; j++) {
        if (bits[j] !== '1') continue
        c++
        const at = 8.0 + (c - 1) * 0.2
        const pop = bounce(sinceLaunch(`ip:c${j}`, t, at, idle), 0.25, 999, 0.1)
        if (pop > 0) {
          const x = lampX(cx, 8, 15 * s, j)
          scaledAbout(ctx, x, cy + 30 * s, Math.min(1.15, pop), () => big(ctx, String(c), x, cy + 30 * s, 16 * k, AMBER_SOFT))
        }
      }
    })
    marker(ctx, cx + 4 * 15 * s - 16 * s, cy - 26 * s, 20 * k, idle, tween(t, 9.3, 0.3))
  }
}

// ---------- 🗺️ the big picture ----------

/** the six packets travelling the cable: their front is `d` px along it */
function packetsOnCable(ctx: CanvasRenderingContext2D, g: ReturnType<typeof worldGeo>, d: number, idle: number, alpha = 1) {
  for (let i = 0; i < 6; i++) {
    const p = along(g.cable, d - i * 30 * g.k)
    const bob = Math.sin(idle * 4 + i) * 1.2
    faded(ctx, alpha, () => {
      ctx.fillStyle = CARDBOARD
      ctx.beginPath()
      ctx.roundRect(p.x - 10 * g.k, p.y - 7 * g.k + bob, 20 * g.k, 14 * g.k, 3)
      ctx.fill()
      lamp(ctx, p.x, p.y + bob, 3 * g.k, 1)
    })
  }
}

function drawMap(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const gg = worldGeo(b)
  const L = pathLen(gg.cable)
  // the packets' front along the cable, piece by piece: out of the house
  // (p1) → router to router to the coast (p2) → across the ocean floor (p3)
  const dCoast = distAt(gg.cable, b.W * 0.26)
  const dFar = distAt(gg.cable, b.W * 0.74) + 1
  const dStreet = distAt(gg.cable, b.W * 0.1)
  const front =
    t < 2.5
      ? lerp(0, dStreet, tween(t, 0.2, 2.0))
      : t < 5
        ? lerp(dStreet, dCoast, tween(t, 2.6, 2.2))
        : t < 7.5
          ? lerp(dCoast, dFar, tween(t, 5.1, 2.2))
          : lerp(dFar, L, tween(t, 7.6, 2.2))
  const named = bounce(sinceLaunch('im:named', t, 7.35, idle) - 2.6, 0.4, 1.6, 0.45)
  const web = tween(t, 7.6, 1.0)
  const g = world(ctx, b, idle, {
    web,
    cableHi: Math.max(named, web * 0.4),
    glow: (i) => {
      const d = distAt(gg.cable, gg.nodes[i].x)
      const near = 1 - clamp01(Math.abs(front - 30 * gg.k * 2.5 - d) / (60 * gg.k))
      return Math.max(near, named)
    },
  })
  packetsOnCable(ctx, g, front, idle)
}

// ---------- 🧵 inside the cable ----------

function crossSection(ctx: CanvasRenderingContext2D, x: number, y: number, R: number, idle: number, o: { layers?: number; fiberHi?: number } = {}) {
  const lay = o.layers ?? 1
  // outer plastic
  ctx.fillStyle = '#111827'
  ctx.beginPath()
  ctx.arc(x, y, R, 0, Math.PI * 2)
  ctx.fill()
  // steel wires
  faded(ctx, clamp01(lay * 3), () => {
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2
      ctx.fillStyle = '#9ca3af'
      ctx.beginPath()
      ctx.arc(x + Math.cos(a) * R * 0.74, y + Math.sin(a) * R * 0.74, R * 0.1, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  // copper tube, then the jelly-filled tube with the glass threads
  faded(ctx, clamp01(lay * 3 - 1), () => {
    ctx.fillStyle = '#b45309'
    ctx.beginPath()
    ctx.arc(x, y, R * 0.56, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(x, y, R * 0.46, 0, Math.PI * 2)
    ctx.fill()
  })
  faded(ctx, clamp01(lay * 3 - 2), () => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.3
      const fx = x + Math.cos(a) * R * 0.25
      const fy = y + Math.sin(a) * R * 0.25
      const tw = 0.6 + 0.4 * Math.sin(idle * 3 + i * 1.7)
      const gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, R * 0.07)
      gr.addColorStop(0, `rgba(240, 249, 255, ${tw})`)
      gr.addColorStop(1, 'rgba(186, 230, 253, 0.2)')
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.arc(fx, fy, R * 0.06, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  if (o.fiberHi) {
    const a = 0.3
    marker(ctx, x + Math.cos(a) * R * 0.25, y + Math.sin(a) * R * 0.25, R * 0.1, idle, o.fiberHi)
  }
}

function drawCable(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const k = K(b)
  // piece 1's event: the camera dives into the cable on the ocean floor
  const dive = tween(t, 0.1, 2.0)
  const gg = worldGeo(b)
  const at = { x: b.W * 0.5, y: gg.floor }
  if (dive < 1) {
    faded(ctx, 1 - dive, () => {
      ctx.save()
      const s = 1 + dive * 6
      ctx.translate(at.x, at.y)
      ctx.scale(s, s)
      ctx.translate(-at.x, -at.y)
      world(ctx, b, idle)
      ctx.restore()
    })
  } else backdrop(ctx, b)
  const c = { x: b.W * 0.34, y: b.UH * 0.48, R: Math.min(b.W, b.UH) * 0.26 }
  // piece 2's event: the layers, outside in; then a thread beside a hair
  const layers = t < 2.5 ? 1 : tween(t, 2.6, 1.0)
  const named = bounce(sinceLaunch('ic:named', t, 4.85, idle) - 1.6, 0.4, 1.8, 0.45)
  faded(ctx, dive, () => scaledAbout(ctx, c.x, c.y, dive, () => crossSection(ctx, c.x, c.y, c.R, idle, { layers, fiberHi: named })))
  const hair = tween(t, 3.8, 0.6)
  if (hair > 0) {
    const cx = b.W * 0.8
    const fy = b.UH * 0.4
    const hy = b.UH * 0.58
    faded(ctx, hair, () => {
      // a glass thread, much enlarged…
      const g1 = ctx.createLinearGradient(0, fy - 12 * k, 0, fy + 12 * k)
      g1.addColorStop(0, 'rgba(186, 230, 253, 0.35)')
      g1.addColorStop(0.5, 'rgba(240, 249, 255, 0.95)')
      g1.addColorStop(1, 'rgba(186, 230, 253, 0.35)')
      ctx.fillStyle = g1
      ctx.beginPath()
      ctx.roundRect(cx - 100 * k, fy - 12 * k, 200 * k, 24 * k, 12 * k)
      ctx.fill()
      // …and a hair, enlarged just as much
      ctx.strokeStyle = '#7c4a2a'
      ctx.lineWidth = 18 * k
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - 100 * k, hy)
      ctx.bezierCurveTo(cx - 40 * k, hy - 10 * k, cx + 40 * k, hy + 10 * k, cx + 100 * k, hy - 4 * k)
      ctx.stroke()
    })
    callout(ctx, { x: c.x + c.R * 0.24, y: c.y + c.R * 0.08 }, { x: cx - 140 * k, y: b.UH * 0.49 }, 1, hair * 0.7, () => {})
  }
  if (named > 0) {
    const cx = b.W * 0.8
    const fy = b.UH * 0.4
    faded(ctx, Math.min(1, named), () => {
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.roundRect(cx - 110 * k, fy - 22 * k, 220 * k, 44 * k, 22 * k)
      ctx.stroke()
    })
  }
}

// ---------- 🪞 the light trick ----------

interface Fiber {
  x0: number
  x1: number
  y0: number
  hc: number
  hw: number
  bend: number
  H: number
}
const fiberC = (f: Fiber, s: number) => ({ x: lerp(f.x0, f.x1, s), y: f.y0 + f.bend * f.H * Math.sin(Math.PI * s) })
function fiberN(f: Fiber, s: number) {
  const dx = f.x1 - f.x0
  const dy = f.bend * f.H * Math.PI * Math.cos(Math.PI * s)
  const L = Math.hypot(dx, dy)
  return { x: -dy / L, y: dx / L }
}
const fiberAt = (f: Fiber, s: number, off: number) => {
  const c = fiberC(f, s)
  const n = fiberN(f, s)
  return { x: c.x + n.x * off, y: c.y + n.y * off }
}

function drawFiber(ctx: CanvasRenderingContext2D, f: Fiber) {
  const band = (off: number, color: string) => {
    ctx.fillStyle = color
    ctx.beginPath()
    for (let s = 0; s <= 1.0001; s += 0.01) {
      const p = fiberAt(f, s, -off)
      if (s === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    for (let s = 1; s >= -0.0001; s -= 0.01) {
      const p = fiberAt(f, s, off)
      ctx.lineTo(p.x, p.y)
    }
    ctx.closePath()
    ctx.fill()
  }
  band(f.hw, 'rgba(148, 197, 233, 0.22)')
  band(f.hc, 'rgba(186, 230, 253, 0.28)')
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)'
  ctx.lineWidth = 1.5
  for (const off of [-f.hc, f.hc]) {
    ctx.beginPath()
    for (let s = 0; s <= 1.0001; s += 0.01) {
      const p = fiberAt(f, s, off)
      if (s === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }
}

/** the light's zigzag inside the core: N bounces, alternately on each wall */
function zigzag(f: Fiber, N: number): Pt[] {
  const pts: Pt[] = [fiberAt(f, 0, 0)]
  for (let i = 1; i <= N; i++) pts.push(fiberAt(f, (i - 0.5) / N, (i % 2 ? -1 : 1) * f.hc))
  pts.push(fiberAt(f, 1, 0))
  return pts
}

/** light pulses along a path: blinks (bit 1) and gaps (bit 0) moving on the
 *  idle clock; `since` = seconds since they set off */
function pulses(ctx: CanvasRenderingContext2D, path: Pt[], since: number, bits: string, speed: number, alpha = 1) {
  if (since < 0) return
  const L = pathLen(path)
  const front = since * speed
  const step = 26
  ctx.save()
  ctx.globalAlpha *= alpha
  for (let j = 0; j * step <= front; j++) {
    const d = front - j * step
    if (d > L) continue
    if (bits[j % bits.length] !== '1') continue
    const p = along(path, d)
    const q = along(path, Math.max(0, d - 14))
    ctx.strokeStyle = IR(0.95)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(q.x, q.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }
  ctx.restore()
}

function laserBox(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, on: number) {
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(x - 60 * k, y - 18 * k, 60 * k, 36 * k, 6 * k)
  ctx.fill()
  if (on > 0) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, 22 * k)
    g.addColorStop(0, `rgba(240, 249, 255, ${0.9 * on})`)
    g.addColorStop(1, 'rgba(240, 249, 255, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, 22 * k, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawTrick(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const bend = tween(t, 5.2, 1.2)
  const f: Fiber = { x0: b.W * 0.14, x1: b.W * 0.96, y0: b.UH * 0.36, hc: 26 * k, hw: 44 * k, bend, H: b.UH * 0.16 }
  drawFiber(ctx, f)
  const bits = PACKETS[0].bits
  // piece 1: the laser and the packet's lamps; while it is said, a lit lamp
  // blinks the laser on, a dark one leaves it off
  const said = sinceLaunch('it:said', t, 0, idle)
  const blinkI = Math.floor(Math.max(0, said) / 0.45) % 8
  const on = said >= 0 && bits[blinkI] === '1' ? 1 : 0
  laserBox(ctx, f.x0, f.y0, k, on)
  lampRow(ctx, b.W * 0.3, b.UH * 0.1, bits, { r: 8 * k, gap: 24 * k })
  if (said >= 0) marker(ctx, lampX(b.W * 0.3, 8, 24 * k, blinkI), b.UH * 0.1, 14 * k, idle)
  // the blinks travel in, zigzagging (piece 1's event on)
  const path = zigzag(f, 9)
  pulses(ctx, path, sinceLaunch('it:go', t, 0.1, idle), bits, 260)
  // piece 2's event: one ray drawn slowly, an amber dot where it bumps
  const ray = tween(t, 2.6, 2.0)
  if (ray > 0) {
    const L = pathLen(path)
    const upto = ray * L * 0.55
    ctx.strokeStyle = AMBER_SOFT
    ctx.lineWidth = 2
    ctx.beginPath()
    let acc = 0
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i++) {
      const seg = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
      if (acc + seg > upto) {
        const q = (upto - acc) / seg
        ctx.lineTo(lerp(path[i - 1].x, path[i].x, q), lerp(path[i - 1].y, path[i].y, q))
        break
      }
      ctx.lineTo(path[i].x, path[i].y)
      acc += seg
      ctx.stroke()
      ctx.fillStyle = AMBER
      ctx.beginPath()
      ctx.arc(path[i].x, path[i].y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(path[i].x, path[i].y)
    }
    ctx.stroke()
  }
  // piece 4's event: under water, looking up — the surface a mirror
  const pool = tween(t, 7.6, 0.5)
  if (pool > 0) {
    const c = { x: b.W * 0.7, y: b.UH * 0.78, r: 110 * k }
    faded(ctx, pool, () => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = '#0e7490'
      ctx.fillRect(c.x - c.r, c.y - c.r, 2 * c.r, 2 * c.r)
      // the pool floor's tiles, and their mirror image in the surface
      const surf = c.y - c.r * 0.55
      const floorY = c.y + c.r * 0.6
      ctx.fillStyle = 'rgba(224, 242, 254, 0.5)'
      for (let i = -6; i <= 6; i++) {
        ctx.fillRect(c.x + i * 22 * k - 9 * k, floorY, 18 * k, 8 * k)
        ctx.fillRect(c.x + i * 22 * k - 9 * k, surf - 2 * k - 8 * k * 0.6, 18 * k, 8 * k * 0.6)
      }
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)'
      ctx.fillRect(c.x - c.r, surf - 1.5, 2 * c.r, 3)
      // the swimmer's head, looking up at a slant
      const hx = c.x - c.r * 0.45
      const hy = c.y + c.r * 0.25
      ctx.fillStyle = '#e8b796'
      ctx.beginPath()
      ctx.arc(hx, hy, 14 * k, 0, Math.PI * 2)
      ctx.fill()
      // the slanted look: from the eye up to the surface and down again
      const hit = { x: c.x + c.r * 0.05, y: surf }
      const back = { x: c.x + c.r * 0.55, y: floorY }
      const look = tween(t, 8.0, 1.2)
      ctx.strokeStyle = AMBER_SOFT
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(back.x, back.y)
      ctx.lineTo(lerp(back.x, hit.x, Math.min(1, look * 2)), lerp(back.y, hit.y, Math.min(1, look * 2)))
      if (look > 0.5) ctx.lineTo(lerp(hit.x, hx, (look - 0.5) * 2), lerp(hit.y, hy, (look - 0.5) * 2))
      ctx.stroke()
      ctx.restore()
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
      ctx.stroke()
    })
  }
}

// ---------- 🔁 the drill-in ----------

function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const f: Fiber = { x0: b.W * 0.08, x1: b.W * 0.92, y0: b.UH * 0.4, hc: 40 * k, hw: 62 * k, bend: 0, H: 0 }
  faded(ctx, open, () => {
    drawFiber(ctx, f)
    const path = zigzag(f, 6)
    // ① the light reaches the wall at a slant
    const a1 = tween(t, 2.6, 1.0)
    const p0 = path[0]
    const p1 = path[1]
    const p2 = path[2]
    if (a1 > 0) {
      ctx.strokeStyle = AMBER_SOFT
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(lerp(p0.x, p1.x, a1), lerp(p0.y, p1.y, a1))
      ctx.stroke()
      stepRing(ctx, p1.x, p1.y, 40 * k, 1, idle, (a1 >= 1 ? 1 : 0) * (1 - tween(t, 5.0, 0.4)))
    }
    // ② the wall works like a mirror: back in it goes
    const a2 = tween(t, 5.1, 1.0)
    if (a2 > 0) {
      ctx.strokeStyle = AMBER_SOFT
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(lerp(p1.x, p2.x, a2), lerp(p1.y, p2.y, a2))
      ctx.stroke()
      // the mirror: a short bright line on the wall where it bumps
      ctx.strokeStyle = 'rgba(240, 249, 255, 0.95)'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(p1.x - 40 * k, p1.y)
      ctx.lineTo(p1.x + 40 * k, p1.y)
      ctx.stroke()
      stepRing(ctx, p1.x, p1.y, 40 * k, 2, idle, (a2 >= 1 ? 1 : 0.4) * (1 - tween(t, 7.5, 0.4)))
    }
    // ③ all the way across: blinks zigzag on; a little ocean at the end
    const a3 = tween(t, 7.6, 0.4)
    if (a3 > 0) {
      pulses(ctx, path, sinceLaunch('id:go', t, 7.6, idle), PACKETS[0].bits, 260, a3)
      const ox = b.W * 0.5
      const oy = b.UH * 0.72
      faded(ctx, a3, () => {
        ctx.fillStyle = '#0c3b5c'
        ctx.beginPath()
        ctx.roundRect(ox - 200 * k, oy - 30 * k, 400 * k, 60 * k, 30 * k)
        ctx.fill()
        miniHouse(ctx, ox - 230 * k, oy + 20 * k, k * 0.8, BOY_ROOF)
        miniHouse(ctx, ox + 230 * k, oy + 20 * k, k * 0.8, GRAN_ROOF)
        arrow(ctx, ox - 180 * k, oy, ox + 180 * k, oy)
      })
      stepRing(ctx, ox, oy, 70 * k, 3, idle, a3)
    }
  })
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- 🔀 routers on the way ----------

function crossingGeo(b: Box) {
  const k = K(b)
  const r = { x: b.W * 0.3, y: b.UH * 0.55 }
  const via = { x: b.W * 0.55, y: b.UH * 0.2 }
  const tab = { x: b.W * 0.84, y: b.UH * 0.55, w: 210 * k, h: 420 * k }
  const inlet: Pt[] = [
    { x: -20, y: r.y },
    { x: r.x, y: r.y },
  ]
  const straight: Pt[] = [
    { x: r.x, y: r.y },
    { x: tab.x - tab.w / 2, y: r.y },
  ]
  const detour: Pt[] = [
    { x: r.x, y: r.y },
    { x: via.x, y: via.y },
    { x: tab.x - tab.w / 2, y: r.y },
  ]
  return { k, r, via, tab, inlet, straight, detour }
}

/** the six slots on Grandma's tablet, top to bottom */
const slotY = (g: ReturnType<typeof crossingGeo>, i: number) => g.tab.y - g.tab.h * 0.36 + i * g.tab.h * 0.144

function drawRoad(ctx: CanvasRenderingContext2D, p: Pt[], hot: number) {
  ctx.strokeStyle = hot > 0 ? `rgba(251, 191, 36, ${0.4 + 0.6 * hot})` : '#334155'
  ctx.lineWidth = 5
  ctx.beginPath()
  p.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
  ctx.stroke()
}

function drawRouters(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = crossingGeo(b)
  const k = g.k
  // piece 2: the road it picks lights up
  const pick = tween(t, 2.6, 0.4)
  drawRoad(ctx, g.inlet, 0)
  drawRoad(ctx, g.straight, pick)
  drawRoad(ctx, g.detour, 0)
  router(ctx, g.r.x, g.r.y + 14 * k, k * 1.4, idle)
  router(ctx, g.via.x, g.via.y + 10 * k, k * 0.9, idle + 2)
  tablet(ctx, g.tab.x, g.tab.y, g.tab.w, g.tab.h)
  // where each packet is: in from the left to the router (p1 for packet
  // 1), on along its road (p2 for packet 1, p3 for the rest)
  const arrivedAt: Record<number, number> = {}
  ARRIVAL.forEach((n, slot) => (arrivedAt[n] = slot))
  // piece 4: back in order
  const order = tween(t, 7.8, 1.2)
  for (let n = 1; n <= 6; n++) {
    const start = n === 1 ? 0.1 : 5.1 + (n - 2) * 0.28
    const atRouter = n === 1 ? tween(t, 0.1, 1.6) : tween(t, start, 0.35)
    const goStart = n === 1 ? 2.7 : start + 0.35
    const road = n === 3 ? g.detour : g.straight
    const goLen = n === 3 ? 1.6 : n === 1 ? 2.0 : 0.8
    const on = tween(t, goStart, goLen)
    let pos: Pt
    let s = k * 0.8
    if (on >= 1) {
      // in its slot on the tablet: first in the order it came, then sorted
      const y = lerp(slotY(g, arrivedAt[n]), slotY(g, n - 1), easeInOut(order))
      pos = { x: g.tab.x, y }
      s = k * 0.8
    } else if (on > 0) pos = along(road, on * pathLen(road))
    else if (atRouter > 0) pos = along(g.inlet, atRouter * pathLen(g.inlet))
    else continue
    // piece 1: the router reads packet 1's label (it glows amber)
    const reading = n === 1 && t > 1.7 && t < 2.9
    const landPop = bounce(sinceLaunch(`ir:land${n}`, t, goStart + goLen, idle), 0.3, 0.35, 0.35)
    const sortPop = bounce(sinceLaunch(`ir:sort${n}`, t, 7.8 + (n - 1) * 0.2, idle), 0.3, 0.45, 0.35)
    parcel(ctx, pos.x, pos.y, s, n, { to: 1, from: 1, num: 1, numPop: Math.max(landPop, sortPop) })
    if (reading) marker(ctx, pos.x, pos.y - 20 * k, 26 * k, idle)
    if (n === 3 && on > 0 && on < 1) marker(ctx, pos.x, pos.y, 30 * k, idle, 0.8)
  }
  // the order they arrived in, shown beside the tablet until they are sorted
  if (t > 7.2 && order < 1) faded(ctx, 1 - order, () => text(ctx, '1 2 4 5 3 6', g.tab.x, g.tab.y - g.tab.h * 0.5 - 22 * k, HINT, 22 * k, '700'))
  if (order >= 1) text(ctx, '1 2 3 4 5 6', g.tab.x, g.tab.y - g.tab.h * 0.5 - 22 * k, AMBER_SOFT, 22 * k, '700')
}

// ---------- ⚡ a broken packet ----------

function drawBroken(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const y = b.UH * 0.3
  const x0 = b.W * 0.06
  const tab = { x: b.W * 0.82, y: b.UH * 0.3, w: 150 * k, h: 200 * k }
  const x1 = tab.x - tab.w / 2
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(x0, y)
  ctx.lineTo(x1, y)
  ctx.stroke()
  miniHouse(ctx, x0 + 10 * k, y - 8 * k, k, BOY_ROOF)
  tablet(ctx, tab.x, tab.y, tab.w, tab.h)
  const p = PACKETS[BROKEN.n - 1]
  const bad = flipBit(p.bits, BROKEN.lamp)
  // piece 1's event: packet 4 travels; a spark of noise flips one lamp
  const go = tween(t, 0.1, 2.2)
  const hit = 0.45
  const flipped = go > hit && t < 7.6
  const px = lerp(x0 + 40 * k, x1 - 70 * k, go)
  if (go > 0 && t < 7.6) {
    parcel(ctx, px, y, k * 0.9, BROKEN.n, { to: 1, from: 1, num: 1, check: 1, bits: flipped ? bad : p.bits, badLamp: flipped ? BROKEN.lamp : undefined })
    const sp = 1 - Math.abs(go - hit) / 0.06
    if (sp > 0) {
      ctx.strokeStyle = `rgba(253, 224, 71, ${sp})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(px + 40 * k, y - 70 * k)
      ctx.lineTo(px + 30 * k, y - 36 * k)
      ctx.lineTo(px + 44 * k, y - 36 * k)
      ctx.lineTo(px + 34 * k, y - 4 * k)
      ctx.stroke()
    }
  }
  // piece 2's event: the lit lamps counted — seven; the check number six ✕
  const count = (bits: string, from: number, cy: number, s: number, ok: boolean) => {
    const cx = b.W * 0.5
    const countAt: number[] = []
    for (let j = 0, q = 0; j < 8; j++) countAt.push(bits[j] === '1' ? from + q++ * 0.2 : -1)
    const ones = countAt.filter((a) => a >= 0).length
    parcel(ctx, cx, cy, s, BROKEN.n, {
      to: 1,
      from: 1,
      num: 1,
      check: 1,
      bits,
      badLamp: ok ? undefined : BROKEN.lamp,
      lampPop: (j) => (countAt[j] < 0 ? 0 : bounce(sinceLaunch(`ib:l${from}.${j}`, t, countAt[j], idle), 0.18, 0.25, 0.3)),
      checkPop: bounce(sinceLaunch(`ib:chk${from}`, t, from + ones * 0.2 + 0.2, idle), 0.35, 1.2, 0.4),
    })
    let c = 0
    for (let j = 0; j < 8; j++) {
      if (bits[j] !== '1') continue
      c++
      const pop = bounce(sinceLaunch(`ib:c${from}.${j}`, t, from + (c - 1) * 0.2, idle), 0.25, 999, 0.1)
      if (pop > 0) {
        const x = lampX(cx, 8, 15 * s, j)
        scaledAbout(ctx, x, cy + 30 * s, Math.min(1.15, pop), () => big(ctx, String(c), x, cy + 30 * s, 15 * k, ok ? AMBER_SOFT : '#fca5a5'))
      }
    }
    const verdict = tween(t, from + c * 0.2 + 0.2, 0.3)
    if (verdict > 0) {
      const vp = bounce(sinceLaunch(`ib:v${from}`, t, from + c * 0.2 + 0.2, idle), 0.35, 999, 0.1)
      faded(ctx, verdict, () => {
        scaledAbout(ctx, cx - 70 * k, cy + 74 * s, Math.min(1.25, vp), () => big(ctx, `${c}`, cx - 70 * k, cy + 74 * s, 30 * k, ok ? AMBER_SOFT : '#fca5a5'))
        big(ctx, ok ? '=' : '≠', cx, cy + 74 * s, 30 * k, BRIGHT)
        big(ctx, `✓${checkNumber(p.bits)}`, cx + 70 * k, cy + 74 * s, 30 * k, '#6ee7b7')
      })
      if (ok) {
        ctx.save()
        ctx.globalAlpha *= verdict
        ctx.strokeStyle = '#34d399'
        ctx.lineWidth = 5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx + 120 * k, cy + 72 * s)
        ctx.lineTo(cx + 134 * k, cy + 86 * s)
        ctx.lineTo(cx + 160 * k, cy + 56 * s)
        ctx.stroke()
        ctx.restore()
      } else cross(ctx, cx + 140 * k, cy + 72 * s, 14 * k, verdict)
    }
  }
  const s = k * 2
  if (t >= 2.6 && t < 7.6) count(bad, 2.8, b.UH * 0.62, s, false)
  // piece 3's event: "send number four again" runs back along the cable
  const ask = tween(t, 5.1, 1.6)
  if (ask > 0 && ask < 1) {
    const ax = lerp(x1, x0 + 40 * k, ask)
    faded(ctx, 1, () => {
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.roundRect(ax - 26 * k, y - 16 * k, 52 * k, 32 * k, 10 * k)
      ctx.fill()
      const ap = 1 + 0.25 * Math.abs(Math.sin(idle * 6))
      scaledAbout(ctx, ax, y, ap, () => text(ctx, `#${BROKEN.n} ?`, ax, y, '#0f172a', 15 * k, '800'))
    })
  }
  // piece 4's event: a fresh copy comes, whole; six = six ✓
  const fresh = tween(t, 7.6, 1.6)
  const askN = bounce(sinceLaunch('ib:ask4', t, 4.85, idle) - 2.4, 0.35, 1.2, 0.4)
  if (fresh > 0 && fresh < 1)
    parcel(ctx, lerp(x0 + 40 * k, x1 - 70 * k, fresh), y, k * 0.9, BROKEN.n, { to: 1, from: 1, num: 1, check: 1, numPop: 0.6 + 0.4 * Math.abs(Math.sin(idle * 5)) })
  // the empty place of packet 4 on the tablet bounces while "number four" is said
  if (askN > 0) marker(ctx, tab.x, tab.y - tab.h * 0.36 + (BROKEN.n - 1) * tab.h * 0.144, 22 * k, idle, Math.min(1, askN))
  if (fresh >= 1) count(p.bits, 9.3, b.UH * 0.62, s, true)
  // the tablet's packets: 1–6, packet 4's place empty until it comes whole
  for (let n = 1; n <= 6; n++) {
    if (n === BROKEN.n && fresh < 1) continue
    const sy = tab.y - tab.h * 0.36 + (n - 1) * tab.h * 0.144
    parcel(ctx, tab.x, sy, k * 0.42, n)
  }
}

// ---------- 🎈 faster than a blink ----------

function stopwatch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, secs: number) {
  ctx.fillStyle = '#e2e8f0'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(x - r * 0.15, y - r * 1.25, r * 0.3, r * 0.25)
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = Math.max(2, r * 0.07)
  ctx.beginPath()
  ctx.moveTo(x, y)
  const a = -Math.PI / 2 + secs * Math.PI * 2 * 2 // one turn = half a second
  ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8)
  ctx.stroke()
  text(ctx, `${secs.toFixed(2)} s`, x, y + r * 1.45, BRIGHT, r * 0.38, '700')
}

function drawBlink(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const g = world(ctx, b, idle)
  const k = g.k
  const trip = oceanTripS()
  // piece 1's event: the light races across; the stopwatch stops at 0.03 s
  const go = sinceLaunch('ik:go', t, 0.2, idle)
  const L = pathLen(g.cable)
  const q = clamp01(go / 1.0) // slowed: 0.03 s shown as 1 s
  if (go >= 0) {
    for (let i = 0; i < 8; i++) {
      const p = along(g.cable, q * L - i * 14)
      lamp(ctx, p.x, p.y, 4.5 * k, 1, 1 - i / 8)
    }
  }
  const sw = { x: b.W * 0.2, y: b.UH * 0.16, r: 40 * k }
  stopwatch(ctx, sw.x, sw.y, sw.r, q * trip)
  // the two bars: the trip, and a blink — ten times longer
  const barX = b.W * 0.36
  const barW = b.W * 0.5
  const tripBar = tween(t, 0.4, 0.8)
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
  ctx.fillRect(barX, sw.y - 30 * k, barW, 18 * k)
  ctx.fillRect(barX, sw.y + 8 * k, barW, 18 * k)
  ctx.fillStyle = 'rgba(240, 249, 255, 0.95)'
  ctx.fillRect(barX, sw.y - 30 * k, barW * (trip / BLINK_S) * tripBar, 18 * k)
  // piece 2's event: an eye blinks (slowed ten times), its bar fills
  const bl = sinceLaunch('ik:blink', t, 2.6, idle)
  if (bl >= 0) {
    const q2 = clamp01(bl / 2.0)
    ctx.fillStyle = '#e8b796'
    ctx.fillRect(barX, sw.y + 8 * k, barW * q2, 18 * k)
    eye(ctx, b.W * 0.5, b.UH * 0.36, 44 * k, Math.sin(q2 * Math.PI) * 0.95)
  }
  faded(ctx, tripBar, () => text(ctx, `${trip.toFixed(2)} s`, barX + barW + 30 * k, sw.y - 21 * k, BRIGHT, 14 * k, '700'))
  faded(ctx, tween(t, 2.6, 0.3), () => text(ctx, `${BLINK_S.toFixed(1)} s`, barX + barW + 30 * k, sw.y + 17 * k, BRIGHT, 14 * k, '700'))
  // piece 3's event: the drawing at Grandma's
  const there = bounce(sinceLaunch('ik:there', t, 5.2, idle), 0.4, 999, 0.1)
  if (there > 0) scaledAbout(ctx, g.gran.x - 50 * k, g.ground - 110 * k, Math.min(1.15, there), () => drawingCard(ctx, g.gran.x - 50 * k, g.ground - 110 * k, 70 * k))
  // the end: the picture dims slowly, then the stories menu comes back
  const dim = tween(t, INTERNET_T.blink - 2.2, 2.0)
  if (dim > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${0.92 * dim})`
    ctx.fillRect(0, 0, b.W, b.H)
  }
}

export function drawInternetBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') drawQuestion(ctx, b, t, idle)
  else if (beat === 'packets') drawPackets(ctx, b, t, idle)
  else if (beat === 'map') drawMap(ctx, b, t, idle)
  else if (beat === 'cable') drawCable(ctx, b, t, idle)
  else if (beat === 'trick') drawTrick(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else if (beat === 'routers') drawRouters(ctx, b, t, idle)
  else if (beat === 'broken') drawBroken(ctx, b, t, idle)
  else drawBlink(ctx, b, t, idle)
}
