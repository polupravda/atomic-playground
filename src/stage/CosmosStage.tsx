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
import { FORGE_TOTAL, forgeStep } from './stardustStory'
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

export type CosmosJourneyId = 'detective' | 'sun' | 'stardust' | 'gold'

export const COSMOS_JOURNEYS: Array<{
  id: CosmosJourneyId
  label: string
  subtitle: string
  ready: boolean
}> = [
  // first: reading a star's barcode — the Sun story builds on it (moved
  // here from the ✨ Light & color chooser 2026-11-18; not built yet)
  { id: 'detective', label: '🔭 Star detective', subtitle: 'reading starlight barcodes', ready: false },
  { id: 'sun', label: '☀️ Why the Sun shines', subtitle: 'and what it is made of', ready: true },
  { id: 'stardust', label: '🧒 You are star stuff', subtitle: 'a carbon atom\'s journey', ready: true },
  { id: 'gold', label: '💍 Where gold comes from', subtitle: 'colliding neutron stars', ready: false },
]

export type CosmosPhase =
  // ☀️ why the Sun shines
  | 'sun'
  | 'recipe'
  | 'closeup'
  | 'scale'
  | 'walk'
  | 'valley'
  // 🧒 you are star stuff
  | 'giant'
  | 'forge'
  | 'boom'
  | 'drift'
  | 'earth'
  | 'alive'
  | 'you'

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
// 🧒 you are star stuff
const GIANT_T = 5
const BOOM_T = 8
const DRIFT_T = 6.5
const EARTH_T = 9
const ALIVE_T = 13.5
const YOU_T = 8

interface Sim {
  journey: CosmosJourneyId
  phase: CosmosPhase
  phaseT: number
}

function buildSim(journey: CosmosJourneyId): Sim {
  return { journey, phase: journey === 'stardust' ? 'giant' : 'sun', phaseT: 0 }
}

function step(sim: Sim, dt: number) {
  sim.phaseT += dt
  const advance = (next: CosmosPhase) => {
    sim.phase = next
    sim.phaseT = 0
  }
  if (sim.journey === 'stardust') {
    if (sim.phase === 'giant' && sim.phaseT >= GIANT_T) advance('forge')
    else if (sim.phase === 'forge' && sim.phaseT >= FORGE_TOTAL) advance('boom')
    else if (sim.phase === 'boom' && sim.phaseT >= BOOM_T) advance('drift')
    else if (sim.phase === 'drift' && sim.phaseT >= DRIFT_T) advance('earth')
    else if (sim.phase === 'earth' && sim.phaseT >= EARTH_T) advance('alive')
    else if (sim.phase === 'alive' && sim.phaseT >= ALIVE_T) advance('you')
    return
  }
  if (sim.phase === 'sun' && sim.phaseT >= SUN_T) advance('recipe')
  else if (sim.phase === 'recipe' && sim.phaseT >= RECIPE_T) advance('closeup')
  else if (sim.phase === 'closeup' && sim.phaseT >= SUN_CLOSEUP_TOTAL) advance('scale')
  else if (sim.phase === 'scale' && sim.phaseT >= SCALE_T) advance('walk')
  else if (sim.phase === 'walk' && sim.phaseT >= WALK_T) advance('valley')
}

export function cosmosStoryOrder(journey: CosmosJourneyId): string[] {
  if (journey === 'stardust') {
    return ['giant', 'zoom', 'forge0', 'forge1', 'boom', 'drift', 'earth', 'alive', 'you']
  }
  const close = Array.from({ length: 4 }, (_, i) => `closeup${i}`)
  return ['sun', 'recipe', 'zoom', ...close, 'scale', 'walk', 'valley']
}

function storyId(sim: Sim): string {
  if (sim.phase === 'closeup')
    return sim.phaseT < SUN_SCENE_START ? 'zoom' : `closeup${sunCloseupStep(sim.phaseT)}`
  if (sim.phase === 'forge')
    return sim.phaseT < SUN_SCENE_START ? 'zoom' : `forge${forgeStep(sim.phaseT)}`
  return sim.phase
}

// ---------- shared drawing ----------

const AMBER = 'rgba(251, 191, 36, 0.95)'

// IDLE time (s): drives motion that carries no story — the Sun's shimmer,
// jostling crowds, wobbles, γ waves, the marker's pulse. Set once per frame
// from the stage's unscaled clock, so it keeps running while the narrator
// holds the STORY still (science pacing); only ⏸ Pause stops it. Story
// time (each scene's `t`) drives everything scripted.
let IDLE = 0
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

function drawSunBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
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
    const tw = 0.1 + 0.1 * Math.sin(IDLE * 1.5 + i)
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

function drawSunScene(ctx: CanvasRenderingContext2D) {
  drawSpace(ctx)
  drawSunBall(ctx, SUN_CX, SUN_CY, SUN_R)
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
  drawSunBall(ctx, W * 0.2, UH * 0.42, 110)
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

function drawGamma(ctx: CanvasRenderingContext2D, x0: number, y0: number, angle: number, head: number, alpha: number) {
  if (alpha <= 0) return
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`
  ctx.lineWidth = 2.2
  ctx.beginPath()
  for (let i = 0; i <= 20; i++) {
    const along = Math.max(0, head - 60 + i * 3)
    const wave = 6 * Math.sin(i * 1.15 + IDLE * 25)
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
    const jx = Math.sin(IDLE * (2 + rnd(i, 13)) + i) * 7
    const jy = Math.cos(IDLE * (2 + rnd(i, 14)) + i * 2) * 7
    drawGlossyParticle(ctx, 'protons', bx + jx, by + jy, PR * 0.85, 0.8)
  }

  // ---- the scripted actors ----
  // c0 (0–3): two protons close in; c1 (3–7.5): stick → deuterium + β⁺ + ν;
  // c2 (7.5–11.5): +p → ³He + γ; c3 (11.5–16.5): ³He+³He → ⁴He + 2p
  const approach = easeInOut(clamp01(s / 3.2))
  const d0 = 170 * (1 - approach)
  const jig = Math.sin(IDLE * 20) * 2 * (s < 3.2 ? 1 : 0)

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
    drawGamma(ctx, CU_CX, CU_CY, -0.7, (s - 8.6) * 170, s < 10.6 ? 1 : 1 - (s - 10.6) / 0.9)
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
    drawGamma(ctx, cx + 180, cy + tilt * 180 + 20, -0.9, q * 150, q < 1.6 ? 0.9 : 0.9 * (1 - (q - 1.6) / 0.6))
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
  drawSunBall(ctx, WALK_CX, WALK_CY, WALK_R)
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

// ---------- 🧒 you are star stuff ----------

const GIANT_CX = W * 0.46
const GIANT_CY = UH * 0.5
const GIANT_R = 195

/** the amber ring that follows OUR atom through the whole journey */
function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save()
  ctx.globalAlpha *= 0.75 + 0.25 * Math.sin(IDLE * 5)
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/** a nucleus as a phyllotaxis cluster of n nucleons, `protons` of them red */
function drawNucleus(
  ctx: CanvasRenderingContext2D,
  n: number,
  protons: number,
  x: number,
  y: number,
  pr: number,
) {
  const golden = Math.PI * (3 - Math.sqrt(5))
  let placed = 0
  for (let j = n - 1; j >= 0; j--) {
    const r = pr * 1.08 * Math.sqrt(j)
    const a = j * golden
    const isP = Math.floor(((j + 1) * protons) / n) > placed
    if (isP) placed++
    drawGlossyParticle(ctx, isP ? 'protons' : 'neutrons', x + r * Math.cos(a), y + r * Math.sin(a), pr)
  }
}

function drawRedGiant(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const cg = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r * 1.5)
  cg.addColorStop(0, 'rgba(239, 68, 68, 0.3)')
  cg.addColorStop(1, 'rgba(239, 68, 68, 0)')
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r)
  g.addColorStop(0, '#fde2c8')
  g.addColorStop(0.4, '#fb923c')
  g.addColorStop(0.8, '#dc2626')
  g.addColorStop(1, '#7f1d1d')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 50; i++) {
    const a = rnd(i, 31) * Math.PI * 2
    const rr = Math.sqrt(rnd(i, 32)) * r * 0.92
    ctx.fillStyle = `rgba(254, 215, 170, ${0.08 + 0.08 * Math.sin(IDLE * 1.2 + i)})`
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 4 + rnd(i, 33) * 7, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawGiantScene(ctx: CanvasRenderingContext2D) {
  drawSpace(ctx)
  drawRedGiant(ctx, GIANT_CX, GIANT_CY, GIANT_R)
  label(ctx, 'an old giant star — long before the Sun was born', GIANT_CX, GIANT_CY + GIANT_R + 28)
}

// ---- the forge close-up: triple-alpha (f0 two stick, f1 carbon) ----

const FORGE_CX = W * 0.46
const FORGE_CY = UH * 0.5
const FPR = 9 // nucleon radius in the forge view

function drawHe4(ctx: CanvasRenderingContext2D, x: number, y: number) {
  for (const [ox, oy, k] of [
    [-FPR * 0.95, -FPR * 0.95, 'protons'],
    [FPR * 0.95, -FPR * 0.95, 'neutrons'],
    [-FPR * 0.95, FPR * 0.95, 'neutrons'],
    [FPR * 0.95, FPR * 0.95, 'protons'],
  ] as const) {
    drawGlossyParticle(ctx, k, x + ox, y + oy, FPR)
  }
}

function drawForgeCloseup(ctx: CanvasRenderingContext2D, t: number, alpha: number) {
  if (alpha <= 0) return
  const s = t - SUN_SCENE_START
  ctx.save()
  ctx.globalAlpha = alpha
  // a core even hotter than the Sun's
  const g = ctx.createRadialGradient(W / 2, UH / 2, 0, W / 2, UH / 2, Math.max(W, UH) * 0.7)
  g.addColorStop(0, '#3a1205')
  g.addColorStop(1, '#1c0602')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // the crowd: helium nuclei (the ash of a lifetime of hydrogen burning)
  for (let i = 0; i < 14; i++) {
    const bx = rnd(i, 41) * W
    const by = rnd(i, 42) * UH
    if (Math.hypot(bx - FORGE_CX, by - FORGE_CY) < 170) continue
    const jx = Math.sin(IDLE * (2 + rnd(i, 43)) + i) * 8
    const jy = Math.cos(IDLE * (2 + rnd(i, 44)) + i * 2) * 8
    drawHe4(ctx, bx + jx, by + jy)
  }

  // f0: two heliums close in (0–2.6), stick into wobbly ⁸Be (2.6–5.5)
  const approach = easeInOut(clamp01(s / 2.6))
  if (s < 2.6) {
    const d = 160 * (1 - approach)
    drawHe4(ctx, FORGE_CX - FPR * 2 - d, FORGE_CY)
    drawHe4(ctx, FORGE_CX + FPR * 2 + d, FORGE_CY)
    if (s > 0.5) tag(ctx, 'helium', FORGE_CX - FPR * 2 - d, FORGE_CY - 34, 'rgba(203, 213, 225, 0.95)')
  }
  if (s >= 2.6 && s < 5.5) {
    // the wobbly pair: 8 nucleons trembling hard — it wants to fall apart
    const wob = Math.sin(IDLE * 26) * 3
    drawNucleus(ctx, 8, 4, FORGE_CX + wob, FORGE_CY, FPR)
    tag(ctx, 'beryllium-8 — wobbly, about to fall apart!', FORGE_CX, FORGE_CY + 44, 'rgba(252, 165, 165, 0.95)')
  }
  // f1: the third helium races in (5.5–6.6), carbon is born (6.6+)
  if (s >= 5.5 && s < 6.6) {
    const q = easeInOut((s - 5.5) / 1.1)
    drawHe4(ctx, FORGE_CX - 240 * (1 - q) - FPR, FORGE_CY - 90 * (1 - q))
    const wob = Math.sin(IDLE * 26) * 3
    drawNucleus(ctx, 8, 4, FORGE_CX + wob, FORGE_CY, FPR)
  }
  if (s >= 6.6) {
    if (s < 7.3) {
      const q = (s - 6.6) / 0.7
      const r = 20 + 150 * easeOut(q)
      const fg = ctx.createRadialGradient(FORGE_CX, FORGE_CY, 0, FORGE_CX, FORGE_CY, r)
      fg.addColorStop(0, `rgba(255, 250, 220, ${0.85 * (1 - q)})`)
      fg.addColorStop(1, 'rgba(253, 186, 116, 0)')
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.arc(FORGE_CX, FORGE_CY, r, 0, Math.PI * 2)
      ctx.fill()
    }
    drawNucleus(ctx, 12, 6, FORGE_CX, FORGE_CY, FPR)
    drawMarker(ctx, FORGE_CX, FORGE_CY, FPR * 4.4)
    drawGamma(ctx, FORGE_CX, FORGE_CY, -0.8, (s - 6.6) * 170, s < 9 ? 1 : Math.max(0, 1 - (s - 9) / 0.9))
    tag(ctx, 'carbon — 6 protons: that IS carbon', FORGE_CX, FORGE_CY + 54, AMBER)
    if (s > 8.4) tag(ctx, 'our atom — follow the amber ring', FORGE_CX, FORGE_CY - 58, AMBER, 12)
  }
  ctx.restore()
}

// ---- the supernova, the drift, the new world ----

function drawBoomScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  // collapse (0–1), flash (1–1.8), expanding debris shell (1–8)
  if (t < 1) {
    drawRedGiant(ctx, GIANT_CX, GIANT_CY, GIANT_R * (1 - 0.8 * easeInOut(t)))
  } else {
    const q = t - 1
    if (q < 0.9) {
      const r = 40 + 420 * easeOut(q / 0.9)
      const fg = ctx.createRadialGradient(GIANT_CX, GIANT_CY, 0, GIANT_CX, GIANT_CY, r)
      fg.addColorStop(0, `rgba(255, 255, 255, ${0.95 * (1 - q / 0.9)})`)
      fg.addColorStop(1, 'rgba(255, 237, 190, 0)')
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.arc(GIANT_CX, GIANT_CY, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // the debris shell, our atom riding it
    const shellR = 30 + q * 68
    ctx.strokeStyle = `rgba(251, 146, 60, ${Math.max(0.1, 0.6 - q * 0.06)})`
    ctx.lineWidth = 14
    ctx.beginPath()
    ctx.arc(GIANT_CX, GIANT_CY, shellR, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 46; i++) {
      const a = rnd(i, 51) * Math.PI * 2
      const rr = shellR * (0.85 + rnd(i, 52) * 0.35)
      ctx.fillStyle = `rgba(254, 215, 170, ${Math.max(0.15, 0.8 - q * 0.08)})`
      ctx.beginPath()
      ctx.arc(GIANT_CX + Math.cos(a) * rr, GIANT_CY + Math.sin(a) * rr, 1.6 + rnd(i, 53) * 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    // a tiny leftover core
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.arc(GIANT_CX, GIANT_CY, 4, 0, Math.PI * 2)
    ctx.fill()
    const ax = GIANT_CX + shellR * Math.cos(-0.5)
    const ay = GIANT_CY + shellR * Math.sin(-0.5)
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(ax, ay, 3, 0, Math.PI * 2)
    ctx.fill()
    drawMarker(ctx, ax, ay, 10)
    if (q > 1.2) label(ctx, 'supernova — the star sows its atoms', GIANT_CX, UH - 36)
  }
}

function drawNebulaWisps(ctx: CanvasRenderingContext2D, cx: number, cy: number, spread: number, alpha: number) {
  for (const [ox, oy, r, c] of [
    [-90, -40, 170, '129, 140, 248'],
    [80, 30, 150, '236, 132, 170'],
    [-10, 90, 130, '94, 184, 166'],
  ] as const) {
    const g = ctx.createRadialGradient(cx + ox * spread, cy + oy * spread, 0, cx + ox * spread, cy + oy * spread, r * spread)
    g.addColorStop(0, `rgba(${c}, ${0.26 * alpha})`)
    g.addColorStop(1, `rgba(${c}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx + ox * spread, cy + oy * spread, r * spread, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawDriftScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  drawNebulaWisps(ctx, W * 0.46, UH * 0.48, 1.15, 1)
  const ax = W * 0.42 + Math.sin(t * 0.5) * 24 + t * 6
  const ay = UH * 0.46 + Math.cos(t * 0.4) * 16
  ctx.fillStyle = '#94a3b8'
  ctx.beginPath()
  ctx.arc(ax, ay, 3, 0, Math.PI * 2)
  ctx.fill()
  drawMarker(ctx, ax, ay, 10)
  label(ctx, 'a nebula — a cloud of star dust', W * 0.46, UH - 36)
}

function drawEarthFormScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  const contract = easeInOut(clamp01(t / 3.4))
  drawNebulaWisps(ctx, W * 0.34, UH * 0.48, 1.1 - 0.75 * contract, 1 - 0.55 * contract)
  // the cloud's middle lights up: a NEW star — the young Sun
  const sunR = 10 + 48 * contract
  drawSunBall(ctx, W * 0.3, UH * 0.48, sunR)
  if (t > 2.4) label(ctx, 'the young Sun', W * 0.3, UH * 0.48 + sunR + 20)
  // leftover dust gathers into planets
  const pIn = clamp01((t - 3) / 1.6)
  const planets: Array<[number, number, string]> = [
    [W * 0.46, 4, '#b4a089'],
    [W * 0.55, 5, '#d9b26a'],
    [W * 0.66, 7, '#38bdf8'],
  ]
  for (const [px, pr, c] of planets) {
    ctx.save()
    ctx.globalAlpha = pIn
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(px, UH * 0.48, pr, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  if (pIn > 0.8) label(ctx, 'Earth — the third lump', W * 0.66, UH * 0.48 + 26)
  // our atom spirals onto the third planet
  const q = easeInOut(clamp01((t - 4.6) / 3.4))
  const sx = W * 0.5
  const sy = UH * 0.2
  const ax = sx + (W * 0.66 - sx) * q + Math.sin(q * Math.PI * 3) * 36 * (1 - q)
  const ay = sy + (UH * 0.48 - sy) * q
  if (q < 1) {
    ctx.fillStyle = '#94a3b8'
    ctx.beginPath()
    ctx.arc(ax, ay, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  drawMarker(ctx, q < 1 ? ax : W * 0.66, q < 1 ? ay : UH * 0.48, q < 1 ? 10 : 14)
}

// ---- alive: volcano → CO₂ → leaf → the kid ----

const GROUND_Y = UH - 70
const VOLC_X = W * 0.2
const TREE_X = W * 0.62
const KID_X = W * 0.8

function drawKid(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // a friendly cartoon kid, ~90 px tall, standing on y
  ctx.lineCap = 'round'
  // legs
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(x - 7, y - 34)
  ctx.lineTo(x - 8, y)
  ctx.moveTo(x + 7, y - 34)
  ctx.lineTo(x + 8, y)
  ctx.stroke()
  // body
  ctx.fillStyle = '#0ea5e9'
  ctx.beginPath()
  ctx.roundRect(x - 14, y - 62, 28, 32, 8)
  ctx.fill()
  // arm reaching toward the tree
  ctx.strokeStyle = '#0ea5e9'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(x - 12, y - 56)
  ctx.lineTo(x - 30, y - 66)
  ctx.stroke()
  // hand
  ctx.fillStyle = '#f1c9a5'
  ctx.beginPath()
  ctx.arc(x - 33, y - 68, 5, 0, Math.PI * 2)
  ctx.fill()
  // head + hair + face
  ctx.fillStyle = '#f1c9a5'
  ctx.beginPath()
  ctx.arc(x, y - 78, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#7c5333'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(x, y - 80, 14, Math.PI * 1.05, Math.PI * 1.95)
  ctx.stroke()
  ctx.fillStyle = '#1e293b'
  ctx.beginPath()
  ctx.arc(x - 5, y - 80, 1.6, 0, Math.PI * 2)
  ctx.arc(x + 5, y - 80, 1.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(x, y - 76, 6, 0.25 * Math.PI, 0.75 * Math.PI)
  ctx.stroke()
}

/** a tiny CO₂ molecule in the bonding lab's spirit: O=C=O, our C marked */
function drawCO2(ctx: CanvasRenderingContext2D, x: number, y: number) {
  drawGlossyParticle(ctx, 'neutrons', x, y, 6) // carbon drawn dark-grey
  for (const dx of [-13, 13]) drawGlossyParticle(ctx, 'protons', x + dx, y, 7) // oxygens in red
  drawMarker(ctx, x, y, 11)
}

function drawAliveScene(ctx: CanvasRenderingContext2D, t: number) {
  // sky
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#0b1a36')
  g.addColorStop(1, '#13294d')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // ground
  ctx.fillStyle = '#123524'
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)
  // the volcano
  ctx.fillStyle = '#44403c'
  ctx.beginPath()
  ctx.moveTo(VOLC_X - 110, GROUND_Y)
  ctx.lineTo(VOLC_X - 18, GROUND_Y - 150)
  ctx.lineTo(VOLC_X + 18, GROUND_Y - 150)
  ctx.lineTo(VOLC_X + 110, GROUND_Y)
  ctx.closePath()
  ctx.fill()
  const crater = ctx.createRadialGradient(VOLC_X, GROUND_Y - 150, 0, VOLC_X, GROUND_Y - 150, 26)
  crater.addColorStop(0, 'rgba(251, 146, 60, 0.9)')
  crater.addColorStop(1, 'rgba(251, 146, 60, 0)')
  ctx.fillStyle = crater
  ctx.beginPath()
  ctx.arc(VOLC_X, GROUND_Y - 150, 26, 0, Math.PI * 2)
  ctx.fill()
  label(ctx, 'volcano', VOLC_X, GROUND_Y + 18)
  // the tree
  ctx.fillStyle = '#7c5333'
  ctx.fillRect(TREE_X - 8, GROUND_Y - 92, 16, 92)
  ctx.fillStyle = '#16a34a'
  ctx.beginPath()
  ctx.arc(TREE_X, GROUND_Y - 124, 52, 0, Math.PI * 2)
  ctx.fill()
  // leaf-sink pulse while the CO₂ is being taken in
  if (t >= 4.4 && t < 6.4) {
    ctx.save()
    ctx.globalAlpha = 0.35 * (0.5 + 0.5 * Math.sin(IDLE * 8))
    ctx.fillStyle = '#4ade80'
    ctx.beginPath()
    ctx.arc(TREE_X, GROUND_Y - 124, 56, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  label(ctx, 'tree', TREE_X, GROUND_Y + 18)
  // the kid
  drawKid(ctx, KID_X, GROUND_Y)
  // the apple growing on the tree (6.4–8), then in the kid's hand
  const appleGrow = clamp01((t - 6.4) / 1.2)
  const appleOnTree = t < 8.8
  const apX = appleOnTree ? TREE_X - 30 : KID_X - 33
  const apY = appleOnTree ? GROUND_Y - 100 : GROUND_Y - 68
  if (appleGrow > 0) {
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(apX, apY, 7 * (appleOnTree ? appleGrow : 1), 0, Math.PI * 2)
    ctx.fill()
  }
  // our atom's journey: crater → sky arc → canopy (0–4.4), inside the
  // tree (4.4–6.4), in the apple (6.4–8.8), in the kid (8.8+)
  if (t < 4.4) {
    const q = easeInOut(clamp01(t / 4.4))
    const x = VOLC_X + (TREE_X - VOLC_X) * q
    const y = GROUND_Y - 150 - Math.sin(q * Math.PI) * 130 + (GROUND_Y - 124 - (GROUND_Y - 150)) * q
    drawCO2(ctx, x, y)
    if (t > 0.8 && t < 3.6) tag(ctx, 'CO₂ — our carbon rides in the middle', x, y - 26, AMBER, 12)
  } else if (t < 6.4) {
    drawMarker(ctx, TREE_X, GROUND_Y - 124, 14)
    if (t > 4.8) tag(ctx, 'the leaves keep the carbon, build wood and fruit', TREE_X, GROUND_Y - 190, 'rgba(203, 213, 225, 0.95)', 12)
  } else if (appleGrow > 0 && appleOnTree) {
    drawMarker(ctx, apX, apY, 13)
    if (t > 7.2) tag(ctx, 'an apple — with our atom inside', apX, apY - 24, AMBER, 12)
  } else if (!appleOnTree) {
    drawMarker(ctx, apX, apY, 13)
    if (t > 9.6) tag(ctx, 'eaten! our star-born atom is part of the kid now', KID_X, GROUND_Y - 132, AMBER)
  }
}

function drawYouScene(ctx: CanvasRenderingContext2D, t: number) {
  drawSpace(ctx)
  // the kid under the night sky, the atom glowing in them
  ctx.fillStyle = '#060a18'
  ctx.fillRect(0, UH - 50, W, H - (UH - 50))
  drawKid(ctx, W * 0.5, UH - 50)
  const glow = ctx.createRadialGradient(W * 0.5, UH - 100, 0, W * 0.5, UH - 100, 26)
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.6)')
  glow.addColorStop(1, 'rgba(251, 191, 36, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(W * 0.5, UH - 100, 26, 0, Math.PI * 2)
  ctx.fill()
  drawMarker(ctx, W * 0.5, UH - 100, 10)
  // …and one marked star far above: where it all began
  const sx = W * 0.64
  const sy = UH * 0.2
  ctx.fillStyle = 'rgba(255, 245, 210, 0.95)'
  ctx.beginPath()
  ctx.arc(sx, sy, 2.5, 0, Math.PI * 2)
  ctx.fill()
  if (t > 2) drawMarker(ctx, sx, sy, 9)
  if (t > 3.2) {
    ctx.save()
    ctx.globalAlpha = clamp01((t - 3.2) / 1)
    ctx.setLineDash([3, 7])
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(W * 0.5, UH - 112)
    ctx.lineTo(sx, sy + 10)
    ctx.stroke()
    ctx.restore()
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
  const n = COSMOS_JOURNEYS.length
  const rowH = (UH - 2 * ROW_M - (n - 1) * ROW_GAP) / n
  return COSMOS_JOURNEYS.map((j, i) => ({
    id: j.id,
    ready: j.ready,
    left: ROW_M,
    top: ROW_M + i * (rowH + ROW_GAP),
    right: W - ROW_M,
    bottom: ROW_M + i * (rowH + ROW_GAP) + rowH,
  }))
}

function drawLineup(ctx: CanvasRenderingContext2D) {
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
      drawSunBall(ctx, cx, cy, rh * 0.34)
    } else if (j.id === 'detective') {
      // a bright star + its rainbow with dark barcode lines
      const sx = cx - rh * 0.55
      const sy = cy - rh * 0.12
      ctx.strokeStyle = 'rgba(255, 245, 210, 0.8)'
      ctx.lineWidth = 1
      for (const [dx, dy] of [[8, 0], [-8, 0], [0, 8], [0, -8]]) {
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(sx + dx, sy + dy)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(255, 245, 210, 0.95)'
      ctx.beginPath()
      ctx.arc(sx, sy, 3, 0, Math.PI * 2)
      ctx.fill()
      const bw = rh * 1.3
      const bh = rh * 0.22
      const bx = cx - bw * 0.25
      const by = cy - bh / 2
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0)
      for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, wavelengthToCss(410 + (k / 8) * 280, 0.85))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, 4)
      ctx.fill()
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)'
      for (const f of [0.26, 0.47, 0.72]) ctx.fillRect(bx + bw * f, by, 2.5, bh)
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
  timeScale = 1,
  holdBeat = false,
  onReport,
  onFinished,
}: {
  /** the journey being shown; null = the lineup chooser */
  journey: CosmosJourneyId | null
  paused: boolean
  seek: { id: string; n: number } | null
  active: boolean
  /** story-time rate: 1 = normal; ~0.15 holds the scene in slow motion
   *  while the narrator talks (ambient shimmer keeps full speed) */
  timeScale?: number
  /** science pacing: the narrator still has pieces to say about this
   *  beat — never move on to the next beat (or finish) yet */
  holdBeat?: boolean
  onReport: (r: CosmosReport) => void
  onFinished: () => void
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const journeyRef = useRef(journey)
  journeyRef.current = journey
  const timeScaleRef = useRef(timeScale)
  timeScaleRef.current = timeScale
  const holdBeatRef = useRef(holdBeat)
  holdBeatRef.current = holdBeat
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
      // the beat gate: a frame that would leave the beat is undone. A
      // held story (the voice talking) takes no step, so needs no copy.
      const sdt = dt * timeScaleRef.current
      const gate = holdBeatRef.current
      if (!gate || sdt > 0) {
        const backup = gate ? structuredClone(sim.current) : null
        const before = backup ? storyId(sim.current) : ''
        step(sim.current, sdt)
        if (backup && storyId(sim.current) !== before) sim.current = backup
      }
      record()
      report()
      const s = sim.current
      const done =
        (s.phase === 'valley' && s.phaseT >= END_T) || (s.phase === 'you' && s.phaseT >= YOU_T)
      if (!finishedSent.current && !holdBeatRef.current && done) {
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
            IDLE = now
            if (!journeyRef.current) drawLineup(ctx)
            else if (s.phase === 'sun') drawSunScene(ctx)
            else if (s.phase === 'recipe') drawRecipeScene(ctx, s.phaseT)
            else if (s.phase === 'giant') drawGiantScene(ctx)
            else if (s.phase === 'forge') {
              const cam = sunCloseupCamera(s.phaseT)
              if (cam.sceneAlpha < 1) {
                // dive from the whole giant into its core
                const u = (cam.zoom - 1) / (SUN_CLOSEUP_MAX_ZOOM - 1)
                ctx.save()
                ctx.translate(GIANT_CX + (W / 2 - GIANT_CX) * u, GIANT_CY + (UH / 2 - GIANT_CY) * u)
                ctx.scale(cam.zoom, cam.zoom)
                ctx.translate(-GIANT_CX, -GIANT_CY)
                drawGiantScene(ctx)
                ctx.restore()
                if (cam.marker > 0) {
                  ctx.save()
                  ctx.globalAlpha = cam.marker
                  ctx.strokeStyle = AMBER
                  ctx.lineWidth = 3
                  ctx.beginPath()
                  ctx.arc(GIANT_CX, GIANT_CY, 34, 0, Math.PI * 2)
                  ctx.stroke()
                  ctx.restore()
                }
              }
              drawForgeCloseup(ctx, s.phaseT, cam.sceneAlpha)
            } else if (s.phase === 'boom') drawBoomScene(ctx, s.phaseT)
            else if (s.phase === 'drift') drawDriftScene(ctx, s.phaseT)
            else if (s.phase === 'earth') drawEarthFormScene(ctx, s.phaseT)
            else if (s.phase === 'alive') drawAliveScene(ctx, s.phaseT)
            else if (s.phase === 'you') drawYouScene(ctx, s.phaseT)
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
