import { clamp01, easeInOut, easeOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, lerp, marker, rnd, shellAtom, shellAtomR, tag, text } from './storyDraw'
import { drawEye, drawWavePacket, ghostCss, ordinaryCss } from './lightPacket'
import { PHOTON_SPEED, glowBox, sinceLaunch } from './laserScenes'
import { wavelengthToCss } from '../core/spectra'
import { IRON, LASER_FAMILY, RUBY_NM, isVisible, powerLevel, type LaserKind } from '../core/laser'

// R08 — ✂️ Light that cuts (proposal: docs/how-things-work/16-proposal-
// laser-stories.md, story 2). One question — can light be strong enough to
// cut steel? — one aha — a lens squeezes a laser's light into one tiny
// spot; there the light shakes the atoms until the steel melts. And your
// eye squeezes a laser beam too, which is why you never look into one.
// Words taught: focus, infrared, retina. Hero: the cutter's spot (amber
// ring), then the beam's point on the retina.
//   family     six lasers on cards, weakest to strongest, a power gauge
//              under them (log: each step ten times stronger) growing left
//              to right; the voice names EVERY laser in turn and its card
//              flies to the middle with a bounce while it is named
//   squeeze    the cutting laser, the pointer and the steel, each named
//              with a bounce; both switch on (a fat invisible beam beside a
//              thin red one); after "A lens squeezes…" the lens slides in
//              and THEN the rays bend to one tiny bright spot — "focus"
//   heat       "Let's fly into the steel…" → the camera zooms into the
//              spot: iron atoms (the app's atoms); photons land on them one
//              by one (each one a push); they shake harder, shake marks,
//              the 🔥 track climbs; it melts, a hole (a living rest)
//   drill      🔁 the drill-in (playbook 25): a rewind sweep, then a
//              replay of the big laser in a frame — ① the lens arrives,
//              then the rays focus; ② a callout circle on the spot: the
//              light lands on the atoms; ③ they wobble harder
//   cut        RUN: seen from above, the spot draws a ⭐ in the steel —
//              glowing kerf, sparks, puffs of air — and the star drops out
//   invisible  infrared beyond the rainbow's red end; the drawn beam fades
//              to what an eye sees (nothing); a closed box comes down
//   eye        THE eye (the Light lab's): its lens; sunlight spreads
//              softly over the back, a laser beam is squeezed onto one
//              point; the retina named. Danger in words only
//   safe       scanner ✓, disc player ✓, strong pointer ✗, the rule as
//              icons, then the Moon (the next story)
// Light is the Light lab's photon packet at the one story speed
// (PHOTON_SPEED); invisible light (infrared, ultraviolet) is the bone
// photo's ghost look. Every flight is launched on story time and flown on
// the idle clock (sinceLaunch), so nothing hangs still while the voice
// speaks. Heat = atoms shaking + shake marks + the 🔥 track (the power
// plant's).

export const CUT_ORDER = ['family', 'squeeze', 'heat', 'drill', 'cut', 'invisible', 'eye', 'safe'] as const
export type CutBeat = (typeof CUT_ORDER)[number]

/** story seconds per beat: a science beat is its watch breaks (2.5 s per
 *  piece, plus 2.5 s before the first when shown first); the cut is a
 *  spectacle at its own speed */
export const CUT_T: Record<CutBeat, number> = {
  family: 22.5,
  squeeze: 15,
  heat: 12.5,
  drill: 10,
  cut: 10,
  invisible: 7.5,
  eye: 12.5,
  safe: 15,
}

export interface Box {
  W: number
  UH: number
  H: number
}

export const fadeIn = (t: number, at: number, len = 0.6) => clamp01((t - at) / len)
const IR_NM = 1070
const POINTER_NM = 650
const RED_LAMBDA = 22 // story 1's ruby wiggle; every other wave scales from it
const lambdaFor = (nm: number) => (RED_LAMBDA * nm) / RUBY_NM
const cssFor = (nm: number) => (isVisible(nm) ? (a: number) => wavelengthToCss(nm, a) : ghostCss)
const easeOutBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2

/**
 * The "look, this one!" bounce for a thing the voice names (kids don't
 * read labels — Elena, 2026-11-21): 0 → 1 with an overshoot, a little
 * wobble while it is said, then back. `tau` = seconds since it began (the
 * idle clock: it plays while the voice speaks).
 */
export function bounce(tau: number, up = 0.4, hold = 1.6, down = 0.45): number {
  if (tau < 0 || tau > up + hold + down) return 0
  if (tau < up) return easeOutBack(tau / up)
  if (tau < up + hold) return 1 + 0.05 * Math.sin((tau - up) * 8)
  return 1 - easeInOut((tau - up - hold) / down)
}

/** draw something scaled about (x, y) */
export function scaledAbout(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, draw: () => void) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(k, k)
  ctx.translate(-x, -y)
  draw()
  ctx.restore()
}

const GREEN_OK = '#34d399'
const RED_NO = '#f87171'

export function backdrop(ctx: CanvasRenderingContext2D, b: Box) {
  const g = ctx.createLinearGradient(0, 0, 0, b.H)
  g.addColorStop(0, '#060b1a')
  g.addColorStop(1, '#020617')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, b.W, b.H)
}

/** one photon packet at (x, y) flying along `angle` */
export function packet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  nm: number,
  idle: number,
  alpha = 1,
  len = 54,
  css: (a: number) => string = cssFor(nm),
) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(x, y)
  ctx.rotate(angle)
  drawWavePacket(ctx, 0, 0, lambdaFor(nm), len, 7, idle * 120, css)
  ctx.restore()
}

// ---------- streams of light along a path ----------

export interface Pt {
  x: number
  y: number
}
const pathLen = (p: Pt[]) => p.slice(1).reduce((n, q, i) => n + Math.hypot(q.x - p[i].x, q.y - p[i].y), 0)
/** the point `d` px along a polyline, and the way it heads there */
function along(p: Pt[], d: number): { x: number; y: number; a: number } | null {
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

/**
 * A stream of photons along `path`: switched on at story time `at`, then a
 * packet every `spacing` px at PHOTON_SPEED on the idle clock (it flows on
 * while the voice speaks). Light ends where it lands: a packet past the
 * end is gone. `stopAt` (story time) = no new packet after it. Returns how
 * long light has been arriving at the end (s, < 0 = not yet).
 */
export function stream(
  ctx: CanvasRenderingContext2D,
  key: string,
  path: Pt[],
  t: number,
  at: number,
  idle: number,
  nm: number,
  o: {
    spacing?: number
    alpha?: number
    stopAt?: number
    len?: number
    css?: (a: number) => string
    /** draw only inside this region: light starts at its source's edge and
     *  ends where it lands, never poking out either side */
    clip?: (ctx: CanvasRenderingContext2D) => void
  } = {},
): number {
  const since = sinceLaunch(key, t, at, idle)
  if (since < 0) return -1
  if (o.clip) {
    ctx.save()
    ctx.beginPath()
    o.clip(ctx)
    ctx.clip()
  }
  const spacing = o.spacing ?? 46
  const L = pathLen(path)
  const front = PHOTON_SPEED * since
  const stopped = o.stopAt !== undefined ? sinceLaunch(`${key}:stop`, t, o.stopAt, idle) : -1
  const lastEmit = stopped >= 0 ? (since - stopped) * PHOTON_SPEED : Infinity // px of emission
  for (let j = Math.max(0, Math.ceil((front - L) / spacing)); front - j * spacing >= 0; j++) {
    if (j * spacing > lastEmit) break
    const p = along(path, front - j * spacing)
    if (p) packet(ctx, p.x, p.y, p.a, nm, idle, o.alpha ?? 1, o.len, o.css ?? cssFor(nm))
  }
  if (o.clip) ctx.restore()
  return since - L / PHOTON_SPEED
}

// ---------- 🔦 the lineup ----------

function familyGeo(b: Box) {
  const m = 18
  const gap = 10
  const n = LASER_FAMILY.length
  const w = (b.W - 2 * m - (n - 1) * gap) / n
  const top = b.UH * 0.07
  const h = b.UH * 0.44
  const base = b.UH * 0.87 // the gauge's floor
  const gaugeH = b.UH * 0.28
  return { m, gap, w, top, h, base, gaugeH, x: (i: number) => m + i * (w + gap) }
}

function drawCard(ctx: CanvasRenderingContext2D, b: Box, k: LaserKind, i: number, idle: number, alpha: number, lit: number) {
  if (alpha <= 0) return
  const g = familyGeo(b)
  const x = g.x(i)
  const cx = x + g.w / 2
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = '#0b1226'
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.9)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(x, g.top, g.w, g.h, 12)
  ctx.fill()
  ctx.stroke()
  ctx.font = `${Math.round(Math.min(40, g.w * 0.36))}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(k.icon, cx, g.top + 36)
  // its light, flowing down out of it (true color, or ghost when invisible)
  const y0 = g.top + 66
  const y1 = g.top + g.h - 40
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y0 - 4, g.w, y1 - y0 + 8)
  ctx.clip()
  const span = y1 - y0
  for (let j = 0; j < 3; j++) {
    const d = ((idle * PHOTON_SPEED + (j * span) / 3) % (span + 30)) - 15
    packet(ctx, cx, y0 + d, Math.PI / 2, k.nm, idle, 1, 40)
  }
  ctx.restore()
  // where it lands: a small dot of its light
  const dot = ctx.createRadialGradient(cx, y1 + 6, 0, cx, y1 + 6, 12)
  dot.addColorStop(0, isVisible(k.nm) ? wavelengthToCss(k.nm, 0.9) : 'rgba(232, 238, 245, 0.6)')
  dot.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = dot
  ctx.beginPath()
  ctx.arc(cx, y1 + 6, 12, 0, Math.PI * 2)
  ctx.fill()
  text(ctx, k.name, cx, g.top + g.h - 14, 'rgba(148, 163, 184, 0.85)', 11)
  ctx.restore()
  if (lit > 0) {
    ctx.save()
    ctx.globalAlpha *= lit
    glowBox(ctx, x - 4, g.top - 4, g.w + 8, g.h + 8, idle)
    ctx.restore()
  }
}

function drawGauge(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number, lit: number[]) {
  const g = familyGeo(b)
  const on = fadeIn(t, 2.6, 0.4)
  if (on <= 0) return
  // faint steps: each one ten times stronger
  ctx.save()
  ctx.globalAlpha *= on
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)'
  ctx.lineWidth = 1
  for (let d = 0; d <= 19; d++) {
    const y = g.base - (d / 19) * g.gaugeH
    ctx.beginPath()
    ctx.moveTo(g.m, y)
    ctx.lineTo(b.W - g.m, y)
    ctx.stroke()
  }
  // weakest → strongest: an amber arrow along the floor, drawn left to right
  const ax = lerp(g.m, b.W - g.m - 10, clamp01((t - 2.6) / 2))
  ctx.strokeStyle = AMBER
  ctx.fillStyle = AMBER
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(g.m, g.base + 14)
  ctx.lineTo(ax, g.base + 14)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(ax + 10, g.base + 14)
  ctx.lineTo(ax - 2, g.base + 8)
  ctx.lineTo(ax - 2, g.base + 20)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  for (const [i, k] of LASER_FAMILY.entries()) {
    const grow = easeOut(clamp01((t - 2.7 - i * 0.3) / 0.5))
    if (grow <= 0) continue
    const x = g.x(i) + g.w * 0.3
    const w = g.w * 0.4
    const h = Math.max(3, g.gaugeH * powerLevel(k.watts) * grow)
    const bar = ctx.createLinearGradient(0, g.base, 0, g.base - g.gaugeH)
    bar.addColorStop(0, '#334155')
    bar.addColorStop(0.5, '#f59e0b')
    bar.addColorStop(1, '#dc2626')
    ctx.fillStyle = bar
    ctx.beginPath()
    ctx.roundRect(x, g.base - h, w, h, 4)
    ctx.fill()
    if (lit[i] > 0) {
      ctx.save()
      ctx.globalAlpha *= Math.min(1, lit[i]) * (0.7 + 0.3 * Math.sin(idle * 5))
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.roundRect(x - 4, g.base - h - 4, w + 8, h + 8, 6)
      ctx.stroke()
      ctx.restore()
    }
  }
  text(ctx, 'weakest', g.m, g.base + 30, 'rgba(148, 163, 184, 0.7)', 11, '', 'left')
  text(ctx, 'strongest', b.W - g.m, g.base + 30, 'rgba(148, 163, 184, 0.7)', 11, '', 'right')
}

// Shown first: the lineup pops in (0–2.5). "…Let's go from the weakest to
// the strongest." → the gauge grows bar by bar, left to right, under an
// arrow (2.5–5). Then every laser is NAMED in turn, weakest first: while
// its sentence is said its card flies to the middle, big, with a bounce,
// and goes back (launched just before each hold: 5, 7.5, 10, 12.5, 15,
// 17.5 — on the idle clock, so it plays while the voice speaks). "So how
// can light…cut steel?" → the cutter's card glows, sparks fly (20–22.5).
const NAMED_AT = 4.7
const NAMED_EVERY = 2.5
function drawFamily(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = familyGeo(b)
  const cutterI = LASER_FAMILY.findIndex((k) => k.id === 'cutter')
  const named = LASER_FAMILY.map((_, i) => bounce(sinceLaunch(`fam:name${i}`, t, NAMED_AT + i * NAMED_EVERY, idle)))
  const lit = LASER_FAMILY.map((_, i) => Math.min(1, named[i]) + (i === cutterI && t >= 20.05 ? fadeIn(t, 20.05, 0.3) : 0))
  // the gauge: weakest → strongest, growing bar by bar
  drawGauge(ctx, b, t, idle, lit)
  for (const [i, k] of LASER_FAMILY.entries()) {
    if (named[i] > 0) continue
    drawCard(ctx, b, k, i, idle, fadeIn(t, 0.1 + i * 0.3, 0.4), i === cutterI && t >= 20.05 ? fadeIn(t, 20.05, 0.3) : 0)
  }
  if (t >= 20.05) sparks(ctx, g.x(cutterI) + g.w / 2, g.top + g.h - 34, idle, 0.6, fadeIn(t, 20.05))
  // the named one, big in the middle (on top of the rest)
  for (const [i, k] of LASER_FAMILY.entries()) {
    const e = named[i]
    if (e <= 0) continue
    ctx.save()
    ctx.fillStyle = `rgba(2, 6, 23, ${0.55 * Math.min(1, e)})`
    ctx.fillRect(0, 0, b.W, g.top + g.h + 20)
    ctx.restore()
    const cx = g.x(i) + g.w / 2
    const cy = g.top + g.h / 2
    // big in the middle, never past the top of the canvas
    const sc = 1 + 0.7 * e
    const tx = lerp(cx, b.W / 2, Math.min(1, e))
    const ty = Math.max(lerp(cy, cy + g.h * 0.12, Math.min(1, e)), 10 + (g.h * sc) / 2)
    ctx.save()
    ctx.translate(tx, ty)
    ctx.scale(sc, sc)
    ctx.translate(-cx, -cy)
    drawCard(ctx, b, k, i, idle, 1, Math.min(1, e))
    ctx.restore()
  }
}

// ---------- ✂️ the cutter, from the side ----------

function sideGeo(b: Box) {
  const cx = b.W * 0.58
  return {
    cx,
    headY: b.UH * 0.17, // where the light leaves the cutting head
    lensY: b.UH * 0.38,
    plateY: b.UH * 0.6, // the steel's top
    px: b.W * 0.2, // the pointer
    rows: [-57, -38, -19, 0, 19, 38, 57],
  }
}

function cuttingHead(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(x - 52, y - 92, 104, 70, 10)
  ctx.fill()
  ctx.fillStyle = '#475569'
  ctx.beginPath()
  ctx.moveTo(x - 46, y - 22)
  ctx.lineTo(x + 46, y - 22)
  ctx.lineTo(x + 40, y)
  ctx.lineTo(x - 40, y)
  ctx.closePath()
  ctx.fill()
  text(ctx, 'cutting laser', x, y - 104, 'rgba(203, 213, 225, 0.75)', 12)
}

function pointerBody(ctx: CanvasRenderingContext2D, x: number, y: number, label = true) {
  ctx.fillStyle = '#64748b'
  ctx.beginPath()
  ctx.roundRect(x - 7, y - 46, 14, 46, 5)
  ctx.fill()
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(x, y - 30, 3, 0, Math.PI * 2)
  ctx.fill()
  if (label) text(ctx, 'laser pointer', x, y - 58, 'rgba(203, 213, 225, 0.75)', 12)
}

function lens(ctx: CanvasRenderingContext2D, x: number, y: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const g = ctx.createLinearGradient(x - 78, 0, x + 78, 0)
  g.addColorStop(0, 'rgba(186, 230, 253, 0.25)')
  g.addColorStop(0.5, 'rgba(224, 242, 254, 0.55)')
  g.addColorStop(1, 'rgba(186, 230, 253, 0.25)')
  ctx.fillStyle = g
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(x, y, 78, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  text(ctx, 'lens', x + 92, y, 'rgba(203, 213, 225, 0.75)', 12, '', 'left')
  ctx.restore()
}

function plate(ctx: CanvasRenderingContext2D, b: Box, y: number) {
  const g = ctx.createLinearGradient(0, y, 0, y + 34)
  g.addColorStop(0, '#94a3b8')
  g.addColorStop(1, '#475569')
  ctx.fillStyle = g
  ctx.fillRect(b.W * 0.06, y, b.W * 0.88, 34)
  text(ctx, 'steel', b.W * 0.06 + 30, y + 52, 'rgba(203, 213, 225, 0.75)', 12)
}

/** the cutter scene, side view. `lensIn` 0 … 1 = the lens sliding in;
 *  `focus` 0 … 1 = the rays bending to the spot — only once the lens is
 *  there (Elena, 2026-11-21: the rays bent before the lens arrived);
 *  `beamAt` = story time the cutter switched on; `beamAlpha` = how much of
 *  the (invisible) beam is drawn; `pointer` = the pointer beside it;
 *  `named` = bounce amounts for the parts the voice names */
function drawSide(
  ctx: CanvasRenderingContext2D,
  b: Box,
  t: number,
  idle: number,
  o: {
    key: string
    lensIn: number
    focus: number
    beamAt: number
    beamAlpha?: number
    pointer?: boolean
    heat?: number
    named?: { head?: number; pointer?: number; plate?: number; lens?: number }
  },
) {
  const g = sideGeo(b)
  const n = o.named ?? {}
  scaledAbout(ctx, b.W / 2, g.plateY + 17, 1 + 0.12 * (n.plate ?? 0), () => plate(ctx, b, g.plateY))
  scaledAbout(ctx, g.cx, g.headY - 50, 1 + 0.35 * (n.head ?? 0), () => cuttingHead(ctx, g.cx, g.headY))
  const lx = lerp(b.W + 90, g.cx, easeInOut(o.lensIn))
  // the light lives between where it leaves the laser and the steel
  const between = (c: CanvasRenderingContext2D) => c.rect(0, g.headY, b.W, g.plateY - g.headY)
  // the beam: seven rows of infrared packets; past the lens they head for
  // the spot as the rays focus (straight down without the lens)
  let landed = -1
  for (const [r, off] of g.rows.entries()) {
    const path: Pt[] = [
      { x: g.cx + off, y: g.headY },
      { x: g.cx + off, y: g.lensY },
      { x: lerp(g.cx + off, g.cx, o.focus), y: g.plateY },
    ]
    landed = Math.max(landed, stream(ctx, `${o.key}:row${r}`, path, t, o.beamAt, idle, IR_NM, { alpha: o.beamAlpha ?? 1, clip: between }))
  }
  scaledAbout(ctx, lx, g.lensY, 1 + 0.35 * (n.lens ?? 0), () => lens(ctx, lx, g.lensY))
  // where it lands: a wide dim patch without the lens, one tiny white-hot
  // spot with it
  if (landed >= 0) {
    const a = clamp01(landed / 0.4)
    const w = lerp(66, 6, o.focus)
    const heat = o.heat ?? o.focus
    const glow = ctx.createRadialGradient(g.cx, g.plateY, 0, g.cx, g.plateY, w + 18 + 16 * heat)
    glow.addColorStop(0, `rgba(255, 251, 235, ${a * (0.25 + 0.7 * o.focus) * (0.85 + 0.15 * Math.sin(idle * 9))})`)
    glow.addColorStop(0.5, `rgba(251, 146, 60, ${a * 0.45 * heat})`)
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.ellipse(g.cx, g.plateY, w + 18 + 16 * heat, 10 + 8 * heat, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (o.pointer) {
    scaledAbout(ctx, g.px, g.headY - 23, 1 + 0.6 * (n.pointer ?? 0), () => pointerBody(ctx, g.px, g.headY))
    const lit = stream(ctx, `${o.key}:pointer`, [{ x: g.px, y: g.headY }, { x: g.px, y: g.plateY }], t, o.beamAt, idle, POINTER_NM, { clip: between })
    if (lit >= 0) {
      const dot = ctx.createRadialGradient(g.px, g.plateY, 0, g.px, g.plateY, 9)
      dot.addColorStop(0, wavelengthToCss(POINTER_NM, 0.9))
      dot.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = dot
      ctx.beginPath()
      ctx.arc(g.px, g.plateY, 9, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return { landed, spot: { x: g.cx, y: g.plateY } }
}

// Every part is NAMED, one per piece, and bounces while it is said
// (holds at 0, 2.5, 5, 7.5, 10, 12.5): "Here is a cutting laser." → the
// cutting laser; "Next to it is a small laser pointer." → the pointer;
// "Below them is a sheet of steel." → the steel; "…millions of times
// stronger…" → both switch on, a fat beam beside a thin one; "A lens
// squeezes…" → the lens slides in (and bounces as it arrives), THEN the
// rays bend to one spot; "…called focus" → a living rest
const BEAMS_AT = 7.6
const LENS_AT = 10.1
function drawSqueeze(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const lensIn = clamp01((t - LENS_AT) / 0.9)
  const focus = clamp01((t - LENS_AT - 1) / 0.7)
  const named = {
    head: bounce(sinceLaunch('sq:nameHead', t, 0, idle)),
    pointer: bounce(sinceLaunch('sq:namePointer', t, 2.2, idle)),
    plate: bounce(sinceLaunch('sq:namePlate', t, 4.7, idle)),
    lens: bounce(sinceLaunch('sq:nameLens', t, LENS_AT + 0.9, idle), 0.3, 0.6, 0.35),
  }
  const r = drawSide(ctx, b, t, idle, { key: 'sq', lensIn, focus, beamAt: BEAMS_AT, pointer: true, named })
  if (focus >= 1 && r.landed >= 0) marker(ctx, r.spot.x, r.spot.y, 20, idle)
  if (t >= 12.6) text(ctx, 'focus', r.spot.x + 34, r.spot.y - 22, 'rgba(203, 213, 225, 0.75)', 12, '', 'left')
}

// ---------- 🔍 the steel, close up ----------

function steelGeo(b: Box) {
  const cols = 4
  const rows = 3
  const sx = b.W / (cols + 0.8)
  const K = Math.min(1.5, (sx * 0.4) / shellAtomR(IRON.protons, 1))
  const R = shellAtomR(IRON.protons, K)
  const sy = Math.min(R * 2.5, b.UH * 0.22)
  const x0 = b.W / 2 - ((cols - 1) * sx) / 2 - b.W * 0.05
  const y0 = b.UH * 0.42
  const atoms: Array<{ x: number; y: number; i: number }> = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) atoms.push({ x: x0 + c * sx + (r % 2) * sx * 0.5, y: y0 + r * sy, i: atoms.length })
  return { K, R, atoms, fireX: b.W - 40, fireY0: b.UH * 0.2, fireY1: b.UH * 0.86 }
}

/** cartoon "shaking marks": little arcs either side of something shaking
 *  (the power plant's) */
function shakeMarks(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, amount: number) {
  if (amount <= 0.05) return
  ctx.save()
  ctx.strokeStyle = `rgba(253, 230, 138, ${0.85 * Math.min(1, amount)})`
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    for (const k of [0, 1]) {
      const rr = r + 6 + k * 6
      ctx.beginPath()
      ctx.arc(x, y, rr, side > 0 ? -0.45 : Math.PI - 0.45, side > 0 ? 0.45 : Math.PI + 0.45)
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** the 🔥 track: how hot the steel is (the power plant's) */
function fireTrack(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, heat: number) {
  const track = ctx.createLinearGradient(0, y1, 0, y0)
  track.addColorStop(0, '#334155')
  track.addColorStop(0.5, '#f59e0b')
  track.addColorStop(1, '#dc2626')
  ctx.fillStyle = track
  ctx.beginPath()
  ctx.roundRect(x - 5, y0, 10, y1 - y0, 5)
  ctx.fill()
  text(ctx, 'hot', x, y0 - 14, 'rgba(226, 232, 240, 0.9)', 12)
  text(ctx, 'cold', x, y1 + 14, 'rgba(226, 232, 240, 0.9)', 12)
  ctx.font = `${26 + 12 * heat}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🔥', x, y1 - (y1 - y0) * (0.08 + 0.8 * heat) - 4)
}

/**
 * The iron atoms under the spot. `landAt` = story time the first photons
 * set off (one onto each top-row atom, staggered; each landing is a push:
 * a ghost flash, a jolt); `rainAt` = from then on light keeps landing all
 * over; `heat` 0 … 1 = how hard they shake (+ marks, the 🔥 track).
 */
function drawSteel(
  ctx: CanvasRenderingContext2D,
  b: Box,
  t: number,
  idle: number,
  o: { key: string; landAt: number; rainAt: number; heat: number; hero?: boolean; bare?: boolean },
) {
  const g = steelGeo(b)
  const PATH = 160
  const fly = PATH / PHOTON_SPEED
  // the light above: where it comes from (the spot, very close)
  if (!o.bare) {
    const sky = ctx.createLinearGradient(0, 0, 0, b.UH * 0.25)
    sky.addColorStop(0, 'rgba(232, 238, 245, 0.10)')
    sky.addColorStop(1, 'rgba(232, 238, 245, 0)')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, b.W, b.UH * 0.25)
  }
  for (const a of g.atoms) {
    const top = a.i < 4
    // the first photons: one per top-row atom (the hero's first)
    let kick = 0
    if (top) {
      const at = o.landAt + (a.i === 1 ? 0 : 0.45 + a.i * 0.3)
      const since = sinceLaunch(`${o.key}:land${a.i}`, t, at, idle)
      if (since >= 0 && since < fly) packet(ctx, a.x, a.y - g.R - PATH + PHOTON_SPEED * since, Math.PI / 2, IR_NM, idle, Math.min(1, (since / fly) * 4))
      const after = since - fly
      if (after >= 0) {
        kick = Math.max(0, 1 - after / 0.9)
        if (after < 0.6) {
          ctx.strokeStyle = `rgba(232, 238, 245, ${0.8 * (1 - after / 0.6)})`
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(a.x, a.y - g.R * 0.5, 6 + after * 50, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }
    // the rain: light keeps landing everywhere (a drop per atom every 1.4 s)
    const rain = sinceLaunch(`${o.key}:rain`, t, o.rainAt, idle)
    if (rain >= 0) {
      const ph = rnd(a.i, 7) * 1.4
      const k = Math.floor((rain - ph) / 1.4)
      const q = rain - ph - k * 1.4
      if (k >= 0 && q < fly) packet(ctx, a.x + (rnd(a.i, 9) - 0.5) * g.R, a.y - g.R - PATH + PHOTON_SPEED * q, Math.PI / 2, IR_NM, idle, Math.min(1, (q / fly) * 4))
      if (k >= 0 && q >= fly) kick = Math.max(kick, 0.5 * Math.max(0, 1 - (q - fly) / 0.5))
    }
    const amp = (1.2 + 7 * o.heat) * (1 + kick * 1.6)
    const x = a.x + amp * Math.sin(idle * (9 + o.heat * 9) + a.i * 1.7)
    const y = a.y + amp * Math.cos(idle * (11 + o.heat * 9) + a.i * 2.3)
    shellAtom(ctx, x, y, g.K, IRON.protons, IRON.nucleons, idle)
    shakeMarks(ctx, x, y, g.R, (o.heat - 0.25) * 1.6 + kick * 0.6)
    if (o.hero && a.i === 1) marker(ctx, x, y, g.R + 8, idle)
  }
  if (o.bare) return
  fireTrack(ctx, g.fireX, g.fireY0, g.fireY1, o.heat)
  text(ctx, 'iron atoms in the steel', b.W * 0.45, b.UH * 0.93, 'rgba(203, 213, 225, 0.75)', 12)
}

/** the middle of the atoms (and the light above them), and how big */
function steelBlock(b: Box) {
  const g = steelGeo(b)
  const xs = g.atoms.map((a) => a.x)
  const ys = g.atoms.map((a) => a.y)
  const x0 = Math.min(...xs) - g.R
  const x1 = Math.max(...xs) + g.R
  const y0 = Math.min(...ys) - g.R - 120
  const y1 = Math.max(...ys) + g.R
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
}

/** "🔍 we are here": the steel under the spot */
function hereCorner(ctx: CanvasRenderingContext2D, b: Box, alpha = 1) {
  if (alpha <= 0) return
  const w = 128
  const x = b.W - w - 18
  const y = 16
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
  ctx.beginPath()
  ctx.roundRect(x - 8, y - 6, w + 16, 76, 10)
  ctx.fill()
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(x + 8, y + 30, w - 16, 10)
  ctx.strokeStyle = 'rgba(232, 238, 245, 0.7)'
  ctx.lineWidth = 1
  for (const o of [-6, 0, 6]) {
    ctx.beginPath()
    ctx.moveTo(x + w / 2 + o, y + 6)
    ctx.lineTo(x + w / 2, y + 30)
    ctx.stroke()
  }
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2.5
  ctx.strokeRect(x + w / 2 - 9, y + 24, 18, 20)
  text(ctx, '🔍 we are here', x + w / 2, y + 60, AMBER_SOFT, 11, '600')
  ctx.restore()
}


// "Let's fly into the steel, right under the bright spot." → the camera
// zooms into the spot (the cutter grows past the screen, the atoms grow in
// out of the spot, 0.05–2.4); "These are iron atoms…" → a living rest, the
// hero atom ringed; "Each photon that lands gives an atom a push." →
// photons land, one per atom, each a jolt; "The atoms shake harder…" → the
// light keeps landing, the shaking grows, the 🔥 climbs; the explanation
// (it melts, a hole) → a living rest (holds at 0, 2.5, 5, 7.5, 10)
function heatAt(t: number) {
  return t < 7.6 ? 0.12 : lerp(0.3, 1, easeInOut(clamp01((t - 7.6) / 2.3)))
}
function drawHeat(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const z = easeInOut(clamp01((t - 0.05) / 2.35))
  const sg = sideGeo(b)
  const spot = { x: sg.cx, y: sg.plateY }
  // the cutter grows past the screen, centred on the spot…
  const sideA = 1 - clamp01((z - 0.45) / 0.3)
  if (sideA > 0) {
    ctx.save()
    ctx.globalAlpha *= sideA
    scaledAbout(ctx, spot.x, spot.y, 1 + 9 * z * z, () => drawSide(ctx, b, t, idle, { key: 'ht:side', lensIn: 1, focus: 1, beamAt: -20 }))
    ctx.restore()
  }
  // …and the atoms grow in out of it
  const atomA = clamp01((z - 0.4) / 0.35)
  if (atomA > 0) {
    const blk = steelBlock(b)
    const k = lerp(0.12, 1, z)
    ctx.save()
    ctx.globalAlpha *= atomA
    ctx.translate(lerp(spot.x, blk.cx, z), lerp(spot.y, blk.cy, z))
    ctx.scale(k, k)
    ctx.translate(-blk.cx, -blk.cy)
    drawSteel(ctx, b, t, idle, { key: 'ht', landAt: 5.1, rainAt: 7.6, heat: heatAt(t), hero: t >= 2.6, bare: z < 1 })
    ctx.restore()
  }
  hereCorner(ctx, b, fadeIn(t, 2.4))
}

// ---------- 🔁 the drill-in ----------

/** the replay look: a rounded frame with a soft vignette and a 🔁 badge —
 *  the same scene, seen again as a look back (playbook 25) */
export function replayFrame(ctx: CanvasRenderingContext2D, b: Box, alpha: number) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const v = ctx.createRadialGradient(b.W / 2, b.UH / 2, Math.min(b.W, b.UH) * 0.35, b.W / 2, b.UH / 2, Math.max(b.W, b.UH) * 0.75)
  v.addColorStop(0, 'rgba(2, 6, 23, 0)')
  v.addColorStop(1, 'rgba(2, 6, 23, 0.75)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, b.W, b.UH)
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.55)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(14, 14, b.W - 28, b.UH - 28, 18)
  ctx.stroke()
  ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
  ctx.beginPath()
  ctx.roundRect(58, 24, 104, 30, 15) // right of the canvas ← button
  ctx.fill()
  text(ctx, '🔁 replay', 110, 39, AMBER_SOFT, 13, '600')
  ctx.restore()
}

/** a numbered amber step ring ①②③ */
export function stepRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n: number, idle: number, alpha: number) {
  if (alpha <= 0) return
  marker(ctx, x, y, r, idle, alpha)
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.arc(x + r * 0.75, y - r * 0.75, 12, 0, Math.PI * 2)
  ctx.fill()
  text(ctx, String(n), x + r * 0.75, y - r * 0.75, '#0b1226', 13, '700')
  ctx.restore()
}

/** a callout: a circle showing a zoomed-in view, two lines from the point
 *  it looks at (the spot) to the circle's edges */
export function callout(ctx: CanvasRenderingContext2D, from: Pt, c: Pt, r: number, alpha: number, inside: () => void) {
  if (alpha <= 0) return
  const d = Math.hypot(c.x - from.x, c.y - from.y)
  const phi = Math.atan2(c.y - from.y, c.x - from.x)
  const al = Math.asin(Math.min(1, r / d))
  const L = Math.sqrt(Math.max(0, d * d - r * r))
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 5])
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(from.x + Math.cos(phi + s * al) * L, from.y + Math.sin(phi + s * al) * L)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.save()
  ctx.beginPath()
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#060b1a'
  ctx.fill()
  ctx.clip()
  inside()
  ctx.restore()
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// holds at 0, 2.5, 5, 7.5 — the big laser stays on screen all through:
// the opener → a rewind sweep, the replay frame opens on the cutter;
// "First, the lens squeezes…" → ① the lens slides in, slowly, THEN the
// rays bend to the spot; "Then the light lands on the atoms…" → ② a
// zoomed-in circle opens beside the spot, lines to it: inside, photons
// land on the atoms; "So the atoms shake…" → ③ they wobble harder and the
// spot glows hot
function drawDrill(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const sweep = clamp01((t - 0.1) / 0.9)
  const open = fadeIn(t, 0.9, 0.5)
  const g = sideGeo(b)
  const lensIn = clamp01((t - 2.6) / 1.3) // slow motion
  const focus = clamp01((t - 3.9) / 0.9)
  const heat = t < 7.6 ? lerp(0.3, 0.45, focus) : lerp(0.45, 1, easeInOut(clamp01((t - 7.6) / 1.8)))
  ctx.save()
  ctx.globalAlpha *= open
  const r = drawSide(ctx, b, t, idle, { key: 'dr:side', lensIn, focus, beamAt: -20, heat })
  stepRing(ctx, g.cx, g.lensY, 84, 1, idle, fadeIn(t, 2.6, 0.4) * (1 - fadeIn(t, 5, 0.4)))
  // ② the zoomed-in view: a circle below-left of the spot, lines to it
  // (below the steel, clear of it and of the frame)
  const cr = Math.min(b.W, b.UH) * 0.17
  const cc = { x: b.W * 0.28, y: Math.min(b.UH - cr - 30, g.plateY + 64 + cr) }
  const pop = bounce(sinceLaunch('dr:callout', t, 5.1, idle), 0.4, 999, 0.1)
  const inset = Math.min(1, pop) > 0 ? 0.6 + 0.4 * Math.min(1.1, pop) : 0
  callout(ctx, r.spot, cc, cr * inset, clamp01(pop * 2), () => {
    const blk = steelBlock(b)
    const k = (1.8 * cr * inset) / Math.max(blk.w, blk.h)
    ctx.save()
    ctx.translate(cc.x, cc.y)
    ctx.scale(k, k)
    ctx.translate(-blk.cx, -blk.cy)
    drawSteel(ctx, b, t, idle, { key: 'dr', landAt: 5.5, rainAt: 7.6, heat: t < 7.6 ? 0.12 : heat, bare: true })
    ctx.restore()
  })
  if (pop > 0) {
    stepRing(ctx, cc.x, cc.y, cr + 8, 2, idle, fadeIn(t, 5.3, 0.4) * (1 - fadeIn(t, 7.5, 0.3)))
    stepRing(ctx, cc.x, cc.y, cr + 8, 3, idle, fadeIn(t, 7.6, 0.4))
  }
  ctx.restore()
  rewindSweep(ctx, b, sweep)
  replayFrame(ctx, b, open)
}

/** the drill-in's opening: streaks rushing right to left, ⏪ (0 < sweep < 1) */
export function rewindSweep(ctx: CanvasRenderingContext2D, b: Box, sweep: number) {
  if (sweep <= 0 || sweep >= 1) return
  ctx.save()
  ctx.globalAlpha *= Math.sin(sweep * Math.PI)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)'
  ctx.lineWidth = 2
  for (let i = 0; i < 14; i++) {
    const y = b.UH * (0.08 + 0.065 * i)
    const x = b.W * (1.2 - sweep * 1.6) + rnd(i, 3) * 120
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 90 + rnd(i, 5) * 80, y)
    ctx.stroke()
  }
  text(ctx, '⏪', b.W / 2, b.UH / 2, 'rgba(226, 232, 240, 0.9)', 56)
  ctx.restore()
}

// ---------- ✂️ the cut, from above ----------

function starPath(cx: number, cy: number, R: number) {
  const pts: Pt[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? R * 0.45 : R
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
  }
  pts.push(pts[0])
  return pts
}

/** sparks flying off a hot point (idle clock: they never stop) */
function sparks(ctx: CanvasRenderingContext2D, x: number, y: number, idle: number, scale = 1, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  for (let i = 0; i < 16; i++) {
    const period = 0.45 + rnd(i, 1) * 0.35
    const k = Math.floor((idle + rnd(i, 2) * period) / period)
    const q = (idle + rnd(i, 2) * period) / period - k
    const a = rnd(i + k * 13, 3) * Math.PI * 2
    const d = q * (40 + rnd(i + k * 13, 4) * 60) * scale
    const sx = x + Math.cos(a) * d
    const sy = y + Math.sin(a) * d + q * q * 20 * scale
    ctx.strokeStyle = `rgba(253, ${Math.round(200 - 120 * q)}, 60, ${1 - q})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx - Math.cos(a) * 6 * scale, sy - Math.sin(a) * 6 * scale)
    ctx.stroke()
  }
  ctx.restore()
}

function steelTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, '#94a3b8')
  g.addColorStop(0.5, '#cbd5e1')
  g.addColorStop(1, '#64748b')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 6)
  ctx.fill()
  // brushed lines
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.18)'
  ctx.lineWidth = 1
  for (let yy = y + 6; yy < y + h; yy += 7) {
    ctx.beginPath()
    ctx.moveTo(x + 4, yy)
    ctx.lineTo(x + w - 4, yy)
    ctx.stroke()
  }
}

function fillStar(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
}

// RUN (no holds): 0–0.8 the plate from above; 1–7 the spot draws the star
// — a white-hot kerf cooling to orange, red and a dark slot, sparks, puffs
// of air; 7–8 the star sinks; 8–9.4 out it comes, cooling beside the plate
const DRAW_FROM = 1
const DRAW_TO = 7
function drawCut(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const px = b.W * 0.12
  const py = b.UH * 0.12
  const pw = b.W * 0.62
  const ph = b.UH * 0.62
  const cx = px + pw / 2
  const cy = py + ph / 2
  const R = Math.min(pw, ph) * 0.34
  const pts = starPath(cx, cy, R)
  const L = pathLen(pts)
  ctx.save()
  ctx.globalAlpha *= fadeIn(t, 0, 0.6)
  steelTop(ctx, px, py, pw, ph)
  const p = clamp01((t - DRAW_FROM) / (DRAW_TO - DRAW_FROM))
  const out = clamp01((t - 7.1) / 0.9) // the star sinks
  const away = clamp01((t - 8) / 1.4) // and comes out
  if (out > 0) {
    // the star-shaped hole
    ctx.fillStyle = '#05070f'
    fillStar(ctx, pts)
    ctx.fill()
  }
  // the kerf: sampled along the star, colored by how long ago it was cut
  const step = 4
  for (let d = 0; d < L * p; d += step) {
    const a = along(pts, d)
    if (!a) break
    const age = ((L * p - d) / L) * (DRAW_TO - DRAW_FROM)
    const col =
      age < 0.25
        ? 'rgba(255, 251, 235, 1)'
        : age < 1.2
          ? 'rgba(251, 146, 60, 0.95)'
          : age < 2.6
            ? 'rgba(185, 28, 28, 0.9)'
            : 'rgba(15, 23, 42, 0.95)'
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(a.x, a.y, age < 0.25 ? 4 : 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  // the star piece itself: sinking, then out and away, still glowing
  if (out > 0) {
    const sx = lerp(cx, px + pw + b.W * 0.13, easeInOut(away))
    const sy = lerp(cy + 6 * out, b.UH * 0.78, easeInOut(away))
    const sc = lerp(1, 0.6, easeInOut(away)) * (1 - 0.08 * out * (1 - away))
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(0.5 * easeInOut(away))
    ctx.scale(sc, sc)
    ctx.translate(-cx, -cy)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 14
    const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
    g.addColorStop(0, '#cbd5e1')
    g.addColorStop(1, '#64748b')
    ctx.fillStyle = g
    fillStar(ctx, pts)
    ctx.fill()
    ctx.shadowBlur = 0
    // its edge still glows from the cut, cooling (idle shimmer)
    ctx.strokeStyle = `rgba(251, 146, 60, ${0.75 * (1 - 0.5 * away) * (0.8 + 0.2 * Math.sin(idle * 4))})`
    ctx.lineWidth = 4
    fillStar(ctx, pts)
    ctx.stroke()
    ctx.restore()
    if (away >= 1) tag(ctx, '⭐ cut out of steel by light', sx, sy + R * 0.75, AMBER_SOFT, 14, fadeIn(t, 9.4))
  }
  // the cutting head's spot, the sparks and the puffs of air
  if (t >= DRAW_FROM - 0.2 && t < DRAW_TO + 0.2) {
    const a = along(pts, L * p) ?? { x: pts[0].x, y: pts[0].y }
    const on = fadeIn(t, DRAW_FROM - 0.2, 0.2) * (1 - fadeIn(t, DRAW_TO, 0.2))
    ctx.save()
    ctx.globalAlpha *= on
    // puffs of air blowing the melt away
    for (let i = 0; i < 4; i++) {
      const q = (idle * 1.6 + i / 4) % 1
      ctx.fillStyle = `rgba(203, 213, 225, ${0.28 * (1 - q)})`
      ctx.beginPath()
      ctx.arc(a.x + Math.cos(i * 1.7) * q * 26, a.y + Math.sin(i * 1.7) * q * 26, 6 + q * 16, 0, Math.PI * 2)
      ctx.fill()
    }
    const glow = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 26)
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)')
    glow.addColorStop(0.35, 'rgba(254, 240, 138, 0.9)')
    glow.addColorStop(1, 'rgba(251, 146, 60, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(a.x, a.y, 26, 0, Math.PI * 2)
    ctx.fill()
    // the cutting head above it (seen from the top: a ring)
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.9)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(a.x, a.y, 34, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    sparks(ctx, a.x, a.y, idle, 1, on)
  }
}

// ---------- 👻 invisible light ----------

/** the rainbow and, past its red end, infrared — where the cutter's light
 *  is (a ghost packet in an amber ring) */
function spectrumStrip(ctx: CanvasRenderingContext2D, b: Box, idle: number, alpha: number) {
  if (alpha <= 0) return
  const x0 = b.W * 0.1
  const w = b.W * 0.5
  const irW = b.W * 0.26
  const y = b.UH * 0.76 // below the steel, clear of the cutting head
  const h = 26
  ctx.save()
  ctx.globalAlpha *= alpha
  const g = ctx.createLinearGradient(x0, 0, x0 + w, 0)
  for (let i = 0; i <= 12; i++) g.addColorStop(i / 12, wavelengthToCss(400 + (300 * i) / 12, 1))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(x0, y, w, h, 6)
  ctx.fill()
  ctx.setLineDash([5, 4])
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(x0 + w + 4, y, irW, h, 6)
  ctx.stroke()
  ctx.setLineDash([])
  text(ctx, 'infrared', x0 + w + 4 + irW / 2, y + h + 14, 'rgba(203, 213, 225, 0.75)', 12)
  const ix = x0 + w + 4 + irW * 0.45
  packet(ctx, ix, y + h / 2, 0, IR_NM, idle, 1, 44)
  marker(ctx, ix, y + h / 2, 22, idle)
  ctx.restore()
}

// holds at 0, 2.5, 5: "…infrared. Infra. Red." → the rainbow and infrared
// beyond it; "We cannot see it…" → the drawn beam fades to what an eye
// sees: only the spot; "So the cutter works inside a closed box." → a box
// comes down over it, with a dark window
function drawInvisible(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const seen = 1 - 0.88 * clamp01((t - 2.6) / 0.9)
  drawSide(ctx, b, t, idle, { key: 'inv', lensIn: 1, focus: 1, beamAt: -20, beamAlpha: seen })
  spectrumStrip(ctx, b, idle, fadeIn(t, 0.1, 0.5))
  const box = easeOut(clamp01((t - 5.1) / 1.1))
  if (box > 0) {
    const g = sideGeo(b)
    const x0 = g.cx - 120
    const x1 = g.cx + 170
    const y0 = g.headY - 130
    const y1 = g.plateY + 60
    const drop = (1 - box) * (y1 + 40)
    ctx.save()
    ctx.translate(0, -drop)
    ctx.fillStyle = 'rgba(30, 41, 59, 0.97)'
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 14)
    ctx.fill()
    ctx.stroke()
    // the dark window: inside, only the spot shows
    const wx0 = x0 + 30
    const wy0 = g.lensY - 30
    ctx.fillStyle = 'rgba(120, 53, 15, 0.55)'
    ctx.beginPath()
    ctx.roundRect(wx0, wy0, x1 - x0 - 60, g.plateY - wy0 + 22, 10)
    ctx.fill()
    ctx.restore()
    if (box >= 1) {
      const spot = ctx.createRadialGradient(g.cx, g.plateY, 0, g.cx, g.plateY, 16)
      spot.addColorStop(0, `rgba(255, 237, 213, ${0.7 + 0.2 * Math.sin(idle * 9)})`)
      spot.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = spot
      ctx.beginPath()
      ctx.arc(g.cx, g.plateY, 16, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// ---------- 👁️ your eye ----------

/** a laser pointer seen from the side, at the eye's scale: a pen (thick
 *  ≈ half the eyeball), a metal cap, a red button; its light leaves a
 *  small opening in the middle of the front (tip at x) */
function bigPointer(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  if (alpha <= 0) return
  const th = r * 0.48
  const len = r * 2.6
  ctx.save()
  ctx.globalAlpha *= alpha
  const body = ctx.createLinearGradient(0, y - th / 2, 0, y + th / 2)
  body.addColorStop(0, '#94a3b8')
  body.addColorStop(0.5, '#475569')
  body.addColorStop(1, '#1e293b')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.roundRect(x - len, y - th / 2, len, th, th * 0.3)
  ctx.fill()
  const cap = ctx.createLinearGradient(0, y - th / 2, 0, y + th / 2)
  cap.addColorStop(0, '#e2e8f0')
  cap.addColorStop(1, '#64748b')
  ctx.fillStyle = cap
  ctx.beginPath()
  ctx.roundRect(x - th * 0.6, y - th / 2, th * 0.6, th, [0, th * 0.2, th * 0.2, 0])
  ctx.fill()
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.roundRect(x - len * 0.55, y - th / 2 - th * 0.12, th * 0.5, th * 0.16, th * 0.06)
  ctx.fill()
  ctx.fillStyle = '#0b1226'
  ctx.beginPath()
  ctx.arc(x - 1, y, th * 0.09, 0, Math.PI * 2)
  ctx.fill()
  text(ctx, 'laser pointer', x - len * 0.4, y + th / 2 + 16, 'rgba(203, 213, 225, 0.75)', 12)
  ctx.restore()
}

function eyeGeo(b: Box) {
  const r = Math.min(b.UH * 0.22, b.W * 0.2)
  const x = b.W * 0.64
  const y = b.UH * 0.46
  const s = r / 74
  return { x, y, r, s, pupilX: x - r + 14 * s, lensX: x - r + 26 * s, retinaX: x + r - 7 * s }
}

// shown first: the eye (0–2.5); "Your eye has a lens too." → the lens
// ringed, sunlight from everywhere spreads softly over the back; "It
// squeezes a laser beam into one tiny spot…" → a pointer's beam comes in
// and is squeezed onto one point; "This is the retina." → the retina
// lit up; the danger → a living rest (holds at 2.5, 5, 7.5, 10). No harm
// is drawn — the danger is said in words only.
function drawEyeBeat(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const e = eyeGeo(b)
  const appear = easeOut(clamp01(t / 1.6))
  ctx.save()
  ctx.globalAlpha *= appear
  ctx.translate(e.x, e.y)
  ctx.scale(lerp(0.7, 1, appear), lerp(0.7, 1, appear))
  ctx.translate(-e.x, -e.y)
  // the pointer at the eye's true scale: a pen about half as thick as the
  // eyeball, its little opening in the middle of its front end
  const tipX = e.x - e.r - e.r * 0.55
  const px = tipX
  let lit = -1
  // light lives inside the eye once it has passed the pupil (and, for the
  // laser, starts at the pointer's tip)
  const inEye = (from: number) => (c: CanvasRenderingContext2D) => {
    c.rect(from, 0, e.pupilX - from, b.UH)
    c.moveTo(e.x + e.r - 8 * e.s, e.y)
    c.arc(e.x, e.y, e.r - 8 * e.s, 0, Math.PI * 2)
  }
  drawEye(ctx, e.x, e.y, e.r, () => {
    // the eye's lens, behind the pupil
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)'
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.8)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(e.lensX, e.y, 9 * e.s, 30 * e.s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    // sunlight: from everywhere, spread softly over the back
    const sunOn = sinceLaunch('eye:sunGlow', t, 2.6, idle)
    if (sunOn >= 0) {
      const a = clamp01((sunOn - 2) / 1.5) * 0.35
      ctx.strokeStyle = `rgba(255, 246, 214, ${a})`
      ctx.lineWidth = 10 * e.s
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.r - 12 * e.s, -Math.PI * 0.3, Math.PI * 0.3)
      ctx.stroke()
    }
    // the retina, named
    const named = fadeIn(t, 7.6, 0.5)
    if (named > 0) {
      ctx.save()
      ctx.globalAlpha *= named * (0.7 + 0.3 * Math.sin(idle * 5))
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 4 * e.s
      ctx.beginPath()
      ctx.arc(e.x, e.y, e.r - 7 * e.s, -Math.PI * 0.32, Math.PI * 0.32)
      ctx.stroke()
      ctx.restore()
    }
    // the light, drawn under the eyelids: sunlight's rays in through the
    // pupil and out over all of the back (ordinary light: the bone
    // photo's warm white, rule 3b) …
    for (let i = 0; i < 5; i++) {
      const off = (i - 2) * 22 * e.s
      const end = (i - 2) * 0.13 * Math.PI
      const path: Pt[] = [
        { x: e.x - e.r - 170, y: e.y - off * 1.6 },
        { x: e.lensX, y: e.y - off * 0.12 },
        { x: e.x + Math.cos(-end) * (e.r - 10 * e.s), y: e.y + Math.sin(-end) * (e.r - 10 * e.s) },
      ]
      stream(ctx, `eye:sun${i}`, path, t, 2.6 + i * 0.15, idle, 580, { alpha: 0.7, spacing: 70, css: ordinaryCss, clip: inEye(0) })
    }
    // … and the pointer's beam, squeezed onto ONE point
    for (const [r, off] of [-0.06, 0, 0.06].entries()) {
      const path: Pt[] = [
        { x: tipX, y: e.y + off * e.r },
        { x: e.lensX, y: e.y + off * e.r },
        { x: e.retinaX - 3, y: e.y },
      ]
      lit = Math.max(lit, stream(ctx, `eye:laser${r}`, path, t, 5.15, idle, POINTER_NM, { spacing: 40, clip: inEye(tipX) }))
    }
  })
  ctx.restore()
  if (t >= 5.1) bigPointer(ctx, px, e.y, e.r, fadeIn(t, 5.1, 0.3))
  if (lit >= 0) {
    const dot = ctx.createRadialGradient(e.retinaX - 3, e.y, 0, e.retinaX - 3, e.y, 10)
    dot.addColorStop(0, `rgba(255, 228, 230, ${clamp01(lit / 0.4)})`)
    dot.addColorStop(0.4, wavelengthToCss(POINTER_NM, 0.9 * clamp01(lit / 0.4)))
    dot.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = dot
    ctx.beginPath()
    ctx.arc(e.retinaX - 3, e.y, 10, 0, Math.PI * 2)
    ctx.fill()
    marker(ctx, e.retinaX - 3, e.y, 16, idle, clamp01(lit / 0.4))
  }
  if (t >= 2.6) marker(ctx, e.lensX, e.y, 34 * e.s, idle, (1 - fadeIn(t, 5, 0.4)) * fadeIn(t, 2.6, 0.3))
  text(ctx, 'lens', e.lensX, e.y + 46 * e.s, 'rgba(203, 213, 225, 0.75)', 12)
  if (t >= 7.6) text(ctx, 'retina', e.x + e.r * 0.55, e.y - e.r * 0.82, 'rgba(203, 213, 225, 0.8)', 12)
}

// ---------- 🛡️ safe or not ----------

function verdict(ctx: CanvasRenderingContext2D, x: number, y: number, ok: boolean, alpha: number) {
  if (alpha <= 0) return
  const s = 0.6 + 0.4 * easeOut(alpha)
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = ok ? GREEN_OK : RED_NO
  ctx.beginPath()
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#0b1226'
  ctx.lineWidth = 5 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (ok) {
    ctx.moveTo(x - 10 * s, y)
    ctx.lineTo(x - 2 * s, y + 8 * s)
    ctx.lineTo(x + 11 * s, y - 8 * s)
  } else {
    ctx.moveTo(x - 8 * s, y - 8 * s)
    ctx.lineTo(x + 8 * s, y + 8 * s)
    ctx.moveTo(x + 8 * s, y - 8 * s)
    ctx.lineTo(x - 8 * s, y + 8 * s)
  }
  ctx.stroke()
  ctx.restore()
}

/** an icon with a red "no" ring and slash across it */
function noSign(ctx: CanvasRenderingContext2D, icon: string, x: number, y: number, size: number, alpha: number) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(icon, x, y)
  ctx.strokeStyle = RED_NO
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(x, y, size * 0.72, 0, Math.PI * 2)
  ctx.moveTo(x - size * 0.5, y - size * 0.5)
  ctx.lineTo(x + size * 0.5, y + size * 0.5)
  ctx.stroke()
  ctx.restore()
}

function safeGeo(b: Box) {
  const m = 18
  const gap = 14
  const w = (b.W - 2 * m - 2 * gap) / 3
  return { m, gap, w, top: b.UH * 0.06, h: b.UH * 0.46, x: (i: number) => m + i * (w + gap) }
}

function panel(ctx: CanvasRenderingContext2D, b: Box, i: number, alpha: number, draw: (x: number, y: number, w: number, h: number) => void) {
  if (alpha <= 0) return
  const g = safeGeo(b)
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = '#0b1226'
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.9)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(g.x(i), g.top, g.w, g.h, 12)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(g.x(i), g.top, g.w, g.h, 12)
  ctx.clip()
  draw(g.x(i), g.top, g.w, g.h)
  ctx.restore()
}

// shown first: the three panels (0–2.5); then each verdict after its
// sentence — scanner ✓, disc player ✓, strong pointer ✗ — the rule as
// icons, then the Moon (holds at 2.5, 5, 7.5, 10, 12.5)
function drawSafe(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b)
  const g = safeGeo(b)
  const fade = 1 - 0.8 * fadeIn(t, 12.6, 0.8)
  ctx.save()
  ctx.globalAlpha *= fade
  // 🛒 the scanner: its weak light fanned out wide over a barcode
  panel(ctx, b, 0, fadeIn(t, 0.1, 0.5), (x, y, w, h) => {
    const cx = x + w / 2
    const by = y + h * 0.72
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = i % 3 ? '#e2e8f0' : '#0f172a'
      ctx.fillRect(cx - 54 + i * 6, by, i % 4 === 1 ? 2 : 4, 34)
    }
    ctx.fillStyle = '#334155'
    ctx.fillRect(cx - 40, y + 26, 80, 18)
    const sweep = Math.sin(idle * 1.4) * 0.35
    for (let k = -3; k <= 3; k++) {
      const a = Math.PI / 2 + k * 0.12 + sweep * 0.3
      ctx.strokeStyle = wavelengthToCss(POINTER_NM, 0.22)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx, y + 44)
      ctx.lineTo(cx + Math.cos(a) * (by - y - 44) / Math.sin(a), by)
      ctx.stroke()
    }
    text(ctx, '🛒 shop scanner', cx, y + h - 14, 'rgba(148, 163, 184, 0.85)', 11)
  })
  // 💿 the disc player: its laser stays inside the box
  panel(ctx, b, 1, fadeIn(t, 0.4, 0.5), (x, y, w, h) => {
    const cx = x + w / 2
    const cy = y + h * 0.5
    ctx.fillStyle = '#1e293b'
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(cx - w * 0.36, cy - 44, w * 0.72, 88, 10)
    ctx.fill()
    ctx.stroke()
    // a cut-away window: the disc spinning and the tiny laser under it
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)'
    ctx.beginPath()
    ctx.roundRect(cx - 46, cy - 32, 92, 64, 8)
    ctx.fill()
    const dg = ctx.createConicGradient(idle * 3, cx, cy - 4)
    dg.addColorStop(0, '#cbd5e1')
    dg.addColorStop(0.3, '#a5b4fc')
    dg.addColorStop(0.6, '#f0abfc')
    dg.addColorStop(1, '#cbd5e1')
    ctx.fillStyle = dg
    ctx.beginPath()
    ctx.ellipse(cx, cy - 4, 36, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(232, 238, 245, 0.8)'
    ctx.beginPath()
    ctx.arc(cx + 14, cy + 18, 3, 0, Math.PI * 2)
    ctx.fill()
    text(ctx, '💿 disc player', cx, y + h - 14, 'rgba(148, 163, 184, 0.85)', 11)
  })
  // 🔴 a strong pointer: a bright beam
  panel(ctx, b, 2, fadeIn(t, 0.7, 0.5), (x, y, w, h) => {
    const cy = y + h * 0.48
    ctx.save()
    ctx.translate(x + 30, cy)
    ctx.rotate(-Math.PI / 2)
    ctx.translate(-(x + 30), -cy)
    pointerBody(ctx, x + 30, cy + 23, false)
    ctx.restore()
    for (let j = 0; j < 4; j++) {
      const d = (idle * PHOTON_SPEED + (j * (w - 40)) / 4) % (w - 40)
      packet(ctx, x + 50 + d, cy, 0, POINTER_NM, idle, 1, 40)
    }
    text(ctx, '🔴 strong laser pointer', x + w / 2, y + h - 14, 'rgba(148, 163, 184, 0.85)', 11)
  })
  verdict(ctx, g.x(0) + g.w - 30, g.top + 30, true, fadeIn(t, 2.6, 0.4))
  verdict(ctx, g.x(1) + g.w - 30, g.top + 30, true, fadeIn(t, 5.1, 0.4))
  verdict(ctx, g.x(2) + g.w - 30, g.top + 30, false, fadeIn(t, 7.6, 0.4))
  // the rule: never into the eye; never at people, animals or planes
  const ry = b.UH * 0.68
  const ra = (i: number) => fadeIn(t, 10.1 + i * 0.3, 0.4)
  noSign(ctx, '👁️', b.W * 0.2, ry, 40, ra(0))
  noSign(ctx, '🧍', b.W * 0.45, ry, 40, ra(1))
  noSign(ctx, '🐕', b.W * 0.63, ry, 40, ra(2))
  noSign(ctx, '✈️', b.W * 0.81, ry, 40, ra(3))
  ctx.restore()
  // the next story: a laser reaching the Moon
  const moon = fadeIn(t, 12.6, 0.9)
  if (moon > 0) {
    const mx = b.W * 0.8
    const my = b.UH * 0.2
    const mr = Math.min(b.W, b.UH) * 0.09
    ctx.save()
    ctx.globalAlpha *= moon
    const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr)
    mg.addColorStop(0, '#f1f5f9')
    mg.addColorStop(1, '#94a3b8')
    ctx.fillStyle = mg
    ctx.beginPath()
    ctx.arc(mx, my, mr, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    const from = { x: b.W * 0.12, y: b.UH * 0.9 }
    const to = { x: mx - mr * 0.6, y: my + mr * 0.6 }
    stream(ctx, 'safe:moon', [from, to], t, 12.7, idle, POINTER_NM, { spacing: 60 })
  }
}

// ---------- the beats ----------

export function drawCutBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'family') drawFamily(ctx, b, t, idle)
  else if (beat === 'squeeze') drawSqueeze(ctx, b, t, idle)
  else if (beat === 'heat') drawHeat(ctx, b, t, idle)
  else if (beat === 'drill') drawDrill(ctx, b, t, idle)
  else if (beat === 'cut') drawCut(ctx, b, t, idle)
  else if (beat === 'invisible') drawInvisible(ctx, b, t, idle)
  else if (beat === 'eye') drawEyeBeat(ctx, b, t, idle)
  else drawSafe(ctx, b, t, idle)
}
