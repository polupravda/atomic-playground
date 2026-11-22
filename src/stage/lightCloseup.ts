import { drawGlossyParticle } from './particleStyle'
import type { ParticleKind } from '../state/atomStore'
import { shellConfiguration } from '../core/atom'
import { SPECTRA, dropHeight, wavelengthToCss, type SpectrumElementId } from '../core/spectra'
import { blit, clamp01, easeIn, easeInOut, makeCanvasSprite, type Sprite } from './canvasUtil'
import { bounce, callout, fadeIn, replayFrame, rewindSweep, stepRing, type Box, type Pt } from './laserCutScenes'
import { sinceLaunch } from './laserScenes'

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

/** an atom's rings: home shells, its outer ring and the dashed seat */
function atomRadii(el: 'li' | 'na', k: number) {
  const look = LOOKS[el](k)
  const shells = shellConfiguration(NUCLEONS[el].protons, NUCLEONS[el].protons)
  const rOuter = look.r0 + look.gap * (shells.length - 1)
  return { shells, rOuter, rExc: rOuter + look.gap * 1.15 }
}

/** where an atom's energy staircase stands: its x, the home rung's y and
 *  the step height (∝ the photon's energy) */
function ladderOf(el: 'li' | 'na', x: number, y: number, side: 1 | -1, k: number) {
  const nm = SPECTRA[el].lines[0].nm
  return {
    lx: x + side * (atomRadii(el, k).rExc + 96 * k),
    base: y + 64 * k,
    stepH: dropHeight(nm) * 150 * k,
    nm,
  }
}

/** one atom's dance, `q` = time relative to its start; `rate` < 1 plays
 *  it faster (the dance takes ATOM_LEN × rate seconds) */
function atomClock(q: number, rate: number) {
  const r = q / rate
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
    photonT: r >= FALL1 ? (r - FALL1) * rate : -1, // photon flies in real time
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
  /** the photon's flight time when it flies on the idle clock (the
   *  drill-in's replay); default: the dance's own clock */
  photonT?: number,
) {
  const el = spec.el as 'li' | 'na'
  const look = LOOKS[el](k)
  const sp = sprites(k)
  const x = X(spec.x)
  const y = Y(spec.y)
  const { shells, rOuter, rExc } = atomRadii(el, k)
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
  const pT = photonT ?? (clock ? clock.photonT : -1)
  if (clock && pT >= 0 && pT < PHOTON_LIFE) {
    const head = rOuter + pT * 330 * k
    const a = pT < PHOTON_LIFE - 0.5 ? 1 : (PHOTON_LIFE - pT) / 0.5
    drawPhoton(ctx, x, y, spec.photonAngle, head, a, tNow, k, nm)
  }
  // name tag
  tag(ctx, SPECTRA[el].name, x, y + rExc + 24 * k, q >= 0 ? AMBER : SLATE)

  // ---- the energy staircase ----
  const { lx, base, stepH } = ladderOf(el, x, y, spec.ladderSide, k)
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
  // no "home step" / "higher step" labels (Elena, 2026-11-21): the rungs
  // and the climbing dot say it; kids don't read canvas words
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
  /** IDLE time: drives motion that carries no story (the electrons'
   *  spin, wobble and flash jiggle, the photons' wave) — it keeps running
   *  while the narrator holds the story still */
  idle = t,
) {
  if (alpha <= 0) return
  const s = t - LIGHT_SCENE_START
  const k = Math.min(W, H) / 800
  const spin = idle * 0.5

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

  drawJumpAtom(ctx, ATOMS[0], X, Y, k, s, 1, spin, idle)
  drawJumpAtom(ctx, ATOMS[1], X, Y, k, s - ATOM2_PLAY, ATOM2_RATE, spin + 2, idle)

  // a soft glow across the whole view: we are inside a glowing spark
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7)
  g.addColorStop(0, 'rgba(251, 146, 60, 0.05)')
  g.addColorStop(1, 'rgba(251, 146, 60, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  ctx.restore()
}

// ---------- 🔁 the drill-in (playbook rule 25) ----------
//
// `closeupDrill`, right after sodium's yellow photon: the same dance again,
// as a look back. Story time holds at 0, 2.5, 5 and 7.5 while the four
// pieces are said (science pacing); each event plays right after its piece:
//   0    "Let's watch that once more, closer." over the close-up's last
//        frame (electrons circling) → a ⏪ rewind sweep, and the replay
//        frame opens on BOTH atoms side by side, a little smaller, their
//        staircases standing next to each other in the middle
//   2.5  "First, the heat pushes the electron up…" → ① on lithium: the
//        heat washes over it, the electron climbs to the dashed seat (and
//        wobbles there — idle motion — while the next piece is said)
//   5    "Then it falls back down…" → ② it falls, the ladder's red arrow,
//        the red photon flies out (on the idle clock: it never hangs)
//   7.5  "Why is sodium's light yellow? … Its step is taller…" → ③ a
//        callout circle on the tops of the two staircases (lithium's top
//        marked by a dashed line), then sodium's dance: its dot climbs
//        ABOVE that line, falls, and the yellow photon flies out
// then the replay fades to black and the barcode free-run fades in.
// Same atoms, same rings, same ladders, same wavy photons as the close-up —
// only the framing, the speed and the marks change.

export const LIGHT_DRILL_T = 13
/** the replay's size against the close-up (both atoms fit side by side) */
const DRILL_SCALE = 0.72
const DRILL_OUT = 0.4

/** piecewise-linear keyframes [t, value]; −1 before the first */
function keyed(t: number, keys: Array<[number, number]>): number {
  if (t < keys[0][0]) return -1
  for (let i = 1; i < keys.length; i++) {
    const [t0, v0] = keys[i - 1]
    const [t1, v1] = keys[i]
    if (t < t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
  }
  return keys[keys.length - 1][1]
}
// drill time → each atom's dance time (FLASH_END 2.3, lift 2.5–4.3, fall
// 6.4–7.5): ① the flash and the climb, the wobble held at its widest
// (r = 4.6) while piece 3 is said; ② the fall; lithium calm again before
// piece 4; ③ sodium's whole dance, a little quicker (seen twice already)
const LI_KEYS: Array<[number, number]> = [
  [2.6, 0.8], [3.3, 2.4], [4.8, 4.3], [5.0, 4.6], [5.1, 6.4], [6.1, FALL1], [7.4, 10],
]
const LI_PHOTON_AT = 6.1
const NA_KEYS: Array<[number, number]> = [
  [8.0, 0.8], [8.6, 2.4], [9.6, 4.3], [10.0, 6.4], [10.8, FALL1], [LIGHT_DRILL_T, 9.6],
]
const NA_PHOTON_AT = 10.8

function drillGeo(W: number, UH: number, H: number) {
  const k = (Math.min(W, H) / 800) * DRILL_SCALE
  const y = UH * 0.4
  // the staircases face each other in the middle, 84 world units apart
  const off = (atomRadii('li', 1).rExc + 96 + 42) * k
  const li = { x: W / 2 - off, y }
  const na = { x: W / 2 + off, y }
  const liL = ladderOf('li', li.x, li.y, 1, k)
  const naL = ladderOf('na', na.x, na.y, -1, k)
  return { k, li, na, liL, naL }
}

/** one staircase's top rung, its dot and its drop arrow, seen through the
 *  callout (y mapped by `Y`) */
function zoomedStep(
  ctx: CanvasRenderingContext2D,
  x: number,
  Y: (wy: number) => number,
  L: { base: number; stepH: number; nm: number },
  lift: number,
  dropA: number,
  dotR: number,
) {
  const top = Y(L.base - L.stepH)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x - 30, top)
  ctx.lineTo(x + 30, top)
  ctx.stroke()
  if (dropA > 0) {
    ctx.save()
    ctx.globalAlpha *= dropA
    ctx.strokeStyle = wavelengthToCss(L.nm)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 14, top + 8)
    ctx.lineTo(x + 14, Y(L.base))
    ctx.stroke()
    ctx.restore()
  }
  drawGlossyParticle(ctx, 'electrons', x, Y(L.base - L.stepH * lift), dotR)
}

export function drawLightCloseupDrill(
  ctx: CanvasRenderingContext2D,
  t: number,
  W: number,
  UH: number,
  H: number,
  /** IDLE time: spin, wobble, photon flights — never stops */
  idle: number,
) {
  const b: Box = { W, UH, H }
  ctx.save()
  ctx.globalAlpha *= 1 - fadeIn(t, LIGHT_DRILL_T - DRILL_OUT, DRILL_OUT)
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  // the opener is said over the close-up's last picture, still alive
  const was = 1 - fadeIn(t, 0.3, 0.45)
  if (was > 0) drawLightCloseup(ctx, LIGHT_CLOSEUP_TOTAL, W, H, was, idle)

  const open = fadeIn(t, 0.75, 0.5)
  const { k, li, na, liL, naL } = drillGeo(W, UH, H)
  const spin = idle * 0.5
  const rLi = keyed(t, LI_KEYS)
  const rNa = keyed(t, NA_KEYS)
  const liPh = sinceLaunch('fw-drill:li', t, LI_PHOTON_AT, idle)
  const naPh = sinceLaunch('fw-drill:na', t, NA_PHOTON_AT, idle)
  if (open > 0) {
    ctx.save()
    ctx.globalAlpha *= open
    const at = (p: { x: number; y: number }) => ({ X: (wx: number) => p.x + wx * k, Y: (wy: number) => p.y + wy * k })
    const L = at(li)
    const N = at(na)
    drawJumpAtom(ctx, { el: 'li', x: 0, y: 0, photonAngle: ATOMS[0].photonAngle, ladderSide: 1 }, L.X, L.Y, k, rLi, 1, spin, idle, liPh)
    drawJumpAtom(ctx, { el: 'na', x: 0, y: 0, photonAngle: ATOMS[1].photonAngle, ladderSide: -1 }, N.X, N.Y, k, rNa, 1, spin + 2, idle, naPh)
    // the warm glow: still inside the spark
    const g = ctx.createRadialGradient(W / 2, UH / 2, 0, W / 2, UH / 2, Math.max(W, UH) * 0.7)
    g.addColorStop(0, 'rgba(251, 146, 60, 0.05)')
    g.addColorStop(1, 'rgba(251, 146, 60, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, UH)

    // ① the heat pushes lithium's electron up; ② it falls, a red photon
    const ringR = atomRadii('li', k).rExc + 44 // clear of the two tags
    stepRing(ctx, li.x, li.y, ringR, 1, idle, fadeIn(t, 2.6, 0.4) * (1 - fadeIn(t, 5, 0.4)))
    stepRing(ctx, li.x, li.y, ringR, 2, idle, fadeIn(t, 5.1, 0.4) * (1 - fadeIn(t, 7.5, 0.4)))

    // ③ a callout on the two staircases' tops: lithium's step, sodium's
    // taller one (lithium's top marked by a dashed line across both)
    const liTop = liL.base - liL.stepH
    const naTop = naL.base - naL.stepH
    const from: Pt = { x: W / 2, y: (liTop + naTop) / 2 }
    const cr = Math.min(W, UH) * 0.14
    const cc: Pt = { x: W / 2, y: Math.min(UH - cr - 40, liL.base + 40 + cr) }
    const pop = bounce(sinceLaunch('fw-drill:callout', t, 7.6, idle), 0.4, 999, 0.1)
    const inset = pop > 0 ? 0.6 + 0.4 * Math.min(1.1, pop) : 0
    const Z = 3 // the rungs' height difference, three times bigger
    callout(ctx, from, cc, cr * inset, clamp01(pop * 2), () => {
      const Y = (wy: number) => cc.y + (wy - from.y) * Z * inset
      const liLift = rLi >= 0 ? atomClock(rLi, 1).lift : 0
      const naLift = rNa >= 0 ? atomClock(rNa, 1).lift : 0
      const drop = (r: number) => (r >= FALL1 ? Math.min(1, (r - FALL1) / 0.4) : 0)
      ctx.save()
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([7, 6])
      ctx.beginPath()
      ctx.moveTo(cc.x - cr, Y(liTop))
      ctx.lineTo(cc.x + cr, Y(liTop))
      ctx.stroke()
      ctx.restore()
      zoomedStep(ctx, cc.x - cr * 0.42, Y, liL, liLift, drop(rLi), 4 * k * Z * inset)
      zoomedStep(ctx, cc.x + cr * 0.42, Y, naL, naLift, drop(rNa), 4 * k * Z * inset)
    })
    if (pop > 0) stepRing(ctx, cc.x, cc.y, cr + 8, 3, idle, fadeIn(t, 7.7, 0.4))
    ctx.restore()
  }
  rewindSweep(ctx, b, clamp01((t - 0.1) / 0.9))
  replayFrame(ctx, b, fadeIn(t, 0.9, 0.5))
  ctx.restore()
}

// exported for tests
export const LIGHT_STEP_ENDS = STEP_ENDS
