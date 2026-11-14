import { memo, useEffect, useRef, useState } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import { drawGlossyParticle } from './particleStyle'
import { clamp01, easeInOut, easeOut } from './canvasUtil'
import { FISSION_W, FISSION_H } from './FissionStage'
import {
  SUN_CLOSEUP_MAX_ZOOM,
  SUN_CLOSEUP_TOTAL,
  SUN_SCENE_START,
  sunCloseupCamera,
  sunCloseupStep,
} from './sunStory'
import { ENERGY_VALLEY, SUN_RECIPE } from '../core/cosmos'
import { wavelengthToCss } from '../core/spectra'

// R04 — 🌟 Cosmic origins demo canvas. One story so far: ☀️ "Why the Sun
// shines" (+ WHAT the Sun is made of — the recipe beat), told with R01/R02's
// machinery (auto-play, Pause, snapshot story timeline):
//   1. the Sun in space, with Earth drawn to scale
//   2. the RECIPE: 73 kg hydrogen + 25 kg helium + 2 kg everything else out
//      of every 100 kg — and the evidence, the Sun's dark-line barcode
//   3. dive into the core: the real pp-chain in three scripted beats
//      (positron + neutrino, γ, helium-4 born)
//   4. the ⚖️ scale: 4 hydrogens outweigh 1 helium — the missing 0.7%
//      flashes away as light
//   5. the photon's way out: a ~100,000-year random walk, then 8 minutes
//      of empty space to Earth
//   6. the energy valley: fusion rolls down the left slope, the bomb demo's
//      fission down the right, iron at the bottom.
// All motion lives in a ref-held sim ticked by one Konva.Animation; React
// hears about changes via onReport.

const W = FISSION_W
const H = FISSION_H
const BUTTON_ZONE = 86
const UH = H - BUTTON_ZONE

export type CosmosJourneyId = 'sun' | 'stardust' | 'gold'

export const COSMOS_JOURNEYS: Array<{
  id: CosmosJourneyId
  label: string
  subtitle: string
  ready: boolean
}> = [
  { id: 'sun', label: '☀️ Why the Sun shines', subtitle: 'and what it is made of', ready: true },
  { id: 'stardust', label: '🧒 You are star stuff', subtitle: 'a carbon atom\'s journey', ready: false },
  { id: 'gold', label: '💍 Where gold comes from', subtitle: 'colliding neutron stars', ready: false },
]

export type CosmosPhase = 'sun' | 'recipe' | 'closeup' | 'scale' | 'walk' | 'valley'

export interface CosmosReport {
  phase: CosmosPhase
  storyId: string
  closeupStep: number
}

// ---------- timings ----------
const SUN_T = 5
const RECIPE_T = 10
const SCALE_T = 8.5
const WALK_T = 9.5
const VALLEY_T = 14

interface Sim {
  journey: CosmosJourneyId
  phase: CosmosPhase
  phaseT: number
}

function buildSim(journey: CosmosJourneyId): Sim {
  return { journey, phase: 'sun', phaseT: 0 }
}

function step(sim: Sim, dt: number) {
  sim.phaseT += dt
  const advance = (next: CosmosPhase) => {
    sim.phase = next
    sim.phaseT = 0
  }
  if (sim.phase === 'sun' && sim.phaseT >= SUN_T) advance('recipe')
  else if (sim.phase === 'recipe' && sim.phaseT >= RECIPE_T) advance('closeup')
  else if (sim.phase === 'closeup' && sim.phaseT >= SUN_CLOSEUP_TOTAL) advance('scale')
  else if (sim.phase === 'scale' && sim.phaseT >= SCALE_T) advance('walk')
  else if (sim.phase === 'walk' && sim.phaseT >= WALK_T) advance('valley')
}

export function cosmosStoryOrder(journey: CosmosJourneyId): string[] {
  void journey // one journey so far
  const close = Array.from({ length: 4 }, (_, i) => `closeup${i}`)
  return ['sun', 'recipe', 'zoom', ...close, 'scale', 'walk', 'valley']
}

function storyId(sim: Sim): string {
  if (sim.phase === 'closeup')
    return sim.phaseT < SUN_SCENE_START ? 'zoom' : `closeup${sunCloseupStep(sim.phaseT)}`
  return sim.phase
}

// ---------- shared drawing ----------

const AMBER = 'rgba(251, 191, 36, 0.95)'
const frac = (v: number) => v - Math.floor(v)
const rnd = (i: number, salt: number) => frac(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453)

function drawSpace(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 90; i++) {
    const x = rnd(i, 1) * W
    const y = rnd(i, 2) * H
    ctx.fillStyle = `rgba(226, 232, 240, ${0.2 + 0.5 * rnd(i, 3)})`
    ctx.fillRect(x, y, rnd(i, 4) > 0.88 ? 2 : 1, rnd(i, 4) > 0.88 ? 2 : 1)
  }
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

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

function drawSunBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) {
  // corona
  const cg = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.6)
  cg.addColorStop(0, 'rgba(251, 146, 60, 0.35)')
  cg.addColorStop(1, 'rgba(251, 146, 60, 0)')
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2)
  ctx.fill()
  // the ball
  const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r)
  g.addColorStop(0, '#fff7d6')
  g.addColorStop(0.45, '#fbbf24')
  g.addColorStop(0.8, '#f97316')
  g.addColorStop(1, '#c2410c')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  // granules: the boiling surface, gently shimmering
  for (let i = 0; i < 60; i++) {
    const a = rnd(i, 5) * Math.PI * 2
    const rr = Math.sqrt(rnd(i, 6)) * r * 0.92
    const tw = 0.1 + 0.1 * Math.sin(t * 1.5 + i)
    ctx.fillStyle = `rgba(255, 237, 190, ${tw})`
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3 + rnd(i, 7) * 6, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------- phase 1: the Sun (with Earth to scale) ----------

const SUN_CX = W * 0.42
const SUN_CY = UH * 0.52
const SUN_R = 165

function drawSunScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  drawSunBall(ctx, SUN_CX, SUN_CY, SUN_R, t)
  label(ctx, 'the Sun — our star', SUN_CX, SUN_CY + SUN_R + 28)
  // Earth, honestly to scale: 109× smaller than the Sun
  const ex = W - 90
  const er = SUN_R / 109
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(ex, SUN_CY, Math.max(1.4, er), 0, Math.PI * 2)
  ctx.fill()
  label(ctx, 'Earth — same scale!', ex - 8, SUN_CY - 20)
}

// ---------- phase 2: the recipe (what the Sun is made of) ----------

const RECIPE_COLORS: Record<string, string> = {
  h: '#f87171', // hydrogen = the proton's red
  he: '#fbbf24', // helium = the Sun's gold
  other: '#64748b',
}

/** the Sun's dark-line barcode: the evidence for the recipe */
function drawSunBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0)
  for (let f = 0; f <= 1; f += 0.125) g.addColorStop(f, wavelengthToCss(390 + f * 340, 0.9))
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 5)
  ctx.fill()
  const lineX = (nm: number) => x + ((nm - 380) / (750 - 380)) * w
  // hydrogen's Balmer lines + helium's 587.6 — eaten by the Sun's outer gas
  const H_LINES = [656.3, 486.1, 434.0, 410.2]
  ctx.fillStyle = 'rgba(2, 6, 23, 0.92)'
  for (const nm of H_LINES) ctx.fillRect(lineX(nm) - 1.25, y, 2.5, h)
  ctx.fillRect(lineX(587.6) - 1.25, y, 2.5, h)
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 5)
  ctx.stroke()
  // name the fingerprints
  for (const nm of [656.3, 486.1]) label(ctx, 'hydrogen', lineX(nm), y + h + 12)
  label(ctx, 'helium', lineX(587.6), y + h + 12)
}

function drawRecipeScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  drawSunBall(ctx, W * 0.2, UH * 0.42, 110, t)
  const grow = easeOut(clamp01(t / 1.6))
  // the ingredient bar: out of every 100 kg of Sun…
  const bx = W * 0.4
  const bw = W * 0.52
  const by = UH * 0.3
  const bh = 56
  let acc = 0
  for (const ing of SUN_RECIPE) {
    const wSeg = (ing.massPct / 100) * bw * grow
    ctx.fillStyle = RECIPE_COLORS[ing.id]
    ctx.beginPath()
    ctx.roundRect(bx + acc, by, Math.max(2, wSeg - 2), bh, 4)
    ctx.fill()
    const midX = bx + acc + wSeg / 2
    if (grow > 0.9 && ing.id !== 'other') {
      ctx.fillStyle = '#0b1226'
      ctx.font = '700 15px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${ing.name} · ${ing.massPct} kg`, midX, by + bh / 2)
    }
    acc += wSeg
  }
  if (grow > 0.9) {
    // "everything else" doesn't fit inside its sliver
    label(ctx, 'everything else · 2 kg', bx + bw - 36, by - 12)
  }
  label(ctx, 'out of every 100 kg of Sun (weighed)', bx + bw / 2, by + bh + 16)
  // the evidence, fading in after the bar
  const ev = clamp01((t - 2.6) / 0.8)
  if (ev > 0) {
    ctx.save()
    ctx.globalAlpha = ev
    drawSunBarcode(ctx, bx, by + bh + 52, bw, 44)
    label(ctx, "the Sun's barcode — its missing colors", bx + bw / 2, by + bh + 52 + 44 + 28)
    ctx.restore()
  }
}

// ---------- phase 3: the core close-up (the pp-chain) ----------

const CU_CX = W * 0.46
const CU_CY = UH * 0.5
const PR = 11 // proton radius in the close view

function drawGamma(ctx: CanvasRenderingContext2D, x0: number, y0: number, angle: number, head: number, alpha: number, t: number) {
  if (alpha <= 0) return
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`
  ctx.lineWidth = 2.2
  ctx.beginPath()
  for (let i = 0; i <= 20; i++) {
    const along = Math.max(0, head - 60 + i * 3)
    const wave = 6 * Math.sin(i * 1.15 + t * 25)
    ctx[i === 0 ? 'moveTo' : 'lineTo'](x0 + along * c - wave * s, y0 + along * s + wave * c)
  }
  ctx.stroke()
  ctx.fillStyle = `rgba(196, 181, 253, ${alpha})`
  ctx.font = '16px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('γ', x0 + (head + 16) * c, y0 + (head + 16) * s)
}

/** a small nucleus cluster of p/n at a point */
function drawCluster(
  ctx: CanvasRenderingContext2D,
  kinds: Array<'protons' | 'neutrons'>,
  x: number,
  y: number,
  mix = 1,
) {
  const offs: Array<[number, number]> =
    kinds.length === 1
      ? [[0, 0]]
      : kinds.length === 2
        ? [
            [-PR * 0.95, 0],
            [PR * 0.95, 0],
          ]
        : kinds.length === 3
          ? [
              [0, -PR],
              [-PR * 0.95, PR * 0.7],
              [PR * 0.95, PR * 0.7],
            ]
          : [
              [-PR * 0.95, -PR * 0.95],
              [PR * 0.95, -PR * 0.95],
              [-PR * 0.95, PR * 0.95],
              [PR * 0.95, PR * 0.95],
            ]
  kinds.forEach((k, i) => {
    // mix < 1: the converting nucleon crossfades proton → neutron
    if (k === 'neutrons' && mix < 1 && i === kinds.length - 1) {
      drawGlossyParticle(ctx, 'protons', x + offs[i][0], y + offs[i][1], PR, 1 - mix)
      drawGlossyParticle(ctx, 'neutrons', x + offs[i][0], y + offs[i][1], PR, mix)
    } else {
      drawGlossyParticle(ctx, k, x + offs[i][0], y + offs[i][1], PR)
    }
  })
}

function drawCoreCloseup(ctx: CanvasRenderingContext2D, t: number, alpha: number) {
  if (alpha <= 0) return
  const s = t - SUN_SCENE_START
  ctx.save()
  ctx.globalAlpha = alpha
  // the hot core
  const g = ctx.createRadialGradient(W / 2, UH / 2, 0, W / 2, UH / 2, Math.max(W, UH) * 0.7)
  g.addColorStop(0, '#2b0f05')
  g.addColorStop(1, '#180702')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // the jostling crowd of bare protons
  for (let i = 0; i < 26; i++) {
    const bx = rnd(i, 11) * W
    const by = rnd(i, 12) * UH
    if (Math.hypot(bx - CU_CX, by - CU_CY) < 150) continue // keep the stage clear
    const jx = Math.sin(t * (2 + rnd(i, 13)) + i) * 7
    const jy = Math.cos(t * (2 + rnd(i, 14)) + i * 2) * 7
    drawGlossyParticle(ctx, 'protons', bx + jx, by + jy, PR * 0.85, 0.8)
  }

  // ---- the scripted actors ----
  // c0 (0–3): two protons close in; c1 (3–7.5): stick → deuterium + β⁺ + ν;
  // c2 (7.5–11.5): +p → ³He + γ; c3 (11.5–16.5): ³He+³He → ⁴He + 2p
  const approach = easeInOut(clamp01(s / 3.2))
  const d0 = 170 * (1 - approach)
  const jig = Math.sin(t * 20) * 2 * (s < 3.2 ? 1 : 0)

  if (s < 3.2) {
    drawGlossyParticle(ctx, 'protons', CU_CX - PR - d0 + jig, CU_CY, PR)
    drawGlossyParticle(ctx, 'protons', CU_CX + PR + d0 - jig, CU_CY, PR)
    if (s > 0.6) {
      tag(ctx, 'proton', CU_CX - PR - d0 - 10, CU_CY - 26, 'rgba(252, 165, 165, 0.95)')
      tag(ctx, 'proton', CU_CX + PR + d0 + 10, CU_CY + 26, 'rgba(252, 165, 165, 0.95)')
    }
  }
  // the flash of the lucky crash
  if (s >= 3.2 && s < 4) {
    const q = (s - 3.2) / 0.8
    const r = 20 + 120 * easeOut(q)
    const fg = ctx.createRadialGradient(CU_CX, CU_CY, 0, CU_CX, CU_CY, r)
    fg.addColorStop(0, `rgba(255, 250, 220, ${0.8 * (1 - q)})`)
    fg.addColorStop(1, 'rgba(253, 186, 116, 0)')
    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.arc(CU_CX, CU_CY, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // the growing nucleus at centre stage
  if (s >= 3.2 && s < 8.8) {
    const mix = clamp01((s - 3.4) / 1.2) // one proton becomes a neutron
    drawCluster(ctx, ['protons', 'neutrons'], CU_CX, CU_CY, mix)
    if (s > 4.6 && s < 7.4) tag(ctx, 'deuterium — heavy hydrogen', CU_CX, CU_CY + 40, AMBER)
  }
  // the positron and the ghost neutrino of step 1
  if (s >= 3.6 && s < 6.8) {
    const q = s - 3.6
    const px = CU_CX + q * 95
    const py = CU_CY - 30 - q * 70
    const a = q < 2.4 ? 1 : 1 - (q - 2.4) / 0.8
    ctx.save()
    ctx.globalAlpha *= Math.max(0, a)
    drawGlossyParticle(ctx, 'protons', px, py, 4.5) // red = the β⁺ convention
    tag(ctx, 'positron (β⁺)', px + 10, py - 18, 'rgba(252, 165, 165, 0.95)', 12)
    ctx.restore()
    // the neutrino: barely there, on purpose
    const nx = CU_CX + q * 150
    const ny = CU_CY + 24 + q * 52
    ctx.save()
    ctx.globalAlpha *= 0.25 * Math.max(0, a)
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.arc(nx, ny, 3, 0, Math.PI * 2)
    ctx.fill()
    tag(ctx, 'neutrino — almost nothing stops it', nx - 10, ny + 20, 'rgba(226, 232, 240, 0.8)', 11)
    ctx.restore()
  }
  // step 2: a third proton arrives, γ flies out
  if (s >= 7.5 && s < 8.8) {
    const q = easeInOut(clamp01((s - 7.5) / 1.1))
    drawGlossyParticle(ctx, 'protons', CU_CX - 200 * (1 - q) - PR * 1.6, CU_CY - 60 * (1 - q), PR)
  }
  if (s >= 8.6 && s < 11.5) {
    drawCluster(ctx, ['protons', 'neutrons', 'protons'], CU_CX, CU_CY)
    if (s > 9 && s < 11.2) tag(ctx, 'helium-3', CU_CX, CU_CY + 44, AMBER)
    drawGamma(ctx, CU_CX, CU_CY, -0.7, (s - 8.6) * 170, s < 10.6 ? 1 : 1 - (s - 10.6) / 0.9, t)
  }
  // step 3: a second helium-3 drifts in, helium-4 is born, 2 protons return
  if (s >= 10.6 && s < 12.4) {
    const q = easeInOut(clamp01((s - 10.6) / 1.7))
    drawCluster(
      ctx,
      ['protons', 'neutrons', 'protons'],
      CU_CX + 260 * (1 - q) + PR * 2.4,
      CU_CY + 90 * (1 - q),
    )
    if (s < 12) tag(ctx, 'another helium-3', CU_CX + 260 * (1 - q) + PR * 2.4, CU_CY + 90 * (1 - q) + 40, 'rgba(203, 213, 225, 0.95)', 12)
  }
  if (s >= 12.4) {
    if (s < 13) {
      const q = (s - 12.4) / 0.6
      const r = 20 + 140 * easeOut(q)
      const fg = ctx.createRadialGradient(CU_CX, CU_CY, 0, CU_CX, CU_CY, r)
      fg.addColorStop(0, `rgba(255, 250, 220, ${0.85 * (1 - q)})`)
      fg.addColorStop(1, 'rgba(253, 186, 116, 0)')
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.arc(CU_CX, CU_CY, r, 0, Math.PI * 2)
      ctx.fill()
    }
    drawCluster(ctx, ['protons', 'neutrons', 'neutrons', 'protons'], CU_CX, CU_CY)
    tag(ctx, 'helium-4 — made of four hydrogens', CU_CX, CU_CY + 48, AMBER)
    // the two returned protons rejoin the crowd
    const q = clamp01((s - 12.5) / 2)
    for (const dir of [1, -1]) {
      const px = CU_CX + dir * (30 + q * 180)
      const py = CU_CY - dir * (10 + q * 110)
      ctx.save()
      ctx.globalAlpha *= 1 - q * 0.4
      drawGlossyParticle(ctx, 'protons', px, py, PR * 0.9)
      ctx.restore()
    }
    if (s > 13 && s < 15.4) tag(ctx, '2 protons go back to try again', CU_CX + 150, CU_CY - 90, 'rgba(203, 213, 225, 0.95)', 12)
  }
  ctx.restore()
}

// ---------- phase 4: the scale (the missing 0.7%) ----------

function drawScaleScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  const cx = W * 0.47
  const cy = UH * 0.52
  const tilt = -0.1 * easeInOut(clamp01((t - 1.2) / 1.6)) // left side sinks: heavier
  // pillar + base
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, cy + 120)
  ctx.lineTo(cx, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - 60, cy + 120)
  ctx.lineTo(cx + 60, cy + 120)
  ctx.stroke()
  // the beam and pans
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(tilt)
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(-180, 0)
  ctx.lineTo(180, 0)
  ctx.stroke()
  for (const side of [-1, 1]) {
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(side * 180, 0)
    ctx.lineTo(side * 180 - 26, 54)
    ctx.moveTo(side * 180, 0)
    ctx.lineTo(side * 180 + 26, 54)
    ctx.stroke()
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(side * 180 - 34, 56)
    ctx.lineTo(side * 180 + 34, 56)
    ctx.stroke()
  }
  // left pan: 4 hydrogens
  for (const [i, ox] of [-21, -7, 7, 21].entries()) {
    drawGlossyParticle(ctx, 'protons', -180 + ox, 44 - (i % 2) * 14, 8)
  }
  // right pan: one helium-4
  for (const [ox, oy] of [
    [-7, 40],
    [7, 40],
    [-7, 52],
    [7, 52],
  ] as const) {
    drawGlossyParticle(ctx, (ox < 0) === (oy < 46) ? 'protons' : 'neutrons', 180 + ox, oy, 8)
  }
  ctx.restore()
  tag(ctx, '4 hydrogens — heavier', cx - 180, cy + 110, 'rgba(252, 165, 165, 0.95)')
  tag(ctx, '1 helium — lighter!', cx + 180, cy + 86, AMBER)
  // the missing mass leaves as light
  if (t > 3) {
    const q = (t - 3) % 2.2
    drawGamma(ctx, cx + 180, cy + tilt * 180 + 20, -0.9, q * 150, q < 1.6 ? 0.9 : 0.9 * (1 - (q - 1.6) / 0.6), t)
    tag(ctx, 'the missing bit became LIGHT', cx + 150, cy - 110, AMBER)
  }
}

// ---------- phase 5: the long way out ----------

const WALK_CX = W * 0.36
const WALK_CY = UH * 0.5
const WALK_R = 185
// a deterministic random walk from the centre to the rim
const WALK_PATH: Array<{ x: number; y: number }> = (() => {
  const pts = [{ x: 0, y: 0 }]
  let x = 0
  let y = 0
  let a = 0
  for (let i = 0; i < 64; i++) {
    a += (rnd(i, 21) - 0.5) * 2.6
    const stepLen = 6 + (i / 64) * 22
    x += Math.cos(a) * stepLen
    y += Math.sin(a) * stepLen
    const rr = Math.hypot(x, y)
    if (rr > WALK_R - 10) {
      x *= (WALK_R - 10) / rr
      y *= (WALK_R - 10) / rr
    }
    pts.push({ x, y })
  }
  // force the exit on the right side
  pts.push({ x: WALK_R, y: pts[pts.length - 1].y * 0.2 })
  return pts
})()

function drawWalkScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  drawSunBall(ctx, WALK_CX, WALK_CY, WALK_R, t)
  // dim veil so the path reads
  ctx.fillStyle = 'rgba(2, 6, 23, 0.35)'
  ctx.beginPath()
  ctx.arc(WALK_CX, WALK_CY, WALK_R, 0, Math.PI * 2)
  ctx.fill()
  const inside = clamp01(t / 6)
  const n = Math.floor(inside * (WALK_PATH.length - 1))
  ctx.strokeStyle = 'rgba(255, 237, 190, 0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const p = WALK_PATH[i]
    ctx[i === 0 ? 'moveTo' : 'lineTo'](WALK_CX + p.x, WALK_CY + p.y)
  }
  ctx.stroke()
  const head = WALK_PATH[Math.max(0, n)]
  let hx = WALK_CX + head.x
  let hy = WALK_CY + head.y
  // out of the Sun: 8 straight minutes to Earth
  const ex = W - 70
  const ey = WALK_CY + WALK_PATH[WALK_PATH.length - 1].y * 0.2
  if (t > 6) {
    const q = easeInOut(clamp01((t - 6) / 1.6))
    const sx = WALK_CX + WALK_PATH[WALK_PATH.length - 1].x
    hx = sx + (ex - sx) * q
    hy = ey
    ctx.strokeStyle = 'rgba(255, 237, 190, 0.7)'
    ctx.beginPath()
    ctx.moveTo(sx, ey)
    ctx.lineTo(hx, hy)
    ctx.stroke()
  }
  // the photon's head
  const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9)
  g.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  g.addColorStop(1, 'rgba(255, 237, 190, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(hx, hy, 9, 0, Math.PI * 2)
  ctx.fill()
  // Earth
  ctx.fillStyle = '#38bdf8'
  ctx.beginPath()
  ctx.arc(ex, ey, 5, 0, Math.PI * 2)
  ctx.fill()
  label(ctx, 'Earth (drawn big)', ex - 4, ey + 22)
  label(ctx, 'about 100,000 years to get OUT…', WALK_CX, WALK_CY + WALK_R + 26)
  if (t > 6.2) label(ctx, '…then 8 minutes to Earth', (WALK_CX + WALK_R + ex) / 2, ey - 20)
}

// ---------- phase 6: the energy valley ----------

function drawValleyScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  const x0 = 80
  const x1 = W - 70
  const yTop = 90
  const yBottom = UH - 70
  const maxBind = 8.79
  const X = (a: number) => x0 + (Math.log10(a) / Math.log10(238)) * (x1 - x0)
  const Y = (bind: number) => yTop + (bind / maxBind) * (yBottom - yTop)
  // the hill
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ENERGY_VALLEY.forEach((a, i) => {
    ctx[i === 0 ? 'moveTo' : 'lineTo'](X(a.massNumber), Y(a.bindMeV))
  })
  ctx.stroke()
  // anchors
  for (const a of ENERGY_VALLEY) {
    ctx.fillStyle = a.symbol === 'Fe' ? AMBER : '#cbd5e1'
    ctx.beginPath()
    ctx.arc(X(a.massNumber), Y(a.bindMeV), 4, 0, Math.PI * 2)
    ctx.fill()
    label(ctx, a.symbol, X(a.massNumber), Y(a.bindMeV) - 16)
  }
  label(ctx, 'small nuclei', x0 + 30, yTop - 26)
  label(ctx, 'huge nuclei', x1 - 30, yTop - 26)
  tag(ctx, 'iron — the bottom of the valley', X(56), Y(8.79) + 26, AMBER)
  // the fusion ball rolls H → He (the Sun)
  const roll1 = easeInOut(clamp01((t - 0.8) / 2.4))
  if (roll1 > 0 && roll1 <= 1) {
    const bx = X(1) + (X(4) - X(1)) * roll1
    const by = Y(0) + (Y(7.07) - Y(0)) * roll1
    drawGlossyParticle(ctx, 'protons', bx, by - 10, 9)
    if (t > 1.2) tag(ctx, 'JOINING rolls down — the Sun', (X(1) + X(4)) / 2 + 60, (Y(0) + Y(7.07)) / 2 - 20, AMBER, 12)
  }
  // the fission ball rolls U → the middle (the bomb demo)
  const roll2 = easeInOut(clamp01((t - 4) / 2.4))
  if (roll2 > 0) {
    const bx = X(238) + (X(110) - X(238)) * roll2
    const by = Y(7.57) + (Y(8.5) - Y(7.57)) * roll2
    drawGlossyParticle(ctx, 'neutrons', bx, by - 10, 9)
    if (t > 4.4) tag(ctx, 'SPLITTING rolls down — the bomb demo', (X(238) + X(110)) / 2, Y(8) - 34, 'rgba(203, 213, 225, 0.95)', 12)
  }
  if (t > 7.5) {
    tag(ctx, 'one hill, two slopes — rolling DOWN releases energy', W / 2, yBottom + 40, AMBER)
  }
}

// ---------- the chooser lineup ----------

export interface CosmosChooserRow {
  id: CosmosJourneyId
  ready: boolean
  left: number
  top: number
  right: number
  bottom: number
}

const ROW_M = 18
const ROW_GAP = 14

export function cosmosChooserRows(): CosmosChooserRow[] {
  const rowH = (UH - 2 * ROW_M - 2 * ROW_GAP) / 3
  return COSMOS_JOURNEYS.map((j, i) => ({
    id: j.id,
    ready: j.ready,
    left: ROW_M,
    top: ROW_M + i * (rowH + ROW_GAP),
    right: W - ROW_M,
    bottom: ROW_M + i * (rowH + ROW_GAP) + rowH,
  }))
}

function drawLineup(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const rows = cosmosChooserRows()
  for (const [i, row] of rows.entries()) {
    const j = COSMOS_JOURNEYS[i]
    const rw = row.right - row.left
    const rh = row.bottom - row.top
    ctx.save()
    if (!j.ready) ctx.globalAlpha = 0.45
    ctx.fillStyle = '#0b1226'
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.9)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(row.left, row.top, rw, rh, 14)
    ctx.fill()
    ctx.stroke()
    // mini scene in the right half
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(row.left, row.top, rw, rh, 14)
    ctx.clip()
    const cx = row.left + rw * 0.72
    const cy = row.top + rh / 2
    for (let k = 0; k < 12; k++) {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.2 + 0.4 * rnd(k + i * 20, 7)})`
      ctx.fillRect(row.left + rw * 0.45 + rnd(k + i * 20, 5) * rw * 0.5, row.top + rnd(k + i * 20, 6) * rh, 1, 1)
    }
    if (j.id === 'sun') {
      drawSunBall(ctx, cx, cy, rh * 0.34, t)
    } else if (j.id === 'stardust') {
      // a glowing nebula wisp with one marked atom
      const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, rh * 0.42)
      ng.addColorStop(0, 'rgba(129, 140, 248, 0.35)')
      ng.addColorStop(1, 'rgba(129, 140, 248, 0)')
      ctx.fillStyle = ng
      ctx.beginPath()
      ctx.arc(cx, cy, rh * 0.42, 0, Math.PI * 2)
      ctx.fill()
      drawGlossyParticle(ctx, 'protons', cx + 8, cy - 4, 5)
      ctx.strokeStyle = AMBER
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx + 8, cy - 4, 10, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      // two tiny ultra-dense stars spiralling, a ring below
      for (const d of [-1, 1]) {
        ctx.fillStyle = '#e2e8f0'
        ctx.beginPath()
        ctx.arc(cx + d * 16, cy - 8 - d * 5, 5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy - 8, 24, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(cx, cy + 22, 9, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
    ctx.fillStyle = '#e2e8f0'
    ctx.font = '600 17px ui-sans-serif, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(j.label, row.left + 18, row.top + rh / 2 - 2)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(j.subtitle, row.left + 18, row.top + rh / 2 + 18)
    ctx.restore()
  }
}

// ---------- component ----------

const END_T = VALLEY_T

export const CosmosStage = memo(function CosmosStage({
  journey,
  paused,
  seek,
  active,
  onReport,
  onFinished,
}: {
  /** the journey being shown; null = the lineup chooser */
  journey: CosmosJourneyId | null
  paused: boolean
  seek: { id: string; n: number } | null
  active: boolean
  onReport: (r: CosmosReport) => void
  onFinished: () => void
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const journeyRef = useRef(journey)
  journeyRef.current = journey
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished
  const finishedSent = useRef(false)
  const [firstSim] = useState(() => buildSim('sun'))
  const sim = useRef<Sim>(firstSim)
  const lastSig = useRef('')
  const onReportRef = useRef(onReport)
  onReportRef.current = onReport
  const snaps = useRef(new Map<string, Sim>())
  const lastStory = useRef('')
  const tRef = useRef(0)

  const record = () => {
    const id = storyId(sim.current)
    if (id !== lastStory.current) {
      lastStory.current = id
      if (!snaps.current.has(id)) snaps.current.set(id, structuredClone(sim.current))
    }
  }

  const report = () => {
    const s = sim.current
    const r: CosmosReport = {
      phase: s.phase,
      storyId: storyId(s),
      closeupStep: s.phase === 'closeup' ? sunCloseupStep(s.phaseT) : 0,
    }
    const sig = `${r.phase}|${r.storyId}|${r.closeupStep}`
    if (sig !== lastSig.current) {
      lastSig.current = sig
      onReportRef.current(r)
    }
  }

  // a journey picked → fresh run
  useEffect(() => {
    finishedSent.current = false
    snaps.current.clear()
    lastStory.current = ''
    lastSig.current = ''
    if (journey) {
      sim.current = buildSim(journey)
      record()
      report()
    }
    shapeRef.current?.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey])

  // timeline click: rewind to a recorded step, or fast-forward to it
  useEffect(() => {
    if (!seek || !journey) return
    const order = cosmosStoryOrder(journey)
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
        restore(before[0] ?? 'sun')
      }
      for (let i = 0; i < 60 * 120 && idx(storyId(sim.current)) < ti; i++) {
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
      tRef.current += dt
      if (!journeyRef.current) return
      step(sim.current, dt)
      record()
      report()
      const s = sim.current
      if (!finishedSent.current && s.phase === 'valley' && s.phaseT >= END_T) {
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
            const now = tRef.current
            if (!journeyRef.current) drawLineup(ctx, now)
            else if (s.phase === 'sun') drawSunScene(ctx, now)
            else if (s.phase === 'recipe') drawRecipeScene(ctx, s.phaseT)
            else if (s.phase === 'closeup') {
              const cam = sunCloseupCamera(s.phaseT)
              if (cam.sceneAlpha < 1) {
                // dive from the whole Sun into its core
                const fx = W * 0.2 // the recipe scene's sun centre
                const fy = UH * 0.42
                const u = (cam.zoom - 1) / (SUN_CLOSEUP_MAX_ZOOM - 1)
                ctx.save()
                ctx.translate(fx + (W / 2 - fx) * u, fy + (UH / 2 - fy) * u)
                ctx.scale(cam.zoom, cam.zoom)
                ctx.translate(-fx, -fy)
                drawRecipeScene(ctx, RECIPE_T)
                ctx.restore()
                if (cam.marker > 0) {
                  ctx.save()
                  ctx.globalAlpha = cam.marker
                  ctx.strokeStyle = AMBER
                  ctx.lineWidth = 3
                  ctx.beginPath()
                  ctx.arc(fx, fy, 30, 0, Math.PI * 2)
                  ctx.stroke()
                  ctx.restore()
                }
              }
              drawCoreCloseup(ctx, s.phaseT, cam.sceneAlpha)
            } else if (s.phase === 'scale') drawScaleScene(ctx, s.phaseT)
            else if (s.phase === 'walk') drawWalkScene(ctx, s.phaseT)
            else drawValleyScene(ctx, s.phaseT)
            ctx.restore()
          }}
        />
      </Layer>
    </Stage>
  )
})
