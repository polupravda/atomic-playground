import { blit } from './canvasUtil'
import { clamp01, easeIn, easeInOut, easeOut } from './canvasUtil'
import {
  AMBER,
  AMBER_SOFT,
  GREY,
  frac,
  lerp,
  marker,
  miniAtom,
  neutronSprite,
  rnd,
  shellAtom,
  shellAtomR,
  tag,
  text,
} from './storyDraw'
import { BOMB_SPLITTABLE_PER_100, FUEL_SPLITTABLE_PER_100 } from '../core/plant'

// R03 — ⚡ How a power plant works (story design:
// docs/how-things-work/12-story-designs-for-kids.md, which wins over
// proposal 07 for the story). One question — can the bomb's chain light a
// city instead? — one aha (let every split cause only ONE more: steady
// heat, a very big kettle), three new words (control rod, turbine,
// generator), one hero neutron in the amber ring. Seven beats:
//   remember  the bomb's chain as a dot tree: 1, 2, 4 … 128 in a blink
//   rods      fuel rods (uranium atoms inside) standing in water, a grey
//             control rod hanging between each; our neutron splits an atom
//             in one fuel rod: one new neutron is swallowed by the control
//             rod, the other crosses the water and splits just one atom in
//             the next fuel rod — CONTROL RODS. A "we are here" corner
//             (also in the heat close-up) shows which part is zoomed
//   steady    show first: the bomb's tree beside the plant's single line
//   heat      inside a fuel rod, very close: a split's two pieces fly into
//             the atoms around them, which shake harder and harder — that
//             shaking IS heat (the States of matter lab's "vibrate");
//             a thermometer climbs, the water beside the rod boils
//   kettle    zoom out: heat → boiling water → steam → a TURBINE spins
//             (flow: never frozen)
//   lights    the turbine turns a GENERATOR; electricity runs to a town,
//             windows light one by one
//   safe      a hand pulls the rods too far: the line branches; the rods
//             drop back by themselves, the splits die down; the fuel has
//             far too little splitting uranium to explode (two jars of 100)
//   waste     the used fuel rod is lifted out: RADIOACTIVE — invisible rays
//             drawn as the app's violet γ waves; it rests in a deep pool
//             (the water stops the rays), then goes into a thick steel and
//             concrete cask behind a fence; an hourglass keeps turning
//             (100 … 100,000 years): the problem is not solved yet
// Key motion runs on story time `t`; life (electrons, bubbles, the
// turbine once it runs, flicker, the marker's pulse) on the idle clock.

export const PLANT_ORDER = ['remember', 'rods', 'steady', 'heat', 'kettle', 'lights', 'safe', 'waste'] as const
export type PlantBeat = (typeof PLANT_ORDER)[number]

/** story seconds per beat (each piece of a science line gets a 2.5 s watch
 *  break; the beats are sized to their lines' pieces) */
export const PLANT_T: Record<PlantBeat, number> = {
  remember: 10,
  rods: 10.5,
  steady: 10,
  heat: 13.5,
  kettle: 14,
  lights: 8,
  safe: 10.5,
  waste: 15.5,
}

interface Box {
  W: number
  UH: number
  H: number
}

const fadeIn = (t: number, at: number, len = 0.8) => clamp01((t - at) / len)

function backdrop(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#060b1a')
  g.addColorStop(1, '#020617')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

// ---------- the dot pictures of a chain ----------

/** the bomb's chain as a tree: generation g has 2^g splits; `grow` 0…gens
 *  reveals it generation by generation */
function chainTree(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  w: number,
  h: number,
  gens: number,
  grow: number,
  alpha = 1,
) {
  if (grow <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const dx = w / Math.max(1, gens - 1)
  const pos = (g: number, i: number) => ({ x: x0 + g * dx, y: y0 + ((i + 0.5) * h) / 2 ** g })
  for (let g = 0; g < gens; g++) {
    const q = clamp01(grow - g)
    if (q <= 0) break
    const n = 2 ** g
    // each mark is an atom (outer ring r), as big as its row allows
    const r = Math.max(2, Math.min(11, (h / n) * 0.42))
    for (let i = 0; i < n; i++) {
      const p = pos(g, i)
      if (g > 0) {
        const parent = pos(g - 1, i >> 1)
        // the neutron flying from one split atom to the next
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.45 * q})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(parent.x, parent.y)
        ctx.lineTo(lerp(parent.x, p.x, q), lerp(parent.y, p.y, q))
        ctx.stroke()
      }
      if (q >= 0.6) miniAtom(ctx, p.x, p.y, r * easeOut(clamp01((q - 0.6) / 0.4)))
    }
  }
  ctx.restore()
}

/** the power plant's chain: one split after another, on one line; the
 *  newest dots scroll in from the right once the line is full */
function chainLine(ctx: CanvasRenderingContext2D, x0: number, y: number, w: number, count: number, pop: number, alpha = 1) {
  if (count <= 0) return
  const sp = 24
  const cap = Math.max(2, Math.floor(w / sp))
  const first = Math.max(0, count - cap)
  ctx.save()
  ctx.globalAlpha *= alpha
  for (let k = first; k < count; k++) {
    const x = x0 + (k - first) * sp
    if (k > first) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x - sp, y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    miniAtom(ctx, x, y, k === count - 1 ? 9 * easeOut(pop) : 9)
  }
  ctx.restore()
  return x0 + (count - 1 - first) * sp
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, color = GREY) {
  ctx.fillStyle = 'rgba(30, 41, 59, 0.45)'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 14)
  ctx.fill()
  text(ctx, title, x + w / 2, y + 22, color, 15, '600')
}

/** what the chart marks mean: an atom that splits, a neutron flying on */
function chartLegend(ctx: CanvasRenderingContext2D, cx: number, y: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const a = 'a uranium atom splits'
  const n = 'a neutron flies to the next atom'
  ctx.font = '13px ui-sans-serif, system-ui, sans-serif'
  const wa = ctx.measureText(a).width
  const wn = ctx.measureText(n).width
  const total = 22 + 8 + wa + 28 + 30 + 8 + wn
  let x = cx - total / 2
  ctx.fillStyle = 'rgba(2, 6, 23, 0.75)'
  ctx.beginPath()
  ctx.roundRect(x - 12, y - 16, total + 24, 32, 8)
  ctx.fill()
  miniAtom(ctx, x + 11, y, 10)
  x += 30
  text(ctx, a, x, y, GREY, 13, '', 'left')
  x += wa + 28
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + 30, y)
  ctx.stroke()
  blit(ctx, neutronSprite(), x + 30, y)
  x += 38
  text(ctx, n, x, y, GREY, 13, '', 'left')
  ctx.restore()
}

// ---------- beat 1: remember the bomb ----------

function drawRemember(ctx: CanvasRenderingContext2D, b: Box, t: number) {
  backdrop(ctx, b.W, b.H)
  const x0 = b.W * 0.08
  const w = b.W * 0.84
  const y0 = b.UH * 0.14
  const h = b.UH * 0.6
  const gens = 8
  // "in a blink": the whole tree in about two seconds
  const grow = gens * easeIn(clamp01(t / 2.2))
  chainTree(ctx, x0, y0, w, h, gens, grow)
  const dx = w / (gens - 1)
  for (let g = 0; g < gens; g++) {
    if (grow - g < 0.6) break
    text(ctx, String(2 ** g), x0 + g * dx, y0 + h + 22, '#fdba74', 14, '700')
  }
  text(ctx, "the atomic bomb's chain reaction", b.W / 2, y0 - 58, '#fdba74', 16, '700')
  chartLegend(ctx, b.W / 2, y0 - 24, fadeIn(t, 0.3))
  tag(ctx, 'all in a blink', b.W / 2, y0 + h + 52, AMBER_SOFT, 13, fadeIn(t, 2.4))
  // the question, in big letters (in just before it is asked)
  const q = fadeIn(t, 6.6)
  if (q > 0) {
    ctx.save()
    ctx.globalAlpha = q
    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)'
    ctx.fillRect(0, b.UH * 0.82, b.W, 64)
    text(ctx, 'Can the same atoms light up a city instead?', b.W / 2, b.UH * 0.82 + 32, '#fef3c7', Math.min(26, b.W / 30), '700')
    ctx.restore()
  }
}

interface Flight {
  from: { x: number; y: number }
  to: { x: number; y: number }
  t0: number
  t1: number
}

// ---------- "you are here": which part of the reactor a close-up shows ----------

/** a tiny reactor (the kettle beat's vessel) in the corner, with a
 *  magnifier box around the part the close-up shows: a group of fuel rods
 *  (`group`) or a single one (`one`) */
function youAreHere(ctx: CanvasRenderingContext2D, b: Box, focus: 'group' | 'one') {
  const w = 92
  const h = 78
  const x = b.W - w - 16
  const y = 14
  ctx.save()
  ctx.fillStyle = 'rgba(2, 6, 23, 0.8)'
  ctx.beginPath()
  ctx.roundRect(x - 8, y - 6, w + 16, h + 26, 10)
  ctx.fill()
  // the vessel, its water, 5 fuel rods and 4 control rods
  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(x, y + 10, w, h - 10, 8)
  ctx.fill()
  ctx.stroke()
  const fx = (i: number) => x + ((i + 0.5) * w) / 5
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#ea7c3c'
    ctx.fillRect(fx(i) - 3, y + 26, 6, h - 30)
  }
  for (let i = 1; i < 5; i++) {
    ctx.fillStyle = '#cbd5e1'
    ctx.fillRect(x + (i * w) / 5 - 1.5, y + 2, 3, h * 0.55)
  }
  // the magnifier box
  const bx0 = focus === 'group' ? fx(1) - 12 : fx(2) - 8
  const bx1 = focus === 'group' ? fx(3) + 12 : fx(2) + 8
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2.5
  ctx.strokeRect(bx0, y + 22, bx1 - bx0, h - 22)
  text(ctx, '🔍 we are here', x + w / 2, y + h + 12, AMBER_SOFT, 11, '600')
  ctx.restore()
}

/** what one uranium atom splits into (the usual pair): barium and krypton.
 *  The electrons are SHARED, never lost (Elena, 2026-11-20): 56 + 36 = 92,
 *  exactly the uranium's 92 — each piece is a whole atom with its shells */
const SPLIT_INTO = [
  { protons: 56, nucleons: 141 }, // barium
  { protons: 36, nucleons: 92 }, // krypton
] as const

// ---------- beat 2: the control rods (close up) ----------

/** split times of atoms A (fuel rod 1), B (2), C (3) (story s) */
const SPLITS = [3.5, 6.4, 9.0]

function rodsLayout(b: Box) {
  const surf = b.UH * 0.13
  // three fuel rods standing in water, a control rod hanging between each
  const fuel = [
    { x0: b.W * 0.04, x1: b.W * 0.24 },
    { x0: b.W * 0.4, x1: b.W * 0.6 },
    { x0: b.W * 0.76, x1: b.W * 0.96 },
  ]
  const ry0 = b.UH * 0.2
  const ry1 = b.UH * 0.88
  const ctrl = [b.W * 0.32, b.W * 0.68]
  const tipY = b.UH * 0.5
  const rows = 4
  const rh = (ry1 - ry0 - 24) / rows
  const K = (Math.min(fuel[0].x1 - fuel[0].x0, rh) * 0.4) / shellAtomR(92, 1)
  const ar = shellAtomR(92, K)
  const atomAt = (f: number, r: number) => ({ x: (fuel[f].x0 + fuel[f].x1) / 2, y: ry0 + 12 + (r + 0.5) * rh })
  return { surf, fuel, ry0, ry1, ctrl, tipY, rows, K, ar, atomAt }
}

/** which atom splits in each fuel rod (its row) */
const SPLIT_ROW = 2

function drawRods(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b.W, b.H)
  const L = rodsLayout(b)
  const { fuel, ctrl, K, ar, atomAt } = L
  // the water, everywhere around the rods
  const floor = b.UH * 0.93
  const wg = ctx.createLinearGradient(0, L.surf, 0, floor)
  wg.addColorStop(0, 'rgba(56, 189, 248, 0.24)')
  wg.addColorStop(1, 'rgba(14, 116, 144, 0.42)')
  ctx.fillStyle = wg
  ctx.beginPath()
  ctx.moveTo(b.W * 0.01, floor)
  for (let i = 0; i <= 40; i++) ctx.lineTo(lerp(b.W * 0.01, b.W * 0.99, i / 40), L.surf + Math.sin(idle * 2 + i * 0.8) * 2)
  ctx.lineTo(b.W * 0.99, floor)
  ctx.closePath()
  ctx.fill()
  // the fuel rods: metal tubes with uranium atoms inside
  for (const [i, f] of fuel.entries()) {
    ctx.fillStyle = '#3b2a1e'
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(f.x0, L.ry0, f.x1 - f.x0, L.ry1 - L.ry0, 16)
    ctx.fill()
    ctx.stroke()
    text(ctx, 'fuel rod', (f.x0 + f.x1) / 2, L.ry0 - 14, 'rgba(226, 232, 240, 0.85)', 12, '600')
    for (let r = 0; r < L.rows; r++) {
      const p = atomAt(i, r)
      const s = r === SPLIT_ROW ? t - SPLITS[i] : -1
      if (s >= 0) {
        // the split: the uranium atom becomes TWO smaller whole atoms
        // (barium up-left, krypton down-right), sharing its electrons; they
        // fly apart and stay in the fuel rod
        const fly = easeOut(clamp01(s / 1.0))
        const rw = (f.x1 - f.x0) / 2
        for (const [j, a] of SPLIT_INTO.entries()) {
          const dir = j === 0 ? -1 : 1
          const fx = p.x + dir * rw * 0.3 * fly
          const fy = p.y + dir * ar * 0.55 * fly
          const ph2 = i * 2.1 + r * 1.7 + j * 3
          shellAtom(ctx, fx + 1.5 * Math.sin(idle * 9 + ph2), fy + 1.5 * Math.cos(idle * 11 + ph2), K, a.protons, a.nucleons, idle)
        }
        if (s < 0.6) {
          const fr = 14 + ar * 2.6 * easeOut(s / 0.6)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, fr)
          g.addColorStop(0, `rgba(255, 247, 214, ${0.95 * (1 - s / 0.6)})`)
          g.addColorStop(1, 'rgba(251, 146, 60, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, fr, 0, Math.PI * 2)
          ctx.fill()
        }
        tag(ctx, 'split!', p.x, p.y - ar - 14, '#fdba74', 13, s < 1.6 ? 1 - clamp01((s - 1.2) / 0.4) : 0)
        continue
      }
      const ph = i * 2.1 + r * 1.7
      shellAtom(ctx, p.x + 1.5 * Math.sin(idle * 9 + ph), p.y + 1.5 * Math.cos(idle * 11 + ph), K, 92, 235, idle)
    }
  }
  text(ctx, 'uranium atoms inside', (fuel[0].x0 + fuel[0].x1) / 2, L.ry1 + 16, 'rgba(254, 243, 199, 0.75)', 11)
  // the control rods, hanging into the water between the fuel rods
  const absorbedAt = [6.0, 8.6]
  for (const [i, x] of ctrl.entries()) {
    const hit = t >= absorbedAt[i] && t < absorbedAt[i] + 0.8
    const glow = hit ? 1 - (t - absorbedAt[i]) / 0.8 : 0
    const g = ctx.createLinearGradient(x - 11, 0, x + 11, 0)
    g.addColorStop(0, '#475569')
    g.addColorStop(0.5, '#cbd5e1')
    g.addColorStop(1, '#334155')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.roundRect(x - 11, -10, 22, L.tipY + 10, 6)
    ctx.fill()
    if (glow > 0) {
      ctx.fillStyle = `rgba(226, 232, 240, ${0.6 * glow})`
      ctx.beginPath()
      ctx.arc(x, L.tipY - 34, 22 * (1 + (1 - glow)), 0, Math.PI * 2)
      ctx.fill()
    }
    tag(ctx, glow > 0 ? 'swallowed!' : 'control rod', x, L.tipY + 22, glow > 0 ? GREY : AMBER, 13)
  }
  // the neutrons: ours (amber ring) splits A; of A's two, one is swallowed
  // by the control rod, the other crosses the water into fuel rod 2 …
  const A = atomAt(0, SPLIT_ROW)
  const B = atomAt(1, SPLIT_ROW)
  const C = atomAt(2, SPLIT_ROW)
  const rodPt = (x: number) => ({ x, y: L.tipY - 34 })
  const flights: Array<Flight & { hero?: boolean }> = [
    { from: { x: -24, y: A.y }, to: { x: A.x - ar * 0.4, y: A.y }, t0: 2.2, t1: SPLITS[0], hero: true },
    { from: A, to: rodPt(ctrl[0]), t0: SPLITS[0] + 0.5, t1: absorbedAt[0] },
    { from: A, to: { x: B.x - ar * 0.4, y: B.y }, t0: SPLITS[0] + 0.5, t1: SPLITS[1], hero: true },
    { from: B, to: rodPt(ctrl[1]), t0: SPLITS[1] + 0.5, t1: absorbedAt[1] },
    { from: B, to: { x: C.x - ar * 0.4, y: C.y }, t0: SPLITS[1] + 0.5, t1: SPLITS[2], hero: true },
    { from: C, to: { x: b.W + 30, y: C.y - b.UH * 0.12 }, t0: SPLITS[2] + 0.5, t1: 10.8 },
  ]
  const n = neutronSprite()
  for (const f of flights) {
    if (t < f.t0 || t >= f.t1) continue
    const q = (t - f.t0) / (f.t1 - f.t0)
    const x = lerp(f.from.x, f.to.x, q)
    const y = lerp(f.from.y, f.to.y, q)
    blit(ctx, n, x, y)
    if (f.hero) marker(ctx, x, y, 13, idle)
  }
  tag(ctx, 'our neutron', b.W * 0.12, A.y - ar - 26, AMBER, 12, t > 2.3 && t < SPLITS[0] ? 1 : 0)
  text(ctx, 'water', b.W * 0.32, floor - 16, 'rgba(186, 230, 253, 0.85)', 12, '600')
  text(ctx, 'water', b.W * 0.68, floor - 16, 'rgba(186, 230, 253, 0.85)', 12, '600')
  youAreHere(ctx, b, 'group')
}

// ---------- beat 3: side by side ----------

function drawSteady(ctx: CanvasRenderingContext2D, b: Box, t: number) {
  backdrop(ctx, b.W, b.H)
  const y = b.UH * 0.2
  const h = b.UH * 0.52
  const pw = b.W * 0.42
  const lx = b.W * 0.05
  const rx = b.W * 0.53
  chartLegend(ctx, b.W / 2, y - 30)
  panel(ctx, lx, y, pw, h, '💥 the bomb', '#fdba74')
  panel(ctx, rx, y, pw, h, '⚡ the power plant', AMBER_SOFT)
  chainTree(ctx, lx + 24, y + 54, pw - 48, h - 90, 6, 6 * easeIn(clamp01(t / 1.6)))
  const count = t < 0.3 ? 0 : Math.floor((t - 0.3) / 0.55) + 1
  const pop = clamp01(((t - 0.3) % 0.55) / 0.25)
  chainLine(ctx, rx + 24, y + h / 2 + 10, pw - 48, count, pop)
  text(ctx, '1 → 2 → 4 → 8 → 16 → 32', lx + pw / 2, y + h - 18, '#fdba74', 13, '600')
  text(ctx, '1 → 1 → 1 → 1 → 1 → …', rx + pw / 2, y + h - 18, AMBER_SOFT, 13, '600')
  tag(ctx, 'doubles and doubles', lx + pw / 2, y + h + 30, GREY, 13, fadeIn(t, 1.8))
  tag(ctx, 'every split makes just ONE more', rx + pw / 2, y + h + 30, GREY, 13, fadeIn(t, 4.4))
  tag(ctx, 'not faster, not slower: steady', b.W / 2, y + h + 76, AMBER, 15, fadeIn(t, 6.8))
}

// ---------- beat 4: how splits make heat ----------

/** the uranium atoms in the rod (col, row of a 3 × 5 grid) that split */
const HEAT_SPLITS: Array<{ c: number; r: number; at: number }> = [
  { c: 1, r: 2, at: 5.3 },
  { c: 0, r: 1, at: 7.8 },
  { c: 2, r: 3, at: 8.5 },
  { c: 1, r: 4, at: 9.1 },
  { c: 2, r: 0, at: 9.7 },
]

/** when the heat reaches the water (the 4th piece's watch break) */
const WATER_AT = 10.1

/** cartoon "shaking marks": little arcs either side of something shaking */
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

function drawHeat(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b.W, b.H)
  // the scene: a tank of water, a fuel rod standing in the middle of it
  const surf = b.UH * 0.13
  const floor = b.UH * 0.93
  const tx0 = b.W * 0.03
  const tx1 = b.W * 0.97
  const rx0 = b.W * 0.31
  const rx1 = b.W * 0.69
  const ry0 = b.UH * 0.19
  const ry1 = b.UH * 0.88
  // water everywhere around the rod (its surface ripples on the idle clock)
  const boil = clamp01((t - (WATER_AT + 1.1)) / 1)
  const wg = ctx.createLinearGradient(0, surf, 0, floor)
  wg.addColorStop(0, 'rgba(56, 189, 248, 0.26)')
  wg.addColorStop(1, 'rgba(14, 116, 144, 0.45)')
  ctx.fillStyle = wg
  ctx.beginPath()
  ctx.moveTo(tx0, floor)
  for (let i = 0; i <= 40; i++) {
    const x = lerp(tx0, tx1, i / 40)
    ctx.lineTo(x, surf + Math.sin(idle * (2 + 4 * boil) + i * 0.8) * (2 + 5 * boil))
  }
  ctx.lineTo(tx1, floor)
  ctx.closePath()
  ctx.fill()
  // splits done → how hot the rod is (0…1)
  const splitsDone = HEAT_SPLITS.filter((s) => t >= s.at).length
  const heat = clamp01(splitsDone / HEAT_SPLITS.length + (t > WATER_AT ? (t - WATER_AT) * 0.05 : 0))
  // cartoon heat waves rolling out of the rod into the water
  const waves = clamp01((t - (WATER_AT - 0.3)) / 0.8)
  if (waves > 0) {
    ctx.save()
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    for (const side of [-1, 1]) {
      const edge = side < 0 ? rx0 : rx1
      const room = side < 0 ? rx0 - tx0 : tx1 - rx1
      for (let k = 0; k < 3; k++) {
        const d = frac(idle * 0.45 + k / 3)
        const x = edge + side * (10 + d * (room - 20))
        ctx.strokeStyle = `rgba(251, 146, 60, ${0.75 * waves * (1 - d)})`
        ctx.beginPath()
        for (let i = 0; i <= 24; i++) {
          const y = lerp(ry0 + 20, ry1 - 20, i / 24)
          const xx = x + Math.sin(i * 1.3 + idle * 6) * 5
          if (i) ctx.lineTo(xx, y)
          else ctx.moveTo(xx, y)
        }
        ctx.stroke()
      }
    }
    ctx.restore()
  }
  // the fuel rod: a metal tube, warming from dark to glowing as it heats
  const fg = ctx.createLinearGradient(rx0, 0, rx1, 0)
  fg.addColorStop(0, `rgb(${Math.round(46 + 160 * heat)}, ${Math.round(30 + 46 * heat)}, 20)`)
  fg.addColorStop(0.5, `rgb(${Math.round(60 + 190 * heat)}, ${Math.round(36 + 70 * heat)}, 24)`)
  fg.addColorStop(1, `rgb(${Math.round(46 + 160 * heat)}, ${Math.round(30 + 46 * heat)}, 20)`)
  ctx.fillStyle = fg
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(rx0, ry0, rx1 - rx0, ry1 - ry0, 22)
  ctx.fill()
  ctx.stroke()
  // the uranium atoms: whole atoms (every shell, every electron) at ONE
  // scale shared with the water, vibrating in place — harder when hotter
  const cols = 3
  const rows = 5
  const gx0 = rx0 + 12
  const gx1 = rx1 - 46 // room for the fire track
  const cw = (gx1 - gx0) / cols
  const rh = (ry1 - ry0 - 24) / rows
  const K = (Math.min(cw, rh) * 0.38) / shellAtomR(92, 1)
  const ar = shellAtomR(92, K)
  const home = (c: number, r: number) => ({ x: gx0 + (c + 0.5) * cw, y: ry0 + 12 + (r + 0.5) * rh })
  const kicks = new Map<string, number>()
  const frags: Array<{ x: number; y: number; protons: number; nucleons: number; ph: number }> = []
  for (const s of HEAT_SPLITS) {
    const q = t - s.at
    if (q < 0) continue
    for (const dir of [-1, 1]) {
      const nc = s.c + dir
      const from = home(s.c, s.r)
      const to = nc < 0 || nc >= cols ? { x: dir < 0 ? rx0 + 14 : gx1 - 4, y: from.y } : home(nc, s.r)
      const f = clamp01(q / 0.45)
      const piece = SPLIT_INTO[dir < 0 ? 0 : 1]
      // they fly toward the neighbours, bounce back a little, and stay
      const reach = lerp(from.x, to.x - dir * ar * 0.85, easeOut(f))
      const settle = lerp(from.x, to.x, 0.42)
      frags.push({
        x: q < 0.45 ? reach : lerp(reach, settle, easeOut(clamp01((q - 0.45) / 0.6))),
        y: from.y + dir * rh * 0.12,
        protons: piece.protons,
        nucleons: piece.nucleons,
        ph: s.c * 1.3 + s.r * 2.1 + dir,
      })
      if (q >= 0.45 && nc >= 0 && nc < cols) kicks.set(`${nc},${s.r}`, Math.max(kicks.get(`${nc},${s.r}`) ?? 0, Math.exp(-(q - 0.45) * 1.4)))
    }
  }
  const amp = 1.5 + 9 * heat
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = home(c, r)
      const sp = HEAT_SPLITS.find((s) => s.c === c && s.r === r)
      if (sp && t >= sp.at) {
        // it split: a big cartoon flash, then it is gone
        const q = t - sp.at
        if (q < 0.7) {
          const fr = 12 + ar * 3.2 * easeOut(q / 0.7)
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, fr)
          g.addColorStop(0, `rgba(255, 247, 214, ${0.95 * (1 - q / 0.7)})`)
          g.addColorStop(1, 'rgba(251, 146, 60, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, fr, 0, Math.PI * 2)
          ctx.fill()
        }
        tag(ctx, 'split!', p.x, p.y - ar - 16, '#fdba74', 13, q < 1.4 ? 1 - clamp01((q - 1) / 0.4) : 0)
        continue
      }
      const k = kicks.get(`${c},${r}`) ?? 0
      const a = amp + 12 * k
      const ph = c * 1.7 + r * 2.3
      const x = p.x + a * Math.sin(idle * (9 + heat * 9) + ph)
      const y = p.y + a * Math.cos(idle * (11 + heat * 9) + ph * 1.3)
      shellAtom(ctx, x, y, K, 92, 235, idle)
      shakeMarks(ctx, x, y, ar, Math.max(k * 1.2, (heat - 0.35) * 1.5))
      // the atom that will split: look here (amber ring) before it does
      if (c === HEAT_SPLITS[0].c && r === HEAT_SPLITS[0].r && t > 1.2) marker(ctx, x, y, ar + 8, idle)
    }
  }
  // the split's two new atoms (electrons and all), shaking with the heat
  for (const f of frags) {
    const a = amp
    const x = f.x + a * Math.sin(idle * (9 + heat * 9) + f.ph)
    const y = f.y + a * Math.cos(idle * (11 + heat * 9) + f.ph * 1.3)
    shellAtom(ctx, x, y, K, f.protons, f.nucleons, idle)
  }
  // the fire track: how hot the rod is (the 🧊 Crystal lab's, upright)
  const fx = rx1 - 24
  const fy0 = ry0 + 40
  const fy1 = ry1 - 40
  const track = ctx.createLinearGradient(0, fy1, 0, fy0)
  track.addColorStop(0, '#334155')
  track.addColorStop(0.5, '#f59e0b')
  track.addColorStop(1, '#dc2626')
  ctx.fillStyle = track
  ctx.beginPath()
  ctx.roundRect(fx - 5, fy0, 10, fy1 - fy0, 5)
  ctx.fill()
  text(ctx, 'hot', fx, fy0 - 14, 'rgba(226, 232, 240, 0.9)', 12)
  text(ctx, 'cold', fx, fy1 + 14, 'rgba(226, 232, 240, 0.9)', 12)
  ctx.font = `${26 + 12 * heat}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🔥', fx, fy1 - (fy1 - fy0) * (0.08 + 0.8 * heat) - 4)
  // the water: whole H₂O molecules at the SAME scale as the uranium. They
  // sit still-ish until the rod's heat reaches them: those touching the
  // rod first (they get bumped), then further out — then bubbles
  const rO = shellAtomR(8, K)
  const rH = shellAtomR(1, K)
  const bond = (rO + rH) * 0.78
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? tx0 + rO + 14 : rx1 + rO + 18
    const x1 = side < 0 ? rx0 - rO - 18 : tx1 - rO - 14
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 2; col++) {
        const i = row * 2 + col + (side > 0 ? 100 : 0)
        const hx = lerp(x0, x1, col === 0 ? 0.15 + 0.1 * rnd(i, 181) : 0.75 + 0.1 * rnd(i, 182))
        const hy = lerp(ry0 + 20, ry1 - 20, (row + 0.5 * rnd(i, 183)) / 5.6)
        // 0 = touching the rod, 1 = far side
        const dist = side < 0 ? (rx0 - hx) / (rx0 - tx0) : (hx - rx1) / (tx1 - rx1)
        const warm = clamp01((t - WATER_AT - dist * 1.6) / 0.9)
        const bump = t > WATER_AT && dist < 0.4 ? Math.exp(-(t - WATER_AT - dist * 1.6) * 2.5) * (t - WATER_AT - dist * 1.6 > 0 ? 1 : 0) : 0
        const a = 1 + 11 * warm + 10 * bump
        const x = hx + a * Math.sin(idle * (7 + 12 * warm) + i)
        const y = hy + a * Math.cos(idle * (8 + 12 * warm) + i * 1.7)
        const turn = rnd(i, 184) * Math.PI * 2 + Math.sin(idle * (1 + 4 * warm) + i) * 0.4 * (1 + warm)
        for (const s2 of [-1, 1]) {
          const ang = turn + s2 * ((104.5 / 2) * Math.PI) / 180
          shellAtom(ctx, x + Math.cos(ang) * bond, y + Math.sin(ang) * bond, K, 1, 1, idle)
        }
        shellAtom(ctx, x, y, K, 8, 16, idle)
        shakeMarks(ctx, x, y, rO + rH, Math.max(bump * 1.2, (warm - 0.3) * 1.4))
      }
    }
  }
  // boiling: bubbles of steam are born ON the hot rod, grow, let go and
  // rise; at the surface they puff off as steam
  if (boil > 0) {
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1
      const ph = frac(idle / 1.7 + rnd(i, 185))
      const y0 = lerp(ry0 + 40, ry1 - 30, rnd(i, 186))
      const edge = side < 0 ? rx0 - 8 : rx1 + 8
      const grow = clamp01(ph / 0.25)
      const rise = clamp01((ph - 0.25) / 0.75)
      const br = (4 + 7 * rnd(i, 187)) * (0.4 + 0.6 * grow)
      const x = edge + side * (br + rise * 40 * rnd(i, 188))
      const y = lerp(y0, surf + 6, easeIn(rise))
      ctx.strokeStyle = `rgba(240, 249, 255, ${0.9 * boil})`
      ctx.fillStyle = `rgba(240, 249, 255, ${0.18 * boil})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, br, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    // steam puffing off the surface
    for (let i = 0; i < 10; i++) {
      const ph = frac(idle / 2.2 + rnd(i, 189))
      const x = lerp(tx0 + 30, tx1 - 30, rnd(i, 190)) + Math.sin(ph * 6 + i) * 8
      const y = surf - 8 - ph * b.UH * 0.08
      ctx.fillStyle = `rgba(241, 245, 249, ${0.55 * boil * (1 - ph)})`
      ctx.beginPath()
      ctx.arc(x, y, 7 + ph * 14, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  // small names for grown-ups (the voice names everything for the kids)
  text(ctx, 'one fuel rod, seen very close', (rx0 + rx1) / 2, ry0 - 14, 'rgba(226, 232, 240, 0.85)', 12, '600')
  text(ctx, 'uranium atoms', (rx0 + rx1) / 2 - 18, ry1 - 12, 'rgba(254, 243, 199, 0.75)', 11)
  text(ctx, 'water', (tx0 + rx0) / 2, floor + 14, 'rgba(186, 230, 253, 0.85)', 12, '600')
  text(ctx, 'water', (rx1 + tx1) / 2, floor + 14, 'rgba(186, 230, 253, 0.85)', 12, '600')
  tag(ctx, 'steam!', b.W / 2, surf - 30, '#f1f5f9', 14, boil)
  youAreHere(ctx, b, 'one')
}

// ---------- the plant in cutaway (kettle, lights) ----------

interface PlantState {
  /** 0…1 how hot the core glows */
  heat: number
  /** 0…1 water bubbling */
  boil: number
  /** 0…1 steam in the pipe */
  steam: number
  /** the turbine's angle */
  spin: number
  /** 0…1 the generator working */
  gen: number
  /** 0…1 the electricity's front along the wire */
  wire: number
  /** 0…1 share of the town's windows lit */
  windows: number
  /** 0…1 how far the control rods are in */
  rods: number
}

function plantLayout(b: Box) {
  const ground = b.UH * 0.8
  return {
    ground,
    v: { x0: b.W * 0.05, x1: b.W * 0.28, y0: b.UH * 0.38, y1: b.UH * 0.78 },
    tb: { x: b.W * 0.47, y: b.UH * 0.5, r: Math.min(b.UH * 0.09, b.W * 0.08) },
    gen: { x: b.W * 0.63, y: b.UH * 0.5, w: b.W * 0.09, h: b.UH * 0.11 },
    pylon: b.W * 0.76,
    town: { x0: b.W * 0.8, x1: b.W * 0.97 },
  }
}

/** the reactor vessel: water, glowing fuel rods, the grey control rods */
function vessel(
  ctx: CanvasRenderingContext2D,
  v: { x0: number; y0: number; x1: number; y1: number },
  heat: number,
  boil: number,
  rods: number,
  idle: number,
) {
  const w = v.x1 - v.x0
  const h = v.y1 - v.y0
  ctx.save()
  // the steel shell
  ctx.fillStyle = '#1e293b'
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(v.x0, v.y0, w, h, 18)
  ctx.fill()
  ctx.stroke()
  // the water inside
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(v.x0 + 6, v.y0 + 6, w - 12, h - 12, 14)
  ctx.clip()
  const wg = ctx.createLinearGradient(0, v.y0, 0, v.y1)
  wg.addColorStop(0, 'rgba(56, 189, 248, 0.35)')
  wg.addColorStop(1, 'rgba(14, 116, 144, 0.55)')
  ctx.fillStyle = wg
  ctx.fillRect(v.x0, v.y0, w, h)
  // fuel rods, glowing with the heat of the splits
  const nFuel = 5
  for (let i = 0; i < nFuel; i++) {
    const x = v.x0 + ((i + 0.5) * w) / nFuel
    const g = ctx.createLinearGradient(x - 6, 0, x + 6, 0)
    const hot = 0.25 + 0.75 * heat * (0.92 + 0.08 * Math.sin(idle * 3 + i))
    g.addColorStop(0, `rgba(194, 65, 12, ${hot})`)
    g.addColorStop(0.5, `rgba(253, 186, 116, ${hot})`)
    g.addColorStop(1, `rgba(194, 65, 12, ${hot})`)
    ctx.fillStyle = g
    ctx.fillRect(x - 6, v.y0 + h * 0.22, 12, h * 0.68)
  }
  // bubbles rising when it boils
  if (boil > 0) {
    for (let i = 0; i < 26; i++) {
      const x = v.x0 + 10 + rnd(i, 151) * (w - 20)
      const y = v.y1 - 10 - frac(rnd(i, 152) + idle * (0.25 + rnd(i, 153) * 0.2)) * (h - 20)
      ctx.strokeStyle = `rgba(224, 242, 254, ${0.6 * boil})`
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(x, y, 2 + rnd(i, 154) * 3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.restore()
  // the control rods: ONE assembly — a bar with full-length rods hanging
  // from it. Pulling it up lifts the bar and every rod together (they
  // never get shorter); `rods` = how far the assembly is lowered in
  const rodLen = h * 0.7 + 42
  const barY = rodsBarY(v, rods)
  for (let i = 1; i < nFuel; i++) {
    const x = v.x0 + (i * w) / nFuel
    ctx.fillStyle = '#94a3b8'
    ctx.fillRect(x - 4, barY + 10, 8, rodLen)
  }
  ctx.fillStyle = '#334155'
  ctx.fillRect(v.x0 + w * 0.12, barY, w * 0.76, 14)
  ctx.restore()
}

/** where the control rods' bar is when the assembly is `rods` (0…1) in */
function rodsBarY(v: { y0: number; y1: number }, rods: number) {
  return v.y0 - 44 - (1 - rods) * (v.y1 - v.y0) * 0.7
}

/** the turbine: a casing and a fan of blades */
function turbine(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, steam: number) {
  ctx.save()
  ctx.fillStyle = '#0f172a'
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.translate(x, y)
  ctx.rotate(angle)
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = '#cbd5e1'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(r * 0.5, -r * 0.18, r * 0.86, -r * 0.08)
    ctx.lineTo(r * 0.86, r * 0.1)
    ctx.quadraticCurveTo(r * 0.45, r * 0.08, 0, 0)
    ctx.fill()
  }
  ctx.fillStyle = '#475569'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  if (steam > 0) {
    ctx.fillStyle = `rgba(241, 245, 249, ${0.12 * steam})`
    ctx.beginPath()
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** a little town; its windows light up from the left */
function town(ctx: CanvasRenderingContext2D, x0: number, x1: number, ground: number, lit: number) {
  const n = 5
  const w = (x1 - x0) / n
  let k = 0
  for (let i = 0; i < n; i++) {
    const hx = x0 + i * w + 3
    const hw = w - 6
    const hh = 34 + (i % 2) * 14
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(hx, ground - hh, hw, hh)
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.moveTo(hx - 3, ground - hh)
    ctx.lineTo(hx + hw / 2, ground - hh - 14)
    ctx.lineTo(hx + hw + 3, ground - hh)
    ctx.closePath()
    ctx.fill()
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        // power reaches every house at the same moment; most rooms then
        // have a light on (a few stay dark: nobody is in there)
        const on = lit > 0 && rnd(k, 191) < 0.82
        k++
        ctx.fillStyle = on ? `rgba(253, 224, 71, ${lit})` : '#0f172a'
        ctx.fillRect(hx + 4 + c * (hw / 2), ground - hh + 8 + r * 14, hw / 2 - 8, 8)
      }
    }
  }
}

function drawPlant(ctx: CanvasRenderingContext2D, b: Box, s: PlantState, idle: number) {
  backdrop(ctx, b.W, b.H)
  const L = plantLayout(b)
  // the ground
  ctx.fillStyle = '#0b1324'
  ctx.fillRect(0, L.ground, b.W, b.H - L.ground)
  // the pipes: steam up and over to the turbine, water back down
  // out through the vessel's side, near the top (the rods' drive sits on
  // the lid), over, and down into the turbine
  const steamPath = [
    { x: L.v.x1, y: L.v.y0 + 24 },
    { x: L.tb.x, y: L.v.y0 + 24 },
    { x: L.tb.x, y: L.tb.y - L.tb.r },
  ]
  const back = [
    { x: L.tb.x, y: L.tb.y + L.tb.r },
    { x: L.tb.x, y: b.UH * 0.72 },
    { x: L.v.x1, y: b.UH * 0.72 },
  ]
  for (const [path, col] of [
    [steamPath, '#475569'],
    [back, '#1d4ed8'],
  ] as const) {
    ctx.strokeStyle = col
    ctx.lineWidth = 12
    ctx.lineJoin = 'round'
    ctx.beginPath()
    path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
  }
  // steam puffs riding the pipe
  if (s.steam > 0) {
    const segs = steamPath.slice(1).map((p, i) => ({ a: steamPath[i], b: p, len: Math.hypot(p.x - steamPath[i].x, p.y - steamPath[i].y) }))
    const total = segs.reduce((n, g) => n + g.len, 0)
    for (let k = 0; k < 9; k++) {
      let d = frac(k / 9 + idle * 0.35) * total * s.steam
      for (const g of segs) {
        if (d > g.len) {
          d -= g.len
          continue
        }
        const q = d / g.len
        ctx.fillStyle = `rgba(241, 245, 249, ${0.85 * s.steam})`
        ctx.beginPath()
        ctx.arc(lerp(g.a.x, g.b.x, q), lerp(g.a.y, g.b.y, q), 5, 0, Math.PI * 2)
        ctx.fill()
        break
      }
    }
  }
  vessel(ctx, L.v, s.heat, s.boil, s.rods, idle)
  // the shaft, turbine → generator
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(L.tb.x, L.tb.y)
  ctx.lineTo(L.gen.x - L.gen.w / 2, L.gen.y)
  ctx.stroke()
  turbine(ctx, L.tb.x, L.tb.y, L.tb.r, s.spin, s.steam)
  // the generator: a box with a spinning magnet coil inside
  const G = L.gen
  ctx.fillStyle = '#1e293b'
  ctx.strokeStyle = s.gen > 0 ? `rgba(251, 191, 36, ${0.4 + 0.5 * s.gen})` : '#64748b'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(G.x - G.w / 2, G.y - G.h / 2, G.w, G.h, 10)
  ctx.fill()
  ctx.stroke()
  ctx.save()
  ctx.translate(G.x, G.y)
  ctx.rotate(s.spin * 1.3)
  ctx.fillStyle = '#ef4444'
  ctx.fillRect(-G.w * 0.28, -6, G.w * 0.28, 12)
  ctx.fillStyle = '#3b82f6'
  ctx.fillRect(0, -6, G.w * 0.28, 12)
  ctx.restore()
  if (s.gen > 0) {
    ctx.fillStyle = `rgba(251, 191, 36, ${0.15 * s.gen * (0.7 + 0.3 * Math.sin(idle * 8))})`
    ctx.beginPath()
    ctx.roundRect(G.x - G.w / 2, G.y - G.h / 2, G.w, G.h, 10)
    ctx.fill()
  }
  // the power line: generator → pylon → town
  const wireA = { x: G.x + G.w / 2, y: G.y - G.h * 0.3 }
  const top = { x: L.pylon, y: L.ground - b.UH * 0.24 }
  const end = { x: (L.town.x0 + L.town.x1) / 2, y: L.ground - 60 }
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(top.x - 16, L.ground)
  ctx.lineTo(top.x, top.y)
  ctx.lineTo(top.x + 16, L.ground)
  ctx.moveTo(top.x - 20, top.y + 10)
  ctx.lineTo(top.x + 20, top.y + 10)
  ctx.stroke()
  const wirePts = (q: number) =>
    q < 0.5
      ? { x: lerp(wireA.x, top.x, q * 2), y: lerp(wireA.y, top.y + 10, q * 2) + Math.sin(q * 2 * Math.PI) * 14 }
      : { x: lerp(top.x, end.x, (q - 0.5) * 2), y: lerp(top.y + 10, end.y, (q - 0.5) * 2) + Math.sin((q - 0.5) * 2 * Math.PI) * 14 }
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i <= 40; i++) {
    const p = wirePts(i / 40)
    if (i) ctx.lineTo(p.x, p.y)
    else ctx.moveTo(p.x, p.y)
  }
  ctx.stroke()
  if (s.wire > 0) {
    for (let k = 0; k < 10; k++) {
      const q = frac(k / 10 + idle * 0.5)
      if (q > s.wire) continue
      const p = wirePts(q)
      ctx.fillStyle = AMBER
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  town(ctx, L.town.x0, L.town.x1, L.ground, s.windows)
  return L
}

const KETTLE_SPIN_AT = 6
const SPIN_MAX = 5

function kettleSpin(t: number) {
  if (t < KETTLE_SPIN_AT) return 0
  const u = t - KETTLE_SPIN_AT
  return u < 2 ? (SPIN_MAX * u * u) / 4 : SPIN_MAX * (1 + (u - 2))
}

function drawKettle(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const L = drawPlant(
    ctx,
    b,
    {
      heat: easeInOut(clamp01(t / 3)),
      boil: clamp01((t - 1.5) / 2),
      steam: clamp01((t - 3) / 1.5),
      spin: kettleSpin(t),
      gen: 0,
      wire: 0,
      windows: 0,
      rods: 0.55,
    },
    idle,
  )
  tag(ctx, 'reactor: the steady splits make heat', (L.v.x0 + L.v.x1) / 2, L.v.y1 + 34, AMBER_SOFT, 13, fadeIn(t, 0.4))
  tag(ctx, 'the water boils into steam', (L.v.x0 + L.tb.x) / 2, b.UH * 0.2, GREY, 13, fadeIn(t, 3.2))
  tag(ctx, 'turbine', L.tb.x, L.tb.y + L.tb.r + 26, AMBER, 14, fadeIn(t, 6.2))
  tag(ctx, 'a very big kettle', b.W / 2, b.UH * 0.08, '#fef3c7', 16, fadeIn(t, 11))
}

function drawLights(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  const L = drawPlant(
    ctx,
    b,
    {
      heat: 1,
      boil: 1,
      steam: 1,
      spin: idle * SPIN_MAX,
      gen: clamp01(t / 0.6),
      wire: clamp01((t - 2.5) / 2),
      windows: clamp01((t - 4.6) / 0.5),
      rods: 0.55,
    },
    idle,
  )
  tag(ctx, 'turbine', L.tb.x, L.tb.y + L.tb.r + 26, GREY, 13)
  tag(ctx, 'generator', L.gen.x, L.gen.y + L.gen.h / 2 + 26, AMBER, 14)
  tag(ctx, 'electricity', L.pylon, L.ground - b.UH * 0.24 - 24, AMBER_SOFT, 13, fadeIn(t, 2.7))
  tag(ctx, 'the town', (L.town.x0 + L.town.x1) / 2, L.ground + 24, GREY, 13, fadeIn(t, 4.5))
}

// ---------- beat 6: safe by itself ----------

/** a hand reaching down from above, its fingers curled over the rods'
 *  drive bar at y */
function hand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.fillStyle = '#f1c9a5'
  ctx.strokeStyle = '#d9a882'
  ctx.lineWidth = 2
  // the arm, from above
  ctx.beginPath()
  ctx.roundRect(x - 9, y - 90, 18, 70, 8)
  ctx.fill()
  // the back of the hand
  ctx.beginPath()
  ctx.roundRect(x - 22, y - 30, 44, 26, 10)
  ctx.fill()
  ctx.stroke()
  // four fingers wrapped over the bar
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.roundRect(x - 20 + i * 10.5, y - 10, 9, 20, 4)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

/** 100 atoms of uranium, the splitting kind lit */
function jar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, lit: number, title: string, note: string, alpha: number) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = 'rgba(30, 41, 59, 0.55)'
  ctx.beginPath()
  ctx.roundRect(x, y, size, size + 44, 12)
  ctx.fill()
  const d = (size - 20) / 10
  // 100 uranium atoms: the kind that can split in full, the rest faded
  for (let i = 0; i < 100; i++) {
    const on = i < lit
    miniAtom(ctx, x + 10 + (i % 10) * d + d / 2, y + 30 + Math.floor(i / 10) * d + d / 2, d * 0.44, on ? 1 : 0.28)
  }
  text(ctx, title, x + size / 2, y + 15, GREY, 12, '600')
  text(ctx, note, x + size / 2, y + size + 30, '#fdba74', 12, '600')
  ctx.restore()
}

const DROP_AT = 5.2

function drawSafe(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b.W, b.H)
  const v = { x0: b.W * 0.06, x1: b.W * 0.36, y0: b.UH * 0.44, y1: b.UH * 0.8 }
  // the rods: pulled up by a hand (0.3–2.2), dropped back by themselves
  const pulled = easeInOut(clamp01((t - 0.3) / 1.9))
  const dropped = easeIn(clamp01((t - DROP_AT) / 0.4))
  const rods = t < DROP_AT ? 0.55 - 0.5 * pulled : lerp(0.05, 1, dropped)
  const runaway = t >= 2.5 && t < DROP_AT
  vessel(ctx, v, t < DROP_AT ? 1 : 1 - 0.6 * clamp01((t - DROP_AT) / 2), 1, rods, idle)
  // the hand grips the rods' bar and lifts the whole assembly
  if (t > 0.2 && t < DROP_AT) hand(ctx, (v.x0 + v.x1) / 2, rodsBarY(v, rods) + 4)
  tag(ctx, 'rods pulled too far out', (v.x0 + v.x1) / 2, v.y1 + 30, '#fdba74', 13, t > 1 && t < DROP_AT ? 1 : 0)
  tag(ctx, 'the rods drop back in by themselves', (v.x0 + v.x1) / 2, v.y1 + 30, AMBER, 13, t >= DROP_AT ? fadeIn(t, DROP_AT, 0.3) : 0)
  // the chain, on the right: steady, then branching, then dying down
  const px = b.W * 0.44
  const py = b.UH * 0.16
  const pw = b.W * 0.51
  const ph = b.UH * 0.38
  panel(ctx, px, py, pw, ph, 'the splits')
  chartLegend(ctx, px + pw / 2, py - 26)
  const ly = py + ph / 2 + 8
  const count = Math.min(9, Math.floor(t / 0.28) + 1)
  const fadeDown = t < DROP_AT + 0.4 ? 1 : 1 - 0.75 * clamp01((t - DROP_AT - 0.4) / 1.6)
  const tipX = chainLine(ctx, px + 24, ly, pw * 0.42, count, 1, fadeDown) ?? px + 24
  if (t >= 2.5) {
    const grow = Math.min(4, (Math.min(t, DROP_AT) - 2.5) / 0.65)
    chainTree(ctx, tipX, ly - ph * 0.32, pw - (tipX - px) - 24, ph * 0.64, 5, grow + 1, fadeDown)
  }
  if (runaway) {
    const blink = 0.6 + 0.4 * Math.sin(idle * 10)
    tag(ctx, 'too many splits!', px + pw / 2, py + ph + 24, `rgba(248, 113, 113, ${blink})`, 14)
  }
  tag(ctx, 'the splits die down: safe', px + pw / 2, py + ph + 24, AMBER_SOFT, 14, t >= DROP_AT + 0.6 ? fadeIn(t, DROP_AT + 0.6) : 0)
  // the fuel itself: far too little of the uranium that splits
  const jy = b.UH * 0.62
  const js = Math.min(b.UH * 0.2, b.W * 0.2)
  const ja = fadeIn(t, 6.8, 0.7)
  jar(ctx, px + pw * 0.08, jy, js, BOMB_SPLITTABLE_PER_100, 'bomb fuel', `${BOMB_SPLITTABLE_PER_100} in 100 can split`, ja)
  jar(ctx, px + pw * 0.92 - js, jy, js, FUEL_SPLITTABLE_PER_100, 'power-plant fuel', `about ${FUEL_SPLITTABLE_PER_100} in 100`, ja)
}

// ---------- beat 7: the used fuel ----------

/** invisible rays, made visible: the app's γ-ray look (violet wavy lines,
 *  as in the Sun story), streaming out of the used fuel in every direction.
 *  `reach` = how far they get: far in air, a few cm in water, nothing out
 *  of a thick cask */
function rays(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, reach: number, idle: number, alpha = 1) {
  if (reach <= 0 || alpha <= 0) return
  ctx.save()
  ctx.lineWidth = 2.2
  ctx.lineCap = 'round'
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? 1 : -1
    const y = lerp(y0, y1, (Math.floor(i / 2) + 0.5) / 6)
    const ang = (side > 0 ? 0 : Math.PI) + (rnd(i, 201) - 0.5) * 1.1
    const run = frac(idle * 0.9 + rnd(i, 202)) // each ray streams outward
    const len = reach * (0.55 + 0.45 * rnd(i, 203))
    const head = run * len
    const c = Math.cos(ang)
    const s = Math.sin(ang)
    ctx.strokeStyle = `rgba(196, 181, 253, ${alpha * (1 - run * 0.6)})`
    ctx.beginPath()
    for (let k = 0; k <= 12; k++) {
      const along = Math.max(0, head - 34 + k * 3)
      if (along > len) break
      const wave = 5 * Math.sin(k * 1.2 + idle * 20)
      const px = x + side * 8 + along * c - wave * s
      const py = y + along * s + wave * c
      if (k) ctx.lineTo(px, py)
      else ctx.moveTo(px, py)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/** the radiation sign, in the yellow everyone knows */
function radSign(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = '#facc15'
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111827'
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, r * 0.86, a - 0.5, a + 0.5)
    ctx.closePath()
    ctx.fill()
  }
  ctx.fillStyle = '#facc15'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111827'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** an hourglass that keeps turning over: a very, very long time */
function hourglass(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, idle: number, alpha = 1) {
  if (alpha <= 0) return
  const period = 2.2
  const ph = frac(idle / period)
  const flip = ph > 0.85 ? easeInOut((ph - 0.85) / 0.15) * Math.PI : 0
  const sand = clamp01(ph / 0.85)
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(x, y)
  ctx.rotate(flip)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.fillStyle = 'rgba(226, 232, 240, 0.08)'
  ctx.beginPath()
  ctx.moveTo(-s, -s * 1.4)
  ctx.lineTo(s, -s * 1.4)
  ctx.lineTo(s * 0.12, 0)
  ctx.lineTo(s, s * 1.4)
  ctx.lineTo(-s, s * 1.4)
  ctx.lineTo(-s * 0.12, 0)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#fbbf24'
  // the top empties, the bottom fills
  const top = 1 - sand
  ctx.beginPath()
  ctx.moveTo(-s * top, -s * 1.4 * top)
  ctx.lineTo(s * top, -s * 1.4 * top)
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-s, s * 1.4)
  ctx.lineTo(s, s * 1.4)
  ctx.lineTo(s * (1 - sand * 0.7), s * 1.4 * (1 - sand))
  ctx.lineTo(-s * (1 - sand * 0.7), s * 1.4 * (1 - sand))
  ctx.closePath()
  ctx.fill()
  if (sand < 1) ctx.fillRect(-1, 0, 2, s * 1.4 * (1 - sand * 0.9))
  ctx.restore()
}

/** piece starts of the waste line (story s): lift · radioactive · pool ·
 *  cask · a very long time · closing */
const W_RAYS = 2.5
const W_POOL = 5
const W_CASK = 7.5
const W_LONG = 10

function drawWaste(ctx: CanvasRenderingContext2D, b: Box, t: number, idle: number) {
  backdrop(ctx, b.W, b.H)
  const ground = b.UH * 0.8
  ctx.fillStyle = '#0b1324'
  ctx.fillRect(0, ground, b.W, b.H - ground)
  const v = { x0: b.W * 0.04, x1: b.W * 0.24, y0: b.UH * 0.44, y1: b.UH * 0.78 }
  vessel(ctx, v, 0.3, 0, 0.9, idle)
  text(ctx, 'reactor', (v.x0 + v.x1) / 2, ground + 18, 'rgba(148, 163, 184, 0.9)', 12)
  const rodH = b.UH * 0.18
  // the cooling pool, sunk into the ground, deep enough for a whole rod
  const pool = { x0: b.W * 0.34, x1: b.W * 0.56, y: ground, depth: rodH + 34 }
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(pool.x0, pool.y, pool.x1 - pool.x0, pool.depth)
  // the crane beam over reactor and pool
  const beamY = b.UH * 0.15
  ctx.fillStyle = '#475569'
  ctx.fillRect(b.W * 0.03, beamY - 6, b.W * 0.6, 12)
  // the rod's journey: lifted out of the reactor (0.2–2.2), carried over
  // the pool and lowered in (5–6.4), lifted out years later and set into
  // the cask (7.6–9.2)
  const vx = (v.x0 + v.x1) / 2
  const px = (pool.x0 + pool.x1) / 2
  const cx = b.W * 0.8
  const lift = easeInOut(clamp01((t - 0.2) / 2))
  const carry = easeInOut(clamp01((t - W_POOL) / 0.7))
  const lower = easeInOut(clamp01((t - W_POOL - 0.6) / 0.8))
  const toCask = clamp01((t - W_CASK - 0.1) / 1.6)
  const inPool = t >= W_POOL + 1.4 && toCask <= 0
  const inCask = toCask >= 1
  let rx = lerp(vx, px, carry)
  let topY = lerp(v.y0 - 10, beamY + 30, lift) + lower * (pool.y + 16 - (beamY + 30))
  if (toCask > 0) {
    // up out of the pool, over, and down into the cask
    const up = easeInOut(clamp01(toCask / 0.35))
    const over = easeInOut(clamp01((toCask - 0.3) / 0.4))
    const down = easeInOut(clamp01((toCask - 0.65) / 0.35))
    rx = lerp(px, cx, over)
    topY = lerp(pool.y + 16, beamY + 30, up) + down * (ground - rodH - 18 - (beamY + 30))
  }
  // the cask: thick steel and concrete (its back first, the rod goes in)
  const cw = b.W * 0.14
  const ch = rodH + 46
  const caskIn = fadeIn(t, W_CASK, 0.5)
  if (caskIn > 0) {
    ctx.save()
    ctx.globalAlpha = caskIn
    ctx.fillStyle = '#4b5563'
    ctx.beginPath()
    ctx.roundRect(cx - cw / 2, ground - ch, cw, ch, 12)
    ctx.fill()
    ctx.restore()
  }
  // the rope and the used fuel rod, glowing and sending out rays
  if (!inCask) {
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(rx, beamY + 6)
    ctx.lineTo(rx, topY)
    ctx.stroke()
  }
  const pulse = 0.65 + 0.35 * Math.sin(idle * 4)
  if (!inCask) {
    ctx.fillStyle = `rgba(253, 186, 116, ${0.75 + 0.25 * pulse})`
    ctx.fillRect(rx - 8, topY, 16, rodH)
  }
  // its rays: far through the air, only a little way in water, none out of
  // the closed cask
  const rodInWater = topY + rodH > pool.y && rx > pool.x0 && rx < pool.x1
  const reach = inCask ? 0 : rodInWater ? 22 : 150
  rays(ctx, rx, topY + 8, topY + rodH - 8, reach, idle, fadeIn(t, 1.2, 0.8))
  // the pool's water over everything in it
  ctx.fillStyle = 'rgba(56, 189, 248, 0.42)'
  ctx.fillRect(pool.x0, pool.y, pool.x1 - pool.x0, pool.depth)
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 3
  ctx.strokeRect(pool.x0, pool.y, pool.x1 - pool.x0, pool.depth)
  if (inPool) tag(ctx, 'the water stops the rays', px + 70, pool.y - 22, '#c4b5fd', 12)
  text(ctx, 'cooling pool', pool.x1 + 10, pool.y + pool.depth / 2, 'rgba(148, 163, 184, 0.9)', 12, '', 'left')
  // the radiation sign on the rod, once it is named
  if (!inCask) radSign(ctx, rx, topY + rodH / 2, 11, fadeIn(t, W_RAYS + 0.2, 0.5))
  // the cask's front wall closes over the rod; the sign on the outside
  if (caskIn > 0) {
    const shut = clamp01((t - W_CASK - 1.7) / 0.4)
    ctx.save()
    ctx.globalAlpha = inCask ? shut : 0
    ctx.fillStyle = '#6b7280'
    ctx.beginPath()
    ctx.roundRect(cx - cw / 2, ground - ch, cw, ch, 12)
    ctx.fill()
    ctx.fillStyle = '#9ca3af'
    ctx.fillRect(cx - cw / 2, ground - ch + 14, cw, 8)
    ctx.fillRect(cx - cw / 2, ground - 22, cw, 8)
    ctx.restore()
    radSign(ctx, cx, ground - ch / 2, 16, inCask ? shut : 0)
    text(ctx, 'steel + concrete', cx, ground + 18, 'rgba(148, 163, 184, 0.9)', 12)
    // the fence around it: kept under guard
    const fence = fadeIn(t, W_CASK + 2, 0.6)
    if (fence > 0) {
      ctx.save()
      ctx.globalAlpha = fence
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 1.5
      for (let i = 0; i <= 10; i++) {
        const x = cx - cw - 16 + i * ((cw * 2 + 32) / 10)
        ctx.beginPath()
        ctx.moveTo(x, ground)
        ctx.lineTo(x, ground - 34)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.moveTo(cx - cw - 16, ground - 26)
      ctx.lineTo(cx + cw + 16, ground - 26)
      ctx.stroke()
      // a guard's lamp, blinking
      const blink = Math.sin(idle * 3) > 0 ? 1 : 0.3
      ctx.fillStyle = `rgba(250, 204, 21, ${blink})`
      ctx.beginPath()
      ctx.arc(cx + cw + 16, ground - 40, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
  // a very, very long time: the hourglass keeps turning, the years add up
  const long = fadeIn(t, W_LONG - 0.4, 0.6)
  if (long > 0) {
    hourglass(ctx, cx, ground - ch - 64, 16, idle, long)
    const years = [100, 1000, 10000, 100000]
    const k = Math.min(years.length - 1, Math.floor(Math.max(0, t - W_LONG) / 0.6))
    tag(ctx, `${years[k].toLocaleString('en-US')} years…`, cx, ground - ch - 20, '#e2e8f0', 14, long)
  }
  tag(ctx, 'that problem is not solved yet', b.W / 2, b.UH * 0.06, AMBER_SOFT, 14, fadeIn(t, W_LONG + 1.4))
}

// ---------- the beats ----------

export function drawPlantBeat(ctx: CanvasRenderingContext2D, beat: string, t: number, W: number, UH: number, H: number, idle: number) {
  const b: Box = { W, UH, H }
  if (beat === 'remember') drawRemember(ctx, b, t)
  else if (beat === 'rods') drawRods(ctx, b, t, idle)
  else if (beat === 'steady') drawSteady(ctx, b, t)
  else if (beat === 'heat') drawHeat(ctx, b, t, idle)
  else if (beat === 'kettle') drawKettle(ctx, b, t, idle)
  else if (beat === 'lights') drawLights(ctx, b, t, idle)
  else if (beat === 'safe') drawSafe(ctx, b, t, idle)
  else drawWaste(ctx, b, t, idle)
}
