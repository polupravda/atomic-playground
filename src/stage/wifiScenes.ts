import { clamp01 } from './canvasUtil'
import { AMBER, AMBER_SOFT, electronSprite, lerp, marker, text } from './storyDraw'
import { sinceLaunch } from './laserScenes'
import { ordinaryCss } from './lightPacket'
import { backdrop, bounce, callout, fadeIn, packet, replayFrame, rewindSweep, scaledAbout, stepRing, stream, type Box, type Pt } from './laserCutScenes'
import {
  HINT,
  K,
  NOTE,
  arrow,
  big,
  bubble,
  child,
  drawingCard,
  faded,
  hand,
  house,
  lamp,
  lampRow,
  lampX,
  notes,
  stars,
  tween,
} from './digitalScenes'
import { asciiCode, toBits } from '../core/digital'
import { ADDRESSES, ANSWER, FOUR_KINDS, encodeWaves, pairOf, type WaveSymbol } from '../core/wifi'

// R09 — 📶 How Wi-Fi works (proposal: docs/how-things-work/18-proposal-
// digital-information.md, story 2). One question — there is no wire between
// the tablet and the box in the hall, and a wall in the way: how does the
// message get across? — one aha — the tablet shakes electrons in its
// antenna to the rhythm of the bits; the radio wave shakes the electrons in
// the router's antenna the same way, and the router reads the bits back; the
// router is the house's post office. Words taught: router, antenna, radio
// wave. Hero: the letter H's bits, then Grandma's answer.
//   question  the house cut open: the router in the hall, a brick wall, the
//             boy with his tablet; the message HI; no wire (✕); a "?"
//   router    the router bounces; lines of light join it to every device
//             and the cable outside; each device gets a house number
//   antenna   "Let's look inside the tablet." → the camera dives in: the
//             antenna strip, its electrons, shaken up and down
//   wave      rings spread from the antenna (a stone in a pond beside it);
//             the radio wave; a hand under one wiggle — as long as a hand
//   code      the H's eight lamps; a 1 → a hard shake → a tall wave; a 0 →
//             a gentle one → a small wave; all eight fly off; the four kinds
//             of wave (tall / small × flipped / not) — two bits a wave; the
//             H as four waves; time to look
//   wall      the waves slip through the bricks, a little weaker; a torch's
//             light stops at them; the size before and after the wall
//   receive   the router's antenna: its electrons shake the same way; each
//             wave measured → two bits; the same bits as before; the
//             address is Grandma's → out through the cable
//   answer    Grandma's answer comes in by the cable (HI!, a photo, her
//             voice); for the tablet, not the laptop, not the TV; waves to
//             the tablet; its screen: bits → 72 73 33 → HI!, the photo row
//             by row, the speaker's notes
//   drill     🔁 ① letters → bits ② bits → shaking → wave ③ wave → shaking
//             ④ bits → letters
//   far       the rings spread and fade; the boy walks into the garden and
//             the Wi-Fi arcs drop; the cable leads away; the picture dims
// Every line is science pacing (piece k spoken while story time stands at
// 2.5·(k−1) s, its event in the watch break after it). Waves fly on the
// idle clock (sinceLaunch), one speed for every radio wave.

export const WIFI_ORDER = ['question', 'router', 'antenna', 'wave', 'code', 'wall', 'receive', 'answer', 'drill', 'far'] as const
export type WifiBeat = (typeof WIFI_ORDER)[number]

/** story seconds per beat: 2.5 s per piece (plus a look where noted) */
export const WIFI_T: Record<WifiBeat, number> = {
  question: 7.5,
  router: 7.5,
  antenna: 7.5,
  wave: 7.5,
  // + 3.5 s after the four kinds of wave: time to look (data)
  code: 16,
  wall: 7.5,
  receive: 10,
  answer: 12.5,
  drill: 12.5,
  // the end plays out, then the picture dims before the menu returns
  far: 11.5,
}

/** radio waves: soft indigo (the app's light colors are for light) */
const RADIO = (a: number) => `rgba(165, 180, 252, ${a})`
/** one speed for every radio wave in the story, px per second */
const WAVE_V = 200
const H_BITS = toBits(asciiCode('H'))
const H_WAVES = encodeWaves(H_BITS)
const H_PER_BIT: WaveSymbol[] = [...H_BITS].map((c) => ({ tall: c === '1', flipped: false }))

// ---------- devices ----------

/** the router, its base centred on (x, y) */
export function router(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, idle: number, alpha = 1, noLeft = false) {
  faded(ctx, alpha, () => {
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 3 * k
    ctx.lineCap = 'round'
    for (const s of noLeft ? [1] : [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(x + s * 26 * k, y - 24 * k)
      ctx.lineTo(x + s * 34 * k, y - 66 * k)
      ctx.stroke()
    }
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.roundRect(x - 38 * k, y - 26 * k, 76 * k, 26 * k, 6 * k)
    ctx.fill()
    for (let i = 0; i < 4; i++) {
      const on = 0.5 + 0.5 * Math.sin(idle * (3 + i) + i * 2)
      ctx.fillStyle = `rgba(74, 222, 128, ${0.35 + 0.65 * on})`
      ctx.beginPath()
      ctx.arc(x - 18 * k + i * 12 * k, y - 13 * k, 2.6 * k, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

function laptop(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#64748b'
    ctx.beginPath()
    ctx.moveTo(x - 34 * k, y)
    ctx.lineTo(x + 34 * k, y)
    ctx.lineTo(x + 28 * k, y - 6 * k)
    ctx.lineTo(x - 28 * k, y - 6 * k)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#334155'
    ctx.fillRect(x - 26 * k, y - 46 * k, 52 * k, 40 * k)
    ctx.fillStyle = '#1d4ed8'
    ctx.fillRect(x - 22 * k, y - 42 * k, 44 * k, 32 * k)
  })
}

function tv(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, idle: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#475569'
    ctx.fillRect(x - 6 * k, y - 16 * k, 12 * k, 16 * k)
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.roundRect(x - 52 * k, y - 76 * k, 104 * k, 62 * k, 5 * k)
    ctx.fill()
    const hue = 200 + 40 * Math.sin(idle * 0.7)
    ctx.fillStyle = `hsla(${hue}, 60%, 45%, 0.9)`
    ctx.fillRect(x - 46 * k, y - 70 * k, 92 * k, 50 * k)
  })
}

/** a tablet, centred on (x, y) */
export function tablet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, screen?: () => void) {
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.12)
  ctx.fill()
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = Math.max(1.5, w * 0.012)
  ctx.stroke()
  const m = Math.min(w, h) * 0.07
  ctx.fillStyle = '#0b1226'
  ctx.fillRect(x - w / 2 + m, y - h / 2 + m, w - 2 * m, h - 2 * m)
  if (screen) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x - w / 2 + m, y - h / 2 + m, w - 2 * m, h - 2 * m)
    ctx.clip()
    screen()
    ctx.restore()
  }
}

/** the Wi-Fi sign: a dot and three arcs, `bars` of them lit */
function wifiSign(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, bars: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.lineCap = 'round'
    for (let i = 1; i <= 3; i++) {
      ctx.strokeStyle = i <= bars ? 'rgba(226, 232, 240, 0.95)' : 'rgba(100, 116, 139, 0.45)'
      ctx.lineWidth = r * 0.16
      ctx.beginPath()
      ctx.arc(x, y, (r * i) / 3, -Math.PI * 0.75, -Math.PI * 0.25)
      ctx.stroke()
    }
    ctx.fillStyle = bars > 0 ? 'rgba(226, 232, 240, 0.95)' : 'rgba(100, 116, 139, 0.45)'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.1, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** a little house with a number on it: an address */
export function houseNumber(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, k: number, alpha = 1, hot = 0) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = hot > 0.5 ? AMBER : '#e2e8f0'
    ctx.beginPath()
    ctx.moveTo(x - 13 * k, y - 4 * k)
    ctx.lineTo(x, y - 16 * k)
    ctx.lineTo(x + 13 * k, y - 4 * k)
    ctx.lineTo(x + 10 * k, y - 4 * k)
    ctx.lineTo(x + 10 * k, y + 12 * k)
    ctx.lineTo(x - 10 * k, y + 12 * k)
    ctx.lineTo(x - 10 * k, y - 4 * k)
    ctx.closePath()
    ctx.fill()
    text(ctx, String(n), x, y + 4 * k, '#0f172a', 14 * k, '800')
  })
}

/** a red ✕: not here, no */
export function cross(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.95)'
    ctx.lineWidth = Math.max(3, r * 0.28)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - r, y - r)
    ctx.lineTo(x + r, y + r)
    ctx.moveTo(x + r, y - r)
    ctx.lineTo(x - r, y + r)
    ctx.stroke()
  })
}

/** a letter with an address tag: a message on its way */
export function envelope(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(x - 24 * k, y - 15 * k, 48 * k, 30 * k)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - 24 * k, y - 15 * k)
    ctx.lineTo(x, y + 2 * k)
    ctx.lineTo(x + 24 * k, y - 15 * k)
    ctx.stroke()
  })
}

/** Grandma's house as an address tag (a tiny house) */
export const grandmaTag = (ctx: CanvasRenderingContext2D, x: number, y: number, k: number, alpha = 1) =>
  faded(ctx, alpha, () => {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
    ctx.beginPath()
    ctx.roundRect(x - 22 * k, y - 26 * k, 44 * k, 40 * k, 8 * k)
    ctx.fill()
    house(ctx, x, y + 8 * k, k * 0.28)
  })

// ---------- waves ----------

/** a radio wave seen from the side, flowing right from x0: wave j (in the
 *  order sent, the first at the front) is seq(j), each `L` px long; the
 *  front is at x0 + since·WAVE_V. `gain(x)` = its size at x (a wall). */
function waveLine(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y: number,
  since: number,
  seq: (j: number) => WaveSymbol | null,
  L: number,
  A: number,
  o: { xMax?: number; gain?: (x: number) => number; alpha?: number; width?: number; color?: (a: number) => string } = {},
) {
  if (since < 0) return
  const head = x0 + since * WAVE_V
  const xMax = Math.min(head, o.xMax ?? Infinity)
  ctx.save()
  ctx.globalAlpha *= o.alpha ?? 1
  ctx.strokeStyle = (o.color ?? RADIO)(0.95)
  ctx.lineWidth = o.width ?? 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  let pen = false
  for (let x = x0; x <= xMax; x += 2) {
    const d = (head - x) / L
    const j = Math.floor(d)
    const s = seq(j)
    if (!s) {
      pen = false
      continue
    }
    const amp = (s.tall ? 1 : 0.4) * (s.flipped ? -1 : 1) * (o.gain ? o.gain(x) : 1)
    const yy = y - A * amp * Math.sin(2 * Math.PI * (1 - (d - j)))
    if (pen) ctx.lineTo(x, yy)
    else {
      ctx.moveTo(x, yy)
      pen = true
    }
  }
  ctx.stroke()
  ctx.restore()
}

/** one wave drawn still (the four kinds), centred on (x, y) */
function waveIcon(ctx: CanvasRenderingContext2D, x: number, y: number, L: number, A: number, s: WaveSymbol, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - L / 2 - 6, y)
    ctx.lineTo(x + L / 2 + 6, y)
    ctx.stroke()
    ctx.strokeStyle = RADIO(0.95)
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let d = 0; d <= L; d += 2) {
      const yy = y - A * (s.tall ? 1 : 0.4) * (s.flipped ? -1 : 1) * Math.sin((2 * Math.PI * d) / L)
      if (d === 0) ctx.moveTo(x - L / 2 + d, yy)
      else ctx.lineTo(x - L / 2 + d, yy)
    }
    ctx.stroke()
  })
}

/** rings spreading from (x, y) on the idle clock, fainter far away */
function rings(ctx: CanvasRenderingContext2D, x: number, y: number, since: number, maxR: number, o: { a0?: number; a1?: number; gap?: number; alpha?: number } = {}) {
  if (since < 0) return
  const gap = o.gap ?? 46
  const front = since * WAVE_V
  ctx.save()
  ctx.globalAlpha *= o.alpha ?? 1
  for (let r = front % gap; r <= Math.min(front, maxR); r += gap) {
    if (r < 4) continue
    const a = 0.7 * (1 - r / maxR) ** 1.8
    ctx.strokeStyle = RADIO(a)
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(x, y, r, o.a0 ?? 0, o.a1 ?? Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

/** an antenna up close: a metal strip with its electrons, shaken up and
 *  down by `shake` px (the idle clock: it never stops while it sends) */
function antennaStrip(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, k: number, shake: number, idle: number, alpha = 1, glow = 0) {
  faded(ctx, alpha, () => {
    const w = 16 * k
    if (glow > 0) {
      ctx.fillStyle = `rgba(251, 191, 36, ${0.25 * glow})`
      ctx.beginPath()
      ctx.roundRect(x - w, y0 - 10 * k, 2 * w, y1 - y0 + 20 * k, w)
      ctx.fill()
    }
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0)
    g.addColorStop(0, '#64748b')
    g.addColorStop(0.5, '#cbd5e1')
    g.addColorStop(1, '#64748b')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.roundRect(x - w / 2, y0, w, y1 - y0, w / 2)
    ctx.fill()
  })
  return (electrons: number) =>
    faded(ctx, alpha * electrons, () => {
      const n = 7
      const dy = shake * Math.sin(idle * 7)
      const spr = electronSprite(true)
      const sz = Math.max(8, 14 * k)
      for (let i = 0; i < n; i++) {
        const y = lerp(y0 + 14 * k, y1 - 14 * k, i / (n - 1)) + dy
        ctx.drawImage(spr.canvas, x + Math.sin(i * 2.3) * 2 - sz / 2, y - sz / 2, sz, sz)
      }
    })
}

// ---------- 🏠 the house, cut open ----------

function homeGeo(b: Box) {
  const k = K(b)
  const ground = b.UH * 0.86
  const floorY = b.UH * 0.53
  return {
    k,
    ground,
    floorY,
    left: b.W * 0.08,
    right: b.W * 0.94,
    ceil: b.UH * 0.24,
    wallX: b.W * 0.44,
    router: { x: b.W * 0.24, y: ground - 96 * k },
    boy: { x: b.W * 0.68, y: ground },
    tablet: { x: b.W * 0.68 + 40 * k, y: ground - 70 * k },
    laptop: { x: b.W * 0.27, y: floorY - 44 * k },
    tv: { x: b.W * 0.72, y: floorY - 30 * k },
  }
}

/** the cable from the router out of the house, along the ground */
function cablePath(g: ReturnType<typeof homeGeo>): Pt[] {
  return [
    { x: g.router.x - 30 * g.k, y: g.router.y - 4 * g.k },
    { x: g.left + 18 * g.k, y: g.router.y - 4 * g.k },
    { x: g.left + 18 * g.k, y: g.ground + 16 * g.k },
    { x: -10, y: g.ground + 16 * g.k },
  ]
}

const pathLen = (p: Pt[]) => p.slice(1).reduce((n, q, i) => n + Math.hypot(q.x - p[i].x, q.y - p[i].y), 0)
function along(p: Pt[], d: number): Pt {
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y)
    if (d <= L) return { x: lerp(p[i - 1].x, p[i].x, d / L), y: lerp(p[i - 1].y, p[i].y, d / L) }
    d -= L
  }
  return p[p.length - 1]
}

interface HomeOpts {
  wallHi?: number
  routerHi?: number
  /** the boy's tablet, drawn bigger when it is talked about */
  tabletHi?: number
  laptopDim?: number
  tvDim?: number
}

function home(ctx: CanvasRenderingContext2D, b: Box, idle: number, o: HomeOpts = {}) {
  const g = homeGeo(b)
  const k = g.k
  backdrop(ctx, b)
  stars(ctx, b, idle)
  ctx.fillStyle = '#16233a'
  ctx.fillRect(0, g.ground, b.W, b.UH - g.ground)
  // the roof, the outer walls, the floor between the storeys
  ctx.fillStyle = '#7c2d12'
  ctx.beginPath()
  ctx.moveTo(g.left - 20 * k, g.ceil)
  ctx.lineTo((g.left + g.right) / 2, g.ceil - 110 * k)
  ctx.lineTo(g.right + 20 * k, g.ceil)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#0f1b30'
  ctx.fillRect(g.left, g.ceil, g.right - g.left, g.ground - g.ceil)
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 7 * k
  ctx.strokeRect(g.left, g.ceil, g.right - g.left, g.ground - g.ceil)
  ctx.beginPath()
  ctx.moveTo(g.left, g.floorY)
  ctx.lineTo(g.right, g.floorY)
  ctx.stroke()
  // the brick wall between the hall and the living room
  const ww = 16 * k
  if (o.wallHi) {
    ctx.fillStyle = `rgba(251, 191, 36, ${0.3 * o.wallHi})`
    ctx.fillRect(g.wallX - ww, g.floorY, ww * 3, g.ground - g.floorY)
  }
  ctx.fillStyle = '#9a3412'
  ctx.fillRect(g.wallX, g.floorY, ww, g.ground - g.floorY)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)'
  ctx.lineWidth = 1
  for (let y = g.floorY + 10 * k; y < g.ground; y += 10 * k) {
    ctx.beginPath()
    ctx.moveTo(g.wallX, y)
    ctx.lineTo(g.wallX + ww, y)
    ctx.stroke()
  }
  // the cable out of the house
  const cable = cablePath(g)
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 5 * k
  ctx.beginPath()
  cable.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()
  // the shelf and the router
  ctx.fillStyle = '#78350f'
  ctx.fillRect(g.router.x - 54 * k, g.router.y, 108 * k, 7 * k)
  scaledAbout(ctx, g.router.x, g.router.y, 1 + 0.2 * (o.routerHi ?? 0), () => router(ctx, g.router.x, g.router.y, k, idle))
  // upstairs: the laptop on a table, the TV on a cabinet
  ctx.fillStyle = '#78350f'
  ctx.fillRect(g.laptop.x - 50 * k, g.laptop.y, 100 * k, 6 * k)
  ctx.fillRect(g.laptop.x - 44 * k, g.laptop.y, 6 * k, g.floorY - g.laptop.y)
  ctx.fillRect(g.laptop.x + 38 * k, g.laptop.y, 6 * k, g.floorY - g.laptop.y)
  laptop(ctx, g.laptop.x, g.laptop.y, k, 1 - 0.6 * (o.laptopDim ?? 0))
  ctx.fillStyle = '#334155'
  ctx.fillRect(g.tv.x - 60 * k, g.tv.y, 120 * k, g.floorY - g.tv.y)
  tv(ctx, g.tv.x, g.tv.y, k, idle, 1 - 0.6 * (o.tvDim ?? 0))
  // the boy and his tablet
  child(ctx, g.boy.x, g.boy.y, k * 1.1)
  const tk = 1 + 0.35 * (o.tabletHi ?? 0)
  tablet(ctx, g.tablet.x, g.tablet.y, 30 * k * tk, 40 * k * tk)
  return g
}

// ---------- ❓ the question ----------

function drawQuestion(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const said = sinceLaunch('wq:said', t, 0, idle)
  const boyN = bounce(said, 0.4, 1.2, 0.4)
  const routerN = bounce(sinceLaunch('wq:router', t, 2.35, idle) - 0.6, 0.4, 1.4, 0.45)
  const wallN = bounce(sinceLaunch('wq:wall', t, 4.85, idle) - 0.5, 0.4, 1.6, 0.45)
  const g = home(ctx, b, idle, { routerHi: routerN, wallHi: wallN, tabletHi: boyN })
  const k = g.k
  // "Out in the hall stands a little box." — an amber ring round the
  // router while it is said (Elena, 2026-11-22)
  const boxRing = bounce(sinceLaunch('wq:ring', t, 2.35, idle) - 0.4, 0.3, 2.4, 0.5)
  if (boxRing > 0) marker(ctx, g.router.x, g.router.y - 22 * k, 54 * k, idle, Math.min(1, boxRing))
  // "It says hi!" — the message on the tablet
  const hi = bounce(said - 3.0, 0.35, 999, 0.1)
  const bx = g.tablet.x + 58 * k
  const by = g.tablet.y - 70 * k
  if (hi > 0) scaledAbout(ctx, bx, by, Math.min(1.15, hi), () => bubble(ctx, bx, by, 70 * k, 1, 1, -1))
  // piece 2's event: no wire — a dashed line tries, a red ✕
  const nw = tween(t, 2.6, 0.8)
  if (nw > 0) {
    const a = { x: g.router.x + 40 * k, y: g.router.y - 10 * k }
    const c = { x: g.tablet.x - 20 * k, y: g.tablet.y }
    ctx.save()
    ctx.setLineDash([7, 7])
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(lerp(a.x, c.x, nw), lerp(a.y, c.y, nw))
    ctx.stroke()
    ctx.restore()
    const xp = bounce(sinceLaunch('wq:x', t, 3.5, idle), 0.35, 999, 0.1)
    if (xp > 0) cross(ctx, (a.x + c.x) / 2 + 30 * k, (a.y + c.y) / 2 - 30 * k, 14 * k * Math.min(1.15, xp))
  }
  // piece 3's event: "So how does the message get across?"
  const ask = bounce(sinceLaunch('wq:ask', t, 5.3, idle), 0.4, 999, 0.1)
  if (ask > 0)
    scaledAbout(ctx, g.wallX, g.floorY - 30 * k, Math.min(1.15, ask), () => big(ctx, '?', g.wallX + 8 * k, g.floorY + 60 * k, 80 * k, AMBER_SOFT))
}

// ---------- 📦 the router ----------

function devicePoints(g: ReturnType<typeof homeGeo>) {
  const k = g.k
  return {
    tablet: { x: g.tablet.x, y: g.tablet.y },
    laptop: { x: g.laptop.x, y: g.laptop.y - 28 * k },
    tv: { x: g.tv.x, y: g.tv.y - 46 * k },
  }
}

function drawRouter(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const said3 = sinceLaunch('wr:said3', t, 4.85, idle)
  const routerN = bounce(sinceLaunch('wr:named', t, 0, idle), 0.4, 1.8, 0.45)
  // piece 3: each device bounces as it is named
  const tabN = bounce(said3 - 1.0, 0.35, 0.6, 0.35)
  const lapN = bounce(said3 - 1.6, 0.35, 0.6, 0.35)
  const tvN = bounce(said3 - 2.3, 0.35, 0.6, 0.35)
  const g = home(ctx, b, idle, { routerHi: routerN, tabletHi: tabN })
  const k = g.k
  if (routerN > 0) marker(ctx, g.router.x, g.router.y - 20 * k, 52 * k, idle, Math.min(1, routerN))
  const dev = devicePoints(g)
  if (lapN > 0) scaledAbout(ctx, dev.laptop.x, dev.laptop.y, 1 + 0.25 * lapN, () => laptop(ctx, g.laptop.x, g.laptop.y, k))
  if (tvN > 0) scaledAbout(ctx, dev.tv.x, dev.tv.y, 1 + 0.2 * tvN, () => tv(ctx, g.tv.x, g.tv.y, k, idle))
  // piece 2's event: lines of light from the router to every device and
  // out along the cable — messages running both ways
  const lines = tween(t, 2.6, 0.6)
  if (lines > 0) {
    const from = { x: g.router.x, y: g.router.y - 30 * k }
    const ends = [dev.tablet, dev.laptop, dev.tv]
    ctx.save()
    ctx.globalAlpha *= lines
    ctx.setLineDash([6, 8])
    ctx.lineDashOffset = -idle * 30
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.55)'
    ctx.lineWidth = 2
    for (const e of ends) {
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(e.x, e.y)
      ctx.stroke()
    }
    ctx.restore()
    // little pulses: in and out of the house along the cable, out to and
    // back from the devices
    const cable = cablePath(g)
    const L = pathLen(cable)
    for (let j = 0; j < 4; j++) {
      const q = (idle * 0.35 + j / 4) % 1
      const p = along(cable, (j % 2 ? q : 1 - q) * L)
      lamp(ctx, p.x, p.y, 4.5 * k, 1, lines)
      const e = ends[j % 3]
      const qq = (idle * 0.5 + j / 4) % 1
      lamp(ctx, lerp(from.x, e.x, j % 2 ? qq : 1 - qq), lerp(from.y, e.y, j % 2 ? qq : 1 - qq), 4 * k, 1, lines)
    }
  }
  // piece 3's event: a house number for each device
  const nums: Array<[Pt, number]> = [
    [dev.tablet, ADDRESSES.tablet],
    [dev.laptop, ADDRESSES.laptop],
    [dev.tv, ADDRESSES.tv],
  ]
  nums.forEach(([p, n], i) => {
    const pop = bounce(sinceLaunch(`wr:n${i}`, t, 5.2 + i * 0.4, idle), 0.35, 999, 0.1)
    if (pop > 0) houseNumber(ctx, p.x + 40 * k, p.y - 34 * k, n, k * Math.min(1.15, pop) * 1.2)
  })
}

// ---------- 📡 the antenna ----------

function bigTablet(b: Box, x = b.W * 0.46) {
  const w = b.W * 0.46
  const h = b.UH * 0.62
  return { x, y: b.UH * 0.5, w, h, ax: x + w / 2 - 26 * K(b), ay0: b.UH * 0.5 - h * 0.34, ay1: b.UH * 0.5 + h * 0.34 }
}

function drawAntenna(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const k = K(b)
  // piece 1, "Let's look inside the tablet.": the camera dives in
  const dive = tween(t, 0.1, 2.0)
  if (dive < 1) {
    const g = homeGeo(b)
    faded(ctx, 1 - dive, () => {
      ctx.save()
      const s = 1 + dive * 5
      ctx.translate(g.tablet.x, g.tablet.y)
      ctx.scale(s, s)
      ctx.translate(-g.tablet.x, -g.tablet.y)
      home(ctx, b, idle)
      ctx.restore()
    })
  } else backdrop(ctx, b)
  const T = bigTablet(b)
  faded(ctx, dive, () => {
    tablet(ctx, T.x, T.y, T.w, T.h, () => bubble(ctx, T.x - 20 * k, T.y - T.h * 0.12, 120 * k, 0.9, 1, 0))
  })
  if (dive <= 0) return
  // piece 2: the antenna bounces while it is named
  const named = bounce(sinceLaunch('wa:named', t, 2.35, idle) - 1.0, 0.4, 1.8, 0.45)
  // piece 3: the electrons appear as they are named, then they shake
  const eIn = tween(sinceLaunch('wa:e', t, 4.85, idle) + 4.85, 5.0, 0.5)
  const shake = 16 * k * tween(t, 5.2, 0.6)
  scaledAbout(ctx, T.ax, T.y, 1 + 0.1 * named, () => {
    const draw = antennaStrip(ctx, T.ax, T.ay0, T.ay1, k, shake, idle, dive, named)
    draw(eIn)
  })
  if (named > 0)
    faded(ctx, Math.min(1, named) * (0.75 + 0.25 * Math.sin(idle * 5)), () => {
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.roundRect(T.ax - 20 * k, T.ay0 - 16 * k, 40 * k, T.ay1 - T.ay0 + 32 * k, 20 * k)
      ctx.stroke()
    })
  // the up-and-down arrows of the shaking
  const sh = tween(t, 5.6, 0.4)
  if (sh > 0) {
    arrow(ctx, T.ax + 34 * k, T.y + 10 * k, T.ax + 34 * k, T.y - 40 * k, sh)
    arrow(ctx, T.ax + 34 * k, T.y - 10 * k, T.ax + 34 * k, T.y + 40 * k, sh)
  }
}

// ---------- 🌊 the radio wave ----------

function drawWave(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const T = bigTablet(b, b.W * 0.2)
  tablet(ctx, T.x, T.y, T.w, T.h, () => bubble(ctx, T.x - 20 * k, T.y - T.h * 0.12, 90 * k, 0.9, 1, 0))
  antennaStrip(ctx, T.ax, T.ay0, T.ay1, k, 16 * k, idle)(1)
  // piece 1: rings spread from the antenna; a stone drops into a pond
  const go = sinceLaunch('ww:rings', t, 0.1, idle)
  rings(ctx, T.ax, T.y, go, b.W * 0.9, { a0: -Math.PI / 2, a1: Math.PI / 2 })
  const pond = { x: b.W * 0.78, y: b.UH * 0.2, r: 70 * k }
  const pondA = tween(t, 0.3, 0.4) * (1 - tween(t, 2.6, 0.5))
  if (pondA > 0) {
    callout(ctx, { x: pond.x - pond.r - 20 * k, y: pond.y + pond.r }, pond, pond.r, pondA, () => {
      ctx.fillStyle = '#0c3b5c'
      ctx.fillRect(pond.x - pond.r, pond.y - pond.r, pond.r * 2, pond.r * 2)
      const s = sinceLaunch('ww:stone', t, 0.3, idle)
      if (s < 0.5) {
        ctx.fillStyle = '#94a3b8'
        ctx.beginPath()
        ctx.arc(pond.x, lerp(pond.y - pond.r, pond.y, s / 0.5), 7 * k, 0, Math.PI * 2)
        ctx.fill()
      } else
        for (let i = 0; i < 4; i++) {
          const r = (s - 0.5) * 40 * k - i * 14 * k
          if (r <= 0) continue
          ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, 0.8 - r / (pond.r * 1.2))})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(pond.x, pond.y, r, r * 0.45, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
    })
  }
  // piece 2: "This is a radio wave." — the wave, seen from the side, glows
  // while it is named
  const named = bounce(sinceLaunch('ww:named', t, 2.35, idle) - 0.6, 0.4, 1.8, 0.45)
  const L = 150 * k
  const A = 40 * k
  const lineY = T.y
  waveLine(ctx, T.ax + 10 * k, lineY, sinceLaunch('ww:line', t, 2.35, idle), () => ({ tall: true, flipped: false }), L, A, {
    width: 3 + 3 * named,
    xMax: b.W - 10,
  })
  // piece 3: a cousin of light — a light photon beside it, tiny wiggle;
  // a hand under one wiggle, just as long
  const cousin = bounce(sinceLaunch('ww:light', t, 4.85, idle), 0.35, 999, 0.1)
  if (cousin > 0) {
    const fly = sinceLaunch('ww:lightfly', t, 4.85, idle)
    const px = T.ax + 40 * k + ((fly * WAVE_V) % (b.W - T.ax - 80 * k))
    packet(ctx, px, b.UH * 0.24, 0, 530, idle, Math.min(1, cousin), 44)
  }
  const handIn = tween(t, 5.2, 0.6)
  if (handIn > 0) {
    // one wiggle, from crest to crest, marked by an amber bracket — and the
    // hand from wrist to fingertip under it
    const head = T.ax + 10 * k + sinceLaunch('ww:line', t, 2.35, idle) * WAVE_V
    const x0 = T.ax + 10 * k + ((head - T.ax - 10 * k) % L) + L * 0.25 // a crest
    const xa = x0 < b.W * 0.5 ? x0 + L : x0
    const bracket = (y: number) => {
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(xa, y - 8)
      ctx.lineTo(xa, y + 8)
      ctx.moveTo(xa, y)
      ctx.lineTo(xa + L, y)
      ctx.moveTo(xa + L, y - 8)
      ctx.lineTo(xa + L, y + 8)
      ctx.stroke()
    }
    faded(ctx, handIn, () => {
      bracket(lineY - A - 18 * k)
      const kh = L / 184
      ctx.save()
      ctx.translate(xa + 52 * kh, lineY + A + 70 * k)
      ctx.rotate(Math.PI / 2)
      hand(ctx, 0, 0, kh, [1, 1, 1, 1, 1])
      ctx.restore()
      bracket(lineY + A + 120 * k)
    })
  }
}

// ---------- 💡 bits on a wave ----------

function drawCode(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const ax = b.W * 0.12
  const laneY = b.UH * 0.47
  const L = 60 * k
  const A = 34 * k
  const row = { cx: b.W * 0.6, y: b.UH * 0.13, gap: 40 * k, r: 11 * k }
  // piece 1: the H and its eight lamps pop in while they are named
  const hIn = bounce(sinceLaunch('wc:h', t, 0, idle), 0.4, 999, 0.1)
  // piece 5: the lamps regroup into pairs
  const pairUp = tween(t, 11.8, 0.6)
  const lampPos = (i: number) => lampX(row.cx, 8, row.gap, i) + (Math.floor(i / 2) - 1.5) * 18 * k * pairUp
  if (hIn > 0) {
    big(ctx, 'H', b.W * 0.2, row.y, 52 * k * Math.min(1.1, hIn))
    for (let i = 0; i < 8; i++) {
      lamp(ctx, lampPos(i), row.y, row.r, H_BITS[i] === '1' ? 1 : 0, Math.min(1, hIn))
      faded(ctx, Math.min(1, hIn), () => text(ctx, String(2 ** (7 - i)), lampPos(i), row.y + row.r + 12, HINT, 11))
    }
  }
  // which bit is being sent (a ring on its lamp), how hard the electrons
  // shake
  let ring = -1
  let shake = 0
  // piece 2, "For a one … hard. Out comes a tall wave." — bound while said
  const one = sinceLaunch('wc:one', t, 2.35, idle)
  const zero = sinceLaunch('wc:zero', t, 4.85, idle)
  if (one >= 0 && t < 4.85) {
    ring = 1
    shake = 18 * k
  }
  if (zero >= 0 && t < 7.6) {
    ring = 0
    shake = 7 * k
  }
  // piece 4: all eight, one after another
  const all = sinceLaunch('wc:all', t, 7.6, idle)
  if (all >= 0) {
    const j = Math.floor((all * WAVE_V) / L)
    if (j < 8) {
      ring = j
      shake = H_BITS[j] === '1' ? 18 * k : 7 * k
    } else {
      ring = -1
      shake = 4 * k
    }
  }
  // piece 5: the H as four waves, two bits each
  const pairs = sinceLaunch('wc:pairs', t, 12.4, idle)
  let pairRing = -1
  if (pairs >= 0) {
    const j = Math.floor((pairs * WAVE_V) / L)
    if (j < 4) {
      pairRing = j
      shake = H_WAVES[j].tall ? 18 * k : 7 * k
    }
  }
  if (ring >= 0) marker(ctx, lampPos(ring), row.y, row.r + 8 * k, idle)
  if (pairRing >= 0) {
    ctx.save()
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 2.5
    ctx.beginPath()
    const x0 = lampPos(pairRing * 2) - row.r - 6 * k
    const x1 = lampPos(pairRing * 2 + 1) + row.r + 6 * k
    ctx.roundRect(x0, row.y - row.r - 6 * k, x1 - x0, 2 * row.r + 12 * k, row.r + 6 * k)
    ctx.stroke()
    ctx.restore()
  }
  // the antenna
  antennaStrip(ctx, ax, laneY - 90 * k, laneY + 90 * k, k, shake, idle)(1)
  if (hIn > 0) arrow(ctx, lampPos(Math.max(0, ring)), row.y + row.r + 24 * k, ax + 14 * k, laneY - 96 * k, Math.min(1, hIn) * 0.6)
  const x0 = ax + 12 * k
  const xMax = b.W - 14
  waveLine(ctx, x0, laneY, one, (j) => (j === 0 ? { tall: true, flipped: false } : null), L, A, { xMax })
  waveLine(ctx, x0, laneY, zero, (j) => (j === 0 ? { tall: false, flipped: false } : null), L, A, { xMax })
  waveLine(ctx, x0, laneY, all, (j) => (j >= 0 && j < 8 ? H_PER_BIT[j] : null), L, A, { xMax })
  waveLine(ctx, x0, laneY, pairs, (j) => (j >= 0 && j < 4 ? H_WAVES[j] : null), L, A, { xMax, width: 4 })
  // piece 5: the four kinds of wave, each with its two bits
  FOUR_KINDS.forEach((s, i) => {
    const pop = bounce(sinceLaunch(`wc:k${i}`, t, 10.2 + i * 0.35, idle), 0.35, 999, 0.1)
    if (pop <= 0) return
    const cx = b.W * (0.2 + 0.2 * i)
    const cy = b.UH * 0.78
    const hot = pairRing >= 0 && pairOf(H_WAVES[pairRing]) === pairOf(s)
    scaledAbout(ctx, cx, cy, Math.min(1.15, pop) * (hot ? 1.1 : 1), () => {
      ctx.fillStyle = hot ? 'rgba(251, 191, 36, 0.16)' : 'rgba(30, 41, 59, 0.85)'
      ctx.beginPath()
      ctx.roundRect(cx - 62 * k, cy - 58 * k, 124 * k, 116 * k, 12 * k)
      ctx.fill()
      if (hot) {
        ctx.strokeStyle = AMBER
        ctx.lineWidth = 2.5
        ctx.stroke()
      }
      waveIcon(ctx, cx, cy - 16 * k, 70 * k, 26 * k, s)
      lampRow(ctx, cx, cy + 34 * k, pairOf(s), { r: 9 * k, gap: 28 * k })
    })
  })
}

// ---------- 🧱 the wall ----------

function drawWall(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const wl = b.W * 0.48
  const wr = b.W * 0.58
  const laneY = b.UH * 0.34
  const L = 60 * k
  const A = 40 * k
  const gain = (x: number) => (x < wl ? 1 : x > wr ? 0.7 : lerp(1, 0.7, (x - wl) / (wr - wl)))
  // the bricks
  ctx.fillStyle = '#9a3412'
  ctx.fillRect(wl, 0, wr - wl, b.UH)
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)'
  ctx.lineWidth = 1.5
  const bh = 22 * k
  for (let r = 0, y = 0; y < b.UH; r++, y += bh) {
    ctx.beginPath()
    ctx.moveTo(wl, y)
    ctx.lineTo(wr, y)
    ctx.stroke()
    const off = r % 2 ? (wr - wl) / 2 : 0
    ctx.beginPath()
    ctx.moveTo(wl + off, y)
    ctx.lineTo(wl + off, y + bh)
    ctx.stroke()
  }
  // piece 1's event: the waves come and slip through
  const go = sinceLaunch('wl:go', t, 0.1, idle)
  waveLine(ctx, -20, laneY, go, (j) => (j >= 0 ? H_WAVES[j % 4] : null), L, A, { gain, xMax: b.W })
  // piece 2's event: a torch shines at the wall; the bricks swallow it
  const torch = { x: b.W * 0.12, y: b.UH * 0.7 }
  const tIn = tween(t, 2.6, 0.4)
  if (tIn > 0) {
    faded(ctx, tIn, () => {
      ctx.fillStyle = '#475569'
      ctx.beginPath()
      ctx.roundRect(torch.x - 56 * k, torch.y - 12 * k, 56 * k, 24 * k, 6 * k)
      ctx.fill()
      ctx.fillStyle = '#94a3b8'
      ctx.beginPath()
      ctx.moveTo(torch.x, torch.y - 12 * k)
      ctx.lineTo(torch.x + 16 * k, torch.y - 20 * k)
      ctx.lineTo(torch.x + 16 * k, torch.y + 20 * k)
      ctx.lineTo(torch.x, torch.y + 12 * k)
      ctx.closePath()
      ctx.fill()
    })
    stream(ctx, 'wl:torch', [{ x: torch.x + 18 * k, y: torch.y }, { x: wl, y: torch.y }], t, 2.8, idle, 580, { css: ordinaryCss, spacing: 40 })
    // where it lands, a warm glow on the bricks — and nothing behind them
    const glow = clamp01(sinceLaunch('wl:glow', t, 2.8 + (wl - torch.x) / (90 * 1.0), idle) * 2)
    if (glow > 0) {
      const g = ctx.createRadialGradient(wl, torch.y, 2, wl, torch.y, 40 * k)
      g.addColorStop(0, `rgba(255, 246, 214, ${0.55 * glow})`)
      g.addColorStop(1, 'rgba(255, 246, 214, 0)')
      ctx.fillStyle = g
      ctx.fillRect(wl - 40 * k, torch.y - 40 * k, 80 * k, 80 * k)
    }
  }
  // piece 3's event: the size before and after the wall
  const sz = tween(t, 5.2, 0.5)
  if (sz > 0) {
    const bar = (x: number, h: number) => {
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x - 8, laneY - h)
      ctx.lineTo(x + 8, laneY - h)
      ctx.moveTo(x, laneY - h)
      ctx.lineTo(x, laneY + h)
      ctx.moveTo(x - 8, laneY + h)
      ctx.lineTo(x + 8, laneY + h)
      ctx.stroke()
    }
    faded(ctx, sz, () => {
      bar(wl - 50 * k, A)
      bar(wr + 50 * k, A * 0.7)
    })
  }
}

// ---------- 📦 the router reads it ----------

function drawReceive(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // the router, big; its left antenna is the strip, up close
  const rx = b.W * 0.56
  const ry = b.UH * 0.68
  const ax = rx - 92 * k
  const ay0 = ry - 250 * k
  const ay1 = ry - 70 * k
  const laneY = (ay0 + ay1) / 2
  const L = 60 * k
  const A = 34 * k
  // the waves arrive from the left: the H's four waves, again and again
  const go = sinceLaunch('wv:go', t, 0.1, idle)
  const x0 = -20
  waveLine(ctx, x0, laneY, go, (j) => (j >= 0 ? H_WAVES[j % 4] : null), L, A * 0.7, { xMax: ax })
  // the strip's electrons shake with the wave that reaches it — the same
  // way, at the same time
  const head = x0 + Math.max(0, go) * WAVE_V
  const d = (head - ax) / L
  const j = Math.floor(d)
  const sym = go >= 0 && j >= 0 ? H_WAVES[j % 4] : null
  const here = sym ? (sym.tall ? 1 : 0.4) * Math.sin(2 * Math.PI * (1 - (d - j))) * (sym.flipped ? -1 : 1) : 0
  router(ctx, rx, ry, k * 3, idle, 1, true)
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 6 * k
  ctx.beginPath()
  ctx.moveTo(ax, ay1)
  ctx.lineTo(rx - 78 * k, ry - 72 * k)
  ctx.stroke()
  antennaStrip(ctx, ax, ay0, ay1, k, here * 16 * k, idle)(1)
  // piece 2's event: each wave measured → two bits, one pair after another
  const meas = sinceLaunch('wv:m', t, 2.6, idle)
  const row = { cx: b.W * 0.62, y: b.UH * 0.17, gap: 36 * k, r: 10 * k }
  const pairX = (i: number) => lampX(row.cx, 8, row.gap, i) + (Math.floor(i / 2) - 1.5) * 16 * k
  if (meas >= 0) {
    for (let p = 0; p < 4; p++) {
      const pop = bounce(meas - p * 0.5, 0.3, 999, 0.1)
      if (pop <= 0) continue
      const s = H_WAVES[p]
      waveIcon(ctx, (pairX(p * 2) + pairX(p * 2 + 1)) / 2, row.y + 44 * k, 44 * k, 14 * k, s, Math.min(1, pop))
      for (const q of [0, 1]) lamp(ctx, pairX(p * 2 + q), row.y, row.r, pairOf(s)[q] === '1' ? 1 : 0, Math.min(1, pop))
    }
  }
  // piece 3's event: the same bits as the tablet sent — the H again
  const same = tween(t, 5.2, 0.5)
  if (same > 0) {
    faded(ctx, same, () => {
      lampRow(ctx, row.cx, row.y - 44 * k, H_BITS, { r: row.r * 0.8, gap: row.gap, alpha: 0.6 })
      big(ctx, '=', b.W * 0.17, row.y - 20 * k, 30 * k, AMBER_SOFT)
      big(ctx, 'H', b.W * 0.1, row.y - 20 * k, 40 * k)
    })
  }
  // piece 4: the address — Grandma's (bounces as it is named); not one of
  // the house's three; out it goes through the cable
  const env = { x: rx + 10 * k, y: ry - 140 * k }
  const eIn = tween(t, 5.3, 0.5)
  const gTag = bounce(sinceLaunch('wv:tag', t, 7.35, idle) - 1.4, 0.4, 999, 0.1)
  const out = tween(t, 8.6, 1.2)
  const ex = lerp(env.x, rx, out)
  const ey = lerp(env.y, b.UH * 0.98, out)
  if (eIn > 0) {
    envelope(ctx, ex, ey, k * 1.4, eIn * (1 - tween(t, 9.6, 0.3)))
    if (gTag > 0) grandmaTag(ctx, ex + 50 * k, ey - 6 * k, k * Math.min(1.15, gTag), 1 - tween(t, 9.6, 0.3))
  }
  const devs: Array<[string, number]> = [
    ['tablet', ADDRESSES.tablet],
    ['laptop', ADDRESSES.laptop],
    ['tv', ADDRESSES.tv],
  ]
  devs.forEach(([, n], i) => {
    const a = tween(t, 7.6 + i * 0.25, 0.3)
    if (a <= 0) return
    const x = b.W * 0.86
    const y = b.UH * (0.4 + 0.12 * i)
    houseNumber(ctx, x, y, n, k * 1.2, a)
    cross(ctx, x + 28 * k, y, 9 * k, tween(t, 7.9 + i * 0.25, 0.25))
  })
  // the cable the message leaves by
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 6 * k
  ctx.beginPath()
  ctx.moveTo(rx, ry)
  ctx.lineTo(rx, b.UH)
  ctx.stroke()
  if (out > 0.9) {
    for (let i = 0; i < 3; i++) {
      const q = ((idle * 0.8 + i / 3) % 1)
      lamp(ctx, rx, lerp(ry + 4 * k, b.UH, q), 4 * k, 1)
    }
  }
}

// ---------- ✉️ the answer comes home ----------

function drawAnswer(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const said2 = sinceLaunch('wn:said2', t, 2.35, idle)
  const tabN = bounce(said2 - 1.4, 0.4, 999, 0.1)
  const lapDim = clamp01((said2 - 2.2) * 2)
  const tvDim = clamp01((said2 - 2.9) * 2)
  const g = home(ctx, b, idle, { tabletHi: Math.min(1, tabN) * 0.4, laptopDim: lapDim, tvDim })
  const k = g.k
  const dev = devicePoints(g)
  if (lapDim > 0) cross(ctx, dev.laptop.x + 40 * k, dev.laptop.y - 20 * k, 10 * k, lapDim)
  if (tvDim > 0) cross(ctx, dev.tv.x + 60 * k, dev.tv.y - 20 * k, 10 * k, tvDim)
  if (tabN > 0) {
    marker(ctx, g.tablet.x, g.tablet.y, 30 * k, idle, Math.min(1, tabN))
    houseNumber(ctx, g.tablet.x + 36 * k, g.tablet.y - 40 * k, ADDRESSES.tablet, k * 1.2, Math.min(1, tabN), 1)
  }
  // piece 1's event: her answer comes in along the cable — a message, a
  // photo and her voice
  const cable = cablePath(g).slice().reverse()
  const L = pathLen(cable)
  const inQ = tween(t, 0.1, 2.0)
  const atRouter = { x: g.router.x, y: g.router.y - 44 * k }
  if (inQ > 0) {
    const fade = 1 - tween(t, 7.6, 0.4)
    ;[0, 1, 2].forEach((i) => {
      const q = clamp01(inQ * 1.3 - i * 0.15)
      const p = q < 1 ? along(cable, q * L) : { x: atRouter.x + (i - 1) * 34 * k, y: atRouter.y - 30 * k }
      if (i === 0) bubble(ctx, p.x, p.y, 34 * k, fade, 1, 0, ANSWER)
      else if (i === 1) drawingCard(ctx, p.x, p.y, 26 * k, fade)
      else faded(ctx, fade, () => text(ctx, '♪', p.x, p.y, NOTE, 22 * k, '700'))
    })
    if (inQ >= 1) grandmaTag(ctx, atRouter.x + 70 * k, atRouter.y - 30 * k, k * 0.8, 0)
  }
  // piece 3's event: the router sends it to the tablet, as radio waves
  const send = sinceLaunch('wn:send', t, 5.1, idle)
  rings(ctx, g.router.x + 30 * k, g.router.y - 50 * k, send, b.W * 0.55, { a0: -0.6, a1: 0.9, alpha: 1 - tween(t, 10.5, 1) })
  // pieces 4 and 5: the tablet's screen, up close — bits → numbers →
  // letters; then the photo, row by row; the speaker sings
  const zoom = tween(t, 7.6, 0.5)
  if (zoom > 0) {
    const c = { x: b.W * 0.6, y: b.UH * 0.29 }
    const r = 128 * k * zoom
    callout(ctx, g.tablet, c, r, zoom, () => {
      ctx.fillStyle = '#0b1226'
      ctx.fillRect(c.x - r, c.y - r, 2 * r, 2 * r)
      const letters = [...ANSWER]
      const photo = tween(t, 10.1, 0.3)
      faded(ctx, 1 - photo, () => {
        letters.forEach((ch, i) => {
          const y = c.y - 58 * k + i * 30 * k
          const bits = toBits(asciiCode(ch))
          const lit = tween(t, 7.9 + i * 0.4, 0.3)
          lampRow(ctx, c.x - 20 * k, y, bits, { r: 6 * k, gap: 17 * k, alpha: lit })
          faded(ctx, tween(t, 8.4 + i * 0.4, 0.3), () => big(ctx, String(asciiCode(ch)), c.x + 84 * k, y, 16 * k, AMBER_SOFT))
        })
        const say = bounce(sinceLaunch('wn:hi', t, 9.3, idle), 0.35, 999, 0.1)
        if (say > 0) scaledAbout(ctx, c.x, c.y + 64 * k, Math.min(1.15, say), () => bubble(ctx, c.x, c.y + 64 * k, 80 * k, 1, 1, 0, ANSWER))
      })
      if (photo > 0) {
        // the photo fills in, row by row, from the top
        const rowsDone = tween(t, 10.2, 1.4)
        ctx.save()
        ctx.beginPath()
        ctx.rect(c.x - 70 * k, c.y - 70 * k, 140 * k, 140 * k * rowsDone)
        ctx.clip()
        drawingCard(ctx, c.x, c.y, 140 * k)
        ctx.restore()
      }
    })
  }
  const voice = sinceLaunch('wn:voice', t, 11.2, idle)
  if (voice >= 0) notes(ctx, g.tablet.x + 10 * k, g.tablet.y - 20 * k, k, idle, Math.min(1, voice * 2))
}

// ---------- 🔁 the drill-in ----------

function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const y = b.UH * 0.5
  const xs = [0.15, 0.39, 0.63, 0.87].map((q) => b.W * q)
  faded(ctx, open, () => {
    // ① the letters become bits
    const a1 = tween(t, 2.6, 0.4)
    if (a1 > 0) {
      bubble(ctx, xs[0], y - 70 * k, 70 * k, a1, 1, 0)
      lampRow(ctx, xs[0], y + 10 * k, H_BITS.slice(0, 4), { r: 6 * k, gap: 17 * k, alpha: tween(t, 3.0, 0.3) })
      lampRow(ctx, xs[0], y + 28 * k, H_BITS.slice(4), { r: 6 * k, gap: 17 * k, alpha: tween(t, 3.0, 0.3) })
      stepRing(ctx, xs[0], y - 20 * k, 70 * k, 1, idle, a1 * (1 - tween(t, 5.0, 0.4)))
    }
    // ② the bits shake the electrons into a radio wave
    const a2 = tween(t, 5.1, 0.4)
    if (a2 > 0) {
      arrow(ctx, xs[0] + 50 * k, y, xs[1] - 30 * k, y, a2)
      antennaStrip(ctx, xs[1] - 10 * k, y - 60 * k, y + 60 * k, k * 0.8, 12 * k, idle, a2)(1)
      waveLine(ctx, xs[1] + 4 * k, y, sinceLaunch('wd:w', t, 5.3, idle), (j) => (j >= 0 ? H_WAVES[j % 4] : null), 40 * k, 24 * k, {
        xMax: xs[2] - 18 * k,
        alpha: a2,
      })
      stepRing(ctx, xs[1], y, 74 * k, 2, idle, a2 * (1 - tween(t, 7.5, 0.4)))
    }
    // ③ the wave shakes other electrons, far away
    const a3 = tween(t, 7.6, 0.4)
    if (a3 > 0) {
      antennaStrip(ctx, xs[2], y - 60 * k, y + 60 * k, k * 0.8, 12 * k, idle, a3)(1)
      router(ctx, xs[2] + 34 * k, y + 90 * k, k, idle, a3)
      stepRing(ctx, xs[2], y, 74 * k, 3, idle, a3 * (1 - tween(t, 10.0, 0.4)))
    }
    // ④ the same bits, and the bits become letters again
    const a4 = tween(t, 10.1, 0.4)
    if (a4 > 0) {
      arrow(ctx, xs[2] + 26 * k, y, xs[3] - 50 * k, y, a4)
      lampRow(ctx, xs[3], y + 10 * k, H_BITS.slice(0, 4), { r: 6 * k, gap: 17 * k, alpha: a4 })
      lampRow(ctx, xs[3], y + 28 * k, H_BITS.slice(4), { r: 6 * k, gap: 17 * k, alpha: a4 })
      bubble(ctx, xs[3], y - 70 * k, 70 * k, tween(t, 10.6, 0.4), 1, 0)
      stepRing(ctx, xs[3], y - 20 * k, 70 * k, 4, idle, a4)
    }
  })
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- 🎈 farther, weaker ----------

function drawFar(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  stars(ctx, b, idle)
  const k = K(b)
  const ground = b.UH * 0.8
  ctx.fillStyle = '#16233a'
  ctx.fillRect(0, ground, b.W, b.UH - ground)
  // the house, small, on the left; the garden and a tree on the right
  const hx = b.W * 0.22
  ctx.fillStyle = '#7c2d12'
  ctx.beginPath()
  ctx.moveTo(hx - 110 * k, ground - 150 * k)
  ctx.lineTo(hx, ground - 220 * k)
  ctx.lineTo(hx + 110 * k, ground - 150 * k)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#0f1b30'
  ctx.fillRect(hx - 96 * k, ground - 150 * k, 192 * k, 150 * k)
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 5 * k
  ctx.strokeRect(hx - 96 * k, ground - 150 * k, 192 * k, 150 * k)
  const rt = { x: hx - 40 * k, y: ground - 40 * k }
  router(ctx, rt.x, rt.y, k * 0.8, idle)
  ctx.fillStyle = '#14532d'
  ctx.beginPath()
  ctx.arc(b.W * 0.82, ground - 120 * k, 56 * k, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#78350f'
  ctx.fillRect(b.W * 0.82 - 9 * k, ground - 70 * k, 18 * k, 70 * k)
  // piece 1's event: the rings spread out and fade
  const go = sinceLaunch('wf:rings', t, 0.1, idle)
  rings(ctx, rt.x, rt.y - 30 * k, go, b.W * 0.5, { gap: 40, a0: -Math.PI, a1: 0 })
  // piece 2's event: the boy walks into the garden; the arcs drop
  const walk = tween(t, 2.6, 2.0)
  const bx = lerp(b.W * 0.42, b.W * 0.7, walk)
  child(ctx, bx, ground, k * 0.9)
  const tx = bx + 34 * k
  const ty = ground - 64 * k
  tablet(ctx, tx, ty, 24 * k, 32 * k)
  const dist = Math.hypot(tx - rt.x, ty - rt.y)
  const bars = dist < b.W * 0.24 ? 3 : dist < b.W * 0.33 ? 2 : dist < b.W * 0.42 ? 1 : 0
  wifiSign(ctx, tx, ty - 34 * k, 22 * k, bars)
  if (bars === 0) cross(ctx, tx + 20 * k, ty - 46 * k, 7 * k)
  // piece 3's event: the cable leads away from the house — a longer road
  const away = tween(t, 5.1, 0.4)
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 5 * k
  const cy = ground + 26 * k
  ctx.beginPath()
  ctx.moveTo(rt.x, rt.y)
  ctx.lineTo(rt.x, cy)
  ctx.lineTo(b.W + 10, cy)
  ctx.stroke()
  if (away > 0)
    for (let i = 0; i < 8; i++) {
      const q = (idle * 0.25 + i / 8) % 1
      lamp(ctx, lerp(rt.x, b.W + 10, q), cy, 4.5 * k, 1, away)
    }
  // the end: the picture dims slowly, then the stories menu comes back
  const dim = tween(t, WIFI_T.far - 2.2, 2.0)
  if (dim > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${0.92 * dim})`
    ctx.fillRect(0, 0, b.W, b.H)
  }
}

export function drawWifiBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') drawQuestion(ctx, b, t, idle)
  else if (beat === 'router') drawRouter(ctx, b, t, idle)
  else if (beat === 'antenna') drawAntenna(ctx, b, t, idle)
  else if (beat === 'wave') drawWave(ctx, b, t, idle)
  else if (beat === 'code') drawCode(ctx, b, t, idle)
  else if (beat === 'wall') drawWall(ctx, b, t, idle)
  else if (beat === 'receive') drawReceive(ctx, b, t, idle)
  else if (beat === 'answer') drawAnswer(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else drawFar(ctx, b, t, idle)
}
