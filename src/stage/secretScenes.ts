import { clamp01, easeInOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, lerp, marker, text } from './storyDraw'
import { sinceLaunch } from './laserScenes'
import { backdrop, bounce, fadeIn, replayFrame, rewindSweep, scaledAbout, stepRing, type Box } from './laserCutScenes'
import { BRIGHT, HINT, K, SKIN, arrow, big, bubble, child, faded, house, lamp, lampRow, lampX, stars, tween } from './digitalScenes'
import { cross, router, tablet } from './wifiScenes'
import { asciiCode, toBits } from '../core/digital'
import { FUNNY_JUMBLE, FUNNY_KEY, FUNNY_MESSAGE, JUMBLE_BITS, JUMBLE_TEXT, MESSAGE_BITS, PAINT, SECRET_KEY, SECRET_MESSAGE, realKeyCount } from '../core/secret'

// R09 — 🔐 Encryption: secret keys (proposal: docs/how-things-work/18-
// proposal-digital-information.md, story 6). One question — Wi-Fi waves
// reach the neighbours too: why can't they read the message? — one aha —
// before it flies, the message's bits are mixed with a secret key (where
// the key has a one, the bit flips); only the same key flips them back;
// and the two sides can agree on a key while everyone listens (the paint
// trick). Words taught: key, encryption. Hero: the letter H.
//   question  the boy's house and the neighbours'; the waves reach both;
//             the antenna on their roof, explained, ringed and bouncing;
//             it catches the message's bits; "?"
//   key       a row of random bits with a key; a copy on the boy's tablet
//             and on Grandma's; mixing = encryption
//   mix       H's bits, the key under them; where the key has a one the bit
//             flips, where a zero it stays; HI → RG
//   gibberish a funny one for small kids: I MISS YOU → BLOB ZONKY through
//             the very same process, letter by letter (each letter's bits,
//             the key under them, flips where the key is one, new letters),
//             then wobbling; a sneaky hacker (named) grabs a copy and reads only
//             gibberish ✕ — bad luck, hacker — and slinks off
//   fly       the jumble flies; the neighbours catch every bit — RG ✕
//   unmix     Grandma's tablet flips the same bits back — HI
//   paint     the paint trick, step by step (said: the real maths is hard,
//             paint works very similarly): a sneaky hacker listens; a
//             yellow bucket each (the hacker sees it)
//   pour      the boy pours red → orange; Grandma blue → green; the rest
//             of each secret into a cupboard; the buckets swap over the
//             hacker, who keeps copies
//   brown     each pours its hidden secret into the bucket it got → brown;
//             inside: yellow, red, blue (layers), mixed back; brown =
//             brown, the key; the hacker cannot unmix — bad luck — slinks off
//   drill     🔁 ① the key flips ② the jumble flies ③ the same key flips back
//   padlock   the padlock on a phone; the Wi-Fi password; a real key: 128
//             bits, 2¹²⁸ keys; it dims
// Every line is science pacing (piece k spoken while story time stands at
// 2.5·(k−1) s, its event in the watch break after it).

export const SECRET_ORDER = ['question', 'key', 'mix', 'gibberish', 'fly', 'unmix', 'paint', 'pour', 'brown', 'drill', 'padlock'] as const
export type SecretBeat = (typeof SECRET_ORDER)[number]

/** story seconds per beat: 2.5 s per piece (plus a look where noted) */
export const SECRET_T: Record<SecretBeat, number> = {
  question: 10,
  key: 7.5,
  // + 1 s after HI → RG
  mix: 13.5,
  // + 2.5 s after the hacker reads only gibberish: time to laugh, and the
  // hacker slinks off
  gibberish: 15,
  fly: 7.5,
  unmix: 7.5,
  paint: 7.5,
  // + 1 s after the swap
  pour: 11,
  // + 3 s after the hacker fails: time to look; the hacker slinks off
  brown: 15.5,
  drill: 10,
  // the end plays out, then the picture dims before the menu returns
  padlock: 11.5,
}

const RADIO = (a: number) => `rgba(165, 180, 252, ${a})`

/** a key, the kind that opens a door, its bow at (x, y), pointing right */
function keyIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.strokeStyle = AMBER
    ctx.lineWidth = s * 0.22
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x, y, s * 0.5, 0, Math.PI * 2)
    ctx.moveTo(x + s * 0.5, y)
    ctx.lineTo(x + s * 1.9, y)
    ctx.moveTo(x + s * 1.5, y)
    ctx.lineTo(x + s * 1.5, y + s * 0.45)
    ctx.moveTo(x + s * 1.85, y)
    ctx.lineTo(x + s * 1.85, y + s * 0.35)
    ctx.stroke()
  })
}

function padlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = s * 0.22
    ctx.beginPath()
    ctx.arc(x, y - s * 0.25, s * 0.45, Math.PI, 0)
    ctx.stroke()
    ctx.fillStyle = AMBER
    ctx.beginPath()
    ctx.roundRect(x - s * 0.65, y - s * 0.25, s * 1.3, s * 1.0, s * 0.15)
    ctx.fill()
    ctx.fillStyle = '#78350f'
    ctx.beginPath()
    ctx.arc(x, y + s * 0.2, s * 0.14, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** a jar of paint */
function pot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.25)'
    ctx.beginPath()
    ctx.roundRect(x - s * 0.55, y - s * 0.6, s * 1.1, s * 1.2, s * 0.2)
    ctx.fill()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x - s * 0.48, y - s * 0.2, s * 0.96, s * 0.74, s * 0.16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x - s * 0.55, y - s * 0.6, s * 1.1, s * 1.2, s * 0.2)
    ctx.stroke()
  })
}

/** an eye from the front (the neighbours watching) */
function watchingEye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1) {
  faded(ctx, alpha, () => {
    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.moveTo(x - r, y)
    ctx.quadraticCurveTo(x, y - r * 0.8, x + r, y)
    ctx.quadraticCurveTo(x, y + r * 0.8, x - r, y)
    ctx.fill()
    ctx.fillStyle = '#2563eb'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.36, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.16, 0, Math.PI * 2)
    ctx.fill()
  })
}

// ---------- 🏠 two houses, the waves between ----------

/** the neighbours' roof antenna: a mast with metal rods (where it sits:
 *  ANTENNA_AT) */
function antenna(ctx: CanvasRenderingContext2D, g: ReturnType<typeof streetGeo>, glow = 0) {
  const k = g.k
  const x = g.nb.x + 30 * k
  const y0 = g.ground - 150 * k
  if (glow > 0) {
    const gr = ctx.createRadialGradient(x, y0 - 50 * k, 2, x, y0 - 50 * k, 60 * k)
    gr.addColorStop(0, `rgba(165, 180, 252, ${0.5 * glow})`)
    gr.addColorStop(1, 'rgba(165, 180, 252, 0)')
    ctx.fillStyle = gr
    ctx.fillRect(x - 60 * k, y0 - 110 * k, 120 * k, 120 * k)
  }
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineCap = 'round'
  ctx.lineWidth = 4 * k
  ctx.beginPath()
  ctx.moveTo(x, y0)
  ctx.lineTo(x, y0 - 90 * k)
  ctx.stroke()
  ctx.lineWidth = 3 * k
  for (const [dy, w] of [[-84, 30], [-66, 24], [-48, 18]]) {
    ctx.beginPath()
    ctx.moveTo(x - w * k, y0 + dy * k)
    ctx.lineTo(x + w * k, y0 + dy * k)
    ctx.stroke()
  }
}
const antennaAt = (g: ReturnType<typeof streetGeo>) => ({ x: g.nb.x + 30 * g.k, y: g.ground - 150 * g.k - 60 * g.k })

function streetGeo(b: Box) {
  const k = K(b)
  const ground = b.UH * 0.74
  return { k, ground, boy: { x: b.W * 0.22, y: ground }, nb: { x: b.W * 0.76, y: ground } }
}

function street(ctx: CanvasRenderingContext2D, b: Box, idle: number, waves: number, ant: { bounce?: number; glow?: number } = {}) {
  const g = streetGeo(b)
  const k = g.k
  backdrop(ctx, b)
  stars(ctx, b, idle, 40)
  ctx.fillStyle = '#16233a'
  ctx.fillRect(0, g.ground, b.W, b.UH - g.ground)
  house(ctx, g.boy.x, g.ground, k * 1.6)
  house(ctx, g.nb.x, g.ground, k * 1.6)
  // the neighbours' antenna on their roof — drawn once, bouncing when it is
  // named (never a second copy on top)
  const A = antennaAt(g)
  scaledAbout(ctx, A.x, A.y + 30 * k, 1 + 0.3 * (ant.bounce ?? 0), () => antenna(ctx, g, ant.glow ?? 0))
  router(ctx, g.boy.x + 30 * k, g.ground - 20 * k, k * 0.8, idle)
  // the waves spreading out of the boy's house — through the walls
  if (waves > 0) {
    ctx.save()
    ctx.globalAlpha *= waves
    for (let i = 0; i < 6; i++) {
      const r = ((idle * 60 + i * 50) % 300) * k * 1.6
      ctx.strokeStyle = RADIO(0.75 * (1 - r / (480 * k)))
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(g.boy.x + 30 * k, g.ground - 50 * k, r, -Math.PI * 0.6, Math.PI * 0.05)
      ctx.stroke()
    }
    ctx.restore()
  }
  return g
}

// ---------- ❓ the question ----------

function drawQuestion(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const waves = tween(t, 2.6, 0.6)
  // piece 3: "On their roof is an antenna … Antenna." — it bounces while it
  // is named; then the waves reach it and it glows
  const said3 = sinceLaunch('xq:ant', t, 4.85, idle)
  const antN = Math.max(bounce(said3 - 0.5, 0.4, 1.4, 0.45), bounce(said3 - 3.6, 0.4, 1.2, 0.45))
  const glow = t >= 5.1 ? 0.6 + 0.4 * Math.sin(idle * 6) : 0
  const g = street(ctx, b, idle, waves, { bounce: antN, glow })
  const k = g.k
  // piece 1: the message, read out — it pops on the boy's house
  const hi = bounce(sinceLaunch('xq:hi', t, 0, idle) - 2.6, 0.35, 999, 0.1)
  if (hi > 0) scaledAbout(ctx, g.boy.x, g.ground - 230 * k, Math.min(1.15, hi), () => bubble(ctx, g.boy.x, g.ground - 230 * k, 80 * k, 1, 1, 0))
  // piece 2: the neighbours' house is named — it is ringed
  const nb = bounce(sinceLaunch('xq:nb', t, 2.35, idle) - 2.4, 0.4, 1.6, 0.45)
  if (nb > 0) marker(ctx, g.nb.x, g.ground - 70 * k, 120 * k, idle, Math.min(1, nb))
  // … in an amber ring while it is named and while the waves reach it
  if (said3 >= 0) {
    const A = antennaAt(g)
    marker(ctx, A.x, A.y, 70 * k, idle, Math.min(1, Math.max(antN, t >= 5.1 && t < 7.5 ? 0.8 : 0)))
  }
  // piece 4's event: the neighbours catch it — and still cannot read it
  const caught = bounce(sinceLaunch('xq:caught', t, 7.7, idle), 0.35, 999, 0.1)
  if (caught > 0) {
    // what they catch: the message's bits (what they mean is the question)
    scaledAbout(ctx, g.nb.x, g.ground - 340 * k, Math.min(1.15, caught), () =>
      lampRow(ctx, g.nb.x, g.ground - 340 * k, JUMBLE_BITS.join(''), { r: 5 * k, gap: 13 * k }),
    )
    const ask = bounce(sinceLaunch('xq:ask', t, 8.7, idle), 0.4, 999, 0.1)
    if (ask > 0) scaledAbout(ctx, g.nb.x - 120 * k, g.ground - 260 * k, Math.min(1.15, ask), () => big(ctx, '?', g.nb.x - 120 * k, g.ground - 260 * k, 64 * k, AMBER_SOFT))
  }
}

// ---------- 🔑 the key ----------

function drawKey(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const key = SECRET_KEY.join('')
  // piece 1's event: the key — a row of random bits, a key icon
  const kIn = bounce(sinceLaunch('xk:key', t, 0.2, idle), 0.4, 999, 0.1)
  const named = bounce(sinceLaunch('xk:named', t, 0, idle) - 2.2, 0.4, 1.4, 0.45)
  const rowY = b.UH * 0.2
  if (kIn > 0)
    scaledAbout(ctx, b.W / 2, rowY, Math.min(1.12, kIn) * (1 + 0.08 * named), () => {
      keyIcon(ctx, b.W * 0.1, rowY, 26 * k)
      lampRow(ctx, b.W * 0.58, rowY, key, { r: 9 * k, gap: 34 * k })
    })
  // piece 2's event: a copy to the boy's tablet and to Grandma's
  const T = [
    { x: b.W * 0.25, who: 'boy' },
    { x: b.W * 0.75, who: 'gran' },
  ]
  const copy = tween(t, 2.7, 1.0)
  T.forEach((d, i) => {
    const a = tween(t, 2.6 + i * 0.2, 0.4)
    if (a <= 0) return
    const ty = b.UH * 0.58
    faded(ctx, a, () => {
      tablet(ctx, d.x, ty, 220 * k, 160 * k, () => {
        if (copy > 0) {
          keyIcon(ctx, d.x - 86 * k, ty, 14 * k, copy)
          lampRow(ctx, d.x + 14 * k, ty, key, { r: 5 * k, gap: 11 * k, alpha: copy })
        }
      })
      house(ctx, d.x, ty + 160 * k, k * 0.7)
    })
    if (copy > 0 && copy < 1) {
      const q = easeInOut(copy)
      keyIcon(ctx, lerp(b.W * 0.1, d.x - 86 * k, q), lerp(rowY, ty, q), 18 * k)
    }
  })
  // the neighbours: no key
  const nb = tween(t, 3.8, 0.4)
  if (nb > 0) {
    faded(ctx, nb, () => {
      watchingEye(ctx, b.W / 2, b.UH * 0.6, 30 * k)
      keyIcon(ctx, b.W / 2 - 18 * k, b.UH * 0.72, 12 * k, 0.6)
    })
    cross(ctx, b.W / 2 + 6 * k, b.UH * 0.72, 16 * k, nb)
  }
  // piece 3: "encryption" — message + key → a jumble, bouncing as it is named
  const enc = bounce(sinceLaunch('xk:enc', t, 4.85, idle) - 2.4, 0.4, 999, 0.1)
  if (enc > 0)
    scaledAbout(ctx, b.W / 2, b.UH * 0.9, Math.min(1.12, enc), () => {
      const y = b.UH * 0.9
      bubble(ctx, b.W / 2 - 150 * k, y, 70 * k, 1, 1, 0)
      big(ctx, '+', b.W / 2 - 85 * k, y, 30 * k, BRIGHT)
      keyIcon(ctx, b.W / 2 - 55 * k, y, 14 * k)
      arrow(ctx, b.W / 2 + 10 * k, y, b.W / 2 + 70 * k, y)
      bubble(ctx, b.W / 2 + 140 * k, y, 70 * k, 1, 1, 0, JUMBLE_TEXT)
    })
}

// ---------- 🔀 the mix ----------

/** an amber arrow from a key bit (x, y0) up to the message bit it flips
 *  (x, y1), with a little turn-over sign beside its tip */
function flipArrow(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, k: number, alpha: number) {
  if (alpha <= 0) return
  faded(ctx, alpha, () => {
    ctx.strokeStyle = AMBER
    ctx.fillStyle = AMBER
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y0)
    ctx.lineTo(x, y1 + 9 * k)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y1)
    ctx.lineTo(x - 7 * k, y1 + 11 * k)
    ctx.lineTo(x + 7 * k, y1 + 11 * k)
    ctx.closePath()
    ctx.fill()
    // ↻ — "turn over"
    const cx = x + 19 * k
    const cy = (y0 + y1) / 2
    const rr = 8 * k
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(cx, cy, rr, -Math.PI * 0.35, Math.PI * 1.25)
    ctx.stroke()
    // its arrowhead
    const ex = cx + rr * Math.cos(-Math.PI * 0.35)
    const ey = cy + rr * Math.sin(-Math.PI * 0.35)
    ctx.beginPath()
    ctx.moveTo(ex + 4 * k, ey + 4 * k)
    ctx.lineTo(ex - 4 * k, ey - 1 * k)
    ctx.lineTo(ex + 5 * k, ey - 4 * k)
    ctx.closePath()
    ctx.fill()
  })
}

/** three rows: the message's bits, the key, what comes out; `flipAt`,
 *  `keepAt` = when the flips and the keeps happen */
function mixRows(ctx: CanvasRenderingContext2D, b: Box, t: number, top: string, key: string, out: string, o: { topLetter: string; outLetter: string; flipAt: number; keepAt: number; rowsAt: number; flipGlow?: number; keepGlow?: number; links?: number }) {
  const k = K(b)
  const gap = 56 * k
  const cx = b.W * 0.56
  const ys = [b.UH * 0.2, b.UH * 0.38, b.UH * 0.58]
  const a = tween(t, o.rowsAt, 0.5)
  if (a <= 0) return
  faded(ctx, a, () => {
    big(ctx, o.topLetter, b.W * 0.08, ys[0], 40 * k)
    keyIcon(ctx, b.W * 0.05, ys[1], 16 * k)
    lampRow(ctx, cx, ys[0], top, { r: 12 * k, gap })
    lampRow(ctx, cx, ys[1], key, { r: 12 * k, gap, grow: (i) => (key[i] === '1' ? (o.flipGlow ?? 0) : (o.keepGlow ?? 0)) })
  })
  for (let i = 0; i < 8; i++) {
    const x = lampX(cx, 8, gap, i)
    const flip = key[i] === '1'
    const q = tween(t, (flip ? o.flipAt : o.keepAt) + i * 0.12, 0.45)
    // "where the key has a one, the bit flips": an arrow from each key one
    // up to its message bit, until that bit has passed and turned over
    if (flip && o.links) flipArrow(ctx, x, ys[1] - 12 * k * 1.7, lerp(ys[0], ys[1], easeInOut(Math.min(q, 0.5) * 2) * 0.6) + 12 * k * 1.4, k, o.links * (1 - clamp01((q - 0.3) / 0.2)))
    if (q <= 0) continue
    // the bit travels down past the key — turning over where the key is one
    const y = lerp(ys[0], ys[2], easeInOut(q))
    const bit = q < 0.5 || !flip ? top[i] : out[i]
    if (q < 1) lamp(ctx, x, y, 12 * k, bit === '1' ? 1 : 0)
    else lamp(ctx, x, ys[2], 12 * k, out[i] === '1' ? 1 : 0)
    if (flip && q > 0.3 && q < 0.9) {
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(x + 20 * k, ys[1], 14 * k, -Math.PI * 0.6, Math.PI * 0.6)
      ctx.stroke()
    }
  }
  const done = tween(t, Math.max(o.flipAt, o.keepAt) + 1.4, 0.4)
  if (done > 0) faded(ctx, done, () => big(ctx, o.outLetter, b.W * 0.08, ys[2], 40 * k, AMBER_SOFT))
}

function drawMix(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // pieces 2 and 3 bind the rule to the columns while it is said
  const flipGlow = bounce(sinceLaunch('xm:flip', t, 2.35, idle) - 0.4, 0.35, 2.2, 0.4)
  const keepGlow = bounce(sinceLaunch('xm:keep', t, 4.85, idle) - 0.4, 0.35, 1.6, 0.4)
  // the arrows grow in while the rule is said
  const links = clamp01((sinceLaunch('xm:links', t, 2.4, idle) - 0.5) / 0.5)
  mixRows(ctx, b, t, MESSAGE_BITS[0], SECRET_KEY[0], JUMBLE_BITS[0], {
    topLetter: SECRET_MESSAGE[0],
    outLetter: JUMBLE_TEXT[0],
    rowsAt: 0.2,
    flipAt: 2.7,
    keepAt: 5.2,
    flipGlow,
    keepGlow,
    links,
  })
  // piece 4's event: "So the letter H has turned into the letter R!" —
  // the two letters bounce, an arrow between them
  const hr = bounce(sinceLaunch('xm:hr', t, 7.7, idle), 0.4, 1.6, 0.45)
  if (hr > 0) {
    const ys = [b.UH * 0.2, b.UH * 0.58]
    for (const y of ys) marker(ctx, b.W * 0.08, y, 34 * k, idle, Math.min(1, hr))
    arrow(ctx, b.W * 0.08, ys[0] + 34 * k, b.W * 0.08, ys[1] - 34 * k, Math.min(1, hr))
  }
  // piece 5's event: the whole message: HI → RG
  const whole = bounce(sinceLaunch('xm:whole', t, 10.2, idle), 0.4, 999, 0.1)
  if (whole > 0)
    scaledAbout(ctx, b.W / 2, b.UH * 0.82, Math.min(1.12, whole), () => {
      const y = b.UH * 0.82
      bubble(ctx, b.W / 2 - 130 * k, y, 90 * k, 1, 1, 0)
      keyIcon(ctx, b.W / 2 - 40 * k, y - 34 * k, 12 * k)
      arrow(ctx, b.W / 2 - 60 * k, y, b.W / 2 + 50 * k, y)
      bubble(ctx, b.W / 2 + 130 * k, y, 90 * k, 1, 1, 0, JUMBLE_TEXT)
    })
}

// ---------- 🤪 a funny one: I MISS YOU → BLOB ZONKY ----------

/** a line of big letters, each wobbling a little (funny), centred on (x, y) */
function wobblyLine(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, idle: number, wobble: number, shown = s.length) {
  const step = size * 0.72
  for (let i = 0; i < Math.min(shown, s.length); i++) {
    const cx = x + (i - (s.length - 1) / 2) * step
    const dy = Math.sin(idle * 7 + i * 1.3) * size * 0.12 * wobble
    const rot = Math.sin(idle * 5 + i) * 0.18 * wobble
    ctx.save()
    ctx.translate(cx, y + dy)
    ctx.rotate(rot)
    text(ctx, s[i], 0, 0, color, size, '800')
    ctx.restore()
  }
}

/** I MISS YOU → BLOB ZONKY through the very same machine as H → R: one
 *  letter at a time, its bits, the key under them, the flips, the new
 *  letter. The first letter slowly, the other nine fast (s = seconds since
 *  the run began, on the idle clock) */
const GIB_FIRST = 1.4
const GIB_EACH = 0.27
const gibStart = (c: number) => (c === 0 ? 0 : GIB_FIRST + (c - 1) * GIB_EACH)
const gibDur = (c: number) => (c === 0 ? GIB_FIRST : GIB_EACH)
const GIB_END = gibStart(FUNNY_MESSAGE.length - 1) + GIB_EACH
const shownChar = (ch: string) => (ch === ' ' ? '␣' : ch)

function drawGibberish(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const n = FUNNY_MESSAGE.length
  const step = 46 * k
  const slotX = (c: number) => b.W / 2 + (c - (n - 1) / 2) * step
  const size = 34 * k
  const yMsg = b.UH * 0.09
  const yJ = b.UH * 0.64
  // the machine: the same three rows as the H → R mix
  const gap = 56 * k
  const r = 12 * k
  const cx = b.W * 0.56
  const ys = [b.UH * 0.25, b.UH * 0.37, b.UH * 0.49]
  const lx = b.W * 0.1
  // piece 1's event: the boy's message types itself in; its first letter
  // goes into the machine and shows its bits
  const typed = Math.floor(tween(t, 0.2, 1.0) * n + (t > 1.25 ? n : 0))
  // piece 2's event (after it is said): the run — every letter, one by one
  const run = sinceLaunch('xg:run', t, 2.55, idle)
  const sRun = Math.max(0, run)
  const started = (c: number) => run >= 0 && sRun >= gibStart(c)
  const u = (c: number) => clamp01((sRun - gibStart(c)) / gibDur(c))
  let cur = 0
  for (let c = 0; c < n; c++) if (started(c)) cur = c
  const first = cur === 0
  // local timings of the current letter (the first one slow, the rest fast)
  const uc = run >= 0 ? u(cur) : 0
  const ph = (a: number, d: number) => clamp01((uc - a) / d)
  const T = first ? { keyIn: [0, 0.22], pass: [0.25, 0.45], out: [0.7, 0.12], fly: [0.82, 0.18] } : { keyIn: [0, 0.1], pass: [0.15, 0.5], out: [0.65, 0.12], fly: [0.78, 0.22] }
  // the message, in its bubble; letters that went in are pale, the one in
  // the machine is ringed
  ctx.fillStyle = '#f1f5f9'
  ctx.beginPath()
  ctx.roundRect(slotX(0) - step * 0.75, yMsg - size * 0.8, step * (n + 0.5), size * 1.6, size * 0.6)
  ctx.fill()
  for (let c = 0; c < Math.min(n, typed); c++) {
    const inside = c === cur && (t > 1.4 || run >= 0)
    const gone = c < cur || (c === cur && run >= 0 && uc >= 1)
    faded(ctx, gone ? 0.3 : 1, () => text(ctx, shownChar(FUNNY_MESSAGE[c]), slotX(c), yMsg, FUNNY_MESSAGE[c] === ' ' ? HINT : '#0f172a', size, '800'))
    if (inside && !gone) marker(ctx, slotX(c), yMsg, size * 0.62, idle, 1)
  }
  // the jumble's slots, then its letters as they land
  const slots = tween(t, 2.6, 0.4)
  const done = run >= 0 && sRun >= GIB_END
  if (slots > 0) {
    ctx.save()
    ctx.globalAlpha *= slots
    ctx.strokeStyle = done ? AMBER : 'rgba(251, 191, 36, 0.35)'
    ctx.lineWidth = done ? 3 : 2
    if (!done) ctx.setLineDash([6 * k, 6 * k])
    ctx.beginPath()
    ctx.roundRect(slotX(0) - step * 0.75, yJ - size * 0.8, step * (n + 0.5), size * 1.6, size * 0.6)
    ctx.stroke()
    ctx.restore()
  }
  for (let c = 0; c < n; c++) {
    if (!started(c) || u(c) < 1) continue
    const land = sRun - gibStart(c) - gibDur(c)
    const p = Math.min(1.25, bounce(land, 0.25, 999, 0.1) || 1)
    const dy = done ? Math.sin(idle * 7 + c * 1.3) * size * 0.12 : 0
    const rot = done ? Math.sin(idle * 5 + c) * 0.16 : 0
    ctx.save()
    ctx.translate(slotX(c), yJ + dy)
    ctx.rotate(rot)
    scaledAbout(ctx, 0, 0, p, () => text(ctx, shownChar(FUNNY_JUMBLE[c]), 0, 0, FUNNY_JUMBLE[c] === ' ' ? HINT : AMBER_SOFT, size, '800'))
    ctx.restore()
  }
  // the machine works on the current letter
  if (t < 1.4) return grabPart()
  const c = cur
  const msgBits = toBits(asciiCode(FUNNY_MESSAGE[c]))
  const key = FUNNY_KEY[c]
  const out = toBits(asciiCode(FUNNY_JUMBLE[c]))
  // the letter comes down from the bubble into the machine
  const comeIn = first ? tween(t, 1.45, 0.5) : clamp01(uc / 0.12)
  const inX = lerp(slotX(c), lx, easeInOut(comeIn))
  const inY = lerp(yMsg, ys[0], easeInOut(comeIn))
  big(ctx, shownChar(FUNNY_MESSAGE[c]), inX, inY, 38 * k)
  const bitsA = first ? tween(t, 1.9, 0.4) : clamp01((uc - 0.05) / 0.1)
  const pass = run >= 0 ? ph(T.pass[0], T.pass[1]) : 0
  if (bitsA > 0 && pass <= 0) lampRow(ctx, cx, ys[0], msgBits, { r, gap, alpha: bitsA })
  // the key's bits under them (each letter has its own key byte)
  const keyA = run >= 0 ? ph(T.keyIn[0], T.keyIn[1]) : 0
  keyIcon(ctx, b.W * 0.05 + 4 * k, ys[1], 14 * k, run >= 0 ? 1 : 0)
  if (keyA > 0) lampRow(ctx, cx + (1 - keyA) * 120 * k, ys[1], key, { r, gap, alpha: keyA, grow: (i) => (key[i] === '1' && pass > 0.15 && pass < 0.85 ? 0.6 : 0) })
  // the first (slow) letter: arrows from the key's ones up to their bits
  if (first && keyA > 0)
    for (let i = 0; i < 8; i++)
      if (key[i] === '1') flipArrow(ctx, lampX(cx, 8, gap, i), ys[1] - r * 1.7, ys[0] + r * 1.4 + (ys[1] - ys[0]) * 0.6 * easeInOut(Math.min(1, pass * 2)), k, keyA * (1 - clamp01((pass - 0.3) / 0.2)))
  // the bits travel down past the key, turning over where it has a one
  if (pass > 0) {
    if (pass < 1) lampRow(ctx, cx, ys[0], msgBits, { r, gap, alpha: 0.25 })
    for (let i = 0; i < 8; i++) {
      const x = lampX(cx, 8, gap, i)
      const flip = key[i] === '1'
      const y = lerp(ys[0], ys[2], easeInOut(pass))
      const bit = pass < 0.5 || !flip ? msgBits[i] : out[i]
      lamp(ctx, x, y, r, bit === '1' ? 1 : 0)
    }
  }
  // out comes the new letter, then it hops into its slot below
  const outA = run >= 0 ? ph(T.out[0], T.out[1]) : 0
  const fly = run >= 0 ? ph(T.fly[0], T.fly[1]) : 0
  if (outA > 0 && fly < 1) {
    const ox = lerp(lx, slotX(c), easeInOut(fly))
    const oy = lerp(ys[2], yJ, easeInOut(fly))
    scaledAbout(ctx, ox, oy, 0.6 + 0.4 * outA, () => big(ctx, shownChar(FUNNY_JUMBLE[c]), ox, oy, 38 * k, AMBER_SOFT))
  }
  grabPart()

  // piece 3: a sneaky hacker, named — pops up, ringed while said, listening;
  // piece 4: grabs a copy of the jumble, grinning; piece 5: reads only
  // gibberish — "?", the key crossed out, sulks — bad luck — and slinks off
  function grabPart() {
    const hk = sinceLaunch('xg:hk', t, 5.0, idle)
    if (hk < 0) return
    const up = clamp01(hk / 0.5)
    const ring = bounce(hk, 0.4, 2.8, 0.4)
    const off = tween(t, 11.6, 1.6)
    const hx = b.W * 0.8 + off * b.W * 0.35
    const hy = b.UH * 0.82 + (1 - easeInOut(up)) * 40 * k
    const grab = tween(t, 7.6, 0.8)
    const huh = bounce(sinceLaunch('xg:huh', t, 10.1, idle), 0.35, 999, 0.1)
    const sad = tween(t, 10.9, 0.2)
    const mood = sad > 0 ? 'sad' : huh > 0 ? 'huh' : 'grin'
    const grin = bounce(sinceLaunch('xg:grin', t, 8.3, idle), 0.3, 1.0, 0.3)
    faded(ctx, up * (1 - off), () => {
      listening(ctx, hx, hy, 27 * k, idle, 1 - grab)
      scaledAbout(ctx, hx, hy, 1 + 0.12 * grin, () => hacker(ctx, hx, hy, 27 * k, { mood, look: grab > 0 && grab < 1 ? -1 : Math.sin(idle * 1.3) * 0.6, glow: 0.5 + 0.5 * Math.sin(idle * 4) }))
    })
    if (ring > 0) marker(ctx, hx, hy + 16 * k, 52 * k, idle, Math.min(1, ring))
    if (grab > 0) {
      // the stolen copy flies from the jumble to the hacker
      const tx = hx - 190 * k
      const ty = b.UH * 0.84
      const fx = lerp(b.W / 2, tx, easeInOut(grab))
      const fy = lerp(b.UH * 0.64, ty, easeInOut(grab)) - Math.sin(grab * Math.PI) * 30 * k
      faded(ctx, 1 - off, () => wobblyLine(ctx, FUNNY_JUMBLE, fx, fy, 26 * k, AMBER_SOFT, idle, grab >= 1 ? 1 : 0.3))
      if (huh > 0) {
        faded(ctx, 1 - off, () => {
          for (const [dx, dy, s2] of [[-80, -56, 36], [0, -70, 28], [70, -50, 32]]) big(ctx, '?', tx + dx * k, ty + dy * k, s2 * k * Math.min(1.15, huh), AMBER_SOFT)
          keyIcon(ctx, tx - 20 * k, ty + 48 * k, 16 * k, Math.min(1, huh) * 0.5)
          cross(ctx, tx + 8 * k, ty + 48 * k, 18 * k, Math.min(1, huh))
        })
      }
    }
  }
}

// ---------- 📡 the jumble flies ----------

function drawFly(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const g = street(ctx, b, idle, tween(t, 0.1, 0.5))
  const k = g.k
  // piece 1's event: the jumble's bits ride the waves toward the neighbours
  const go = sinceLaunch('xf:go', t, 0.2, idle)
  const bits = JUMBLE_BITS.join('')
  if (go >= 0) {
    for (let i = 0; i < 16; i++) {
      const q = clamp01((go * 0.8 - i * 0.05) % 1.3)
      if (q <= 0 || q >= 1) continue
      const x = lerp(g.boy.x + 40 * k, g.nb.x + 30 * k, q)
      const y = lerp(g.ground - 80 * k, g.ground - 200 * k, q) - Math.sin(q * Math.PI) * 60 * k
      lamp(ctx, x, y, 5 * k, bits[i] === '1' ? 1 : 0)
    }
  }
  // piece 2's event: the antenna catches every bit — a row of them
  const caught = tween(t, 2.7, 1.0)
  if (caught > 0) lampRow(ctx, g.nb.x, g.ground - 300 * k, bits, { r: 5 * k, gap: 13 * k, pop: (i) => clamp01(caught * 16 - i) })
  // piece 3's event: all they get is RG — ✕
  const rg = bounce(sinceLaunch('xf:rg', t, 5.2, idle), 0.35, 999, 0.1)
  if (rg > 0) {
    scaledAbout(ctx, g.nb.x, g.ground - 240 * k, Math.min(1.15, rg), () => bubble(ctx, g.nb.x, g.ground - 240 * k, 80 * k, 1, 1, 0, JUMBLE_TEXT))
    cross(ctx, g.nb.x + 70 * k, g.ground - 240 * k, 16 * k, Math.min(1, rg))
    keyIcon(ctx, g.nb.x - 120 * k, g.ground - 240 * k, 12 * k, 0.4)
  }
}

// ---------- 🔓 Grandma unmixes ----------

function drawUnmix(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // Grandma's tablet, in her house
  house(ctx, b.W * 0.9, b.UH * 0.95, k * 0.8)
  // piece 1: the same key — it bounces on her tablet as it is named
  const named = bounce(sinceLaunch('xu:key', t, 0, idle) - 1.6, 0.4, 1.6, 0.45)
  // piece 2's event: the same bits flip back
  mixRows(ctx, b, t, JUMBLE_BITS[0], SECRET_KEY[0], MESSAGE_BITS[0], {
    topLetter: JUMBLE_TEXT[0],
    outLetter: SECRET_MESSAGE[0],
    rowsAt: 0.1,
    flipAt: 2.7,
    keepAt: 3.2,
    flipGlow: named,
  })
  // piece 3's event: the message — hi
  const hi = bounce(sinceLaunch('xu:hi', t, 5.3, idle), 0.4, 999, 0.1)
  if (hi > 0) scaledAbout(ctx, b.W / 2, b.UH * 0.82, Math.min(1.15, hi), () => bubble(ctx, b.W / 2, b.UH * 0.82, 110 * k, 1, 1, 0))
}

// ---------- 🎨 the paint trick ----------

type Side = 0 | 1 // 0 = the boy (left), 1 = Grandma (right)

/** where everything stands in the paint beats */
function paintGeo(b: Box) {
  const k = K(b)
  const cx = [b.W * 0.2, b.W * 0.8]
  const dir = [1, -1] // towards the middle
  const bs = 54 * k
  const bucketAt = (sd: Side) => ({ x: cx[sd] + dir[sd] * b.W * 0.035, y: b.UH * 0.7 })
  return {
    k,
    cx,
    dir,
    bs,
    ps: 26 * k,
    halfW: b.W * 0.17,
    wallTop: b.UH * 0.3,
    wallBot: b.UH * 0.8,
    roofTop: b.UH * 0.19,
    person: (sd: Side) => ({ x: cx[sd] - dir[sd] * b.W * 0.105, y: b.UH * 0.79 }),
    bucketAt,
    /** where a secret pot pours from: above the bucket, on the outer side */
    pourAt: (sd: Side) => ({ x: bucketAt(sd).x - dir[sd] * bs * 1.05, y: bucketAt(sd).y - bs * 1.6 }),
    cupboard: (sd: Side) => ({ x: cx[sd] + dir[sd] * b.W * 0.085, y: b.UH * 0.39 }),
    hacker: { x: b.W / 2, y: b.UH * 0.45 },
    /** the hacker's copies: orange, yellow, green */
    copyAt: (i: number) => ({ x: b.W / 2 + (i - 1) * 56 * k, y: b.UH * 0.7 }),
  }
}
type PaintGeo = ReturnType<typeof paintGeo>

/** blend two #rrggbb colors */
function blend(a: string, c: string, q: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  const ch = (i: number) => Math.round(p(a, i) + (p(c, i) - p(a, i)) * clamp01(q))
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

/** a see-through bucket of paint, centred on (x, y); `layers` (0–1) pulls
 *  the paint apart into what went in (bottom first) */
function bucket(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, layers = 0, inside: string[] = [], alpha = 1) {
  faded(ctx, alpha, () => {
    const tw = 0.68 * s
    const bw = 0.52 * s
    const top = y - 0.55 * s
    const bot = y + 0.55 * s
    const shape = () => {
      ctx.beginPath()
      ctx.moveTo(x - tw, top)
      ctx.lineTo(x + tw, top)
      ctx.lineTo(x + bw, bot)
      ctx.lineTo(x - bw, bot)
      ctx.closePath()
    }
    ctx.save()
    shape()
    ctx.fillStyle = 'rgba(226, 232, 240, 0.12)'
    ctx.fill()
    ctx.clip()
    const surf = top + 0.2 * s
    const a0 = ctx.globalAlpha
    if (layers < 1) {
      ctx.globalAlpha = a0 * (1 - layers)
      ctx.fillStyle = color
      ctx.fillRect(x - tw, surf, 2 * tw, bot - surf)
    }
    if (layers > 0 && inside.length) {
      ctx.globalAlpha = a0 * layers
      const h = (bot - surf) / inside.length
      const gap = 0.07 * s * layers
      inside.forEach((c, i) => {
        ctx.fillStyle = c
        ctx.fillRect(x - tw, bot - (i + 1) * h + gap / 2, 2 * tw, h - gap)
      })
    }
    ctx.restore()
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)'
    ctx.lineWidth = 2
    shape()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, top, tw * 0.85, Math.PI * 1.05, Math.PI * 1.95)
    ctx.stroke()
  })
}

/** a pot of paint tipping (`tilt` 0–1) towards `dir`, pouring (`flow`) onto
 *  a point below */
function pouringPot(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, dir: number, tilt: number, flow: number, to: { x: number; y: number }, alpha = 1) {
  const a = dir * tilt * 1.9
  if (flow > 0) {
    // the lip: the pot's top, turned with it
    const lx = x + Math.sin(a) * s * 0.6
    const ly = y - Math.cos(a) * s * 0.6
    ctx.save()
    ctx.globalAlpha *= alpha * Math.min(1, flow * 4) * Math.min(1, (1 - flow) * 6 + 0.2)
    ctx.strokeStyle = color
    ctx.lineWidth = s * 0.28
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lx, ly)
    ctx.quadraticCurveTo(lx + dir * s * 0.3, ly + s * 0.2, to.x, to.y)
    ctx.stroke()
    ctx.restore()
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(a)
  pot(ctx, 0, 0, s, color, alpha)
  ctx.restore()
}

/** a cupboard on the wall; `open` 0–1 */
function cupboard(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, open: number, back = true) {
  const w = s * 2.6
  const h = s * 2.4
  if (back) {
    ctx.fillStyle = '#2b1a10'
    ctx.fillRect(x - w / 2, y - h / 2, w, h)
    ctx.strokeStyle = '#92400e'
    ctx.lineWidth = 3
    ctx.strokeRect(x - w / 2, y - h / 2, w, h)
    return
  }
  // the door, folding open to the left
  const dw = w * (1 - 0.88 * open)
  ctx.fillStyle = '#78350f'
  ctx.fillRect(x - w / 2, y - h / 2, dw, h)
  ctx.strokeStyle = '#92400e'
  ctx.lineWidth = 2
  ctx.strokeRect(x - w / 2, y - h / 2, dw, h)
  if (open < 0.5) {
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(x - w / 2 + dw - 7, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Grandma: grey hair in a bun, glasses; feet at (x, y) */
function grandma(ctx: CanvasRenderingContext2D, x: number, y: number, k: number) {
  ctx.fillStyle = '#7e3f8f'
  ctx.beginPath()
  ctx.moveTo(x - 26 * k, y)
  ctx.lineTo(x - 16 * k, y - 76 * k)
  ctx.lineTo(x + 16 * k, y - 76 * k)
  ctx.lineTo(x + 26 * k, y)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = SKIN
  ctx.beginPath()
  ctx.arc(x, y - 96 * k, 19 * k, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.arc(x, y - 102 * k, 19 * k, Math.PI * 1.0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y - 122 * k, 9 * k, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 2
  for (const dx of [-7, 7]) {
    ctx.beginPath()
    ctx.arc(x + dx * k, y - 94 * k, 5 * k, 0, Math.PI * 2)
    ctx.stroke()
  }
}

/** a cartoon hacker: hood, bandit mask, laptop; head at (x, y). `look`
 *  (−1…1) turns the eyes; mood: a sly grin, puzzled, or sulking */
function hacker(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, o: { look?: number; mood?: 'grin' | 'huh' | 'sad'; alpha?: number; glow?: number } = {}) {
  faded(ctx, o.alpha ?? 1, () => {
    const look = o.look ?? 0
    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.moveTo(x - 1.4 * s, y + 2.4 * s)
    ctx.quadraticCurveTo(x - 1.4 * s, y + 0.6 * s, x, y + 0.6 * s)
    ctx.quadraticCurveTo(x + 1.4 * s, y + 0.6 * s, x + 1.4 * s, y + 2.4 * s)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, y, 1.15 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = SKIN
    ctx.beginPath()
    ctx.arc(x, y + 0.12 * s, 0.78 * s, 0, Math.PI * 2)
    ctx.fill()
    // the bandit mask
    ctx.fillStyle = '#0b0f19'
    ctx.beginPath()
    ctx.roundRect(x - 0.84 * s, y - 0.24 * s, 1.68 * s, 0.44 * s, 0.2 * s)
    ctx.fill()
    for (const ex of [-0.32, 0.32]) {
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.ellipse(x + ex * s, y - 0.02 * s, 0.17 * s, 0.13 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(x + ex * s + look * 0.08 * s, y - 0.02 * s, 0.075 * s, 0, Math.PI * 2)
      ctx.fill()
    }
    // sly brows, or puzzled ones
    ctx.strokeStyle = '#0b0f19'
    ctx.lineWidth = 0.1 * s
    ctx.lineCap = 'round'
    const mood = o.mood ?? 'grin'
    for (const sg of [-1, 1]) {
      ctx.beginPath()
      if (mood === 'grin') {
        ctx.moveTo(x + sg * 0.55 * s, y - 0.42 * s)
        ctx.lineTo(x + sg * 0.15 * s, y - 0.3 * s)
      } else {
        ctx.moveTo(x + sg * 0.55 * s, y - 0.32 * s)
        ctx.lineTo(x + sg * 0.15 * s, y - 0.44 * s)
      }
      ctx.stroke()
    }
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 0.09 * s
    ctx.beginPath()
    if (mood === 'grin') ctx.arc(x + 0.05 * s, y + 0.3 * s, 0.32 * s, Math.PI * 0.15, Math.PI * 0.85)
    else if (mood === 'sad') ctx.arc(x, y + 0.72 * s, 0.3 * s, Math.PI * 1.2, Math.PI * 1.8)
    else {
      ctx.moveTo(x - 0.25 * s, y + 0.46 * s)
      ctx.lineTo(x - 0.08 * s, y + 0.38 * s)
      ctx.lineTo(x + 0.08 * s, y + 0.48 * s)
      ctx.lineTo(x + 0.25 * s, y + 0.4 * s)
    }
    ctx.stroke()
    // the laptop, its lid towards us
    ctx.fillStyle = '#64748b'
    ctx.beginPath()
    ctx.roundRect(x - 0.95 * s, y + 1.3 * s, 1.9 * s, 1.05 * s, 0.1 * s)
    ctx.fill()
    ctx.fillStyle = `rgba(74, 222, 128, ${0.35 + 0.65 * (o.glow ?? 0)})`
    ctx.beginPath()
    ctx.arc(x, y + 1.82 * s, 0.16 * s, 0, Math.PI * 2)
    ctx.fill()
  })
}

/** "listening": faint arcs from the hacker's head towards both sides */
function listening(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, idle: number, alpha: number) {
  if (alpha <= 0) return
  ctx.save()
  ctx.lineWidth = 2
  for (const sg of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const q = (idle * 0.8 + i / 3) % 1
      ctx.strokeStyle = `rgba(74, 222, 128, ${alpha * 0.6 * (1 - q)})`
      ctx.beginPath()
      ctx.arc(x, y, s * (1.5 + q * 2.2), sg > 0 ? -0.45 : Math.PI - 0.45, sg > 0 ? 0.45 : Math.PI + 0.45)
      ctx.stroke()
    }
  ctx.restore()
}

/** the two homes, the people in them, the cupboards */
function paintHomes(ctx: CanvasRenderingContext2D, g: PaintGeo, doors: [number, number], pots: Array<{ x: number; y: number; tilt: number; flow: number; alpha: number } | null>, buckets: Array<{ x: number; y: number; color: string; layers?: number; scale?: number }>, colors: string[]) {
  const k = g.k
  for (const sd of [0, 1] as Side[]) {
    const x = g.cx[sd]
    ctx.fillStyle = '#152035'
    ctx.fillRect(x - g.halfW, g.wallTop, 2 * g.halfW, g.wallBot - g.wallTop)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 3
    ctx.strokeRect(x - g.halfW, g.wallTop, 2 * g.halfW, g.wallBot - g.wallTop)
    ctx.fillStyle = '#7c2d12'
    ctx.beginPath()
    ctx.moveTo(x - g.halfW - 12 * k, g.wallTop)
    ctx.lineTo(x, g.roofTop)
    ctx.lineTo(x + g.halfW + 12 * k, g.wallTop)
    ctx.closePath()
    ctx.fill()
    const pp = g.person(sd)
    if (sd === 0) child(ctx, pp.x, pp.y, k)
    else grandma(ctx, pp.x, pp.y, k)
    const cb = g.cupboard(sd)
    cupboard(ctx, cb.x, cb.y, g.ps, doors[sd])
  }
  // the secret pots (inside a cupboard they are drawn before its door)
  pots.forEach((p, sd) => {
    if (!p || p.alpha <= 0) return
    pouringPot(ctx, p.x, p.y, g.ps, colors[sd], g.dir[sd], p.tilt, p.flow, { x: g.bucketAt(sd as Side).x, y: g.bucketAt(sd as Side).y - g.bs * 0.35 }, p.alpha)
  })
  for (const sd of [0, 1] as Side[]) {
    const cb = g.cupboard(sd)
    cupboard(ctx, cb.x, cb.y, g.ps, doors[sd], false)
  }
  for (const bk of buckets) bucket(ctx, bk.x, bk.y, g.bs * (bk.scale ?? 1), bk.color, bk.layers ?? 0, [PAINT.shared.css, PAINT.boySecret.css, PAINT.granSecret.css])
}

/** the hacker's copies of what flew past (orange, yellow, green) */
function hackerCopies(ctx: CanvasRenderingContext2D, g: PaintGeo, a: [number, number, number], idle: number, shake = 0, dx = 0) {
  const css = [PAINT.boyMix.css, PAINT.shared.css, PAINT.granMix.css]
  for (let i = 0; i < 3; i++) {
    if (a[i] <= 0) continue
    const c = g.copyAt(i)
    const wob = shake * Math.sin(idle * 22 + i * 2) * 0.35
    ctx.save()
    ctx.translate(c.x + dx, c.y)
    ctx.rotate(wob)
    scaledAbout(ctx, 0, 0, Math.min(1.2, a[i]), () => bucket(ctx, 0, 0, g.bs * 0.55, css[i]))
    ctx.restore()
  }
}

// piece 1: the hacker, named, appears and listens; piece 2: the real maths is
// hard — a tangle of numbers crossed out, three simple paints instead;
// piece 3: a yellow bucket on each side; the hacker sees it (a copy)
function drawPaint(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = paintGeo(b)
  const k = g.k
  const yellowIn = (sd: Side) => bounce(sinceLaunch(`xp:y${sd}`, t, 5.1 + sd * 0.25, idle), 0.35, 999, 0.1)
  const buckets = ([0, 1] as Side[]).filter((sd) => yellowIn(sd) > 0).map((sd) => ({ ...g.bucketAt(sd), color: PAINT.shared.css, scale: Math.min(1.15, yellowIn(sd)) }))
  paintHomes(ctx, g, [0, 0], [null, null], buckets, [PAINT.boySecret.css, PAINT.granSecret.css])
  // the hacker pops up as named, ringed while said
  const hk = sinceLaunch('xp:hk', t, 0, idle)
  const up = clamp01(hk / 0.5)
  const ring = bounce(hk, 0.4, 2.6, 0.4)
  const look = t < 5.3 ? Math.sin(idle * 1.3) * 0.6 : t < 5.9 ? -1 : t < 6.5 ? 1 : 0
  listening(ctx, g.hacker.x, g.hacker.y, 30 * k, idle, tween(t, 0.6, 0.6))
  hacker(ctx, g.hacker.x, g.hacker.y + (1 - easeInOut(up)) * 40 * k, 30 * k, { alpha: up, look, glow: 0.5 + 0.5 * Math.sin(idle * 4) })
  if (ring > 0) marker(ctx, g.hacker.x, g.hacker.y + 16 * k, 58 * k, idle, Math.min(1, ring))
  // piece 2's event: hard maths, crossed out → paint
  const yM = b.UH * 0.12
  const maths = tween(t, 2.6, 0.4) * (1 - tween(t, 4.0, 0.4))
  if (maths > 0)
    faded(ctx, maths, () => {
      text(ctx, '5³⁸⁷ mod 1019 = ?', b.W / 2 + Math.sin(idle * 9) * 2, yM, '#94a3b8', 26 * k, '700')
    })
  if (t > 3.4 && t < 4.4) cross(ctx, b.W / 2, yM, 36 * k, tween(t, 3.4, 0.3) * (1 - tween(t, 4.0, 0.4)))
  for (let i = 0; i < 3; i++) {
    const p = bounce(sinceLaunch(`xp:pt${i}`, t, 4.2 + i * 0.15, idle), 0.35, 999, 0.1)
    if (p > 0) pot(ctx, b.W / 2 + (i - 1) * 64 * k, yM, 28 * k * Math.min(1.2, p), [PAINT.shared.css, PAINT.boySecret.css, PAINT.granSecret.css][i])
  }
  // piece 3: the hacker sees the yellow too
  hackerCopies(ctx, g, [0, bounce(sinceLaunch('xp:cy', t, 6.6, idle), 0.35, 999, 0.1), 0], idle)
}

// piece 1: the boy pours red → orange; piece 2: Grandma pours blue →
// green; piece 3: the rest of each secret goes into the cupboard; piece 4:
// the buckets swap over the hacker, who keeps a copy of each
function drawPour(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = paintGeo(b)
  const k = g.k
  const at = [0.1, 2.6]
  const mixes = [PAINT.boyMix.css, PAINT.granMix.css]
  const pots = ([0, 1] as Side[]).map((sd) => {
    const s0 = at[sd]
    const appear = tween(t, s0, 0.3)
    if (appear <= 0) return null
    const tilt = tween(t, s0 + 0.3, 0.4) * (1 - tween(t, s0 + 1.8, 0.4))
    const flow = clamp01((t - s0 - 0.6) / 1.2)
    // piece 3: away into the cupboard
    const away = tween(t, 5.1 + sd * 0.15, 0.8)
    const P = g.pourAt(sd)
    const C = g.cupboard(sd)
    return { x: lerp(P.x, C.x, away), y: lerp(P.y, C.y, away) - Math.sin(away * Math.PI) * 30 * k, tilt, flow: flow > 0 && flow < 1 ? flow : 0, alpha: appear }
  })
  const doors: [number, number] = [1 - tween(t, 6.0, 0.5), 1 - tween(t, 6.15, 0.5)]
  // piece 4: the swap
  const send = tween(t, 7.6, 1.3)
  const buckets = ([0, 1] as Side[]).map((sd) => {
    const mixQ = tween(t, at[sd] + 0.8, 1.1)
    const from = g.bucketAt(sd)
    const to = g.bucketAt((1 - sd) as Side)
    return { x: lerp(from.x, to.x, send), y: lerp(from.y, to.y, send) - Math.sin(send * Math.PI) * b.UH * 0.52, color: blend(PAINT.shared.css, mixes[sd], mixQ) }
  })
  paintHomes(ctx, g, doors, pots, buckets, [PAINT.boySecret.css, PAINT.granSecret.css])
  const look = send > 0 && send < 1 ? Math.sin(send * Math.PI * 3) : Math.sin(idle * 1.3) * 0.6
  const grin = bounce(sinceLaunch('xu:grin', t, 8.3, idle), 0.3, 1.2, 0.3)
  listening(ctx, g.hacker.x, g.hacker.y, 30 * k, idle, 1)
  scaledAbout(ctx, g.hacker.x, g.hacker.y, 1 + 0.12 * grin, () => hacker(ctx, g.hacker.x, g.hacker.y, 30 * k, { look, glow: 0.5 + 0.5 * Math.sin(idle * 4) }))
  const cp = (i: number) => bounce(sinceLaunch(`xu:c${i}`, t, 8.2 + (i === 2 ? 0.1 : 0), idle), 0.35, 999, 0.1)
  hackerCopies(ctx, g, [cp(0), 1, cp(2)], idle)
}

// piece 1: the boy's hidden red → into the green: brown; piece 2: Grandma's
// blue → into the orange: brown; piece 3: inside each, yellow, red and blue
// (layers), then mixed back; piece 4: brown = brown, the key; piece 5: the
// hacker shakes the copies, cannot unmix them — bad luck — and slinks off
function drawBrown(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = paintGeo(b)
  const k = g.k
  const at = [0.1, 2.6]
  const got = [PAINT.granMix.css, PAINT.boyMix.css] // after the swap
  const pots = ([0, 1] as Side[]).map((sd) => {
    const s0 = at[sd]
    const out = tween(t, s0 + 0.2, 0.6)
    const tilt = tween(t, s0 + 0.8, 0.35) * (1 - tween(t, s0 + 1.9, 0.35))
    const flow = clamp01((t - s0 - 1.0) / 1.0)
    const C = g.cupboard(sd)
    const P = g.pourAt(sd)
    return { x: lerp(C.x, P.x, out), y: lerp(C.y, P.y, out) - Math.sin(out * Math.PI) * 30 * k, tilt, flow: flow > 0 && flow < 1 ? flow : 0, alpha: 1 - tween(t, s0 + 2.2, 0.3) }
  })
  const doors: [number, number] = [tween(t, at[0], 0.3), tween(t, at[1], 0.3)]
  // piece 3: what is inside — pulled apart, then mixed back
  const layers = tween(t, 5.1, 0.6) * (1 - tween(t, 6.9, 0.5))
  const buckets = ([0, 1] as Side[]).map((sd) => ({
    ...g.bucketAt(sd),
    color: blend(got[sd], PAINT.both.css, tween(t, at[sd] + 1.1, 1.0)),
    layers,
    scale: 1 + 0.3 * layers,
  }))
  paintHomes(ctx, g, doors, pots, buckets, [PAINT.boySecret.css, PAINT.granSecret.css])
  // piece 4: the same brown on both sides — the key
  const eq = bounce(sinceLaunch('xb:eq', t, 7.6, idle), 0.4, 999, 0.1)
  if (eq > 0) {
    for (const sd of [0, 1] as Side[]) {
      const bk = g.bucketAt(sd)
      marker(ctx, bk.x, bk.y, g.bs * 0.95, idle, Math.min(1, eq))
      keyIcon(ctx, bk.x - 16 * k, bk.y + g.bs * 0.95 + 6 * k, 12 * k, Math.min(1, eq))
    }
    const y = b.UH * 0.91
    faded(ctx, Math.min(1, eq), () => {
      bucket(ctx, b.W * 0.36, y, g.bs * 0.6, PAINT.both.css)
      big(ctx, '=', b.W / 2, y, 44 * k * Math.min(1.15, eq), AMBER_SOFT)
      bucket(ctx, b.W * 0.64, y, g.bs * 0.6, PAINT.both.css)
    })
  }
  // piece 5: the hacker tries to unmix — and cannot; then slinks off
  const tries = tween(t, 10.1, 0.2) * (1 - tween(t, 11.2, 0.3))
  const huh = bounce(sinceLaunch('xb:huh', t, 10.4, idle), 0.35, 999, 0.1)
  const fail = tween(t, 11.1, 0.3)
  const off = tween(t, 12.4, 1.6)
  const hx = g.hacker.x
  const hy = g.hacker.y + off * b.UH * 0.5
  const mood = fail > 0 ? 'sad' : huh > 0 ? 'huh' : 'grin'
  faded(ctx, 1 - off, () => {
    listening(ctx, hx, hy, 30 * k, idle, 1 - tween(t, 10.1, 0.4))
    hacker(ctx, hx, hy, 30 * k, { look: Math.sin(idle * 1.3) * 0.6, mood, glow: 0.5 + 0.5 * Math.sin(idle * 4) })
    hackerCopies(ctx, g, [1, 1, 1], idle, tries, 0)
  })
  if (huh > 0 && off < 1) {
    // a thought bubble: which colors went in? two unknowns
    const by = b.UH * 0.12
    faded(ctx, Math.min(1, huh) * (1 - off), () => {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.95)'
      ctx.beginPath()
      ctx.roundRect(hx - 72 * k, by - 26 * k, 144 * k, 52 * k, 24 * k)
      ctx.fill()
      for (const [dx, dy, r] of [[-8, 36, 8], [-2, 54, 5]]) {
        ctx.beginPath()
        ctx.arc(hx + dx * k, by + dy * k, r * k, 0, Math.PI * 2)
        ctx.fill()
      }
      // the yellow everyone saw, then the two secrets: unknown
      ctx.fillStyle = PAINT.shared.css
      ctx.beginPath()
      ctx.arc(hx - 40 * k, by, 14 * k, 0, Math.PI * 2)
      ctx.fill()
      for (const dx of [0, 40]) {
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.arc(hx + dx * k, by, 14 * k, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        text(ctx, '?', hx + dx * k, by, '#475569', 20 * k * Math.min(1.15, huh), '800')
      }
    })
    if (fail > 0) cross(ctx, hx, by, 30 * k, fail * (1 - off))
  }
}

// ---------- 🔁 the drill-in ----------

function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const y = b.UH * 0.46
  const xs = [0.18, 0.5, 0.82].map((q) => b.W * q)
  faded(ctx, open, () => {
    // ① the key flips some bits: hi → RG
    const a1 = tween(t, 2.6, 0.4)
    if (a1 > 0) {
      faded(ctx, a1, () => {
        bubble(ctx, xs[0], y - 60 * k, 70 * k, 1, 1, 0)
        keyIcon(ctx, xs[0] - 22 * k, y, 14 * k)
        bubble(ctx, xs[0], y + 60 * k, 70 * k, tween(t, 3.2, 0.4), 1, 0, JUMBLE_TEXT)
      })
      stepRing(ctx, xs[0], y, 90 * k, 1, idle, a1 * (1 - tween(t, 5.0, 0.4)))
    }
    // ② the jumble flies; anyone can catch it
    const a2 = tween(t, 5.1, 0.4)
    if (a2 > 0) {
      arrow(ctx, xs[0] + 50 * k, y + 60 * k, xs[1] - 50 * k, y, a2)
      faded(ctx, a2, () => {
        bubble(ctx, xs[1], y, 70 * k, 1, 1, 0, JUMBLE_TEXT)
        hacker(ctx, xs[1], y - 120 * k, 20 * k, { mood: t > 6.2 ? 'huh' : 'grin', look: Math.sin(idle * 1.3) * 0.6 })
      })
      stepRing(ctx, xs[1], y, 90 * k, 2, idle, a2 * (1 - tween(t, 7.5, 0.4)))
    }
    // ③ the same key flips them back
    const a3 = tween(t, 7.6, 0.4)
    if (a3 > 0) {
      arrow(ctx, xs[1] + 50 * k, y, xs[2] - 50 * k, y - 60 * k, a3)
      faded(ctx, a3, () => {
        bubble(ctx, xs[2], y - 60 * k, 70 * k, 1, 1, 0, JUMBLE_TEXT)
        keyIcon(ctx, xs[2] - 22 * k, y, 14 * k)
        bubble(ctx, xs[2], y + 60 * k, 70 * k, tween(t, 8.2, 0.4), 1, 0)
      })
      stepRing(ctx, xs[2], y, 90 * k, 3, idle, a3)
    }
  })
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

// ---------- 🎈 the padlock ----------

function drawPadlock(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const k = K(b)
  // piece 1: a phone; the padlock bounces as it is named
  const P = { x: b.W * 0.28, y: b.UH * 0.4, w: b.W * 0.32, h: b.UH * 0.56 }
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.roundRect(P.x - P.w / 2, P.y - P.h / 2, P.w, P.h, 26 * k)
  ctx.fill()
  ctx.fillStyle = '#0b1226'
  ctx.fillRect(P.x - P.w / 2 + 12 * k, P.y - P.h / 2 + 30 * k, P.w - 24 * k, P.h - 60 * k)
  // the address bar with its padlock
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(P.x - P.w / 2 + 22 * k, P.y - P.h / 2 + 44 * k, P.w - 44 * k, 34 * k, 17 * k)
  ctx.fill()
  const lockN = bounce(sinceLaunch('xl:lock', t, 0, idle) - 2.8, 0.4, 1.8, 0.45)
  scaledAbout(ctx, P.x - P.w / 2 + 44 * k, P.y - P.h / 2 + 61 * k, 1 + 0.8 * lockN, () => padlock(ctx, P.x - P.w / 2 + 44 * k, P.y - P.h / 2 + 61 * k, 16 * k))
  if (lockN > 0) marker(ctx, P.x - P.w / 2 + 44 * k, P.y - P.h / 2 + 61 * k, 26 * k, idle, Math.min(1, lockN))
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = 'rgba(100, 116, 139, 0.5)'
    ctx.fillRect(P.x - P.w / 2 + 30 * k, P.y - P.h / 2 + 110 * k + i * 36 * k, (P.w - 60 * k) * (i % 2 ? 0.7 : 0.9), 14 * k)
  }
  // piece 2's event: the Wi-Fi password — a key too
  const pw = tween(t, 2.7, 0.6)
  if (pw > 0)
    faded(ctx, pw, () => {
      const x = b.W * 0.72
      const y = b.UH * 0.22
      ctx.fillStyle = 'rgba(30, 41, 59, 0.9)'
      ctx.beginPath()
      ctx.roundRect(x - 150 * k, y - 34 * k, 300 * k, 68 * k, 14 * k)
      ctx.fill()
      text(ctx, '📶', x - 116 * k, y, BRIGHT, 26 * k)
      text(ctx, '••••••••', x + 10 * k, y + 4 * k, BRIGHT, 30 * k, '700')
      const kb = bounce(sinceLaunch('xl:pw', t, 2.8, idle), 0.4, 999, 0.1)
      keyIcon(ctx, x + 90 * k, y + 50 * k, 18 * k * Math.min(1.15, kb))
    })
  // piece 3's event: a real key: 128 bits — 2¹²⁸ different keys
  const long = tween(t, 5.2, 1.4)
  if (long > 0) {
    const bits = Array.from({ length: 128 }, (_, i) => (((i * 37 + 11) % 7) < 3 ? '1' : '0')).join('')
    const x0 = b.W * 0.72
    for (let r = 0; r < 4; r++)
      lampRow(ctx, x0, b.UH * 0.42 + r * 22 * k, bits.slice(r * 32, r * 32 + 32), { r: 3.4 * k, gap: 9 * k, pop: (i) => clamp01(long * 4.5 - r - i / 32) })
    const nA = tween(t, 6.6, 0.5)
    if (nA > 0)
      faded(ctx, nA, () => {
        const n = realKeyCount().toLocaleString('en')
        const parts = n.split(',')
        const half = Math.ceil(parts.length / 2)
        text(ctx, parts.slice(0, half).join(',') + ',', x0, b.UH * 0.6, AMBER_SOFT, 15 * k, '700')
        text(ctx, parts.slice(half).join(','), x0, b.UH * 0.6 + 22 * k, AMBER_SOFT, 15 * k, '700')
        text(ctx, 'different keys', x0, b.UH * 0.6 + 46 * k, HINT, 13 * k)
      })
  }
  // the end: the picture dims slowly, then the stories menu comes back
  const dim = tween(t, SECRET_T.padlock - 2.2, 2.0)
  if (dim > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${0.92 * dim})`
    ctx.fillRect(0, 0, b.W, b.H)
  }
}

export function drawSecretBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') drawQuestion(ctx, b, t, idle)
  else if (beat === 'key') drawKey(ctx, b, t, idle)
  else if (beat === 'mix') drawMix(ctx, b, t, idle)
  else if (beat === 'gibberish') drawGibberish(ctx, b, t, idle)
  else if (beat === 'fly') drawFly(ctx, b, t, idle)
  else if (beat === 'unmix') drawUnmix(ctx, b, t, idle)
  else if (beat === 'paint') drawPaint(ctx, b, t, idle)
  else if (beat === 'pour') drawPour(ctx, b, t, idle)
  else if (beat === 'brown') drawBrown(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else drawPadlock(ctx, b, t, idle)
}
