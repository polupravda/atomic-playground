import { memo, useEffect, useRef } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import {
  EM_BANDS,
  VIS_MAX_M,
  VIS_MIN_M,
  bandOf,
  ejectSpeedFactor,
  emBarPosition,
  formatWavelength,
  isVisible,
  photonPunch,
  ringsBell,
  uToWavelength,
} from '../core/emSpectrum'
import { wavelengthToCss } from '../core/spectra'
import {
  EYE_OBJECTS,
  WHITE_BUNDLE,
  eyeSees,
  reflectedBundle,
  type EyeObjectId,
} from '../core/seeColors'
import { easeInOut } from './canvasUtil'
import { drawGlossyParticle } from './particleStyle'

// 💡 Light lab — the wave machine (L01–L04). One travelling wave crossing
// the canvas, drawn in its true color; the kid stretches it with the
// wavelength slider (or by dragging the canvas) and dims it with the
// brightness slider. Above it, the TRUE log-scale EM bar shows where the
// current wave lives on the whole radio↔γ journey — the visible rainbow is
// deliberately a sliver. Outside the rainbow the wave turns ghost-grey (your
// eyes catch nothing, but the wave is still there).
// Same rules as the other stages: the canvas reads live values from refs and
// one Konva.Animation redraws; React state lives in ui/LightLab.tsx.

const PAGE_W = Math.min(window.innerWidth, 1440)
// page frame − 48 padding − 16rem info − 16.5rem controls (scrollbar) −
// 2×24 gaps − 2 border
export const WAVE_W = Math.max(620, PAGE_W - 48 - 256 - 264 - 48 - 2)
export const WAVE_H = Math.max(480, window.innerHeight - 42)
const W = WAVE_W
const H = WAVE_H

// EM bar geometry
const BAR_X = 28
const BAR_W = W - 2 * BAR_X
const BAR_Y = 30
const BAR_H = 18

const CY = H * 0.58 // the wave's resting line
const CREST_SPEED = 130 // px/s, left → right

// ---------- screen wavelength ----------
// Inside the rainbow the mapping is linear (380 nm → ~171 px, 750 → ~337 px:
// stretching is really visible). Beyond it, each decade only ADDS a step, so
// γ stays drawable (~25 px) and radio grows past the screen width.
function screenWavelength(m: number): number {
  const nmPx = 0.45
  if (m < VIS_MIN_M) {
    const decades = Math.log10(VIS_MIN_M / m)
    return (VIS_MIN_M * 1e9 * nmPx) / (1 + decades * 0.9)
  }
  if (m > VIS_MAX_M) {
    const decades = Math.log10(m / VIS_MAX_M)
    return VIS_MAX_M * 1e9 * nmPx * (1 + decades * 0.9)
  }
  return m * 1e9 * nmPx
}

const GREY = 'rgba(148, 163, 184, 0.8)'
const AMBER = 'rgba(251, 191, 36, 0.95)'

function waveColor(m: number, alpha = 1): string {
  return isVisible(m)
    ? wavelengthToCss(m * 1e9, alpha)
    : `rgba(148, 163, 184, ${0.8 * alpha})`
}

// ---------- drawing ----------

function drawBackground(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#020617')
  g.addColorStop(1, '#0b1226')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawEmBar(ctx: CanvasRenderingContext2D, m: number) {
  const X = (p: number) => BAR_X + p * BAR_W
  ctx.font = '10px ui-sans-serif, system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  for (const [i, b] of EM_BANDS.entries()) {
    const x0 = X(emBarPosition(b.minM))
    const x1 = X(emBarPosition(b.maxM))
    if (b.id === 'visible') {
      // the rainbow sliver, drawn for real
      const g = ctx.createLinearGradient(x0, 0, x1, 0)
      for (let f = 0; f <= 1; f += 0.2) g.addColorStop(f, wavelengthToCss(380 + f * 370))
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#283548'
    }
    ctx.fillRect(x0, BAR_Y, x1 - x0, BAR_H)
    // label under the segment (the sliver gets a call-out above instead)
    if (b.id !== 'visible') {
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'center'
      ctx.fillText(b.label, (x0 + x1) / 2, BAR_Y + BAR_H + 11)
    }
  }
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)'
  ctx.lineWidth = 1
  ctx.strokeRect(BAR_X, BAR_Y, BAR_W, BAR_H)
  // "👁 visible" call-out above the sliver
  const vx = X(emBarPosition((VIS_MIN_M + VIS_MAX_M) / 2))
  ctx.fillStyle = '#cbd5e1'
  ctx.textAlign = 'center'
  ctx.fillText('👁 the rainbow', vx, BAR_Y - 16)
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)'
  ctx.beginPath()
  ctx.moveTo(vx, BAR_Y - 9)
  ctx.lineTo(vx, BAR_Y - 1)
  ctx.stroke()
  // arrows: longer ← → shorter
  ctx.fillStyle = '#64748b'
  ctx.textAlign = 'left'
  ctx.fillText('← shorter waves', BAR_X, BAR_Y + BAR_H + 26)
  ctx.textAlign = 'right'
  ctx.fillText('longer waves →', BAR_X + BAR_W, BAR_Y + BAR_H + 26)
  // the amber marker: where today's wave lives on the TRUE scale
  const mx = X(emBarPosition(m))
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(mx, BAR_Y - 4)
  ctx.lineTo(mx, BAR_Y + BAR_H + 4)
  ctx.stroke()
  ctx.fillStyle = AMBER
  ctx.beginPath()
  ctx.moveTo(mx, BAR_Y + BAR_H + 6)
  ctx.lineTo(mx - 5, BAR_Y + BAR_H + 13)
  ctx.lineTo(mx + 5, BAR_Y + BAR_H + 13)
  ctx.closePath()
  ctx.fill()
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const w = ctx.measureText(text).width + 12
  ctx.fillStyle = 'rgba(2, 6, 23, 0.7)'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - 11, w, 22, 6)
  ctx.fill()
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

// ---------- wave ⇄ photons (L05/L06) ----------
// The lab's signature morph, sibling of shells ⇄ cloud: NEVER a hard cut.
// One amplitude/alpha ENVELOPE morphs from "constant 1" (the smooth wave)
// to a train of Gaussian bumps riding the same sinusoid: the crests between
// packets thin out and the beads pinch off as wave PACKETS — each packet
// still carrying its little wave. Running the morph backwards blurs the
// packets back into one smooth wave.
// In photon view the brightness slider changes HOW MANY packets fly by —
// every packet is identical: fixed size, fixed punch (L06's meters).

const A_PACKET = 46 // every photon packet is the same size
const MORPH_T = 2.2 // s, wave → photons (and back)

/** photon spacing: brighter light = more packets per second, same speed */
function packetSpacing(lambda: number, brightness: number): number {
  const windowLen = Math.min(lambda * 1.5, 260)
  return windowLen + 360 - 290 * brightness
}

/** fill fraction of a packet's energy meter: spread across the rainbow,
 *  pinned full past the violet edge, a sliver for long feeble photons */
function meterFrac(m: number): number {
  const lg = Math.log10(photonPunch(m)) // 0 at deep red 670 nm
  return Math.min(1, Math.max(0.04, 0.1 + (lg + 0.049) * 2.71))
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  m: number,
  brightness: number,
  t: number,
  p: number, // morph: 0 = wave, 1 = photons
) {
  const lambda = screenWavelength(m)
  const visible = isVisible(m)
  const phase0 = CREST_SPEED * t

  // the glow the light casts (eyes only catch the visible kind); in photon
  // view more packets still means more light, so brightness scales it too
  if (visible) {
    const g = ctx.createRadialGradient(W / 2, CY, 0, W / 2, CY, W * 0.55)
    g.addColorStop(0, waveColor(m, 0.16 * brightness + 0.03))
    g.addColorStop(1, waveColor(m, 0))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  // packet centers, travelling with the wave
  const spacing = packetSpacing(lambda, brightness)
  const windowLen = Math.min(lambda * 1.5, 260)
  const centers: number[] = []
  if (p > 0) {
    const off = ((phase0 % spacing) + spacing) % spacing
    for (let c = off - spacing; c <= W + spacing; c += spacing) centers.push(c)
  }
  const sigma = windowLen / 2.4
  const envelope = (x: number) => {
    let e = 0
    for (const c of centers) {
      const d = (x - c) / sigma
      if (Math.abs(d) < 3) e += Math.exp(-d * d)
    }
    return Math.min(1, e)
  }

  // wave amplitude follows brightness; every packet is the same size
  const aWave = 14 + 66 * brightness
  // brightness also dims/brightens the WAVE's color (hue never moves);
  // packets are identical, so their color intensity is fixed
  const bFac = 0.3 + 0.7 * brightness
  const A = aWave + (A_PACKET - aWave) * p

  const y = (x: number) => {
    const e = 1 - p + p * envelope(x)
    return CY - A * e * Math.sin((2 * Math.PI * (x - phase0)) / lambda)
  }
  // stroke alpha fades the stretches BETWEEN packets as the morph advances,
  // so the beads visibly pinch off; drawn in short chunks (strokes cannot
  // vary alpha along one path)
  const chunkAlpha = (x: number) => (1 - p) * bFac + p * envelope(x)
  const step = Math.max(1.5, Math.min(4, lambda / 24))
  const CHUNK = 10
  for (const [lw, alpha] of [
    [9, 0.22],
    [3.2, 1],
  ] as const) {
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    for (let x0 = -10; x0 <= W + 10; x0 += CHUNK) {
      const a = alpha * chunkAlpha(x0 + CHUNK / 2)
      if (a <= 0.015) continue
      ctx.strokeStyle = waveColor(m, a)
      ctx.beginPath()
      ctx.moveTo(x0, y(x0))
      for (let x = x0 + step; x <= x0 + CHUNK + step / 2; x += step) ctx.lineTo(x, y(x))
      ctx.stroke()
    }
  }

  // L06: each packet carries its energy meter — identical for every packet
  // of this light; color decides the punch, never the brightness
  if (p > 0.5) {
    const mAlpha = (p - 0.5) * 2
    const frac = meterFrac(m)
    const mh = 26
    for (const c of centers) {
      if (c < 10 || c > W - 10) continue
      const mx = c
      const my = CY - A_PACKET - 16 - mh
      ctx.save()
      ctx.globalAlpha *= mAlpha
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
      ctx.lineWidth = 1
      ctx.strokeRect(mx - 2.5, my, 5, mh)
      ctx.fillStyle = waveColor(m, 0.95)
      ctx.fillRect(mx - 2.5, my + mh * (1 - frac), 5, mh * frac)
      ctx.restore()
    }
    // name tag on the packet nearest the centre
    const near = centers.reduce(
      (best, c) => (Math.abs(c - W * 0.5) < Math.abs(best - W * 0.5) ? c : best),
      -1e9,
    )
    if (near > 40 && near < W - 40) {
      ctx.save()
      ctx.globalAlpha *= mAlpha
      tag(ctx, 'photon — a packet of light', near, CY + A_PACKET + 24, waveColor(m, 1))
      ctx.restore()
    }
  }

  // invisible-light note (the wave is still there — eyes just can't catch it)
  if (!visible) {
    tag(ctx, `invisible to human eyes — ${bandOf(m).label}`, W / 2, CY - A - (p > 0.5 ? 52 : 34), GREY)
  }

  // the "1 wavelength" bracket (wave view only — it fades with the morph)
  if (p < 0.5) {
    ctx.save()
    ctx.globalAlpha *= 1 - p * 2
    const text = `1 wave = ${formatWavelength(m)}`
    if (lambda <= W * 0.8) {
      // crests sit where (x − phase0)/λ = 0.25 + k
      const k = Math.round((W * 0.42 - phase0) / lambda - 0.25)
      const x0 = phase0 + (0.25 + k) * lambda
      const x1 = x0 + lambda
      const by = CY + A + 26
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x0, by - 8)
      ctx.lineTo(x0, by)
      ctx.lineTo(x1, by)
      ctx.lineTo(x1, by - 8)
      ctx.stroke()
      tag(ctx, text, (x0 + x1) / 2, by + 18, AMBER)
    } else {
      // long waves outgrow the bracket (radio outgrows the whole screen)
      tag(
        ctx,
        lambda > W ? `${text} — longer than this whole picture!` : text,
        W / 2,
        CY + A + 36,
        AMBER,
      )
    }
    ctx.restore()
  }

  // travel direction, small and quiet
  ctx.fillStyle = 'rgba(100, 116, 139, 0.9)'
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText('travelling →', W - 16, CY - Math.max(A, A_PACKET * p) - 14)
}

// ---------- the doorbell scene (L07, photoelectric effect) ----------
// A lamp fires the photon stream at a metal plate wired to a bell. ONE
// packet must pay the metal's whole price alone (core/emSpectrum
// ringsBell): green or shorter → an electron pops off and the bell rings,
// faster for shorter wavelengths (ejectSpeedFactor); yellow or longer →
// nothing, ever — the packets' energy only warms the plate (drawn as a
// slowly glowing tint). Brightness changes how OFTEN packets arrive, never
// what one packet can pay. Einstein's Nobel experiment, kid version.

const PLATE_X = W - 150
const PLATE_W = 24
const PLATE_H = 230
const LAMP_X = 86
const PACKET_SPEED = 240
const BELL_Y = CY - PLATE_H / 2 - 64
/** beam packets are denser than the wave view's: full brightness must feel
 *  like a STORM of packets (that still can't ring the bell when red) */
const doorSpacing = (brightness: number) => 120 + 340 * (1 - brightness)

interface DoorState {
  packets: number[] // packet centre x positions
  spawn: number
  rings: number
  bell: number // swing timer, s
  heat: number // 0–1, absorbed energy warming the plate
  ejected: Array<{ x: number; y: number; vx: number; vy: number; age: number }>
  fizzle: number // age of the latest absorbed-packet shimmer
}

export function newDoorState(): DoorState {
  return { packets: [], spawn: 0.3, rings: 0, bell: 0, heat: 0, ejected: [], fizzle: 9 }
}

function stepDoor(door: DoorState, dt: number, m: number, brightness: number) {
  door.spawn -= dt
  if (door.spawn <= 0) {
    door.packets.push(LAMP_X + 40)
    door.spawn = doorSpacing(brightness) / PACKET_SPEED
  }
  const face = PLATE_X - PLATE_W / 2
  const keep: number[] = []
  for (const x0 of door.packets) {
    const x = x0 + PACKET_SPEED * dt
    if (x < face - 8) {
      keep.push(x)
      continue
    }
    // impact: one packet pays alone
    if (ringsBell(m)) {
      door.rings++
      door.bell = 0.9
      const f = ejectSpeedFactor(m)
      const a = 2.1 + Math.random() * 0.7 // up and back-left
      const sp = 150 + 290 * f
      door.ejected.push({
        x: face - 6,
        y: CY,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        age: 0,
      })
    } else {
      door.heat = Math.min(1, door.heat + 0.05)
      door.fizzle = 0
    }
  }
  door.packets = keep
  door.bell = Math.max(0, door.bell - dt)
  door.fizzle += dt
  door.heat = Math.max(0, door.heat - 0.015 * dt)
  for (const e of door.ejected) {
    e.x += e.vx * dt
    e.y += e.vy * dt
    e.vy += 170 * dt
    e.age += dt
  }
  door.ejected = door.ejected.filter((e) => e.age < 1.8)
}

/** one photon packet: a short wave pinched by a Gaussian envelope (beam
 *  packets are capped shorter than the wave view's, so a dense stream never
 *  overlaps into a dashed-looking line) */
function drawPacketGlyph(ctx: CanvasRenderingContext2D, cx: number, cy: number, m: number, t: number) {
  const lambda = screenWavelength(m)
  const len = Math.min(lambda * 1.5, 100)
  const sigma = len / 2.4
  const amp = 19
  const phase0 = CREST_SPEED * t
  for (const [lw, alpha] of [
    [8, 0.2],
    [3, 0.95],
  ] as const) {
    ctx.strokeStyle = waveColor(m, alpha)
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.beginPath()
    const step = Math.max(1.5, Math.min(4, lambda / 24))
    for (let dx = -len * 0.9; dx <= len * 0.9; dx += step) {
      const env = Math.exp(-((dx / sigma) ** 2))
      const y = cy - amp * env * Math.sin((2 * Math.PI * (cx + dx - phase0)) / lambda)
      if (dx === -len * 0.9) ctx.moveTo(cx + dx, y)
      else ctx.lineTo(cx + dx, y)
    }
    ctx.stroke()
  }
}

function drawDoorbell(
  ctx: CanvasRenderingContext2D,
  door: DoorState,
  m: number,
  t: number,
) {
  const face = PLATE_X - PLATE_W / 2
  // the lamp (hooded, pointing right)
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(LAMP_X - 46, CY - 26, 52, 52, 8)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.moveTo(LAMP_X + 6, CY - 26)
  ctx.lineTo(LAMP_X + 26, CY - 36)
  ctx.lineTo(LAMP_X + 26, CY + 36)
  ctx.lineTo(LAMP_X + 6, CY + 26)
  ctx.closePath()
  ctx.fill()
  const lg = ctx.createRadialGradient(LAMP_X + 26, CY, 0, LAMP_X + 26, CY, 46)
  lg.addColorStop(0, waveColor(m, 0.5))
  lg.addColorStop(1, waveColor(m, 0))
  ctx.fillStyle = lg
  ctx.beginPath()
  ctx.arc(LAMP_X + 26, CY, 46, 0, Math.PI * 2)
  ctx.fill()
  label(ctx, 'lamp', LAMP_X - 20, CY + 46)

  // flying packets
  for (const x of door.packets) drawPacketGlyph(ctx, x, CY, m, t)

  // absorbed-packet shimmer (the energy becomes warmth)
  if (door.fizzle < 0.5) {
    const a = (0.5 - door.fizzle) / 0.5
    const g = ctx.createRadialGradient(face, CY, 0, face, CY, 40)
    g.addColorStop(0, `rgba(253, 186, 116, ${0.5 * a})`)
    g.addColorStop(1, 'rgba(253, 186, 116, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(face, CY, 40, 0, Math.PI * 2)
    ctx.fill()
  }

  // the metal plate (+ its warmth tint) and embedded electrons
  const pg = ctx.createLinearGradient(face, 0, face + PLATE_W, 0)
  pg.addColorStop(0, '#94a3b8')
  pg.addColorStop(0.3, '#64748b')
  pg.addColorStop(1, '#475569')
  ctx.fillStyle = pg
  ctx.beginPath()
  ctx.roundRect(face, CY - PLATE_H / 2, PLATE_W, PLATE_H, 4)
  ctx.fill()
  if (door.heat > 0.02) {
    ctx.fillStyle = `rgba(251, 146, 60, ${0.3 * door.heat})`
    ctx.beginPath()
    ctx.roundRect(face, CY - PLATE_H / 2, PLATE_W, PLATE_H, 4)
    ctx.fill()
  }
  for (let r = 0; r < 7; r++) {
    drawGlossyParticle(ctx, 'electrons', face + 6, CY - PLATE_H / 2 + 20 + r * 32, 3.2)
  }
  label(ctx, 'metal plate', PLATE_X, CY + PLATE_H / 2 + 16)

  // the wire and the bell (swings while ringing)
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PLATE_X, CY - PLATE_H / 2)
  ctx.lineTo(PLATE_X, BELL_Y + 26)
  ctx.stroke()
  const swing = door.bell > 0 ? Math.sin(door.bell * 26) * 0.22 * (door.bell / 0.9) : 0
  ctx.save()
  ctx.translate(PLATE_X, BELL_Y)
  ctx.rotate(swing)
  ctx.fillStyle = '#d6b35c'
  ctx.beginPath()
  ctx.arc(0, 0, 22, Math.PI, 0)
  ctx.lineTo(26, 6)
  ctx.lineTo(-26, 6)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#92722a'
  ctx.beginPath()
  ctx.arc(0, 12, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  if (door.bell > 0) {
    const a = door.bell / 0.9
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 * a})`
    ctx.lineWidth = 2
    for (const r of [32, 42]) {
      ctx.beginPath()
      ctx.arc(PLATE_X, BELL_Y, r, -0.9, 0.9)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(PLATE_X, BELL_Y, r, Math.PI - 0.9, Math.PI + 0.9)
      ctx.stroke()
    }
  }
  label(ctx, 'bell', PLATE_X - 44, BELL_Y - 6)

  // freed electrons flying off
  for (const e of door.ejected) {
    const a = e.age < 1.3 ? 1 : (1.8 - e.age) / 0.5
    ctx.save()
    ctx.globalAlpha *= a
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(e.x, e.y)
    ctx.lineTo(e.x - e.vx * 0.06, e.y - e.vy * 0.06)
    ctx.stroke()
    drawGlossyParticle(ctx, 'electrons', e.x, e.y, 4.5)
    ctx.restore()
  }
  const newest = door.ejected[door.ejected.length - 1]
  if (newest && newest.age < 0.8) tag(ctx, 'electron', newest.x, newest.y - 18, '#7dd3fc')

  // invisible-light note
  if (!isVisible(m)) {
    tag(ctx, `invisible to human eyes — ${bandOf(m).label}`, (LAMP_X + PLATE_X) / 2, CY - 64, GREY)
  }
}

// ---------- the lamps scene (L08, additive mixing) ----------
// Three lamps — red, green, blue — throw overlapping pools of light on a
// dark wall. The pools are drawn with ADDITIVE compositing ('lighter'), so
// the mixing is the real thing, not an illustration: red + green overlap IS
// yellow, all three IS white. A magnified screen pixel in the corner shows
// the same three lamps your screen uses.

export interface LampLevels {
  r: number
  g: number
  b: number
}

const WALL_CY = H * 0.4
const POOL_R = 185
const FLOOR_Y = H - 86
const LAMP_PRIMARIES = {
  r: [255, 45, 25],
  g: [45, 255, 70],
  b: [55, 110, 255],
} as const
// The lamps stand apart on the floor but are AIMED at one spot: the pool
// centres sit in a tight cluster, so the middle genuinely clips to white
// (the pools keep near-full strength out to ~55% of their radius, see the
// plateau gradient below), while each pool's own color survives on its
// outer side.
const POOLS: Array<{ id: keyof LampLevels; lampX: number; x: number; y: number; name: string }> = [
  { id: 'r', lampX: W / 2 - 150, x: W / 2 - 62, y: WALL_CY - 34, name: 'red lamp' },
  { id: 'g', lampX: W / 2 + 150, x: W / 2 + 62, y: WALL_CY - 34, name: 'green lamp' },
  { id: 'b', lampX: W / 2, x: W / 2, y: WALL_CY + 62, name: 'blue lamp' },
]

const rgba = (c: readonly number[], a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`

/** the color of the wall where all three pools overlap (also the swatch) */
export function lampMixCss(lv: LampLevels): string {
  const ch = (i: number) =>
    Math.min(
      255,
      Math.round(LAMP_PRIMARIES.r[i] * lv.r + LAMP_PRIMARIES.g[i] * lv.g + LAMP_PRIMARIES.b[i] * lv.b),
    )
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

function drawLamps(ctx: CanvasRenderingContext2D, lv: LampLevels) {
  // the floor
  ctx.fillStyle = '#060a18'
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y)
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, FLOOR_Y)
  ctx.lineTo(W, FLOOR_Y)
  ctx.stroke()

  // pools and beams, truly additive
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const p of POOLS) {
    const v = lv[p.id]
    if (v <= 0.01) continue
    const c = LAMP_PRIMARIES[p.id]
    // plateau gradient: near-full strength out to 55% of the pool, then
    // falloff — so the central overlap of all three sums past white
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, POOL_R)
    g.addColorStop(0, rgba(c, 0.9 * v))
    g.addColorStop(0.55, rgba(c, 0.82 * v))
    g.addColorStop(1, rgba(c, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, POOL_R, 0, Math.PI * 2)
    ctx.fill()
    // the channelled beam: from the lamp's mouth, converging on its pool
    const bg = ctx.createLinearGradient(p.lampX, FLOOR_Y, p.x, p.y)
    bg.addColorStop(0, rgba(c, 0.2 * v))
    bg.addColorStop(1, rgba(c, 0))
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.moveTo(p.lampX - 14, FLOOR_Y - 14)
    ctx.lineTo(p.lampX + 14, FLOOR_Y - 14)
    ctx.lineTo(p.x + POOL_R * 0.45, p.y)
    ctx.lineTo(p.x - POOL_R * 0.45, p.y)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // the lamps themselves, visibly tilted toward the one spot they share
  for (const p of POOLS) {
    const c = LAMP_PRIMARIES[p.id]
    const aim = Math.atan2(p.y - (FLOOR_Y - 16), p.x - p.lampX) + Math.PI / 2
    ctx.save()
    ctx.translate(p.lampX, FLOOR_Y - 4)
    ctx.rotate(aim)
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.roundRect(-20, -12, 40, 24, 5)
    ctx.fill()
    ctx.fillStyle = rgba(c, 0.25 + 0.75 * lv[p.id])
    ctx.beginPath()
    ctx.arc(0, -12, 7, Math.PI, 0)
    ctx.fill()
    ctx.restore()
    label(ctx, p.name, p.lampX, FLOOR_Y + 18)
  }

  // the magnified screen pixel (your screen does exactly this)
  const ix = W - 196
  const iy = 22
  ctx.fillStyle = '#0b1226'
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(ix, iy, 108, 84, 8)
  ctx.fill()
  ctx.stroke()
  for (const [i, id] of (['r', 'g', 'b'] as const).entries()) {
    ctx.fillStyle = rgba(LAMP_PRIMARIES[id], 0.12 + 0.88 * lv[id])
    ctx.beginPath()
    ctx.roundRect(ix + 10 + i * 32, iy + 10, 24, 64, 4)
    ctx.fill()
  }
  // …seen from far away: the mixed color
  ctx.fillStyle = lampMixCss(lv)
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.beginPath()
  ctx.roundRect(ix + 120, iy + 26, 32, 32, 6)
  ctx.fill()
  ctx.stroke()
  label(ctx, 'one screen pixel, magnified', ix + 54, iy + 98)
  label(ctx, 'from far', ix + 136, iy + 72)
}

// ---------- the eye scene (L09/L11: how your eye sees a color) ----------
// Light pours from the lamp as a BUNDLE of waves (white = seven waves across
// the rainbow). At the object, the swallowed waves stop (a warm shimmer —
// absorbed light becomes warmth) and the bounced band flies on into the
// pupil; the retina glows in the bounced mix and the eye reports it. The
// object itself is painted with the color it bounces — so under the trick
// lamp (one pure color, L11) a red apple genuinely goes black on screen.

const EYE_X = W - 126
const EYE_Y = H * 0.4
const EYE_R = 74
const OBJ_X = W * 0.44
const OBJ_Y = H - 182
const EYE_LAMP_X = 104
const EYE_LAMP_Y = 92

export type EyeLampSetting = 'white' | number // nm

function eyeLampBundle(lamp: EyeLampSetting): number[] {
  return lamp === 'white' ? WHITE_BUNDLE : [lamp]
}

/** one wavy strand of the bundle between two points */
function drawStrand(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  nm: number,
  t: number,
  offset: number,
) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const dx = (x1 - x0) / len
  const dy = (y1 - y0) / len
  const nx = -dy
  const ny = dx
  const lam = 24 + (nm - 380) * 0.06
  const amp = 5
  ctx.strokeStyle = wavelengthToCss(nm, 0.85)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let s = 0; s <= len; s += 3) {
    const w = offset + amp * Math.sin((2 * Math.PI * (s - 90 * t)) / lam)
    const px = x0 + dx * s + nx * w
    const py = y0 + dy * s + ny * w
    if (s === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
}

function drawEyeObject(ctx: CanvasRenderingContext2D, id: EyeObjectId, fill: string) {
  const x = OBJ_X
  const y = OBJ_Y
  ctx.save()
  ctx.fillStyle = fill
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.lineWidth = 1.5
  if (id === 'apple') {
    ctx.beginPath()
    ctx.arc(x, y, 40, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = '#78583a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y - 38)
    ctx.quadraticCurveTo(x + 6, y - 52, x + 12, y - 56)
    ctx.stroke()
  } else if (id === 'leaf') {
    ctx.beginPath()
    ctx.moveTo(x - 46, y + 10)
    ctx.quadraticCurveTo(x - 10, y - 42, x + 48, y - 18)
    ctx.quadraticCurveTo(x + 8, y + 34, x - 46, y + 10)
    ctx.fill()
    ctx.stroke()
  } else if (id === 'cup') {
    ctx.beginPath()
    ctx.roundRect(x - 28, y - 34, 56, 68, 8)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + 36, y, 14, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()
  } else if (id === 'paper') {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-0.06)
    ctx.beginPath()
    ctx.rect(-32, -40, 64, 80)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  } else {
    ctx.beginPath()
    ctx.moveTo(x - 42, y + 18)
    ctx.quadraticCurveTo(x - 36, y - 26, x - 4, y - 30)
    ctx.quadraticCurveTo(x + 40, y - 28, x + 42, y + 6)
    ctx.quadraticCurveTo(x + 36, y + 30, x - 8, y + 30)
    ctx.quadraticCurveTo(x - 40, y + 30, x - 42, y + 18)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
  // the table
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x - 64, y + 46)
  ctx.lineTo(x + 64, y + 46)
  ctx.stroke()
  ctx.lineWidth = 2
  for (const lx of [x - 50, x + 50]) {
    ctx.beginPath()
    ctx.moveTo(lx, y + 46)
    ctx.lineTo(lx, y + 82)
    ctx.stroke()
  }
}

function drawEyeScene(
  ctx: CanvasRenderingContext2D,
  objId: EyeObjectId,
  lamp: EyeLampSetting,
  t: number,
) {
  const obj = EYE_OBJECTS[objId]
  const bundle = eyeLampBundle(lamp)
  const reflected = reflectedBundle(obj, bundle)
  const seen = eyeSees(reflected)

  // the lamp, aimed down-right at the object
  const aim = Math.atan2(OBJ_Y - 30 - EYE_LAMP_Y, OBJ_X - EYE_LAMP_X)
  ctx.save()
  ctx.translate(EYE_LAMP_X, EYE_LAMP_Y)
  ctx.rotate(aim)
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(-40, -22, 50, 44, 8)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.moveTo(10, -22)
  ctx.lineTo(28, -30)
  ctx.lineTo(28, 30)
  ctx.lineTo(10, 22)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  label(ctx, lamp === 'white' ? 'white lamp' : 'the trick lamp', EYE_LAMP_X - 10, EYE_LAMP_Y + 44)

  // incoming bundle: lamp → object (absorbed strands stop at the surface)
  const inX0 = EYE_LAMP_X + 34
  const inY0 = EYE_LAMP_Y + 16
  const inX1 = OBJ_X - 14
  const inY1 = OBJ_Y - 34
  const spread = Math.min(44, bundle.length * 7)
  bundle.forEach((nm, i) => {
    const off = bundle.length === 1 ? 0 : -spread / 2 + (i * spread) / (bundle.length - 1)
    drawStrand(ctx, inX0, inY0, inX1, inY1, nm, t, off)
  })

  // the swallowed waves become warmth: a shimmer scaling with how much is eaten
  const eaten = bundle.length - reflected.length
  if (eaten > 0) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5)
    const a = (0.12 + (0.3 * eaten) / bundle.length) * pulse
    const g = ctx.createRadialGradient(OBJ_X, OBJ_Y - 20, 0, OBJ_X, OBJ_Y - 20, 66)
    g.addColorStop(0, `rgba(253, 186, 116, ${a})`)
    g.addColorStop(1, 'rgba(253, 186, 116, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(OBJ_X, OBJ_Y - 20, 66, 0, Math.PI * 2)
    ctx.fill()
  }

  // the object, painted with exactly what it bounces
  drawEyeObject(ctx, objId, seen.css)
  label(ctx, obj.name, OBJ_X, OBJ_Y + 98)

  // the bounced band: object → pupil
  const outX0 = OBJ_X + 26
  const outY0 = OBJ_Y - 30
  const outX1 = EYE_X - EYE_R + 10
  const outY1 = EYE_Y
  const rSpread = Math.min(18, reflected.length * 6)
  reflected.forEach((nm, i) => {
    const off =
      reflected.length === 1 ? 0 : -rSpread / 2 + (i * rSpread) / (reflected.length - 1)
    drawStrand(ctx, outX0, outY0, outX1, outY1, nm, t, off)
  })

  // the eye: a friendly side-view cross-section (pupil left, retina right).
  // The INSIDE stays schematic; the OUTSIDE gets the things a young kid
  // recognizes an eye by — eyelids hugging the eyeball, lashes, a brow.
  ctx.fillStyle = 'rgba(148, 163, 184, 0.07)'
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(EYE_X, EYE_Y, EYE_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // cornea bulge at the left
  ctx.beginPath()
  ctx.arc(EYE_X - EYE_R + 4, EYE_Y, 22, Math.PI * 0.6, Math.PI * 1.4)
  ctx.stroke()
  // the pupil: the hole the waves fly into
  ctx.fillStyle = '#05070f'
  ctx.beginPath()
  ctx.ellipse(EYE_X - EYE_R + 14, EYE_Y, 7, 20, 0, 0, Math.PI * 2)
  ctx.fill()
  // the retina: the catching wall at the back
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(EYE_X, EYE_Y, EYE_R - 7, -Math.PI * 0.32, Math.PI * 0.32)
  ctx.stroke()
  // the landing glow — only if something the eye can catch arrived
  if (seen.name !== 'black') {
    const g = ctx.createRadialGradient(EYE_X + EYE_R - 20, EYE_Y, 0, EYE_X + EYE_R - 20, EYE_Y, 30)
    g.addColorStop(0, seen.css)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.save()
    ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 4)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(EYE_X + EYE_R - 20, EYE_Y, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // upper eyelid: a warm band from the front (where the light enters) over
  // the top of the eyeball
  const SKIN = '#e0a97f'
  const SKIN_DARK = '#c08552'
  ctx.strokeStyle = SKIN
  ctx.lineCap = 'round'
  ctx.lineWidth = 11
  ctx.beginPath()
  ctx.arc(EYE_X, EYE_Y, EYE_R + 7, Math.PI * 1.04, Math.PI * 1.62)
  ctx.stroke()
  // lower eyelid, shorter — kept clear of the lower-left corridor where the
  // bounced light flies in, so the eye reads as OPEN toward the object
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(EYE_X, EYE_Y, EYE_R + 6, Math.PI * 0.52, Math.PI * 0.72)
  ctx.stroke()
  // lashes: three curved strokes off the upper lid's front edge
  ctx.strokeStyle = SKIN_DARK
  ctx.lineWidth = 3
  for (const [i, a] of [Math.PI * 1.06, Math.PI * 1.13, Math.PI * 1.2].entries()) {
    const bx = EYE_X + Math.cos(a) * (EYE_R + 12)
    const by = EYE_Y + Math.sin(a) * (EYE_R + 12)
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.quadraticCurveTo(bx - 14, by - 8 - i * 2, bx - 20 + i * 3, by - 18 - i * 2)
    ctx.stroke()
  }
  // a calm eyebrow
  ctx.strokeStyle = SKIN_DARK
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.arc(EYE_X + 6, EYE_Y + 8, EYE_R + 32, Math.PI * 1.14, Math.PI * 1.42)
  ctx.stroke()
  label(ctx, 'pupil', EYE_X - EYE_R - 26, EYE_Y - 18)
  label(ctx, 'retina', EYE_X + 24, EYE_Y - EYE_R + 20)
  // what the eye reports
  tag(
    ctx,
    seen.name === 'black' ? 'the eye sees: black — no light' : `the eye sees: ${seen.name}`,
    EYE_X - 20,
    EYE_Y + EYE_R + 28,
    seen.name === 'black' ? GREY : seen.css,
  )
}

// ---------- the prism scene (L10: white light unpacked) ----------
// A beam enters a glass prism. White in → the rainbow fans out onto a
// screen: the prism only SORTS wavelengths, it adds nothing. The proof is
// interactive (Newton's experiment): send a PURE color through and it only
// BENDS — nothing to unpack. Shorter waves are slowed a little more by the
// glass, so they bend more (the honest hand-wave; full refraction is not
// told here).

const PRISM_X = W * 0.46
const PRISM_Y = H * 0.47
const PRISM_H2 = 95 // apex above / base below the beam line
const BEAM_Y = PRISM_Y - 10
const PRISM_LAMP_X = 88
const SCREEN_X = W - 110

/** downward deviation (rad) after the prism: shorter waves bend more */
function prismDeviation(nm: number): number {
  return 0.09 + ((700 - Math.min(700, Math.max(410, nm))) / 290) * 0.3
}

function drawPrismRay(
  ctx: CanvasRenderingContext2D,
  nm: number,
  alpha: number,
  pulse: number,
) {
  const entry = { x: PRISM_X - 44, y: BEAM_Y }
  const exit = { x: PRISM_X + 42, y: BEAM_Y + 16 }
  const dev = prismDeviation(nm)
  const endX = SCREEN_X - 8
  const endY = exit.y + Math.tan(dev) * (endX - exit.x)
  for (const [lw, a] of [
    [7, 0.18],
    [2.6, 0.9],
  ] as const) {
    ctx.strokeStyle = wavelengthToCss(nm, a * alpha * pulse)
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    // inside the glass: the colors already part ways
    ctx.beginPath()
    ctx.moveTo(entry.x, entry.y)
    ctx.lineTo(exit.x, exit.y + (dev - 0.2) * 26)
    ctx.stroke()
    // out in the air: the fan
    ctx.beginPath()
    ctx.moveTo(exit.x, exit.y + (dev - 0.2) * 26)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }
  // the stripe where it lands on the screen
  ctx.fillStyle = wavelengthToCss(nm, 0.95 * alpha)
  ctx.beginPath()
  ctx.roundRect(SCREEN_X - 6, endY - 5, 14, 10, 3)
  ctx.fill()
}

function drawPrismScene(ctx: CanvasRenderingContext2D, lamp: EyeLampSetting, t: number) {
  const bundle = eyeLampBundle(lamp)
  const pulse = 0.9 + 0.1 * Math.sin(t * 3)

  // the lamp (reuses the doorbell's hooded look, facing right)
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(PRISM_LAMP_X - 46, BEAM_Y - 24, 52, 48, 8)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.moveTo(PRISM_LAMP_X + 6, BEAM_Y - 24)
  ctx.lineTo(PRISM_LAMP_X + 26, BEAM_Y - 33)
  ctx.lineTo(PRISM_LAMP_X + 26, BEAM_Y + 33)
  ctx.lineTo(PRISM_LAMP_X + 6, BEAM_Y + 24)
  ctx.closePath()
  ctx.fill()
  label(ctx, lamp === 'white' ? 'white lamp' : 'one-color lamp', PRISM_LAMP_X - 20, BEAM_Y + 44)

  // the incoming beam: white = the colors TRAVELLING TOGETHER, so it is
  // drawn as one white beam; a single color travels alone in its own color
  for (const [lw, a] of [
    [8, 0.25],
    [3, 1],
  ] as const) {
    ctx.strokeStyle =
      lamp === 'white'
        ? `rgba(248, 250, 252, ${a * 0.85 * pulse})`
        : wavelengthToCss(lamp, a * 0.9 * pulse)
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(PRISM_LAMP_X + 26, BEAM_Y)
    ctx.lineTo(PRISM_X - 44, BEAM_Y)
    ctx.stroke()
  }

  // the rays through and past the prism (drawn before the glass so the
  // prism's glassy fill sits over them)
  for (const nm of bundle) drawPrismRay(ctx, nm, 1, pulse)

  // the glass prism
  ctx.fillStyle = 'rgba(148, 197, 253, 0.1)'
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(PRISM_X, PRISM_Y - PRISM_H2)
  ctx.lineTo(PRISM_X + 78, PRISM_Y + PRISM_H2 * 0.75)
  ctx.lineTo(PRISM_X - 78, PRISM_Y + PRISM_H2 * 0.75)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  label(ctx, 'glass prism', PRISM_X, PRISM_Y + PRISM_H2 * 0.75 + 16)

  // the screen catching the result
  ctx.fillStyle = '#1e293b'
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.9)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(SCREEN_X, BEAM_Y - 30, 14, H * 0.42, 4)
  ctx.fill()
  ctx.stroke()
  label(ctx, 'screen', SCREEN_X + 7, BEAM_Y - 44)
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

// ---------- component ----------

export type WaveView = 'wave' | 'photons'
export type WaveScene = 'wave' | 'doorbell' | 'lamps' | 'eye' | 'prism'

export const WaveStage = memo(function WaveStage({
  u,
  brightness,
  view,
  scene,
  lamps,
  eyeObject,
  eyeLamp,
  prismLamp,
  active,
  onBell,
}: {
  /** wavelength slider value 0–1 (core/emSpectrum mapping) */
  u: number
  /** 0–1 */
  brightness: number
  /** two pictures of the same light; switching runs the pinch-off morph */
  view: WaveView
  /** which scene the canvas shows (the doorbell is always in packets) */
  scene: WaveScene
  /** lamps scene: the three lamp levels, 0–1 each */
  lamps: LampLevels
  /** eye scene: what sits on the table, and what the lamp shines */
  eyeObject: EyeObjectId
  eyeLamp: EyeLampSetting
  /** prism scene: white or a pure color (Newton's proof) */
  prismLamp: EyeLampSetting
  active: boolean
  /** doorbell: the bell rang (total ring count) */
  onBell?: (rings: number) => void
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const uRef = useRef(u)
  uRef.current = u
  const brightRef = useRef(brightness)
  brightRef.current = brightness
  const viewRef = useRef(view)
  viewRef.current = view
  const sceneRef = useRef(scene)
  sceneRef.current = scene
  const lampsRef = useRef(lamps)
  lampsRef.current = lamps
  const eyeObjectRef = useRef(eyeObject)
  eyeObjectRef.current = eyeObject
  const eyeLampRef = useRef(eyeLamp)
  eyeLampRef.current = eyeLamp
  const prismLampRef = useRef(prismLamp)
  prismLampRef.current = prismLamp
  const onBellRef = useRef(onBell)
  onBellRef.current = onBell
  // the wave's own clock: only advances while the page is visible
  const tRef = useRef(0)
  // morph progress 0 (wave) … 1 (photons), eased toward the chosen view
  const pRef = useRef(view === 'photons' ? 1 : 0)
  const doorRef = useRef<DoorState>(newDoorState())
  const lastRings = useRef(0)

  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer || !active) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const dt = Math.min(0.05, frame.timeDiff / 1000)
      tRef.current += dt
      if (sceneRef.current === 'doorbell') {
        stepDoor(doorRef.current, dt, uToWavelength(uRef.current), brightRef.current)
        if (doorRef.current.rings !== lastRings.current) {
          lastRings.current = doorRef.current.rings
          onBellRef.current?.(doorRef.current.rings)
        }
      } else {
        const target = viewRef.current === 'photons' ? 1 : 0
        const d = dt / MORPH_T
        pRef.current = target > pRef.current
          ? Math.min(target, pRef.current + d)
          : Math.max(target, pRef.current - d)
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
  }, [active])

  // redraw immediately on slider moves even while paused/hidden
  useEffect(() => {
    shapeRef.current?.getLayer()?.batchDraw()
  }, [u, brightness, view, scene, lamps, eyeObject, eyeLamp, prismLamp])

  return (
    <Stage width={W} height={H}>
      <Layer listening={false}>
        <Shape
          ref={shapeRef}
          sceneFunc={(kctx, shape) => {
            shape.getSelfRect = () => ({ x: 0, y: 0, width: W, height: H })
            const ctx = kctx._context as CanvasRenderingContext2D
            ctx.save()
            const m = uToWavelength(uRef.current)
            drawBackground(ctx)
            if (sceneRef.current === 'lamps') {
              // no EM bar: three fixed lamps, no single wavelength to mark
              drawLamps(ctx, lampsRef.current)
            } else if (sceneRef.current === 'eye') {
              drawEyeScene(ctx, eyeObjectRef.current, eyeLampRef.current, tRef.current)
            } else if (sceneRef.current === 'prism') {
              drawPrismScene(ctx, prismLampRef.current, tRef.current)
            } else {
              drawEmBar(ctx, m)
              if (sceneRef.current === 'doorbell')
                drawDoorbell(ctx, doorRef.current, m, tRef.current)
              else drawWave(ctx, m, brightRef.current, tRef.current, easeInOut(pRef.current))
            }
            ctx.restore()
          }}
        />
      </Layer>
    </Stage>
  )
})
