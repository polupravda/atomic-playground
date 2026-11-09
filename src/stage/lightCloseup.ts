import { drawGlossyParticle } from './particleStyle'
import type { ParticleKind } from '../state/atomStore'
import { shellConfiguration } from '../core/atom'
import { SPECTRA, dropHeight, wavelengthToCss, type SpectrumElementId } from '../core/spectra'
import { blit, clamp01, easeIn, easeInOut, makeCanvasSprite, type Sprite } from './canvasUtil'

// R02 close-up: the camera zooms into one glowing firework spark and the
// canvas cross-fades into a close view drawn in the app's shell-view atom
// language (bonding lab: nucleus + rings + spinning glossy electrons, REAL
// shell configurations from core/atom). The scripted "textbook" sequence —
// the heart of the demo — plays twice:
//   atom 1, lithium:  heat arrives → the outer electron jumps to a dashed
//                     higher-energy seat → it can't stay → it falls home and
//                     a DEEP RED photon (670.8 nm) flies out
//   atom 2, sodium:   same dance, different ladder → a YELLOW photon (589 nm)
// Beside each atom stands an energy staircase (ladder): the dot mirrors the
// watched electron, and the rung gap is proportional to the photon's energy —
// "the color IS the size of the drop", drawn, not told.
// Honest simplifications (also in the info panel): slowed ~a billion times,
// the dashed ring is a helper picture (real seats are subshells), the wavy
// line is our symbol for a photon (same symbol as the bomb's γ rays).

// Timeline (s), R01 pacing: hold on the spark with an amber marker → zoom in
// → a short break → the two-atom story.
const HOLD_IN = 0.6
const ZOOM_T = 1.2
export const LIGHT_SCENE_START = HOLD_IN + ZOOM_T + 0.6
export const LIGHT_CLOSEUP_MAX_ZOOM = 9

// one atom's schedule, relative to its start (s); atom 2 runs it slightly
// faster (the kid has seen the dance once)
const FLASH_END = 2.3
const RING_IN0 = 2.0
const RING_IN1 = 2.5
const LIFT0 = 2.5
const LIFT1 = 4.3
const HOLD_END = 6.4
const FALL0 = 6.4
const FALL1 = 7.5
const PHOTON_LIFE = 2.1
const ATOM_LEN = FALL1 + PHOTON_LIFE // 9.6

const ATOM2_START = ATOM_LEN // pan starts as atom 1's photon fades
const PAN_LEN = 1.4
const ATOM2_RATE = 0.78 // atom 2 dances a bit faster
const ATOM2_PLAY = ATOM2_START + PAN_LEN // its own clock starts after the pan
export const LIGHT_SCENE_LEN = ATOM2_PLAY + ATOM_LEN * ATOM2_RATE + 0.4 // ≈ 18.9
export const LIGHT_CLOSEUP_TOTAL = LIGHT_SCENE_START + LIGHT_SCENE_LEN

/** Camera for the spark view while zooming in (no zoom out: the story moves
 *  on to the barcode free-run at atom scale). */
export function lightCloseupCamera(t: number): { zoom: number; sceneAlpha: number; marker: number } {
  const zIn = clamp01((t - HOLD_IN) / ZOOM_T)
  const zoom = 1 + (LIGHT_CLOSEUP_MAX_ZOOM - 1) * easeInOut(zIn)
  const sceneAlpha = clamp01((t - (HOLD_IN + ZOOM_T - 0.35)) / 0.35)
  const pulse = 0.8 + 0.2 * Math.sin(t * 6)
  const marker = t < HOLD_IN + 0.3 ? pulse * (1 - clamp01((t - HOLD_IN) / 0.3)) : 0
  return { zoom, sceneAlpha, marker }
}

// ---------- the story steps (ONE source for canvas, timeline + panel) ----------

const STEP_ENDS = [FLASH_END, LIFT1 + 0.3, HOLD_END, ATOM2_START, Infinity]
export const LIGHT_CLOSEUP_STEP_COUNT = STEP_ENDS.length

/** Which story step is showing (0 … LIGHT_CLOSEUP_STEP_COUNT−1) for a
 *  close-up clock `t` (step 0 also covers the zoom-in). */
export function lightCloseupStep(t: number): number {
  const s = t - LIGHT_SCENE_START
  return Math.max(
    0,
    STEP_ENDS.findIndex((end) => s < end),
  )
}

export interface LightStepText {
  icon: string
  title: string
  /** short caption (story timeline) */
  caption: string
  /** longer explanation (left info panel) */
  panel: Array<{ icon: string; text: string }>
}

/** All close-up story steps of the firework story (LIGHT_CLOSEUP_STEP_COUNT long). */
export function lightCloseupStory(): LightStepText[] {
  return [
    {
      icon: '⚡',
      title: 'Energy arrives',
      caption: 'Inside the spark: heat from the burning powder washes over a lithium atom.',
      panel: [
        {
          icon: '🔍',
          text: 'We are inside one glowing spark, looking at a single lithium atom — 3 protons, drawn in the same shell picture as the bonding lab. The burning powder is HOT, and that heat is energy crashing into the atom.',
        },
      ],
    },
    {
      icon: '⬆️',
      title: 'The electron jumps up',
      caption: 'The outer electron jumps to a higher-energy seat (the dashed ring) — not its home.',
      panel: [
        {
          icon: '⬆️',
          text: 'The energy kicks the outer electron UP, onto a higher-energy seat — drawn as a dashed ring, because it is a visitor seat, not the electron\'s home.',
        },
        {
          icon: '🪜',
          text: 'Watch the ladder beside the atom: the dot climbs exactly one step. Every atom has its own fixed steps — no seats in between.',
        },
      ],
    },
    {
      icon: '⏳',
      title: "It can't stay",
      caption: 'The electron wobbles on the high seat. It cannot stay up there.',
      panel: [
        {
          icon: '⏳',
          text: 'An electron on a high seat is like a ball on a shelf edge — it cannot stay. Any moment now it will fall back home. (In a real atom this takes about a billionth of a second; we are in super slow motion.)',
        },
      ],
    },
    {
      icon: '💡',
      title: 'The fall makes light',
      caption: 'It falls home — and a DEEP RED photon flies out. The color IS the size of the drop.',
      panel: [
        {
          icon: '💡',
          text: 'The electron falls back home, and the energy it gives up flies away as a PHOTON — a little piece of light. Lithium\'s drop is small, so the photon is deep red (670.8 nanometers): small drop → red light, big drop → blue light.',
        },
        {
          icon: '🌊',
          text: 'The wavy line is our symbol for a photon — the same symbol as the bomb\'s violet γ rays. γ rays are photons too, just from a MUCH bigger drop.',
        },
      ],
    },
    {
      icon: '🔁',
      title: 'Atom 2: sodium',
      caption: 'A sodium atom does the same dance — but ITS step is taller: a YELLOW photon.',
      panel: [
        {
          icon: '🔁',
          text: 'Next door sits a sodium atom (11 protons). Same dance: energy in, electron up, electron falls. But sodium\'s step is a different height, so its photon is a different color — the famous sodium YELLOW (589 nanometers).',
        },
        {
          icon: '🎨',
          text: 'Different atom → different steps → different colors. That is the whole secret of the firework. And it means each element signs its light with its own colors…',
        },
      ],
    },
  ]
}

// ---------- the atoms ----------

interface JumpAtomSpec {
  el: SpectrumElementId
  x: number // world coordinates (units of k)
  y: number
  /** direction the photon flies */
  photonAngle: number
  /** ladder side: +1 right of the atom, −1 left */
  ladderSide: 1 | -1
}

const ATOMS: JumpAtomSpec[] = [
  { el: 'li', x: 0, y: 10, photonAngle: -0.9, ladderSide: -1 },
  { el: 'na', x: 560, y: 10, photonAngle: -2.2, ladderSide: 1 },
]
// atoms that just sit there — the rest of the glowing spark
const BYSTANDERS: Array<{ el: SpectrumElementId; x: number; y: number }> = [
  { el: 'li', x: -330, y: -260 },
  { el: 'na', x: 260, y: -290 },
  { el: 'li', x: -300, y: 290 },
  { el: 'na', x: 880, y: 300 },
  { el: 'li', x: 900, y: -250 },
]

const PAN_START = ATOM2_START
const PAN_END = ATOM2_START + PAN_LEN
const CAM_END_X = ATOMS[1].x

// nucleon counts: honest where drawable (Li-7 = 3 p + 4 n), symbolic share
// for sodium (Na-23 = 11 p + 12 n — all 23 drawn)
const NUCLEONS: Record<'li' | 'na', { n: number; protons: number }> = {
  li: { n: 7, protons: 3 },
  na: { n: 23, protons: 11 },
}

function cluster(n: number, protons: number, pr: number): Sprite {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const pts: Array<[ParticleKind, number, number]> = []
  let placed = 0
  for (let j = 0; j < n; j++) {
    const r = pr * 1.08 * Math.sqrt(j)
    const a = j * golden
    const isP = Math.floor(((j + 1) * protons) / n) > placed
    if (isP) placed++
    pts.push([isP ? 'protons' : 'neutrons', r * Math.cos(a), r * Math.sin(a)])
  }
  const ext = pr * 1.08 * Math.sqrt(Math.max(1, n - 1)) + pr * 1.6
  const size = Math.ceil(2 * ext + 2)
  return makeCanvasSprite(size, (ctx) => {
    for (let j = pts.length - 1; j >= 0; j--) {
      const [kind, x, y] = pts[j]
      drawGlossyParticle(ctx, kind, size / 2 + x, size / 2 + y, pr)
    }
  })
}

let cache: { k: number; li: Sprite; na: Sprite } | null = null
function sprites(k: number) {
  if (!cache || cache.k !== k) {
    const pr = 4.6 * k
    cache = {
      k,
      li: cluster(NUCLEONS.li.n, NUCLEONS.li.protons, pr),
      na: cluster(NUCLEONS.na.n, NUCLEONS.na.protons, pr * 0.82),
    }
  }
  return cache
}

interface AtomLook {
  el: 'li' | 'na'
  r0: number
  gap: number
}
const LOOKS: Record<'li' | 'na', (k: number) => AtomLook> = {
  li: (k) => ({ el: 'li', r0: 44 * k, gap: 26 * k }),
  na: (k) => ({ el: 'na', r0: 36 * k, gap: 20 * k }),
}

const AMBER = 'rgba(251, 191, 36, 0.95)'
const SLATE = 'rgba(203, 213, 225, 0.95)'

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

/** A travelling wavy photon — the γ-ray symbol, tinted its true color. */
export function drawPhoton(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  angle: number,
  head: number,
  alpha: number,
  t: number,
  k: number,
  nm: number,
  labelled = true,
) {
  if (alpha <= 0) return
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  ctx.strokeStyle = wavelengthToCss(nm, alpha)
  ctx.lineWidth = 2.4
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
  if (labelled) {
    ctx.save()
    ctx.globalAlpha *= alpha
    tag(ctx, 'photon', x0 + (head + 34 * k) * c, y0 + (head + 34 * k) * s, wavelengthToCss(nm))
    ctx.restore()
  }
}

/** one atom's dance, `q` = time relative to its start, `rate` speeds it up */
function atomClock(q: number, rate: number) {
  const r = q * rate
  return {
    flash: clamp01(r / FLASH_END),
    flashAlpha: r < FLASH_END ? Math.sin(Math.PI * clamp01(r / FLASH_END)) : 0,
    ring: clamp01((r - RING_IN0) / (RING_IN1 - RING_IN0)),
    // 0 = home, 1 = on the dashed seat
    lift:
      r < FALL0
        ? easeInOut(clamp01((r - LIFT0) / (LIFT1 - LIFT0)))
        : 1 - easeIn(clamp01((r - FALL0) / (FALL1 - FALL0))),
    wobble: r > LIFT1 && r < FALL0 ? Math.sin(r * 14) * 0.5 + 0.5 : 0,
    photonT: r >= FALL1 ? (r - FALL1) / rate : -1, // photon flies in real time
    r,
  }
}

/** the atom + its energy staircase; `q` < 0 = not started yet (calm atom) */
function drawJumpAtom(
  ctx: CanvasRenderingContext2D,
  spec: JumpAtomSpec,
  X: (wx: number) => number,
  Y: (wy: number) => number,
  k: number,
  q: number,
  rate: number,
  spin: number,
  tNow: number,
) {
  const el = spec.el as 'li' | 'na'
  const look = LOOKS[el](k)
  const sp = sprites(k)
  const x = X(spec.x)
  const y = Y(spec.y)
  const shells = shellConfiguration(NUCLEONS[el].protons, NUCLEONS[el].protons)
  const rOuter = look.r0 + look.gap * (shells.length - 1)
  const rExc = rOuter + look.gap * 1.15
  const clock = q >= 0 ? atomClock(q, rate) : null
  const nm = SPECTRA[el].lines[0].nm

  // heat flash: a warm wash over the atom
  if (clock && clock.flashAlpha > 0) {
    const r = rExc + 70 * k
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255, 237, 190, ${0.5 * clock.flashAlpha})`)
    g.addColorStop(0.6, `rgba(251, 146, 60, ${0.28 * clock.flashAlpha})`)
    g.addColorStop(1, 'rgba(251, 146, 60, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // shells (home rings)
  const jig = clock && clock.flashAlpha > 0 ? Math.sin(tNow * 40) * 1.5 * k * clock.flashAlpha : 0
  for (let i = 0; i < shells.length; i++) {
    const r = look.r0 + look.gap * i
    ctx.strokeStyle = i === shells.length - 1 ? '#4a6b91' : '#3b5a7d'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x + jig, y, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  // the dashed higher-energy seat
  const ringA = clock ? clock.ring * (clock.r < FALL1 + 1.2 ? 1 : 1 - clamp01((clock.r - FALL1 - 1.2) / 0.8)) : 0
  if (ringA > 0) {
    ctx.save()
    ctx.globalAlpha *= ringA
    ctx.strokeStyle = '#7dd3fc'
    ctx.lineWidth = 1.4
    ctx.setLineDash([6 * k, 6 * k])
    ctx.beginPath()
    ctx.arc(x, y, rExc, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
    tag(ctx, 'higher-energy seat', x, y - rExc - 16 * k, SLATE, 12)
  }
  // nucleus
  blit(ctx, el === 'li' ? sp.li : sp.na, x + jig, y)
  // electrons: all but the watched one spin on their rings; the watched one
  // (last of the outer shell) lifts to the dashed seat and falls back
  for (let i = 0; i < shells.length; i++) {
    const isOuter = i === shells.length - 1
    const r = look.r0 + look.gap * i
    const eR = (isOuter ? 3.4 : 2.6) * k
    const a0 = (spin * (i % 2 === 0 ? 1 : -0.7)) / (1 + i * 0.25) + i * 1.3
    for (let e = 0; e < shells[i]; e++) {
      const watched = isOuter && e === shells[i] - 1
      const a = a0 + (e * 2 * Math.PI) / shells[i]
      let er = r
      if (watched && clock) {
        const wob = clock.wobble * Math.sin(tNow * 18) * 3 * k
        er = r + (rExc - r) * clock.lift + wob * clock.lift
      }
      drawGlossyParticle(ctx, 'electrons', x + er * Math.cos(a), y + er * Math.sin(a), eR)
    }
  }
  // the photon of the fall
  if (clock && clock.photonT >= 0 && clock.photonT < PHOTON_LIFE) {
    const head = rOuter + clock.photonT * 330 * k
    const a = clock.photonT < PHOTON_LIFE - 0.5 ? 1 : (PHOTON_LIFE - clock.photonT) / 0.5
    drawPhoton(ctx, x, y, spec.photonAngle, head, a, tNow, k, nm)
  }
  // name tag
  tag(ctx, SPECTRA[el].name, x, y + rExc + 24 * k, q >= 0 ? AMBER : SLATE)

  // ---- the energy staircase ----
  const lx = x + spec.ladderSide * (rExc + 96 * k)
  const base = y + 64 * k
  const stepH = dropHeight(nm) * 150 * k
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)'
  ctx.lineWidth = 2
  const rung = (ry: number) => {
    ctx.beginPath()
    ctx.moveTo(lx - 26 * k, ry)
    ctx.lineTo(lx + 26 * k, ry)
    ctx.stroke()
  }
  rung(base)
  rung(base - stepH)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.font = `${Math.round(11 * k)}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = spec.ladderSide > 0 ? 'left' : 'right'
  ctx.textBaseline = 'middle'
  ctx.fillText('home step', lx + spec.ladderSide * 32 * k, base)
  ctx.fillText('higher step', lx + spec.ladderSide * 32 * k, base - stepH)
  // the mirrored dot
  const lift = clock ? clock.lift : 0
  drawGlossyParticle(ctx, 'electrons', lx, base - stepH * lift, 4 * k)
  // the drop arrow in the photon's color, drawn from the fall on
  if (clock && clock.r >= FALL1) {
    const a = Math.min(1, (clock.r - FALL1) / 0.4)
    ctx.save()
    ctx.globalAlpha *= a
    ctx.strokeStyle = wavelengthToCss(nm)
    ctx.fillStyle = wavelengthToCss(nm)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    const ax = lx + spec.ladderSide * 12 * k
    ctx.beginPath()
    ctx.moveTo(ax, base - stepH + 6 * k)
    ctx.lineTo(ax, base - 8 * k)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ax, base - 2 * k)
    ctx.lineTo(ax - 5 * k, base - 10 * k)
    ctx.lineTo(ax + 5 * k, base - 10 * k)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

/** a calm bystander atom, small and dim */
function drawBystander(
  ctx: CanvasRenderingContext2D,
  el: 'li' | 'na',
  x: number,
  y: number,
  k: number,
  spin: number,
) {
  ctx.save()
  ctx.globalAlpha *= 0.5
  const look = LOOKS[el](k)
  const shells = shellConfiguration(NUCLEONS[el].protons, NUCLEONS[el].protons)
  const s = 0.62 // bystanders drawn smaller
  for (let i = 0; i < shells.length; i++) {
    const r = (look.r0 + look.gap * i) * s
    ctx.strokeStyle = '#3b5a7d'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
    const a0 = (spin * (i % 2 === 0 ? 1 : -0.7)) / (1 + i * 0.25) + i * 1.3
    for (let e = 0; e < shells[i]; e++) {
      const a = a0 + (e * 2 * Math.PI) / shells[i]
      drawGlossyParticle(ctx, 'electrons', x + r * Math.cos(a), y + r * Math.sin(a), 2 * k)
    }
  }
  // reuse the one sprite cache (keyed by k): blit the full-size nucleus
  // scaled down around its centre instead of building a second sprite set
  const sp = sprites(k)
  ctx.translate(x, y)
  ctx.scale(s, s)
  blit(ctx, el === 'li' ? sp.li : sp.na, 0, 0)
  ctx.restore()
}

// ---------- the scene ----------

export function drawLightCloseup(
  ctx: CanvasRenderingContext2D,
  t: number,
  W: number,
  H: number,
  alpha: number,
) {
  if (alpha <= 0) return
  const s = t - LIGHT_SCENE_START
  const k = Math.min(W, H) / 800
  const spin = t * 0.5

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)

  // camera: on the lithium atom, then pans to the sodium atom
  const pan = easeInOut(clamp01((s - PAN_START) / (PAN_END - PAN_START)))
  const ox = W / 2 - CAM_END_X * pan * k
  const oy = H * 0.45
  const X = (wx: number) => ox + wx * k
  const Y = (wy: number) => oy + wy * k

  for (const [i, b] of BYSTANDERS.entries())
    drawBystander(ctx, b.el as 'li' | 'na', X(b.x), Y(b.y), k, spin + i * 2)

  drawJumpAtom(ctx, ATOMS[0], X, Y, k, s, 1, spin, t)
  drawJumpAtom(ctx, ATOMS[1], X, Y, k, s - ATOM2_PLAY, ATOM2_RATE, spin + 2, t)

  // a soft glow across the whole view: we are inside a glowing spark
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7)
  g.addColorStop(0, 'rgba(251, 146, 60, 0.05)')
  g.addColorStop(1, 'rgba(251, 146, 60, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  ctx.restore()
}

/** fade of the whole close-up into the barcode free-run (last 0.4 s) */
export function lightCloseupOutAlpha(t: number): number {
  return 1 - clamp01((t - (LIGHT_CLOSEUP_TOTAL - 0.4)) / 0.4)
}

// exported for tests
export const LIGHT_STEP_ENDS = STEP_ENDS
