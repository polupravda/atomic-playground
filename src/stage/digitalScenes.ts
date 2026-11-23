import { blit, clamp01, easeInOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, electronSprite, lerp, marker, rnd, text } from './storyDraw'
import { PHOTON_SPEED, sinceLaunch } from './laserScenes'
import { backdrop, bounce, fadeIn, packet, replayFrame, rewindSweep, scaledAbout, stepRing, type Box } from './laserCutScenes'
import { MESSAGE, SUN_RGB, asciiCode, bits16, handValue, litWorths, sample16, songPush, toBits } from '../core/digital'

// R09 — 🔢 What "digital" means (proposal: docs/how-things-work/18-proposal-
// digital-information.md, story 1). One question — a drawing, a message
// and a song are so different: how can they all travel the same way? — one
// aha — digit means finger and number; digital means turned into numbers,
// and a computer writes every number with two digits, so letters, photos
// and sounds all become rows of ons and offs. Words taught: digital, bit,
// pixel. Heroes: the letter H's eight lamps, then the sun's yellow pixel.
//   question  our shore (a boy singing, his drawing, his message HI), the
//             sea, Grandma's house; the paper flutters up and falls back;
//             then all three stream over the sea as glowing bits
//   fingers   one hand, one finger ringed (digit = finger); two hands count
//             to ten; the ten digits 0–9 pop under the ten fingers; the
//             three things turn into rows of digits
//   bits      2–9 drop away, 1 and 0 stay; "the one means on" — a shining
//             lamp pops under the 1; "the zero means off" — a dark one under
//             the 0; both are bits; one
//             hand counting in bits (worths 1 2 4 8 16 pop thumb → little
//             finger), thumb = 1, + pointer = 3, all = 31; eight lamps = 255
//   message   H and I drop out of the bubble; the code table (A–Z, ASCII
//             65–90) slides in; H → 72 → lamps 64 and 8; I → 73 → 64, 8, 1
//   decode    the rows arrive at Grandma's; the lit worths add up to 72 and
//             73; the same table gives H and I on her tablet; two tables,
//             one the same as the other
//   photo     a phone takes the photo; inside the camera: cups under red,
//             green and blue hats; photons knock electrons loose; the cups
//             become pixels; the sun's pixel → three numbers → 24 lamps
//   sound     a child sings: the air bunches and spreads; the microphone's
//             thin skin moves; the pen draws the push; evenly spaced
//             measurements; one becomes a number and sixteen lamps
//   drill     🔁 ① letter → table → number ② light → electrons → number
//             ③ air → skin → number; all three → lamps
//   road      everything becomes one long row of lamps; the bits fly over
//             the sea as flashes and waves; at Grandma's all three come back,
//             her window glows; the picture dims slowly before the menu
// Every line is science pacing: piece k is spoken while story time stands
// at 2.5·(k−1) s; its event plays in the 2.5 s watch break after it.
// Flights are launched on story time and flown on the idle clock
// (sinceLaunch), so the picture keeps moving while the voice speaks.

export const DIGITAL_ORDER = ['question', 'fingers', 'bits', 'message', 'decode', 'photo', 'sound', 'drill', 'road'] as const
export type DigitalBeat = (typeof DIGITAL_ORDER)[number]

/** story seconds per beat: 2.5 s per piece (plus a look where noted) */
export const DIGITAL_T: Record<DigitalBeat, number> = {
  question: 7.5,
  fingers: 10,
  // + 3.5 s after the last piece's event: time to look at the eight lamps,
  // their worths and the 255 before the story moves on (Elena, 2026-11-22)
  bits: 21,
  message: 12.5,
  decode: 7.5,
  photo: 12.5,
  sound: 10,
  drill: 10,
  // the payoff plays out, then the picture dims before the menu returns
  // (Elena, 2026-11-22: the ending was too abrupt)
  road: 11,
}

// ---------- the look ----------

export const LAMP_ON = 'rgba(255, 246, 214, 0.97)'
const LAMP_OFF = '#1e293b'
const LAMP_RIM = '#64748b'
export const SKIN = '#e8b796'
const SKIN_EDGE = '#b9876b'
export const PAPER = '#f1f5f9'
const SUN = '#facc15'
const CAT = '#64748b'
const STRIPE = '#334155'
export const HINT = 'rgba(148, 163, 184, 0.95)'
export const BRIGHT = 'rgba(226, 232, 240, 0.97)'
export const NOTE = '#a5b4fc'
/** red, green, blue: the hats, the bars, the photons */
export const RGB_CSS = ['#ef4444', '#22c55e', '#3b82f6'] as const
export const RGB_NM = [650, 532, 450] as const

export const K = (b: Box) => Math.min(b.W, b.UH) / 700
export const tween = (t: number, at: number, len: number) => easeInOut(clamp01((t - at) / len))

export function faded(ctx: CanvasRenderingContext2D, a: number, draw: () => void) {
  if (a <= 0) return
  ctx.save()
  ctx.globalAlpha *= Math.min(1, a)
  draw()
  ctx.restore()
}

export function stars(ctx: CanvasRenderingContext2D, b: Box, idle: number, n = 50) {
  for (let i = 0; i < n; i++) {
    const a = 0.2 + 0.4 * rnd(i, 7) * (0.7 + 0.3 * Math.sin(idle * (0.8 + rnd(i, 9)) + i))
    ctx.fillStyle = `rgba(226, 232, 240, ${a})`
    ctx.fillRect(rnd(i, 5) * b.W, rnd(i, 6) * b.UH * 0.55, 1.5, 1.5)
  }
}

// ---------- 💡 the bit lamp ----------

/** one bit: a round lamp, lit warm white (on → 1) or dark (0) */
export function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, on: number, alpha = 1) {
  faded(ctx, alpha, () => {
    if (on > 0) {
      const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 2.6)
      g.addColorStop(0, `rgba(253, 230, 138, ${0.5 * on})`)
      g.addColorStop(1, 'rgba(253, 230, 138, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r * 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = LAMP_OFF
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    if (on > 0) {
      ctx.save()
      ctx.globalAlpha *= on
      ctx.fillStyle = LAMP_ON
      ctx.fill()
      ctx.restore()
    }
    ctx.strokeStyle = LAMP_RIM
    ctx.lineWidth = 1.2
    ctx.stroke()
  })
}

interface RowOpts {
  r?: number
  gap?: number
  /** alpha of the worth labels under the lamps (0 = none) */
  worths?: number
  alpha?: number
  /** each lamp's "on" (0…1); default: the bits as they are */
  on?: (i: number) => number
  /** each lamp's pop-in (0…1); default: all there */
  pop?: (i: number) => number
  /** each lamp's extra bounce (0 = none, 1 = big) — "look, this one!" */
  grow?: (i: number) => number
}

export const lampX = (cx: number, n: number, gap: number, i: number) => cx - ((n - 1) * gap) / 2 + i * gap

/** a row of bit lamps centred on (cx, y), worths 2ⁿ⁻¹ … 1 under them */
export function lampRow(ctx: CanvasRenderingContext2D, cx: number, y: number, bits: string, o: RowOpts = {}) {
  const r = o.r ?? 9
  const gap = o.gap ?? 26
  const n = bits.length
  for (let i = 0; i < n; i++) {
    const p = o.pop ? o.pop(i) : 1
    if (p <= 0) continue
    const x = lampX(cx, n, gap, i)
    const on = o.on ? o.on(i) : bits[i] === '1' ? 1 : 0
    const g = o.grow ? o.grow(i) : 0
    scaledAbout(ctx, x, y, Math.min(1.15, p) * (1 + 0.55 * g), () => lamp(ctx, x, y, r, on, (o.alpha ?? 1) * Math.min(1, p * 1.5)))
    if (g > 0.05) marker(ctx, x, y, r * 1.9, 0, Math.min(1, g))
    if (o.worths)
      faded(ctx, o.worths * (o.alpha ?? 1) * Math.min(1, p), () =>
        text(ctx, String(2 ** (n - 1 - i)), x, y + r + 11, HINT, Math.max(9, Math.min(13, gap * 0.42))),
      )
  }
  return { w: (n - 1) * gap + 2 * r, x0: lampX(cx, n, gap, 0), gap }
}

/** the amber frame round a hero row of lamps */
export function heroFrame(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number, idle: number, alpha: number) {
  faded(ctx, alpha * (0.75 + 0.25 * Math.sin(idle * 5)), () => {
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(cx - w / 2, y - h / 2, w, h, h / 2)
    ctx.stroke()
  })
}

/** a big number or digit on the canvas */
export const big = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color = BRIGHT) =>
  text(ctx, s, x, y, color, size, '700')

/** a small grey arrow from (x0, y0) to (x1, y1) */
export function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, alpha = 1) {
  faded(ctx, alpha, () => {
    const a = Math.atan2(y1 - y0, x1 - x0)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - 9 * Math.cos(a - 0.45), y1 - 9 * Math.sin(a - 0.45))
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - 9 * Math.cos(a + 0.45), y1 - 9 * Math.sin(a + 0.45))
    ctx.stroke()
  })
}

// ---------- ✋ the hand ----------

// the back of a LEFT hand, fingers little → index, the thumb on the right
// (mirror: the right hand). Hand-local units, palm centred on (0, 0).
const FINGERS = [
  { x: -42, L: 58 },
  { x: -15, L: 74 },
  { x: 12, L: 82 },
  { x: 39, L: 72 },
]
const THUMB_ANCHOR = { x: 50, y: 4 }
const thumbAngle = (up: number) => lerp(1.25, 0.55, up)
const thumbLen = (up: number) => lerp(20, 62, up)

/** draw a hand; up[i] = 0 (curled) … 1 (straight), i = little … thumb */
export function hand(ctx: CanvasRenderingContext2D, cx: number, cy: number, k: number, up: readonly number[], mirror = false, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(mirror ? -k : k, k)
    ctx.fillStyle = SKIN
    ctx.strokeStyle = SKIN_EDGE
    ctx.lineWidth = 1.5 / k
    FINGERS.forEach((f, i) => {
      const len = lerp(16, f.L, up[i])
      ctx.beginPath()
      ctx.roundRect(f.x - 12, -50 - len, 24, len + 24, 12)
      ctx.fill()
      ctx.stroke()
      if (up[i] > 0.5) {
        ctx.save()
        ctx.globalAlpha *= (up[i] - 0.5) * 2
        ctx.fillStyle = '#f6d3c3'
        ctx.beginPath()
        ctx.roundRect(f.x - 7, -50 - len + 4, 14, 14, 6)
        ctx.fill()
        ctx.restore()
      }
    })
    ctx.save()
    ctx.translate(THUMB_ANCHOR.x, THUMB_ANCHOR.y)
    ctx.rotate(thumbAngle(up[4]))
    const tl = thumbLen(up[4])
    ctx.beginPath()
    ctx.roundRect(-12, -tl, 24, tl + 16, 12)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
    ctx.beginPath()
    ctx.roundRect(-56, -56, 112, 108, 28)
    ctx.fill()
    ctx.stroke()
    // knuckle creases where a finger is curled
    ctx.strokeStyle = 'rgba(185, 135, 107, 0.7)'
    FINGERS.forEach((f, i) => {
      if (up[i] > 0.4) return
      ctx.beginPath()
      ctx.arc(f.x, -46, 8, Math.PI * 1.1, Math.PI * 1.9)
      ctx.stroke()
    })
    ctx.restore()
  })
}

/** where finger i's tip is when straight, lifted `lift` units above it */
export function fingerTop(cx: number, cy: number, k: number, i: number, mirror = false, lift = 18) {
  const s = mirror ? -1 : 1
  if (i < 4) return { x: cx + s * FINGERS[i].x * k, y: cy + (-50 - FINGERS[i].L - lift) * k }
  const a = thumbAngle(1)
  const L = thumbLen(1) + lift
  return { x: cx + s * (THUMB_ANCHOR.x + Math.sin(a) * L) * k, y: cy + (THUMB_ANCHOR.y - Math.cos(a) * L) * k }
}

// ---------- 🖼️ the drawing, ✉️ the message, 🎵 the song ----------

const inTri = (u: number, v: number, a: number[], b: number[], c: number[]) => {
  const d = (p: number[], q: number[], r: number[]) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1])
  const d1 = d([u, v], a, b)
  const d2 = d([u, v], b, c)
  const d3 = d([u, v], c, a)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}
const SUN_C = { u: 0.74, v: 0.26, r: 0.17 }
const HEAD_C = { u: 0.32, v: 0.68, r: 0.2 }
const EARS = [
  [
    [0.15, 0.6],
    [0.17, 0.4],
    [0.3, 0.5],
  ],
  [
    [0.49, 0.6],
    [0.47, 0.4],
    [0.34, 0.5],
  ],
]
const STRIPES = [0.56, 0.64, 0.72]
const inSun = (u: number, v: number) => (u - SUN_C.u) ** 2 + (v - SUN_C.v) ** 2 < SUN_C.r ** 2
const inHead = (u: number, v: number) => (u - HEAD_C.u) ** 2 + (v - HEAD_C.v) ** 2 < HEAD_C.r ** 2

/** the child's drawing as numbers: its color at (u, v) in 0…1 — the same
 *  shapes the card draws, so the camera's pixels show the real picture */
export function drawingRGB(u: number, v: number): readonly [number, number, number] {
  if (inSun(u, v)) return SUN_RGB
  if (inHead(u, v)) return STRIPES.some((s) => Math.abs(v - s) < 0.022) ? [51, 65, 85] : [100, 116, 139]
  if (EARS.some((e) => inTri(u, v, e[0], e[1], e[2]))) return [100, 116, 139]
  return [241, 245, 249]
}
export const rgbCss = (c: readonly number[], a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`

/** the drawing: a cat under a yellow sun, on paper, centred on (x, y) */
export function drawingCard(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 1, rot = 0) {
  faded(ctx, alpha, () => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.translate(-s / 2, -s / 2)
    ctx.fillStyle = PAPER
    ctx.beginPath()
    ctx.roundRect(0, 0, s, s, s * 0.04)
    ctx.fill()
    ctx.fillStyle = SUN
    ctx.beginPath()
    ctx.arc(SUN_C.u * s, SUN_C.v * s, SUN_C.r * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = CAT
    for (const e of EARS) {
      ctx.beginPath()
      ctx.moveTo(e[0][0] * s, e[0][1] * s)
      ctx.lineTo(e[1][0] * s, e[1][1] * s)
      ctx.lineTo(e[2][0] * s, e[2][1] * s)
      ctx.closePath()
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(HEAD_C.u * s, HEAD_C.v * s, HEAD_C.r * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.clip()
    ctx.fillStyle = STRIPE
    for (const v of STRIPES) ctx.fillRect(0, (v - 0.022) * s, s, 0.044 * s)
    ctx.restore()
    ctx.restore()
  })
}

/** the message: a speech bubble saying HI */
export function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, alpha = 1, letters = 1, tail: -1 | 0 | 1 = -1, msg = MESSAGE) {
  faded(ctx, alpha, () => {
    const h = w * 0.56
    ctx.fillStyle = PAPER
    ctx.beginPath()
    ctx.roundRect(x - w / 2, y - h / 2, w, h, h * 0.35)
    ctx.fill()
    if (tail) {
      ctx.beginPath()
      ctx.moveTo(x + tail * w * 0.18, y + h / 2 - 2)
      ctx.lineTo(x + tail * w * 0.36, y + h / 2 + h * 0.35)
      ctx.lineTo(x + tail * w * 0.02, y + h / 2 - 2)
      ctx.fill()
    }
    faded(ctx, letters, () => text(ctx, msg, x, y + 1, '#0f172a', h * (msg.length > 2 ? 0.48 : 0.55), '800'))
  })
}

/** music notes rising from (x, y) on the idle clock */
export function notes(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, idle: number, alpha = 1) {
  faded(ctx, alpha, () => {
    for (let i = 0; i < 4; i++) {
      const q = (idle * 0.45 + i / 4) % 1
      faded(ctx, Math.sin(q * Math.PI), () =>
        text(ctx, i % 2 ? '♫' : '♪', x + (14 + 30 * q + 8 * Math.sin(idle * 2 + i)) * k, y - 70 * q * k, NOTE, 22 * k, '700'),
      )
    }
  })
}

/** a child, a simple silhouette facing right, feet at (x, y) */
export function child(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#334a6b'
    ctx.beginPath()
    ctx.roundRect(x - 18 * k, y - 78 * k, 36 * k, 50 * k, 12 * k)
    ctx.fill()
    ctx.fillRect(x - 14 * k, y - 32 * k, 11 * k, 32 * k)
    ctx.fillRect(x + 3 * k, y - 32 * k, 11 * k, 32 * k)
    ctx.fillStyle = SKIN
    ctx.beginPath()
    ctx.arc(x + 2 * k, y - 98 * k, 19 * k, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#5b3a29'
    ctx.beginPath()
    ctx.arc(x - 2 * k, y - 104 * k, 18 * k, Math.PI * 0.95, Math.PI * 1.95)
    ctx.fill()
    // an open, singing mouth
    ctx.fillStyle = '#7f1d1d'
    ctx.beginPath()
    ctx.ellipse(x + 17 * k, y - 92 * k, 3 * k, 4 * k, 0, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** Grandma's house, its base centred on (x, y) */
export function house(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#475569'
    ctx.fillRect(x - 46 * k, y - 62 * k, 92 * k, 62 * k)
    ctx.fillStyle = '#7c2d12'
    ctx.beginPath()
    ctx.moveTo(x - 58 * k, y - 60 * k)
    ctx.lineTo(x, y - 108 * k)
    ctx.lineTo(x + 58 * k, y - 60 * k)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(x - 30 * k, y - 46 * k, 22 * k, 20 * k)
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(x + 10 * k, y - 40 * k, 20 * k, 40 * k)
  })
}

/** the world of the first and last beat: our shore, the sea, Grandma's */
function world(ctx: CanvasRenderingContext2D, b: Box, idle: number) {
  backdrop(ctx, b)
  stars(ctx, b, idle)
  const gy = b.UH * 0.78
  const s0 = b.W * 0.4
  const s1 = b.W * 0.7
  // the sea, gently moving
  ctx.fillStyle = '#0c3b5c'
  ctx.fillRect(s0 - 20, gy + 6, s1 - s0 + 40, b.UH - gy)
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = s0 - 20; x <= s1 + 20; x += 6) {
    const y = gy + 8 + Math.sin(x / 22 + idle * 1.6) * 3
    if (x === s0 - 20) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  // the two shores
  ctx.fillStyle = '#16233a'
  ctx.beginPath()
  ctx.moveTo(0, gy)
  ctx.lineTo(s0, gy)
  ctx.quadraticCurveTo(s0 + 30, gy + 30, s0 + 10, b.UH)
  ctx.lineTo(0, b.UH)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(b.W, gy)
  ctx.lineTo(s1, gy)
  ctx.quadraticCurveTo(s1 - 30, gy + 30, s1 - 10, b.UH)
  ctx.lineTo(b.W, b.UH)
  ctx.closePath()
  ctx.fill()
  return { gy, house: { x: b.W * 0.85, y: gy } }
}

/** where the three things sit on our shore */
function things(b: Box) {
  const k = K(b)
  const gy = b.UH * 0.78
  return {
    child: { x: b.W * 0.22, y: gy },
    mouth: { x: b.W * 0.22 + 18 * k, y: gy - 94 * k },
    drawing: { x: b.W * 0.09, y: b.UH * 0.5, s: 92 * k },
    bubble: { x: b.W * 0.32, y: b.UH * 0.42, w: 86 * k },
  }
}

// ---------- ❓ the question ----------

function drawQuestion(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const k = K(b)
  const w = world(ctx, b, idle)
  const th = things(b)
  // "Grandma lives far away, across the sea." — her house bounces
  const hn = bounce(sinceLaunch('dq:house', t, 2.35, idle), 0.4, 1.6, 0.45)
  scaledAbout(ctx, w.house.x, w.house.y, 1 + 0.15 * hn, () => house(ctx, w.house.x, w.house.y, k))
  // "Here's a boy. He wants to send Grandma a drawing, a message and a
  // song." — each bounces as it is named (the idle clock: while the voice
  // speaks)
  const said = sinceLaunch('dq:named', t, 0, idle)
  const cn = bounce(said, 0.4, 0.8, 0.4)
  const dn = bounce(said - 2.0, 0.4, 0.8, 0.4)
  const bn = bounce(said - 2.7, 0.4, 0.8, 0.4)
  const sn = bounce(said - 3.3, 0.4, 0.9, 0.4)
  // the event of piece 2: the paper flutters up toward the sea and falls back
  const fl = sinceLaunch('dq:flutter', t, 2.6, idle)
  const q = clamp01(fl / 2.1)
  const lift = fl >= 0 ? Math.sin(q * Math.PI) : 0
  const dx = th.drawing.x + lift * 120 * k
  const dy = th.drawing.y - lift * 70 * k + (fl >= 0 ? Math.sin(q * Math.PI * 2) * 12 * k : 0)
  const rot = fl >= 0 ? Math.sin(fl * 7) * 0.3 * lift : 0
  scaledAbout(ctx, th.bubble.x, th.bubble.y, 1 + 0.15 * bn, () => bubble(ctx, th.bubble.x, th.bubble.y, th.bubble.w))
  scaledAbout(ctx, dx, dy, 1 + 0.15 * dn, () => drawingCard(ctx, dx, dy, th.drawing.s, 1, rot))
  scaledAbout(ctx, th.child.x, th.child.y - 60 * k, 1 + 0.12 * cn, () => child(ctx, th.child.x, th.child.y, k))
  notes(ctx, th.mouth.x, th.mouth.y, k, idle, 0.6 + 0.4 * Math.min(1, sn + 0.5))
  // the event of piece 3: all three stream over the sea as glowing bits,
  // and arrive at Grandma's in a second
  const go = sinceLaunch('dq:go', t, 5.1, idle)
  if (go >= 0) bitStream(ctx, b, [th.drawing, th.bubble, { x: th.mouth.x, y: th.mouth.y }], w.house, go, idle, k)
  // "How can such different things travel the same way?"
  const ask = bounce(sinceLaunch('dq:ask', t, 6.2, idle), 0.4, 999, 0.1)
  if (ask > 0)
    scaledAbout(ctx, b.W * 0.55, b.UH * 0.2, Math.min(1.15, ask) * (1 + 0.04 * Math.sin(idle * 3)), () =>
      big(ctx, '?', b.W * 0.55, b.UH * 0.2, 90 * k, AMBER_SOFT),
    )
}

/** glowing bits flying in arcs from the three things to Grandma's house;
 *  `go` = seconds since they set off. Copies of the three pop up there. */
export function bitStream(
  ctx: CanvasRenderingContext2D,
  b: Box,
  from: Array<{ x: number; y: number }>,
  to: { x: number; y: number },
  go: number,
  idle: number,
  k: number,
  kinds = false,
  /** seconds of sending: no new bit sets off after it (default: forever) */
  sendFor = Infinity,
) {
  const end = { x: to.x, y: to.y - 130 * k }
  from.forEach((f, i) => {
    const since = go - i * 0.2
    for (let j = Math.max(0, Math.floor((since - 1.1) / 0.11)); j <= Math.floor(since / 0.11); j++) {
      const s = since - j * 0.11
      if (s < 0 || s > 1.1 || j * 0.11 > sendFor) continue
      const p = Math.min(1, s / 1.1)
      const x = lerp(f.x, end.x, p)
      const y = lerp(f.y, end.y, p) - Math.sin(p * Math.PI) * b.UH * 0.22
      if (kinds && j % 2) {
        // a wave packet: the same bits, carried as a wave
        ctx.save()
        ctx.strokeStyle = 'rgba(165, 180, 252, 0.9)'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let d = -10; d <= 10; d += 2) {
          const yy = y + Math.sin(d / 3 + idle * 10) * 4 * Math.exp(-((d / 8) ** 2))
          if (d === -10) ctx.moveTo(x + d, yy)
          else ctx.lineTo(x + d, yy)
        }
        ctx.stroke()
        ctx.restore()
      } else lamp(ctx, x, y, 4.5, (i + j) % 3 === 0 ? 0.25 : 1)
    }
  })
  // they arrive: the three things again, small, above Grandma's roof
  const arrived = go - 1.1
  if (arrived > 0) {
    const a = Math.min(1, arrived * 2.5)
    const pop = Math.min(1.1, bounce(arrived, 0.35, 999, 0.1))
    scaledAbout(ctx, end.x, end.y, pop, () => {
      drawingCard(ctx, end.x - 46 * k, end.y, 40 * k, a)
      bubble(ctx, end.x + 2 * k, end.y - 6 * k, 40 * k, a, 1, 0)
      faded(ctx, a, () => text(ctx, '♪', end.x + 46 * k, end.y, NOTE, 26 * k, '700'))
    })
  }
}

// ---------- ✋ fingers ----------

/** ten fingers rising one after another: the count so far (0…10) at
 *  story time t, starting at `at`, `step` s apart */
const counted = (t: number, at: number, step: number) => clamp01((t - at) / step)

function twoHands(b: Box) {
  const k = K(b) * 1.05
  return { k, left: { x: b.W * 0.34, y: b.UH * 0.55 }, right: { x: b.W * 0.66, y: b.UH * 0.55 } }
}

/** the ten fingers in counting order, left to right across both hands:
 *  left little … left thumb, right thumb … right little */
const TEN = [
  ...[0, 1, 2, 3, 4].map((i) => ({ hand: 0, i })),
  ...[4, 3, 2, 1, 0].map((i) => ({ hand: 1, i })),
]

function drawFingers(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = twoHands(b)
  // piece 1, "Digit … means finger": one hand, its pointing finger up and
  // ringed; then it slides to its place and the second hand comes
  const slide = tween(t, 0.2, 1.4)
  const lx = lerp(b.W / 2, g.left.x, slide)
  const named = bounce(sinceLaunch('df:hand', t, 0, idle), 0.4, 1.4, 0.45)
  const upL = [0, 0, 0, 0, 0]
  const upR = [0, 0, 0, 0, 0]
  // the pointing finger, until the counting starts
  const point = 1 - tween(t, 2.6, 0.3)
  upL[3] = point
  // piece 2, "People counted on their ten fingers.": one by one
  TEN.forEach((f, n) => {
    const u = counted(t, 2.7 + n * 0.19, 0.18)
    if (f.hand === 0) upL[f.i] = Math.max(upL[f.i], u)
    else upR[f.i] = u
  })
  scaledAbout(ctx, lx, g.left.y, 1 + 0.08 * named, () => hand(ctx, lx, g.left.y, g.k, upL))
  hand(ctx, g.right.x, g.right.y, g.k, upR, true, tween(t, 1.0, 1.0))
  if (point > 0.05) {
    const tip = fingerTop(lx, g.left.y, g.k, 3, false, 0)
    marker(ctx, tip.x, tip.y + 10 * g.k, 20 * g.k, idle, point)
  }
  // the count above
  const n = TEN.reduce((s, _, i) => s + (t >= 2.7 + i * 0.19 + 0.12 ? 1 : 0), 0)
  if (n > 0) faded(ctx, 1 - tween(t, 7.6, 0.6), () => big(ctx, String(n), b.W / 2, b.UH * 0.12, 54 * K(b)))
  // piece 3, "… ten digits, from zero to nine.": one digit for each
  // finger, left to right — the finger it belongs to blinks amber
  TEN.forEach((f, d) => {
    const pop = bounce(sinceLaunch(`df:d${d}`, t, 5.1 + d * 0.2, idle), 0.3, 999, 0.1)
    if (pop <= 0) return
    const h = f.hand === 0 ? g.left : g.right
    const top = fingerTop(h.x, h.y, g.k, f.i, f.hand === 1, -6)
    const blink = bounce(sinceLaunch(`df:b${d}`, t, 5.1 + d * 0.2, idle), 0.15, 0.25, 0.3)
    if (blink > 0) marker(ctx, top.x, top.y, 15 * g.k, idle, Math.min(1, blink))
    const x = b.W / 2 + (d - 4.5) * 56 * g.k
    const y = b.UH * 0.84
    scaledAbout(ctx, x, y, Math.min(1.15, pop), () => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
      ctx.beginPath()
      ctx.roundRect(x - 22 * g.k, y - 26 * g.k, 44 * g.k, 52 * g.k, 9)
      ctx.fill()
      big(ctx, String(d), x, y + 1, 34 * g.k)
    })
  })
  // piece 4, "Digital means turned into digits. Into numbers.": the three
  // things come and turn into rows of digits
  const k = K(b)
  const row = [
    { x: b.W * 0.2, s: `${SUN_RGB.join(' ')}` },
    { x: b.W * 0.5, s: [...MESSAGE].map(asciiCode).join(' ') },
    { x: b.W * 0.8, s: String(HERO_SAMPLE) },
  ]
  row.forEach((r, i) => {
    const at = 7.6 + i * 0.5
    const into = tween(t, at, 0.5)
    if (into <= 0) return
    const y = lerp(-60 * k, b.UH * 0.13, into)
    const turn = tween(t, at + 0.7, 0.5)
    if (i === 0) drawingCard(ctx, r.x, y, 64 * k, 1 - turn)
    else if (i === 1) bubble(ctx, r.x, y, 70 * k, 1 - turn, 1, 0)
    else faded(ctx, 1 - turn, () => text(ctx, '♪ ♫', r.x, y, NOTE, 34 * k, '700'))
    faded(ctx, turn, () => big(ctx, r.s, r.x, y, 26 * k, AMBER_SOFT))
  })
}

// ---------- 1️⃣0️⃣ bits ----------

function oneHand(b: Box) {
  return { x: b.W * 0.46, y: b.UH * 0.6, k: K(b) * 1.5 }
}

function drawBits(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // piece 1, "… only two digits. One and zero.": the digits 2–9 drop
  // away; 1 and 0 stay and grow
  const drop = tween(t, 0.2, 1.0)
  const gather = tween(t, 1.0, 1.0)
  // piece 5 on: the 1 and the 0, with their lamps, move to the corner
  const corner = tween(t, 10.1, 0.8)
  const pos1 = { x: lerp(b.W * 0.36, b.W * 0.1, corner), y: lerp(b.UH * 0.28, b.UH * 0.1, corner) }
  const pos0 = { x: lerp(b.W * 0.64, b.W * 0.22, corner), y: pos1.y }
  const size = lerp(lerp(34, 90, gather), 34, corner) * k
  // pieces 2 and 3 bind each digit to its lamp: while "The one means on"
  // is said, the 1 glows and a SHINING lamp pops in under it; while "The
  // zero means off" is said, the 0 and a DARK lamp under it (Elena,
  // 2026-11-22: establish the logical binding)
  const glow1 = bounce(sinceLaunch('db:g1', t, 2.35, idle), 0.35, 2.4, 0.5)
  const glow0 = bounce(sinceLaunch('db:g0', t, 4.85, idle), 0.35, 2.4, 0.5)
  for (let d = 0; d <= 9; d++) {
    // where the fingers beat left the digits: one row along the bottom
    const x0 = b.W / 2 + (d - 4.5) * 56 * k * 1.05
    const y0 = b.UH * 0.84
    if (d >= 2) {
      faded(ctx, 1 - drop, () => big(ctx, String(d), x0, y0 + drop * 80 * k, 34 * k))
      continue
    }
    const to = d === 1 ? pos1 : pos0
    const x = lerp(x0, to.x, gather)
    const y = lerp(y0, to.y, gather)
    const g = d === 1 ? glow1 : glow0
    scaledAbout(ctx, x, y, 1 + 0.18 * g, () => big(ctx, String(d), x, y, gather === 0 ? 34 * k : size, g > 0.3 ? AMBER_SOFT : BRIGHT))
  }
  const lr = lerp(30, 11, corner) * k
  const ly = (y: number) => y + lerp(110, 40, corner) * k
  // piece 4, "Each of them is called a bit.": both lamps bounce together
  const named = bounce(sinceLaunch('db:bit', t, 7.35, idle), 0.4, 1.8, 0.45)
  const lamps: Array<[{ x: number; y: number }, number, string, number]> = [
    [pos1, 1, 'db:l1', glow1],
    [pos0, 0, 'db:l0', glow0],
  ]
  for (const [pos, on, key, g] of lamps) {
    const pop = bounce(sinceLaunch(key, t, on ? 2.35 : 4.85, idle), 0.35, 999, 0.1)
    if (pop <= 0) continue
    const y = ly(pos.y)
    // the link: digit → its lamp
    arrow(ctx, pos.x, pos.y + size * 0.45, pos.x, y - lr - 8 * k, Math.min(1, pop) * (1 - corner))
    // on: the shining lamp breathes in the watch break after it is said
    const breathe = on ? 0.92 + 0.08 * Math.sin(idle * 4) : 0
    scaledAbout(ctx, pos.x, y, Math.min(1.15, pop) * (1 + 0.12 * g + 0.2 * named), () => lamp(ctx, pos.x, y, lr, on ? breathe : 0))
    if (g > 0) marker(ctx, pos.x, y, lr + 12 * k, idle, Math.min(1, g))
  }
  if (named > 0) {
    marker(ctx, pos1.x, ly(pos1.y), lr + 12 * k, idle, Math.min(1, named))
    marker(ctx, pos0.x, ly(pos0.y), lr + 12 * k, idle, Math.min(1, named))
  }
  // piece 5, "… count on one hand. Each finger is worth double …": a hand,
  // fingers curled; the worths pop in from the thumb: 1, 2, 4, 8, 16
  const h = oneHand(b)
  const handIn = tween(t, 10.2, 0.6)
  // piece 6: thumb up (1); thumb + pointer (3) · piece 7: all five (31).
  // Never the middle finger alone (a rude sign).
  const up = [0, 0, 0, 0, 0]
  up[4] = tween(t, 12.7, 0.4)
  up[3] = tween(t, 13.9, 0.4)
  for (const i of [0, 1, 2]) up[i] = tween(t, 15.2, 0.4)
  hand(ctx, h.x, h.y, h.k, up, false, handIn)
  const lampsY = h.y + 84 * h.k
  const lampGap = 40 * k
  for (let i = 0; i < 5; i++) {
    const worthAt = 10.5 + (4 - i) * 0.35 // thumb first
    const pop = bounce(sinceLaunch(`db:w${i}`, t, worthAt, idle), 0.3, 999, 0.1)
    if (pop <= 0) continue
    const top = fingerTop(h.x, h.y, h.k, i)
    scaledAbout(ctx, top.x, top.y, Math.min(1.15, pop), () => {
      ctx.fillStyle = up[i] > 0.5 ? 'rgba(251, 191, 36, 0.25)' : 'rgba(30, 41, 59, 0.85)'
      ctx.beginPath()
      ctx.arc(top.x, top.y, 19 * k, 0, Math.PI * 2)
      ctx.fill()
      big(ctx, String(2 ** (4 - i)), top.x, top.y + 1, 22 * k, up[i] > 0.5 ? AMBER_SOFT : BRIGHT)
    })
    // the matching lamp under the hand: a finger up = on
    const x = lampX(h.x, 5, lampGap, i)
    lamp(ctx, x, lampsY, 11 * k, up[i], Math.min(1, pop))
  }
  // the hand's number
  const val = handValue(up.map((u) => u > 0.5))
  if (t > 12.9) {
    const pulse = bounce(sinceLaunch(`db:v${val}`, t, 0, idle), 0.3, 999, 0.1)
    scaledAbout(ctx, b.W * 0.84, h.y, Math.min(1.15, 0.85 + 0.3 * Math.min(1, pulse)), () => big(ctx, String(val), b.W * 0.84, h.y, 60 * k, AMBER_SOFT))
  }
  // "… eight bits count all the way to two hundred fifty five."
  const rowIn = tween(t, 15.9, 0.5)
  if (rowIn > 0) {
    const y = b.UH * 0.92
    const cx = b.W * 0.44
    lampRow(ctx, cx, y - 8, '11111111', {
      r: 9 * k,
      gap: 34 * k,
      worths: rowIn,
      alpha: rowIn,
      on: (i) => tween(t, 16.1 + i * 0.1, 0.15),
    })
    faded(ctx, tween(t, 17.0, 0.2), () => big(ctx, '255', b.W * 0.86, y - 8, 34 * k, AMBER_SOFT))
  }
}

// ---------- ✉️ the message ----------

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface TableOpts {
  alpha?: number
  /** how much of the table has slid in, left to right (0…1) */
  reveal?: number
  /** letters to light amber, how strongly */
  hi?: Partial<Record<string, number>>
  from?: string
  to?: string
}

/** the code table: letters above, their numbers below (ASCII: A = 65) */
export function codeTable(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, o: TableOpts = {}) {
  const from = LETTERS.indexOf(o.from ?? 'A')
  const to = LETTERS.indexOf(o.to ?? 'Z')
  const n = to - from + 1
  const cw = w / n
  const ch = Math.min(34, cw * 1.15)
  const x0 = cx - w / 2
  const cell = (L: string) => {
    const i = LETTERS.indexOf(L) - from
    return { x: x0 + (i + 0.5) * cw, top: y - ch, mid: y, bot: y + ch, w: cw, h: ch }
  }
  faded(ctx, o.alpha ?? 1, () => {
    for (let i = 0; i < n; i++) {
      const L = LETTERS[from + i]
      const r = clamp01(((o.reveal ?? 1) * (n + 4) - i) / 4)
      if (r <= 0) continue
      const x = x0 + i * cw
      faded(ctx, r, () => {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)'
        ctx.fillRect(x + 1, y - ch + 1, cw - 2, ch * 2 - 2)
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.8)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 1, y - ch + 1, cw - 2, ch * 2 - 2)
        ctx.beginPath()
        ctx.moveTo(x + 3, y)
        ctx.lineTo(x + cw - 3, y)
        ctx.stroke()
        const hi = o.hi?.[L] ?? 0
        if (hi > 0) {
          faded(ctx, hi, () => {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.22)'
            ctx.fillRect(x + 1, y - ch + 1, cw - 2, ch * 2 - 2)
            ctx.strokeStyle = AMBER
            ctx.lineWidth = 2.5
            ctx.strokeRect(x + 1, y - ch + 1, cw - 2, ch * 2 - 2)
          })
        }
        text(ctx, L, x + cw / 2, y - ch / 2, BRIGHT, Math.min(18, cw * 0.62), '700')
        text(ctx, String(asciiCode(L)), x + cw / 2, y + ch / 2, hi > 0.5 ? AMBER_SOFT : HINT, Math.min(13, cw * 0.44), '600')
      })
    }
  })
  return cell
}

/** the letters' rows of lamps (shared by the message and decode beats) */
function msgGeo(b: Box) {
  const k = K(b)
  return {
    k,
    bubble: { x: b.W * 0.5, y: b.UH * 0.11, w: 110 * k },
    letters: [
      { x: b.W * 0.42, y: b.UH * 0.27 },
      { x: b.W * 0.58, y: b.UH * 0.27 },
    ],
    tableY: b.UH * 0.45,
    tableW: b.W * 0.94,
    rows: [b.UH * 0.68, b.UH * 0.86].map((y) => ({ y, numX: b.W * 0.17, letterX: b.W * 0.07, lampsX: b.W * 0.6 })),
    gap: 36 * k,
    r: 11 * k,
  }
}

function drawMessage(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = msgGeo(b)
  const k = g.k
  // piece 1: the bubble bounces as the message is named, then H and I drop out
  const named = bounce(sinceLaunch('dm:named', t, 0, idle), 0.4, 1.4, 0.45)
  scaledAbout(ctx, g.bubble.x, g.bubble.y, 1 + 0.12 * named, () => bubble(ctx, g.bubble.x, g.bubble.y, g.bubble.w, 1, 1, 0))
  // piece 2: the code table slides in
  const reveal = tween(t, 2.6, 1.8)
  const hiH = tween(t, 5.6, 0.3)
  const hiI = tween(t, 10.6, 0.3)
  const cell = codeTable(ctx, b.W / 2, g.tableY, g.tableW, { reveal, alpha: reveal > 0 ? 1 : 0, hi: { H: hiH, I: hiI } })
  MESSAGE.split('').forEach((L, i) => {
    const out = tween(t, 0.3 + i * 0.4, 0.7)
    const start = g.letters[i]
    // pieces 3 / 5: the letter flies into its cell, then out to its row
    const at = i === 0 ? 5.1 : 10.1
    const into = tween(t, at, 0.5)
    const c = cell(L)
    const row = g.rows[i]
    const down = tween(t, at + 0.9, 0.6)
    let x = lerp(lerp(g.bubble.x + (i - 0.5) * 30 * k, start.x, out), c.x, into)
    let y = lerp(lerp(g.bubble.y, start.y, out), c.top + c.h / 2, into)
    let size = lerp(lerp(24, 54, out), 18, into) * k
    if (down > 0) {
      x = lerp(c.x, row.letterX, down)
      y = lerp(c.top + c.h / 2, row.y, down)
      size = lerp(18, 34, down) * k
    }
    if (out > 0) big(ctx, L, x, y, size, into > 0 && down === 0 ? AMBER_SOFT : BRIGHT)
    // the number leaves the cell for the row, beside the letter
    if (down > 0) {
      const nx = lerp(c.x, row.numX, down)
      const ny = lerp(c.mid + c.h / 2, row.y, down)
      big(ctx, String(asciiCode(L)), nx, ny, lerp(13, 30, down) * k, AMBER_SOFT)
      arrow(ctx, row.letterX + 18 * k, row.y, row.numX - 26 * k, row.y, down)
    }
    // pieces 4 / 5: the row of lamps; the worths that add up light up
    const rowAt = i === 0 ? 7.6 : 11.1
    const rowIn = tween(t, rowAt, 0.5)
    if (rowIn > 0) {
      const bits = toBits(asciiCode(L))
      const lit = litWorths(bits)
      lampRow(ctx, row.lampsX, row.y, bits, {
        r: g.r,
        gap: g.gap,
        worths: rowIn,
        alpha: rowIn,
        on: (j) => {
          const w = 2 ** (7 - j)
          const n = lit.indexOf(w)
          return n < 0 ? 0 : tween(t, (i === 0 ? 8.2 : 11.3) + n * (i === 0 ? 0.7 : 0.3), 0.25)
        },
      })
      arrow(ctx, row.numX + 30 * k, row.y, row.lampsX - 4.2 * g.gap, row.y, rowIn)
      if (i === 0) heroFrame(ctx, row.lampsX, row.y + 6 * k, 8 * g.gap + 16 * k, 2 * g.r + 34 * k, idle, tween(t, 9.4, 0.4))
    }
  })
}

// ---------- 🔁 decode at Grandma's ----------

function tablet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 14)
  ctx.fill()
  ctx.fillStyle = '#0b1226'
  ctx.beginPath()
  ctx.roundRect(x - w / 2 + 10, y - h / 2 + 10, w - 20, h - 20, 8)
  ctx.fill()
}

function drawDecode(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = msgGeo(b)
  const k = g.k
  const tab = { x: b.W * 0.78, y: b.UH * 0.17, w: 190 * k, h: 120 * k }
  tablet(ctx, tab.x, tab.y, tab.w, tab.h)
  house(ctx, tab.x - tab.w / 2 - 70 * k, tab.y + tab.h / 2, k * 0.7)
  // piece 3: the table splits in two — ours and Grandma's, the same
  const split = tween(t, 5.1, 0.8)
  const tableW = lerp(g.tableW, b.W * 0.4, split)
  const gx = lerp(b.W / 2, b.W * 0.75, split)
  const hiH = tween(t, 3.6, 0.3)
  const hiI = tween(t, 4.1, 0.3)
  const from = split > 0.5 ? 'E' : 'A'
  const to = split > 0.5 ? 'L' : 'Z'
  const cell = codeTable(ctx, gx, b.UH * 0.88, tableW, { hi: { H: hiH, I: hiI }, from, to, alpha: split > 0.4 && split < 0.6 ? 0.4 : 1 })
  if (split > 0.5) {
    const a = (split - 0.5) * 2
    codeTable(ctx, b.W * 0.25, b.UH * 0.88, b.W * 0.4, { hi: { H: a, I: a }, from, to, alpha: a })
    faded(ctx, a, () => {
      big(ctx, '=', b.W / 2, b.UH * 0.88, 40 * k, AMBER_SOFT)
      house(ctx, b.W * 0.25, b.UH * 0.88 - 52 * k, k * 0.45)
      house(ctx, b.W * 0.75, b.UH * 0.88 - 52 * k, k * 0.45)
    })
    marker(ctx, b.W / 2, b.UH * 0.88, 30 * k, idle, a)
  }
  MESSAGE.split('').forEach((L, i) => {
    const bits = toBits(asciiCode(L))
    const lit = litWorths(bits)
    // piece 1: the rows arrive from the left; the lit lamps' worths pop up
    const arrive = tween(t, 0.2 + i * 0.3, 1.1)
    const y = b.UH * (0.42 + 0.17 * i)
    const cx = lerp(-b.W * 0.3, b.W * 0.55, arrive)
    lampRow(ctx, cx, y, bits, { r: g.r, gap: g.gap, worths: 0 })
    const add = tween(t, 2.7 + i * 1.0, 0.6) // piece 2: they add up
    const sumX = b.W * 0.12
    lit.forEach((w, n) => {
      const pop = bounce(sinceLaunch(`dd:w${i}${n}`, t, 1.5 + n * 0.2, idle), 0.3, 999, 0.1)
      if (pop <= 0) return
      const j = 7 - Math.log2(w)
      const x0 = lampX(cx, 8, g.gap, j)
      const x = lerp(x0, sumX, add)
      const yy = lerp(y - 30 * k, y, add)
      faded(ctx, 1 - add, () => big(ctx, String(w), x, yy, 17 * k, AMBER_SOFT))
    })
    const sum = lit.reduce((a, w) => a + w, 0)
    faded(ctx, add, () => big(ctx, String(sum), sumX, y, 30 * k, AMBER_SOFT))
    // … the same table: the number finds its letter, and the letter flies
    // up onto Grandma's tablet
    const look = tween(t, 3.4 + i * 1.0, 0.3)
    const c = cell(L)
    if (look > 0 && split < 0.5) arrow(ctx, sumX + 26 * k, y, c.x, c.mid + c.h / 2 - 14 * k, look * (1 - split * 2))
    const fly = tween(t, 3.7 + i * 1.0, 0.7)
    if (fly > 0) {
      const sx = split < 0.5 ? c.x : tab.x
      const sy = split < 0.5 ? c.top + c.h / 2 : tab.y
      const x = lerp(sx, tab.x + (i - 0.5) * 50 * k, fly)
      const yy = lerp(sy, tab.y, fly)
      big(ctx, L, x, yy, lerp(18, 54, fly) * k, fly < 1 ? AMBER_SOFT : BRIGHT)
    }
  })
}

// ---------- 📷 the photo: inside the camera ----------

const CUPS = 12
/** Bayer pattern: which color hat cup (i, j) wears — 0 red, 1 green, 2 blue */
const hatOf = (i: number, j: number) => (j % 2 === 0 ? (i % 2 === 0 ? 0 : 1) : i % 2 === 0 ? 1 : 2)
const HERO_CUP = { i: 9, j: 2 }

function photoGeo(b: Box) {
  const G = Math.min(b.W * 0.52, b.UH * 0.62)
  return { G, c: G / CUPS, x: b.W * 0.34, y: b.UH * 0.48 }
}

/** the electrons a cup collects: four for full light of its color */
const electronsIn = (i: number, j: number) => Math.round((4 * drawingRGB((i + 0.5) / CUPS, (j + 0.5) / CUPS)[hatOf(i, j)]) / 255)

function phoneFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
  faded(ctx, alpha, () => {
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 22)
    ctx.stroke()
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(x, y - h / 2 + 2, 4, 0, Math.PI * 2)
    ctx.fill()
  })
}

function drawPhoto(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const g = photoGeo(b)
  // piece 1: the phone frames the drawing, a flash, then the camera dives in
  const zoom = tween(t, 1.4, 1.0)
  if (zoom < 1) {
    const s = lerp(g.G * 0.8, g.G * 2.4, zoom)
    faded(ctx, 1 - zoom, () => {
      drawingCard(ctx, b.W / 2, b.UH * 0.48, s)
      const frame = tween(t, 0.1, 0.8)
      phoneFrame(ctx, b.W / 2, lerp(b.UH * 1.4, b.UH * 0.48, frame), s * 0.8, s * 1.15, frame)
      const flash = Math.max(0, 1 - Math.abs(t - 1.15) / 0.18)
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * flash})`
        ctx.fillRect(0, 0, b.W, b.UH)
      }
    })
  }
  if (zoom <= 0) return
  const x0 = g.x - g.G / 2
  const y0 = g.y - g.G / 2
  // piece 4's event: the cups become pixels
  const toPixel = (i: number) => tween(t, 7.6 + i * 0.08, 0.5)
  faded(ctx, zoom, () => {
    // the picture the lens throws onto the chip, faint
    faded(ctx, 0.22 * (1 - toPixel(0)), () => drawingCard(ctx, g.x, g.y, g.G))
    const named = bounce(sinceLaunch('dp:cups', t, 2.35, idle), 0.4, 1.6, 0.45)
    scaledAbout(ctx, g.x, g.y, 1 + 0.04 * named, () => {
      for (let j = 0; j < CUPS; j++)
        for (let i = 0; i < CUPS; i++) {
          const x = x0 + i * g.c
          const y = y0 + j * g.c
          const px = toPixel(i)
          // the cup
          faded(ctx, 1 - px, () => {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)'
            ctx.fillRect(x + 2, y + 2, g.c - 4, g.c - 4)
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
            ctx.lineWidth = 1
            ctx.strokeRect(x + 2, y + 2, g.c - 4, g.c - 4)
            // piece 2's event: the glass hats drop on, a diagonal sweep
            const hat = tween(t, 2.6 + (i + j) * 0.1, 0.3)
            if (hat > 0) {
              ctx.fillStyle = RGB_CSS[hatOf(i, j)]
              ctx.globalAlpha *= 0.85 * hat
              ctx.fillRect(x + 3, y + 3 - (1 - hat) * 10, g.c - 6, g.c * 0.24)
            }
          })
          // piece 3's event: photons of the hat's color fall in, each
          // knocks one electron loose, which stays in the cup
          const n = electronsIn(i, j)
          for (let e = 0; e < n; e++) {
            const at = 5.1 + rnd(i * 13 + j, 3) * 1.1 + e * 0.22
            const since = sinceLaunch(`dp:ph${i}.${j}.${e}`, t, at, idle)
            if (since < 0) continue
            const drop = 70
            const fly = since * PHOTON_SPEED * 1.4
            const ex = x + g.c * (0.3 + 0.4 * (e % 2))
            const ey = y + g.c * (0.5 + 0.22 * Math.floor(e / 2))
            if (fly < drop) packet(ctx, ex, ey - drop + fly, Math.PI / 2, RGB_NM[hatOf(i, j)], idle, 0.9 * (1 - px), 20)
            else
              faded(ctx, 1 - px, () =>
                blit(ctx, electronSprite(true), ex + Math.sin(idle * 3 + e + i) * 1.2, ey + Math.cos(idle * 2.6 + j) * 1.2),
              )
          }
          // the pixel it becomes
          if (px > 0) {
            ctx.fillStyle = rgbCss(drawingRGB((i + 0.5) / CUPS, (j + 0.5) / CUPS), px)
            ctx.fillRect(x + 0.5, y + 0.5, g.c - 1, g.c - 1)
          }
        }
    })
  })
  // "This is a pixel." — the sun's pixel gets the hero ring
  const hx = x0 + (HERO_CUP.i + 0.5) * g.c
  const hy = y0 + (HERO_CUP.j + 0.5) * g.c
  const ring = tween(t, 8.9, 0.4)
  // piece 5: it slides out, big; its three numbers; their lamps
  const out = tween(t, 10.1, 0.7)
  const big3 = { x: b.W * 0.8, y: b.UH * 0.17 }
  const px = lerp(hx, big3.x, out)
  const py = lerp(hy, big3.y, out)
  const ps = lerp(g.c, 64 * k, out)
  if (ring > 0) {
    if (out > 0) {
      ctx.fillStyle = rgbCss(SUN_RGB)
      ctx.fillRect(px - ps / 2, py - ps / 2, ps, ps)
    }
    marker(ctx, px, py, ps * 0.85, idle, ring)
  }
  SUN_RGB.forEach((v, c) => {
    const at = 10.7 + c * 0.45
    const a = tween(t, at, 0.4)
    if (a <= 0) return
    const y = b.UH * (0.36 + 0.19 * c)
    const bx = b.W * 0.66
    const bw = b.W * 0.2
    faded(ctx, a, () => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
      ctx.fillRect(bx, y - 9 * k, bw, 18 * k)
      ctx.fillStyle = RGB_CSS[c]
      ctx.fillRect(bx, y - 9 * k, bw * (v / 255) * a, 18 * k)
      big(ctx, String(v), bx + bw + 30 * k, y, 22 * k, BRIGHT)
    })
    lampRow(ctx, bx + bw / 2 + 12 * k, y + 32 * k, toBits(v), { r: 6.5 * k, gap: 21 * k, alpha: tween(t, at + 0.3, 0.3) })
  })
}

// ---------- 🎤 the song ----------

/** the story's song is slowed down a lot: one story second = SONG_RATE
 *  seconds of the song's wiggle (songPush) */
const SONG_RATE = 1
const N_SAMPLES = 16
const HERO_K = 7 // the song's big push: 25,842
/** the trace's song time from left to right */
const TRACE_S = 3.2
const sampleTau = (n: number) => ((n + 0.5) / N_SAMPLES) * TRACE_S
const HERO_SAMPLE = sample16(songPush(sampleTau(HERO_K)))

function soundGeo(b: Box) {
  const k = K(b)
  return {
    k,
    mouth: { x: b.W * 0.17, y: b.UH * 0.28 },
    air: { x0: b.W * 0.21, x1: b.W * 0.6, y0: b.UH * 0.15, y1: b.UH * 0.41 },
    mic: { x: b.W * 0.7, y: b.UH * 0.28, w: 64 * k, h: 120 * k },
    trace: { x0: b.W * 0.08, x1: b.W * 0.92, y: b.UH * 0.64, amp: b.UH * 0.1 },
  }
}

function drawSound(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = soundGeo(b)
  const k = g.k
  // the child who sings (head and shoulders)
  child(ctx, g.mouth.x - 18 * k, g.mouth.y + 94 * k, k)
  const sing = sinceLaunch('ds:sing', t, 0.1, idle)
  const amp = sing < 0 ? 0 : Math.min(1, sing / 0.8)
  if (sing >= 0) notes(ctx, g.mouth.x, g.mouth.y, k, idle, amp)
  const tau = (sing < 0 ? 0 : sing) * SONG_RATE
  // the air: molecules pushed back and forth — bunching, spreading
  const a = g.air
  const micIn = tween(t, 2.6, 0.7)
  const x1 = lerp(b.W * 0.95, a.x1, micIn)
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 26; c++) {
      const rx = a.x0 + ((c + 0.5 * (r % 2)) / 26) * (b.W * 0.95 - a.x0)
      if (rx > x1) continue
      const delay = (rx - a.x0) / (b.W * 0.35)
      const push = songPush(tau - delay) * 14 * k * amp
      const y = a.y0 + (r / 6) * (a.y1 - a.y0) + Math.sin(idle * 1.7 + c * 2 + r) * 1.2
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)'
      ctx.beginPath()
      ctx.arc(rx + push, y, 2.6 * k, 0, Math.PI * 2)
      ctx.fill()
    }
  // piece 2: the microphone and its thin skin, pushed in and out
  const m = g.mic
  const skinPush = songPush(tau - (m.x - m.w / 2 - a.x0) / (b.W * 0.35)) * amp
  const named = bounce(sinceLaunch('ds:mic', t, 2.6, idle), 0.4, 1.6, 0.45)
  if (micIn > 0)
    faded(ctx, micIn, () =>
      scaledAbout(ctx, m.x, m.y, 1 + 0.1 * named, () => {
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.roundRect(m.x - m.w / 2 + 8 * k, m.y - m.h / 2, m.w, m.h, 12 * k)
        ctx.fill()
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2
        ctx.stroke()
        // the grille the air passes through
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
        ctx.lineWidth = 1.5
        for (let gy = -0.36; gy <= 0.37; gy += 0.08) {
          ctx.beginPath()
          ctx.moveTo(m.x - m.w / 2 + 16 * k, m.y + gy * m.h)
          ctx.lineTo(m.x + m.w / 2, m.y + gy * m.h)
          ctx.stroke()
        }
        // the skin: a thin curve on the side the air comes from
        ctx.strokeStyle = AMBER_SOFT
        ctx.lineWidth = 3
        ctx.beginPath()
        const sx = m.x - m.w / 2 + 6 * k
        ctx.moveTo(sx, m.y - m.h * 0.42)
        ctx.quadraticCurveTo(sx + skinPush * 18 * k, m.y, sx, m.y + m.h * 0.42)
        ctx.stroke()
      }),
    )
  // piece 3: a pen draws the skin's push over time; then measurements,
  // evenly spaced, each a bar from the middle line to the curve
  const tr = g.trace
  const pen = tween(t, 5.1, 1.5)
  const yAt = (x: number) => tr.y - songPush(((x - tr.x0) / (tr.x1 - tr.x0)) * TRACE_S) * tr.amp
  if (pen > 0) {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(tr.x0, tr.y)
    ctx.lineTo(tr.x1, tr.y)
    ctx.stroke()
    const xe = lerp(tr.x0, tr.x1, pen)
    ctx.strokeStyle = AMBER_SOFT
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let x = tr.x0; x <= xe; x += 3) {
      if (x === tr.x0) ctx.moveTo(x, yAt(x))
      else ctx.lineTo(x, yAt(x))
    }
    ctx.stroke()
    if (pen < 1) {
      // the pen, tied to the skin by a dashed line
      ctx.save()
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)'
      ctx.beginPath()
      ctx.moveTo(m.x - m.w / 2 + 6 * k, m.y + m.h / 2)
      ctx.lineTo(xe, yAt(xe))
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = BRIGHT
      ctx.beginPath()
      ctx.arc(xe, yAt(xe), 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  for (let n = 0; n < N_SAMPLES; n++) {
    const at = 6.7 + n * 0.045
    const q = tween(t, at, 0.25)
    if (q <= 0) continue
    const x = tr.x0 + ((n + 0.5) / N_SAMPLES) * (tr.x1 - tr.x0)
    const y = yAt(x)
    const hero = n === HERO_K
    ctx.strokeStyle = hero && t > 7.6 ? AMBER : 'rgba(125, 211, 252, 0.9)'
    ctx.lineWidth = hero && t > 7.6 ? 4 : 2.5
    ctx.beginPath()
    ctx.moveTo(x, tr.y)
    ctx.lineTo(x, lerp(tr.y, y, q))
    ctx.stroke()
    ctx.fillStyle = ctx.strokeStyle
    ctx.beginPath()
    ctx.arc(x, lerp(tr.y, y, q), 4, 0, Math.PI * 2)
    ctx.fill()
    // piece 4: the hero measurement → a number → sixteen lamps
    if (hero) {
      const ring = tween(t, 7.6, 0.3)
      marker(ctx, x, y, 14, idle, ring)
      const num = tween(t, 8.0, 0.4)
      if (num > 0) {
        const nx = lerp(x, b.W * 0.18, num)
        const ny = lerp(y, b.UH * 0.88, num)
        big(ctx, String(HERO_SAMPLE), nx, ny, lerp(14, 30, num) * k, AMBER_SOFT)
      }
      const rowIn = tween(t, 8.6, 0.4)
      if (rowIn > 0)
        lampRow(ctx, b.W * 0.6, b.UH * 0.88, bits16(HERO_SAMPLE), {
          r: 7 * k,
          gap: 25 * k,
          alpha: rowIn,
          on: (j) => (bits16(HERO_SAMPLE)[j] === '1' ? tween(t, 8.8 + j * 0.05, 0.15) : 0),
        })
    }
  }
}

// ---------- 🔁 the drill-in ----------

function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const cols = [b.W * 0.2, b.W * 0.5, b.W * 0.8]
  const yTop = b.UH * 0.27
  const yMid = b.UH * 0.45
  const yNum = b.UH * 0.6
  const yLamps = b.UH * 0.76
  const lampsAt = 8.7
  faded(ctx, open, () => {
    // ① a letter → the table → a number
    const a1 = tween(t, 2.6, 0.4)
    if (a1 > 0) {
      faded(ctx, a1, () => big(ctx, 'H', cols[0], yTop, 44 * k))
      const c1 = tween(t, 3.1, 0.4)
      arrow(ctx, cols[0], yTop + 30 * k, cols[0], yMid - 40 * k, c1)
      codeTable(ctx, cols[0], yMid, 150 * k, { from: 'G', to: 'I', hi: { H: c1 }, alpha: c1 })
      const n1 = tween(t, 3.8, 0.4)
      arrow(ctx, cols[0], yMid + 40 * k, cols[0], yNum - 22 * k, n1)
      faded(ctx, n1, () => big(ctx, '72', cols[0], yNum, 32 * k, AMBER_SOFT))
      stepRing(ctx, cols[0], yTop, 44 * k, 1, idle, a1 * (1 - tween(t, 5.0, 0.4)))
    }
    // ② light → electrons in a cup → a number
    const a2 = tween(t, 5.1, 0.4)
    if (a2 > 0) {
      const cx = cols[1]
      const s = 54 * k
      faded(ctx, a2, () => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
        ctx.fillRect(cx - s / 2, yTop - s / 2, s, s)
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.9)'
        ctx.strokeRect(cx - s / 2, yTop - s / 2, s, s)
        ctx.fillStyle = RGB_CSS[0]
        ctx.fillRect(cx - s / 2 + 2, yTop - s / 2 + 2, s - 4, s * 0.22)
      })
      for (let e = 0; e < 4; e++) {
        const since = sinceLaunch(`dr:ph${e}`, t, 5.3 + e * 0.25, idle)
        if (since < 0) continue
        const fly = since * PHOTON_SPEED * 1.4
        const ex = cx + (e % 2 ? 10 : -10) * k
        const ey = yTop + (e < 2 ? 2 : 16) * k
        if (fly < 70) packet(ctx, ex, ey - 70 + fly, Math.PI / 2, RGB_NM[0], idle, 0.9, 20)
        else blit(ctx, electronSprite(true), ex, ey)
      }
      const c2 = tween(t, 6.4, 0.4)
      arrow(ctx, cx, yTop + 34 * k, cx, yMid - 26 * k, c2)
      faded(ctx, c2, () => {
        ctx.fillStyle = rgbCss(SUN_RGB)
        ctx.fillRect(cx - 18 * k, yMid - 18 * k, 36 * k, 36 * k)
      })
      const n2 = tween(t, 6.9, 0.4)
      arrow(ctx, cx, yMid + 24 * k, cx, yNum - 22 * k, n2)
      faded(ctx, n2, () => big(ctx, String(SUN_RGB[0]), cx, yNum, 32 * k, AMBER_SOFT))
      stepRing(ctx, cx, yTop, 44 * k, 2, idle, a2 * (1 - tween(t, 7.5, 0.4)))
    }
    // ③ the air → the skin → a number
    const a3 = tween(t, 7.6, 0.3)
    if (a3 > 0) {
      const cx = cols[2]
      faded(ctx, a3, () => {
        ctx.strokeStyle = AMBER_SOFT
        ctx.lineWidth = 2.5
        ctx.beginPath()
        for (let x = -60; x <= 60; x += 3) {
          const y = yTop - songPush(((x + 60) / 120) * TRACE_S) * 24 * k
          if (x === -60) ctx.moveTo(cx + x * k, y)
          else ctx.lineTo(cx + x * k, y)
        }
        ctx.stroke()
        const hx = cx + (((HERO_K + 0.5) / N_SAMPLES) * 120 - 60) * k
        const hy = yTop - songPush(sampleTau(HERO_K)) * 24 * k
        ctx.strokeStyle = AMBER
        ctx.lineWidth = 3.5
        ctx.beginPath()
        ctx.moveTo(hx, yTop)
        ctx.lineTo(hx, hy)
        ctx.stroke()
      })
      const n3 = tween(t, 8.0, 0.4)
      arrow(ctx, cx, yTop + 34 * k, cx, yNum - 22 * k, n3)
      faded(ctx, n3, () => big(ctx, String(HERO_SAMPLE), cx, yNum, 30 * k, AMBER_SOFT))
      stepRing(ctx, cx, yTop, 48 * k, 3, idle, a3)
    }
    // … and every number becomes ons and offs
    const rowIn = tween(t, lampsAt, 0.4)
    if (rowIn > 0) {
      const opts = { r: 5.5 * k, gap: 17 * k, alpha: rowIn, pop: (i: number) => tween(t, lampsAt + i * 0.04, 0.2) }
      lampRow(ctx, cols[0], yLamps, toBits(72), opts)
      lampRow(ctx, cols[1], yLamps, toBits(SUN_RGB[0]), opts)
      const s16 = bits16(HERO_SAMPLE)
      lampRow(ctx, cols[2], yLamps, s16.slice(0, 8), opts)
      lampRow(ctx, cols[2], yLamps + 18 * k, s16.slice(8), opts)
    }
  })
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- 🛣️ one road ----------

/** everything as one long row of bits: the message, the sun's pixel, the
 *  song's measurement */
const ALL_BITS = [...MESSAGE].map((c) => toBits(asciiCode(c))).join('') + SUN_RGB.map((v) => toBits(v)).join('') + bits16(HERO_SAMPLE)

function drawRoad(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const k = K(b)
  const w = world(ctx, b, idle)
  const th = things(b)
  house(ctx, w.house.x, w.house.y, k)
  // piece 1: the three things fade into one long row of lamps
  const gone = tween(t, 0.1, 0.6)
  child(ctx, th.child.x, th.child.y, k)
  drawingCard(ctx, th.drawing.x, th.drawing.y, th.drawing.s, 1 - gone)
  bubble(ctx, th.bubble.x, th.bubble.y, th.bubble.w, 1 - gone)
  notes(ctx, th.mouth.x, th.mouth.y, k, idle, 1 - gone)
  const n = ALL_BITS.length
  const gap = (b.W * 0.88) / (n - 1)
  const y = b.UH * 0.16
  const go = sinceLaunch('dw:go', t, 2.6, idle)
  lampRow(ctx, b.W / 2, y, ALL_BITS, {
    r: Math.min(5, gap * 0.38),
    gap,
    pop: (i) => tween(t, 0.4 + (i / n) * 1.8, 0.2),
    // piece 2: a blink runs along the row as the bits set off
    on: (i) => (ALL_BITS[i] === '1' ? (go > 0 ? 0.55 + 0.45 * Math.sin(idle * 8 - i * 0.5) : 1) : 0),
  })
  // piece 2: the bits fly over the sea — as flashes of light and as waves —
  // and the three things come back at Grandma's
  if (go >= 0) {
    const from = [0.2, 0.45, 0.7].map((q) => ({ x: b.W * q, y }))
    bitStream(ctx, b, from, w.house, go, idle, k, true, 2.2)
    // Grandma's window glows warmer once everything has arrived
    const home = clamp01((go - 3.6) / 1.0)
    if (home > 0) {
      const g = ctx.createRadialGradient(w.house.x - 19 * k, w.house.y - 36 * k, 4, w.house.x - 19 * k, w.house.y - 36 * k, 90 * k)
      g.addColorStop(0, `rgba(251, 191, 36, ${0.35 * home})`)
      g.addColorStop(1, 'rgba(251, 191, 36, 0)')
      ctx.fillStyle = g
      ctx.fillRect(w.house.x - 120 * k, w.house.y - 140 * k, 240 * k, 160 * k)
    }
  }
  // the end: the picture dims slowly, then the stories menu comes back
  const dim = tween(t, DIGITAL_T.road - 2.2, 2.0)
  if (dim > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${0.92 * dim})`
    ctx.fillRect(0, 0, b.W, b.H)
  }
}

export function drawDigitalBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') drawQuestion(ctx, b, t, idle)
  else if (beat === 'fingers') drawFingers(ctx, b, t, idle)
  else if (beat === 'bits') drawBits(ctx, b, t, idle)
  else if (beat === 'message') drawMessage(ctx, b, t, idle)
  else if (beat === 'decode') drawDecode(ctx, b, t, idle)
  else if (beat === 'photo') drawPhoto(ctx, b, t, idle)
  else if (beat === 'sound') drawSound(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else drawRoad(ctx, b, t, idle)
}

/** for tests and the notes: the song measurement the story shows */
export const DIGITAL_HERO_SAMPLE = HERO_SAMPLE
