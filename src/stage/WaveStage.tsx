import { memo, useEffect, useRef } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import { drawLightBulb, drawWavePacket, ordinaryCss } from './lightPacket'
import {
  refractiveIndex,
  traceDrop,
  tracePolygon,
  turnDeg,
  turnedPolygon,
  type PrismMaterial,
  type PrismShape,
  type Vec,
} from './prismOptics'
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
import {
  AIR_SHADE,
  FILM_SHADE,
  MAT_RANK,
  SCATTER_CHANCE,
  XRAY_OBJECTS,
  raySegments,
  rollFate,
  type XrayLamp,
  type XrayMaterial,
  type XrayObject,
  type XrayObjectId,
} from '../core/xray'
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
// down to the screen's bottom edge: 20 px top padding + 2 px border
export const WAVE_H = Math.max(480, window.innerHeight - 22)
const W = WAVE_W
// the canvas height: WAVE_H on the page; a Light lab drawer may draw a
// taller canvas (setHeight — every layout constant below that follows the
// height is re-derived, per instance, before each step and draw)
let H = WAVE_H

// EM bar geometry
const BAR_X = 28
const BAR_W = W - 2 * BAR_X
const BAR_Y = 30
const BAR_H = 18

let CY = H * 0.58 // the wave's resting line
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
let BELL_Y = CY - PLATE_H / 2 - 64
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
function drawPacketGlyph(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  m: number,
  t: number,
  maxLen = 100,
  css?: (a: number) => string,
) {
  const lambda = screenWavelength(m)
  drawWavePacket(
    ctx,
    cx,
    cy,
    lambda,
    Math.min(lambda * 1.5, maxLen),
    Math.min(19, maxLen * 0.3),
    CREST_SPEED * t,
    css ?? ((a) => waveColor(m, a)),
  )
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

let WALL_CY = H * 0.4
const POOL_R = 185
let FLOOR_Y = H - 86
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
let EYE_Y = H * 0.4
const EYE_R = 74
const OBJ_X = W * 0.44
let OBJ_Y = H - 182
const EYE_LAMP_X = 168
const EYE_LAMP_Y = 96
/** the lamp's mouth: how far along its aim the light leaves it */
const EYE_LAMP_MOUTH = 28

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
  label(ctx, lamp === 'white' ? 'white lamp' : 'the trick lamp', EYE_LAMP_X - 64, EYE_LAMP_Y + 8)

  // incoming bundle: lamp → object, leaving from the middle of the lamp's
  // mouth (absorbed strands stop at the surface)
  const inX0 = EYE_LAMP_X + Math.cos(aim) * EYE_LAMP_MOUTH
  const inY0 = EYE_LAMP_Y + Math.sin(aim) * EYE_LAMP_MOUTH
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

let PRISM_Y = H * 0.47
const PRISM_H2 = 95 // apex above / base below the beam line
let BEAM_Y = PRISM_Y - 10
const PRISM_LAMP_X = 88
const SCREEN_X = W - 110

/** the prism's corners before it is turned (the beam meets its left face) */
const PRISM_TRI: Vec[] = [
  { x: 0, y: -PRISM_H2 },
  { x: 78, y: PRISM_H2 * 0.75 },
  { x: -78, y: PRISM_H2 * 0.75 },
]
/** where the prism / raindrop sits (fractions of the canvas) — the Light
 *  lab turns the prism by dragging around this point */
export const PRISM_CENTER_FRAC = { x: 0.46, y: 0.47 }

export const DEFAULT_PRISM: PrismSetup = { angle: 0, material: 'glass', shape: 'prism', impact: 0.86 }

export interface PrismSetup {
  /** prism turn (rad), dragged by the kid */
  angle: number
  material: PrismMaterial
  shape: PrismShape
  /** raindrop: where the beam meets the drop, −1 … 1 of its radius (+ = above centre) */
  impact: number
}

const MATERIAL_LOOK: Record<PrismMaterial, { fill: string; edge: string; name: string }> = {
  glass: { fill: 'rgba(148, 197, 253, 0.1)', edge: '#94a3b8', name: 'glass prism' },
  water: { fill: 'rgba(56, 189, 248, 0.16)', edge: '#7dd3fc', name: 'water prism' },
  diamond: { fill: 'rgba(241, 245, 249, 0.14)', edge: '#e2e8f0', name: 'diamond prism' },
}

export const dropRadius = () => Math.min(120, H * 0.16)

/** the beam's colors: white = the rainbow's seven, a lamp = its own one */
function prismColors(lamp: EyeLampSetting): number[] {
  return lamp === 'white' ? [700, 640, 590, 550, 510, 470, 420] : [lamp]
}

/** from `p` along `d` to the canvas edge, or to the screen if it crosses it */
function rayEnd(p: Vec, d: Vec, useScreen: boolean): { end: Vec; onScreen: boolean } {
  const top = BEAM_Y - 30
  const bottom = top + H * 0.42
  if (useScreen && d.x > 1e-6) {
    const t = (SCREEN_X - 2 - p.x) / d.x
    const y = p.y + d.y * t
    if (t > 0 && y >= top && y <= bottom) return { end: { x: SCREEN_X - 2, y }, onScreen: true }
  }
  let t = Infinity
  if (d.x > 1e-6) t = Math.min(t, (W - p.x) / d.x)
  if (d.x < -1e-6) t = Math.min(t, -p.x / d.x)
  if (d.y > 1e-6) t = Math.min(t, (H - p.y) / d.y)
  if (d.y < -1e-6) t = Math.min(t, -p.y / d.y)
  if (!Number.isFinite(t)) t = 0
  return { end: { x: p.x + d.x * t, y: p.y + d.y * t }, onScreen: false }
}

function strokePath(ctx: CanvasRenderingContext2D, pts: Vec[], css: (a: number) => string, pulse: number) {
  for (const [lw, a] of [
    [7, 0.16],
    [2.4, 0.9],
  ] as const) {
    ctx.strokeStyle = css(a * pulse)
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y)
    ctx.stroke()
  }
}

function drawSparkle(ctx: CanvasRenderingContext2D, p: Vec, t: number) {
  const a = 0.55 + 0.45 * Math.sin(t * 6 + p.x)
  ctx.strokeStyle = `rgba(255, 255, 255, ${a})`
  ctx.lineWidth = 1.5
  for (const [dx, dy] of [
    [7, 0],
    [0, 7],
  ]) {
    ctx.beginPath()
    ctx.moveTo(p.x - dx, p.y - dy)
    ctx.lineTo(p.x + dx, p.y + dy)
    ctx.stroke()
  }
}

function drawPrismLamp(ctx: CanvasRenderingContext2D, y: number, lamp: EyeLampSetting) {
  ctx.fillStyle = '#334155'
  ctx.beginPath()
  ctx.roundRect(PRISM_LAMP_X - 46, y - 24, 52, 48, 8)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.moveTo(PRISM_LAMP_X + 6, y - 24)
  ctx.lineTo(PRISM_LAMP_X + 26, y - 33)
  ctx.lineTo(PRISM_LAMP_X + 26, y + 33)
  ctx.lineTo(PRISM_LAMP_X + 6, y + 24)
  ctx.closePath()
  ctx.fill()
  label(ctx, lamp === 'white' ? 'white lamp' : 'one-color lamp', PRISM_LAMP_X - 20, y + 44)
}

function drawPrismScene(ctx: CanvasRenderingContext2D, lamp: EyeLampSetting, t: number, setup: PrismSetup) {
  const pulse = 0.9 + 0.1 * Math.sin(t * 3)
  const colors = prismColors(lamp)
  const center = { x: W * PRISM_CENTER_FRAC.x, y: H * PRISM_CENTER_FRAC.y }
  const drop = setup.shape === 'drop'
  const R = dropRadius()
  const beamY = drop ? center.y - setup.impact * R : BEAM_Y
  const start = { x: PRISM_LAMP_X + 26, y: beamY }
  const dir = { x: 1, y: 0 }
  const white = (a: number) => `rgba(248, 250, 252, ${a * 0.9})`
  const sparkles: Vec[] = []

  drawPrismLamp(ctx, beamY, lamp)

  // trace every color; until the first surface they travel together
  const paths = colors.map((nm) => {
    const n = refractiveIndex(drop ? 'water' : setup.material, nm)
    const path = drop
      ? traceDrop(start, dir, center, R, n)
      : tracePolygon(start, dir, turnedPolygon(PRISM_TRI, center, setup.angle), n)
    return { nm, path }
  })
  const firstHit = paths.find((q) => q.path && q.path.pts.length > 1)?.path?.pts[1]
  // the shared incoming beam
  const meet = firstHit ?? rayEnd(start, dir, !drop).end
  strokePath(ctx, [start, meet], lamp === 'white' ? white : (a) => wavelengthToCss(lamp as number, a), pulse)

  if (firstHit) {
    for (const { nm, path } of paths) {
      if (!path) continue
      const last = path.pts[path.pts.length - 1]
      const { end, onScreen } = path.trapped ? { end: last, onScreen: false } : rayEnd(last, path.dir, !drop)
      strokePath(ctx, [...path.pts.slice(1), end], (a) => wavelengthToCss(nm, a), pulse)
      sparkles.push(...path.bounces)
      if (onScreen) {
        ctx.fillStyle = wavelengthToCss(nm, 0.95)
        ctx.beginPath()
        ctx.roundRect(SCREEN_X - 6, end.y - 5, 14, 10, 3)
        ctx.fill()
      }
    }
  }

  // the glass (or the drop), over the rays
  if (drop) {
    const g = ctx.createRadialGradient(center.x - R * 0.3, center.y - R * 0.35, R * 0.1, center.x, center.y, R)
    g.addColorStop(0, 'rgba(186, 230, 253, 0.22)')
    g.addColorStop(1, 'rgba(56, 189, 248, 0.08)')
    ctx.fillStyle = g
    ctx.strokeStyle = '#7dd3fc'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(center.x, center.y, R, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    label(ctx, 'a raindrop (drawn huge)', center.x, center.y - R - 16)
  } else {
    const look = MATERIAL_LOOK[setup.material]
    const poly = turnedPolygon(PRISM_TRI, center, setup.angle)
    ctx.fillStyle = look.fill
    ctx.strokeStyle = look.edge
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.beginPath()
    poly.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    label(ctx, look.name, center.x, center.y + PRISM_H2 + 22)
    // a turning hint: a faint arc with arrows around the prism
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
    ctx.lineWidth = 1.2
    ctx.setLineDash([4, 5])
    ctx.beginPath()
    ctx.arc(center.x, center.y + 16, PRISM_H2 + 34, -2.5, -0.65)
    ctx.stroke()
    ctx.setLineDash([])
    label(ctx, '↻ drag to turn', center.x, center.y + 16 - PRISM_H2 - 44)
  }
  for (const q of sparkles) drawSparkle(ctx, q, t)

  if (!drop) {
    // the screen catching the result
    ctx.fillStyle = '#1e293b'
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.9)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(SCREEN_X, BEAM_Y - 30, 14, H * 0.42, 4)
    ctx.fill()
    ctx.stroke()
    label(ctx, 'screen', SCREEN_X + 7, BEAM_Y - 44)
  } else {
    label(ctx, '↕ drag to move the beam', PRISM_LAMP_X - 10, beamY - 46)
    // where the colors come back out: beside the fan, the real rainbow
    // angle (a fact, not the boosted drawing's)
    const red = paths.find((q) => q.nm === 700 || colors.length === 1)?.path
    if (red && !red.trapped && turnDeg(dir, red.dir) > 120) {
      // right of the drop, clear of the fan (which leaves to the lower left)
      label(ctx, 'the colors come back out:', center.x + R + 110, center.y + R * 0.9)
      label(ctx, 'a rainbow, about 42° from the sunlight', center.x + R + 110, center.y + R * 0.9 + 16)
    }
  }
}

// ---------- 🩻 the bone photo (L13: how an X-ray picture is made) ----------
// An X-ray tube rains ghost-grey packets DOWN through the object onto a film
// cassette. Each packet's fate is rolled against the materials it crosses
// (core/xray): flesh lets most pass (soft warm shimmer when one sinks in),
// bone swallows nearly all (pale pings right where the hidden bones are —
// the stopping places trace the skeleton before the photo shows it), metal
// stops everything; stopped packets sometimes BOUNCE off sideways (scatter).
// Beside the scene, "the photo" develops: a SHADOW picture — the film
// darkens wherever packets got through, so bones stay pale and the ring
// stays white. Switching the tube to ordinary light proves why doctors need
// X-rays: nothing gets past the skin, the photo is only a silhouette.

// packets spawn far enough below the mouth that a glyph's top (~28 px above
// its centre) never pokes above the machine's edge
const XRAY_SPAWN_Y = 141
const XRAY_SPEED = 330
const XRAY_MOUTH_Y = 96
// where the tube/bulb stands: the scene column is centred in the space left
// of the photo panel (the lamp-switch overlay sits at the canvas midline)
const XRAY_CX = (W - 270) / 2

interface XrayPacket {
  x: number
  y: number
  stopY: number
  mat: XrayMaterial | null // null = reaches the film
}

export interface XrayState {
  key: string
  packets: XrayPacket[]
  spawn: number
  exposure: number // 0–1, the photo developing
  flashes: Array<{ x: number; y: number; mat: XrayMaterial; age: number }>
  scatters: Array<{ x: number; y: number; a: number; age: number }>
  blips: Array<{ x: number; age: number }>
}

export function newXrayState(): XrayState {
  return { key: '', packets: [], spawn: 0.2, exposure: 0, flashes: [], scatters: [], blips: [] }
}

function xrayLayout(obj: XrayObject) {
  const cx = XRAY_CX // the photo panel lives in the right ~270 px
  const left = cx - obj.w / 2
  // anchored to the BOTTOM: the film sits low so the canvas has no dead
  // stretch under it, and the rain gets the leftover height
  const top = Math.max(148, H - 92 - obj.h)
  const filmY = top + obj.h + 20
  return { cx, left, top, filmY }
}

/** `speed` is the ray-speed slider as a slow-motion factor: it scales the
 *  rain (packet flight, spawning, sparks, flashes) but NEVER the photo —
 *  exposure runs on real time, so the reveal pace stays constant */
function stepXray(st: XrayState, dt: number, obj: XrayObject, lamp: XrayLamp, speed: number) {
  const pdt = dt * speed
  const key = `${obj.id}|${lamp}`
  if (st.key !== key) {
    // a new object or a new lamp = a fresh sheet of film
    st.key = key
    st.packets = []
    st.spawn = 0.1
    st.exposure = 0
    st.flashes = []
    st.scatters = []
    st.blips = []
  }
  const { left, top, filmY } = xrayLayout(obj)
  st.spawn -= pdt
  while (st.spawn <= 0) {
    st.spawn += 0.05
    const x = left - 28 + Math.random() * (obj.w + 56)
    const fate = rollFate(raySegments(obj, x - left), lamp)
    st.packets.push({
      x,
      y: XRAY_SPAWN_Y,
      stopY: fate ? top + fate.y : filmY,
      mat: fate?.mat ?? null,
    })
  }
  const keep: XrayPacket[] = []
  for (const p of st.packets) {
    p.y += XRAY_SPEED * pdt
    if (p.y < p.stopY) {
      keep.push(p)
      continue
    }
    if (p.mat) {
      st.flashes.push({ x: p.x, y: p.stopY, mat: p.mat, age: 0 })
      if ((p.mat === 'bone' || p.mat === 'metal') && Math.random() < SCATTER_CHANCE) {
        // the small TRUE bounce: scatter, up and sideways out of the scene
        const a =
          Math.random() < 0.5
            ? -(0.25 + 0.55 * Math.random())
            : -Math.PI + (0.25 + 0.55 * Math.random())
        st.scatters.push({ x: p.x, y: p.stopY, a, age: 0 })
      }
    } else {
      st.blips.push({ x: p.x, age: 0 })
    }
  }
  st.packets = keep
  // the photo develops with exposure time (ordinary light exposes faster —
  // there is nothing subtle to collect, only a silhouette)
  st.exposure = Math.min(1, st.exposure + dt / (lamp === 'xray' ? 14 : 6))
  for (const f of st.flashes) f.age += pdt
  st.flashes = st.flashes.filter((f) => f.age < 0.5)
  for (const s of st.scatters) {
    s.x += Math.cos(s.a) * 260 * pdt
    s.y += Math.sin(s.a) * 260 * pdt
    s.age += pdt
  }
  st.scatters = st.scatters.filter((s) => s.age < 0.9)
  for (const b of st.blips) b.age += pdt
  st.blips = st.blips.filter((b) => b.age < 0.35)
}


const XRAY_M = 1e-10
const ORDINARY_M = 560e-9
// packet glyphs are a single bright core with NO outline/halo (feedback
// 2026-11-16 round 2): the glyph's wide pass is suppressed, and contrast
// over the object comes from the darkened object fills instead
const xrayPacketCss = (a: number) =>
  a < 0.5 ? 'rgba(0, 0, 0, 0)' : 'rgba(232, 238, 245, 0.95)'

/** the object as the scene sees it: skin, fur, suitcase — contents hidden */
function drawXrayObject(ctx: CanvasRenderingContext2D, obj: XrayObject, left: number, top: number) {
  ctx.save()
  ctx.translate(left, top)
  for (const s of obj.shapes) {
    if (!s.look) continue
    ctx.fillStyle = s.look
    ctx.strokeStyle = s.look
    if (s.kind === 'circle') {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    } else if (s.kind === 'rect') {
      ctx.beginPath()
      ctx.roundRect(s.x, s.y, s.w, s.h, 4)
      ctx.fill()
    } else {
      ctx.lineWidth = s.r * 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(s.x0, s.y0)
      ctx.lineTo(s.x1, s.y1)
      ctx.stroke()
    }
  }
  // small friendly decor (drawn only, no material of its own)
  if (obj.id === 'dog') {
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.arc(280, 90, 3, 0, Math.PI * 2) // eye
    ctx.fill()
    ctx.beginPath()
    ctx.arc(318, 106, 4.5, 0, Math.PI * 2) // nose
    ctx.fill()
  } else if (obj.id === 'case') {
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(8, 82)
    ctx.lineTo(272, 82)
    ctx.stroke()
  }
  ctx.restore()
}

const greyCss = (v: number) =>
  `rgb(${Math.round(235 * v)}, ${Math.round(240 * v)}, ${Math.round(245 * v)})`

/** the photo on the film, developing: a SHADOW picture of the object */
function drawXrayPhoto(
  ctx: CanvasRenderingContext2D,
  obj: XrayObject,
  lamp: XrayLamp,
  exposure: number,
  filmY: number,
) {
  const margin = 24
  const pw = obj.w + 2 * margin
  const ph = obj.h + 2 * margin
  const scale = Math.min(236 / pw, (H - 150) / ph, 1)
  const px0 = W - 20 - pw * scale
  // sits low, its bottom flush with the film cassette's
  const py0 = Math.max(96, filmY + 14 - ph * scale)
  const e = exposure
  // the film: starts blank, darkens wherever packets land
  ctx.fillStyle = greyCss(1 - e * (1 - AIR_SHADE))
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(px0, py0, pw * scale, ph * scale, 6)
  ctx.fill()
  ctx.stroke()
  // the visual link: this IS the cassette's film, lifted out to be looked at
  const filmRight = xrayLayout(obj).left + obj.w + 35
  if (px0 - filmRight > 18) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 5])
    ctx.beginPath()
    ctx.moveTo(filmRight + 5, filmY + 7)
    ctx.lineTo(px0 - 8, filmY + 7)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(251, 191, 36, 0.85)'
    ctx.beginPath()
    ctx.moveTo(px0 - 3, filmY + 7)
    ctx.lineTo(px0 - 11, filmY + 2)
    ctx.lineTo(px0 - 11, filmY + 12)
    ctx.closePath()
    ctx.fill()
  }
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(px0, py0, pw * scale, ph * scale, 6)
  ctx.clip()
  ctx.translate(px0 + margin * scale, py0 + margin * scale)
  ctx.scale(scale, scale)
  // under ordinary light NOTHING inside the outline reaches the film: the
  // whole object is one white silhouette, no bones
  const shade = (mat: XrayMaterial) => (lamp === 'ordinary' ? 1 : FILM_SHADE[mat])
  const sorted = [...obj.shapes].sort((a, b) => MAT_RANK[a.mat] - MAT_RANK[b.mat])
  for (const s of sorted) {
    ctx.fillStyle = greyCss(1 - e * (1 - shade(s.mat)))
    ctx.strokeStyle = ctx.fillStyle
    if (s.kind === 'circle') {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    } else if (s.kind === 'rect') {
      ctx.fillRect(s.x, s.y, s.w, s.h)
    } else {
      ctx.lineWidth = s.r * 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(s.x0, s.y0)
      ctx.lineTo(s.x1, s.y1)
      ctx.stroke()
    }
  }
  ctx.restore()
  label(
    ctx,
    e < 1 ? 'the photo, developing…' : 'the photo',
    px0 + (pw * scale) / 2,
    py0 + ph * scale + 14,
  )
}

function drawXrayScene(
  ctx: CanvasRenderingContext2D,
  st: XrayState,
  obj: XrayObject,
  lamp: XrayLamp,
  t: number,
) {
  const { cx, left, top, filmY } = xrayLayout(obj)
  const xray = lamp === 'xray'
  const mouthL = left - 30
  const mouthR = left + obj.w + 30

  // the faint beam, the device's whole mouth → the film's width
  ctx.fillStyle = xray ? 'rgba(148, 163, 184, 0.06)' : 'rgba(253, 230, 170, 0.07)'
  ctx.beginPath()
  ctx.moveTo(mouthL, XRAY_MOUTH_Y)
  ctx.lineTo(mouthR, XRAY_MOUTH_Y)
  ctx.lineTo(left + obj.w + 32, filmY)
  ctx.lineTo(left - 32, filmY)
  ctx.closePath()
  ctx.fill()

  if (xray) {
    // the X-ray tube: a compact body flaring into a WIDE mouth, so the rain
    // visibly leaves the machine across the object's whole width
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.roundRect(cx - 30, 40, 60, 36, 8)
    ctx.fill()
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.moveTo(cx - 30, 72)
    ctx.lineTo(cx + 30, 72)
    ctx.lineTo(mouthR, XRAY_MOUTH_Y)
    ctx.lineTo(mouthL, XRAY_MOUTH_Y)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(mouthL, XRAY_MOUTH_Y - 4, mouthR - mouthL, 5)
    // the mouth's glow, across its whole width
    const mg = ctx.createLinearGradient(0, XRAY_MOUTH_Y, 0, XRAY_MOUTH_Y + 34)
    mg.addColorStop(0, 'rgba(148, 163, 184, 0.28)')
    mg.addColorStop(1, 'rgba(148, 163, 184, 0)')
    ctx.fillStyle = mg
    ctx.fillRect(mouthL, XRAY_MOUTH_Y, mouthR - mouthL, 34)
    label(ctx, 'X-ray tube', cx - 80, 56)
  } else {
    // an everyday light bulb on its cord
    drawLightBulb(ctx, cx, 72)
    label(ctx, 'light bulb', cx - 80, 56)
  }

  // the object, in the flesh (what is inside stays hidden — the flashes and
  // the photo do the revealing)
  label(ctx, obj.name, left + obj.w / 2, top - 12)
  drawXrayObject(ctx, obj, left, top)

  // the raining packets
  for (const p of st.packets) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(Math.PI / 2)
    if (xray) drawPacketGlyph(ctx, 0, 0, XRAY_M, t, 56, xrayPacketCss)
    else drawPacketGlyph(ctx, 0, 0, ORDINARY_M, t, 56, ordinaryCss)
    ctx.restore()
  }

  // scatter sparks: the few packets that really DO bounce away
  for (const s of st.scatters) {
    ctx.save()
    ctx.globalAlpha *= Math.max(0, 1 - s.age / 0.9)
    ctx.translate(s.x, s.y)
    ctx.rotate(s.a)
    drawPacketGlyph(ctx, 0, 0, XRAY_M, t, 34, xrayPacketCss)
    ctx.restore()
  }

  // impact flashes: warm shimmer in soft stuff, pale ping at bone/metal
  for (const f of st.flashes) {
    const a = Math.max(0, (0.5 - f.age) / 0.5)
    if (f.mat === 'bone' || f.mat === 'metal') {
      ctx.strokeStyle = `rgba(226, 232, 240, ${0.85 * a})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(f.x, f.y, 4 + f.age * 44, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 22)
      g.addColorStop(0, `rgba(253, 186, 116, ${0.4 * a})`)
      g.addColorStop(1, 'rgba(253, 186, 116, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(f.x, f.y, 22, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // the film cassette; small white blips where packets land
  const fg = ctx.createLinearGradient(0, filmY, 0, filmY + 14)
  fg.addColorStop(0, '#475569')
  fg.addColorStop(0.25, '#1e293b')
  fg.addColorStop(1, '#0f172a')
  ctx.fillStyle = fg
  ctx.beginPath()
  ctx.roundRect(left - 35, filmY, obj.w + 70, 14, 4)
  ctx.fill()
  for (const b of st.blips) {
    ctx.fillStyle = `rgba(248, 250, 252, ${Math.max(0, (0.35 - b.age) / 0.35) * 0.9})`
    ctx.fillRect(b.x - 1.5, filmY - 2, 3, 5)
  }
  label(ctx, 'film', left + obj.w / 2, filmY + 26)

  // the payoff: the photo, developing beside the scene
  drawXrayPhoto(ctx, obj, lamp, st.exposure, filmY)
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
export type WaveScene = 'wave' | 'doorbell' | 'lamps' | 'eye' | 'prism' | 'xray'

/** switch the module's layout to a canvas `h` px tall */
function setHeight(h: number) {
  if (h === H) return
  H = h
  CY = H * 0.58
  BELL_Y = CY - PLATE_H / 2 - 64
  WALL_CY = H * 0.4
  FLOOR_Y = H - 86
  EYE_Y = H * 0.4
  OBJ_Y = H - 182
  PRISM_Y = H * 0.47
  BEAM_Y = PRISM_Y - 10
}

export const WaveStage = memo(function WaveStage({
  u,
  brightness,
  view,
  scene,
  lamps,
  eyeObject,
  eyeLamp,
  prismLamp,
  prism = DEFAULT_PRISM,
  xrayObject,
  xrayLamp,
  xraySpeed,
  active,
  height = WAVE_H,
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
  /** prism scene: its turn, material, prism or raindrop */
  prism?: PrismSetup
  /** 🩻 bone-photo scene: what lies on the film, and which lamp shines */
  xrayObject: XrayObjectId
  xrayLamp: XrayLamp
  /** ray-speed slider 0–1 (slow motion ↔ fast rain); the photo's reveal
   *  pace is NOT affected */
  xraySpeed: number
  active: boolean
  /** canvas height (px); a Light lab drawer passes its own */
  height?: number
  /** doorbell: the bell rang (total ring count) */
  onBell?: (rings: number) => void
}) {
  setHeight(height) // before any state below is built from the layout
  const heightRef = useRef(height)
  heightRef.current = height
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
  const prismRef = useRef(prism)
  prismRef.current = prism
  const xrayObjectRef = useRef(xrayObject)
  xrayObjectRef.current = xrayObject
  const xrayLampRef = useRef(xrayLamp)
  xrayLampRef.current = xrayLamp
  const xraySpeedRef = useRef(xraySpeed)
  xraySpeedRef.current = xraySpeed
  const xrayRef = useRef<XrayState>(newXrayState())
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
      setHeight(heightRef.current)
      tRef.current += dt
      if (sceneRef.current === 'doorbell') {
        stepDoor(doorRef.current, dt, uToWavelength(uRef.current), brightRef.current)
        if (doorRef.current.rings !== lastRings.current) {
          lastRings.current = doorRef.current.rings
          onBellRef.current?.(doorRef.current.rings)
        }
      } else if (sceneRef.current === 'xray') {
        stepXray(
          xrayRef.current,
          dt,
          XRAY_OBJECTS[xrayObjectRef.current],
          xrayLampRef.current,
          0.25 + 1.5 * xraySpeedRef.current,
        )
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
  }, [u, brightness, view, scene, lamps, eyeObject, eyeLamp, prismLamp, prism, xrayObject, xrayLamp, xraySpeed])

  return (
    <Stage width={W} height={height}>
      <Layer listening={false}>
        <Shape
          ref={shapeRef}
          sceneFunc={(kctx, shape) => {
            setHeight(heightRef.current)
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
              drawPrismScene(ctx, prismLampRef.current, tRef.current, prismRef.current)
            } else if (sceneRef.current === 'xray') {
              drawXrayScene(
                ctx,
                xrayRef.current,
                XRAY_OBJECTS[xrayObjectRef.current],
                xrayLampRef.current,
                tRef.current,
              )
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
