import { memo, useEffect, useRef, useState } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import { drawGlossyParticle } from './particleStyle'
import { clamp01, easeOut } from './canvasUtil'
import { FISSION_W, FISSION_H } from './FissionStage'
import {
  LIGHT_CLOSEUP_MAX_ZOOM,
  LIGHT_CLOSEUP_TOTAL,
  LIGHT_SCENE_START,
  drawLightCloseup,
  lightCloseupCamera,
  lightCloseupOutAlpha,
  lightCloseupStep,
} from './lightCloseup'
import { drawSpectrumStrip, stripX, type StripRect } from './spectrumStrip'
import { SPECTRA, randomLineIndex, wavelengthToCss } from '../core/spectra'
import { shellConfiguration } from '../core/atom'

// R02 — ✨ Light & color demo canvas. One story so far (🎆 Firework), told in
// four acts, R01's pacing and machinery throughout (auto-play, Pause,
// snapshot story timeline):
//   1. the night scene: a shell races up and bursts red & yellow
//   2. the camera zooms into ONE red spark → shell-view atoms
//   3. the scripted jump close-up (stage/lightCloseup.ts): lithium's electron
//      jumps and falls → a red photon; sodium's → a yellow photon
//   4. the barcode free-run: many atoms flash at random, each photon adds one
//      tick to its line — the element's fingerprint EMERGES (critical-mass /
//      flashbulb philosophy), then the sky scene returns, explained.
// Same rules as the other stages: all motion lives in a ref-held sim ticked
// by one Konva.Animation; React only hears about changes via onReport.

const W = FISSION_W
const H = FISSION_H
const BUTTON_ZONE = 86
const UH = H - BUTTON_ZONE // usable height above the Pause button

export type LightStoryId = 'firework' | 'neon' | 'aurora' | 'star'

export const LIGHT_STORIES: Array<{
  id: LightStoryId
  label: string
  subtitle: string
  ready: boolean
}> = [
  { id: 'firework', label: '🎆 Firework', subtitle: 'lithium red · sodium yellow', ready: true },
  { id: 'neon', label: '🏮 Neon sign', subtitle: 'electricity through neon gas', ready: false },
  { id: 'aurora', label: '🌌 Aurora', subtitle: 'oxygen green, high above', ready: false },
  { id: 'star', label: '🔭 Star detective', subtitle: 'reading starlight barcodes', ready: false },
]

export type LightPhase = 'scene' | 'closeup' | 'barcode' | 'payoff'

export interface LightReport {
  phase: LightPhase
  storyId: string
  closeupStep: number
  liCaught: number
  naCaught: number
}

// ---------- timings ----------

const LAUNCH_T = 1.3
const SCENE_T = 5.4
const BARCODE_T = 10
const BARCODE_FADE = 0.5
const PAYOFF_T = 11.5

// ---------- sim ----------

type FireworkEl = 'li' | 'na'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  el: FireworkEl
  age: number
}
/** payoff shells: scheduled bursts of one element's color */
interface Shell {
  x: number
  burstY: number
  el: FireworkEl
  t0: number // launch starts (payoff clock)
  burst: boolean
}
/** barcode free-run: a photon flying from its atom to the strip */
interface FPhoton {
  el: FireworkEl
  line: number
  x0: number
  y0: number
  tx: number
  ty: number
  t: number
  dur: number
}

interface Sim {
  story: LightStoryId
  phase: LightPhase
  phaseT: number
  sparks: Spark[]
  burstDone: boolean
  shells: Shell[]
  /** the spark the camera dives into (chosen when the scene ends) */
  focus: { x: number; y: number } | null
  counts: { li: number[]; na: number[] }
  caught: { li: number; na: number }
  photons: FPhoton[]
  nextEmit: number
}

// sparks outlive the 5.4 s scene, so the zoom always finds a live one
const SPARK_LIFE = 4.6

function buildSim(story: LightStoryId): Sim {
  return {
    story,
    phase: 'scene',
    phaseT: 0,
    sparks: [],
    burstDone: false,
    shells: [],
    focus: null,
    counts: {
      li: SPECTRA.li.lines.map(() => 0),
      na: SPECTRA.na.lines.map(() => 0),
    },
    caught: { li: 0, na: 0 },
    photons: [],
    nextEmit: 0.4,
  }
}

function burst(sim: Sim, x: number, y: number, els: FireworkEl[]) {
  const n = 54
  for (let i = 0; i < n; i++) {
    const a = (i * 2 * Math.PI) / n + (Math.random() - 0.5) * 0.25
    const sp = 120 + Math.random() * 110
    sim.sparks.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      el: els[i % els.length],
      age: 0,
    })
  }
}

function stepSparks(sim: Sim, dt: number) {
  for (const s of sim.sparks) {
    s.x += s.vx * dt
    s.y += s.vy * dt
    s.vx *= 1 - 0.55 * dt
    s.vy *= 1 - 0.55 * dt
    s.vy += 42 * dt // a little gravity
    s.age += dt
  }
  sim.sparks = sim.sparks.filter((s) => s.age < SPARK_LIFE)
}

// ---------- barcode free-run layout ----------

const GROUPS: Record<FireworkEl, { cx: number; cy: number }> = {
  li: { cx: W * 0.27, cy: UH * 0.38 },
  na: { cx: W * 0.73, cy: UH * 0.38 },
}
// loose rings of 5 atoms per element
const ATOM_OFFSETS = [
  { x: 0, y: -8 },
  { x: -118, y: -62 },
  { x: 122, y: -58 },
  { x: -92, y: 84 },
  { x: 96, y: 88 },
]
function freerunAtoms(el: FireworkEl) {
  return ATOM_OFFSETS.map((o) => ({ x: GROUPS[el].cx + o.x, y: GROUPS[el].cy + o.y }))
}
function stripRect(el: FireworkEl): StripRect {
  const w = W * 0.38
  return { x: el === 'li' ? W * 0.075 : W * 0.545, y: UH - 78, w, h: 44 }
}

function emitPhoton(sim: Sim, el: FireworkEl) {
  const atoms = freerunAtoms(el)
  const a = atoms[Math.floor(Math.random() * atoms.length)]
  const line = randomLineIndex(SPECTRA[el].lines, Math.random())
  const rect = stripRect(el)
  sim.photons.push({
    el,
    line,
    x0: a.x,
    y0: a.y,
    tx: stripX(rect, SPECTRA[el].lines[line].nm),
    ty: rect.y,
    t: 0,
    dur: 0.75,
  })
}

function stepBarcode(sim: Sim, dt: number) {
  sim.nextEmit -= dt
  // stop emitting right before the phase ends, so no photon is cut off
  if (sim.nextEmit <= 0 && sim.phaseT < BARCODE_T - 1) {
    sim.nextEmit = 0.16 + Math.random() * 0.1
    emitPhoton(sim, Math.random() < 0.5 ? 'li' : 'na')
  }
  for (const p of sim.photons) p.t += dt
  for (const p of sim.photons) {
    if (p.t >= p.dur && p.line >= 0) {
      sim.counts[p.el][p.line]++
      sim.caught[p.el]++
      p.line = -1 // counted
    }
  }
  sim.photons = sim.photons.filter((p) => p.t < p.dur + 0.2)
}

// ---------- step ----------

function step(sim: Sim, dt: number) {
  sim.phaseT += dt
  switch (sim.phase) {
    case 'scene': {
      if (!sim.burstDone && sim.phaseT >= LAUNCH_T) {
        sim.burstDone = true
        burst(sim, W * 0.46, UH * 0.36, ['li', 'na'])
      }
      stepSparks(sim, dt)
      if (sim.phaseT >= SCENE_T) {
        // dive into the first red spark still shining
        const li = sim.sparks.find((s) => s.el === 'li') ?? sim.sparks[0]
        sim.focus = li ? { x: li.x, y: li.y } : { x: W * 0.46, y: UH * 0.36 }
        sim.phase = 'closeup'
        sim.phaseT = 0
      }
      break
    }
    case 'closeup':
      // the spark scene is frozen while the camera is inside it
      if (sim.phaseT >= LIGHT_CLOSEUP_TOTAL) {
        sim.phase = 'barcode'
        sim.phaseT = 0
        sim.photons = []
        sim.nextEmit = 0.6
      }
      break
    case 'barcode':
      stepBarcode(sim, dt)
      if (sim.phaseT >= BARCODE_T) {
        sim.phase = 'payoff'
        sim.phaseT = 0
        sim.sparks = []
        sim.photons = []
        sim.shells = [
          { x: W * 0.3, burstY: UH * 0.32, el: 'li', t0: 0.2, burst: false },
          { x: W * 0.68, burstY: UH * 0.38, el: 'na', t0: 1.5, burst: false },
          { x: W * 0.52, burstY: UH * 0.26, el: 'li', t0: 5.2, burst: false },
          { x: W * 0.38, burstY: UH * 0.42, el: 'na', t0: 6.6, burst: false },
        ]
      }
      break
    case 'payoff':
      for (const sh of sim.shells) {
        if (!sh.burst && sim.phaseT >= sh.t0 + LAUNCH_T) {
          sh.burst = true
          burst(sim, sh.x, sh.burstY, [sh.el])
        }
      }
      stepSparks(sim, dt)
      break
  }
}

// ---------- the story timeline ----------

export function lightStoryOrder(story: LightStoryId): string[] {
  void story // one story so far; neon/aurora/star get their own orders later
  const close = Array.from({ length: 5 }, (_, i) => `closeup${i}`)
  return ['scene', 'zoom', ...close, 'barcode', 'payoff']
}

function storyId(sim: Sim): string {
  switch (sim.phase) {
    case 'scene':
      return 'scene'
    case 'closeup':
      return sim.phaseT < LIGHT_SCENE_START ? 'zoom' : `closeup${lightCloseupStep(sim.phaseT)}`
    default:
      return sim.phase
  }
}

// ---------- drawing ----------

const LI_CSS = wavelengthToCss(SPECTRA.li.lines[0].nm)
const NA_CSS = wavelengthToCss(SPECTRA.na.lines[0].nm)
const AMBER = 'rgba(251, 191, 36, 0.95)'

/** deterministic pseudo-random for the fixed night-sky stars */
const frac = (v: number) => v - Math.floor(v)
const rnd = (i: number, salt: number) => frac(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453)

function drawNightSky(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#020617')
  g.addColorStop(1, '#0b1226')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 70; i++) {
    const x = rnd(i, 1) * W
    const y = rnd(i, 2) * UH * 0.8
    ctx.fillStyle = `rgba(226, 232, 240, ${0.25 + 0.45 * rnd(i, 3)})`
    ctx.fillRect(x, y, rnd(i, 4) > 0.85 ? 2 : 1, rnd(i, 4) > 0.85 ? 2 : 1)
  }
  // the ground
  ctx.fillStyle = '#060a18'
  ctx.beginPath()
  ctx.moveTo(0, UH - 26)
  ctx.quadraticCurveTo(W * 0.3, UH - 44, W * 0.55, UH - 30)
  ctx.quadraticCurveTo(W * 0.8, UH - 18, W, UH - 34)
  ctx.lineTo(W, H)
  ctx.lineTo(0, H)
  ctx.closePath()
  ctx.fill()
}

function sparkCss(el: FireworkEl, alpha: number) {
  return el === 'li'
    ? wavelengthToCss(SPECTRA.li.lines[0].nm, alpha)
    : wavelengthToCss(SPECTRA.na.lines[0].nm, alpha)
}

function drawSparks(ctx: CanvasRenderingContext2D, sim: Sim, now: number) {
  for (const [i, s] of sim.sparks.entries()) {
    const fade = 1 - clamp01((s.age - (SPARK_LIFE - 1.2)) / 1.2)
    const tw = 0.75 + 0.25 * Math.sin(now * 20 + i * 2.1)
    const a = fade * tw
    if (a <= 0) continue
    // trail
    ctx.strokeStyle = sparkCss(s.el, a * 0.4)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(s.x - s.vx * 0.09, s.y - s.vy * 0.09)
    ctx.stroke()
    // glowing head
    const r = 7
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r)
    g.addColorStop(0, `rgba(255, 255, 255, ${0.9 * a})`)
    g.addColorStop(0.35, sparkCss(s.el, 0.9 * a))
    g.addColorStop(1, sparkCss(s.el, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawShellRise(ctx: CanvasRenderingContext2D, x: number, burstY: number, p: number) {
  const y = UH - 30 + (burstY - (UH - 30)) * easeOut(p)
  ctx.fillStyle = 'rgba(255, 237, 190, 0.95)'
  ctx.beginPath()
  ctx.arc(x, y, 2.5, 0, Math.PI * 2)
  ctx.fill()
  // sparkly tail
  for (let i = 1; i <= 5; i++) {
    ctx.fillStyle = `rgba(253, 186, 116, ${0.5 - i * 0.09})`
    ctx.beginPath()
    ctx.arc(x + Math.sin(p * 40 + i) * 1.5, y + i * 7, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawScene(ctx: CanvasRenderingContext2D, sim: Sim, now: number) {
  drawNightSky(ctx)
  if (sim.phase === 'scene' && sim.phaseT < LAUNCH_T) {
    drawShellRise(ctx, W * 0.46, UH * 0.36, clamp01(sim.phaseT / LAUNCH_T))
  }
  drawSparks(ctx, sim, now)
}

// --- barcode free-run ---

function drawMiniAtom(
  ctx: CanvasRenderingContext2D,
  el: FireworkEl,
  x: number,
  y: number,
  spin: number,
  glow: number,
) {
  const protons = SPECTRA[el].protons
  const shells = shellConfiguration(protons, protons)
  if (glow > 0) {
    const nm = SPECTRA[el].lines[0].nm
    const g = ctx.createRadialGradient(x, y, 0, x, y, 54)
    g.addColorStop(0, wavelengthToCss(nm, 0.5 * glow))
    g.addColorStop(1, wavelengthToCss(nm, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, 54, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < shells.length; i++) {
    const r = 13 + i * 9
    ctx.strokeStyle = 'rgba(74, 107, 145, 0.8)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
    const a0 = (spin * (i % 2 === 0 ? 1 : -0.7)) / (1 + i * 0.25) + i * 1.3
    for (let e = 0; e < shells[i]; e++) {
      const a = a0 + (e * 2 * Math.PI) / shells[i]
      drawGlossyParticle(ctx, 'electrons', x + r * Math.cos(a), y + r * Math.sin(a), 1.8)
    }
  }
  drawGlossyParticle(ctx, 'protons', x, y, 4.5)
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 13) {
  ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
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

function drawBarcodeRun(ctx: CanvasRenderingContext2D, sim: Sim, now: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const spin = now * 0.6
  for (const el of ['li', 'na'] as const) {
    const atoms = freerunAtoms(el)
    for (const [i, a] of atoms.entries()) {
      // glow briefly when one of its photons was just born
      let glow = 0
      for (const p of sim.photons) {
        if (p.el === el && p.t < 0.3 && Math.hypot(p.x0 - a.x, p.y0 - a.y) < 1) {
          glow = Math.max(glow, 1 - p.t / 0.3)
        }
      }
      drawMiniAtom(ctx, el, a.x, a.y, spin + i * 1.7, glow)
    }
    tag(
      ctx,
      `${SPECTRA[el].name} atoms`,
      GROUPS[el].cx,
      GROUPS[el].cy - 118,
      el === 'li' ? LI_CSS : NA_CSS,
    )
    const rect = stripRect(el)
    drawSpectrumStrip(
      ctx,
      rect,
      SPECTRA[el].lines,
      sim.counts[el],
      `${SPECTRA[el].name}'s barcode`,
    )
  }
  // the flying photons: a glowing dot that lands on its own line
  for (const p of sim.photons) {
    if (p.line < 0) continue
    const u = clamp01(p.t / p.dur)
    const x = p.x0 + (p.tx - p.x0) * u
    const y = p.y0 + (p.ty - p.y0) * easeOut(u)
    const nm = SPECTRA[p.el].lines[Math.max(0, p.line)].nm
    const g = ctx.createRadialGradient(x, y, 0, x, y, 6)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.4, wavelengthToCss(nm, 0.9))
    g.addColorStop(1, wavelengthToCss(nm, 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawPayoff(ctx: CanvasRenderingContext2D, sim: Sim, now: number) {
  drawNightSky(ctx)
  for (const sh of sim.shells) {
    const p = (sim.phaseT - sh.t0) / LAUNCH_T
    if (p > 0 && p < 1) drawShellRise(ctx, sh.x, sh.burstY, p)
  }
  drawSparks(ctx, sim, now)
  // name the colors as the bursts bloom
  for (const sh of sim.shells.slice(0, 2)) {
    const q = sim.phaseT - (sh.t0 + LAUNCH_T)
    if (q > 0.3 && q < 3.6) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, (q - 0.3) / 0.4) * (q > 3 ? (3.6 - q) / 0.6 : 1)
      tag(
        ctx,
        sh.el === 'li' ? 'lithium — deep red' : 'sodium — yellow',
        sh.x,
        sh.burstY - 86,
        sh.el === 'li' ? LI_CSS : NA_CSS,
      )
      ctx.restore()
    }
  }
  // both finished barcodes stay on screen — the fireworks' signature
  const a = clamp01(sim.phaseT / 0.8)
  ctx.save()
  ctx.globalAlpha = a
  for (const el of ['li', 'na'] as const) {
    drawSpectrumStrip(ctx, stripRect(el), SPECTRA[el].lines, sim.counts[el], `${SPECTRA[el].name}'s barcode`)
  }
  ctx.restore()
}

// ---------- the chooser lineup ----------

export interface LightChooserRow {
  id: LightStoryId
  ready: boolean
  left: number
  top: number
  right: number
  bottom: number
}

const ROW_M = 18
const ROW_GAP = 12

export function lightChooserRows(): LightChooserRow[] {
  const rowH = (UH - 2 * ROW_M - 3 * ROW_GAP) / 4
  return LIGHT_STORIES.map((s, i) => ({
    id: s.id,
    ready: s.ready,
    left: ROW_M,
    top: ROW_M + i * (rowH + ROW_GAP),
    right: W - ROW_M,
    bottom: ROW_M + i * (rowH + ROW_GAP) + rowH,
  }))
}

function drawLineup(ctx: CanvasRenderingContext2D, now: number) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const rows = lightChooserRows()
  for (const [i, row] of rows.entries()) {
    const story = LIGHT_STORIES[i]
    const rw = row.right - row.left
    const rh = row.bottom - row.top
    ctx.save()
    if (!story.ready) ctx.globalAlpha = 0.45
    ctx.fillStyle = '#0b1226'
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(row.left, row.top, rw, rh, 14)
    ctx.fill()
    ctx.stroke()
    // mini scene in the right 55% of the row
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(row.left, row.top, rw, rh, 14)
    ctx.clip()
    drawMiniScene(ctx, story.id, row.left + rw * 0.42, row.top, rw * 0.58, rh, now)
    ctx.restore()
    // name + subtitle
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '600 17px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(story.label, row.left + 18, row.top + rh / 2 - 2)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(story.subtitle, row.left + 18, row.top + rh / 2 + 18)
    ctx.restore()
  }
}

function drawMiniScene(
  ctx: CanvasRenderingContext2D,
  id: LightStoryId,
  x: number,
  y: number,
  w: number,
  h: number,
  now: number,
) {
  const cx = x + w / 2
  const cy = y + h / 2
  // a few stars in every night scene
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(226, 232, 240, ${0.2 + 0.4 * rnd(i, 7)})`
    ctx.fillRect(x + rnd(i, 5) * w, y + rnd(i, 6) * h * 0.75, 1, 1)
  }
  if (id === 'firework') {
    for (let i = 0; i < 18; i++) {
      const a = (i * 2 * Math.PI) / 18
      const el: FireworkEl = i % 2 === 0 ? 'li' : 'na'
      const r1 = h * 0.12
      const r2 = h * (0.3 + 0.08 * rnd(i, 8))
      ctx.strokeStyle = sparkCss(el, 0.7)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
      ctx.stroke()
      const tw = 0.6 + 0.4 * Math.sin(now * 3 + i)
      ctx.fillStyle = sparkCss(el, tw)
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (id === 'neon') {
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)'
    ctx.lineWidth = 1
    ctx.strokeRect(cx - w * 0.33, cy - h * 0.3, w * 0.66, h * 0.6)
    ctx.font = `700 ${Math.round(h * 0.34)}px ui-rounded, ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.save()
    ctx.shadowColor = wavelengthToCss(640.2)
    ctx.shadowBlur = 14
    ctx.strokeStyle = wavelengthToCss(640.2)
    ctx.lineWidth = 2
    ctx.strokeText('NEON', cx, cy + 1)
    ctx.restore()
  } else if (id === 'aurora') {
    for (let i = 0; i < 7; i++) {
      const bx = x + w * (0.1 + 0.13 * i) + Math.sin(now * 0.7 + i) * 3
      const bh = h * (0.45 + 0.3 * rnd(i, 9))
      const g = ctx.createLinearGradient(0, y + h * 0.85 - bh, 0, y + h * 0.85)
      g.addColorStop(0, wavelengthToCss(557.7, 0))
      g.addColorStop(0.75, wavelengthToCss(557.7, 0.4))
      g.addColorStop(1, wavelengthToCss(427.8, 0.35))
      ctx.fillStyle = g
      ctx.fillRect(bx, y + h * 0.85 - bh, w * 0.07, bh)
    }
    ctx.fillStyle = '#060a18'
    ctx.fillRect(x, y + h * 0.86, w, h * 0.14)
  } else {
    // star detective: a bright star + a barcode rainbow with dark gaps
    const sx = cx + w * 0.22
    const sy = y + h * 0.26
    for (const [dx, dy] of [
      [8, 0],
      [-8, 0],
      [0, 8],
      [0, -8],
    ]) {
      ctx.strokeStyle = 'rgba(255, 245, 210, 0.8)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + dx, sy + dy)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255, 245, 210, 0.95)'
    ctx.beginPath()
    ctx.arc(sx, sy, 3, 0, Math.PI * 2)
    ctx.fill()
    // the rainbow strip with missing lines
    const rx = cx - w * 0.32
    const ry = y + h * 0.58
    const rw = w * 0.62
    const rh = h * 0.2
    const g = ctx.createLinearGradient(rx, 0, rx + rw, 0)
    for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, wavelengthToCss(410 + (i / 8) * 280, 0.85))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.roundRect(rx, ry, rw, rh, 4)
    ctx.fill()
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)'
    for (const f of [0.26, 0.47, 0.72]) ctx.fillRect(rx + rw * f, ry, 2.5, rh)
  }
}

// ---------- component ----------

const END_T = PAYOFF_T

export const LightStage = memo(function LightStage({
  story,
  paused,
  seek,
  active,
  onReport,
  onFinished,
}: {
  /** the story being shown; null = the lineup chooser */
  story: LightStoryId | null
  paused: boolean
  seek: { id: string; n: number } | null
  active: boolean
  onReport: (r: LightReport) => void
  onFinished: () => void
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const storyRef = useRef(story)
  storyRef.current = story
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished
  const finishedSent = useRef(false)
  const [firstSim] = useState(() => buildSim('firework'))
  const sim = useRef<Sim>(firstSim)
  const lastSig = useRef('')
  const onReportRef = useRef(onReport)
  onReportRef.current = onReport
  const snaps = useRef(new Map<string, Sim>())
  const lastStory = useRef('')

  const record = () => {
    const id = storyId(sim.current)
    if (id !== lastStory.current) {
      lastStory.current = id
      if (!snaps.current.has(id)) snaps.current.set(id, structuredClone(sim.current))
    }
  }

  const report = () => {
    const s = sim.current
    const r: LightReport = {
      phase: s.phase,
      storyId: storyId(s),
      closeupStep: s.phase === 'closeup' ? lightCloseupStep(s.phaseT) : 0,
      liCaught: s.caught.li,
      naCaught: s.caught.na,
    }
    const sig = `${r.phase}|${r.storyId}|${r.closeupStep}|${r.liCaught}|${r.naCaught}`
    if (sig !== lastSig.current) {
      lastSig.current = sig
      onReportRef.current(r)
    }
  }

  // a story picked → fresh run
  useEffect(() => {
    finishedSent.current = false
    snaps.current.clear()
    lastStory.current = ''
    lastSig.current = ''
    if (story) {
      sim.current = buildSim(story)
      record()
      report()
    }
    shapeRef.current?.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story])

  // timeline click: rewind to a recorded step, or fast-forward to it
  useEffect(() => {
    if (!seek || !story) return
    const order = lightStoryOrder(story)
    const ti = order.indexOf(seek.id)
    if (ti < 0) return
    const idx = (id: string) => order.indexOf(id)
    const restore = (id: string) => {
      sim.current = structuredClone(snaps.current.get(id)!)
      lastStory.current = id
      for (const k of [...snaps.current.keys()]) if (idx(k) > idx(id)) snaps.current.delete(k)
    }
    if (snaps.current.has(seek.id)) {
      restore(seek.id)
    } else {
      if (idx(storyId(sim.current)) > ti) {
        const before = [...snaps.current.keys()]
          .filter((k) => idx(k) < ti)
          .sort((a, b) => idx(b) - idx(a))
        restore(before[0] ?? 'scene')
      }
      // fast-forward in fixed steps (a whole run computes in well under 0.1 s)
      for (let i = 0; i < 60 * 90 && idx(storyId(sim.current)) < ti; i++) {
        step(sim.current, 1 / 60)
        record()
      }
    }
    report()
    shapeRef.current?.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seek?.n])

  // the page stays mounted when hidden — only animate while visible
  useEffect(() => {
    const layer = shapeRef.current?.getLayer()
    if (!layer || !active || paused) return
    const anim = new Konva.Animation((frame) => {
      if (!frame) return
      const dt = Math.min(0.05, frame.timeDiff / 1000)
      if (!storyRef.current) return // the chooser: a slow shimmer only
      step(sim.current, dt)
      record()
      report()
      const s = sim.current
      if (!finishedSent.current && s.phase === 'payoff' && s.phaseT >= END_T) {
        finishedSent.current = true
        onFinishedRef.current()
      }
    }, layer)
    anim.start()
    return () => {
      anim.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused])

  return (
    <Stage width={W} height={H}>
      <Layer listening={false}>
        <Shape
          ref={shapeRef}
          sceneFunc={(kctx, shape) => {
            shape.getSelfRect = () => ({ x: 0, y: 0, width: W, height: H })
            const ctx = kctx._context as CanvasRenderingContext2D
            ctx.save()
            const s = sim.current
            const now = performance.now() / 1000
            if (!storyRef.current) drawLineup(ctx, now)
            else if (s.phase === 'scene') drawScene(ctx, s, now)
            else if (s.phase === 'closeup' && s.focus) {
              const outA = lightCloseupOutAlpha(s.phaseT)
              const cam = lightCloseupCamera(s.phaseT)
              const { x: fx, y: fy } = s.focus
              // the frozen sky, camera diving into the chosen spark (the
              // focus point glides to the canvas centre as the zoom grows,
              // so zoom 1 is exactly the normal view)
              if (cam.sceneAlpha < 1) {
                const u = (cam.zoom - 1) / (LIGHT_CLOSEUP_MAX_ZOOM - 1)
                ctx.save()
                ctx.translate(fx + (W / 2 - fx) * u, fy + (UH / 2 - fy) * u)
                ctx.scale(cam.zoom, cam.zoom)
                ctx.translate(-fx, -fy)
                drawScene(ctx, s, now)
                ctx.restore()
                if (cam.marker > 0) {
                  ctx.save()
                  ctx.globalAlpha = cam.marker
                  ctx.strokeStyle = AMBER
                  ctx.lineWidth = 3
                  ctx.beginPath()
                  ctx.arc(fx, fy, 26, 0, Math.PI * 2)
                  ctx.stroke()
                  ctx.restore()
                }
              }
              drawLightCloseup(ctx, s.phaseT, W, H, cam.sceneAlpha * outA)
            } else if (s.phase === 'barcode') {
              drawBarcodeRun(ctx, s, now, clamp01(s.phaseT / BARCODE_FADE))
            } else if (s.phase === 'payoff') drawPayoff(ctx, s, now)
            ctx.restore()
          }}
        />
      </Layer>
    </Stage>
  )
})
