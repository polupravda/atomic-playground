import { useRef } from 'react'
import {
  SHEET_GAP,
  bonds,
  diamondFor,
  diamondLattice,
  graphiteLattice,
  inDiamondZone,
  sheetOf,
  type P3,
} from '../core/crystals'
import { drawGlossyParticle } from './particleStyle'
import { drawShellAtom, outerRing } from './shellAtom'
import { canvasLabel as label, canvasPoint, useCanvas } from './useCanvas'

// 🧊 Crystal lab — one block of carbon, in six scenes. The main view
// (🔄 look around) turns the block; each other scene opens in a drawer:
// ✏️ write, 👉 push, 🔦 shine a light, 🔋 electricity, 🗜️🔥 squeeze and
// heat. The same 63 atoms are graphite (flat sheets) or diamond (a grid):
// `phase` 0 → 1 moves every atom from its graphite place to its own
// diamond place (core/crystals.ts diamondFor), so none come or go.

export type CarbonMaterial = 'graphite' | 'diamond'
export type CarbonScene = 'look' | 'write' | 'push' | 'light' | 'power' | 'squeeze'
/** ⚛️ atoms as the Bonding lab draws them, or ⚪ balls and sticks */
export type CarbonLook = 'atoms' | 'sticks'

const G = graphiteLattice()
const D = diamondFor(G, diamondLattice())
const G_BONDS = bonds(G)
const D_BONDS = bonds(D)
const CARBON_SHELLS = [2, 4]
const RING = outerRing(CARBON_SHELLS.length)
const AMBER = '#fde68a'

// ✏️ the pencil's sheets: graphite stacks sheets in two alternating
// patterns (A, B), so a new sheet above takes the other one
const TEMPLATE = [0, 1].map((par) => G.filter((p) => sheetOf(p) === par).map((p) => ({ x: p.x, y: 0, z: p.z })))
const TEMPLATE_BONDS = TEMPLATE.map((t) => bonds(t))

interface Pt {
  sx: number
  sy: number
  z: number
}
interface View {
  cx: number
  cy: number
  S: number
  yaw: number
  pitch: number
}
const project = (p: P3, v: View): Pt => {
  const cyw = Math.cos(v.yaw)
  const syw = Math.sin(v.yaw)
  const X = p.x * cyw + p.z * syw
  const Z = -p.x * syw + p.z * cyw
  const Y = p.y * Math.cos(v.pitch) - Z * Math.sin(v.pitch)
  const Zr = p.y * Math.sin(v.pitch) + Z * Math.cos(v.pitch)
  return { sx: v.cx + X * v.S, sy: v.cy - Y * v.S, z: Zr }
}

/** one carbon atom: the Bonding lab's atom, or a ball. `near` 0 (far) → 1 */
function drawCarbon(ctx: CanvasRenderingContext2D, look: CarbonLook, x: number, y: number, S: number, near: number, spin: number, alpha = 1) {
  const k = 0.9 + 0.2 * near
  ctx.save()
  ctx.globalAlpha *= alpha
  if (look === 'sticks') {
    const r = S * 0.2 * k
    ctx.globalAlpha *= 0.6 + 0.4 * near
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r)
    g.addColorStop(0, '#e2e8f0')
    g.addColorStop(0.55, '#94a3b8')
    g.addColorStop(1, '#475569')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  } else {
    const scale = ((S * 0.47) / RING) * k
    // a dark disc hides the atoms behind, so the block reads as 3D
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)'
    ctx.beginPath()
    ctx.arc(x, y, RING * scale + 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha *= 0.55 + 0.45 * near
    drawShellAtom(ctx, CARBON_SHELLS, 6, x, y, scale, spin)
  }
  ctx.restore()
}

/** how far an atom reaches on screen (for touching it) */
const atomReach = (look: CarbonLook, S: number) => (look === 'atoms' ? S * 0.47 : S * 0.2)

function drawBonds(ctx: CanvasRenderingContext2D, pts: Array<Pt | null>, list: Array<[number, number]>, look: CarbonLook, S: number, alpha: number) {
  if (alpha <= 0.02) return
  ctx.strokeStyle = look === 'sticks' ? `rgba(148, 163, 184, ${0.6 * alpha})` : `rgba(148, 163, 184, ${0.2 * alpha})`
  ctx.lineWidth = look === 'sticks' ? Math.max(1.5, S * 0.08) : 1
  ctx.beginPath()
  for (const [a, b] of list) {
    const p = pts[a]
    const q = pts[b]
    if (!p || !q) continue
    ctx.moveTo(p.sx, p.sy)
    ctx.lineTo(q.sx, q.sy)
  }
  ctx.stroke()
}

/** atoms far to near, so near ones cover far ones */
function drawAtoms(ctx: CanvasRenderingContext2D, pts: Array<Pt | null>, look: CarbonLook, S: number, t: number, alpha: (i: number) => number = () => 1) {
  const order = pts.map((_, i) => i).filter((i) => pts[i]).sort((a, b) => pts[a]!.z - pts[b]!.z)
  for (const i of order) {
    const p = pts[i]!
    drawCarbon(ctx, look, p.sx, p.sy, S, Math.min(1, Math.max(0, (p.z + 4) / 8)), t * 1.2 + i * 0.7, alpha(i))
  }
}

function emoji(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, align: CanvasTextAlign = 'center') {
  ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}

/** a polyline you can walk along: the circuit's wire */
function pathWalker(points: Array<[number, number]>) {
  const lens = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = lens.reduce((a, b) => a + b, 0)
  return {
    total,
    at(d: number): { x: number; y: number; seg: number } {
      let left = ((d % total) + total) % total
      for (let i = 0; i < lens.length; i++) {
        if (left <= lens[i]) {
          const u = lens[i] ? left / lens[i] : 0
          return { x: points[i][0] + (points[i + 1][0] - points[i][0]) * u, y: points[i][1] + (points[i + 1][1] - points[i][1]) * u, seg: i }
        }
        left -= lens[i]
      }
      return { x: points[0][0], y: points[0][1], seg: 0 }
    },
  }
}

const LIGHT_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa']

// The electrons that make the difference (🔦 light and 🔋 electricity):
// graphite has one left over per atom — free to wander along its sheet
// (a few are shown, hopping along bonds); diamond keeps every outer
// electron in a bond, a pair between two atoms
/** graphite's zigzag rows: within a sheet, the bonds that run across
 *  (not the ones along the depth) chain atoms into rows, left to right.
 *  Every atom is in exactly one row — the 🔋 electrons hop along them */
const ROWS: number[][] = (() => {
  const root = G.map((_, i) => i)
  const find = (i: number): number => (root[i] === i ? i : (root[i] = find(root[i])))
  for (const [a, b] of G_BONDS) if (Math.abs(G[a].x - G[b].x) > 0.3) root[find(a)] = find(b)
  const groups = new Map<number, number[]>()
  G.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]))
  return [...groups.values()].map((g) => g.sort((a, b) => G[a].x - G[b].x))
})()
/** how far the circuit's flow moves while the sheet's electrons hop once */
const HOP_PX = 46
const FREE_BONDS = G_BONDS.filter((_, i) => i % 3 === 0)
const HELD_BONDS = D_BONDS.filter((_, i) => i % 3 === 0)
function freeSpots(pts: Pt[], t: number) {
  return FREE_BONDS.map(([a, b], i) => {
    const u = 0.5 + 0.45 * Math.sin(t * 1.7 + i * 1.3)
    return { x: pts[a].sx + (pts[b].sx - pts[a].sx) * u, y: pts[a].sy + (pts[b].sy - pts[a].sy) * u }
  })
}
function heldSpots(pts: Pt[], t: number) {
  return HELD_BONDS.flatMap(([a, b], i) => {
    const mx = (pts[a].sx + pts[b].sx) / 2
    const my = (pts[a].sy + pts[b].sy) / 2
    const len = Math.hypot(pts[b].sx - pts[a].sx, pts[b].sy - pts[a].sy) || 1
    const nx = -(pts[b].sy - pts[a].sy) / len
    const ny = (pts[b].sx - pts[a].sx) / len
    const j = Math.sin(t * 9 + i) * 0.8
    return [
      { x: mx + nx * 4 + j, y: my + ny * 4 },
      { x: mx - nx * 4 - j, y: my - ny * 4 },
    ]
  })
}
/** an electron that matters here: glowing, so it stands out from the
 *  atoms' own; `hot` 0–1 flashes amber (it just caught light) */
function glowElectron(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, hot = 0) {
  if (alpha <= 0.03) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.6)
  g.addColorStop(0, hot > 0 ? `rgba(253, 186, 116, ${0.5 + 0.4 * hot})` : 'rgba(125, 211, 252, 0.6)')
  g.addColorStop(1, 'rgba(125, 211, 252, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r * 2.6, 0, Math.PI * 2)
  ctx.fill()
  drawGlossyParticle(ctx, 'electrons', x, y, r)
  ctx.restore()
}
/** a bit of light: a bright dot with a short tail */
function drawPhoton(ctx: CanvasRenderingContext2D, x: number, y: number, ux: number, uy: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - ux * 14, y - uy * 14)
  ctx.lineTo(x, y)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(x, y, 3.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
/** words for what the eye cannot see: a dark box, a line to the thing */
function callout(ctx: CanvasRenderingContext2D, lines: string[], cx: number, top: number, target?: { x: number; y: number }) {
  ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 24
  const h = lines.length * 18 + 14
  if (target) {
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.8)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(cx, top)
    ctx.lineTo(target.x, target.y + 8)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.9)'
    ctx.beginPath()
    ctx.arc(target.x, target.y, 11, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(cx - w / 2, top, w, h, 10)
  ctx.fill()
  ctx.stroke()
  lines.forEach((l, i) => label(ctx, l, cx, top + 16 + i * 18, '#e2e8f0', 13))
}

interface Flying {
  x0: number
  y0: number
  x1: number
  y1: number
  t0: number
}

const fresh = (material: CarbonMaterial) => ({
  yaw: 0.6,
  pitch: 0.32,
  phase: material === 'diamond' ? 1 : 0,
  ptr: { x: -1, y: -1, down: false, inside: false, x0: 0, y0: 0, yaw0: 0, pitch0: 0 },
  // ✏️ write
  pen: { x: 0, y: 0 },
  layers: [0, 1, 0].map((par) => ({ par, gone: new Set<number>() })),
  drop: 0,
  flying: [] as Flying[],
  marks: [] as Array<{ x: number; y: number; tear: boolean }>,
  acc: 0,
  sheets: 0,
  bottom: [] as Array<{ j: number; sx: number; sy: number }>,
  // 👉 push
  off: [0, 0, 0],
  side: 'left' as 'left' | 'right',
  ext: [] as Array<{ min: number; max: number; y: number }>,
  block: { min: 0, max: 0, top: 0, bottom: 0 },
  touching: false,
  bumpT: -9,
  hand: { x: 0, y: 0 },
  pushed: -1,
  // 🔦 light
  torchY: 0,
  /** the kid has moved the torch: the light result can be explained */
  torchUsed: false,
  photons: [] as Array<{ t0: number; x0: number; y0: number; target: number; color: number; diamond: boolean }>,
  lastPhoton: 0,
  /** when each free electron last caught a bit of light */
  caught: {} as Record<number, number>,
  // 🔋 power
  on: false,
  lever: 0,
  flow: 0,
  // 🗜️🔥 squeeze and heat
  pressure: 0,
  heat: 0,
  holding: false,
  /** a fresh PUSH: 1 → 0 — flashes the squeeze gauge so even a tap shows */
  bump: 0,
  firing: false,
  told: false,
  /** the last result reported to the narrator (onResult) */
  result: '' as string,
  /** which electron each words box points at, chosen once */
  pinnedTo: {} as Record<string, number>,
  /** the scene's clock, for the atoms flying to the paper */
  clock: 0,
})

export function CarbonStage({
  width: W,
  height: H,
  active,
  scene,
  material,
  look,
  resetKey,
  onBecameDiamond,
  onSheets,
  onResult,
}: {
  width: number
  height: number
  active: boolean
  scene: CarbonScene
  material: CarbonMaterial
  look: CarbonLook
  /** a change gives a fresh scene: block, paper, switch, press */
  resetKey: number
  onBecameDiamond?: () => void
  /** ✏️ how many sheets the pencil has left on the paper */
  onSheets?: (n: number) => void
  /** a scene's outcome is on screen ('power-graphite', 'push-diamond', …)
   *  — the narrator explains it (crystalIntros.ts CRYSTAL_RESULTS) */
  onResult?: (key: string) => void
}) {
  const st = useRef({ ...fresh(material), reset: resetKey })
  const props = useRef({ scene, material, look })
  props.current = { scene, material, look }
  if (st.current.reset !== resetKey) {
    st.current = { ...fresh(material), reset: resetKey }
    onSheets?.(0)
  }

  const base = Math.min(W, H) / 11
  // ✏️ the paper: a sheet lying on the table, seen from the front
  const paper = { top: H * 0.52, bottom: H * 0.97, inTop: W * 0.2, inBottom: W * 0.03 }
  const onPaper = (x: number, y: number) => {
    const u = (y - paper.top) / (paper.bottom - paper.top)
    const inset = paper.inTop + (paper.inBottom - paper.inTop) * u
    return y > paper.top + 30 && y < paper.bottom - 12 && x > inset + 20 && x < W - inset - 20
  }
  // 🔋 the switch, 🗜️ the button and the fire
  const battery = { x: W * 0.3, y: H * 0.84, w: 124, h: 46 }
  const sw = { x: W * 0.5, y: H * 0.84 }
  const bulb = { x: W * 0.69, y: H * 0.84 }
  const button = { x: W * 0.84, y: H * 0.22, r: 44 }
  const fire = { x0: W * 0.2, x1: W * 0.66, y: H * 0.93 }

  const ref = useCanvas(W, H, active, (ctx, t, dt) => {
    const s = st.current
    s.clock = t
    const { scene, look } = props.current
    if (s.pen.x === 0) Object.assign(s.pen, { x: W * 0.32, y: H * 0.72 })
    if (s.torchY === 0) s.torchY = H * 0.36

    // ---- graphite or diamond? ----
    let target = props.current.material === 'diamond' ? 1 : 0
    if (scene === 'squeeze') {
      // holding builds the squeeze; letting go lets it sink back slowly, so
      // a single tap is SEEN (Elena, 2026-11-20: a tap gave no feedback, so
      // it wasn't clear you have to keep pressing)
      s.pressure = Math.min(1, Math.max(0, s.pressure + (s.holding ? 0.42 : -0.25) * dt))
      s.bump = Math.max(0, s.bump - dt * 2.5)
      if (target === 0 && inDiamondZone(s.pressure, s.heat)) {
        target = 1
        if (!s.told) {
          s.told = true
          onBecameDiamond?.()
        }
      }
    }
    if (target === 0) s.told = false
    s.phase += Math.sign(target - s.phase) * Math.min(Math.abs(target - s.phase), dt * 0.5)
    const ph = s.phase < 0.5 ? 2 * s.phase * s.phase : 1 - 2 * (1 - s.phase) * (1 - s.phase)
    const isDiamond = s.phase > 0.5

    // 🗣️ the scene's outcome, once it is clearly on screen
    {
      const settled = s.phase < 0.02 || s.phase > 0.98
      const mat = isDiamond ? 'diamond' : 'graphite'
      const result = !settled
        ? ''
        : scene === 'write'
          ? isDiamond
            ? s.marks.some((m) => m.tear) ? 'write-diamond' : ''
            : s.marks.some((m) => !m.tear) ? 'write-graphite' : ''
          : scene === 'push'
            ? s.touching ? `push-${mat}` : ''
            : scene === 'light'
              ? s.torchUsed ? `light-${mat}` : ''
              : scene === 'power'
                ? s.on ? `power-${mat}` : ''
                : scene === 'squeeze' && isDiamond && s.told
                  ? 'squeeze-diamond'
                  : ''
      if (result && result !== s.result) {
        s.result = result
        onResult?.(result)
      }
    }

    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#060b1a')
    bg.addColorStop(1, '#020617')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    const top = (txt: string) => headline(ctx, txt)

    if (scene === 'write') {
      drawWrite(ctx, t, dt, isDiamond)
      return
    }

    // ---- the block, for every other scene ----
    const views: Record<Exclude<CarbonScene, 'write'>, View> = {
      look: { cx: W / 2, cy: H * 0.46, S: base, yaw: s.yaw, pitch: s.pitch },
      push: { cx: W / 2, cy: H * 0.47, S: base * 0.78, yaw: 0, pitch: 0.3 },
      light: { cx: W * 0.52, cy: H * 0.46, S: base * 0.85, yaw: 0.5, pitch: 0.3 },
      power: { cx: W / 2, cy: H * 0.38, S: base * 0.72, yaw: 0, pitch: 0.3 },
      squeeze: { cx: W * 0.44, cy: H * 0.44, S: base * 0.78, yaw: 0.5, pitch: 0.3 },
    }
    const v = views[scene]
    const S = v.S
    const reach = atomReach(look, S)
    const soft = 1 - ph

    // 👉 the hand meets the block before the atoms are placed
    if (scene === 'push') pushStep(t, isDiamond, reach)

    const squeezeY = scene === 'squeeze' ? 1 - (isDiamond ? 0.05 : 0.15) * s.pressure : 1
    const tremble = 0.02 * (1 + 3 * (scene === 'squeeze' ? s.heat : 0))
    const pts: Pt[] = G.map((g, i) => {
      const d = D[i]
      const sheet = sheetOf(g)
      const p = {
        x: g.x + (d.x - g.x) * ph + (scene === 'push' ? s.off[sheet] * soft : 0) + Math.sin(t * 9 + i * 1.7) * tremble,
        y: (g.y + (d.y - g.y) * ph + Math.cos(t * 8 + i * 2.3) * tremble) * squeezeY,
        z: g.z + (d.z - g.z) * ph,
      }
      return project(p, v)
    })
    // where the block and each sheet are on screen (the hand's walls)
    s.block = {
      min: Math.min(...pts.map((p) => p.sx)),
      max: Math.max(...pts.map((p) => p.sx)),
      top: Math.min(...pts.map((p) => p.sy)),
      bottom: Math.max(...pts.map((p) => p.sy)),
    }
    s.ext = [0, 1, 2].map((k) => {
      const mine = pts.filter((_, i) => sheetOf(G[i]) === k)
      return { min: Math.min(...mine.map((p) => p.sx)), max: Math.max(...mine.map((p) => p.sx)), y: mine.reduce((a, p) => a + p.sy, 0) / mine.length }
    })

    // ---- behind the block ----
    if (scene === 'light') lightBehind(ctx, v, isDiamond)
    if (scene === 'squeeze') squeezeBehind(ctx, v)

    drawBonds(ctx, pts, G_BONDS, look, S, soft)
    drawBonds(ctx, pts, D_BONDS, look, S, ph)
    drawAtoms(ctx, pts, look, S, t)

    // ---- in front of the block ----
    if (scene === 'look') {
      label(ctx, isDiamond ? 'diamond — every atom holds four neighbours' : 'graphite — flat sheets, loosely stacked', W / 2, H * 0.82, '#cbd5e1', 14)
      label(ctx, '↻ drag to turn the block', W / 2, H * 0.86)
      if (look === 'sticks') {
        // the key: one ball is one whole atom
        const ky = H - 40
        drawCarbon(ctx, 'sticks', 30, ky, base, 1, 0)
        label(ctx, '=', 54, ky, '#cbd5e1', 16)
        drawShellAtom(ctx, CARBON_SHELLS, 6, 90, ky, 1.1, t * 1.2)
        label(ctx, 'one ball = one carbon atom', 126, ky, undefined, 12, '', 'left')
      }
    }
    if (scene === 'push') {
      pushFront(ctx, t, isDiamond)
      if (s.touching) top(isDiamond ? 'it does not move — every atom is held from four sides' : 'one sheet slides — the others hardly notice')
      else top(isDiamond ? 'push the diamond from the side' : 'push a sheet from the side')
    }
    if (scene === 'light') {
      lightFront(ctx, t, v, isDiamond, pts, ph)
      top(isDiamond ? 'the light goes in, bounces inside and comes out in colors' : 'no light gets through — the free electrons catch it')
    }
    if (scene === 'power') {
      powerFront(ctx, t, dt, v, isDiamond, reach, pts, ph)
      top(!s.on ? 'tap the switch to close the circuit' : isDiamond ? 'the bulb stays dark — in diamond every electron is busy holding on' : 'the bulb lights — electrons run all the way round, through the sheets too')
    }
    if (scene === 'squeeze') {
      squeezeFront(ctx, t, v)
      if (s.phase > 0.02 && s.phase < 0.98 && target === 1) top('the sheets buckle and lock into a grid…')
      else if (isDiamond) top('diamond! the same 63 atoms, squeezed and hot enough')
      else if (s.holding && s.heat < 0.45) top('squeezed hard — but too cold. Drag the fire up!')
      else if (s.heat >= 0.45 && !s.holding) top('hot! Now hold the red PUSH button')
      else if (s.holding) top('harder…')
      else top('first drag the 🔥 up to heat · then hold PUSH to squeeze')
    }
  })

  /** the words box keeps pointing at the SAME electron: chosen once (the
   *  `nth` best by `score`), then followed wherever it moves */
  function pinned<T>(key: string, list: T[], score: (p: T) => number, nth = 0): T | undefined {
    const s = st.current
    if (s.pinnedTo[key] === undefined || s.pinnedTo[key] >= list.length) {
      const order = list.map((p, i) => ({ i, k: score(p) })).sort((a, b) => a.k - b.k)
      s.pinnedTo[key] = order[Math.min(nth, order.length - 1)]?.i ?? 0
    }
    return list[s.pinnedTo[key]]
  }

  // ---------- the headline: what is happening, on a dark pill ----------
  function headline(ctx: CanvasRenderingContext2D, txt: string, sub?: string) {
    ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif'
    const w = ctx.measureText(txt).width + 28
    const y = H * 0.045
    ctx.fillStyle = 'rgba(2, 6, 23, 0.82)'
    ctx.beginPath()
    ctx.roundRect(W / 2 - w / 2, y - 16, w, sub ? 54 : 32, 12)
    ctx.fill()
    label(ctx, txt, W / 2, y, AMBER, 15, '600')
    if (sub) label(ctx, sub, W / 2, y + 22, '#cbd5e1', 13)
  }

  // ---------- ✏️ write ----------
  function drawWrite(ctx: CanvasRenderingContext2D, t: number, dt: number, isDiamond: boolean) {
    const s = st.current
    const { look } = props.current
    const S = base * 0.62
    const reach = atomReach(look, S)
    // the paper
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.moveTo(paper.inTop, paper.top)
    ctx.lineTo(W - paper.inTop, paper.top)
    ctx.lineTo(W - paper.inBottom, paper.bottom)
    ctx.lineTo(paper.inBottom, paper.bottom)
    ctx.closePath()
    ctx.fill()
    for (const m of s.marks) {
      if (m.tear) {
        ctx.strokeStyle = '#0f172a'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(m.x - 5, m.y - 3)
        ctx.lineTo(m.x, m.y + 3)
        ctx.lineTo(m.x + 5, m.y - 2)
        ctx.stroke()
      } else drawCarbon(ctx, 'sticks', m.x, m.y, 14, 0.4, 0)
    }

    // the block hovers over the paper; pressed, it touches it
    const lift = s.ptr.down ? 8 : 26
    const v: View = { cx: s.pen.x, cy: 0, S, yaw: 0.5, pitch: 0.38 }
    const cp = Math.cos(v.pitch)
    let pts: Array<Pt | null>
    let alpha = (_i: number) => 1
    let bondList: Array<[number, number]>
    if (isDiamond) {
      v.cy = s.pen.y - lift - 2.3 * cp * S
      pts = D.map((p) => project(p, v))
      bondList = D_BONDS
    } else {
      s.drop = Math.max(0, s.drop - dt * 2.2)
      v.cy = s.pen.y - lift - SHEET_GAP * cp * S
      const n = TEMPLATE[0].length
      pts = []
      bondList = []
      s.layers.forEach((layer, k) => {
        const off = k * n
        TEMPLATE[layer.par].forEach((p, j) => {
          pts.push(layer.gone.has(j) ? null : project({ x: p.x, y: (k - 1 + s.drop) * SHEET_GAP, z: p.z }, v))
        })
        for (const [a, b] of TEMPLATE_BONDS[layer.par]) bondList.push([a + off, b + off])
      })
      // the newest sheet fades in on top as the others move down
      alpha = (i) => (i >= 2 * n ? 1 - s.drop : 1)
      s.bottom = pts.slice(0, n).flatMap((p, j) => (p ? [{ j, sx: p.sx, sy: p.sy }] : []))
    }
    const shown = pts.filter((p): p is Pt => !!p)
    const blockTop = Math.min(...shown.map((p) => p.sy)) - reach
    const blockMin = Math.min(...shown.map((p) => p.sx)) - reach
    const blockMax = Math.max(...shown.map((p) => p.sx)) + reach
    drawBonds(ctx, pts, bondList, look, S, 1)
    drawAtoms(ctx, pts, look, S, t, alpha)

    // atoms on their way down to the paper
    s.flying = s.flying.filter((f) => {
      const u = Math.min(1, (t - f.t0) / 0.4)
      const e = u * u
      if (u >= 1) {
        s.marks.push({ x: f.x1, y: f.y1, tear: false })
        if (s.marks.length > 1500) s.marks.shift()
        return false
      }
      drawCarbon(ctx, look, f.x0 + (f.x1 - f.x0) * e, f.y0 + (f.y1 - f.y0) * e, S * (1 - 0.6 * u), 0.8, t * 1.2)
      return true
    })

    // the pencil above it: the block is its tip, seen up close
    const tipY = blockTop - 44
    const px = s.pen.x
    ctx.save()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px, tipY)
    ctx.lineTo(blockMin, blockTop + 10)
    ctx.moveTo(px, tipY)
    ctx.lineTo(blockMax, blockTop + 10)
    ctx.stroke()
    ctx.restore()
    drawPencil(ctx, px, tipY, isDiamond)
    label(ctx, isDiamond ? 'a diamond tip, up close ↓' : 'the pencil tip, up close ↓', px + 24, tipY - 22, '#cbd5e1', 12, '', 'left')

    if (isDiamond) headline(ctx, s.marks.some((m) => m.tear) ? 'diamond leaves no line — it only tears the paper' : 'hold and drag on the paper to write')
    else if (s.marks.some((m) => !m.tear) || s.flying.length)
      headline(ctx, 'atoms slide off the bottom sheet onto the paper — that is your line', `sheets used up: ${s.sheets}`)
    else headline(ctx, 'hold and drag on the paper to write')
  }

  /** a yellow pencil, standing on its tip at (x, tipY) */
  function drawPencil(ctx: CanvasRenderingContext2D, x: number, tipY: number, diamondTip: boolean) {
    const w = 15
    const lead = tipY - 14
    const wood = tipY - 44
    // never up into the headline
    const end = Math.min(wood - 40, Math.max(H * 0.12 + 40, wood - 170))
    // body
    ctx.fillStyle = '#facc15'
    ctx.fillRect(x - w, end, 2 * w, wood - end)
    ctx.fillStyle = '#eab308'
    ctx.fillRect(x - w / 3, end, (2 * w) / 3, wood - end)
    ctx.fillStyle = '#ca8a04'
    ctx.fillRect(x + w / 3, end, (2 * w) / 3, wood - end)
    // ferrule and eraser
    ctx.fillStyle = '#cbd5e1'
    ctx.fillRect(x - w - 1, end - 16, 2 * w + 2, 16)
    ctx.fillStyle = '#f9a8d4'
    ctx.beginPath()
    ctx.roundRect(x - w, end - 40, 2 * w, 24, [6, 6, 0, 0])
    ctx.fill()
    // sharpened wood, then the lead
    ctx.fillStyle = '#f5d0a0'
    ctx.beginPath()
    ctx.moveTo(x - w, wood)
    ctx.lineTo(x + w, wood)
    ctx.lineTo(x + 5, lead)
    ctx.lineTo(x - 5, lead)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = diamondTip ? '#bae6fd' : '#334155'
    ctx.beginPath()
    ctx.moveTo(x - 5, lead)
    ctx.lineTo(x + 5, lead)
    ctx.lineTo(x, tipY)
    ctx.closePath()
    ctx.fill()
  }

  // ---------- 👉 push ----------
  function pushStep(t: number, isDiamond: boolean, reach: number) {
    const s = st.current
    const { ptr } = s
    const was = s.touching
    s.touching = false
    s.pushed = -1
    s.hand = { x: ptr.x, y: ptr.y }
    if (!ptr.down || !s.ext.length) return
    const left = s.side === 'left'
    if (isDiamond) {
      if (ptr.y < s.block.top - reach || ptr.y > s.block.bottom + reach) return
      const wall = left ? s.block.min - reach : s.block.max + reach
      if (left ? ptr.x > wall : ptr.x < wall) {
        s.hand.x = wall
        s.touching = true
        if (!was) s.bumpT = t
      }
      return
    }
    // graphite: the hand meets the sheet at its height, and moves it
    const S = base * 0.78
    const band = (SHEET_GAP / 2) * Math.cos(0.3) * S
    const k = s.ext.findIndex((e) => Math.abs(ptr.y - e.y) < band)
    if (k < 0) return
    const e = s.ext[k]
    const wall = left ? e.min - reach : e.max + reach
    let dx = left ? ptr.x - wall : wall - ptr.x
    if (dx <= 0) return
    // the sheet may slide until it nearly leaves the table
    const room = left ? W - 16 - (e.max + reach) : e.min - reach - 16
    dx = Math.max(0, Math.min(dx, room))
    s.off[k] += ((left ? 1 : -1) * dx) / S
    s.hand.x = left ? wall + dx : wall - dx
    s.touching = true
    s.pushed = k
  }

  function pushFront(ctx: CanvasRenderingContext2D, t: number, isDiamond: boolean) {
    const s = st.current
    const { ptr } = s
    if (!ptr.inside && !ptr.down) return
    const left = ptr.down ? s.side === 'left' : ptr.x < W / 2
    let x = s.hand.x
    if (!ptr.down) x = ptr.x
    // the bump: a quick bounce back, then the hand stays still
    const since = t - s.bumpT
    if (isDiamond && s.touching && since < 0.6) x += (left ? -1 : 1) * 10 * Math.exp(-since * 7) * Math.abs(Math.sin(since * 22))
    ctx.save()
    ctx.globalAlpha = ptr.down ? 1 : 0.5
    emoji(ctx, left ? '👉' : '👈', left ? x + 4 : x - 4, s.hand.y, 46, left ? 'right' : 'left')
    ctx.restore()
    if (isDiamond && s.touching && since < 0.45) {
      // bonk!
      ctx.strokeStyle = `rgba(253, 230, 138, ${1 - since / 0.45})`
      ctx.lineWidth = 2
      for (const a of [-0.9, 0, 0.9]) {
        const dir = left ? 1 : -1
        ctx.beginPath()
        ctx.moveTo(s.hand.x + dir * 6 * Math.cos(a), s.hand.y - 30 + 10 * Math.sin(a))
        ctx.lineTo(s.hand.x + dir * 18 * Math.cos(a), s.hand.y - 34 + 22 * Math.sin(a))
        ctx.stroke()
      }
    }
  }

  // ---------- 🔦 light ----------
  function torchAxis(v: View) {
    const tx = W * 0.12
    const ty = st.current.torchY
    const a = Math.atan2(v.cy - ty, v.cx - tx)
    return { tx, ty, a, dx: Math.cos(a), dy: Math.sin(a) }
  }

  function lightBehind(ctx: CanvasRenderingContext2D, v: View, isDiamond: boolean) {
    const { tx, ty, a } = torchAxis(v)
    const R = (isDiamond ? 2.3 : 2.9) * v.S
    const dist = Math.hypot(v.cx - tx, v.cy - ty) - R
    // a faint beam: the stream the bits of light fly in
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(a)
    const beam = ctx.createLinearGradient(30, 0, dist, 0)
    beam.addColorStop(0, 'rgba(254, 249, 195, 0.35)')
    beam.addColorStop(1, 'rgba(254, 249, 195, 0.12)')
    ctx.fillStyle = beam
    ctx.beginPath()
    ctx.moveTo(30, -13)
    ctx.lineTo(dist, -v.S * 0.7)
    ctx.lineTo(dist, v.S * 0.7)
    ctx.lineTo(30, 13)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  /** diamond: where the light goes in, bounces and comes out */
  function diamondPath(v: View) {
    const { dx, dy } = torchAxis(v)
    const R = 2.3 * v.S
    const at = (along: number, side: number) => ({ x: v.cx + dx * along * R - dy * side * R, y: v.cy + dy * along * R + dx * side * R })
    return [at(-1, 0), at(-0.15, 0.55), at(0.35, -0.5), at(0.9, 0.08)]
  }

  function lightFront(ctx: CanvasRenderingContext2D, t: number, v: View, isDiamond: boolean, pts: Pt[], ph: number) {
    const s = st.current
    const { tx, ty, a, dx, dy } = torchAxis(v)
    const head = { x: tx + dx * 30, y: ty + dy * 30 }
    const free = freeSpots(pts, t)
    const path = diamondPath(v)
    const out = path[path.length - 1]
    const rayDir = (c: number) => a + 0.25 + (c - 2.5) * 0.07

    if (isDiamond) {
      // the light's road inside: it bounces off the faces, then leaves on
      // the far side, split into its colors — one road, start to end
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(254, 249, 195, 0.35)'
      ctx.lineWidth = 6
      ctx.beginPath()
      path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.stroke()
      LIGHT_COLORS.forEach((c, i) => {
        const b = rayDir(i)
        ctx.strokeStyle = c
        ctx.globalAlpha = 0.45
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(out.x, out.y)
        ctx.lineTo(out.x + Math.cos(b) * W, out.y + Math.sin(b) * W)
        ctx.stroke()
      })
      ctx.restore()
      for (const p of path.slice(1, 3)) {
        const k = 0.6 + 0.4 * Math.sin(t * 10 + p.x)
        ctx.strokeStyle = `rgba(255, 255, 255, ${k})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(p.x - 11, p.y)
        ctx.lineTo(p.x + 11, p.y)
        ctx.moveTo(p.x, p.y - 11)
        ctx.lineTo(p.x, p.y + 11)
        ctx.stroke()
      }
    }

    // the electrons: graphite's free ones wander, diamond's sit in pairs
    // in the bonds, held tight
    free.forEach((p, i) => {
      const since = t - (s.caught[i] ?? -9)
      const hot = since < 0.5 ? 1 - since / 0.5 : 0
      const jig = hot * 3 * Math.sin(t * 60 + i)
      glowElectron(ctx, p.x + jig, p.y - jig, 5.5 + 2 * hot, 1 - ph, hot)
    })
    for (const p of heldSpots(pts, t)) glowElectron(ctx, p.x, p.y, 3.4, ph)

    // bits of light, flying from the torch
    if (t - s.lastPhoton > 0.11) {
      s.lastPhoton = t
      // graphite: one of the free electrons near the front will catch it
      const near = free
        .map((p, i) => ({ i, score: Math.hypot(p.x - head.x, p.y - head.y) + 3 * Math.abs((p.x - head.x) * dy - (p.y - head.y) * dx) }))
        .sort((p, q) => p.score - q.score)
        .slice(0, 5)
      const lat = (Math.random() - 0.5) * 18
      s.photons.push({ t0: t, x0: head.x - dy * lat, y0: head.y + dx * lat, target: near[Math.floor(Math.random() * near.length)]?.i ?? 0, color: Math.floor(Math.random() * 6), diamond: isDiamond })
    }
    const SPEED = 360
    s.photons = s.photons.filter((f) => {
      const d = (t - f.t0) * SPEED
      if (!f.diamond) {
        const to = free[f.target]
        if (!to || isDiamond) return false
        const len = Math.hypot(to.x - f.x0, to.y - f.y0)
        if (d >= len) {
          s.caught[f.target] = t // caught: the light becomes a little jiggle
          return false
        }
        const u = d / len
        drawPhoton(ctx, f.x0 + (to.x - f.x0) * u, f.y0 + (to.y - f.y0) * u, (to.x - f.x0) / len, (to.y - f.y0) / len, '#fef9c3')
        return true
      }
      if (!isDiamond) return false
      const b = rayDir(f.color)
      const road = pathWalker([[f.x0, f.y0], ...path.map((p) => [p.x, p.y] as [number, number]), [out.x + Math.cos(b) * W, out.y + Math.sin(b) * W]])
      if (d >= road.total) return false
      const p = road.at(d)
      const back = road.at(Math.max(0, d - 6))
      const len = Math.hypot(p.x - back.x, p.y - back.y) || 1
      drawPhoton(ctx, p.x, p.y, (p.x - back.x) / len, (p.y - back.y) / len, p.seg >= path.length ? LIGHT_COLORS[f.color] : '#ffffff')
      return true
    })

    // what the eye cannot see, in words
    if (isDiamond) {
      const target = pinned('light-held', heldSpots(pts, t), (p) => -p.y, 3)
      callout(ctx, ['Diamond holds every electron tight, in pairs', 'in the bonds between atoms. Light cannot', 'move them — so it flies on through.'], W * 0.4, H * 0.8, target)
    } else {
      const target = pinned('light-free', free, (p) => -p.y, 2)
      callout(ctx, ['Graphite has free electrons (the glowing dots).', 'They catch the light — every color — and turn', 'it into a little warmth. Nothing gets through.'], W * 0.45, H * 0.8, target)
    }

    // the torch, lying along its own beam
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(a)
    ctx.fillStyle = '#475569'
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(-58, -11, 54, 22, 5)
    ctx.fill()
    ctx.stroke()
    ctx.strokeStyle = '#334155'
    for (const gx of [-48, -40, -32]) {
      ctx.beginPath()
      ctx.moveTo(gx, -8)
      ctx.lineTo(gx, 8)
      ctx.stroke()
    }
    ctx.fillStyle = '#64748b'
    ctx.strokeStyle = '#94a3b8'
    ctx.beginPath()
    ctx.moveTo(-4, -11)
    ctx.lineTo(26, -16)
    ctx.lineTo(26, 16)
    ctx.lineTo(-4, 11)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fef9c3'
    ctx.beginPath()
    ctx.ellipse(28, 0, 4, 15, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // the hint sits on the side the beam does not go
    label(ctx, '↕ drag to move the torch', tx - 6, ty + (dy > 0 ? -54 : 54), undefined, 12)
  }

  // ---------- 🔋 electricity ----------
  function powerFront(ctx: CanvasRenderingContext2D, t: number, dt: number, v: View, isDiamond: boolean, reach: number, pts: Pt[], ph: number) {
    const s = st.current
    const xL = s.block.min - reach - 10
    const xR = s.block.max + reach + 10
    const yTop = s.block.top - reach
    const yBot = s.block.bottom + reach
    const wy = v.cy
    const by = battery.y
    const flowing = s.on && !isDiamond
    s.lever += ((s.on ? 0 : -0.62) - s.lever) * Math.min(1, dt * 12)
    if (flowing) s.flow += dt * 70

    // the electrons' road: out of the battery's minus end, up, through the
    // block, down, through the bulb and the switch, into the plus end
    const route: Array<[number, number]> = [
      [battery.x - battery.w / 2 - 6, by],
      [W * 0.1, by],
      [W * 0.1, wy],
      [xL, wy],
      [xR, wy],
      [W * 0.9, wy],
      [W * 0.9, by],
      [bulb.x + 14, by],
      [bulb.x - 14, by],
      [sw.x + 28, by],
      [sw.x - 28, by],
      [battery.x + battery.w / 2 + 6, by],
    ]
    const BLOCK_SEG = 3
    const SWITCH_SEG = 9
    // wires
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.beginPath()
    route.forEach((p, i) => {
      if (i === BLOCK_SEG + 1 || i === SWITCH_SEG + 1) ctx.moveTo(p[0], p[1])
      else if (i) ctx.lineTo(p[0], p[1])
      else ctx.moveTo(p[0], p[1])
    })
    ctx.stroke()
    // clips on both sides of the block
    ctx.fillStyle = '#64748b'
    for (const x of [xL - 4, xR - 4]) {
      ctx.beginPath()
      ctx.roundRect(x, yTop, 8, yBot - yTop, 3)
      ctx.fill()
    }

    // the electrons in the wire
    const walk = pathWalker(route)
    const n = Math.floor(walk.total / 26)
    for (let i = 0; i < n; i++) {
      const p = walk.at(i * 26 + s.flow)
      if (p.seg === BLOCK_SEG) continue // inside the block: see below
      if (p.seg === SWITCH_SEG && !s.on) continue
      drawGlossyParticle(ctx, 'electrons', p.x, p.y + (flowing ? 0 : Math.sin(t * 5 + i) * 0.6), 3.6)
    }
    // graphite: every atom has one electron left over. With the switch
    // closed, each one hops to the next atom along its row, all together —
    // from the left clip, atom to atom, into the right clip
    const seats = ROWS.flat().map((i) => ({ x: pts[i].sx, y: pts[i].sy - v.S * 0.17 }))
    if (ph < 0.5) {
      const h = s.flow / HOP_PX
      ROWS.forEach((row, r) => {
        // each electron rides just above its atom, so the atom stays in view
        const lift = v.S * 0.17
        const P = [{ x: xL, y: pts[row[0]].sy - lift }, ...row.map((i) => ({ x: pts[i].sx, y: pts[i].sy - lift })), { x: xR, y: pts[row[row.length - 1]].sy - lift }]
        const cycle = row.length + 1
        for (let k = 1; k <= row.length; k++) {
          // no marching in step: every row has its own moment (spread
          // evenly, golden-ratio steps, so somewhere a hop is always
          // happening), and each electron hops a little earlier or later
          // than its neighbours, drifting as they go (kept small, so two
          // never share an atom or overtake)
          const rowPhase = (r * 0.618) % 1
          const jitter = 0.14 * Math.sin(h * 0.37 + r * 1.7 + k * 2.9)
          const q = (((k + h + rowPhase + jitter) % cycle) + cycle) % cycle
          const a = Math.floor(q)
          const f = q - a
          // sit on the atom, then a quick hop to the next one; switched
          // off, nobody stays frozen in mid-air
          const e = Math.min(1, Math.max(0, (f - 0.6) / 0.4))
          const u = flowing ? e * e * (3 - 2 * e) : Math.round(e)
          const from = P[a]
          const to = P[a + 1]
          const x = from.x + (to.x - from.x) * u
          const y = from.y + (to.y - from.y) * u - Math.sin(Math.PI * u) * 10 + (flowing ? 0 : Math.sin(t * 5 + k) * 0.8)
          glowElectron(ctx, x, y, 4.2, 1 - ph)
        }
      })
    }
    // diamond: every outer electron sits in a bond, a pair between two atoms
    const held = heldSpots(pts, t)
    for (const p of held) glowElectron(ctx, p.x, p.y, 3.4, ph)

    // what the eye cannot see, in words
    const boxTop = s.block.bottom + reach + 34
    if (isDiamond)
      callout(
        ctx,
        ['Diamond holds on to its electrons: every one', 'sits tight in a bond, a pair between two atoms.', 'None can run — so no electricity flows.'],
        W / 2,
        boxTop,
        pinned('power-held', held, (p) => -p.y, 2),
      )
    else
      callout(
        ctx,
        s.on
          ? ['Graphite lets its electrons go: every atom has', 'one left over, and these free electrons run', 'along the sheets — all the way round.']
          : ['Graphite has free electrons: every atom', 'has one left over (the glowing dots).', 'Close the switch and they can run.'],
        W / 2,
        boxTop,
        // a fixed seat on one atom: the electrons hop through it
        pinned('power-seat', seats, (p) => Math.abs(p.x - W / 2) - p.y * 0.5),
      )

    // the battery: blue minus end, red plus end
    const { x: bx, w: bw, h: bh } = battery
    ctx.fillStyle = '#2563eb'
    ctx.beginPath()
    ctx.roundRect(bx - bw / 2, by - bh / 2, bw / 2, bh, [8, 0, 0, 8])
    ctx.fill()
    ctx.fillStyle = '#dc2626'
    ctx.beginPath()
    ctx.roundRect(bx, by - bh / 2, bw / 2, bh, [0, 8, 8, 0])
    ctx.fill()
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(bx + bw / 2, by - 8, 7, 16)
    label(ctx, '−', bx - bw / 4, by - 1, '#ffffff', 30, '700')
    label(ctx, '+', bx + bw / 4, by - 1, '#ffffff', 28, '700')
    label(ctx, 'battery', bx, by + bh / 2 + 14)

    // the switch: tap it
    ctx.fillStyle = '#1e293b'
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    for (const x of [sw.x - 28, sw.x + 28]) {
      ctx.beginPath()
      ctx.arc(x, by, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    const ex = sw.x - 28 + Math.cos(s.lever) * 60
    const ey = by + Math.sin(s.lever) * 60
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(sw.x - 28, by)
    ctx.lineTo(ex, ey)
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(ex, ey, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineCap = 'butt'
    label(ctx, s.on ? 'switch: on' : 'switch: off — tap it', sw.x, by + 30, s.on ? '#cbd5e1' : AMBER, 12, s.on ? '' : '600')

    // the light bulb
    const lit = flowing
    const gx = bulb.x
    const gy = by - 58
    if (lit) {
      const halo = ctx.createRadialGradient(gx, gy, 6, gx, gy, 90)
      halo.addColorStop(0, 'rgba(253, 224, 71, 0.7)')
      halo.addColorStop(1, 'rgba(253, 224, 71, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(gx, gy, 90, 0, Math.PI * 2)
      ctx.fill()
    }
    // screw base
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(gx - 12, by - 32, 24, 24)
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    for (const yy of [by - 26, by - 19, by - 12]) {
      ctx.beginPath()
      ctx.moveTo(gx - 12, yy)
      ctx.lineTo(gx + 12, yy + 3)
      ctx.stroke()
    }
    ctx.fillStyle = '#334155'
    ctx.fillRect(gx - 6, by - 8, 12, 8)
    // glass
    ctx.fillStyle = lit ? 'rgba(254, 240, 138, 0.9)' : 'rgba(148, 163, 184, 0.18)'
    ctx.strokeStyle = lit ? '#fde68a' : '#cbd5e1'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(gx, gy, 27, Math.PI * 0.72, Math.PI * 2.28)
    ctx.lineTo(gx + 12, by - 32)
    ctx.lineTo(gx - 12, by - 32)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    // the filament
    ctx.strokeStyle = lit ? '#fff7ed' : '#64748b'
    ctx.lineWidth = lit ? 2 : 1.3
    ctx.beginPath()
    ctx.moveTo(gx - 6, by - 32)
    ctx.lineTo(gx - 9, gy + 2)
    for (let k = 0; k <= 6; k++) ctx.lineTo(gx - 9 + k * 3, gy + (k % 2 ? -5 : 2))
    ctx.lineTo(gx + 6, by - 32)
    ctx.stroke()
    label(ctx, 'light bulb', gx, by + 30)
  }

  // ---------- 🗜️🔥 squeeze and heat ----------
  function pressGeometry(t: number, v: View) {
    const s = st.current
    // the press trembles while it fights the block
    const fight = s.pressure * (s.phase < 0.98 ? 1 : 0.35)
    const jx = Math.sin(t * 47) * 4 * fight
    const jy = Math.sin(t * 31) * 3 * fight
    const half = v.S * 3.6
    return {
      left: v.cx - half,
      w: 2 * half,
      topY: v.cy - v.S * (3.3 - 0.6 * s.pressure) + jy,
      jx,
      botY: v.cy + v.S * 3.0,
    }
  }

  function squeezeBehind(ctx: CanvasRenderingContext2D, v: View) {
    const s = st.current
    if (s.heat > 0) {
      const g = ctx.createRadialGradient(v.cx, v.cy + v.S * 3, v.S, v.cx, v.cy, v.S * 6)
      g.addColorStop(0, `rgba(251, 146, 60, ${0.45 * s.heat})`)
      g.addColorStop(1, 'rgba(251, 146, 60, 0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }
  }

  function squeezeFront(ctx: CanvasRenderingContext2D, t: number, v: View) {
    const s = st.current
    const p = pressGeometry(t, v)
    // the rod, the hose to the button, the top plate
    ctx.fillStyle = '#475569'
    ctx.fillRect(v.cx - 12 + p.jx, -4, 24, p.topY - 22 + 4)
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(v.cx + 12, H * 0.08)
    ctx.quadraticCurveTo(button.x, H * 0.04, button.x, button.y - button.r)
    ctx.stroke()
    ctx.fillStyle = '#64748b'
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(p.left + p.jx, p.topY - 24, p.w, 24, 6)
    ctx.fill()
    ctx.stroke()
    if (s.pressure > 0.05) {
      // cartoon effort lines at the plate's ends
      ctx.strokeStyle = `rgba(226, 232, 240, ${Math.min(1, s.pressure * 1.5)})`
      ctx.lineWidth = 2
      for (const side of [-1, 1]) {
        const x = side < 0 ? p.left - 10 : p.left + p.w + 10
        for (const k of [-1, 0, 1]) {
          ctx.beginPath()
          ctx.moveTo(x + p.jx, p.topY - 12 + k * 9)
          ctx.lineTo(x + side * (12 + 6 * Math.abs(Math.sin(t * 20 + k))) + p.jx, p.topY - 12 + k * 12)
          ctx.stroke()
        }
      }
    }
    // the bottom plate, on the burner
    ctx.fillStyle = '#64748b'
    ctx.beginPath()
    ctx.roundRect(p.left, p.botY, p.w, 24, 6)
    ctx.fill()
    ctx.stroke()
    label(ctx, '63 carbon atoms', v.cx, p.botY + 12, '#e2e8f0', 12, '600')
    // the fire under it
    const fy = p.botY + 30
    ctx.fillStyle = '#334155'
    ctx.fillRect(p.left + p.w * 0.15, fy + 62, p.w * 0.7, 10)
    for (let k = 0; k < 7; k++) {
      const x = p.left + p.w * (0.2 + k * 0.1)
      const h = s.heat < 0.03 ? 8 : 14 + 52 * s.heat * (0.8 + 0.2 * Math.sin(t * 13 + k * 2))
      const g = ctx.createLinearGradient(0, fy + 62 - h, 0, fy + 62)
      if (s.heat < 0.03) {
        g.addColorStop(0, 'rgba(96, 165, 250, 0.2)')
        g.addColorStop(1, 'rgba(59, 130, 246, 0.9)')
      } else {
        g.addColorStop(0, 'rgba(254, 240, 138, 0.15)')
        g.addColorStop(0.35, '#fbbf24')
        g.addColorStop(1, '#ef4444')
      }
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x - 11, fy + 62)
      ctx.quadraticCurveTo(x - 12, fy + 62 - h * 0.5, x + Math.sin(t * 9 + k) * 4, fy + 62 - h)
      ctx.quadraticCurveTo(x + 12, fy + 62 - h * 0.5, x + 11, fy + 62)
      ctx.closePath()
      ctx.fill()
    }

    // the big red button
    const pressed = s.holding
    ctx.fillStyle = '#450a0a'
    ctx.beginPath()
    ctx.ellipse(button.x, button.y + 10, button.r + 6, button.r * 0.55 + 6, 0, 0, Math.PI * 2)
    ctx.fill()
    const lift = pressed ? 2 : 10
    ctx.fillStyle = '#991b1b'
    ctx.beginPath()
    ctx.ellipse(button.x, button.y + 6, button.r, button.r * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(button.x - button.r, button.y + 6 - lift, button.r * 2, lift)
    const g = ctx.createRadialGradient(button.x - 12, button.y - lift - 8, 4, button.x, button.y - lift, button.r)
    g.addColorStop(0, '#fca5a5')
    g.addColorStop(1, '#dc2626')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(button.x, button.y + 6 - lift, button.r, button.r * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
    label(ctx, 'PUSH', button.x, button.y + 6 - lift, '#ffffff', 17, '800')
    label(ctx, 'hold to squeeze', button.x, button.y + button.r * 0.55 + 30, pressed ? '#cbd5e1' : AMBER, 12, '600')
    // how hard it squeezes
    const gx = button.x - 40
    const gy = button.y + button.r * 0.55 + 48
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.roundRect(gx, gy, 80, 10, 5)
    ctx.fill()
    if (s.pressure > 0.01) {
      ctx.fillStyle = '#f87171'
      ctx.beginPath()
      ctx.roundRect(gx, gy, Math.max(4, 80 * s.pressure), 10, 5)
      ctx.fill()
    }
    // how hard is hard enough (at this heat): a white tick to reach
    const need = 0.5 + 0.2 * Math.max(0.45, s.heat)
    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)'
    ctx.fillRect(gx + 80 * need - 1, gy - 3, 2, 16)
    // a fresh press flashes the gauge
    if (s.bump > 0) {
      ctx.strokeStyle = `rgba(251, 191, 36, ${s.bump})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(gx - 3, gy - 3, 86, 16, 7)
      ctx.stroke()
    }

    // the fire control: drag the flame
    const { x0, x1, y } = fire
    const track = ctx.createLinearGradient(x0, 0, x1, 0)
    track.addColorStop(0, '#334155')
    track.addColorStop(0.5, '#f59e0b')
    track.addColorStop(1, '#dc2626')
    ctx.fillStyle = track
    ctx.beginPath()
    ctx.roundRect(x0, y - 6, x1 - x0, 12, 6)
    ctx.fill()
    label(ctx, 'cold', x0 - 12, y, undefined, 12, '', 'right')
    label(ctx, 'hot', x1 + 12, y, undefined, 12, '', 'left')
    const hx = x0 + (x1 - x0) * s.heat
    emoji(ctx, '🔥', hx, y - 4, 34 + 10 * s.heat)
    if (!s.firing && s.heat < 0.05) label(ctx, '← drag the fire →', (x0 + x1) / 2, y + 26, AMBER, 12, '600')
  }

  // ---------- the pointer ----------
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    const q = canvasPoint(e, W, H)
    const { scene } = props.current
    Object.assign(s.ptr, { ...q, down: true, inside: true, x0: q.x, y0: q.y, yaw0: s.yaw, pitch0: s.pitch })
    e.currentTarget.setPointerCapture(e.pointerId)
    if (scene === 'write') moveWrite(q, true)
    if (scene === 'push') s.side = q.x < (s.block.min + s.block.max) / 2 ? 'left' : 'right'
    if (scene === 'light') {
      s.torchY = Math.min(H * 0.8, Math.max(H * 0.15, q.y))
      s.torchUsed = true
    }
    if (scene === 'power' && Math.hypot(q.x - sw.x, q.y - (sw.y - 14)) < 54) s.on = !s.on
    if (scene === 'squeeze') {
      if (Math.hypot(q.x - button.x, (q.y - button.y) * 1.4) < button.r + 12) {
        s.holding = true
        // every press squeezes a little at once: the gauge jumps and flashes
        s.pressure = Math.min(1, s.pressure + 0.1)
        s.bump = 1
      }
      else if (Math.abs(q.y - fire.y) < 30 && q.x > fire.x0 - 24 && q.x < fire.x1 + 24) {
        s.firing = true
        s.heat = Math.min(1, Math.max(0, (q.x - fire.x0) / (fire.x1 - fire.x0)))
      }
    }
  }
  const moveWrite = (q: { x: number; y: number }, start = false) => {
    const s = st.current
    const prev = { ...s.pen }
    // the tip stays on the paper
    const y = Math.min(paper.bottom - 20, Math.max(paper.top + 40, q.y))
    const u = (y - paper.top) / (paper.bottom - paper.top)
    const inset = paper.inTop + (paper.inBottom - paper.inTop) * u + 30
    s.pen = { x: Math.min(W - inset, Math.max(inset, q.x)), y }
    if (!s.ptr.down || start || !onPaper(q.x, q.y)) return
    const d = Math.hypot(s.pen.x - prev.x, s.pen.y - prev.y)
    if (props.current.material === 'diamond' || s.phase > 0.5) {
      s.acc += d
      while (s.acc >= 7) {
        s.acc -= 7
        s.marks.push({ x: s.pen.x + (Math.random() - 0.5) * 4, y: s.pen.y + (Math.random() - 0.5) * 3, tear: true })
      }
      return
    }
    // graphite: atoms leave the bottom sheet, one by one, and land here
    s.acc += d
    while (s.acc >= 10) {
      s.acc -= 10
      const bottom = s.layers[0]
      const left = s.bottom.filter((b) => !bottom.gone.has(b.j))
      if (!left.length) break
      const pick = left[Math.floor(Math.random() * left.length)]
      bottom.gone.add(pick.j)
      s.flying.push({ x0: pick.sx, y0: pick.sy, x1: s.pen.x + (Math.random() - 0.5) * 10, y1: s.pen.y + (Math.random() - 0.5) * 5, t0: s.clock })
      if (bottom.gone.size >= TEMPLATE[bottom.par].length) {
        // the sheet is used up: the ones above move down, a new one comes in
        s.layers.shift()
        s.layers.push({ par: 1 - s.layers[1].par, gone: new Set() })
        s.drop = 1
        s.bottom = []
        s.sheets += 1
        onSheets?.(s.sheets)
      }
    }
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = st.current
    const q = canvasPoint(e, W, H)
    const { scene } = props.current
    s.ptr.x = q.x
    s.ptr.y = q.y
    s.ptr.inside = true
    if (scene === 'write') moveWrite(q)
    if (!s.ptr.down) return
    if (scene === 'look') {
      s.yaw = s.ptr.yaw0 + (q.x - s.ptr.x0) / 140
      s.pitch = Math.min(1.3, Math.max(-0.3, s.ptr.pitch0 + (q.y - s.ptr.y0) / 180))
    }
    if (scene === 'light') {
      s.torchY = Math.min(H * 0.8, Math.max(H * 0.15, q.y))
      s.torchUsed = true
    }
    if (scene === 'squeeze' && s.firing) s.heat = Math.min(1, Math.max(0, (q.x - fire.x0) / (fire.x1 - fire.x0)))
  }
  const onUp = () => {
    const s = st.current
    s.ptr.down = false
    s.holding = false
    s.firing = false
  }
  const onLeave = () => {
    st.current.ptr.inside = false
  }

  const cursor: Record<CarbonScene, string> = {
    look: 'cursor-grab active:cursor-grabbing',
    write: 'cursor-none',
    push: 'cursor-none',
    light: 'cursor-ns-resize',
    power: 'cursor-pointer',
    squeeze: 'cursor-pointer',
  }
  return (
    <canvas
      ref={ref}
      style={{ width: W, height: H, touchAction: 'none' }}
      className={cursor[scene]}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onLeave}
    />
  )
}
