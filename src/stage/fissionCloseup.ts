import { drawGlossyParticle } from './particleStyle'
import type { ParticleKind } from '../state/atomStore'
import { shellConfiguration } from '../core/atom'

// R01 close-up: late in the chain reaction the camera zooms into one nucleus
// that has just been hit, and the canvas cross-fades into a close view drawn
// in the app's shell-view atom language (bonding lab: nucleus + rings +
// spinning glossy electrons, REAL shell configurations from core/atom) and
// the builder's radiation language (violet wavy γ photons).
//
// Slow on purpose: THREE uranium atoms are hit one after the other, so kids
// see the chain move from atom to atom:
//   atom 1: n + ²³⁵U → ²³⁶U → ¹⁴¹Ba + ⁹²Kr + 3 n   (one neutron → atom 2)
//   atom 2: n + ²³⁵U → ²³⁶U → ¹⁴¹Ba + ⁹²Kr + 3 n   (one neutron → atom 3)
//   atom 3: n + ²³⁵U → ²³⁶U → ¹⁴⁰Xe + ⁹⁴Sr + 2 n   (uranium splits in
//           different ways — a second real pair shows that)
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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeIn = (p: number) => p * p
const easeOut = (p: number) => 1 - (1 - p) * (1 - p)
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p))

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

type FragId = 'ba' | 'kr' | 'xe' | 'sr'
const FRAG: Record<FragId, { name: string; protons: number }> = {
  ba: { name: 'barium', protons: 56 },
  kr: { name: 'krypton', protons: 36 },
  xe: { name: 'xenon', protons: 54 },
  sr: { name: 'strontium', protons: 38 },
}

interface SplitSpec {
  x: number // world position, in units of k
  y: number
  hitT: number // neutron arrives (scene time, s)
  splitT: number
  axis: number // direction the heavier half flies
  heavy: FragId
  light: FragId
  /** neutrons freed: angle, or the index of the atom it will hit */
  out: Array<{ a: number } | { target: number }>
  eq: string
}

const SPLITS: SplitSpec[] = [
  {
    x: 0,
    y: 0,
    hitT: 2.2,
    splitT: 3.7,
    axis: -Math.PI / 2 - 0.35,
    heavy: 'ba',
    light: 'kr',
    out: [{ target: 1 }, { a: 0.95 }, { a: Math.PI + 0.45 }],
    eq: 'n + ²³⁵U  →  ²³⁶U  →  ¹⁴¹Ba + ⁹²Kr + 3 n + energy',
  },
  {
    x: 330,
    y: -200,
    hitT: 6.0,
    splitT: 7.3,
    axis: -0.4,
    heavy: 'ba',
    light: 'kr',
    out: [{ target: 2 }, { a: -0.25 }, { a: Math.PI - 0.55 }],
    eq: 'n + ²³⁵U  →  ²³⁶U  →  ¹⁴¹Ba + ⁹²Kr + 3 n + energy',
  },
  {
    x: 380,
    y: 210,
    hitT: 9.1,
    splitT: 10.3,
    axis: Math.PI,
    heavy: 'xe',
    light: 'sr',
    out: [{ a: 0.6 }, { a: -2.4 }],
    eq: 'n + ²³⁵U  →  ²³⁶U  →  ¹⁴⁰Xe + ⁹⁴Sr + 2 n + energy',
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

/** Which step of the story is showing (0–5), for captions + info panel. */
export function closeupStep(t: number): number {
  const s = t - SCENE_START
  const [a, b, c] = SPLITS
  if (s < a.hitT) return 0
  if (s < a.splitT) return 1
  if (s < b.hitT) return 2
  if (s < b.splitT) return 3
  if (s < c.splitT) return 4
  return 5
}

/** short caption per story step (shown in the info panel's focus box) */
export const CLOSEUP_CAPTIONS = [
  'A neutron flies in. It has no electric charge, so nothing pushes it away.',
  'The nucleus swallows it and becomes uranium-236 — too wobbly! It stretches…',
  'SPLIT! Barium + krypton + 3 new neutrons + energy (heat and violet γ rays).',
  'One of the new neutrons reaches the next uranium atom… and hits it!',
  'Atom 2 splits too — and its neutron flies on to atom 3.',
  'Atom 3 splits into xenon + strontium. Every split frees more neutrons: the chain grows!',
]

/** the reaction written out, per story step */
export const CLOSEUP_EQUATIONS = [
  'n + ²³⁵U',
  'n + ²³⁵U → ²³⁶U',
  'n + ²³⁵U → ²³⁶U → ¹⁴¹Ba + ⁹²Kr + 3 n + energy',
  'n + ²³⁵U → ²³⁶U',
  'n + ²³⁵U → ²³⁶U → ¹⁴¹Ba + ⁹²Kr + 3 n + energy',
  'n + ²³⁵U → ²³⁶U → ¹⁴⁰Xe + ⁹⁴Sr + 2 n + energy',
]

// ---------- sprites: big nuclei for the close view ----------

interface Sprite {
  canvas: HTMLCanvasElement
  size: number
}

function cluster(n: number, protons: number, pr: number): Sprite {
  const dpr = window.devicePixelRatio || 1
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
  const canvas = document.createElement('canvas')
  canvas.width = size * dpr
  canvas.height = size * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  for (let j = pts.length - 1; j >= 0; j--) {
    const [kind, x, y] = pts[j]
    drawGlossyParticle(ctx, kind, size / 2 + x, size / 2 + y, pr)
  }
  return { canvas, size }
}

type SpriteSet = { u: Sprite; n: Sprite } & Record<FragId, Sprite>
let cache: { k: number; sp: SpriteSet } | null = null
function sprites(k: number): SpriteSet {
  if (!cache || cache.k !== k) {
    const pr = 4 * k
    // symbolic nucleon counts with each nucleus's real proton share
    cache = {
      k,
      sp: {
        u: cluster(30, 12, pr),
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

function blit(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number) {
  ctx.drawImage(s.canvas, x - s.size / 2, y - s.size / 2, s.size, s.size)
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
) {
  if (alpha <= 0) return
  const s = t - SCENE_START
  const k = Math.min(W, H) / 800
  const sp = sprites(k)
  const spin = t * 0.6
  const U: AtomLook = { protons: 92, nucleus: sp.u, r0: 34 * k, gap: 13.5 * k }
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
    // the uranium atom: calm → wobbling U-236 → gone at its split
    if (s < sp1.splitT + 0.45) {
      const st = s < sp1.hitT ? 0 : easeIn(clamp01((s - sp1.hitT) / (sp1.splitT - sp1.hitT)))
      const fade = s < sp1.splitT ? 1 : 1 - clamp01((s - sp1.splitT) / 0.45)
      drawAtom(ctx, U, ax, ay, spin + idx * 1.7, k, fade, st, sp1.axis, s)
      // name tag only — what is HAPPENING is told in the info panel
      if (s < sp1.splitT && (idx === 0 || s > SPLITS[idx - 1].splitT)) {
        const hit = s >= sp1.hitT
        tag(
          ctx,
          `atom ${idx + 1} · uranium-${hit ? 236 : 235}`,
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
    const hv = look(sp1.heavy)
    const lt = look(sp1.light)
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
      tag(ctx, FRAG[sp1.heavy].name, hx, hy - outerR(hv) - 16 * k, AMBER)
      tag(ctx, FRAG[sp1.light].name, lx, ly + outerR(lt) + 16 * k, AMBER)
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
