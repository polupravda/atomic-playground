import { clamp01, easeInOut, easeOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, lerp, marker, rnd, text } from './storyDraw'
import { ordinaryCss } from './lightPacket'
import { PHOTON_SPEED, sinceLaunch } from './laserScenes'
import {
  backdrop,
  bounce,
  callout,
  fadeIn,
  packet,
  replayFrame,
  rewindSweep,
  scaledAbout,
  stepRing,
  stream,
  type Box,
  type Pt,
} from './laserCutScenes'
import { wavelengthToCss } from '../core/spectra'
import { REFLECTORS, RANGING_NM, moonRoundTripS, onMoonDisc } from '../core/laser'

// R08 — 🌕 Lasers to the Moon (proposal: docs/how-things-work/16-proposal-
// laser-stories.md, story 3). One question — how do we know how far away
// the Moon is? — one aha — a laser flash bounces off a mirror astronauts
// left on the Moon; timing its trip measures the distance, and shows the
// Moon slowly drifting away. Words taught: reflector, telescope. Hero: one
// photon of the flash (amber ring), the one that comes home.
//   question  night sky, a hill, the Moon (it bounces when named); a tape
//             measure rises toward it, bends and flops over; a laser on
//             the hill sends a flash up
//   mirrors   "Let's fly to the Moon." → the camera flies in; the Moon's
//             grey ground, the lander, Earth in the black sky; an
//             astronaut walks in carrying the panel, sets it down, walks
//             back; the reflector bounces when named; a map of the Moon
//             shows the five reflectors (Apollo 11 · 14 · 15, Lunokhod 1 · 2)
//   trick     "Let's look closer…" → the camera flies into one round
//             mirror: a glass corner (three mirrors meeting like the
//             corner of a room); a photon goes in, bounces three times and
//             leaves the way it came; then two more from other sides; a
//             bicycle reflector does the same with a torch's light
//   flash     back to Earth: the observatory (it bounces when named), its
//             dome opens, the telescope points at the reflector; a flash
//             flies up and spreads; the spread drawn as a faint cone; a
//             callout: the spot on the Moon, wider than a town, the tiny
//             reflector inside it
//   back      the camera lands on the Moon: the flash rains down from Earth
//             (high in the Moon's black sky) onto the dust and is lost; the
//             hero hits the reflector, bumps, flies straight back to Earth;
//             a box of countless faint photons with ONE amber one
//   timing    SHOW FIRST: a stopwatch beside the trip; the flash goes up,
//             the hero comes back, the stopwatch stops at 2.56 s; light
//             always flies at the same speed: a photon climbs beside the
//             trip and leaves a mark at every tick of the clock — evenly
//             spaced, the same gap every time; so the time IS the distance:
//             the tape measure of the first beat — now made of light —
//             reaches the Moon; a callout at its tip: millimetres
//   drill     🔁 the drill-in: ① the flash up, ② the reflector sends the
//             hero straight back, ③ the stopwatch — and a farther Moon
//             makes a longer trip and a later stop
//   drift     the years roll (1969 → today), the Moon edges away (ghost
//             outline, amber arrow), a fingernail grows by the same amount;
//             the reflector still glints back, every clear night
// Light is the Light lab's photon packet at the one story speed
// (PHOTON_SPEED), green: today's ranging stations fire 532 nm flashes.
// Every flight is launched on story time and flown on the idle clock
// (sinceLaunch), so nothing hangs still while the voice speaks.

export const MOON_ORDER = ['question', 'mirrors', 'trick', 'flash', 'back', 'timing', 'drill', 'drift'] as const
export type MoonBeat = (typeof MOON_ORDER)[number]

/** story seconds per beat: a science beat is its watch breaks (2.5 s per
 *  piece, plus 2.5 s before the first when shown first) */
export const MOON_T: Record<MoonBeat, number> = {
  question: 7.5,
  mirrors: 12.5,
  trick: 12.5,
  flash: 12.5,
  back: 12.5,
  timing: 15,
  drill: 10,
  drift: 10,
}

const GREEN = RANGING_NM
const TORCH_RED_NM = 650
const ROUND_TRIP_S = moonRoundTripS()

// ---------- small geometry ----------

const pathLen = (p: Pt[]) => p.slice(1).reduce((n, q, i) => n + Math.hypot(q.x - p[i].x, q.y - p[i].y), 0)
/** the point `d` px along a polyline, and the way it heads there (null =
 *  past the end: light ends where it lands) */
function pointAlong(p: Pt[], d: number): { x: number; y: number; a: number } | null {
  if (d < 0) return null
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y)
    if (d <= L) {
      const q = L > 0 ? d / L : 0
      return { x: lerp(p[i - 1].x, p[i].x, q), y: lerp(p[i - 1].y, p[i].y, q), a: Math.atan2(p[i].y - p[i - 1].y, p[i].x - p[i - 1].x) }
    }
    d -= L
  }
  return null
}
const unit = (a: Pt, b: Pt) => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d }
}

// ---------- the night sky, the hill, the Moon ----------

function stars(ctx: CanvasRenderingContext2D, b: Box, idle: number, bottom = 0.85, n = 70) {
  for (let i = 0; i < n; i++) {
    const a = 0.25 + 0.5 * rnd(i, 7) * (0.7 + 0.3 * Math.sin(idle * (0.8 + rnd(i, 9)) + i))
    ctx.fillStyle = `rgba(226, 232, 240, ${a})`
    const s = rnd(i, 8) > 0.85 ? 2 : 1
    ctx.fillRect(rnd(i, 5) * b.W, rnd(i, 6) * b.UH * bottom, s, s)
  }
}

function hill(ctx: CanvasRenderingContext2D, b: Box, y: number) {
  ctx.fillStyle = '#0c1424'
  ctx.beginPath()
  ctx.moveTo(0, y + 26)
  ctx.quadraticCurveTo(b.W * 0.22, y - 22, b.W * 0.48, y + 8)
  ctx.quadraticCurveTo(b.W * 0.75, y + 34, b.W, y + 4)
  ctx.lineTo(b.W, b.H)
  ctx.lineTo(0, b.H)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

// the dark "seas" of the near side, on the disc (x right, y down, radius 1)
const MARIA: Array<[number, number, number, number]> = [
  [-0.3, -0.45, 0.26, 0.2],
  [0.2, -0.38, 0.15, 0.13],
  [0.36, -0.06, 0.18, 0.15],
  [0.7, -0.24, 0.1, 0.09],
  [-0.56, -0.02, 0.3, 0.38],
  [-0.15, 0.36, 0.16, 0.12],
  [0.55, 0.17, 0.12, 0.13],
]

/** the full Moon: grey, its dark seas, a bright young crater */
function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const halo = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 1.6)
  halo.addColorStop(0, 'rgba(226, 232, 240, 0.12)')
  halo.addColorStop(1, 'rgba(226, 232, 240, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
  g.addColorStop(0, '#f1f5f9')
  g.addColorStop(1, '#a8b3c2')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = 'rgba(100, 116, 139, 0.45)'
  for (const [mx, my, rx, ry] of MARIA) {
    ctx.beginPath()
    ctx.ellipse(x + mx * r, y + my * r, rx * r, ry * r, 0.3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(248, 250, 252, 0.8)'
  ctx.beginPath()
  ctx.arc(x - 0.12 * r, y + 0.66 * r, 0.04 * r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** a place on the Moon drawn at (m.x, m.y), radius m.r */
function moonPlace(m: { x: number; y: number; r: number }, lat: number, lon: number): Pt {
  const p = onMoonDisc(lat, lon)
  return { x: m.x + p.x * m.r, y: m.y + p.y * m.r }
}
const APOLLO11 = REFLECTORS[0]

/** the Earth seen from the Moon: blue, white clouds, the night side dark */
function drawEarth(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, idle: number, blip = 0) {
  ctx.save()
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r)
  g.addColorStop(0, '#7dd3fc')
  g.addColorStop(1, '#1d4ed8')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = 'rgba(22, 101, 52, 0.75)'
  ctx.beginPath()
  ctx.ellipse(x - r * 0.25, y + r * 0.1, r * 0.35, r * 0.5, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(248, 250, 252, 0.75)'
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.ellipse(x + (rnd(i, 3) - 0.5) * r * 1.2 + Math.sin(idle * 0.2 + i) * 2, y + (rnd(i, 4) - 0.5) * r * 1.4, r * 0.35, r * 0.1, 0.2, 0, Math.PI * 2)
    ctx.fill()
  }
  // the night side
  ctx.fillStyle = 'rgba(2, 6, 23, 0.55)'
  ctx.beginPath()
  ctx.arc(x + r * 0.55, y + r * 0.2, r * 1.05, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  if (blip > 0) {
    ctx.save()
    ctx.globalAlpha *= blip
    const bg = ctx.createRadialGradient(x, y, 0, x, y, r * 0.9)
    bg.addColorStop(0, wavelengthToCss(GREEN, 0.95))
    bg.addColorStop(1, wavelengthToCss(GREEN, 0))
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.arc(x, y, r * 0.9, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ---------- the telescope ----------

interface Scope {
  /** the dome's middle, where the tube turns */
  pivot: Pt
  /** the tube's mouth: where the flash leaves and comes home */
  mouth: Pt
}

/** the observatory on the hill: a white dome on a small house; `open`
 *  slides the dome's slit open and raises the telescope's tube toward
 *  `aim` */
function observatory(ctx: CanvasRenderingContext2D, x: number, y: number, aim: Pt, open: number, k = 1, alpha = 1): Scope {
  const R = 42 * k
  const pivot = { x, y: y - 34 * k }
  const u = unit(pivot, aim)
  const len = (R + 6 * k) * open + R * 0.4
  const mouth = { x: pivot.x + u.x * len, y: pivot.y + u.y * len }
  if (alpha <= 0) return { pivot, mouth }
  ctx.save()
  ctx.globalAlpha *= alpha
  // the tube (behind the dome's shell when closed)
  ctx.save()
  ctx.translate(pivot.x, pivot.y)
  ctx.rotate(Math.atan2(u.y, u.x))
  ctx.fillStyle = '#cbd5e1'
  ctx.fillRect(0, -8 * k, len, 16 * k)
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(len - 4 * k, -7 * k, 4 * k, 14 * k)
  ctx.restore()
  // the house
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(x - R * 1.05, y - 34 * k, R * 2.1, 34 * k)
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(x - R * 0.7, y - 22 * k, 9 * k, 9 * k)
  // the dome: a half shell, its slit open toward the sky
  const dg = ctx.createLinearGradient(x - R, 0, x + R, 0)
  dg.addColorStop(0, '#f8fafc')
  dg.addColorStop(1, '#94a3b8')
  ctx.fillStyle = dg
  ctx.beginPath()
  ctx.arc(pivot.x, pivot.y, R, Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  if (open > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(pivot.x, pivot.y, R, Math.PI, 0)
    ctx.closePath()
    ctx.clip()
    ctx.translate(pivot.x, pivot.y)
    ctx.rotate(Math.atan2(u.y, u.x))
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, -11 * k * open, R + 2, 22 * k * open)
    ctx.restore()
    // the tube again, over the slit
    ctx.save()
    ctx.translate(pivot.x, pivot.y)
    ctx.rotate(Math.atan2(u.y, u.x))
    ctx.fillStyle = '#cbd5e1'
    ctx.fillRect(R * 0.2, -8 * k, len - R * 0.2, 16 * k)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(len - 4 * k, -7 * k, 4 * k, 14 * k)
    ctx.restore()
  }
  ctx.restore()
  return { pivot, mouth }
}

// ---------- the reflector on the Moon ----------

const CELLS_X = 8
const CELLS_Y = 5
/** the panel of round glass corners on its little stand, `w` px wide;
 *  returns where each round mirror sits */
function reflectorPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, idle: number, glint = 0): Pt[] {
  const h = w * 0.62
  const cells: Pt[] = []
  ctx.save()
  // the stand
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = Math.max(2, w * 0.03)
  ctx.beginPath()
  ctx.moveTo(x - w * 0.3, y + h * 0.5)
  ctx.lineTo(x - w * 0.36, y + h * 0.95)
  ctx.moveTo(x + w * 0.3, y + h * 0.5)
  ctx.lineTo(x + w * 0.36, y + h * 0.95)
  ctx.stroke()
  // the frame
  ctx.fillStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, w * 0.05)
  ctx.fill()
  ctx.fillStyle = '#475569'
  ctx.beginPath()
  ctx.roundRect(x - w / 2 + w * 0.04, y - h / 2 + w * 0.04, w - w * 0.08, h - w * 0.08, w * 0.03)
  ctx.fill()
  const cw = (w - w * 0.12) / CELLS_X
  const ch = (h - w * 0.12) / CELLS_Y
  const cr = Math.min(cw, ch) * 0.42
  for (let j = 0; j < CELLS_Y; j++) {
    for (let i = 0; i < CELLS_X; i++) {
      const cx = x - w / 2 + w * 0.06 + cw * (i + 0.5)
      const cy = y - h / 2 + w * 0.06 + ch * (j + 0.5)
      cells.push({ x: cx, y: cy })
      const gg = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, 0, cx, cy, cr)
      gg.addColorStop(0, '#93c5fd')
      gg.addColorStop(1, '#1e3a8a')
      ctx.fillStyle = gg
      ctx.beginPath()
      ctx.arc(cx, cy, cr, 0, Math.PI * 2)
      ctx.fill()
      // a glint sweeping across the glass
      const s = Math.sin(idle * 1.6 - i * 0.45 - j * 0.3)
      const a = 0.15 + 0.55 * Math.max(0, s) ** 6 + 0.6 * glint
      ctx.fillStyle = `rgba(248, 250, 252, ${Math.min(0.95, a)})`
      ctx.beginPath()
      ctx.arc(cx - cr * 0.3, cy - cr * 0.3, cr * 0.32, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
  return cells
}

// ---------- on the Moon's ground ----------

interface Ground {
  gy: number
  earth: Pt & { r: number }
  panel: Pt & { w: number }
  lander: Pt
}
function groundGeo(b: Box): Ground {
  return {
    gy: b.UH * 0.64,
    earth: { x: b.W * 0.17, y: b.UH * 0.17, r: Math.min(b.W, b.UH) * 0.055 },
    // 46 cm beside a 1.8 m astronaut: drawn about twice its true share
    panel: { x: b.W * 0.52, y: b.UH * 0.64 + 40, w: Math.min(b.W, b.UH) * 0.11 },
    lander: { x: b.W * 0.2, y: b.UH * 0.64 + 40 },
  }
}

/** the lander's base, left behind: gold foil on four legs */
function lander(ctx: CanvasRenderingContext2D, x: number, y: number, k: number) {
  ctx.save()
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 3 * k
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(x + s * 30 * k, y - 40 * k)
    ctx.lineTo(x + s * 58 * k, y)
    ctx.stroke()
    ctx.fillStyle = '#cbd5e1'
    ctx.beginPath()
    ctx.ellipse(x + s * 58 * k, y, 9 * k, 3 * k, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  const fg = ctx.createLinearGradient(x - 40 * k, 0, x + 40 * k, 0)
  fg.addColorStop(0, '#b45309')
  fg.addColorStop(0.5, '#fbbf24')
  fg.addColorStop(1, '#92400e')
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.moveTo(x - 40 * k, y - 26 * k)
  ctx.lineTo(x - 30 * k, y - 62 * k)
  ctx.lineTo(x + 30 * k, y - 62 * k)
  ctx.lineTo(x + 40 * k, y - 26 * k)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** an astronaut in a white suit, walking (`step` swings the legs) and
 *  maybe carrying the panel in front */
function astronaut(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, step: number, facing: 1 | -1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(facing * k, k)
  const sw = Math.sin(step) * 0.45
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineCap = 'round'
  ctx.lineWidth = 11
  for (const s of [1, -1]) {
    ctx.beginPath()
    ctx.moveTo(0, -36)
    ctx.lineTo(Math.sin(sw * s) * 18, -4)
    ctx.stroke()
  }
  // backpack, body, arm
  ctx.fillStyle = '#cbd5e1'
  ctx.fillRect(-20, -78, 12, 34)
  ctx.fillStyle = '#f1f5f9'
  ctx.beginPath()
  ctx.roundRect(-11, -80, 24, 48, 8)
  ctx.fill()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(6, -70)
  ctx.lineTo(18, -52)
  ctx.stroke()
  // the helmet and its gold visor
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.arc(2, -92, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f59e0b'
  ctx.beginPath()
  ctx.ellipse(7, -92, 8, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function moonGround(ctx: CanvasRenderingContext2D, b: Box, g: Ground, idle: number, o: { lander?: boolean; earthBlip?: number } = {}) {
  ctx.fillStyle = '#01030b'
  ctx.fillRect(0, 0, b.W, b.H)
  stars(ctx, b, idle, 0.6, 50)
  drawEarth(ctx, g.earth.x, g.earth.y, g.earth.r, idle, o.earthBlip ?? 0)
  const gg = ctx.createLinearGradient(0, g.gy, 0, b.H)
  gg.addColorStop(0, '#8b94a3')
  gg.addColorStop(1, '#3f4654')
  ctx.fillStyle = gg
  ctx.beginPath()
  ctx.moveTo(0, g.gy + 6)
  ctx.quadraticCurveTo(b.W / 2, g.gy - 8, b.W, g.gy + 6)
  ctx.lineTo(b.W, b.H)
  ctx.lineTo(0, b.H)
  ctx.closePath()
  ctx.fill()
  // craters, flattened by the low angle
  for (let i = 0; i < 9; i++) {
    const cx = rnd(i, 21) * b.W
    const cy = g.gy + 30 + rnd(i, 22) * (b.H - g.gy - 40)
    const r = 10 + rnd(i, 23) * 30 * ((cy - g.gy) / (b.H - g.gy))
    ctx.fillStyle = 'rgba(55, 65, 81, 0.5)'
    ctx.beginPath()
    ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.25)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(cx, cy + 1, r, r * 0.3, 0, 0.1, Math.PI - 0.1)
    ctx.stroke()
  }
  if (o.lander !== false) lander(ctx, g.lander.x, g.lander.y, Math.min(b.W, b.UH) / 760)
}

// ---------- ❓ the question ----------

function earthGeo(b: Box, moonAt?: Pt) {
  const hillY = b.UH * 0.86
  const moon = { x: moonAt?.x ?? b.W * 0.74, y: moonAt?.y ?? b.UH * 0.22, r: Math.min(b.W, b.UH) * 0.1 }
  return { hillY, moon, site: moonPlace(moon, APOLLO11.lat, APOLLO11.lon), dome: { x: b.W * 0.2, y: hillY - 4 } }
}

/** a tape measure on the hill: its tape rises toward the Moon, bends under
 *  its own weight and flops over (`tau` s since it began, idle clock) */
function tapeMeasure(ctx: CanvasRenderingContext2D, x: number, y: number, tau: number) {
  ctx.save()
  ctx.fillStyle = '#facc15'
  ctx.beginPath()
  ctx.roundRect(x - 16, y - 24, 32, 24, 6)
  ctx.fill()
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.arc(x, y - 12, 5, 0, Math.PI * 2)
  ctx.fill()
  if (tau > 0) {
    const L = 170 * easeOut(clamp01(tau / 1.2))
    const bend = easeInOut(clamp01((tau - 1.1) / 1.1))
    const N = 30
    let px = x + 10
    let py = y - 22
    const pts: Pt[] = [{ x: px, y: py }]
    for (let i = 1; i <= N; i++) {
      const q = i / N
      // up and a little toward the Moon, then bending over to the right
      const ang = -Math.PI / 2 + 0.35 + bend * q * q * 2.6
      px += (Math.cos(ang) * L) / N
      py += (Math.sin(ang) * L) / N
      pts.push({ x: px, y: Math.min(py, y) })
    }
    ctx.strokeStyle = '#fde047'
    ctx.lineWidth = 6
    ctx.lineCap = 'butt'
    ctx.beginPath()
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
    // the tick marks along it
    ctx.strokeStyle = 'rgba(31, 41, 55, 0.8)'
    ctx.lineWidth = 1
    for (let i = 1; i < pts.length; i += 2) {
      const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) + Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(pts[i].x, pts[i].y)
      ctx.lineTo(pts[i].x + Math.cos(a) * 3, pts[i].y + Math.sin(a) * 3)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** a small laser on a tripod (the question's "but with a laser") */
function smallLaser(ctx: CanvasRenderingContext2D, x: number, y: number, aim: Pt): Pt {
  const u = unit({ x, y: y - 30 }, aim)
  ctx.save()
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 3
  for (const s of [-1, 0, 1]) {
    ctx.beginPath()
    ctx.moveTo(x, y - 30)
    ctx.lineTo(x + s * 14, y)
    ctx.stroke()
  }
  ctx.translate(x, y - 30)
  ctx.rotate(Math.atan2(u.y, u.x))
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(-14, -8, 46, 16, 4)
  ctx.fill()
  ctx.fillStyle = wavelengthToCss(GREEN, 0.9)
  ctx.fillRect(30, -4, 3, 8)
  ctx.restore()
  return { x: x + u.x * 34, y: y - 30 + u.y * 34 }
}

/** where a ray from `from` toward the Moon's middle meets its edge */
function moonEdge(from: Pt, m: { x: number; y: number; r: number }): Pt {
  const u = unit(from, m)
  return { x: m.x - u.x * m.r * 0.92, y: m.y - u.y * m.r * 0.92 }
}

function questionScene(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  stars(ctx, b, idle)
  const g = earthGeo(b)
  const named = bounce(sinceLaunch('mq:moon', t, 0, idle), 0.4, 1.8, 0.45)
  scaledAbout(ctx, g.moon.x, g.moon.y, 1 + 0.12 * named, () => drawMoon(ctx, g.moon.x, g.moon.y, g.moon.r))
  hill(ctx, b, g.hillY)
  // "You cannot reach it with a tape measure." → it rises, bends, flops
  tapeMeasure(ctx, b.W * 0.47, g.hillY + 10, sinceLaunch('mq:tape', t, 2.6, idle))
  // "But you can measure it with a laser!" → a laser on the hill flashes
  const pop = bounce(sinceLaunch('mq:laser', t, 5.1, idle), 0.35, 999, 0.1)
  if (pop > 0) {
    const lx = b.W * 0.3
    const ly = g.hillY + 2
    let mouth: Pt = { x: lx, y: ly }
    scaledAbout(ctx, lx, ly, Math.min(1.15, pop), () => {
      mouth = smallLaser(ctx, lx, ly, g.moon)
    })
    stream(ctx, 'mq:beam', [mouth, moonEdge(mouth, g.moon)], t, 5.5, idle, GREEN, { spacing: 70 })
  }
}

// ---------- 🧑‍🚀 the mirrors ----------

// story-time key motion: the astronaut walks in, sets the panel down,
// walks back to the lander
function astronautAt(b: Box, g: Ground, t: number) {
  const inQ = easeInOut(clamp01((t - 2.6) / 2.2))
  const setQ = easeInOut(clamp01((t - 5.1) / 1.0))
  const awayQ = easeInOut(clamp01((t - 6.2) / 1.2))
  const stand = b.W * 0.64
  const x = t < 6.2 ? lerp(b.W * 1.08, stand, inQ) : lerp(stand, b.W * 0.34, awayQ)
  const walking = (t > 2.6 && t < 4.8) || (t > 6.2 && t < 7.4)
  return { x, y: g.gy + 70, walking, setQ }
}

function mirrorsScene(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number, o: { map?: boolean } = {}) {
  const g = groundGeo(b)
  moonGround(ctx, b, g, idle)
  const a = astronautAt(b, g, t)
  // the panel: carried in front of the astronaut, then set down
  const carried = { x: a.x - 44, y: a.y - 88 }
  const px = lerp(carried.x, g.panel.x, a.setQ)
  const py = lerp(carried.y, g.panel.y, a.setQ)
  const pw = lerp(g.panel.w * 0.6, g.panel.w, a.setQ)
  const named = bounce(sinceLaunch('mm:named', t, 7.35, idle), 0.4, 1.8, 0.45)
  const showPanel = t >= 2.6
  if (showPanel) {
    scaledAbout(ctx, px, py, 1 + 0.25 * named, () => reflectorPanel(ctx, px, py, pw, idle, 0.4 * named))
    if (named > 0) marker(ctx, px, py, pw * 0.75, idle, Math.min(1, named))
  }
  if (t >= 2.6) {
    const step = a.walking ? idle * 7 : 0
    const k = (Math.min(b.W, b.UH) / 700) * 1.5
    astronaut(ctx, a.x, a.y, k, step, -1)
  }
  // "Later, astronauts and robot cars left four more." → a map of the Moon
  if (o.map !== false) {
    const mapA = fadeIn(t, 10.1, 0.5)
    if (mapA > 0) {
      const m = { x: b.W * 0.8, y: b.UH * 0.24, r: Math.min(b.W, b.UH) * 0.15 }
      ctx.save()
      ctx.globalAlpha *= mapA
      ctx.fillStyle = 'rgba(2, 6, 23, 0.7)'
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.r + 14, 0, Math.PI * 2)
      ctx.fill()
      drawMoon(ctx, m.x, m.y, m.r)
      ctx.restore()
      for (const [i, r] of REFLECTORS.entries()) {
        const e = bounce(sinceLaunch(`mm:pin${i}`, t, 10.3 + i * 0.4, idle), 0.35, 999, 0.1)
        if (e <= 0) continue
        const p = moonPlace(m, r.lat, r.lon)
        ctx.save()
        ctx.globalAlpha *= mapA
        ctx.fillStyle = i === 0 ? AMBER : '#e2e8f0'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4.5 * Math.min(1.3, e), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        if (i === 0) marker(ctx, p.x, p.y, 11, idle, mapA)
      }
    }
  }
  return { panel: { x: px, y: py, w: pw } }
}

function drawMirrors(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  // "Let's fly to the Moon." → the camera flies into the Moon (0.05–2.4);
  // the question's flash keeps flying on the way
  const z = easeInOut(clamp01((t - 0.05) / 2.35))
  const groundA = clamp01((z - 0.45) / 0.35)
  if (groundA < 1) {
    const g = earthGeo(b)
    ctx.save()
    ctx.globalAlpha *= 1 - groundA
    scaledAbout(ctx, g.moon.x, g.moon.y, 1 + 9 * z * z, () => questionScene(ctx, b, 7.5 + t, idle))
    ctx.restore()
  }
  if (groundA > 0) {
    ctx.save()
    ctx.globalAlpha *= groundA
    mirrorsScene(ctx, b, t, idle)
    ctx.restore()
  }
}

// ---------- 📐 the trick: one glass corner ----------

function cornerGeo(b: Box) {
  const s = Math.min(b.W, b.UH) * 0.25
  return { c: { x: b.W * 0.42, y: b.UH * 0.47 }, s, R: s * 1.18 }
}
const UP = { x: 0, y: -1 }
const DL = { x: -0.866, y: 0.5 }
const DR = { x: 0.866, y: 0.5 }
/** a point on the corner: `a` along one edge, `b2` along the other */
const onFace = (c: Pt, s: number, e1: Pt, e2: Pt, a: number, b2: number) => ({ x: c.x + s * (e1.x * a + e2.x * b2), y: c.y + s * (e1.y * a + e2.y * b2) })

/** the glass corner, looked into: three mirror faces meeting in one point,
 *  like the corner of a room; `come` 0 → 1 slides the faces together.
 *  `flash[i]` lights face i (left, right, floor) where light bumps it */
function glassCorner(ctx: CanvasRenderingContext2D, c: Pt, s: number, R: number, come: number, flash: number[] = [0, 0, 0]) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(c.x, c.y, R, 0, Math.PI * 2)
  ctx.fillStyle = '#0b1a33'
  ctx.fill()
  ctx.clip()
  const faces: Array<[Pt, Pt, string]> = [
    [UP, DL, '#3b6aa8'],
    [UP, DR, '#5b8fd0'],
    [DL, DR, '#2a4f86'],
  ]
  for (const [i, [e1, e2, col]] of faces.entries()) {
    const off = (1 - easeOut(come)) * s * 0.9
    const ox = (e1.x + e2.x) * off
    const oy = (e1.y + e2.y) * off
    ctx.save()
    ctx.globalAlpha *= clamp01(come * 1.5)
    ctx.translate(ox, oy)
    const far = { x: c.x + (e1.x + e2.x) * s * 1.2, y: c.y + (e1.y + e2.y) * s * 1.2 }
    const fg = ctx.createLinearGradient(c.x, c.y, far.x, far.y)
    fg.addColorStop(0, '#0b1a33')
    fg.addColorStop(1, col)
    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(c.x + e1.x * s * 1.6, c.y + e1.y * s * 1.6)
    ctx.lineTo(c.x + (e1.x + e2.x) * s * 1.6, c.y + (e1.y + e2.y) * s * 1.6)
    ctx.lineTo(c.x + e2.x * s * 1.6, c.y + e2.y * s * 1.6)
    ctx.closePath()
    ctx.fill()
    if (flash[i] > 0) {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.35 * flash[i]})`
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(191, 219, 254, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(c.x, c.y)
    ctx.lineTo(c.x + e1.x * s * 1.6, c.y + e1.y * s * 1.6)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(c.x, c.y, R, 0, Math.PI * 2)
  ctx.stroke()
}

/** a photon's way into the corner and straight back out: in along `d`,
 *  its three bumps, out along −d (parallel: the corner's trick) */
function cornerPath(d: Pt, bumps: Pt[], reach: number): Pt[] {
  const n = Math.hypot(d.x, d.y)
  const u = { x: d.x / n, y: d.y / n }
  const first = bumps[0]
  const last = bumps[bumps.length - 1]
  return [{ x: first.x - u.x * reach, y: first.y - u.y * reach }, ...bumps, { x: last.x - u.x * reach, y: last.y - u.y * reach }]
}

const FACE_LEFT = 0
const FACE_RIGHT = 1
const FACE_FLOOR = 2

/** the three photons of the trick: from upper left, from the right, from
 *  below — each in along its way, out along the very same way back */
function trickPhotons(c: Pt, s: number) {
  const L = (a: number, b2: number) => onFace(c, s, UP, DL, a, b2)
  const Rf = (a: number, b2: number) => onFace(c, s, UP, DR, a, b2)
  const F = (a: number, b2: number) => onFace(c, s, DL, DR, a, b2)
  const reach = s * 1.5
  return [
    { at: 5.1, faces: [FACE_LEFT, FACE_FLOOR, FACE_RIGHT], path: cornerPath({ x: 0.8, y: 0.55 }, [L(0.55, 0.45), F(0.3, 0.35), Rf(0.5, 0.35)], reach) },
    { at: 7.6, faces: [FACE_RIGHT, FACE_FLOOR, FACE_LEFT], path: cornerPath({ x: -1, y: 0.12 }, [Rf(0.35, 0.6), F(0.45, 0.25), L(0.3, 0.55)], reach) },
    { at: 8.7, faces: [FACE_FLOOR, FACE_LEFT, FACE_RIGHT], path: cornerPath({ x: 0.35, y: -0.9 }, [F(0.55, 0.35), L(0.6, 0.3), Rf(0.62, 0.22)], reach) },
  ]
}

/** a photon flying a path on the idle clock, its way behind it drawn as a
 *  faint trail; returns the bump flashes (per face) and whether it is home */
function flyPath(
  ctx: CanvasRenderingContext2D,
  key: string,
  path: Pt[],
  faces: number[],
  t: number,
  at: number,
  idle: number,
  nm: number,
  o: { hero?: boolean; trail?: boolean } = {},
): { flash: number[]; done: boolean; since: number } {
  const flash = [0, 0, 0]
  const since = sinceLaunch(key, t, at, idle)
  if (since < 0) return { flash, done: false, since }
  const d = PHOTON_SPEED * since
  const total = pathLen(path)
  // where each bump happens, along the path
  let acc = 0
  for (let i = 1; i < path.length - 1; i++) {
    acc += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    const ago = (d - acc) / PHOTON_SPEED
    if (ago >= 0 && ago < 0.5 && faces[i - 1] !== undefined) flash[faces[i - 1]] = Math.max(flash[faces[i - 1]], 1 - ago / 0.5)
  }
  if (o.trail !== false) {
    ctx.save()
    ctx.strokeStyle = wavelengthToCss(nm, 0.35)
    ctx.lineWidth = 2
    ctx.setLineDash([5, 6])
    ctx.beginPath()
    let left = Math.min(d, total)
    ctx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length && left > 0; i++) {
      const L = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
      const q = Math.min(1, left / L)
      ctx.lineTo(lerp(path[i - 1].x, path[i].x, q), lerp(path[i - 1].y, path[i].y, q))
      left -= L
    }
    ctx.stroke()
    ctx.restore()
  }
  const p = pointAlong(path, d)
  if (p) {
    packet(ctx, p.x, p.y, p.a, nm, idle, 1, 44)
    if (o.hero) marker(ctx, p.x, p.y, 20, idle)
  }
  return { flash, done: d >= total, since }
}

/** a bicycle's red back reflector on its mudguard, and a torch beside it */
function bikeReflector(ctx: CanvasRenderingContext2D, x: number, y: number, glow: number) {
  ctx.save()
  // the back wheel, its spokes, the frame, the saddle on its post
  const wx = x + 34
  const wy = y + 120
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.arc(wx, wy, 70, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
  ctx.lineWidth = 1
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(wx, wy)
    ctx.lineTo(wx + Math.cos(a) * 66, wy + Math.sin(a) * 66)
    ctx.stroke()
  }
  ctx.strokeStyle = '#0ea5e9'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(wx, wy)
  ctx.lineTo(x + 46, y - 40)
  ctx.lineTo(x + 150, y - 30)
  ctx.moveTo(wx, wy)
  ctx.lineTo(x + 150, y + 60)
  ctx.lineTo(x + 46, y - 40)
  ctx.stroke()
  ctx.fillStyle = '#1f2937'
  ctx.beginPath()
  ctx.ellipse(x + 50, y - 58, 30, 9, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(x + 46, y - 40)
  ctx.lineTo(x + 50, y - 52)
  ctx.moveTo(x + 46, y - 20)
  ctx.lineTo(x + 24, y)
  ctx.stroke()
  // the reflector: a red body of tiny corners
  const g = ctx.createLinearGradient(x - 22, 0, x + 22, 0)
  g.addColorStop(0, '#991b1b')
  g.addColorStop(1, '#dc2626')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(x - 24, y - 26, 48, 52, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(254, 202, 202, 0.5)'
  ctx.lineWidth = 1
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 4; i++) {
      const cx = x - 15 + i * 10 + (j % 2) * 5
      const cy = y - 19 + j * 9.5
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3
        const px = cx + Math.cos(a) * 4.5
        const py = cy + Math.sin(a) * 4.5
        if (k) ctx.lineTo(px, py)
        else ctx.moveTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }
  if (glow > 0) {
    ctx.globalAlpha *= glow
    const rg = ctx.createRadialGradient(x, y, 0, x, y, 70)
    rg.addColorStop(0, 'rgba(248, 113, 113, 0.75)')
    rg.addColorStop(1, 'rgba(248, 113, 113, 0)')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(x, y, 70, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function torch(ctx: CanvasRenderingContext2D, x: number, y: number): Pt {
  ctx.save()
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(x - 52, y - 9, 40, 18, 4)
  ctx.fill()
  ctx.fillStyle = '#64748b'
  ctx.beginPath()
  ctx.moveTo(x - 12, y - 9)
  ctx.lineTo(x, y - 15)
  ctx.lineTo(x, y + 15)
  ctx.lineTo(x - 12, y + 9)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#fef9c3'
  ctx.fillRect(x - 1, y - 13, 3, 26)
  ctx.restore()
  return { x: x + 3, y }
}

/** a room's corner: two walls and the floor (the picture from a child's
 *  life beside the glass corner) */
function roomCorner(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(2, 6, 23, 0.8)'
  ctx.beginPath()
  ctx.roundRect(x - s * 1.25, y - s * 1.15, s * 2.5, s * 2.3, 12)
  ctx.fill()
  ctx.clip()
  const faces: Array<[Pt, Pt, string]> = [
    [UP, DL, '#e9d5b4'],
    [UP, DR, '#d6bf96'],
    [DL, DR, '#a16207'],
  ]
  for (const [e1, e2, col] of faces) {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + e1.x * s * 2, y + e1.y * s * 2)
    ctx.lineTo(x + (e1.x + e2.x) * s * 2, y + (e1.y + e2.y) * s * 2)
    ctx.lineTo(x + e2.x * s * 2, y + e2.y * s * 2)
    ctx.closePath()
    ctx.fill()
  }
  // a picture on the wall and a ball on the floor: it is a room
  ctx.fillStyle = '#60a5fa'
  ctx.fillRect(x - s * 0.75, y - s * 0.75, s * 0.4, s * 0.3)
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(x + s * 0.15, y + s * 0.6, s * 0.14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function trickCorner(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number, key: string) {
  const g = cornerGeo(b)
  const come = clamp01((t - 2.6) / 1.4)
  // the faces first, lit where light bumped them a frame ago (the photons
  // fly over them, so they draw after)
  glassCorner(ctx, g.c, g.s, g.R, come, lastFlash.get(key) ?? [0, 0, 0])
  const flashes = [0, 0, 0]
  for (const [i, p] of trickPhotons(g.c, g.s).entries()) {
    const r = flyPath(ctx, `${key}:p${i}`, p.path, p.faces, t, p.at, idle, GREEN, { hero: i === 0 })
    for (let f = 0; f < 3; f++) flashes[f] = Math.max(flashes[f], r.flash[f])
  }
  lastFlash.set(key, flashes)
  return g
}
const lastFlash = new Map<string, number[]>()

function drawTrick(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  // "Let's look closer at one little mirror." → the camera flies into one
  // round mirror of the panel (0.1–2.4)
  const z = easeInOut(clamp01((t - 0.1) / 2.3))
  const g = groundGeo(b)
  const cells = reflectorCells(b)
  const cell = cells[CELLS_X * 2 + 3]
  const cornerA = clamp01((z - 0.55) / 0.35)
  if (cornerA < 1) {
    ctx.save()
    ctx.globalAlpha *= 1 - cornerA
    scaledAbout(ctx, cell.x, cell.y, 1 + 26 * z * z, () => {
      moonGround(ctx, b, g, idle)
      reflectorPanel(ctx, g.panel.x, g.panel.y, g.panel.w, idle)
    })
    ctx.restore()
  }
  if (cornerA <= 0) return
  ctx.save()
  ctx.globalAlpha *= cornerA
  backdrop(ctx, b)
  // "Your bicycle reflector…" → the corner steps aside for the bike
  const aside = easeInOut(clamp01((t - 10.1) / 0.8))
  ctx.save()
  ctx.globalAlpha *= 1 - 0.55 * aside
  const cg = cornerGeo(b)
  scaledAbout(ctx, cg.c.x - b.W * 0.2, cg.c.y - b.UH * 0.2, 1 - 0.45 * aside, () => {
    // before the faces come together: the round glass, empty
    const come = clamp01((t - 2.6) / 1.4)
    if (come <= 0) glassCorner(ctx, cg.c, cg.s, cg.R, 0)
    else trickCorner(ctx, b, t, idle, 'mt')
  })
  ctx.restore()
  // "…like the corner of a room." → a room's corner beside it
  const room = bounce(sinceLaunch('mt:room', t, 3.4, idle), 0.4, 999, 0.1)
  if (room > 0) {
    ctx.save()
    ctx.globalAlpha *= Math.min(1, room) * (1 - aside)
    const rx = b.W * 0.84
    const ry = b.UH * 0.3
    scaledAbout(ctx, rx, ry, Math.min(1.1, room), () => roomCorner(ctx, rx, ry, Math.min(b.W, b.UH) * 0.08))
    ctx.restore()
  }
  // the bicycle reflector: a torch shines on it, the light comes straight back red
  if (aside > 0) {
    const bx = b.W * 0.7
    const by = b.UH * 0.62
    const tx = b.W * 0.36
    const ty = by
    ctx.save()
    ctx.globalAlpha *= aside
    const go = sinceLaunch('mt:torch', t, 10.6, idle)
    const oneWay = (bx - 26 - (tx + 3)) / PHOTON_SPEED
    bikeReflector(ctx, bx, by, go > oneWay ? clamp01((go - oneWay) / 0.4) : 0)
    const mouth = torch(ctx, tx, ty)
    if (go >= 0) {
      for (let j = 0; j < 4; j++) {
        const sj = go - j * 0.5
        if (sj < 0) continue
        const d = sj * PHOTON_SPEED
        const span = bx - 26 - mouth.x
        if (d <= span) packet(ctx, mouth.x + d, ty - 10, 0, 580, idle, 1, 40, ordinaryCss)
        else if (d <= 2 * span) packet(ctx, bx - 26 - (d - span), ty + 10, Math.PI, TORCH_RED_NM, idle, 1, 40)
      }
    }
    ctx.restore()
  }
  ctx.restore()
}

/** the panel's round mirrors where the trick's camera flies in */
function reflectorCells(b: Box): Pt[] {
  const g = groundGeo(b)
  const w = g.panel.w
  const h = w * 0.62
  const cw = (w - w * 0.12) / CELLS_X
  const ch = (h - w * 0.12) / CELLS_Y
  const out: Pt[] = []
  for (let j = 0; j < CELLS_Y; j++)
    for (let i = 0; i < CELLS_X; i++) out.push({ x: g.panel.x - w / 2 + w * 0.06 + cw * (i + 0.5), y: g.panel.y - h / 2 + w * 0.06 + ch * (j + 0.5) })
  return out
}

// ---------- 🔭 the flash ----------

/** the flash: `n` photons leaving the telescope together and spreading a
 *  little on the way; returns how many seconds since they landed (< 0 =
 *  still flying) */
function flashUp(ctx: CanvasRenderingContext2D, key: string, from: Pt, to: Pt, t: number, at: number, idle: number, o: { n?: number; spread?: number; hero?: boolean } = {}) {
  const since = sinceLaunch(key, t, at, idle)
  if (since < 0) return -1
  const L = Math.hypot(to.x - from.x, to.y - from.y)
  const u = unit(from, to)
  const nx = -u.y
  const ny = u.x
  const n = o.n ?? 7
  const d = PHOTON_SPEED * since
  if (d <= L) {
    // side by side, 15 px apart at the start, the row widening as it climbs
    const gap = 15 + (o.spread ?? 0.06) * d
    for (let j = 0; j < n; j++) {
      const f = j - (n - 1) / 2
      const lag = (rnd(j, 41) - 0.5) * 10
      const dd = Math.min(L, d + lag)
      if (dd < 0) continue
      const x = from.x + u.x * dd + nx * f * gap
      const y = from.y + u.y * dd + ny * f * gap
      packet(ctx, x, y, Math.atan2(u.y, u.x), GREEN, idle, 1, 26)
      if (o.hero && j === Math.floor(n / 2)) marker(ctx, x, y, 16, idle)
    }
  }
  return since - L / PHOTON_SPEED
}

/** the spot on the Moon where the flash landed, a faint green glow */
function moonSpot(ctx: CanvasRenderingContext2D, p: Pt, r: number, alpha: number) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
  g.addColorStop(0, wavelengthToCss(GREEN, 0.75))
  g.addColorStop(1, wavelengthToCss(GREEN, 0))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** the spot seen from above: grey ground, the green spot, a town's streets
 *  and houses drawn in it for size (it is wider), the tiny reflector */
function spotFromAbove(ctx: CanvasRenderingContext2D, c: Pt, r: number, idle: number) {
  ctx.fillStyle = '#7b8494'
  ctx.fillRect(c.x - r, c.y - r, 2 * r, 2 * r)
  for (let i = 0; i < 14; i++) {
    const x = c.x + (rnd(i, 51) - 0.5) * 2 * r
    const y = c.y + (rnd(i, 52) - 0.5) * 2 * r
    const cr = 4 + rnd(i, 53) * 18
    ctx.fillStyle = 'rgba(55, 65, 81, 0.45)'
    ctx.beginPath()
    ctx.arc(x, y, cr, 0, Math.PI * 2)
    ctx.fill()
  }
  moonSpot(ctx, c, r * 0.82, 1)
  // a town, for size: a few streets and houses, drawn as outlines
  const tw = r * 0.9
  ctx.save()
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.7)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(c.x - tw / 2, c.y - tw / 2, tw, tw)
  for (let i = 1; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(c.x - tw / 2 + (tw * i) / 4, c.y - tw / 2)
    ctx.lineTo(c.x - tw / 2 + (tw * i) / 4, c.y + tw / 2)
    ctx.moveTo(c.x - tw / 2, c.y - tw / 2 + (tw * i) / 4)
    ctx.lineTo(c.x + tw / 2, c.y - tw / 2 + (tw * i) / 4)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(248, 250, 252, 0.55)'
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const hx = c.x - tw / 2 + (tw * (i + 0.5)) / 4
      const hy = c.y - tw / 2 + (tw * (j + 0.5)) / 4
      ctx.fillRect(hx - tw * 0.05, hy - tw * 0.05, tw * 0.1, tw * 0.1)
    }
  ctx.restore()
  // the reflector: a tiny dot in it all
  const rp = { x: c.x + r * 0.32, y: c.y - r * 0.28 }
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(rp.x - 2, rp.y - 1.5, 4, 3)
  marker(ctx, rp.x, rp.y, 10, idle)
  text(ctx, 'town, for size', c.x, c.y + tw / 2 + 12, 'rgba(248, 250, 252, 0.8)', 11)
}

function earthScene(
  ctx: CanvasRenderingContext2D,
  b: Box,
  idle: number,
  o: { open?: number; moonAt?: Pt; moonK?: number; named?: number; spot?: number; spotR?: number } = {},
) {
  backdrop(ctx, b)
  stars(ctx, b, idle)
  const g = earthGeo(b, o.moonAt)
  const moon = { ...g.moon, r: g.moon.r * (o.moonK ?? 1) }
  const site = moonPlace(moon, APOLLO11.lat, APOLLO11.lon)
  drawMoon(ctx, moon.x, moon.y, moon.r)
  moonSpot(ctx, site, o.spotR ?? 16, o.spot ?? 0)
  hill(ctx, b, g.hillY)
  const named = o.named ?? 0
  let scope: Scope = { pivot: g.dome, mouth: g.dome }
  scaledAbout(ctx, g.dome.x, g.dome.y - 30, 1 + 0.2 * named, () => {
    scope = observatory(ctx, g.dome.x, g.dome.y, site, o.open ?? 0)
  })
  if (named > 0) marker(ctx, g.dome.x, g.dome.y - 40, 70, idle, Math.min(1, named))
  return { ...g, moon, site, scope }
}

function drawFlash(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  // "Let's go back down to Earth." → the glass corner shrinks away into
  // the Moon in Earth's sky (0.1–2.4)
  const z = easeInOut(clamp01((t - 0.1) / 2.3))
  const named = bounce(sinceLaunch('mf:named', t, 2.35, idle), 0.4, 1.8, 0.45)
  const open = easeInOut(clamp01((t - 2.6) / 1.8))
  const spotGrow = fadeIn(t, 7.6, 1.2)
  const e = earthScene(ctx, b, idle, { open, named, spot: 0, spotR: 18 })
  if (z < 1) {
    ctx.save()
    ctx.globalAlpha *= 1 - z
    const cg = cornerGeo(b)
    const k = 1 - 0.9 * z
    ctx.translate(lerp(cg.c.x, e.moon.x, z), lerp(cg.c.y, e.moon.y, z))
    ctx.scale(k, k)
    ctx.translate(-cg.c.x, -cg.c.y)
    glassCorner(ctx, cg.c, cg.s, cg.R, 1)
    ctx.restore()
  }
  // "It sends a laser flash up to the Moon." → the flash leaves and spreads
  const landed = flashUp(ctx, 'mf:flash', e.scope.mouth, e.site, t, 5.1, idle, { n: 9, spread: 0.06 })
  const L = Math.hypot(e.site.x - e.scope.mouth.x, e.site.y - e.scope.mouth.y)
  const spotR = (15 * 4) / 2 + 0.06 * L * 2
  if (landed >= 0) moonSpot(ctx, e.site, spotR + 6, Math.min(1, landed / 0.4) * 0.9)
  // "Even laser light spreads a little on the way." → the spread, drawn as
  // a faint cone from the telescope to the spot
  if (spotGrow > 0) {
    const u = unit(e.scope.mouth, e.site)
    ctx.save()
    ctx.globalAlpha *= spotGrow * 0.55
    ctx.strokeStyle = wavelengthToCss(GREEN, 0.6)
    ctx.setLineDash([6, 6])
    ctx.lineWidth = 1.5
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(e.scope.mouth.x + -u.y * s * 3, e.scope.mouth.y + u.x * s * 3)
      ctx.lineTo(e.site.x + -u.y * s * spotR, e.site.y + u.x * s * spotR)
      ctx.stroke()
    }
    ctx.restore()
    moonSpot(ctx, e.site, spotR + 6, spotGrow * 0.6)
  }
  // "At the Moon, the light makes a spot wider than a whole town." → a
  // callout: the spot seen from above, a town drawn in it, the reflector
  const pop = bounce(sinceLaunch('mf:callout', t, 10.1, idle), 0.4, 999, 0.1)
  if (pop > 0) {
    const cr = Math.min(b.W, b.UH) * 0.2
    const cc = { x: b.W * 0.48, y: b.UH * 0.5 }
    const inset = 0.6 + 0.4 * Math.min(1.1, pop)
    callout(ctx, e.site, cc, cr * inset, clamp01(pop * 2), () => spotFromAbove(ctx, cc, cr * inset, idle))
  }
}

// ---------- ↩️ the way back ----------

function backGeo(b: Box) {
  const g = groundGeo(b)
  const panel = { x: g.panel.x, y: g.panel.y }
  const u = unit(g.earth, panel) // the light comes down from Earth
  return { g, panel, u }
}

function drawBack(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  // "Let's watch the light land on the Moon." → the camera lands (0.1–2.4)
  const z = easeInOut(clamp01((t - 0.1) / 2.3))
  const groundA = clamp01((z - 0.45) / 0.35)
  if (groundA < 1) {
    ctx.save()
    ctx.globalAlpha *= 1 - groundA
    const e = earthGeo(b)
    const site = e.site
    scaledAbout(ctx, site.x, site.y, 1 + 12 * z * z, () => earthScene(ctx, b, idle, { open: 1, spot: 0.9, spotR: 3 + 0.06 * 560 }))
    ctx.restore()
  }
  if (groundA <= 0) return
  const { g, panel, u } = backGeo(b)
  // the hero comes home: Earth flashes green when it lands there
  const heroDown = sinceLaunch('mb:hero', t, 5.1, idle)
  const downLen = 220
  // straight back the way it came: to the edge of Earth facing the Moon
  const upPath = [panel, { x: g.earth.x + u.x * g.earth.r, y: g.earth.y + u.y * g.earth.r }]
  const upLen = pathLen(upPath)
  const upSince = heroDown - downLen / PHOTON_SPEED
  const home = upSince - upLen / PHOTON_SPEED
  const blip = home >= 0 ? Math.max(0, 1 - home / 1.6) : 0
  ctx.save()
  ctx.globalAlpha *= groundA
  moonGround(ctx, b, g, idle, { earthBlip: blip })
  const bump = upSince >= 0 && upSince < 0.6 ? 1 - upSince / 0.6 : 0
  reflectorPanel(ctx, panel.x, panel.y, g.panel.w, idle, bump)
  // "Almost all of it lands on the dusty ground. It is lost." → the flash
  // rains down from Earth onto the dust: a puff, and it is gone
  const rain = sinceLaunch('mb:rain', t, 2.6, idle)
  if (rain >= 0) {
    for (let j = 0; j < 34; j++) {
      const land = { x: b.W * (0.06 + 0.88 * rnd(j, 61)), y: g.gy + 14 + rnd(j, 62) * (b.UH - g.gy - 30) }
      if (Math.abs(land.x - panel.x) < g.panel.w * 0.7 && Math.abs(land.y - panel.y) < 50) continue
      const rem = 50 + j * 26 - rain * PHOTON_SPEED // px still to fly
      const fromEarth = Math.hypot(land.x - g.earth.x, land.y - g.earth.y) - g.earth.r
      if (rem > 0) {
        // each photon comes straight from Earth to where it lands
        const uj = unit(g.earth, land)
        if (rem < fromEarth) packet(ctx, land.x - uj.x * rem, land.y - uj.y * rem, Math.atan2(uj.y, uj.x), GREEN, idle, 0.9, 28)
      } else {
        const ago = -rem / PHOTON_SPEED
        if (ago < 0.9) {
          ctx.fillStyle = `rgba(203, 213, 225, ${0.5 * (1 - ago / 0.9)})`
          ctx.beginPath()
          ctx.ellipse(land.x, land.y, 4 + ago * 16, (4 + ago * 16) * 0.35, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }
  // "But a tiny bit hits the reflector." → the hero comes down onto it…
  if (heroDown >= 0) {
    const dd = heroDown * PHOTON_SPEED
    if (dd <= downLen) {
      const x = panel.x - u.x * (downLen - dd)
      const y = panel.y - u.y * (downLen - dd)
      packet(ctx, x, y, Math.atan2(u.y, u.x), GREEN, idle, 1, 36)
      marker(ctx, x, y, 20, idle)
    }
  }
  // "It flies straight back to Earth, to the telescope." → …and straight
  // back up the way it came (launched at 7.6 at the earliest)
  const backSince = Math.min(upSince, sinceLaunch('mb:up', t, 7.6, idle))
  if (backSince >= 0) {
    const p = pointAlong(upPath, backSince * PHOTON_SPEED)
    if (p) {
      packet(ctx, p.x, p.y, p.a, GREEN, idle, 1, 36)
      marker(ctx, p.x, p.y, 20, idle)
    }
  }
  // "Out of a hundred million billion photons, only about one comes home."
  // → a box of countless faint photons, ONE of them amber
  const box = fadeIn(t, 10.1, 0.6)
  if (box > 0) {
    const bx = b.W * 0.56
    const by = b.UH * 0.06
    const bw = b.W * 0.4
    const bh = b.UH * 0.4
    ctx.save()
    ctx.globalAlpha *= box
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)'
    ctx.beginPath()
    ctx.roundRect(bx, by, bw, bh, 14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.stroke()
    const n = Math.floor(2600 * clamp01((t - 10.1) / 0.8))
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = wavelengthToCss(GREEN, 0.18 + 0.25 * rnd(i, 71))
      ctx.fillRect(bx + 10 + rnd(i, 72) * (bw - 20), by + 10 + rnd(i, 73) * (bh - 34), 1.5, 1.5)
    }
    const hx = bx + bw * 0.63
    const hy = by + bh * 0.42
    ctx.fillStyle = AMBER
    ctx.beginPath()
    ctx.arc(hx, hy, 3.5, 0, Math.PI * 2)
    ctx.fill()
    marker(ctx, hx, hy, 12, idle)
    text(ctx, '1 in 100 000 000 000 000 000', bx + bw / 2, by + bh - 13, 'rgba(148, 163, 184, 0.85)', 11)
    ctx.restore()
  }
  ctx.restore()
}

// ---------- ⏱️ the timing ----------

/** a stopwatch: a dial for 0 … 3 seconds, its hand, the reading below;
 *  `stopped` makes the reading glow amber */
function stopwatch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, secs: number, stopped: number, idle: number) {
  ctx.save()
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(x - 9, y - r - 18, 18, 14)
  ctx.beginPath()
  ctx.arc(x, y - r - 20, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f8fafc'
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 - Math.PI / 2
    const big = i % 10 === 0
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = big ? 3 : 1.2
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(a) * r * (big ? 0.74 : 0.82), y + Math.sin(a) * r * (big ? 0.74 : 0.82))
    ctx.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9)
    ctx.stroke()
  }
  for (let s = 0; s < 3; s++) {
    const a = (s / 3) * Math.PI * 2 - Math.PI / 2
    text(ctx, String(s), x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58, '#334155', Math.round(r * 0.2), '600')
  }
  const a = (secs / 3) * Math.PI * 2 - Math.PI / 2
  ctx.strokeStyle = '#dc2626'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82)
  ctx.stroke()
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  const glow = stopped > 0 ? 0.6 + 0.4 * Math.sin(idle * 5) : 0
  reading(ctx, `${secs.toFixed(2)} s`, x, y + r + 26, stopped > 0 ? AMBER_SOFT : '#e2e8f0', 16)
  if (glow > 0) marker(ctx, x, y, r + 12, idle, stopped)
}
/** the stopwatch's reading on a dark pill */
function reading(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, size: number) {
  ctx.save()
  ctx.font = `600 ${size}px ui-sans-serif, system-ui, sans-serif`
  const w = ctx.measureText(s).width + 18
  ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - 14, w, 28, 8)
  ctx.fill()
  text(ctx, s, x, y, color, size, '600')
  ctx.restore()
}

/** the round trip on the idle clock: the flash goes up, the hero comes
 *  back; returns the stopwatch reading and whether it has stopped */
function roundTrip(ctx: CanvasRenderingContext2D, key: string, mouth: Pt, site: Pt, t: number, at: number, idle: number, secsPerTrip = ROUND_TRIP_S) {
  const up = flashUp(ctx, `${key}:up`, mouth, site, t, at, idle, { n: 3, spread: 0.02, hero: true })
  const L = Math.hypot(site.x - mouth.x, site.y - mouth.y)
  const legS = L / PHOTON_SPEED
  let secs = 0
  let stopped = 0
  const since = sinceLaunch(`${key}:clock`, t, at, idle)
  if (since >= 0) {
    if (up < 0) secs = (since / (2 * legS)) * secsPerTrip
    else {
      // the hero comes back down the same line
      const d = up * PHOTON_SPEED
      if (d <= L) {
        const x = site.x + (mouth.x - site.x) * (d / L)
        const y = site.y + (mouth.y - site.y) * (d / L)
        packet(ctx, x, y, Math.atan2(mouth.y - site.y, mouth.x - site.x), GREEN, idle, 1, 30)
        marker(ctx, x, y, 18, idle)
        secs = ((legS + up) / (2 * legS)) * secsPerTrip
      } else {
        secs = secsPerTrip
        stopped = clamp01((up - legS) / 0.3)
      }
    }
  }
  return { secs, stopped, glint: up >= 0 && up < 0.6 ? 1 - up / 0.6 : 0 }
}

function drawTiming(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const e = earthScene(ctx, b, idle, { open: 1 })
  const sw = { x: b.W * 0.8, y: b.UH * 0.6, r: Math.min(b.W, b.UH) * 0.1 }
  // "A stopwatch times the flash." → the flash goes up, the hero comes
  // back, the stopwatch runs; it stops (amber) when the hero is home
  const trip = roundTrip(ctx, 'mtm', e.scope.mouth, e.site, t, 2.6, idle)
  if (trip.glint > 0) moonSpot(ctx, e.site, 14, trip.glint)
  // "Light always flies at exactly the same speed…" → a photon climbs
  // beside the trip and leaves a mark at every tick of the clock: the
  // marks come out evenly spaced, the same gap every time
  steadySteps(ctx, e.scope.mouth, e.site, t, 7.6, idle)
  // "So the time tells us exactly how far away the Moon is." → the first
  // beat's tape measure, now made of light, reaches the Moon
  const tape = easeInOut(clamp01((t - 10.1) / 1.8))
  if (tape > 0) lightTape(ctx, e.scope.mouth, e.site, tape)
  const named = bounce(sinceLaunch('mtm:named', t, 2.35, idle), 0.4, 1.6, 0.45)
  ctx.save()
  ctx.globalAlpha *= fadeIn(t, 0.2, 0.8)
  scaledAbout(ctx, sw.x, sw.y, 1 + 0.15 * named, () => stopwatch(ctx, sw.x, sw.y, sw.r, trip.secs, trip.stopped, idle))
  ctx.restore()
  // "It measures the Moon right to a millimeter!" → a callout at the
  // tape's tip: millimetre ticks right at the reflector
  const pop = bounce(sinceLaunch('mtm:mm', t, 12.6, idle), 0.4, 999, 0.1)
  if (pop > 0) {
    const cr = Math.min(b.W, b.UH) * 0.15
    const cc = { x: b.W * 0.3, y: b.UH * 0.26 }
    const inset = 0.6 + 0.4 * Math.min(1.1, pop)
    callout(ctx, e.site, cc, cr * inset, clamp01(pop * 2), () => millimetres(ctx, cc, cr * inset, idle))
  }
}

/** one tick of the clock, in story seconds of flight */
const TICK_S = 0.6
/**
 * Light's steady speed, made visible: a photon climbs in its own lane
 * beside the trip (launched at `at`, flown on the idle clock) and drops a
 * mark at every tick of the clock. One speed → every gap the same: the
 * amber brackets between the marks are all one length. (The one story
 * speed, PHOTON_SPEED: TICK_S × PHOTON_SPEED px per tick.)
 */
function steadySteps(ctx: CanvasRenderingContext2D, from: Pt, to: Pt, t: number, at: number, idle: number) {
  const since = sinceLaunch('mtm:steady', t, at, idle)
  if (since < 0) return
  const u = unit(from, to)
  const lane = { x: -u.y * 34, y: u.x * 34 } // to the left of the trip
  const L = Math.hypot(to.x - from.x, to.y - from.y)
  const d = Math.min(L, since * PHOTON_SPEED)
  const step = TICK_S * PHOTON_SPEED
  const at0 = (q: number) => ({ x: from.x + lane.x + u.x * q, y: from.y + lane.y + u.y * q })
  const marks = Math.floor(d / step)
  for (let i = 0; i <= marks; i++) {
    const p = at0(i * step)
    const age = since - i * TICK_S
    const pop = Math.min(1.25, bounce(age, 0.25, 999, 0.1))
    // the mark: an amber dot with a small cross-tick, popping in
    ctx.save()
    ctx.fillStyle = AMBER
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4.5 * pop, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // between two marks: the gap, the same every time
    if (i > 0) {
      const ox = lane.x * 0.42
      const oy = lane.y * 0.42
      ctx.save()
      ctx.globalAlpha *= clamp01(age / 0.3)
      ctx.strokeStyle = AMBER_SOFT
      ctx.lineWidth = 2
      const a = at0((i - 1) * step + 7)
      const b = at0(i * step - 7)
      ctx.beginPath()
      ctx.moveTo(a.x + ox, a.y + oy)
      ctx.lineTo(b.x + ox, b.y + oy)
      ctx.stroke()
      for (const e of [a, b]) {
        ctx.beginPath()
        ctx.moveTo(e.x + ox * 0.6, e.y + oy * 0.6)
        ctx.lineTo(e.x + ox * 1.4, e.y + oy * 1.4)
        ctx.stroke()
      }
      ctx.restore()
    }
  }
  if (since * PHOTON_SPEED <= L) {
    const p = at0(d)
    packet(ctx, p.x, p.y, Math.atan2(u.y, u.x), GREEN, idle, 1, 30)
  }
}

/** the tape measure again, as a band of light from the telescope to the
 *  Moon, `q` of it unrolled */
function lightTape(ctx: CanvasRenderingContext2D, from: Pt, to: Pt, q: number) {
  const x = lerp(from.x, to.x, q)
  const y = lerp(from.y, to.y, q)
  const a = Math.atan2(to.y - from.y, to.x - from.x)
  const L = Math.hypot(x - from.x, y - from.y)
  ctx.save()
  ctx.translate(from.x, from.y)
  ctx.rotate(a)
  ctx.fillStyle = 'rgba(253, 224, 71, 0.75)'
  ctx.fillRect(0, -4, L, 8)
  ctx.strokeStyle = 'rgba(31, 41, 55, 0.7)'
  ctx.lineWidth = 1
  for (let d = 10; d < L; d += 10) {
    ctx.beginPath()
    ctx.moveTo(d, -4)
    ctx.lineTo(d, d % 50 === 0 ? 4 : 0)
    ctx.stroke()
  }
  ctx.restore()
}

/** close up at the tape's tip: millimetre ticks right at the reflector */
function millimetres(ctx: CanvasRenderingContext2D, c: Pt, r: number, idle: number) {
  ctx.fillStyle = '#4b5563'
  ctx.fillRect(c.x - r, c.y - r, 2 * r, 2 * r)
  // the reflector's edge on the right
  ctx.fillStyle = '#cbd5e1'
  ctx.fillRect(c.x + r * 0.35, c.y - r, r, 2 * r)
  ctx.fillStyle = '#1e3a8a'
  ctx.beginPath()
  ctx.arc(c.x + r * 0.75, c.y, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
  // the tape's end, with millimetre ticks
  ctx.fillStyle = 'rgba(253, 224, 71, 0.95)'
  ctx.fillRect(c.x - r, c.y - r * 0.22, r * 1.35, r * 0.44)
  ctx.strokeStyle = 'rgba(31, 41, 55, 0.9)'
  for (let i = 0; i <= 12; i++) {
    const x = c.x + r * 0.35 - i * r * 0.1
    ctx.lineWidth = i % 5 === 0 ? 2 : 1
    ctx.beginPath()
    ctx.moveTo(x, c.y - r * 0.22)
    ctx.lineTo(x, c.y - r * 0.22 + (i % 5 === 0 ? r * 0.26 : r * 0.14))
    ctx.stroke()
  }
  marker(ctx, c.x + r * 0.35, c.y, r * 0.18, idle)
  text(ctx, '1 mm', c.x + r * 0.3, c.y + r * 0.5, 'rgba(248, 250, 252, 0.85)', 12, '600')
}

// ---------- 🔁 the drill-in ----------

// the replay draws the trip closer together (a shorter way, never a
// faster photon — playbook 19f)
function drillGeo(b: Box, far: number) {
  const hillY = b.UH * 0.86
  const dome = { x: b.W * 0.26, y: hillY - 4 }
  const m0 = { x: b.W * 0.52, y: b.UH * 0.4 }
  const away = unit(dome, m0)
  const moon = { x: m0.x + away.x * far, y: m0.y + away.y * far, r: Math.min(b.W, b.UH) * 0.075 }
  return { hillY, dome, moon, site: moonPlace(moon, APOLLO11.lat, APOLLO11.lon) }
}

function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  // "The longer the trip, the farther away the Moon." → the Moon slides
  // farther, and the same trip takes longer on the stopwatch
  const farQ = easeInOut(clamp01((t - 8.3) / 1.4))
  const g = drillGeo(b, 90 * farQ)
  const g0 = drillGeo(b, 0)
  ctx.save()
  ctx.globalAlpha *= open
  stars(ctx, b, idle)
  if (farQ > 0) {
    ctx.save()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(g0.moon.x, g0.moon.y, g0.moon.r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  drawMoon(ctx, g.moon.x, g.moon.y, g.moon.r)
  hill(ctx, b, g.hillY)
  const scope = observatory(ctx, g.dome.x, g.dome.y, g.site, 1, 0.85)
  // ① "First, the telescope sends a flash up to the Moon."
  const L = Math.hypot(g0.site.x - scope.mouth.x, g0.site.y - scope.mouth.y)
  const legS = L / PHOTON_SPEED
  const up = flashUp(ctx, 'md:up', scope.mouth, g0.site, t, 2.6, idle, { n: 3, spread: 0.02, hero: true })
  stepRing(ctx, scope.mouth.x, scope.mouth.y, 46, 1, idle, fadeIn(t, 2.6, 0.4) * (1 - fadeIn(t, 5, 0.4)))
  // ② "Then the reflector sends a tiny bit of it straight back." — the
  // hero turns round at the reflector (not before it got there)
  const back = Math.min(up, sinceLaunch('md:back', t, 5.1, idle))
  stepRing(ctx, g0.site.x, g0.site.y, 30, 2, idle, fadeIn(t, 5.1, 0.4) * (1 - fadeIn(t, 7.5, 0.4)))
  if (up >= 0 && up < 0.6) moonSpot(ctx, g0.site, 12, 1 - up / 0.6)
  let secs = 0
  let stopped = 0
  const clock = sinceLaunch('md:clock', t, 2.6, idle)
  if (clock >= 0) secs = up < 0 ? (clock / (2 * legS)) * ROUND_TRIP_S : ROUND_TRIP_S / 2
  if (back >= 0) {
    const d = back * PHOTON_SPEED
    if (d <= L) {
      const x = lerp(g0.site.x, scope.mouth.x, d / L)
      const y = lerp(g0.site.y, scope.mouth.y, d / L)
      packet(ctx, x, y, Math.atan2(scope.mouth.y - g0.site.y, scope.mouth.x - g0.site.x), GREEN, idle, 1, 30)
      marker(ctx, x, y, 18, idle)
      secs = ((legS + back) / (2 * legS)) * ROUND_TRIP_S
    } else {
      secs = ROUND_TRIP_S
      stopped = 1
    }
  }
  // ③ "The stopwatch times the trip." — and a farther Moon, a longer trip
  const farL = Math.hypot(g.site.x - scope.mouth.x, g.site.y - scope.mouth.y)
  if (farQ > 0) {
    secs = lerp(secs, ROUND_TRIP_S * (farL / L), farQ)
    lightTape(ctx, scope.mouth, g.site, 1)
  }
  const sw = { x: b.W * 0.8, y: b.UH * 0.58, r: Math.min(b.W, b.UH) * 0.085 }
  stopwatch(ctx, sw.x, sw.y, sw.r, secs, stopped, idle)
  stepRing(ctx, sw.x, sw.y, sw.r + 18, 3, idle, fadeIn(t, 7.6, 0.4))
  ctx.restore()
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- 🌙 the drift ----------

/** a fingertip from the side, its nail growing out by `grow` px */
function fingertip(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, grow: number) {
  ctx.save()
  ctx.fillStyle = '#e8b796'
  ctx.beginPath()
  ctx.roundRect(x - 120 * k, y - 26 * k, 140 * k, 52 * k, 26 * k)
  ctx.fill()
  ctx.fillStyle = '#f9d5d0'
  ctx.beginPath()
  ctx.roundRect(x - 40 * k, y - 26 * k, 56 * k, 18 * k, 8 * k)
  ctx.fill()
  // the white free edge: what grew
  ctx.fillStyle = '#fefce8'
  ctx.beginPath()
  ctx.roundRect(x + 14 * k, y - 26 * k, 4 * k + grow, 14 * k, 6 * k)
  ctx.fill()
  ctx.restore()
}

/** an amber measuring bar from (x, y) `len` px long, end ticks */
function amberBar(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, angle = 0) {
  if (len <= 0) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(len, 0)
  ctx.moveTo(0, -7)
  ctx.lineTo(0, 7)
  ctx.moveTo(len, -7)
  ctx.lineTo(len, 7)
  ctx.stroke()
  ctx.restore()
}

const DRIFT_PX = 34 // the Moon's drift, hugely enlarged
function drawDrift(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const g0 = earthGeo(b)
  const away = unit(g0.dome, g0.moon)
  const q = easeInOut(clamp01((t - 2.6) / 2.2))
  const at = { x: g0.moon.x + away.x * DRIFT_PX * q, y: g0.moon.y + away.y * DRIFT_PX * q }
  // the ghost of where it was
  const e = earthScene(ctx, b, idle, { open: 1, moonAt: at, moonK: 1 - 0.05 * q })
  if (q > 0) {
    ctx.save()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(g0.moon.x, g0.moon.y, g0.moon.r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    amberBar(ctx, g0.moon.x + away.x * (g0.moon.r + 10), g0.moon.y + away.y * (g0.moon.r + 10), DRIFT_PX * q, Math.atan2(away.y, away.x))
  }
  // "Scientists measured again and again, for many years." → the years
  // roll on a calendar while flashes go up again and again
  const years = 1969 + Math.round(57 * easeInOut(clamp01((t - 0.1) / 2.3)))
  ctx.save()
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.roundRect(66, 22, 104, 76, 10)
  ctx.fill()
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.roundRect(66, 22, 104, 22, [10, 10, 0, 0])
  ctx.fill()
  text(ctx, String(years), 118, 72, '#0f172a', 26, '700')
  ctx.restore()
  for (let k = 0; k < 3; k++) flashUp(ctx, `mdr:f${k}`, e.scope.mouth, e.site, t, 0.2 + k * 2.5, idle, { n: 3, spread: 0.02 })
  // "About as fast as your fingernails grow!" → a fingertip, its nail
  // growing by the same amber length
  const nail = fadeIn(t, 5.1, 0.5)
  if (nail > 0) {
    const fx = b.W * 0.7
    const fy = b.UH * 0.6
    const grow = DRIFT_PX * easeInOut(clamp01((t - 5.6) / 1.6))
    ctx.save()
    ctx.globalAlpha *= nail
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)'
    ctx.beginPath()
    ctx.roundRect(fx - 190, fy - 80, 290, 140, 14)
    ctx.fill()
    fingertip(ctx, fx, fy, 1.4, grow)
    amberBar(ctx, fx + 25, fy - 56, grow)
    ctx.restore()
  }
  // "And the little mirrors on the Moon still tell us, every clear night."
  // → one more flash, and the reflector glints back
  const last = flashUp(ctx, 'mdr:last', e.scope.mouth, e.site, t, 7.6, idle, { n: 5, spread: 0.03 })
  if (last >= 0) moonSpot(ctx, e.site, 12, 0.5 + 0.5 * Math.sin(idle * 4))
}

// ---------- the beats ----------

export function drawMoonBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') questionScene(ctx, b, t, idle)
  else if (beat === 'mirrors') drawMirrors(ctx, b, t, idle)
  else if (beat === 'trick') drawTrick(ctx, b, t, idle)
  else if (beat === 'flash') drawFlash(ctx, b, t, idle)
  else if (beat === 'back') drawBack(ctx, b, t, idle)
  else if (beat === 'timing') drawTiming(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else drawDrift(ctx, b, t, idle)
}
