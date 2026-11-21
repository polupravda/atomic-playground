import { blit, clamp01, easeInOut, easeOut } from './canvasUtil'
import { drawGlossyParticle } from './particleStyle'
import { AMBER, AMBER_SOFT, GREY, electronSprite, frac, lerp, marker, nucleusSprite, rnd, tag, text } from './storyDraw'
import { drawWavePacket, ordinaryCss } from './lightPacket'
import { wavelengthToCss } from '../core/spectra'
import { CHROMIUM, PUMP_NM, RUBY_NM, columnSize } from '../core/laser'

// R08 — 🔦 How a laser makes its light (proposal:
// docs/how-things-work/16-proposal-laser-stories.md, story 1). One
// question — why does a torch beam spread but a laser dot stay tiny? — one
// aha — light copies itself, and two mirrors keep the copies marching back
// and forth until they leave as one thin beam. Words taught: laser, ruby,
// flash lamp, chromium. Hero: one red photon in the amber ring.
//   question  a torch and a laser on a wall that moves away: the circle
//             grows big and dim, the dot stays a dot
//   inside    the laser opens: ruby, coiled flash lamp, a mirror at each
//             end — the right one only partly silver (named one by one)
//   zoom      into the ruby, to one chromium atom with its lone outer
//             electron (centred)
//   flash     the lamp flashes; one green photon flies onto our electron,
//             is swallowed (its energy = a push), the push lifts the
//             electron to a bigger ring farther from the middle (said,
//             shown, then explained); then the neighbours go up
//   fall      a lifted electron falls by itself: a red photon any way at
//             all — how an ordinary lamp glows
//   twin      our photon passes the lifted electron: it falls and a TWIN is
//             born on the atom — same color, same direction, in step
//   mirrors   zoom out to the rod: the column bounces between the mirrors
//             and grows every trip; sideways photons just leave
//   beam      a few slip out through the partly-silver mirror: the beam —
//             and back to the wall: the dot stays tiny
// Light is the Light lab's photon packet (shared drawWavePacket): ruby red
// with a longer wiggle than the lamp's green (green is the shorter wave);
// the torch's light is the bone photo's warm white. Atoms are the app's
// atoms. Key motion runs on story time `t`; life (electrons circling, the
// wiggles crawling, the marker's pulse) on the idle clock. LIGHT NEVER
// FREEZES (Elena, 2026-11-20/21): in the held beats (flash, fall) story time
// only says WHEN a photon sets off — its flight then runs on the idle clock
// (`sinceLaunch`), so a hold while the voice speaks never stops it.

export const LASER_ORDER = ['question', 'inside', 'zoom', 'flash', 'fall', 'twin', 'mirrors', 'beam'] as const
export type LaserBeat = (typeof LASER_ORDER)[number]

/** story seconds per beat: a 2.5 s watch break per science piece; flow
 *  beats (zoom, mirrors) are fitted to their lines */
export const LASER_T: Record<LaserBeat, number> = {
  question: 10,
  inside: 12.5,
  zoom: 8,
  flash: 16,
  fall: 5,
  twin: 7.5,
  mirrors: 14,
  beam: 16,
}

interface Box {
  W: number
  UH: number
  H: number
}

const RED = (a: number) => wavelengthToCss(RUBY_NM, a)
const GREEN = (a: number) => wavelengthToCss(PUMP_NM, a)
const RED_LAMBDA = 22
const GREEN_LAMBDA = (RED_LAMBDA * PUMP_NM) / RUBY_NM
/** px per second: every photon in the close-up (green or red, the hero
 *  too) flies at this one steady speed — the twin beat's pace — so light
 *  looks like light everywhere (Elena, 2026-11-21: the hero photon was far
 *  too fast; speeds must be consistent). Steady, never eased. */
const PHOTON_SPEED = 90
const fadeIn = (t: number, at: number, len = 0.6) => clamp01((t - at) / len)

function backdrop(ctx: CanvasRenderingContext2D, b: Box) {
  const g = ctx.createLinearGradient(0, 0, 0, b.H)
  g.addColorStop(0, '#060b1a')
  g.addColorStop(1, '#020617')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, b.W, b.H)
}

/** one photon packet, flying along `angle` (the Light lab's look) */
function packet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  css: (a: number) => string,
  idle: number,
  angle = 0,
  lambda = RED_LAMBDA,
  alpha = 1,
) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(x, y)
  ctx.rotate(angle)
  drawWavePacket(ctx, 0, 0, lambda, 54, 7, idle * 120, css)
  ctx.restore()
}

/** how far a packet's wave reaches either side of its centre */
const PACKET_REACH = 54 * 0.9

/** a column of photons marching in step: every packet at the same x, the
 *  same wiggle — the count IS the column. `dir` = which way it flies (the
 *  wiggle crawls that way). With `faces` (the mirrors' inner faces) the
 *  column REFLECTS: everything is clipped to the space between the mirrors,
 *  and near a face the part that has reached the mirror comes back as its
 *  mirror image (x flipped about the face, flying the other way) — the
 *  wave folds back at the mirror's edge instead of running into it. */
function column(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  n: number,
  room: number,
  idle: number,
  alpha = 1,
  dir = 1,
  faces?: [number, number],
) {
  const shown = Math.min(n, 8)
  const gap = Math.min(20, (2 * room) / Math.max(1, shown))
  for (let k = 0; k < shown; k++) {
    const off = k === 0 ? 0 : (k % 2 ? -1 : 1) * Math.ceil(k / 2) * gap
    foldedPacket(ctx, x, cy + off, dir, idle, alpha, faces)
  }
}

/** one red photon flying along x (`dir` ±1) between two mirrors: clipped
 *  to the space between their faces, the part that reached a face folded
 *  back as its mirror image (see column) */
function foldedPacket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  idle: number,
  alpha = 1,
  faces?: [number, number],
) {
  const one = (px: number, d: number) => {
    ctx.save()
    ctx.globalAlpha *= alpha
    ctx.translate(px, y)
    ctx.scale(d, 1) // a mirror image, not a turn: only x flips
    drawWavePacket(ctx, 0, 0, RED_LAMBDA, 54, 7, idle * 120, RED)
    ctx.restore()
  }
  ctx.save()
  if (faces) {
    ctx.beginPath()
    ctx.rect(faces[0], y - 30, faces[1] - faces[0], 60)
    ctx.clip()
  }
  one(x, dir)
  if (faces) for (const f of faces) if (Math.abs(f - x) < PACKET_REACH) one(2 * f - x, -dir)
  ctx.restore()
}

/** a mirror's "bump" while a column folds back at its face: 0 … 1 */
function mirrorBump(x: number, face: number) {
  const d = Math.abs(face - x)
  return d < PACKET_REACH ? 1 - d / PACKET_REACH : 0
}

// ---------- the chromium atom ----------

/** a chromium atom: the app's atom (nucleus, rings, every electron) with
 *  its lone outer electron free to lift to the dashed higher seat; returns
 *  where that electron is */
function crAtom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  K: number,
  lift: number,
  idle: number,
  phase: number,
  alpha = 1,
  angle?: number,
) {
  const rOuter = (16 + 7.5 * 3) * K
  const seat = rOuter + 14 * K
  const ang = angle ?? idle * 0.8 + phase
  const er = lerp(rOuter, seat, easeOut(clamp01(lift))) + (lift > 0.95 ? Math.sin(idle * 16 + phase) * 1.5 : 0)
  const pos = { x: x + er * Math.cos(ang), y: y + er * Math.sin(ang), seat }
  if (alpha <= 0) return pos
  ctx.save()
  ctx.globalAlpha *= alpha
  for (let r = 0; r < 4; r++) {
    ctx.strokeStyle = r === 3 ? '#4a6b91' : '#3b5a7d'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, (16 + 7.5 * r) * K, 0, Math.PI * 2)
    ctx.stroke()
  }
  // the higher seat: dashed, brighter while the electron sits there
  ctx.strokeStyle = `rgba(125, 211, 252, ${0.3 + 0.55 * clamp01(lift)})`
  ctx.lineWidth = 1.4
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.arc(x, y, seat, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ;[2, 8, 13].forEach((n, r) => {
    const rad = (16 + 7.5 * r) * K
    const a0 = (idle * 1.1 * (r % 2 === 0 ? 1 : -0.7)) / (1 + r * 0.25) + r * 1.3 + phase
    for (let j = 0; j < n; j++) {
      const a = a0 + (j * 2 * Math.PI) / n
      blit(ctx, electronSprite(false), x + rad * Math.cos(a), y + rad * Math.sin(a))
    }
  })
  const nuc = nucleusSprite(CHROMIUM.nucleons, CHROMIUM.protons, 0.75)
  ctx.drawImage(nuc.canvas, x - (nuc.size / 2) * K, y - (nuc.size / 2) * K, nuc.size * K, nuc.size * K)
  // the story's electron: drawn a little bigger than its sisters, so the
  // eye can follow its jump (the app's glossy electron, not a new symbol)
  drawGlossyParticle(ctx, 'electrons', pos.x, pos.y, Math.max(2.6, 2.2 * K))
  ctx.restore()
  return pos
}


// ---------- the laser itself ----------

interface DeviceOpts {
  /** 0 closed … 1 lid off */
  open: number
  highlight?: 'ruby' | 'lamp' | 'mirrors' | 'right' | null
  /** 0…1: light trickling out of the right mirror */
  leak?: number
  /** 0…1: the flash lamp blazing */
  flash?: number
}

function deviceGeo(b: Box) {
  const cx = b.W / 2
  const cy = b.UH * 0.5
  const L = b.W * 0.52
  return { cx, cy, L, half: 44, x0: cx - L / 2, x1: cx + L / 2, mL: cx - L / 2 - 24, mR: cx + L / 2 + 24, ry: 78, mh: 150 }
}

function glowBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, idle: number) {
  ctx.save()
  ctx.strokeStyle = AMBER
  ctx.globalAlpha *= 0.7 + 0.3 * Math.sin(idle * 5)
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 10)
  ctx.stroke()
  ctx.restore()
}

/** the coiled flash lamp around the rod: back halves (behind the rod) or
 *  front halves. Each loop is cut at its top and bottom — the wire goes
 *  behind the rod on the left half and comes back over it on the right — so
 *  the only change along a loop is where the ruby covers it (never a seam
 *  halfway up). `faintFront`: the front halves fainter, for the close-up
 *  rod whose atoms must stay readable through them. */
function coil(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  cy: number,
  ry: number,
  front: boolean,
  flash: number,
  faintFront = false,
) {
  const n = 7
  ctx.save()
  const k = front && faintFront ? 0.55 : 1
  ctx.strokeStyle = flash > 0 ? `rgba(236, 253, 245, ${k * (0.45 + 0.5 * flash)})` : `rgba(203, 213, 225, ${0.45 * k})`
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const x = lerp(x0 + 20, x1 - 20, i / (n - 1))
    ctx.beginPath()
    ctx.ellipse(x, cy, 10, ry, 0.18, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : (Math.PI * 3) / 2)
    ctx.stroke()
  }
  ctx.restore()
}

function mirror(ctx: CanvasRenderingContext2D, x: number, cy: number, h: number, partly: boolean) {
  if (partly) {
    ctx.fillStyle = 'rgba(203, 213, 225, 0.35)'
    ctx.fillRect(x - 5, cy - h / 2, 10, h)
    ctx.fillStyle = 'rgba(241, 245, 249, 0.8)'
    for (let y = cy - h / 2; y < cy + h / 2; y += 8) ctx.fillRect(x - 5, y, 10, 4)
  } else {
    const g = ctx.createLinearGradient(x - 5, 0, x + 5, 0)
    g.addColorStop(0, '#94a3b8')
    g.addColorStop(0.5, '#f8fafc')
    g.addColorStop(1, '#64748b')
    ctx.fillStyle = g
    ctx.fillRect(x - 5, cy - h / 2, 10, h)
  }
}

function rod(ctx: CanvasRenderingContext2D, x0: number, x1: number, cy: number, half: number) {
  const g = ctx.createLinearGradient(0, cy - half, 0, cy + half)
  g.addColorStop(0, 'rgba(251, 113, 133, 0.6)')
  g.addColorStop(0.5, 'rgba(244, 63, 94, 0.3)')
  g.addColorStop(1, 'rgba(190, 18, 60, 0.55)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(x0, cy - half, x1 - x0, half * 2, 8)
  ctx.fill()
}

function drawDevice(ctx: CanvasRenderingContext2D, b: Box, idle: number, o: DeviceOpts) {
  const g = deviceGeo(b)
  const bx0 = g.mL - 40
  const bx1 = g.mR + 40
  const by0 = g.cy - 125
  const by1 = g.cy + 125
  // the case: back wall
  ctx.fillStyle = '#111827'
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(bx0, by0, bx1 - bx0, by1 - by0, 14)
  ctx.fill()
  ctx.stroke()
  coil(ctx, g.x0, g.x1, g.cy, g.ry, false, o.flash ?? 0)
  rod(ctx, g.x0, g.x1, g.cy, g.half)
  coil(ctx, g.x0, g.x1, g.cy, g.ry, true, o.flash ?? 0)
  mirror(ctx, g.mL, g.cy, g.mh, false)
  mirror(ctx, g.mR, g.cy, g.mh, true)
  // the beam's way out
  if ((o.leak ?? 0) > 0) {
    for (let k = 0; k < 3; k++) {
      const q = frac(idle * 0.6 + k / 3)
      packet(ctx, g.mR + 20 + q * (b.W - g.mR - 30), g.cy, RED, idle, 0, RED_LAMBDA, (o.leak ?? 0) * (1 - q))
    }
  }
  // the lid: lifts off and fades
  if (o.open < 1) {
    ctx.save()
    ctx.globalAlpha *= 1 - easeInOut(o.open)
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.roundRect(bx0, by0 - easeInOut(o.open) * 220, bx1 - bx0, by1 - by0, 14)
    ctx.fill()
    text(ctx, 'LASER', (bx0 + bx1) / 2, g.cy - easeInOut(o.open) * 220, 'rgba(226, 232, 240, 0.6)', 20, '700')
    ctx.restore()
  }
  // the part being named
  const h = o.highlight
  if (h === 'ruby') glowBox(ctx, g.x0 - 6, g.cy - g.half - 6, g.L + 12, g.half * 2 + 12, idle)
  if (h === 'lamp') glowBox(ctx, g.x0 + 4, g.cy - g.ry - 8, g.L - 8, 2 * g.ry + 16, idle)
  if (h === 'mirrors' || h === 'right') glowBox(ctx, g.mR - 15, g.cy - g.mh / 2 - 8, 30, g.mh + 16, idle)
  if (h === 'mirrors') glowBox(ctx, g.mL - 15, g.cy - g.mh / 2 - 8, 30, g.mh + 16, idle)
  if (o.open > 0.6) {
    text(ctx, 'ruby', g.cx, g.cy + g.ry + 22, 'rgba(251, 164, 175, 0.8)', 12)
    text(ctx, 'flash lamp', g.cx, g.cy - g.ry - 22, 'rgba(203, 213, 225, 0.75)', 12)
    text(ctx, 'mirror', g.mL, g.cy + g.mh / 2 + 16, 'rgba(203, 213, 225, 0.75)', 12)
    text(ctx, 'partly silver', g.mR, g.cy + g.mh / 2 + 16, 'rgba(203, 213, 225, 0.75)', 12)
  }
}

/** "🔍 we are here": the whole laser, small, the amber box on the ruby */
function hereCorner(ctx: CanvasRenderingContext2D, b: Box, alpha = 1) {
  if (alpha <= 0) return
  const w = 128
  const x = b.W - w - 18
  const y = 16
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = 'rgba(2, 6, 23, 0.8)'
  ctx.beginPath()
  ctx.roundRect(x - 8, y - 6, w + 16, 76, 10)
  ctx.fill()
  ctx.fillStyle = '#111827'
  ctx.fillRect(x, y + 6, w, 40)
  rod(ctx, x + 22, x + w - 22, y + 26, 7)
  mirror(ctx, x + 12, y + 26, 28, false)
  mirror(ctx, x + w - 12, y + 26, 28, true)
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2.5
  ctx.strokeRect(x + w / 2 - 9, y + 16, 18, 20)
  text(ctx, '🔍 we are here', x + w / 2, y + 60, AMBER_SOFT, 11, '600')
  ctx.restore()
}

// ---------- beat 1 (and the payoff): the wall ----------

function torch(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#475569'
  ctx.beginPath()
  ctx.roundRect(x - 40, y - 10, 44, 20, 5)
  ctx.fill()
  ctx.fillStyle = '#64748b'
  ctx.beginPath()
  ctx.moveTo(x + 4, y - 10)
  ctx.lineTo(x + 20, y - 17)
  ctx.lineTo(x + 20, y + 17)
  ctx.lineTo(x + 4, y + 10)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 246, 214, 0.95)'
  ctx.fillRect(x + 18, y - 15, 3, 30)
}

function pointer(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#1e293b'
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(x - 40, y - 6, 60, 12, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = RED(1)
  ctx.beginPath()
  ctx.arc(x + 20, y, 3, 0, Math.PI * 2)
  ctx.fill()
}

/** a torch and a laser shining on a wall at `wallX` */
function drawWall(ctx: CanvasRenderingContext2D, b: Box, wallX: number, idle: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const tx = 90
  const ty = b.UH * 0.36
  const ly = b.UH * 0.66
  const mouth = tx + 20
  // the wall
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(wallX, b.UH * 0.1, 18, b.UH * 0.82)
  // the torch's light: a cone that spreads, a big soft dim circle
  const dist = wallX - mouth
  const spread = 15 + dist * 0.34
  const cone = ctx.createLinearGradient(mouth, 0, wallX, 0)
  cone.addColorStop(0, 'rgba(255, 246, 214, 0.28)')
  cone.addColorStop(1, 'rgba(255, 246, 214, 0.05)')
  ctx.fillStyle = cone
  ctx.beginPath()
  ctx.moveTo(mouth, ty - 15)
  ctx.lineTo(wallX, ty - spread)
  ctx.lineTo(wallX, ty + spread)
  ctx.lineTo(mouth, ty + 15)
  ctx.closePath()
  ctx.fill()
  const spot = ctx.createRadialGradient(wallX, ty, 0, wallX, ty, spread)
  spot.addColorStop(0, `rgba(255, 246, 214, ${Math.min(0.85, 70 / spread)})`)
  spot.addColorStop(1, 'rgba(255, 246, 214, 0)')
  ctx.fillStyle = spot
  ctx.beginPath()
  ctx.ellipse(wallX, ty, 12, spread, 0, 0, Math.PI * 2)
  ctx.fill()
  // its packets fly every which way inside the cone
  ctx.save()
  ctx.beginPath()
  ctx.rect(mouth, 0, wallX - mouth, b.UH)
  ctx.clip()
  for (let i = 0; i < 9; i++) {
    const a = (rnd(i, 401) - 0.5) * 2 * Math.atan2(spread - 15, dist)
    const q = frac(idle * 0.35 + rnd(i, 402))
    const d = q * dist
    packet(ctx, mouth + d, ty + Math.tan(a) * d, ordinaryCss, idle, a, 30, 1 - q * 0.6)
  }
  ctx.restore()
  torch(ctx, tx, ty)
  // the laser: a thin line of packets marching in step, a tiny bright dot
  ctx.strokeStyle = RED(0.55)
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(tx + 22, ly)
  ctx.lineTo(wallX, ly)
  ctx.stroke()
  // the packets end at the wall: each one runs into the dot and is gone
  // (clipped there, like the torch's) — never through the wall
  ctx.save()
  ctx.beginPath()
  ctx.rect(tx + 22, 0, wallX - tx - 22, b.UH)
  ctx.clip()
  for (let k = 0; k < 6; k++) {
    const x = tx + 40 + frac(idle * 0.35 + k / 6) * (wallX - tx - 40)
    packet(ctx, x, ly, RED, idle)
  }
  ctx.restore()
  const dot = ctx.createRadialGradient(wallX, ly, 0, wallX, ly, 14)
  dot.addColorStop(0, 'rgba(255, 228, 230, 1)')
  dot.addColorStop(0.3, RED(1))
  dot.addColorStop(1, RED(0))
  ctx.fillStyle = dot
  ctx.beginPath()
  ctx.arc(wallX, ly, 14, 0, Math.PI * 2)
  ctx.fill()
  pointer(ctx, tx, ly)
  text(ctx, 'torch', tx - 18, ty + 30, GREY, 11)
  text(ctx, 'laser', tx - 18, ly + 24, GREY, 11)
  ctx.restore()
}

function drawQuestion(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  // the wall moves away while the voice says so (the second piece's break)
  const wallX = lerp(b.W * 0.48, b.W - 40, easeInOut(clamp01((t - 5) / 2.5)))
  drawWall(ctx, b, wallX, idle, fadeIn(t, 0, 1))
  tag(ctx, 'Why does the laser dot stay so tiny?', b.W / 2, 34, AMBER, 18, fadeIn(t, 7.5))
}

// ---------- beat 2: inside ----------

function drawInside(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  // the lid comes off first (show first), then each part as it is named
  const highlight = t >= 9.9 ? 'right' : t >= 7.4 ? 'mirrors' : t >= 4.9 ? 'lamp' : t >= 2.4 ? 'ruby' : null
  drawDevice(ctx, b, idle, { open: clamp01(t / 2), highlight, leak: t >= 10 ? fadeIn(t, 10) : 0 })
}

// ---------- the close-up: one chromium atom and its neighbours ----------

function closeGeo(b: Box) {
  const K = Math.min(2.1, (b.UH * 0.22) / 52.5)
  return {
    K,
    // centred (the staircase that stood on the right is gone: the atom
    // explains the climb itself — Elena, 2026-11-21)
    x: b.W * 0.5,
    y: b.UH * 0.52,
    nK: K * 0.42,
    nbrs: [
      { x: b.W * 0.12, y: b.UH * 0.22 },
      { x: b.W * 0.12, y: b.UH * 0.82 },
      { x: b.W * 0.88, y: b.UH * 0.2 },
      { x: b.W * 0.88, y: b.UH * 0.84 },
    ],
  }
}

/** the ruby's pink inside, behind the close-up */
function rubyInside(ctx: CanvasRenderingContext2D, b: Box, alpha = 1) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = 'rgba(244, 63, 94, 0.07)'
  ctx.fillRect(0, 0, b.W, b.UH)
  ctx.restore()
}

/** the lamp seen from inside the ruby: a band at the top that blazes */
function lampBand(ctx: CanvasRenderingContext2D, b: Box, flash: number) {
  ctx.fillStyle = flash > 0 ? `rgba(236, 253, 245, ${0.25 + 0.6 * flash})` : 'rgba(203, 213, 225, 0.12)'
  ctx.fillRect(0, 0, b.W, 14)
  text(ctx, 'flash lamp', 60, 26, 'rgba(203, 213, 225, 0.7)', 11)
}

function drawZoom(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const z = easeInOut(clamp01(t / LASER_T.zoom))
  const g = deviceGeo(b)
  // the laser grows past the screen, centred on the ruby…
  const dA = 1 - clamp01((z - 0.35) / 0.3)
  if (dA > 0) {
    ctx.save()
    ctx.globalAlpha *= dA
    ctx.translate(g.cx, g.cy)
    ctx.scale(1 + 7 * z, 1 + 7 * z)
    ctx.translate(-g.cx, -g.cy)
    drawDevice(ctx, b, idle, { open: 1 })
    ctx.restore()
  }
  // …and the atoms inside it grow in
  const aA = clamp01((z - 0.45) / 0.3)
  const c = closeGeo(b)
  rubyInside(ctx, b, aA)
  const grow = lerp(0.3, 1, z)
  for (const [i, n] of c.nbrs.entries()) crAtom(ctx, n.x, n.y, c.nK * grow, 0, idle, i * 1.7, aA)
  const e = crAtom(ctx, c.x, c.y, c.K * grow, 0, idle, 0, aA)
  // the outer electron: look here
  if (z > 0.85) marker(ctx, e.x, e.y, 14, idle, clamp01((z - 0.85) / 0.15))
  text(ctx, 'chromium atom', c.x, c.y + e.seat + 24, 'rgba(203, 213, 225, 0.75)', 12, '', 'center')
  hereCorner(ctx, b, aA)
}

// The launch clock. Story time stops while a piece is spoken, and the
// moment it stops is the voice's, not ours (audio start-up, dropped frames)
// — so no flight may run on story time in a held beat. Story time says WHEN
// a photon sets off; from then on its flight runs on the idle clock and
// finishes even while the story stands still. Seeking into the middle
// starts the clock as if the story had run there; going back before `at`
// re-arms it; a beat left and come back to starts afresh.
const launches = new Map<string, { start: number; seen: number }>()
function sinceLaunch(key: string, t: number, at: number, idle: number): number {
  if (t < at) {
    launches.delete(key)
    return -1
  }
  let l = launches.get(key)
  if (!l || idle - l.seen > 0.5 || idle < l.seen) {
    l = { start: idle - (t - at), seen: idle }
    launches.set(key, l)
  }
  l.seen = idle
  return Math.max(idle - l.start, t - at)
}

/** a green photon dropping onto a point from `path` px above (fading in
 *  over its first quarter): sets off at story time `from`, flies at
 *  PHOTON_SPEED on the idle clock. Returns the seconds since it landed
 *  (negative while flying, -9 before it set off). */
function greenRain(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, t: number, from: number, idle: number, path = 200) {
  const since = sinceLaunch(key, t, from, idle)
  if (since < 0) return -9
  const fly = path / PHOTON_SPEED
  const q = since / fly
  if (q <= 1) packet(ctx, x, y - path * (1 - q), GREEN, idle, Math.PI / 2, GREEN_LAMBDA, Math.min(1, q * 4))
  return since - fly
}

/** the outer electron glides to the top of its ring (where the lamp's
 *  photon will reach it) and stays there for the next beats */
const TOP = -Math.PI / 2
function glideToTop(idle: number, t: number, over = 2) {
  const orbit = idle * 0.8
  const d = ((((orbit - TOP) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  return TOP + d * (1 - easeInOut(clamp01(t / over)))
}

/** an amber arrow from (x, y0) up to (x, y1) — "it goes up" */
function upArrow(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, alpha: number) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.strokeStyle = AMBER
  ctx.fillStyle = AMBER
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y0)
  ctx.lineTo(x, y1 + 8)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x - 6, y1 + 10)
  ctx.lineTo(x + 6, y1 + 10)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// The flash, one piece of information at a time (Elena: "up a step" alone
// is not clear — say why and how). Story time per watch break (the line's
// pieces, show first). LIGHT NEVER FREEZES (Elena, 2026-11-20/21): every
// flight is launched on story time and flown on the idle clock
// (sinceLaunch), so it keeps going while a piece is spoken.
// All photons fly at PHOTON_SPEED, so a flight takes as long as its path
// needs; the flights set off early enough that they land in time.
//   0–2.5    after "Now the lamp flashes." the lamp flashes and green
//            photons start raining down the whole height of the screen
//   2.5–4.7  "Green photons fly into the ruby." is said WHILE they fall
//            (the stream keeps coming as long as the voice takes), then no
//            new drop sets off; the drops keep falling to the bottom
//   (the hero's lane, down the middle, stays free of rain, and once the
//   hero sets off the rain dims back — the hero is never lost in it)
//   4.7–7.5  ONE green photon (amber ring) flies onto our electron — on its
//            way while "Watch the outer electron. It swallows…" is said —
//            and is swallowed: a green flash, the electron trembles (the
//            push)
//   7.5–10   right after "The push lifts the electron to a bigger ring,
//            farther from the middle." it moves out to the bigger dashed
//            ring (amber arrow) — the action sentence, then the action
//   10–12.5  then its explanation is said ("Up there it holds more
//            energy…"): a living rest — the electron circles up there in
//            its amber ring, the arrow stays, nothing new happens
//   12.5–16  after "Now many electrons wait up high…" the lamp flashes
//            again and the neighbours' electrons go up too
// (No energy staircase: the atom shows the climb itself — Elena,
// 2026-11-21.)
const RAIN_STOP = 2.6 // right after "Green photons fly into the ruby"
const LAMP_AT = 0.05 // right after "Now the lamp flashes."
const HERO_FROM = 4.7
const HERO_PATH = 200
const LIFT_AT = 7.7
const NBR_FROM = 12.6
const NBR_PATH = 140
function drawFlash(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const c = closeGeo(b)
  rubyInside(ctx, b)
  // the lamp's two flashes (a flash, too, is light: on the idle clock)
  const lamp1 = sinceLaunch('flash:lamp1', t, LAMP_AT, idle)
  const lamp2 = sinceLaunch('flash:lamp2', t, NBR_FROM, idle)
  const flash = Math.max(0, lamp1 >= 0 ? 1 - lamp1 / 0.5 : 0, lamp2 >= 0 ? 1 - lamp2 / 0.5 : 0)
  lampBand(ctx, b, flash)
  // the first flash: green light pours into the ruby, every drop falling
  // the whole height of the screen (Elena, 2026-11-21) — all through
  // "Green photons fly into the ruby", however long the voice takes — and
  // passes between the atoms (the one that matters comes next). A stream on
  // the idle clock: each column sends a drop every RAIN_EVERY seconds; once
  // story time reaches RAIN_STOP no new drop sets off, the ones on their way
  // fall on to the bottom. Column 3 (down the middle) is the hero's lane:
  // no rain there.
  const RAIN_EVERY = 1.8
  const RAIN_PATH = b.UH - 16 + PACKET_REACH // top to off the bottom
  const RAIN_FALL = RAIN_PATH / PHOTON_SPEED
  const rainNow = sinceLaunch('flash:rain', t, LAMP_AT + 0.25, idle)
  const rainStop = sinceLaunch('flash:rainStop', t, RAIN_STOP, idle)
  const lastStart = rainStop >= 0 ? rainNow - rainStop : Infinity
  // once the hero sets off, the rain dims back (focus on the hero)
  const heroOff = sinceLaunch('flash:heroDim', t, HERO_FROM, idle)
  const rainAlpha = heroOff >= 0 ? 1 - 0.65 * clamp01(heroOff / 0.6) : 1
  for (let i = 0; i < 7; i++) {
    if (i === 3) continue // the hero's lane
    const first = i * 0.12 + (i % 2) * 0.9 // the columns take turns
    if (rainNow < 0) continue
    // every drop of this column still on its way down (a fall takes far
    // longer than RAIN_EVERY: several drops per column at once)
    for (let k = Math.floor((rainNow - first) / RAIN_EVERY); k >= 0; k--) {
      const start = first + k * RAIN_EVERY
      const q = (rainNow - start) / RAIN_FALL
      if (q > 1) break
      if (start > lastStart) continue
      const x = b.W * (0.08 + 0.13 * i) + (k % 2 ? 50 : 20)
      packet(ctx, x, 16 + RAIN_PATH * q, GREEN, idle, Math.PI / 2, GREEN_LAMBDA, rainAlpha)
    }
  }
  // the neighbours: their electrons go up with the second flash
  for (const [i, n] of c.nbrs.entries()) {
    // (set off from NBR_FROM on: the last one lands and lifts before 16)
    const landed = greenRain(ctx, `flash:nbr${i}`, n.x, n.y - 30, t, NBR_FROM + i * 0.3, idle, NBR_PATH)
    crAtom(ctx, n.x, n.y, c.nK, clamp01(landed / 0.5), idle, i * 1.7)
  }
  // the green photon flying onto our electron, at PHOTON_SPEED: it fades in
  // HERO_PATH px above it and lands ≈ 2.2 s after it sets off (swallowed
  // and trembled before LIFT_AT even with the voice off)
  const rOuter = (16 + 7.5 * 3) * c.K
  const heroY = c.y - rOuter - 4
  const FLY = HERO_PATH / PHOTON_SPEED
  const hero = sinceLaunch('flash:hero', t, HERO_FROM, idle)
  const swallowed = hero >= FLY ? hero - FLY : -1
  // our electron: swallowed photon → push (a short tremble) → lifted out
  const lift = clamp01((t - LIFT_AT) / 0.8)
  const pushed = swallowed >= 0 && swallowed < 1.5 && lift === 0 ? Math.sin(idle * 40) * 2.5 * (1 - swallowed / 1.5) : 0
  const angle = glideToTop(idle, t)
  const e = crAtom(ctx, c.x + pushed, c.y, c.K, lift, idle, 0, 1, angle)
  if (hero >= 0 && hero < FLY) {
    const y = heroY - HERO_PATH + PHOTON_SPEED * hero
    packet(ctx, c.x, y, GREEN, idle, Math.PI / 2, GREEN_LAMBDA, Math.min(1, (hero / FLY) * 4))
    marker(ctx, c.x, y, 20, idle)
  }
  // swallowed: a green flash where the electron took it
  if (swallowed >= 0 && swallowed < 0.8) {
    const q = swallowed / 0.8
    ctx.strokeStyle = GREEN(0.9 * (1 - q))
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(e.x, e.y, 6 + q * 34, 0, Math.PI * 2)
    ctx.stroke()
  }
  // "watch the outer electron": the ring is on it before the photon comes
  if (t >= 4.9) marker(ctx, e.x, e.y, 14, idle)
  // the lift: an arrow from the home ring out to the bigger ring
  upArrow(ctx, c.x + 30, c.y - rOuter + 4, c.y - e.seat - 4, t >= LIFT_AT && t < 12.5 ? fadeIn(t, LIFT_AT, 0.3) : 0)
  hereCorner(ctx, b)
}

function drawFall(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const c = closeGeo(b)
  rubyInside(ctx, b)
  lampBand(ctx, b, 0)
  // neighbours fall by themselves, one by one; each photon flies off any way
  // (launched on story time, flown on the idle clock: light never hangs
  // still while the voice speaks)
  // (2.2 s flights at PHOTON_SPEED: the last lands before the beat's 5 s)
  const falls = [0.2, 0.7, 2.55, 2.75]
  for (const [i, n] of c.nbrs.entries()) {
    const q = sinceLaunch(`fall:${i}`, t, falls[i], idle)
    const e = crAtom(ctx, n.x, n.y, c.nK, q < 0 ? 1 : 1 - clamp01(q / 0.3), idle, i * 1.7, 1, 1.2 + i)
    if (q > 0 && q < 2.2) {
      const a = 0.7 + i * 1.9 + rnd(i, 411)
      const d = q * PHOTON_SPEED
      packet(ctx, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, RED, idle, a, RED_LAMBDA, 1 - q / 2.2)
    }
  }
  // our atom keeps its electron up (at the top, where it was lifted): it
  // is needed next
  crAtom(ctx, c.x, c.y, c.K, 1, idle, 0, 1, TOP)
  hereCorner(ctx, b)
}

function drawTwin(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const c = closeGeo(b)
  rubyInside(ctx, b)
  lampBand(ctx, b, 0)
  for (const [i, n] of c.nbrs.entries()) crAtom(ctx, n.x, n.y, c.nK, 0, idle, i * 1.7)
  // the watched electron sits at the top of its seat while our photon comes
  // a FLOW beat (never held: the photons are always flying); the birth
  // sits where the second piece is spoken in the fitted timeline
  const BIRTH = 2.8
  const fall = clamp01((t - BIRTH) / 0.4)
  const e = crAtom(ctx, c.x, c.y, c.K, 1 - fall, idle, 0, 1, -Math.PI / 2)
  const lineY = c.y - e.seat
  const v = PHOTON_SPEED
  const hx = c.x - v * BIRTH + v * t
  // the twin: born ON the atom at the fall, it slides in beside our photon
  if (t >= BIRTH) {
    const f = easeOut(clamp01((t - BIRTH) / 0.6))
    const tx = lerp(c.x, hx, f)
    const ty = lerp(lineY, lineY + 26, f)
    packet(ctx, tx, ty, RED, idle)
    if (t < BIRTH + 0.7) {
      ctx.strokeStyle = RED(0.8 * (1 - (t - BIRTH) / 0.7))
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(c.x, lineY, 8 + (t - BIRTH) * 60, 0, Math.PI * 2)
      ctx.stroke()
    }
    marker(ctx, tx, ty, 18, idle, t >= 5.2 ? 1 : 0)
  }
  packet(ctx, hx, lineY, RED, idle)
  marker(ctx, hx, lineY, 18, idle)
  if (t >= 5.2) tag(ctx, 'same color · same direction · in step', hx, lineY - 40, AMBER_SOFT, 13, fadeIn(t, 5.2))
  hereCorner(ctx, b)
}

// ---------- the rod between the mirrors ----------

function rodGeo(b: Box) {
  const x0 = b.W * 0.14
  const x1 = b.W * 0.86
  // the column's centre turns AT the mirrors' inner faces (mirrors at
  // x0 − 18 and x1 + 18, 10 px thick): its wave folds back there
  return { x0, x1, cy: b.UH * 0.5, half: 80, xL: x0 - 13, xR: x1 + 13, atoms: 7 }
}

/** where the bouncing column is at story time `s` (seconds since the
 *  mirrors beat began), and which way it goes */
function columnAt(b: Box, s: number) {
  const g = rodGeo(b)
  const L = g.xR - g.xL
  const v = (6 * L) / LASER_T.mirrors // three round trips in the beat
  const p = 1.65 * L + v * s // starts at 35 % of the rod, heading left
  const m = ((p % (2 * L)) + 2 * L) % (2 * L)
  const x = g.xL + (m <= L ? m : 2 * L - m)
  return { x, dir: m <= L ? 1 : -1, trips: (v * s) / L, v, L }
}

function drawRodScene(ctx: CanvasRenderingContext2D, b: Box, s: number, idle: number, beamT: number, pan = 0) {
  const g = rodGeo(b)
  const flashEvery = 2
  const lastFlash = Math.floor(s / flashEvery) * flashEvery
  const flash = clamp01(1 - (s - lastFlash) / 0.3)
  coil(ctx, g.x0, g.x1, g.cy, 118, false, flash)
  rod(ctx, g.x0, g.x1, g.cy, g.half)
  const col = columnAt(b, s)
  // the bump: a mirror the column is folding back at is nudged outward a
  // touch and flashes along its face
  const bumpL = mirrorBump(col.x, g.xL)
  const bumpR = mirrorBump(col.x, g.xR)
  mirror(ctx, g.x0 - 18 - bumpL * 2.5, g.cy, 230, false)
  mirror(ctx, g.x1 + 18 + bumpR * 2.5, g.cy, 230, true)
  for (const [face, bump, side] of [
    [g.xL, bumpL, 1],
    [g.xR, bumpR, -1],
  ] as const) {
    if (bump <= 0) continue
    const glow = ctx.createLinearGradient(face, 0, face + side * 26, 0)
    glow.addColorStop(0, RED(0.7 * bump))
    glow.addColorStop(1, RED(0))
    ctx.fillStyle = glow
    const h = (g.half - 8) * 2 + 30
    ctx.fillRect(Math.min(face, face + side * 26), g.cy - h / 2, 26, h)
  }
  const K = Math.min(0.95, ((g.x1 - g.x0 - 80) / (g.atoms - 1)) * 0.48 / 52.5)
  // each atom: lifted by the lamp's flashes, dropped (a twin!) as the
  // column passes it
  for (let i = 0; i < g.atoms; i++) {
    const ax = lerp(g.x0 + 40, g.x1 - 40, i / (g.atoms - 1))
    const ay = g.cy + (i % 2 ? 20 : -20)
    let passed = -9
    for (let k = 1; k <= 40; k++) {
      const s0 = s - k * 0.05
      if (s0 < 0) break
      const a0 = columnAt(b, s0).x
      const a1 = columnAt(b, s0 + 0.05).x
      if ((a0 - ax) * (a1 - ax) <= 0) {
        passed = s0 + 0.05
        break
      }
    }
    const up = passed < lastFlash || s - passed > flashEvery
    const sinceFall = s - passed
    crAtom(ctx, ax, ay, K, up ? clamp01((s - lastFlash) / 0.3) : 1 - clamp01(sinceFall / 0.25), idle, i * 1.3)
    if (sinceFall >= 0 && sinceFall < 0.4) {
      // the twin, born on the atom AS the column passes, joins it in step:
      // always at the column's x (never trailing behind it), it only
      // slides over to the column's line — and bounces off a mirror with
      // it, folded at the face like the column (Elena, 2026-11-21: a lone
      // twin lagging behind ran into the mirror)
      const f = easeOut(sinceFall / 0.4)
      foldedPacket(ctx, col.x, lerp(ay, g.cy, f), col.dir, idle, 1, [g.xL, g.xR])
    }
    // now and then one falls by itself and its photon leaves sideways
    const k = Math.floor((s + i * 1.37) / 3)
    const q = s + i * 1.37 - k * 3
    if (q < 2 && up) {
      const a = (rnd(i + k * 7, 421) < 0.5 ? -1 : 1) * (Math.PI / 2 + (rnd(i + k * 7, 422) - 0.5) * 0.9)
      packet(ctx, ax + Math.cos(a) * q * PHOTON_SPEED, ay + Math.sin(a) * q * PHOTON_SPEED, RED, idle, a, RED_LAMBDA, 1 - q / 2)
    }
  }
  coil(ctx, g.x0, g.x1, g.cy, 118, true, flash, true)
  // the column: two at first, doubling every trip
  const n = columnSize(col.trips)
  column(ctx, col.x, g.cy, n, g.half - 8, idle, 1, col.dir, [g.xL, g.xR])
  tag(ctx, n > 32 ? 'many' : String(n), col.x, g.cy - g.half - 22, RED(1), 13)
  if (beamT > 0) slipThrough(ctx, b, s, beamT, idle, b.W + pan)
}

/**
 * The beam is BORN, never painted (Elena, 2026-11-21: a steady line from
 * one point of the mirror showed no twins escaping, so a child saw no
 * link). After "At the right mirror, a few photons slip through." the
 * column's next hit on the partly-silver mirror lets TWO of its twins
 * through — the same packets, in step, carrying on through the mirror
 * (the unfolded image of the column's fold) at the column's speed, an
 * amber ring on them. From the following hit on, more twins have been
 * born in the meantime and the leak never stops: the escaping photons
 * become a steady flow of pairs, marching in step — that is the beam.
 * `s` = story seconds since the mirrors beat began, `u` = since the beam
 * beat began.
 */
function slipThrough(ctx: CanvasRenderingContext2D, b: Box, s: number, u: number, idle: number, right: number) {
  const g = rodGeo(b)
  const { v, L } = columnAt(b, s)
  const T = (2 * L) / v // one round trip
  // right-mirror hits: p = 1.65 L + v s ≡ L (mod 2 L)
  const firstHit = (k: number) => ((2 * k - 0.65) * L) / v
  let k = 1
  while (firstHit(k) < s - u) k++
  const tA = firstHit(k) - (s - u) // the first hit in the beam beat (≈ 3.15)
  const tB = tA + T // the next one (≈ 7.8): the flow starts
  const gap = 18 // the column's row gap at "many" (column())
  const rows = [g.cy, g.cy - gap]
  const outer = g.x1 + 23 // the mirror's outer face: photons appear here
  const one = (x: number) => {
    if (x < outer - PACKET_REACH || x > right + PACKET_REACH) return
    for (const y of rows) {
      ctx.save()
      ctx.translate(x, y)
      drawWavePacket(ctx, 0, 0, RED_LAMBDA, 54, 7, idle * 120, RED)
      ctx.restore()
    }
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(outer, 0, right - outer, b.UH)
  ctx.clip()
  // the first two: through the mirror, on and away
  if (u >= tA) one(g.xR + v * (u - tA))
  // the flow: a pair every SPACING px, for as long as the laser runs
  const SPACING = 46
  if (u >= tB) {
    const lead = g.xR + v * (u - tB)
    for (let x = lead; x >= g.xR; x -= SPACING) one(x)
  }
  ctx.restore()
  // the eye on the first two (hero to follow)
  if (u >= tA && u < tA + 2.2) {
    const x = g.xR + v * (u - tA)
    if (x > outer + 10 && x < right - 20) marker(ctx, x, g.cy - gap / 2, 26, idle, 1 - clamp01((u - tA - 1.6) / 0.6))
  }
}

function drawMirrors(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  drawRodScene(ctx, b, t, idle, 0)
  text(ctx, 'mirror', rodGeo(b).x0 - 18, rodGeo(b).cy + 132, 'rgba(203, 213, 225, 0.75)', 12)
  text(ctx, 'partly silver', rodGeo(b).x1 + 18, rodGeo(b).cy + 132, 'rgba(203, 213, 225, 0.75)', 12)
}

function drawBeam(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  // a FLOW beat (story time 16 s, fitted to the voice — the rod plays at
  // the mirrors beat's pace). In the fitted timeline (EN · DE · RU agree
  // within 2 %): piece 1 "a few photons slip through" ends ≈ 2.5, the
  // column hits the partly-silver mirror at ≈ 3.15 and two twins slip
  // through (say it → show it); piece 2 runs ≈ 4.4–9.3 while the leak
  // turns into a steady flow (≈ 7.8, just before "That is a laser
  // beam."); then back to the wall, before piece 3 (≈ 11.4)
  const out = clamp01((t - 10) / 0.9)
  if (out < 1) {
    // the camera follows the light: it slides left while piece 1 is said,
    // so the escaping twins have room to fly out (done before the first
    // hit at ≈ 3.15)
    const pan = b.W * 0.3 * easeInOut(clamp01(t / 2.4))
    ctx.save()
    ctx.globalAlpha *= 1 - out
    ctx.translate(-pan, 0)
    drawRodScene(ctx, b, LASER_T.mirrors + t, idle, t, pan)
    ctx.restore()
  }
  drawWall(ctx, b, b.W - 40, idle, out)
  if (t >= 11.4) tag(ctx, 'light copying itself, marching in step', b.W / 2, 34, AMBER, 16, fadeIn(t, 11.4))
}

// ---------- the beats ----------

export function drawLaserBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'question') drawQuestion(ctx, b, t, idle)
  else if (beat === 'inside') drawInside(ctx, b, t, idle)
  else if (beat === 'zoom') drawZoom(ctx, b, t, idle)
  else if (beat === 'flash') drawFlash(ctx, b, t, idle)
  else if (beat === 'fall') drawFall(ctx, b, t, idle)
  else if (beat === 'twin') drawTwin(ctx, b, t, idle)
  else if (beat === 'mirrors') drawMirrors(ctx, b, t, idle)
  else drawBeam(ctx, b, t, idle)
}
