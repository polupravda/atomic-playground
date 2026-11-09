import { drawGlossyParticle } from './particleStyle'
import type { ParticleKind } from '../state/atomStore'
import { shellConfiguration } from '../core/atom'
import type { BombDesign } from '../core/fission'
import { blit, clamp01, easeIn, easeInOut, easeOut, makeCanvasSprite, type Sprite } from './canvasUtil'

// R01 close-up: late in the chain reaction the camera zooms into one nucleus
// that has just been hit, and the canvas cross-fades into a close view drawn
// in the app's shell-view atom language (bonding lab: nucleus + rings +
// spinning glossy electrons, REAL shell configurations from core/atom) and
// the builder's radiation language (violet wavy γ photons).
//
// Slow on purpose: THREE atoms of the bomb's own fuel are hit one after the
// other, so kids see the chain move from atom to atom. Real split pairs:
//   uranium-235 (Little Boy):
//     atoms 1–2: n + ²³⁵U → ²³⁶U → ¹⁴¹Ba + ⁹²Kr + 3 n
//     atom 3:    n + ²³⁵U → ²³⁶U → ¹⁴⁰Xe + ⁹⁴Sr + 2 n
//   plutonium-239 (Fat Man, Tsar Bomba's trigger):
//     atoms 1–2: n + ²³⁹Pu → ²⁴⁰Pu → ¹³⁴Xe + ¹⁰³Zr + 3 n
//     atom 3:    n + ²³⁹Pu → ²⁴⁰Pu → ¹⁴⁴Ba + ⁹⁴Sr + 2 n
// (atom 3 splits differently: heavy nuclei break into many different pairs)
// The camera starts on atom 1, then pans to follow the chain to atoms 2–3.
// Honest simplifications (also in the info panel): nuclei drawn thousands of
// times too big, ~30 nucleons shown instead of 235, the real halves fly off
// as charged ions that lose many electrons.

// Timeline (s), with short BREAKS so kids notice each change of view:
//   hold on the whole bomb, an amber circle marks the atom we zoom into
//   → zoom in → hold on the close view before the action starts
//   → the 3-atom story → hold → zoom out
//   → hold on the whole bomb, the circle shows where we were
const HOLD_IN = 1.0
const ZOOM_T = 1.2
const SCENE_START = HOLD_IN + ZOOM_T + 0.6
const SCENE_LEN = 12.4
const OUT_START = SCENE_START + SCENE_LEN + 0.7
const OUT_END = OUT_START + ZOOM_T
const HOLD_OUT = 1.0
/** total close-up time, holds + zooms + scene */
export const CLOSEUP_TOTAL = OUT_END + HOLD_OUT
export const CLOSEUP_MAX_ZOOM = 9
const MAX_ZOOM = CLOSEUP_MAX_ZOOM


/** Camera for the nuclear view, how visible the close-up scene is, and the
 *  alpha of the amber "this atom" circle drawn around the focus in the
 *  whole-bomb view. */
export function closeupCamera(t: number): { zoom: number; sceneAlpha: number; marker: number } {
  const zIn = clamp01((t - HOLD_IN) / ZOOM_T)
  const zOut = clamp01((t - OUT_START) / ZOOM_T)
  const zoom =
    t < OUT_START
      ? 1 + (MAX_ZOOM - 1) * easeInOut(zIn)
      : 1 + (MAX_ZOOM - 1) * (1 - easeInOut(zOut))
  const fadeIn = clamp01((t - (HOLD_IN + ZOOM_T - 0.35)) / 0.35)
  const fadeOut = clamp01((t - OUT_START) / 0.35)
  const sceneAlpha = t < OUT_START ? fadeIn : 1 - fadeOut
  // circle: blinks during the first hold, fades as the zoom starts; comes
  // back after the zoom-out and fades over the last hold
  const pulse = 0.8 + 0.2 * Math.sin(t * 6)
  const marker =
    t < HOLD_IN + 0.3
      ? pulse * (1 - clamp01((t - HOLD_IN) / 0.3))
      : t >= OUT_END
        ? 1 - clamp01((t - OUT_END) / HOLD_OUT)
        : 0
  return { zoom, sceneAlpha, marker }
}

// ---------- the script ----------

type FragId = 'ba' | 'kr' | 'xe' | 'sr' | 'zr'
const FRAG: Record<FragId, { name: string; symbol: string; protons: number }> = {
  ba: { name: 'barium', symbol: 'Ba', protons: 56 },
  kr: { name: 'krypton', symbol: 'Kr', protons: 36 },
  xe: { name: 'xenon', symbol: 'Xe', protons: 54 },
  sr: { name: 'strontium', symbol: 'Sr', protons: 38 },
  zr: { name: 'zirconium', symbol: 'Zr', protons: 40 },
}

export type CloseupFuel = BombDesign['fuel']

/** how one atom of the fuel splits: the halves (mass numbers) + neutrons */
interface SplitPair {
  heavy: FragId
  heavyA: number
  light: FragId
  lightA: number
  neutrons: number
}

const FUELS: Record<
  CloseupFuel,
  { name: string; symbol: string; protons: number; mass: number; pairs: [SplitPair, SplitPair, SplitPair] }
> = {
  'uranium-235': {
    name: 'uranium',
    symbol: 'U',
    protons: 92,
    mass: 235,
    pairs: [
      { heavy: 'ba', heavyA: 141, light: 'kr', lightA: 92, neutrons: 3 },
      { heavy: 'ba', heavyA: 141, light: 'kr', lightA: 92, neutrons: 3 },
      { heavy: 'xe', heavyA: 140, light: 'sr', lightA: 94, neutrons: 2 },
    ],
  },
  'plutonium-239': {
    name: 'plutonium',
    symbol: 'Pu',
    protons: 94,
    mass: 239,
    pairs: [
      { heavy: 'xe', heavyA: 134, light: 'zr', lightA: 103, neutrons: 3 },
      { heavy: 'xe', heavyA: 134, light: 'zr', lightA: 103, neutrons: 3 },
      { heavy: 'ba', heavyA: 144, light: 'sr', lightA: 94, neutrons: 2 },
    ],
  },
}

/** fuel facts the info panel needs (name, mass number, first split pair) */
export function closeupFuelInfo(fuel: CloseupFuel) {
  const f = FUELS[fuel]
  return { name: f.name, mass: f.mass, firstPair: [FRAG[f.pairs[0].heavy].name, FRAG[f.pairs[0].light].name] }
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const sup = (n: number) => String(n).replace(/\d/g, (d) => SUP[Number(d)])
const cap = (w: string) => w[0].toUpperCase() + w.slice(1)

interface SplitSpec {
  x: number // world position, in units of k
  y: number
  hitT: number // neutron arrives (scene time, s)
  splitT: number
  axis: number // direction the heavier half flies
  /** neutrons freed: angle, or the index of the atom it will hit (the
   *  count matches each fuel's pair: 3, 3, 2) */
  out: Array<{ a: number } | { target: number }>
}

const SPLITS: SplitSpec[] = [
  {
    x: 0,
    y: 0,
    hitT: 2.2,
    splitT: 3.7,
    axis: -Math.PI / 2 - 0.35,
    out: [{ target: 1 }, { a: 0.95 }, { a: Math.PI + 0.45 }],
  },
  {
    x: 330,
    y: -200,
    hitT: 6.0,
    splitT: 7.3,
    axis: -0.4,
    out: [{ target: 2 }, { a: -0.25 }, { a: Math.PI - 0.55 }],
  },
  {
    x: 380,
    y: 210,
    hitT: 9.1,
    splitT: 10.3,
    axis: Math.PI,
    out: [{ a: 0.6 }, { a: -2.4 }],
  },
]
// atoms that are never hit — the rest of the metal
const BYSTANDERS = [
  { x: -310, y: 270 },
  { x: -330, y: -300 },
  { x: 770, y: -190 },
  { x: -40, y: 400 },
]
// camera: on atom 1, then pans to frame atoms 2 and 3 (atom 1's halves
// drift off the left edge)
const CAM_END = {
  x: (SPLITS[1].x + SPLITS[2].x) / 2,
  y: (SPLITS[1].y + SPLITS[2].y) / 2,
}
const PAN_START = SPLITS[0].splitT + 0.4
const PAN_END = SPLITS[1].hitT - 0.6

// ---------- the story steps (ONE source for canvas, timeline + panel) ----------

// a step ends when the scene reaches this time (s); the last never ends
const STEP_ENDS = [
  SPLITS[0].hitT, // 0 a neutron flies in
  SPLITS[0].splitT, // 1 the nucleus wobbles
  SPLITS[1].hitT, // 2 split!
  SPLITS[1].splitT, // 3 atom 2 is hit
  SPLITS[2].splitT, // 4 atom 2 splits
  Infinity, // 5 atom 3 splits
]
export const CLOSEUP_STEP_COUNT = STEP_ENDS.length

/** Which story step is showing (0 … CLOSEUP_STEP_COUNT−1). */
export function closeupStep(t: number): number {
  const s = t - SCENE_START
  return STEP_ENDS.findIndex((end) => s < end)
}

export interface CloseupStepText {
  icon: string
  title: string
  /** short caption (story timeline) */
  caption: string
  /** the reaction written out */
  equation: string
  /** longer explanation (left info panel) */
  panel: Array<{ icon: string; text: string }>
}

/** All close-up story steps for the bomb's fuel (CLOSEUP_STEP_COUNT long). */
export function closeupStory(fuel: CloseupFuel): CloseupStepText[] {
  const f = FUELS[fuel]
  const A = f.mass
  const fuelN = `n + ${sup(A)}${f.symbol}`
  const wobbly = `${fuelN} → ${sup(A + 1)}${f.symbol}`
  const splitEq = (p: SplitPair) =>
    `${wobbly} → ${sup(p.heavyA)}${FRAG[p.heavy].symbol} + ${sup(p.lightA)}${FRAG[p.light].symbol} + ${p.neutrons} n + energy`
  const [p1, p2, p3] = f.pairs
  const h = (p: SplitPair) => FRAG[p.heavy].name
  const l = (p: SplitPair) => FRAG[p.light].name
  return [
    {
      icon: '🎯',
      title: 'A neutron flies in',
      caption: 'A neutron flies in. It has no electric charge, so nothing pushes it away.',
      equation: fuelN,
      panel: [
        {
          icon: '🔍',
          text: `Zooming in on ${f.name} atoms being hit, one after another. A neutron flies in — it has no electric charge, so neither the electrons nor the protons push it away. It slips straight into the nucleus.`,
        },
      ],
    },
    {
      icon: '〰️',
      title: `${cap(f.name)}-${A + 1} wobbles`,
      caption: `The nucleus swallows it and becomes ${f.name}-${A + 1} — too wobbly! It stretches…`,
      equation: wobbly,
      panel: [
        {
          icon: '〰️',
          text: `The nucleus swallows the neutron and becomes ${f.name}-${A + 1}. It is far too wobbly: it stretches like a peanut…`,
        },
      ],
    },
    {
      icon: '💥',
      title: 'Split!',
      caption: `SPLIT! ${cap(h(p1))} + ${l(p1)} + ${p1.neutrons} new neutrons + energy (heat and violet γ rays).`,
      equation: splitEq(p1),
      panel: [
        {
          icon: '💥',
          text: `SPLIT! Two smaller atoms fly apart — ${h(p1)} and ${l(p1)} — plus ${p1.neutrons} new neutrons. The energy comes out as heat (the speed of the halves) and violet γ rays, the same rays you saw in the atom builder.`,
        },
        {
          icon: '🧮',
          text: `Count it: 1 + ${A} = ${A + 1} = ${p1.heavyA} + ${p1.lightA} + ${p1.neutrons}. No nucleon is lost — they are just shared out differently.`,
        },
      ],
    },
    {
      icon: '🎯',
      title: 'Atom 2 is hit',
      caption: `One of the new neutrons reaches the next ${f.name} atom… and hits it!`,
      equation: wobbly,
      panel: [
        {
          icon: '🎯',
          text: `Follow the neutron heading up-right: it reaches the next ${f.name} atom and hits its nucleus. Atom 2 starts to wobble.`,
        },
      ],
    },
    {
      icon: '🔁',
      title: 'Atom 2 splits',
      caption: 'Atom 2 splits too — and its neutron flies on to atom 3.',
      equation: splitEq(p2),
      panel: [
        {
          icon: '🔁',
          text: "Atom 2 splits the same way, and one of ITS neutrons flies on to atom 3. The other neutrons fly off to hit atoms we can't see.",
        },
      ],
    },
    {
      icon: '🎲',
      title: 'Atom 3 splits',
      caption: `Atom 3 splits into ${h(p3)} + ${l(p3)}. Every split frees more neutrons: the chain grows!`,
      equation: splitEq(p3),
      panel: [
        {
          icon: '🎲',
          text: `Atom 3 splits differently: into ${h(p3)} + ${l(p3)} + ${p3.neutrons} neutrons (1 + ${A} = ${p3.heavyA} + ${p3.lightA} + ${p3.neutrons}). ${cap(f.name)} can break into many different pairs.`,
        },
        {
          icon: '📈',
          text: 'Every split frees 2 or 3 neutrons, so 1 hit becomes 2–3, then 4–9, then more: the chain reaction grows by itself.',
        },
      ],
    },
  ]
}

// ---------- sprites: big nuclei for the close view ----------

function cluster(n: number, protons: number, pr: number): Sprite {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const pts: Array<[ParticleKind, number, number]> = []
  let placed = 0
  for (let j = 0; j < n; j++) {
    const r = pr * 1.08 * Math.sqrt(j)
    const a = j * golden
    // spread protons evenly through the cluster
    const isP = Math.floor(((j + 1) * protons) / n) > placed
    if (isP) placed++
    pts.push([isP ? 'protons' : 'neutrons', r * Math.cos(a), r * Math.sin(a)])
  }
  const ext = pr * 1.08 * Math.sqrt(n - 1) + pr * 1.6
  const size = Math.ceil(2 * ext + 2)
  return makeCanvasSprite(size, (ctx) => {
    for (let j = pts.length - 1; j >= 0; j--) {
      const [kind, x, y] = pts[j]
      drawGlossyParticle(ctx, kind, size / 2 + x, size / 2 + y, pr)
    }
  })
}

type SpriteSet = { u: Sprite; n: Sprite } & Record<FragId, Sprite>
let cache: { k: number; sp: SpriteSet } | null = null
function sprites(k: number): SpriteSet {
  if (!cache || cache.k !== k) {
    const pr = 4 * k
    // symbolic nucleon counts with each nucleus's real proton share
    // (U-235 and Pu-239 both: ~39 % protons → 12 of 30)
    cache = {
      k,
      sp: {
        u: cluster(30, 12, pr),
        zr: cluster(13, 5, pr),
        ba: cluster(19, 8, pr),
        kr: cluster(12, 5, pr),
        xe: cluster(18, 7, pr),
        sr: cluster(13, 5, pr),
        n: cluster(1, 0, pr * 1.3),
      },
    }
  }
  return cache.sp
}

// ---------- drawing helpers ----------

interface AtomLook {
  protons: number
  nucleus: Sprite
  r0: number
  gap: number
}

/** A whole atom in the bonding lab's shell-view language. `stretch` (0–1)
 *  turns the nucleus into a wobbling peanut along `axis`. */
function drawAtom(
  ctx: CanvasRenderingContext2D,
  look: AtomLook,
  x: number,
  y: number,
  spin: number,
  k: number,
  alpha = 1,
  stretch = 0,
  axis = 0,
  wobT = 0,
) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const shells = shellConfiguration(look.protons, look.protons)
  for (let i = 0; i < shells.length; i++) {
    const r = look.r0 + look.gap * i
    ctx.strokeStyle = i === shells.length - 1 ? '#4a6b91' : '#3b5a7d'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(axis)
  const w = stretch > 0 ? Math.sin(wobT * 30) * 0.07 * (0.4 + stretch) : 0
  ctx.scale(1 + 0.6 * stretch + w, 1 - 0.28 * stretch - w)
  blit(ctx, look.nucleus, 0, 0)
  ctx.restore()
  for (let i = 0; i < shells.length; i++) {
    const isValence = i === shells.length - 1
    const r = look.r0 + look.gap * i
    const eR = (isValence ? 2.9 : 2.2) * k
    const a0 = (spin * (i % 2 === 0 ? 1 : -0.7)) / (1 + i * 0.25) + i * 1.3
    for (let e = 0; e < shells[i]; e++) {
      const a = a0 + (e * 2 * Math.PI) / shells[i]
      drawGlossyParticle(ctx, 'electrons', x + r * Math.cos(a), y + r * Math.sin(a), eR)
    }
  }
  ctx.restore()
}

function drawNeutron(
  ctx: CanvasRenderingContext2D,
  s: Sprite,
  x: number,
  y: number,
  dx: number,
  dy: number,
  k: number,
) {
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.lineWidth = 6 * k
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - dx * 46 * k, y - dy * 46 * k)
  ctx.stroke()
  blit(ctx, s, x, y)
}

/** the builder's gamma photon: a travelling violet wavy line + "γ" */
function drawGamma(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  angle: number,
  head: number,
  alpha: number,
  t: number,
  k: number,
) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  ctx.strokeStyle = `rgba(196, 181, 253, ${alpha})`
  ctx.lineWidth = 2.2
  ctx.beginPath()
  for (let i = 0; i <= 20; i++) {
    const along = Math.max(0, head - 60 * k + i * 3 * k)
    const wave = 6 * k * Math.sin(i * 1.15 + t * 25)
    const px = x0 + along * c - wave * s
    const py = y0 + along * s + wave * c
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()
  ctx.fillStyle = `rgba(196, 181, 253, ${alpha})`
  ctx.font = `${Math.round(16 * k)}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('γ', x0 + (head + 16 * k) * c, y0 + (head + 16 * k) * s)
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

const AMBER = 'rgba(251, 191, 36, 0.95)'
const SLATE = 'rgba(203, 213, 225, 0.95)'

// ---------- the scene ----------

export function drawCloseup(
  ctx: CanvasRenderingContext2D,
  t: number,
  W: number,
  H: number,
  alpha: number,
  fuel: CloseupFuel,
) {
  if (alpha <= 0) return
  const s = t - SCENE_START
  const F = FUELS[fuel]
  const k = Math.min(W, H) / 800
  const sp = sprites(k)
  const spin = t * 0.6
  const U: AtomLook = { protons: F.protons, nucleus: sp.u, r0: 34 * k, gap: 13.5 * k }
  const look = (f: FragId): AtomLook => ({
    protons: FRAG[f].protons,
    nucleus: sp[f],
    r0: (f === 'ba' || f === 'xe' ? 24 : 21) * k,
    gap: 9.5 * k,
  })
  const outerR = (l: AtomLook) =>
    l.r0 + l.gap * (shellConfiguration(l.protons, l.protons).length - 1)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)

  // world → screen: camera starts on atom 1, pans to frame all three
  const pan = easeInOut(clamp01((s - PAN_START) / (PAN_END - PAN_START)))
  const camX = CAM_END.x * pan
  const camY = CAM_END.y * pan
  const ox = W / 2 - camX * k
  const oy = H * 0.47 - camY * k
  const X = (wx: number) => ox + wx * k
  const Y = (wy: number) => oy + wy * k

  for (const [i, b] of BYSTANDERS.entries()) drawAtom(ctx, U, X(b.x), Y(b.y), spin + i * 2, k)

  // freed neutrons start 26 units out and reach the next nucleus exactly at
  // its hitT (world units per second)
  const speedOf = (from: SplitSpec, to: SplitSpec) =>
    (Math.hypot(to.x - from.x, to.y - from.y) - 26) / (to.hitT - from.splitT)

  SPLITS.forEach((sp1, idx) => {
    const ax = X(sp1.x)
    const ay = Y(sp1.y)
    // the fuel atom: calm → wobbling (one neutron heavier) → gone at its split
    if (s < sp1.splitT + 0.45) {
      const st = s < sp1.hitT ? 0 : easeIn(clamp01((s - sp1.hitT) / (sp1.splitT - sp1.hitT)))
      const fade = s < sp1.splitT ? 1 : 1 - clamp01((s - sp1.splitT) / 0.45)
      drawAtom(ctx, U, ax, ay, spin + idx * 1.7, k, fade, st, sp1.axis, s)
      // name tag only — what is HAPPENING is told in the info panel
      if (s < sp1.splitT && (idx === 0 || s > SPLITS[idx - 1].splitT)) {
        const hit = s >= sp1.hitT
        tag(
          ctx,
          `atom ${idx + 1} · ${F.name}-${hit ? F.mass + 1 : F.mass}`,
          ax,
          ay + outerR(U) + 40 * k < H - 20 ? ay + outerR(U) + 20 * k : ay - outerR(U) - 20 * k,
          hit ? AMBER : SLATE,
        )
      }
    }
    if (s < sp1.splitT) return
    const q = s - sp1.splitT

    // the flash of energy
    if (q < 0.8) {
      const r = (40 + 240 * easeOut(q / 0.8)) * k
      const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, r)
      g.addColorStop(0, `rgba(255, 250, 220, ${0.9 * (1 - q / 0.8)})`)
      g.addColorStop(0.45, `rgba(253, 186, 116, ${0.5 * (1 - q / 0.8)})`)
      g.addColorStop(1, 'rgba(251, 146, 60, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(ax, ay, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // γ rays
    if (q < 1.6) {
      const head = q * 420 * k
      const ga = q < 1.1 ? 1 : 1 - (q - 1.1) / 0.5
      for (const a of [0.15, 1.75, 3.0, 4.4]) drawGamma(ctx, ax, ay, a + idx * 0.6, head, ga, t, k)
    }
    // the two halves fly apart along the stretch axis, slowing down
    const d = 230 * k * (1 - Math.exp(-q * 1.3))
    const grow = clamp01(q / 0.5)
    const pair = F.pairs[idx]
    const hv = look(pair.heavy)
    const lt = look(pair.light)
    const hx = ax + Math.cos(sp1.axis) * d
    const hy = ay + Math.sin(sp1.axis) * d
    const lx = ax - Math.cos(sp1.axis) * d * 1.25 // the lighter half flies faster
    const ly = ay - Math.sin(sp1.axis) * d * 1.25
    drawAtom(ctx, hv, hx, hy, spin, k, grow)
    drawAtom(ctx, lt, lx, ly, -spin, k, grow)
    if (q > 0.35 && q < 3.2) {
      const la = 1 - clamp01((q - 2.6) / 0.6)
      ctx.save()
      ctx.globalAlpha *= la
      tag(ctx, FRAG[pair.heavy].name, hx, hy - outerR(hv) - 16 * k, AMBER)
      tag(ctx, FRAG[pair.light].name, lx, ly + outerR(lt) + 16 * k, AMBER)
      ctx.restore()
    }
    // the freed neutrons
    const aimed = sp1.out.find((o) => 'target' in o) as { target: number } | undefined
    const speed = aimed ? speedOf(sp1, SPLITS[aimed.target]) : 300
    for (const o of sp1.out) {
      let dx: number
      let dy: number
      let maxD = Infinity
      if ('target' in o) {
        const tg = SPLITS[o.target]
        const dist = Math.hypot(tg.x - sp1.x, tg.y - sp1.y)
        dx = (tg.x - sp1.x) / dist
        dy = (tg.y - sp1.y) / dist
        maxD = dist
      } else {
        dx = Math.cos(o.a)
        dy = Math.sin(o.a)
      }
      const dist = 26 + q * speed
      if (dist >= maxD || dist > 1100) continue // absorbed / long gone
      drawNeutron(ctx, sp.n, X(sp1.x + dx * dist), Y(sp1.y + dy * dist), dx, dy, k)
    }
    if (q > 0.3 && q < 1.6) {
      tag(ctx, `${sp1.out.length} new neutrons`, ax + 70 * k, ay + 46 * k, SLATE)
    }
  })

  // the first neutron, flying in from the left
  const first = SPLITS[0]
  if (s < first.hitT) {
    const p = clamp01(s / first.hitT)
    const x = -40 * k + (X(first.x) + 40 * k) * p
    const y = Y(first.y) + 8 * k * (1 - p)
    drawNeutron(ctx, sp.n, x, y, 1, 0, k)
    if (x > 50 * k) tag(ctx, 'neutron', x, y - 26 * k, SLATE)
  }

  ctx.restore()
}
