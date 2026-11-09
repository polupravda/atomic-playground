import { memo, useEffect, useRef, useState } from 'react'
import { Layer, Shape, Stage } from 'react-konva'
import Konva from 'konva'
import { drawGlossyParticle } from './particleStyle'
import { BLAST_LIFE, drawFuseSpark, drawRealBlast } from './realBlast'
import {
  CLOSEUP_MAX_ZOOM,
  CLOSEUP_STEP_COUNT,
  CLOSEUP_TOTAL,
  closeupCamera,
  closeupStep,
  drawCloseup,
} from './fissionCloseup'
import { blit, clamp01, easeIn, easeInOut, makeCanvasSprite, type Sprite } from './canvasUtil'
import {
  CARGO_M,
  drawFuel as drawFuelBall,
  drawLineup,
  lineupLayout,
  drawRealShapeExtras,
  fillBomb,
  realShapeLayout,
  strokeBomb,
} from './bombShapes'
import type { ParticleKind } from '../state/atomStore'
import {
  BOMB_DESIGNS,
  neutronsFromSplit,
  damageZones,
  CLOUD_TOP_KM,
  yieldText,
  type DamageZoneId,
  type BombDesignId,
} from '../core/fission'

// R01 — the atomic-bomb demo canvas. Two scales, one story:
//   1. NUCLEAR scale: the bomb's core as ~100 nuclei. DETONATE runs a
//      countdown, the assembly (gun: a uranium "bullet" fired into a
//      target; implosion: a plutonium ball squeezed by explosives), then a
//      single neutron starts a real chain: every hit nucleus stretches,
//      splits into two fragments + 2–3 neutrons, and those neutrons fly on.
//      Neutrons that leave the lump are lost (critical mass emerges from
//      the geometry: each gun piece alone would lose too many).
//      Tsar Bomba is a HYDROGEN bomb: the fission chain happens in a small
//      trigger; its X-rays (violet, the gamma family) squeeze and heat the
//      hydrogen fuel, and a burn front sweeps through it fusing deuterium +
//      tritium into helium + a fast neutron.
//   2. HUMAN scale: once the chain is done, a flash cuts to the fireball,
//      shock wave and rising mushroom cloud (stylized, not to scale).
// Same rules as the other labs: all motion lives in a ref-held sim ticked
// by one Konva.Animation; React only hears about changes via onReport.

const PAGE_W = Math.min(window.innerWidth, 1440)
// page frame − 48 padding − 16rem info − 18rem photos − 2×24 gaps − 2 border
export const FISSION_W = Math.max(620, PAGE_W - 48 - 256 - 288 - 48 - 2)
// viewport − 40 page padding − 2 border − 48 header row (+gap)
export const FISSION_H = Math.max(480, window.innerHeight - 42 - 48)
const W = FISSION_W
const H = FISSION_H
const CX = W / 2
// the bottom BUTTON_ZONE px hold the DETONATE / Pause buttons: every bomb
// (incl. Fat Man's casing + labels, the biggest) is fitted above it
const BUTTON_ZONE = 86
const CY = (H - BUTTON_ZONE) / 2 + 4

const N_BOMB = 100
// Every bomb's metal starts at the SAME spacing C (normal solid metal).
// Implosion then squeezes the plutonium TIGHTER than normal: to SQUEEZE ×
// its width (≈ 1.4× the density on screen; the real Fat Man core reached
// about 2×). Little Boy's uranium is never squeezed — it stays at normal
// density, which is why it needed ~10× more metal.
const SQUEEZE = 0.85
// phyllotaxis spacing constant, sized so the implosion shell fits the canvas
// Fat Man's labelled hardware reaches ≈ 15.9 C + 44 px from the centre
// (explosive shell, harness, casing, label): it must fit above and below
const C = Math.min(
  12.5,
  (CX - 70) / Math.sqrt(N_BOMB),
  ((H - BUTTON_ZONE) / 2 - 48) / 15.9,
)
const RC = C * Math.sqrt(N_BOMB) // radius of the assembled core
const NUC_R = C * 0.75 // drawn nucleus radius
const HIT_R = NUC_R * 0.9 // a neutron this close to a nucleus may split it
// …but only sometimes: real nuclei are ~100,000× smaller than their atoms,
// so most close passes are misses. One roll per encounter. Tuned by Monte
// Carlo (300 runs each): 100 nuclei → median ~90% split, never <30%.
const SPLIT_CHANCE = 0.45
const PR = NUC_R / 2.9 // nucleon radius inside a nucleus sprite
const NEUTRON_SPEED = C * 16 // px/s — slowed down ~ a billion times
const EXCITE_T = 0.3 // s a hit nucleus wobbles before it splits
// gun type: the barrel is STRETCHED across the whole canvas width (atoms,
// fonts and strokes keep their size): firing unit at the left edge, target
// at the right edge, the uranium "bullet" waits GUN_GAP px from the target.
// Layout from left: unit + label (82 px) · barrel padding (80) · bullet ·
// GUN_GAP · target (2 RC) · padding (16); 14 px margins.
const GUN_GAP = Math.max(60, W - 206 - 2 * RC)
const COUNTDOWN_STEP = 0.7

// ---- one layout rule set for all three bombs ----
// • casing: dashed, CASE_PAD px outside the outermost part, corner CASE_R
//   (Fat Man's egg-shaped case is the one real shape difference)
// • casing name small/soft CASE_LABEL_DY above it; part names in amber
//   PART_LABEL_DY below it
// • firing unit: UNIT_GAP px left of the casing, top at UNIT_Y
const CASE_PAD = 14
const CASE_R = 18
const PART_LABEL_DY = 16
const CASE_LABEL_DY = 12
const UNIT_GAP = 18
const UNIT_Y = CY + 24
const UNIT_W = 54 // = BOX_W

const PAIR_SPACING = C * 1.35
// Tsar Bomba: trigger (40 Pu atoms) + fuel, laid out left→right and
// centred together with the firing unit
const TSAR_RC = C * Math.sqrt(40)
const TSAR_HARNESS = TSAR_RC + C * 5.9 // = implosionGeom(...).rHarness
const FUEL_R0 = PAIR_SPACING * Math.sqrt(30) + C * 0.75 // = fuelRadius
const TSAR_SPAN = 4 + UNIT_W + UNIT_GAP + CASE_PAD + 2 * TSAR_HARNESS + 50 + 2 * FUEL_R0 + CASE_PAD
const TSAR_OFF = Math.max(0, (W - 4 - TSAR_SPAN) / 2)
const TSAR_CX = TSAR_OFF + 4 + UNIT_W + UNIT_GAP + CASE_PAD + TSAR_HARNESS
// Tsar Bomba's hydrogen-fuel stage (right of the trigger)
const FUEL_CX = TSAR_CX + TSAR_HARNESS + 50 + FUEL_R0
// core centre per design (gun: the target sits at the right edge)
const cxOf = (mode: BombDesignId) =>
  mode === 'gun' ? W - 30 - RC : mode === 'tsar' ? TSAR_CX : CX
const FUEL_SQUEEZE = 0.7 // X-rays squeeze the fuel to 70% of its size
const XRAY_T = 1.5
const FUSION_SWEEP = 2.4 // s for the burn front to cross the fuel
const MERGE_T = 0.35

export type FissionPhase =
  | 'armed'
  | 'countdown'
  | 'assembling'
  | 'chain'
  | 'closeup'
  | 'xray'
  | 'fusion'
  | 'chainDone'
  | 'explosion'

export interface FissionReport {
  phase: FissionPhase
  splits: number
  total: number
  escaped: number
  generation: number
  countdown: number
  fusions: number
  fuelTotal: number
  /** close-up story step (0 … CLOSEUP_STEP_COUNT−1) while phase === 'closeup' */
  closeupStep: number
  /** explosion caption step (0 fireball … 4 size comparison) */
  explosionStep: number
  /** current story-timeline step (see storyOrder) */
  storyId: string
  /** explosion scene has settled into the mushroom cloud */
  aftermath: boolean
  /** the opening lineup (+ zoom to this bomb) is still playing */
  intro: boolean
}

interface Nucleus {
  hx: number // assembled ("home") position
  hy: number
  x: number
  y: number
  bullet: boolean // gun type: part of the fired piece
  state: 'whole' | 'excited' | 'split'
  t: number
  axis: number
  gen: number
  wob: number
}
interface Neutron {
  x: number
  y: number
  vx: number
  vy: number
  gen: number
  /** has been inside the fuel (a stray neutron starts outside) */
  entered: boolean
  escaped: boolean
  /** nucleus it just flew past (already rolled against; no re-roll) */
  skip: Nucleus | null
  /** the aimed stray neutron always splits the first nucleus it meets */
  sure: boolean
}
interface Fragment {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  big: boolean
}
interface Burst {
  x: number
  y: number
  age: number
}
interface FusionPair {
  hx: number // home center (unsqueezed)
  hy: number
  a: number // axis between the deuterium and the tritium
  state: 'cold' | 'merging' | 'fused'
  t: number
  // helium-4 left behind
  x: number
  y: number
  vx: number
  vy: number
  wob: number
}
interface Sim {
  mode: BombDesignId
  cx: number
  phase: FissionPhase
  phaseT: number
  nuclei: Nucleus[]
  neutrons: Neutron[]
  fragments: Fragment[]
  bursts: Burst[]
  splits: number
  escaped: number
  generation: number
  reinjects: number
  fuel: FusionPair[]
  fusions: number
  /** zoom-in close-up of one hit nucleus, late in the chain (once per run) */
  closeup: { fx: number; fy: number; t: number } | null
  closeupDone: boolean
  /** seconds since the gun's explosive fired (null = not fired) */
  blastT: number | null
  /** s since the bomb was picked (phase stays 'armed'): zoom out of the
   *  lineup until INTRO_TOTAL, "Ready" until ZOOM_IN_AT, zoom inside until
   *  INSIDE_AT, a short break, then the countdown starts by itself at
   *  COUNTDOWN_AT */
  introT: number
}

// ---------- sprites (pre-rendered once: 100 nuclei × 7 gradients per frame
// would be wasteful) ----------

function makeSprite(parts: Array<[ParticleKind, number, number]>, r: number): Sprite {
  let ext = 0
  for (const [, x, y] of parts) ext = Math.max(ext, Math.hypot(x, y))
  const size = Math.ceil(2 * (ext + r * 1.5) + 2)
  return makeCanvasSprite(size, (ctx) => {
    for (const [kind, x, y] of parts) {
      drawGlossyParticle(ctx, kind, size / 2 + x, size / 2 + y, r)
    }
  })
}

function hexCluster(kinds: ParticleKind[]): Array<[ParticleKind, number, number]> {
  // center + ring: kinds[0] in the middle, the rest around it
  const out: Array<[ParticleKind, number, number]> = [[kinds[0], 0, 0]]
  const ring = kinds.length - 1
  for (let i = 0; i < ring; i++) {
    const a = (i * 2 * Math.PI) / ring + 0.3
    out.unshift([kinds[i + 1], Math.cos(a) * PR * 1.85, Math.sin(a) * PR * 1.85])
  }
  return out
}

// Electron shells around each atom: thin sky-blue rings (sky blue =
// electrons), the far-view shorthand of the close-up's shell atoms, so both
// views read as the SAME atoms. Symbolic: uranium really has 7 shells; two
// rings are drawn so a crowd of 100 atoms stays readable. Neighbours' outer
// rings just touch, as atoms do in a metal; squeezing packs them tighter.
const RING_R = C * 1.12

function makeRingSprite(rOuter: number, rings: number): Sprite {
  const size = Math.ceil(2 * rOuter + 4)
  return makeCanvasSprite(size, (ctx) => {
    ctx.lineWidth = 1
    for (let i = 0; i < rings; i++) {
      const r = rOuter * (1 - i * 0.22)
      // almost transparent: a hint of the shells, the nuclei stay the focus
      ctx.strokeStyle = `rgba(56, 189, 248, ${i === 0 ? 0.18 : 0.12})`
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  })
}

let sprites: {
  rings: Sprite
  ringsSmall: Sprite
  ringH: Sprite
  nucleus: Sprite
  fragBig: Sprite
  fragSmall: Sprite
  neutron: Sprite
  deuterium: Sprite
  tritium: Sprite
  helium: Sprite
} | null = null
function getSprites() {
  if (!sprites) {
    // heavy nuclei have more neutrons than protons (U-235: 92 p, 143 n)
    sprites = {
      rings: makeRingSprite(RING_R, 2),
      ringsSmall: makeRingSprite(RING_R * 0.8, 2),
      // hydrogen has a single electron shell
      ringH: makeRingSprite(NUC_R * 1.25, 1),
      nucleus: makeSprite(
        hexCluster(['neutrons', 'protons', 'neutrons', 'protons', 'neutrons', 'protons', 'neutrons']),
        PR,
      ),
      fragBig: makeSprite(
        hexCluster(['neutrons', 'protons', 'neutrons', 'protons', 'neutrons']),
        PR,
      ),
      fragSmall: makeSprite(hexCluster(['protons', 'neutrons', 'protons', 'neutrons']), PR * 0.9),
      neutron: makeSprite([['neutrons', 0, 0]], PR * 1.5),
      // hydrogen isotopes: deuterium 1p+1n, tritium 1p+2n; helium-4 2p+2n
      deuterium: makeSprite(
        [
          ['protons', -PR * 0.95, 0],
          ['neutrons', PR * 0.95, 0],
        ],
        PR * 1.1,
      ),
      tritium: makeSprite(
        [
          ['protons', 0, -PR],
          ['neutrons', -PR * 0.95, PR * 0.6],
          ['neutrons', PR * 0.95, PR * 0.6],
        ],
        PR * 1.1,
      ),
      helium: makeSprite(
        [
          ['protons', -PR, -PR],
          ['neutrons', PR, -PR],
          ['neutrons', -PR, PR],
          ['protons', PR, PR],
        ],
        PR * 1.1,
      ),
    }
  }
  return sprites
}


// ---------- sim ----------

function buildSim(mode: BombDesignId): Sim {
  const n = BOMB_DESIGNS[mode].nucleusCount
  const nuclei: Nucleus[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  const cx = cxOf(mode)
  for (let i = 0; i < n; i++) {
    const r = C * Math.sqrt(i + 0.5)
    const a = i * golden
    const hx = cx + r * Math.cos(a)
    const hy = CY + r * Math.sin(a)
    nuclei.push({
      hx,
      hy,
      x: hx,
      y: hy,
      // Little Boy's projectile held ~40% of the uranium
      bullet: hx < cx - RC * 0.25,
      state: 'whole',
      t: 0,
      axis: 0,
      gen: 0,
      wob: Math.random() * Math.PI * 2,
    })
  }
  const fuel: FusionPair[] = []
  const pairs = BOMB_DESIGNS[mode].fusionPairs ?? 0
  for (let i = 0; i < pairs; i++) {
    const r = PAIR_SPACING * Math.sqrt(i + 0.5)
    const a = i * golden
    fuel.push({
      hx: FUEL_CX + r * Math.cos(a),
      hy: CY + r * Math.sin(a),
      a: Math.random() * Math.PI,
      state: 'cold',
      t: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      wob: Math.random() * Math.PI * 2,
    })
  }
  const sim: Sim = {
    mode,
    cx,
    phase: 'armed',
    phaseT: 0,
    nuclei,
    neutrons: [],
    fragments: [],
    bursts: [],
    splits: 0,
    escaped: 0,
    generation: 0,
    reinjects: 0,
    fuel,
    fusions: 0,
    closeup: null,
    closeupDone: false,
    blastT: null,
    introT: 0,
  }
  placeNuclei(sim)
  return sim
}


function assemblyProgress(sim: Sim): number {
  if (sim.phase === 'armed' || sim.phase === 'countdown') return 0
  if (sim.phase === 'assembling') return clamp01(sim.phaseT / assemblyDuration(sim.mode))
  return 1
}
function assemblyDuration(mode: BombDesignId) {
  return mode === 'gun' ? 0.9 : 0.8
}

function placeNuclei(sim: Sim) {
  const p = easeIn(assemblyProgress(sim))
  for (const nu of sim.nuclei) {
    if (sim.mode === 'gun') {
      nu.x = nu.hx - (nu.bullet ? GUN_GAP * (1 - p) : 0)
      nu.y = nu.hy
    } else if (sim.mode === 'implosion' || sim.mode === 'tsar') {
      const s = 1 - (1 - SQUEEZE) * p
      nu.x = sim.cx + (nu.hx - sim.cx) * s
      nu.y = CY + (nu.hy - CY) * s
    } else {
      nu.x = nu.hx
      nu.y = nu.hy
    }
  }
}

/** radius of the metal before any squeeze (normal density) */
function restRadius(sim: Sim) {
  return C * Math.sqrt(sim.nuclei.length)
}
/** radius of the metal right now (implosion cores shrink as they're squeezed) */
function coreRadius(sim: Sim) {
  if (sim.mode === 'gun') return restRadius(sim)
  return restRadius(sim) * (1 - (1 - SQUEEZE) * easeIn(assemblyProgress(sim)))
}

function fuelRadius(sim: Sim) {
  return PAIR_SPACING * Math.sqrt(sim.fuel.length) + NUC_R
}

/** fuel squeeze factor: 1 until the X-rays arrive, then FUEL_SQUEEZE */
function fuelScale(sim: Sim) {
  if (sim.phase === 'xray') return 1 - (1 - FUEL_SQUEEZE) * easeIn(clamp01(sim.phaseT / XRAY_T))
  if (sim.phase === 'fusion' || sim.phase === 'chainDone' || sim.phase === 'explosion')
    return FUEL_SQUEEZE
  return 1
}

/** heat: fuel nuclei jiggle harder as the X-rays heat them */
function fuelHeat(sim: Sim) {
  if (sim.phase === 'xray') return clamp01(sim.phaseT / XRAY_T)
  if (sim.phase === 'fusion' || sim.phase === 'chainDone') return 1
  return 0
}

function pairCenter(sim: Sim, fp: FusionPair) {
  const k = fuelScale(sim)
  return { x: FUEL_CX + (fp.hx - FUEL_CX) * k, y: CY + (fp.hy - CY) * k }
}

function stepFusion(sim: Sim, dt: number) {
  const rF = fuelRadius(sim) * FUEL_SQUEEZE
  const front = FUEL_CX - rF + (sim.phaseT / FUSION_SWEEP) * 2 * rF
  for (const fp of sim.fuel) {
    const c = pairCenter(sim, fp)
    if (fp.state === 'cold' && c.x < front) {
      fp.state = 'merging'
      fp.t = 0
    } else if (fp.state === 'merging') {
      fp.t += dt
      if (fp.t >= MERGE_T) {
        // D + T → He-4 + n : the helium stays, the neutron races away
        fp.state = 'fused'
        sim.fusions++
        fp.x = c.x
        fp.y = c.y
        const ha = Math.random() * Math.PI * 2
        fp.vx = Math.cos(ha) * C * 1.2
        fp.vy = Math.sin(ha) * C * 1.2
        sim.bursts.push({ x: c.x, y: c.y, age: 0 })
        const na = Math.random() * Math.PI * 2
        sim.neutrons.push({
          x: c.x,
          y: c.y,
          vx: Math.cos(na) * NEUTRON_SPEED * 1.6, // fusion neutrons are extra fast
          vy: Math.sin(na) * NEUTRON_SPEED * 1.6,
          gen: 0,
          entered: true,
          escaped: true, // not part of the fission count
          skip: null,
          sure: false,
        })
      }
    } else if (fp.state === 'fused') {
      fp.x += fp.vx * dt
      fp.y += fp.vy * dt
    }
  }
}

function injectNeutron(sim: Sim) {
  // the initiator in the middle of the core fires the first neutron
  const a = Math.random() * Math.PI * 2
  sim.neutrons.push({
    x: sim.cx,
    y: CY,
    vx: Math.cos(a) * NEUTRON_SPEED,
    vy: Math.sin(a) * NEUTRON_SPEED,
    gen: 0,
    entered: true,
    escaped: false,
    skip: null,
    sure: true,
  })
  sim.bursts.push({ x: sim.cx, y: CY, age: 0.25 })
}

function split(sim: Sim, nu: Nucleus) {
  nu.state = 'split'
  sim.splits++
  sim.generation = Math.max(sim.generation, nu.gen)
  // two unequal fragments (like barium + krypton) fly apart along the
  // stretch axis — their speed is where most of the energy goes (heat)
  const fs = C * 9
  const jitter = (Math.random() - 0.5) * 0.4
  for (const [dir, big] of [
    [1, true],
    [-1, false],
  ] as const) {
    const a = nu.axis + jitter + (dir < 0 ? Math.PI : 0)
    sim.fragments.push({
      x: nu.x,
      y: nu.y,
      vx: Math.cos(a) * fs * (big ? 0.8 : 1.2),
      vy: Math.sin(a) * fs * (big ? 0.8 : 1.2),
      age: 0,
      big,
    })
  }
  sim.bursts.push({ x: nu.x, y: nu.y, age: 0 })
  const count = neutronsFromSplit(BOMB_DESIGNS[sim.mode].neutronsMean, Math.random())
  const a0 = Math.random() * Math.PI * 2
  for (let i = 0; i < count; i++) {
    const a = a0 + (i * 2 * Math.PI) / count + (Math.random() - 0.5) * 1.2
    sim.neutrons.push({
      x: nu.x + Math.cos(a) * NUC_R,
      y: nu.y + Math.sin(a) * NUC_R,
      vx: Math.cos(a) * NEUTRON_SPEED,
      vy: Math.sin(a) * NEUTRON_SPEED,
      gen: nu.gen,
      entered: true,
      escaped: false,
      skip: null,
      sure: false,
    })
  }
}

function stepParticles(sim: Sim, dt: number, collide: boolean) {
  const rCore = coreRadius(sim) + C
  const keep: Neutron[] = []
  for (const ne of sim.neutrons) {
    ne.x += ne.vx * dt
    ne.y += ne.vy * dt
    let absorbed = false
    if (ne.skip && Math.hypot(ne.skip.x - ne.x, ne.skip.y - ne.y) >= HIT_R) ne.skip = null
    if (collide) {
      for (const nu of sim.nuclei) {
        if (nu.state !== 'whole' || nu === ne.skip) continue
        const dx = nu.x - ne.x
        const dy = nu.y - ne.y
        if (dx * dx + dy * dy < HIT_R * HIT_R) {
          if (!ne.sure && Math.random() >= SPLIT_CHANCE) {
            ne.skip = nu // flew past this one
            continue
          }
          nu.state = 'excited'
          nu.t = 0
          nu.axis = Math.atan2(ne.vy, ne.vx) + Math.PI / 2
          nu.gen = ne.gen + 1
          absorbed = true
          // late in a real chain ("the last stage"), freeze and zoom into
          // this freshly hit nucleus for the close-up story
          if (
            !sim.closeupDone &&
            sim.phase === 'chain' &&
            sim.splits >= sim.nuclei.length * 0.5
          ) {
            startCloseup(sim, nu)
          }
          break
        }
      }
    }
    if (absorbed) continue
    const inside = Math.hypot(ne.x - sim.cx, ne.y - CY) <= rCore
    if (inside) ne.entered = true
    else if (ne.entered && !ne.escaped) {
      ne.escaped = true
      sim.escaped++
    }
    if (ne.x > -20 && ne.x < W + 20 && ne.y > -20 && ne.y < H + 20) keep.push(ne)
  }
  sim.neutrons = keep
  for (const nu of sim.nuclei) {
    if (nu.state !== 'excited') continue
    nu.t += dt
    if (nu.t >= EXCITE_T) split(sim, nu)
  }
  for (const f of sim.fragments) {
    f.x += f.vx * dt
    f.y += f.vy * dt
    f.vx *= 1 - 0.6 * dt
    f.vy *= 1 - 0.6 * dt
    f.age += dt
  }
  sim.fragments = sim.fragments.filter((f) => f.age < 1.8)
  for (const b of sim.bursts) b.age += dt
  sim.bursts = sim.bursts.filter((b) => b.age < 0.5)
}

/** freeze the chain and zoom into `nu` for the close-up story */
function startCloseup(sim: Sim, nu: Nucleus) {
  sim.closeupDone = true
  sim.closeup = { fx: nu.x, fy: nu.y, t: 0 }
  sim.phase = 'closeup'
}

function step(sim: Sim, dt: number) {
  sim.phaseT += dt
  if (sim.blastT !== null && sim.phase !== 'closeup') sim.blastT += dt
  switch (sim.phase) {
    case 'armed':
      sim.introT += dt
      // auto-play: a look at the real bomb, the zoom inside, a short
      // break — then the countdown starts
      if (sim.introT >= COUNTDOWN_AT) {
        sim.phase = 'countdown'
        sim.phaseT = 0
      }
      break
    case 'countdown':
      if (sim.phaseT >= COUNTDOWN_STEP * 3) {
        sim.phaseT = 0
        // the explosive(s) fire; the Tsar Bomba's trigger
        // is a small implosion bomb, so it is squeezed like Fat Man
        sim.phase = 'assembling'
        sim.blastT = 0
      }
      break
    case 'assembling':
      placeNuclei(sim)
      if (sim.phaseT >= assemblyDuration(sim.mode)) {
        sim.phase = 'chain'
        sim.phaseT = 0
        placeNuclei(sim)
        injectNeutron(sim)
      }
      break
    case 'closeup':
      // the nuclear sim is frozen while the camera is zoomed in
      if (sim.closeup) {
        sim.closeup.t += dt
        if (sim.closeup.t >= CLOSEUP_TOTAL) {
          sim.closeup = null
          sim.phase = 'chain'
        }
      } else sim.phase = 'chain'
      break
    case 'chain': {
      stepParticles(sim, dt, true)
      if (sim.phase !== 'chain') break // just zoomed into a close-up
      const rLive = coreRadius(sim) + C * 2
      const live = sim.neutrons.some(
        (ne) => !ne.entered || Math.hypot(ne.x - sim.cx, ne.y - CY) < rLive,
      )
      const excited = sim.nuclei.some((nu) => nu.state === 'excited')
      if (!live && !excited) {
        const total = sim.nuclei.length
        if (sim.splits < total * 0.6 && sim.reinjects < 4) {
          // a real initiator sprays a burst of neutrons, not one — if our
          // single neutron got unlucky, the next one from the burst goes
          sim.reinjects++
          injectNeutron(sim)
        } else if (!sim.closeupDone) {
          // an unlucky chain that never reached half the nuclei: every run
          // still shows the close-up (the story timeline promises it), on
          // the intact nucleus nearest the middle
          const pool = sim.nuclei.some((n) => n.state === 'whole')
            ? sim.nuclei.filter((n) => n.state === 'whole')
            : sim.nuclei
          const d = (n: Nucleus) => Math.hypot(n.x - sim.cx, n.y - CY)
          startCloseup(sim, pool.reduce((a, b) => (d(b) < d(a) ? b : a)))
        } else {
          sim.phase = sim.mode === 'tsar' ? 'xray' : 'chainDone'
          sim.phaseT = 0
        }
      }
      break
    }
    case 'xray':
      stepParticles(sim, dt, false)
      if (sim.phaseT >= XRAY_T) {
        sim.phase = 'fusion'
        sim.phaseT = 0
      }
      break
    case 'fusion':
      stepParticles(sim, dt, false)
      stepFusion(sim, dt)
      if (sim.fuel.every((fp) => fp.state === 'fused') && sim.phaseT > FUSION_SWEEP + MERGE_T + 0.6) {
        sim.phase = 'chainDone'
        sim.phaseT = 0
      }
      break
    case 'chainDone':
      stepParticles(sim, dt, false)
      if (sim.mode === 'tsar') stepFusion(sim, dt)
      if (sim.phaseT >= 2.2) {
        sim.phase = 'explosion'
        sim.phaseT = 0
      }
      break
    case 'explosion':
      break
  }
}

// ---------- drawing: nuclear scale ----------

const AMBER = 'rgba(251, 191, 36, 0.95)'
const AMBER_SOFT = 'rgba(251, 191, 36, 0.7)'

// The diagram's dashed casing and part names fade out while the inside
// diagram shrinks into the bomb's real outline ("Real shape" view).
let chromeAlpha = 1

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = AMBER,
  size = 12,
  align: CanvasTextAlign = 'center',
) {
  if (chromeAlpha <= 0) return
  const prev = ctx.globalAlpha
  ctx.globalAlpha = prev * chromeAlpha
  ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
  ctx.globalAlpha = prev
}

function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  const ha = Math.atan2(y1 - y0, x1 - x0)
  for (const spread of [-0.5, 0.5]) {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x1 - 9 * Math.cos(ha + spread), y1 - 9 * Math.sin(ha + spread))
    ctx.stroke()
  }
}

// ---------- firing unit + explosives (one visual language for all bombs) ----------
// Every bomb has the same firing unit: a plunger box wired to its explosive;
// the plunger goes down at "1" and a spark runs along the wire (gun: one
// wire to the charge; implosion: a ring of wire with a branch to EVERY
// block, so they all fire at once). Symbolic — real bombs fired themselves
// when a radar measured the right height.
// Every bomb's explosive is drawn the same way: red BLOCKS of one thickness
// (2.8 C) with a dark outline, a white highlight along the outer edge and
// small gaps between blocks; burnt grey after firing; the same realistic
// blast (realBlast.ts) when they go off at the end of the countdown.
// Gun type: a stack of 3 blocks at the breech. Implosion (Fat Man, and the
// Tsar Bomba's trigger, which IS a small implosion bomb): 16 blocks all
// round the plutonium ball.

const INK = '#020617'
const EXPLOSIVE = '#ef4444'
const BURNT = '#475569'
const BLOCKS = 16
const BLOCK_T = C * 2.8 // explosive block thickness, same for every bomb

const isImplosion = (mode: BombDesignId) => mode === 'implosion' || mode === 'tsar'
const hasFired = (sim: Sim) => sim.phase !== 'armed' && sim.phase !== 'countdown'

/** the dashed casing outline, same stroke for every bomb */
function strokeCasing(ctx: CanvasRenderingContext2D, path: () => void) {
  if (chromeAlpha <= 0) return
  ctx.strokeStyle = `rgba(100, 116, 139, ${0.8 * chromeAlpha})`
  ctx.lineWidth = 1.5
  ctx.setLineDash([7, 6])
  ctx.beginPath()
  path()
  ctx.stroke()
  ctx.setLineDash([])
}

/** countdown → plunger push (0–1) → spark along the wire (0–1) → fired */
function fuseState(sim: Sim) {
  const cd = sim.phase === 'countdown' ? sim.phaseT : sim.phase === 'armed' ? 0 : Infinity
  return {
    cd,
    fired: cd === Infinity,
    push: clamp01((cd - COUNTDOWN_STEP * 2) / 0.25),
    spark: clamp01((cd - COUNTDOWN_STEP * 2 - 0.25) / 0.4),
  }
}

const BOX_W = UNIT_W
const BOX_H = 36

/** the firing unit (plunger box); returns where wires leave it */
function drawFiringUnit(ctx: CanvasRenderingContext2D, sim: Sim, boxX: number, boxY: number) {
  const { push } = fuseState(sim)
  const rod = 30 * (1 - push) + 4
  const hx = boxX + BOX_W / 2
  ctx.fillStyle = '#94a3b8'
  ctx.strokeStyle = INK
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.rect(hx - 3, boxY - rod, 6, rod)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(hx - 18, boxY - rod - 8, 36, 9, 3)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#b45309'
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, BOX_W, BOX_H, 4)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.45)'
  ctx.lineWidth = 1.5
  for (const f of [0.33, 0.66]) {
    ctx.beginPath()
    ctx.moveTo(boxX + 3, boxY + BOX_H * f)
    ctx.lineTo(boxX + BOX_W - 3, boxY + BOX_H * f)
    ctx.stroke()
  }
  if (sim.phase === 'armed' || sim.phase === 'countdown') {
    label(ctx, 'firing unit', hx, boxY + BOX_H + 13)
  }
  return {
    right: { x: boxX + BOX_W, y: boxY + BOX_H * 0.6 },
    top: { x: boxX + BOX_W * 0.8, y: boxY },
  }
}

type Pt = { x: number; y: number }

/** a wire (quadratic curve) with the fuse spark running along it */
function drawWire(ctx: CanvasRenderingContext2D, sim: Sim, p0: Pt, c: Pt, p1: Pt) {
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(p0.x, p0.y)
  ctx.quadraticCurveTo(c.x, c.y, p1.x, p1.y)
  ctx.stroke()
  const { spark: u, fired, cd } = fuseState(sim)
  if (u > 0 && !fired) {
    const x = (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * c.x + u * u * p1.x
    const y = (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * c.y + u * u * p1.y
    drawFuseSpark(ctx, x, y, cd)
  }
}

/** explosive shell around an implosion core (+ room for the casing) */
function implosionGeom(sim: Sim) {
  const rc = restRadius(sim)
  const rIn = rc + C * 1.4
  const rOut = rIn + BLOCK_T
  return { rc, rIn, rOut, rHarness: rOut + C * 1.7 }
}

/** fill + outline one explosive block (path already built by the caller) */
function paintBlock(ctx: CanvasRenderingContext2D, fired: boolean) {
  ctx.fillStyle = fired ? BURNT : EXPLOSIVE
  ctx.strokeStyle = INK
  ctx.lineWidth = 2
  ctx.fill()
  ctx.stroke()
}
const HIGHLIGHT = 'rgba(255, 255, 255, 0.4)'

/** Little Boy's charge: where it sits at the breech */
function gunCharge(sim: Sim) {
  const left = sim.cx - RC - GUN_GAP - 80
  return { px: left + 12, pw: BLOCK_T, top: CY - RC * 0.5, h: RC }
}

/** Little Boy's charge: 3 blocks stacked at the breech, implosion-block style */
function drawGunCharge(ctx: CanvasRenderingContext2D, sim: Sim) {
  const { px, pw, top, h } = gunCharge(sim)
  const fired = hasFired(sim)
  const gap = 4
  const bh = (h - 2 * gap) / 3
  for (let i = 0; i < 3; i++) {
    const y = top + i * (bh + gap)
    ctx.beginPath()
    ctx.rect(px, y, pw, bh)
    paintBlock(ctx, fired)
    if (!fired) {
      // highlight along the outer (breech-side) edge, like the shell blocks
      ctx.strokeStyle = HIGHLIGHT
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(px + 4, y + 4)
      ctx.lineTo(px + 4, y + bh - 4)
      ctx.stroke()
    }
  }
}

function drawGunHardware(ctx: CanvasRenderingContext2D, sim: Sim) {
  const CX = sim.cx
  const top = CY - RC - CASE_PAD
  const bottom = CY + RC + CASE_PAD
  const left = CX - RC - GUN_GAP - 80
  const right = CX + RC + CASE_PAD
  strokeCasing(ctx, () => ctx.roundRect(left, top, right - left, bottom - top, CASE_R))
  const p = assemblyProgress(sim)
  drawGunCharge(ctx, sim)
  if (sim.phase === 'armed' || sim.phase === 'countdown') {
    const ch = gunCharge(sim)
    const unit = drawFiringUnit(ctx, sim, Math.max(4, left - UNIT_GAP - BOX_W), UNIT_Y)
    const end = { x: ch.px + ch.pw / 2, y: ch.top + ch.h }
    drawWire(ctx, sim, unit.right, { x: (unit.right.x + end.x) / 2, y: end.y + 34 }, end)
  }
  if (sim.phase === 'assembling') {
    // the push behind the bullet
    const bx = CX - RC - GUN_GAP * (1 - easeIn(p)) // rear of the bullet
    arrow(ctx, bx - 70, CY, bx - 18, CY)
  }
  if (sim.phase === 'armed' || sim.phase === 'countdown') {
    const { px, pw } = gunCharge(sim)
    label(ctx, 'explosive', px + pw / 2, bottom + PART_LABEL_DY)
    label(ctx, 'uranium "bullet"', CX - RC * 0.62 - GUN_GAP, bottom + PART_LABEL_DY)
    label(ctx, 'uranium target', CX + RC * 0.38, bottom + PART_LABEL_DY)
    label(ctx, 'gun barrel', (left + right) / 2, top - CASE_LABEL_DY, AMBER_SOFT, 11)
  }
}

/** Explosive shell (Fat Man, Tsar Bomba trigger). */
function drawImplosionHardware(ctx: CanvasRenderingContext2D, sim: Sim) {
  const g = implosionGeom(sim)
  const cx = sim.cx
  const p = assemblyProgress(sim)
  const fired = hasFired(sim)
  const fade = sim.phase === 'assembling' ? 1 - p : fired ? 0 : 1
  if (fade > 0) {
    // the shell itself: same red explosive as the gun's sticks
    const shrink = g.rc * (1 - SQUEEZE) * easeIn(p) * 0.6
    const rIn = g.rIn - shrink
    const rOut = g.rOut - shrink
    ctx.save()
    ctx.globalAlpha = fade
    for (let i = 0; i < BLOCKS; i++) {
      const a0 = (i / BLOCKS) * Math.PI * 2 + 0.03
      const a1 = ((i + 1) / BLOCKS) * Math.PI * 2 - 0.03
      ctx.beginPath()
      ctx.arc(cx, CY, rOut, a0, a1)
      ctx.arc(cx, CY, rIn, a1, a0, true)
      ctx.closePath()
      paintBlock(ctx, fired)
      if (!fired) {
        ctx.strokeStyle = HIGHLIGHT
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(cx, CY, rOut - 4, a0 + 0.06, a1 - 0.06)
        ctx.stroke()
      }
    }
    // the wiring: one ring, a branch to EVERY block (same wire as the gun's)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, CY, g.rHarness, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < BLOCKS; i++) {
      const a = ((i + 0.5) / BLOCKS) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * g.rHarness, CY + Math.sin(a) * g.rHarness)
      ctx.lineTo(cx + Math.cos(a) * rOut, CY + Math.sin(a) * rOut)
      ctx.stroke()
    }
    ctx.restore()
  }
  // the spark reaches the ring → every block fires at the same instant
  if (sim.phase === 'assembling' && sim.phaseT < 0.25) {
    for (let i = 0; i < BLOCKS; i++) {
      const a = ((i + 0.5) / BLOCKS) * Math.PI * 2
      drawFuseSpark(ctx, cx + Math.cos(a) * g.rOut, CY + Math.sin(a) * g.rOut, sim.phaseT * 10 + i)
    }
  }
  if (sim.phase === 'assembling') {
    const rIn = g.rIn - g.rc * (1 - SQUEEZE) * easeIn(p) * 0.6
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8
      const r0 = g.rOut + 34
      const r1 = rIn - 4
      arrow(ctx, cx + Math.cos(a) * r0, CY + Math.sin(a) * r0, cx + Math.cos(a) * r1, CY + Math.sin(a) * r1)
    }
  }
}

/** Fat Man: dashed casing + the explosive shell */
function drawFatManHardware(ctx: CanvasRenderingContext2D, sim: Sim) {
  const gc = implosionGeom(sim)
  const rCase = gc.rHarness + CASE_PAD
  // the bomb casing, dashed like Little Boy's barrel and Tsar's casing
  // (Fat Man's real case was egg-shaped: drawn a little wider than tall)
  strokeCasing(ctx, () => ctx.ellipse(sim.cx, CY, rCase * 1.12, rCase, 0, 0, Math.PI * 2))
  drawImplosionHardware(ctx, sim)
  // labels in the shared scheme: casing name small on top, part names in
  // amber — names only (what happens is told in the story panel)
  if (sim.phase === 'armed' || sim.phase === 'countdown') {
    label(ctx, 'bomb casing', sim.cx, CY - rCase - CASE_LABEL_DY, AMBER_SOFT, 11)
    label(ctx, 'explosive', sim.cx - ((gc.rIn + gc.rOut) / 2) * 0.8, CY + rCase + PART_LABEL_DY)
    label(ctx, 'plutonium ball', sim.cx + ((gc.rIn + gc.rOut) / 2) * 0.3, CY + rCase + PART_LABEL_DY)
  }
  if (!(sim.phase === 'armed' || sim.phase === 'countdown')) return
  // the firing unit stands outside the casing, wired to the ring
  const unit = drawFiringUnit(ctx, sim, Math.max(4, sim.cx - rCase * 1.12 - UNIT_GAP - BOX_W), UNIT_Y)
  const a = Math.PI * 0.9
  const end = { x: sim.cx + Math.cos(a) * gc.rHarness, y: CY + Math.sin(a) * gc.rHarness }
  drawWire(ctx, sim, unit.right, { x: (unit.right.x + end.x) / 2 + 10, y: unit.right.y }, end)
}

/** where the realistic blasts go off (drawn above the nuclei) */
function drawExplosiveBlasts(ctx: CanvasRenderingContext2D, sim: Sim) {
  if (sim.blastT === null || sim.blastT >= BLAST_LIFE) return
  if (sim.mode === 'gun') {
    const { px, pw } = gunCharge(sim)
    drawRealBlast(ctx, px + pw / 2, CY, Math.min(150, RC * 1.15), sim.blastT)
  } else if (isImplosion(sim.mode)) {
    // the whole shell goes off at once: blasts all the way round
    const g = implosionGeom(sim)
    const rMid = (g.rIn + g.rOut) / 2
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.25) / 8) * Math.PI * 2
      drawRealBlast(
        ctx,
        sim.cx + Math.cos(a) * rMid,
        CY + Math.sin(a) * rMid,
        C * 4.4,
        sim.blastT,
        { lite: true, rot: a },
      )
    }
  }
}

const VIOLET = '167, 139, 250' // gamma / X-ray family (visual language)

function drawTsarHardware(ctx: CanvasRenderingContext2D, sim: Sim) {
  const g = implosionGeom(sim)
  const rF = fuelRadius(sim)
  const left = sim.cx - g.rHarness - CASE_PAD
  const right = FUEL_CX + rF + CASE_PAD
  const top = CY - Math.max(g.rHarness, rF) - CASE_PAD
  const bottom = CY + Math.max(g.rHarness, rF) + CASE_PAD
  // X-rays flood the casing: violet glow + ripples racing to the fuel
  const xr = sim.phase === 'xray' ? clamp01(sim.phaseT / 0.4) : sim.phase === 'fusion' ? 1 - clamp01(sim.phaseT / 1.2) : 0
  if (xr > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(left, top, right - left, bottom - top, CASE_R)
    ctx.clip()
    ctx.fillStyle = `rgba(${VIOLET}, ${0.16 * xr})`
    ctx.fillRect(left, top, right - left, bottom - top)
    const reach = right - sim.cx
    for (let i = 0; i < 4; i++) {
      const f = (sim.phaseT * 1.4 + i / 4) % 1
      ctx.strokeStyle = `rgba(${VIOLET}, ${0.85 * (1 - f) * xr})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(sim.cx, CY, g.rc * 0.6 + f * reach, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()
    }
    ctx.restore()
  }
  strokeCasing(ctx, () => ctx.roundRect(left, top, right - left, bottom - top, CASE_R))
  // stage 1 is a small implosion bomb: same explosive shell as Fat Man
  drawImplosionHardware(ctx, sim)
  if (sim.phase === 'armed' || sim.phase === 'countdown') {
    const unit = drawFiringUnit(ctx, sim, Math.max(4, left - UNIT_GAP - BOX_W), UNIT_Y)
    const a = Math.PI * 0.9
    const end = { x: sim.cx + Math.cos(a) * g.rHarness, y: CY + Math.sin(a) * g.rHarness }
    drawWire(ctx, sim, unit.right, { x: (unit.right.x + end.x) / 2 + 10, y: unit.right.y }, end)
  }
  // the burning fuel glows hot
  if (sim.phase === 'fusion' || sim.phase === 'chainDone') {
    const k = sim.phase === 'fusion' ? clamp01(sim.phaseT / FUSION_SWEEP) : 1
    const r = rF * FUEL_SQUEEZE * 1.25
    const gr = ctx.createRadialGradient(FUEL_CX, CY, 0, FUEL_CX, CY, r)
    gr.addColorStop(0, `rgba(255, 250, 220, ${0.55 * k})`)
    gr.addColorStop(0.6, `rgba(253, 186, 116, ${0.35 * k})`)
    gr.addColorStop(1, 'rgba(251, 146, 60, 0)')
    ctx.fillStyle = gr
    ctx.beginPath()
    ctx.arc(FUEL_CX, CY, r, 0, Math.PI * 2)
    ctx.fill()
  }
  if (sim.phase === 'xray') {
    // squeeze arrows on the fuel
    const p = clamp01(sim.phaseT / XRAY_T)
    const rr = rF * (1 - (1 - FUEL_SQUEEZE) * easeIn(p))
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8
      arrow(
        ctx,
        FUEL_CX + Math.cos(a) * (rr + 40),
        CY + Math.sin(a) * (rr + 40),
        FUEL_CX + Math.cos(a) * (rr + 6),
        CY + Math.sin(a) * (rr + 6),
      )
    }
  }
  if (sim.phase === 'armed' || sim.phase === 'countdown') {
    label(ctx, 'hydrogen bomb casing', (left + right) / 2, top - CASE_LABEL_DY, AMBER_SOFT, 11)
    label(ctx, 'explosive', sim.cx - ((g.rIn + g.rOut) / 2) * 0.8, bottom + PART_LABEL_DY)
    label(ctx, 'stage 1: trigger', sim.cx + ((g.rIn + g.rOut) / 2) * 0.3, bottom + PART_LABEL_DY)
    label(ctx, 'stage 2: hydrogen fuel', FUEL_CX, bottom + PART_LABEL_DY)
  }
}

function drawFuel(ctx: CanvasRenderingContext2D, sim: Sim, now: number) {
  const s = getSprites()
  const heat = fuelHeat(sim)
  const t = now / 1000
  const sep = NUC_R * 0.85
  for (const fp of sim.fuel) {
    if (fp.state === 'fused') {
      blit(ctx, s.helium, fp.x, fp.y)
      continue
    }
    const c = pairCenter(sim, fp)
    // cold hydrogen fuel is made of atoms (one electron shell each); the
    // X-ray heat strips the electrons off, so the rings fade as it heats up
    blit(ctx, s.ringH, c.x, c.y, 1 - heat)
    const jig = 0.4 + heat * 2.6 + (fp.state === 'merging' ? 2 : 0)
    const speed = 3 + heat * 14
    const m = fp.state === 'merging' ? easeIn(clamp01(fp.t / MERGE_T)) : 0
    const d = sep * (1 - m)
    const ox = Math.cos(fp.a) * d
    const oy = Math.sin(fp.a) * d
    blit(
      ctx,
      s.deuterium,
      c.x - ox + Math.sin(t * speed + fp.wob) * jig,
      c.y - oy + Math.cos(t * speed * 1.13 + fp.wob) * jig,
    )
    blit(
      ctx,
      s.tritium,
      c.x + ox + Math.cos(t * speed * 0.91 + fp.wob) * jig,
      c.y + oy + Math.sin(t * speed * 1.07 + fp.wob) * jig,
    )
  }
}

function drawNuclear(ctx: CanvasRenderingContext2D, sim: Sim, now: number) {
  const s = getSprites()
  if (sim.mode === 'tsar') drawTsarHardware(ctx, sim)
  if (sim.mode === 'gun') drawGunHardware(ctx, sim)
  if (sim.mode === 'implosion') drawFatManHardware(ctx, sim)
  // bursts (energy flash of each split) under the particles
  for (const b of sim.bursts) {
    const k = b.age / 0.5
    const r = NUC_R * (1.2 + 3 * k)
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r)
    g.addColorStop(0, `rgba(255, 250, 220, ${0.9 * (1 - k)})`)
    g.addColorStop(0.5, `rgba(253, 186, 116, ${0.5 * (1 - k)})`)
    g.addColorStop(1, 'rgba(251, 146, 60, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const t = now / 1000
  // electron shells first, so every nucleus sits on top of its rings
  for (const nu of sim.nuclei) {
    if (nu.state !== 'split') blit(ctx, s.rings, nu.x, nu.y)
  }
  for (const f of sim.fragments) {
    blit(ctx, s.ringsSmall, f.x, f.y, 1 - f.age / 1.8)
  }
  for (const nu of sim.nuclei) {
    if (nu.state === 'whole') {
      const j = 0.5
      blit(ctx, s.nucleus, nu.x + Math.sin(t * 3.1 + nu.wob) * j, nu.y + Math.cos(t * 2.7 + nu.wob) * j)
    } else if (nu.state === 'excited') {
      // the hit nucleus wobbles and stretches into a peanut before splitting
      const e = clamp01(nu.t / EXCITE_T)
      ctx.save()
      ctx.translate(nu.x, nu.y)
      ctx.rotate(nu.axis)
      const wobble = Math.sin(nu.t * 60) * 0.06
      ctx.scale(1 + 0.55 * e + wobble, 1 - 0.25 * e - wobble)
      blit(ctx, s.nucleus, 0, 0)
      ctx.restore()
    }
  }
  for (const f of sim.fragments) {
    blit(ctx, f.big ? s.fragBig : s.fragSmall, f.x, f.y, 1 - f.age / 1.8)
  }
  if (sim.mode === 'tsar') drawFuel(ctx, sim, now)
  // explosives going off, on top of everything near them
  drawExplosiveBlasts(ctx, sim)
  for (const ne of sim.neutrons) {
    // a short trail tells free neutrons apart from the nucleons
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
    ctx.lineWidth = PR * 1.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(ne.x, ne.y)
    ctx.lineTo(ne.x - ne.vx * 0.09, ne.y - ne.vy * 0.09)
    ctx.stroke()
    blit(ctx, s.neutron, ne.x, ne.y)
  }

  if (sim.phase === 'countdown') {
    const n = 3 - Math.floor(sim.phaseT / COUNTDOWN_STEP)
    const k = (sim.phaseT % COUNTDOWN_STEP) / COUNTDOWN_STEP
    ctx.font = `bold ${Math.round(110 + 40 * k)}px ui-sans-serif, system-ui, sans-serif`
    ctx.fillStyle = `rgba(248, 250, 252, ${0.85 * (1 - k)})`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(Math.max(1, n)), CX, CY)
  }
  // white-out just before the cut to the explosion
  if (sim.phase === 'chainDone' && sim.phaseT > 1.6) {
    ctx.fillStyle = `rgba(255, 255, 255, ${clamp01((sim.phaseT - 1.6) / 0.6)})`
    ctx.fillRect(0, 0, W, H)
  }
}

// ---------- drawing: human scale (stylized, not to scale) ----------

// deterministic puffs for the cloud cap (angle, distance, size)
const PUFFS: Array<[number, number, number]> = Array.from({ length: 18 }, (_, i) => {
  const r = Math.sin(i * 12.9898) * 43758.5453
  const f = r - Math.floor(r)
  return [Math.PI + (i / 17) * Math.PI + (f - 0.5) * 0.2, 0.75 + f * 0.3, 0.32 + f * 0.18]
})

function cloudColor(heat: number, alpha: number): string {
  // heat 1 → white-hot, 0 → cold grey-brown smoke
  const stops: Array<[number, [number, number, number]]> = [
    [0, [128, 110, 100]],
    [0.25, [170, 95, 65]],
    [0.5, [240, 135, 55]],
    [0.75, [255, 215, 120]],
    [1, [255, 252, 235]],
  ]
  const h = clamp01(heat)
  let i = 0
  while (i < stops.length - 2 && h > stops[i + 1][0]) i++
  const [h0, c0] = stops[i]
  const [h1, c1] = stops[i + 1]
  const k = (h - h0) / (h1 - h0)
  const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k))
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`
}

// ---------- the damage map (to scale) ----------
// The settled mushroom's height is pinned to the real cloud-top height, which
// fixes a px-per-km scale; the damage rings on the ground use the SAME
// scale, so the affected area and the cloud are honestly comparable. (At
// this scale a house is a fraction of a pixel — that's why no houses are
// drawn: the rings are the town map.) The early fireball is NOT to scale.

export const ZONE_STYLE: Record<DamageZoneId, { fill: string; edge: string }> = {
  heavy: { fill: 'rgba(127, 29, 29, 0.55)', edge: 'rgba(248, 113, 113, 0.95)' },
  houses: { fill: 'rgba(220, 38, 38, 0.35)', edge: 'rgba(252, 165, 165, 0.9)' },
  burns: { fill: 'rgba(234, 88, 12, 0.28)', edge: 'rgba(253, 186, 116, 0.9)' },
  windows: { fill: 'rgba(234, 179, 8, 0.16)', edge: 'rgba(253, 224, 71, 0.85)' },
}

/** px per km for this design's scene (cloud top pinned to its real height) */
function sceneScale(mode: BombDesignId, GY: number, RMAX: number, E: number) {
  const cloudTopPx = 0.18 * RMAX + 40 * E // where the settled cap's top ends up
  return (GY - cloudTopPx) / (CLOUD_TOP_KM[mode] ?? 18)
}

function drawDamageMap(
  ctx: CanvasRenderingContext2D,
  mode: BombDesignId,
  t: number,
  GY: number,
  pxPerKm: number,
  rs: number,
  part: 'rings' | 'legend',
) {
  const zones = damageZones(mode)
  // the shock wave "paints" each zone as it passes it
  const shown = zones.map((z) => clamp01((rs - z.km * pxPerKm) / 120 + 0.001) * clamp01((t - 0.5) / 0.3))
  if (part === 'rings') {
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, GY, W, H - GY)
  ctx.clip()
  // outermost first so inner (worse) zones sit on top
  for (let i = zones.length - 1; i >= 0; i--) {
    const a = shown[i]
    if (a <= 0) continue
    const rx = zones[i].km * pxPerKm
    const st = ZONE_STYLE[zones[i].id]
    ctx.globalAlpha = a
    ctx.fillStyle = st.fill
    ctx.beginPath()
    ctx.ellipse(CX, GY, rx, Math.max(4, rx * 0.12), 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = st.edge
    ctx.lineWidth = 1.5
    ctx.setLineDash(zones[i].id === 'windows' ? [6, 5] : [])
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.restore()
  return
  }

  // the legend lives in the info panel; the canvas keeps only a scale bar
  if (t < 1.2) return
  const unit = pxPerKm > 20 ? 1 : 10
  const x0 = 16
  const by = H - 18
  ctx.save()
  ctx.globalAlpha = clamp01((t - 1.2) / 0.5)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x0, by - 5)
  ctx.lineTo(x0, by)
  ctx.lineTo(x0 + unit * pxPerKm, by)
  ctx.lineTo(x0 + unit * pxPerKm, by - 5)
  ctx.stroke()
  label(ctx, `${unit} km`, x0 + 8 + unit * pxPerKm, by - 3, 'rgba(226, 232, 240, 0.95)', 11, 'left')
  ctx.restore()
}

/** km ruler up the right edge: the cloud height on the same scale */
function drawHeightRuler(ctx: CanvasRenderingContext2D, mode: BombDesignId, t: number, GY: number, pxPerKm: number) {
  const a = clamp01((t - 4) / 0.8)
  if (a <= 0) return
  const top = CLOUD_TOP_KM[mode] ?? 18
  const step = top > 30 ? 10 : 5
  const x = W - 22
  ctx.save()
  ctx.globalAlpha = a
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x, GY)
  ctx.lineTo(x, GY - top * pxPerKm)
  ctx.stroke()
  for (let km = 0; km <= top; km += step) {
    const y = GY - km * pxPerKm
    ctx.beginPath()
    ctx.moveTo(x - 6, y)
    ctx.lineTo(x, y)
    ctx.stroke()
    label(ctx, `${km}`, x - 9, y, 'rgba(203, 213, 225, 0.85)', 10, 'right')
  }
  label(ctx, 'km', x, GY - top * pxPerKm - 12, 'rgba(203, 213, 225, 0.85)', 10)
  // the real cloud-top height
  const ty = GY - top * pxPerKm
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(x - 6, ty)
  ctx.lineTo(x - 70, ty)
  ctx.stroke()
  ctx.setLineDash([])
  label(ctx, `cloud top ≈ ${top} km`, x - 74, ty, 'rgba(226, 232, 240, 0.95)', 11, 'right')
  ctx.restore()
}

// ---------- the explosion, then the size comparison ----------
// Timeline (s since the flash): fireball → shock wave → dust stem →
// mushroom cloud (settled by ~6 s) → at COMPARE_T the camera zooms out and
// the scene becomes a side-by-side size comparison of all three bombs, on
// ONE shared km scale (cloud heights + "houses flattened" rings). Scene
// labels fade out, the bomb names fade in. Captions live in the info panel.

export const COMPARE_T = 8.5
const COMPARE_DUR = 1.8
// then, after time to read the comparison, back to the lineup chooser
const END_T = COMPARE_T + COMPARE_DUR + 10
const END_FADE = 1.2

const COMPARED: BombDesignId[] = ['gun', 'implosion', 'tsar']

/** which caption the info panel shows (0 fireball … 4 comparison) */
export function explosionStep(t: number): number {
  if (t < 0.9) return 0
  if (t < 3.3) return 1
  if (t < 4.6) return 2
  if (t < COMPARE_T) return 3
  return 4
}

interface Geo {
  E: number
  GY: number
  RMAX: number
  pxPerKm: number
}
function geo(mode: BombDesignId): Geo {
  const E = Math.min(W, H) / 800
  const GY = H * 0.8
  const RMAX = Math.min(W, H) * (mode === 'tsar' ? 0.21 : 0.15)
  return { E, GY, RMAX, pxPerKm: sceneScale(mode, GY, RMAX, E) }
}
/** half-width of a settled cloud in its own scene, px */
const capHalf = (g: Geo) => g.RMAX * 1.95

/** shared comparison scale (px/km) + where each cloud stands */
function compareLayout() {
  const gt = geo('tsar')
  const margin = 14
  // Tsar's cloud is the widest: fit it in the right part of the canvas
  const pxPerKm = Math.min(gt.pxPerKm, ((W * 0.62) / 2 / capHalf(gt)) * gt.pxPerKm)
  const fT = pxPerKm / gt.pxPerKm
  const tsarX = W - margin - capHalf(gt) * fT
  const leftEnd = tsarX - capHalf(gt) * fT
  return {
    pxPerKm,
    x: { gun: leftEnd * 0.3, implosion: leftEnd * 0.72, tsar: tsarX } as Record<string, number>,
  }
}

function drawSky(ctx: CanvasRenderingContext2D, t: number) {
  const { E, GY } = geo('gun')
  const glow = Math.exp(-t / 3)
  const sky = ctx.createLinearGradient(0, 0, 0, GY)
  sky.addColorStop(0, '#0b1120')
  sky.addColorStop(1, `rgb(${Math.round(30 + 140 * glow)}, ${Math.round(41 + 60 * glow)}, ${Math.round(59 + 10 * glow)})`)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, GY)
  ctx.fillStyle = `rgb(${Math.round(30 + 50 * glow)}, ${Math.round(27 + 25 * glow)}, ${Math.round(36 + 10 * glow)})`
  ctx.beginPath()
  ctx.moveTo(0, GY)
  const peaks = [0.06, 0.12, 0.2, 0.3, 0.42, 0.55, 0.68, 0.8, 0.9, 1]
  peaks.forEach((px, i) => ctx.lineTo(W * px, GY - (i % 2 ? 26 : 12) * E - (i % 3) * 8 * E))
  ctx.lineTo(W, GY)
  ctx.fill()
  const ground = ctx.createLinearGradient(0, GY, 0, H)
  ground.addColorStop(0, `rgb(${Math.round(70 + 90 * glow)}, ${Math.round(55 + 45 * glow)}, ${Math.round(42 + 10 * glow)})`)
  ground.addColorStop(1, '#17120e')
  ctx.fillStyle = ground
  ctx.fillRect(0, GY, W, H - GY)
}

/** fireball → mushroom of ONE bomb, drawn around ground zero (CX, GY) in
 *  its own scene scale. `rings` = alpha of its damage rings. */
function drawCloud(ctx: CanvasRenderingContext2D, t: number, mode: BombDesignId, rings: number) {
  const { E, GY, RMAX, pxPerKm } = geo(mode)
  const heat = Math.exp(-t / 1.8)
  const R = RMAX * (1 - Math.exp(-t / 0.35))
  const riseMax = GY - RMAX * 2.1 - 40 * E
  const rise = Math.min(riseMax, t < 0.9 ? 0 : Math.pow(t - 0.9, 1.25) * 70 * E)
  const k = clamp01((t - 1.8) / 4)
  const rx = R * (1 + 0.55 * k)
  const ry = R * (1 - 0.3 * k)
  const fx = CX
  const fy = GY - R * 0.82 - rise

  const rs = 480 * E * t
  if (rings > 0) {
    ctx.save()
    ctx.globalAlpha *= rings
    drawDamageMap(ctx, mode, t, GY, pxPerKm, rs, 'rings')
    ctx.restore()
  }
  // shock wave: a dome of squeezed air racing outward along the ground
  if (rs > R && rs < W * 0.9) {
    const a = 0.55 * (1 - rs / (W * 0.9))
    ctx.strokeStyle = `rgba(241, 245, 249, ${a})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(CX, GY, rs, Math.PI, 2 * Math.PI)
    ctx.stroke()
    ctx.fillStyle = `rgba(241, 245, 249, ${a * 0.12})`
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(CX, GY, rs, rs * 0.06, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  // dust kicked up where the shock wave passed
  if (t > 0.4) {
    const dw = Math.min(W * 0.55, 480 * E * (t - 0.3) * 0.6)
    const da = 0.55 * clamp01((t - 0.4) / 1.5)
    const g = ctx.createRadialGradient(CX, GY, 0, CX, GY, dw)
    g.addColorStop(0, `rgba(140, 112, 88, ${da})`)
    g.addColorStop(1, 'rgba(140, 112, 88, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(CX, GY, dw, 34 * E + dw * 0.1, 0, Math.PI, 2 * Math.PI)
    ctx.fill()
  }
  // stem: the rising fireball sucks a column of dust up behind it
  if (t > 1.1) {
    const sa = clamp01((t - 1.1) / 1.5)
    const topY = fy + ry * 0.4
    const wTop = rx * 0.16
    const wBot = rx * 0.26
    const g = ctx.createLinearGradient(0, GY, 0, topY)
    g.addColorStop(0, `rgba(120, 98, 80, ${0.9 * sa})`)
    g.addColorStop(1, cloudColor(heat * 0.7, 0.9 * sa))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(CX - wBot, GY)
    ctx.quadraticCurveTo(CX - wTop * 0.6, (GY + topY) / 2, CX - wTop, topY)
    ctx.lineTo(CX + wTop, topY)
    ctx.quadraticCurveTo(CX + wTop * 0.6, (GY + topY) / 2, CX + wBot, GY)
    ctx.closePath()
    ctx.fill()
  }
  // the fireball / cap body
  const body = ctx.createRadialGradient(fx, fy - ry * 0.2, 0, fx, fy, Math.max(rx, 1) * 1.1)
  body.addColorStop(0, cloudColor(heat * 1.2 + 0.1, 1))
  body.addColorStop(0.6, cloudColor(heat * 0.9, 0.95))
  body.addColorStop(1, cloudColor(heat * 0.6, 0))
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.ellipse(fx, fy, Math.max(rx * 1.1, 1), Math.max(ry * 1.1, 1), 0, 0, Math.PI * 2)
  ctx.fill()
  // billowing puffs along the top of the cap
  if (t > 0.6) {
    const pa = clamp01((t - 0.6) / 1.2)
    for (const [ang, dist, size] of PUFFS) {
      const px = fx + Math.cos(ang) * rx * dist
      const py = fy + Math.sin(ang) * ry * dist + ry * 0.15
      const pr = R * size * (1 + 0.04 * Math.sin(t * 0.8 + ang * 5))
      const g = ctx.createRadialGradient(px, py - pr * 0.3, 0, px, py, pr)
      g.addColorStop(0, cloudColor(heat * 1.05, 0.9 * pa))
      g.addColorStop(1, cloudColor(heat * 0.7, 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(px, py, pr, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  // the rolling ring under the cap (the "doughnut" of the mushroom)
  if (k > 0.2) {
    ctx.fillStyle = cloudColor(heat * 0.55, 0.55 * clamp01((k - 0.2) / 0.4))
    ctx.beginPath()
    ctx.ellipse(fx, fy + ry * 0.62, rx * 0.85, ry * 0.26, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** "houses flattened" ring on the shared comparison scale */
function drawCompareRing(ctx: CanvasRenderingContext2D, x: number, GY: number, pxPerKm: number, mode: BombDesignId) {
  const z = damageZones(mode).find((d) => d.id === 'houses')
  if (!z) return
  const rx = Math.max(3, z.km * pxPerKm)
  const st = ZONE_STYLE.houses
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, GY, W, H - GY)
  ctx.clip()
  ctx.fillStyle = st.fill
  ctx.strokeStyle = st.edge
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(x, GY, rx, Math.max(3, rx * 0.12), 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawExplosion(ctx: CanvasRenderingContext2D, t: number, mode: BombDesignId) {
  drawSky(ctx, t)
  const own = geo(mode)
  const cmp = compareLayout()
  const c = easeInOut(clamp01((t - COMPARE_T) / COMPARE_DUR))
  const comparing = c > 0
  const GY = own.GY

  // the other two bombs fade in at their places
  if (comparing) {
    for (const m of COMPARED) {
      if (m === mode) continue
      const f = cmp.pxPerKm / geo(m).pxPerKm
      ctx.save()
      ctx.globalAlpha = c
      ctx.translate(cmp.x[m], GY)
      ctx.scale(f, f)
      ctx.translate(-CX, -GY)
      drawCloud(ctx, t, m, 0)
      ctx.restore()
    }
  }
  // this bomb's cloud zooms out and slides to its place
  const f = comparing ? 1 + (cmp.pxPerKm / own.pxPerKm - 1) * c : 1
  const x = comparing ? CX + (cmp.x[mode] - CX) * c : CX
  ctx.save()
  ctx.translate(x, GY)
  ctx.scale(f, f)
  ctx.translate(-CX, -GY)
  drawCloud(ctx, t, mode, 1 - c)
  ctx.restore()

  // scene scale bar + height ruler fade out as the comparison comes in
  if (c < 1) {
    ctx.save()
    ctx.globalAlpha = 1 - c
    drawDamageMap(ctx, mode, t, GY, own.pxPerKm, 480 * own.E * t, 'legend')
    drawHeightRuler(ctx, mode, t, GY, own.pxPerKm)
    ctx.restore()
  }
  if (comparing) {
    ctx.save()
    ctx.globalAlpha = c
    for (const m of COMPARED) {
      const cx = cmp.x[m]
      drawCompareRing(ctx, cx, GY, cmp.pxPerKm, m)
      const d = BOMB_DESIGNS[m]
      const name = d.label.replace(/^\S+\s/, '')
      label(ctx, name, cx, GY + 30, m === mode ? AMBER : 'rgba(241, 245, 249, 0.98)', 16)
      label(
        ctx,
        `${yieldText(m, 'short')} · cloud ${CLOUD_TOP_KM[m]} km`,
        cx,
        GY + 50,
        'rgba(203, 213, 225, 0.9)',
        12,
      )
    }
    ctx.restore()
  }

  // the flash
  if (t < 0.6) {
    ctx.fillStyle = `rgba(255, 255, 255, ${1 - t / 0.6})`
    ctx.fillRect(0, 0, W, H)
  }
  const back = easeInOut(clamp01((t - (END_T - END_FADE)) / END_FADE))
  if (back > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${back})`
    ctx.fillRect(0, 0, W, H)
    drawLineup(ctx, W, H - BUTTON_ZONE, undefined, back)
  }
}

// ---------- the real-shape view ----------
// Every run starts OUTSIDE: the bomb's real outline at real proportions,
// with a grown-up for scale, and the whole inside diagram shrunk into the
// part of the body where it really sits (dashed casing + part names
// hidden). DETONATE zooms in: the outline fades, the diagram grows to fill
// the canvas and its casing and part names fade back in.

/** the diagram's anchor (its casing centre) and how far it reaches */
function diagramBox(sim: Sim) {
  if (sim.mode === 'gun') {
    const left = sim.cx - RC - GUN_GAP - 80
    const right = sim.cx + RC + CASE_PAD
    const x0 = Math.max(4, left - UNIT_GAP - BOX_W)
    const ax = (left + right) / 2
    return { ax, ay: CY, left: ax - x0, right: right - ax, half: RC + CASE_PAD }
  }
  const g = implosionGeom(sim)
  if (sim.mode === 'implosion') {
    const rCase = g.rHarness + CASE_PAD
    const x0 = Math.max(4, sim.cx - rCase * 1.12 - UNIT_GAP - BOX_W)
    return { ax: sim.cx, ay: CY, left: sim.cx - x0, right: rCase * 1.12, half: rCase }
  }
  const rF = fuelRadius(sim)
  const left = sim.cx - g.rHarness - CASE_PAD
  const right = FUEL_CX + rF + CASE_PAD
  const x0 = Math.max(4, left - UNIT_GAP - BOX_W)
  const ax = (left + right) / 2
  return { ax, ay: CY, left: ax - x0, right: right - ax, half: Math.max(g.rHarness, rF) + CASE_PAD }
}

/** the bomb outline at (x0 = tail, y0 = axis, ppm), with the inside
 *  diagram shrunk into it. `u`: 1 = fully outside … 0 = zoomed inside
 *  (the diagram has grown back to fill the canvas). `inner` fades the
 *  diagram itself (the intro brings it in late). */
function drawOutlineWithInside(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  now: number,
  x0: number,
  y0: number,
  ppm: number,
  u: number,
  inner = 1,
) {
  const mode = sim.mode
  const cargo = CARGO_M[mode]
  const box = diagramBox(sim)
  // shrink so the whole diagram fits the cargo part of the body
  const k = Math.min(
    (cargo.halfW * ppm) / Math.max(box.left, box.right),
    (cargo.halfH * ppm) / box.half,
  )
  const tx = x0 + cargo.cx * ppm
  const kk = 1 + (k - 1) * u
  ctx.save()
  ctx.globalAlpha = u
  fillBomb(ctx, mode, x0, y0, ppm)
  ctx.restore()
  if (inner > 0) {
    ctx.save()
    ctx.globalAlpha = inner
    ctx.translate(box.ax + (tx - box.ax) * u, box.ay + (y0 - box.ay) * u)
    ctx.scale(kk, kk)
    ctx.translate(-box.ax, -box.ay)
    chromeAlpha = 1 - clamp01(u / 0.6)
    drawNuclear(ctx, sim, now)
    chromeAlpha = 1
    ctx.restore()
  }
  ctx.save()
  ctx.globalAlpha = u
  strokeBomb(ctx, mode, x0, y0, ppm)
  ctx.restore()
}

// The opening: the bomb picked in the lineup chooser glides + grows into
// its own "grown-up next to the bomb" view while the others fade away; its
// inside diagram fades in last. Then READY_HOLD s to look at the real bomb,
// the zoom inside (ZOOM_IN_T), a short break (ZOOM_BREAK) so kids see the
// new view — and only then the countdown starts (auto-play, no DETONATE).
const INTRO_HOLD = 0.25
const INTRO_ZOOM = 1.8
const INTRO_TOTAL = INTRO_HOLD + INTRO_ZOOM
const READY_HOLD = 5
const ZOOM_IN_AT = INTRO_TOTAL + READY_HOLD
const ZOOM_IN_T = 1.2
const INSIDE_AT = ZOOM_IN_AT + ZOOM_IN_T
const ZOOM_BREAK = 0.8
const COUNTDOWN_AT = INSIDE_AT + ZOOM_BREAK

/** 1 = the real outside shape … 0 = zoomed inside (follows the sim clock,
 *  so pausing, rewinding and fast-forwarding stay in step) */
function outsideAmount(sim: Sim): number {
  if (sim.phase !== 'armed') return 0
  return 1 - easeInOut(clamp01((sim.introT - ZOOM_IN_AT) / ZOOM_IN_T))
}

/** the lineup chooser rows in canvas px (for the click targets over it) */
export function chooserRows() {
  const L = lineupLayout(W, H - BUTTON_ZONE)
  const right = L.x0 + L.right * L.ppm
  return (Object.keys(L.rows) as BombDesignId[]).map((m) => ({
    mode: m,
    left: L.x0 - 14,
    right: right + 14,
    top: L.rows[m].nameY - 16,
    bottom: L.rows[m].groundY + 8,
  }))
}

function drawIntro(ctx: CanvasRenderingContext2D, sim: Sim, now: number) {
  const mode = sim.mode
  const usableH = H - BUTTON_ZONE
  const z = easeInOut(clamp01((sim.introT - INTRO_HOLD) / INTRO_ZOOM))
  const L = lineupLayout(W, usableH)
  const R = realShapeLayout(mode, W, usableH)
  drawLineup(ctx, W, usableH, mode, 1 - z, mode)
  // this bomb: from its lineup row to its own view
  const ppm = L.ppm * Math.pow(R.ppm / L.ppm, z) // even-feeling zoom
  const x0 = L.x0 + (R.x0 - L.x0) * z
  const y0 = L.rows[mode].axisY + (R.y0 - L.rows[mode].axisY) * z
  drawOutlineWithInside(ctx, sim, now, x0, y0, ppm, 1, clamp01((z - 0.55) / 0.45))
  ctx.save()
  ctx.globalAlpha = 1 - clamp01(z / 0.5)
  drawFuelBall(ctx, mode, x0, y0, ppm)
  ctx.restore()
  drawRealShapeExtras(ctx, mode, R, clamp01((z - 0.6) / 0.4))
}

/** draw the bomb, `u` = 0 inside diagram … 1 real shape */
function drawBombView(ctx: CanvasRenderingContext2D, sim: Sim, now: number, u: number) {
  if (sim.phase === 'armed' && sim.introT < INTRO_TOTAL) {
    drawIntro(ctx, sim, now)
    return
  }
  if (u <= 0) {
    drawNuclear(ctx, sim, now)
    return
  }
  const lay = realShapeLayout(sim.mode, W, H - BUTTON_ZONE)
  drawOutlineWithInside(ctx, sim, now, lay.x0, lay.y0, lay.ppm, u)
  drawRealShapeExtras(ctx, sim.mode, lay, clamp01((u - 0.5) / 0.5))
}

// ---------- the story timeline ----------
// Every run is a sequence of named story steps. The UI lists them as a
// timeline; the stage snapshots its whole state when a step begins, so a
// click on a past step rewinds to that exact moment, and a click on a future
// step fast-forwards the simulation to it.

const EXPLOSION_STEPS = 5

/** the ordered story steps of one design */
export function storyOrder(mode: BombDesignId): string[] {
  const close = Array.from({ length: CLOSEUP_STEP_COUNT }, (_, i) => `closeup${i}`)
  const boom = Array.from({ length: EXPLOSION_STEPS }, (_, i) => `explosion${i}`)
  return [
    'intro',
    'armed',
    'countdown',
    'assembling',
    'chain',
    ...close,
    'chainAfter',
    ...(mode === 'tsar' ? ['xray', 'fusion'] : []),
    'chainDone',
    ...boom,
  ]
}

/** which story step the sim is in right now */
function storyId(sim: Sim): string {
  switch (sim.phase) {
    case 'chain':
      return sim.closeupDone ? 'chainAfter' : 'chain'
    case 'closeup':
      return `closeup${sim.closeup ? closeupStep(sim.closeup.t) : 0}`
    case 'explosion':
      return `explosion${explosionStep(sim.phaseT)}`
    case 'armed':
      return sim.introT < INTRO_TOTAL ? 'intro' : 'armed'
    default:
      return sim.phase
  }
}

// ---------- component ----------

export const FissionStage = memo(function FissionStage({
  mode,
  paused,
  seek,
  active,
  onReport,
  onFinished,
}: {
  /** the bomb being shown; null = the lineup chooser */
  mode: BombDesignId | null
  /** freeze the whole demo (so kids can read the info panel) */
  paused: boolean
  /** jump to a story step (n changes on every click) */
  seek: { id: string; n: number } | null
  active: boolean
  onReport: (r: FissionReport) => void
  /** the run is over (it faded back to the lineup) */
  onFinished: () => void
}) {
  const shapeRef = useRef<Konva.Shape | null>(null)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const onFinishedRef = useRef(onFinished)
  onFinishedRef.current = onFinished
  const finishedSent = useRef(false)
  // build the first sim once (not on every render)
  const [firstSim] = useState(() => buildSim(mode ?? 'gun'))
  const sim = useRef<Sim>(firstSim)
  const lastSig = useRef('')
  const onReportRef = useRef(onReport)
  onReportRef.current = onReport
  // state at the start of each story step (for rewinding)
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
    const r: FissionReport = {
      phase: s.phase,
      splits: s.splits,
      total: s.nuclei.length,
      escaped: s.escaped,
      generation: s.generation,
      countdown: s.phase === 'countdown' ? Math.max(1, 3 - Math.floor(s.phaseT / COUNTDOWN_STEP)) : 0,
      fusions: s.fusions,
      fuelTotal: s.fuel.length,
      closeupStep: s.closeup ? closeupStep(s.closeup.t) : 0,
      explosionStep: s.phase === 'explosion' ? explosionStep(s.phaseT) : 0,
      storyId: storyId(s),
      aftermath: s.phase === 'explosion' && s.phaseT > 5,
      intro: s.phase === 'armed' && s.introT < INTRO_TOTAL,
    }
    const sig = `${r.phase}|${r.splits}|${r.escaped}|${r.generation}|${r.countdown}|${r.fusions}|${r.closeupStep}|${r.explosionStep}|${r.storyId}|${r.aftermath}`
    if (sig !== lastSig.current) {
      lastSig.current = sig
      onReportRef.current(r)
    }
  }

  // a bomb picked → fresh bomb, zooming out of the lineup
  useEffect(() => {
    finishedSent.current = false
    snaps.current.clear()
    lastStory.current = ''
    lastSig.current = ''
    if (mode) {
      sim.current = buildSim(mode)
      record()
      report()
    }
    shapeRef.current?.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // timeline click: rewind to a recorded step, or fast-forward to it
  useEffect(() => {
    if (!seek || !mode) return
    const order = storyOrder(mode)
    const ti = order.indexOf(seek.id)
    if (ti < 0) return
    const idx = (id: string) => order.indexOf(id)
    const restore = (id: string) => {
      sim.current = structuredClone(snaps.current.get(id)!)
      lastStory.current = id
      // a rewind starts a fresh future: later snapshots will be re-recorded
      for (const k of [...snaps.current.keys()]) if (idx(k) > idx(id)) snaps.current.delete(k)
    }
    if (snaps.current.has(seek.id)) {
      restore(seek.id)
    } else {
      if (idx(storyId(sim.current)) > ti) {
        // went past it without it ever happening: restart from the latest
        // recorded step before it
        const before = [...snaps.current.keys()].filter((k) => idx(k) < ti).sort((a, b) => idx(b) - idx(a))
        restore(before[0] ?? 'intro')
      }
      // a step after "Ready": skip the rest of the intro, start the countdown
      if (sim.current.phase === 'armed' && ti > idx('armed')) {
        sim.current.introT = COUNTDOWN_AT
        sim.current.phase = 'countdown'
        sim.current.phaseT = 0
        record()
      }
      // fast-forward in fixed steps (a whole chain takes well under 0.1 s)
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
      if (!modeRef.current) return // the chooser: a still picture
      step(sim.current, dt)
      record()
      report()
      const s = sim.current
      if (!finishedSent.current && s.phase === 'explosion' && s.phaseT >= END_T) {
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
            if (!modeRef.current) drawLineup(ctx, W, H - BUTTON_ZONE, undefined, 1)
            else if (s.phase === 'explosion') drawExplosion(ctx, s.phaseT, s.mode)
            else if (s.phase === 'closeup' && s.closeup) {
              // camera zooms into the hit nucleus, then the close view fades in
              const cam = closeupCamera(s.closeup.t)
              const { fx, fy } = s.closeup
              // the focus point glides from where it is to the canvas centre
              // as the zoom grows, so zoom 1 is exactly the normal view (no
              // jump when the close-up starts or ends)
              const u = (cam.zoom - 1) / (CLOSEUP_MAX_ZOOM - 1)
              ctx.save()
              ctx.translate(fx + (W / 2 - fx) * u, fy + (CY - fy) * u)
              ctx.scale(cam.zoom, cam.zoom)
              ctx.translate(-fx, -fy)
              drawNuclear(ctx, s, performance.now())
              ctx.restore()
              if (cam.marker > 0) {
                // amber circle: "this is the atom we zoom into / came from"
                ctx.save()
                ctx.globalAlpha = cam.marker
                ctx.strokeStyle = AMBER
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.arc(fx, fy, C * 2.2, 0, Math.PI * 2)
                ctx.stroke()
                ctx.restore()
              }
              drawCloseup(ctx, s.closeup.t, W, H, cam.sceneAlpha, BOMB_DESIGNS[s.mode].fuel)
            } else drawBombView(ctx, s, performance.now(), outsideAmount(s))
            ctx.restore()
          }}
        />
      </Layer>
    </Stage>
  )
})
