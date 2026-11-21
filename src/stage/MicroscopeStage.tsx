import { useRef } from 'react'
import { canvasPoint, useCanvas } from './useCanvas'
import { blit, clamp01, easeInOut } from './canvasUtil'
import { AMBER, AMBER_SOFT, electronSprite, frac, lerp, shellAtom, shellAtomR, tag, text } from './storyDraw'
import { drawLightBulb, drawWavePacket, ordinaryCss } from './lightPacket'
import {
  SEE_LIMIT_M,
  SPECIMENS,
  SPECIMEN_ORDER,
  VIEW_PER_SIZE,
  WAVE_M,
  blurOfView,
  drawnWiggle,
  honeycomb,
  howSeen,
  microscopeResult,
  shadowStrength,
  viewOf,
  type MicroscopeBeam,
  type SpecimenId,
} from '../core/microscope'

// L14 🔬 Microscopes — a Light lab drawer scene (proposal 11). Built to the
// kid-friendly playbook (docs/how-things-work/15-kid-friendly-animation.md):
//
//   the ladder   a ruler of tiny things, hair → atoms, true log scale; tap
//                a picture to fly there. The "can see down to here" line of
//                the chosen microscope; everything past it is shaded.
//   the window   the thing, very close, as it really is. Light flies in
//                from a light bulb as the Light lab's photon packets — the
//                🩻 bone photo's exact look (warm-white packets, the same
//                bulb) — each packet's little wave at TRUE scale. Smaller
//                than the thing → the packet is caught whole when it hits
//                it (a warm shimmer), so a shadow builds up behind from the
//                packets that never arrive, never painted (the bone photo's
//                rule); bigger → the packet flows on over it. Electrons fly
//                as the same packets in electron blue, each carrying its
//                electron. Two marks under it compare the thing with ONE
//                wave, drawn as one wiggle.
//   the picture  what you see: an eyepiece (light) or a screen (electrons,
//                eyes can't see them), blurred by the microscope's limit,
//                computed, not faked. Electron pictures have no color.
//   we are here  a drawn microscope with an amber box on its slide, joined
//                to the window (the "we are here" corner of the power plant)
//
// Picking a smaller thing ZOOMS (log flight): the old thing grows out of
// the window while the new one grows in, and light's waves visibly grow
// against them. Switching to electrons shrinks the waves on screen.
// Nothing plays by itself; life (waves rolling, bacterium tails, the DNA
// turning, atoms' electrons) runs on the idle clock.

const BG = '#0a1020'
/** the packets' colors: light = the bone photo's ordinary light (warm
 *  white, core only); electrons = the app's electron sky blue */
const electronCss = (a: number) => (a < 0.5 ? 'rgba(0, 0, 0, 0)' : 'rgba(186, 230, 253, 0.95)')
const packetCss = (beam: MicroscopeBeam) => (beam === 'light' ? ordinaryCss : electronCss)
/** the same colors, solid (ruler line, the one-wave mark) */
const beamSolid = (beam: MicroscopeBeam, a = 0.95) =>
  beam === 'light' ? `rgba(255, 246, 214, ${a})` : `rgba(186, 230, 253, ${a})`

/** packets fly this fast (px/s) */
const PACKET_SPEED = 300
/** the window shows a little more around the thing than the picture does,
 *  so packets can fly past above and below it (the shadow needs a lit
 *  neighbourhood to show) */
const WINDOW_ZOOM_OUT = 1.6
/** the strip with the two bars, along the window's bottom */
const BARS_H = 70

type Look = 'real' | 'picture'

// ---------- the things, drawn ----------

/** half width / half height of the thing's silhouette, in thing-widths
 *  (Infinity = runs out of the window: a hair, a DNA strand) */
const SILHOUETTE: Record<SpecimenId, { hw: number; hh: number }> = {
  hair: { hw: 0.5, hh: Infinity },
  pollen: { hw: 0.5, hh: 0.5 },
  blood: { hw: 0.5, hh: 0.5 },
  bacterium: { hw: 0.5, hh: 0.19 },
  virus: { hw: 0.5, hh: 0.5 },
  dna: { hw: 0.5, hh: Infinity },
  atoms: { hw: Infinity, hh: Infinity },
}

/** one thing at `k` px per metre, centred on (x, y). `reach` = how far
 *  (px) a long thing has to run to leave the frame */
function drawSpecimen(
  ctx: CanvasRenderingContext2D,
  id: SpecimenId,
  x: number,
  y: number,
  k: number,
  look: Look,
  idle: number,
  reach: number,
  alpha = 1,
) {
  if (alpha <= 0.002) return
  const s = SPECIMENS[id].size * k
  // far too big to be anything but a wall, or far too small to see at all
  if (s > 40 * reach && id !== 'hair' && id !== 'dna') return
  ctx.save()
  ctx.globalAlpha *= alpha
  const live = look === 'real' ? idle : 0
  if (id === 'hair') {
    const w = s
    const h = reach * 2.2
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0)
    g.addColorStop(0, '#3b2210')
    g.addColorStop(0.5, '#8b5a2b')
    g.addColorStop(1, '#3b2210')
    ctx.fillStyle = g
    ctx.fillRect(x - w / 2, y - h / 2, w, h)
    // the cuticle: overlapping scales like roof tiles
    ctx.strokeStyle = 'rgba(30, 15, 5, 0.55)'
    ctx.lineWidth = Math.max(1, w * 0.02)
    const step = Math.max(6, w * 0.3)
    for (let yy = y - h / 2; yy < y + h / 2; yy += step) {
      ctx.beginPath()
      ctx.moveTo(x - w / 2, yy)
      ctx.quadraticCurveTo(x, yy - w * 0.16, x + w / 2, yy + w * 0.04)
      ctx.stroke()
    }
  } else if (id === 'pollen') {
    const R = s / 2
    const body = R * 0.8
    // spikes
    ctx.fillStyle = '#d97706'
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a - 0.09) * body * 0.96, y + Math.sin(a - 0.09) * body * 0.96)
      ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R)
      ctx.lineTo(x + Math.cos(a + 0.09) * body * 0.96, y + Math.sin(a + 0.09) * body * 0.96)
      ctx.fill()
    }
    const g = ctx.createRadialGradient(x - body * 0.3, y - body * 0.35, body * 0.1, x, y, body)
    g.addColorStop(0, '#fef08a')
    g.addColorStop(0.7, '#facc15')
    g.addColorStop(1, '#a16207')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, body, 0, Math.PI * 2)
    ctx.fill()
    // its pitted surface
    ctx.fillStyle = 'rgba(161, 98, 7, 0.45)'
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996
      const r = body * 0.85 * Math.sqrt((i + 0.5) / 26)
      ctx.beginPath()
      ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, body * 0.06, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (id === 'blood') {
    const R = s / 2
    // a disc, thinner in the middle: lighter there
    const g = ctx.createRadialGradient(x, y, 0, x, y, R)
    g.addColorStop(0, '#f87171')
    g.addColorStop(0.45, '#ef4444')
    g.addColorStop(0.75, '#b91c1c')
    g.addColorStop(1, '#7f1d1d')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, R, 0, Math.PI * 2)
    ctx.fill()
  } else if (id === 'bacterium') {
    const L = s
    const T = s * 0.38
    // its tails (flagella): thin, longer than the body, waving
    ctx.strokeStyle = '#bbf7d0'
    ctx.lineWidth = Math.max(1.2, 0.02e-6 * k)
    ctx.lineCap = 'round'
    for (const [k2, dy] of [
      [0, -0.25],
      [1, 0.05],
      [2, 0.3],
    ] as const) {
      ctx.beginPath()
      for (let i = 0; i <= 30; i++) {
        const q = i / 30
        const xx = x + L / 2 - T * 0.1 + q * L * 0.75
        const yy = y + dy * T + Math.sin(q * 9 - live * 6 + k2 * 2) * T * 0.22 * q
        if (i) ctx.lineTo(xx, yy)
        else ctx.moveTo(xx, yy)
      }
      ctx.stroke()
    }
    const g = ctx.createLinearGradient(0, y - T / 2, 0, y + T / 2)
    g.addColorStop(0, '#bbf7d0')
    g.addColorStop(0.5, '#4ade80')
    g.addColorStop(1, '#15803d')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.roundRect(x - L / 2, y - T / 2, L, T, T / 2)
    ctx.fill()
  } else if (id === 'virus') {
    const R = s / 2
    const body = R * 0.72
    ctx.strokeStyle = '#99f6e4'
    ctx.fillStyle = '#5eead4'
    ctx.lineWidth = Math.max(1, R * 0.05)
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.1
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * body, y + Math.sin(a) * body)
      ctx.lineTo(x + Math.cos(a) * R * 0.93, y + Math.sin(a) * R * 0.93)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x + Math.cos(a) * R * 0.93, y + Math.sin(a) * R * 0.93, R * 0.07, 0, Math.PI * 2)
      ctx.fill()
    }
    const g = ctx.createRadialGradient(x - body * 0.3, y - body * 0.3, body * 0.1, x, y, body)
    g.addColorStop(0, '#99f6e4')
    g.addColorStop(1, '#0f766e')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, body, 0, Math.PI * 2)
    ctx.fill()
  } else if (id === 'dna') {
    // the double helix, upright: one turn every 3.4 nm, turning slowly
    const P = 3.4e-9 * k
    const h = reach * 2.2
    const turn = live * 0.6
    const strand = (phase: number, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(1.5, s * 0.1)
      ctx.beginPath()
      for (let i = 0; i <= 160; i++) {
        const yy = y - h / 2 + (h * i) / 160
        const xx = x + (s / 2) * Math.sin(((yy - y) / P) * Math.PI * 2 + phase + turn)
        if (i) ctx.lineTo(xx, yy)
        else ctx.moveTo(xx, yy)
      }
      ctx.stroke()
    }
    // the rungs (base pairs), ten per turn
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)'
    ctx.lineWidth = Math.max(1, s * 0.06)
    for (let yy = y - h / 2; yy < y + h / 2; yy += P / 10) {
      const ph = ((yy - y) / P) * Math.PI * 2 + turn
      ctx.beginPath()
      ctx.moveTo(x + (s / 2) * Math.sin(ph), yy)
      ctx.lineTo(x + (s / 2) * Math.sin(ph + Math.PI * 0.8), yy)
      ctx.stroke()
    }
    strand(0, '#f472b6')
    strand(Math.PI * 0.8, '#a3e635')
  } else if (id === 'atoms') {
    // carbon atoms in one sheet of graphite (the pencil's, the 🧊 Crystal
    // lab's), drawn as the app's atoms; in the PICTURE each is a soft dark
    // spot — that is all the best microscopes show of an atom
    const reachM = reach / k
    const atoms = honeycomb(Math.min(reachM, 4e-9))
    const K = (0.055e-9 * k) / shellAtomR(6, 1)
    for (const [i, p] of atoms.entries()) {
      const ax = x + p.x * k
      const ay = y + p.y * k
      if (look === 'picture') {
        // bright spots on dark, as the best electron microscopes show atoms
        ctx.fillStyle = '#f1f5f9'
        ctx.beginPath()
        ctx.arc(ax, ay, 0.035e-9 * k, 0, Math.PI * 2)
        ctx.fill()
      } else if (K > 0.12) {
        shellAtom(ctx, ax + 1.2 * Math.sin(idle * 7 + i), ay + 1.2 * Math.cos(idle * 8 + i * 1.3), K, 6, 12, idle)
      }
    }
  }
  ctx.restore()
}

// ---------- the picture (eyepiece / screen), computed once per thing ----------

const pictures = new Map<string, HTMLCanvasElement>()

/** three box blurs ≈ a Gaussian (separable, edge-clamped) */
function blurImage(img: ImageData, r: number) {
  if (r < 1) return
  const { width: w, height: h, data } = img
  const tmp = new Float32Array(w * h * 4)
  const pass = (src: Uint8ClampedArray | Float32Array, dst: Uint8ClampedArray | Float32Array, horiz: boolean) => {
    const n = horiz ? w : h
    const lines = horiz ? h : w
    const span = 2 * r + 1
    for (let l = 0; l < lines; l++) {
      for (let c = 0; c < 4; c++) {
        const at = (i: number) => {
          const j = Math.min(n - 1, Math.max(0, i))
          return ((horiz ? l * w + j : j * w + l) << 2) + c
        }
        let sum = 0
        for (let i = -r; i <= r; i++) sum += src[at(i)]
        for (let i = 0; i < n; i++) {
          dst[at(i)] = sum / span
          sum += src[at(i + r + 1)] - src[at(i - r)]
        }
      }
    }
  }
  for (let k = 0; k < 3; k++) {
    pass(data, tmp, true)
    pass(tmp, data, false)
  }
}

function picture(id: SpecimenId, beam: MicroscopeBeam, S: number): HTMLCanvasElement {
  const key = `${id}:${beam}:${S}`
  const hit = pictures.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const view = viewOf(id)
  const k = S / view
  // light: a bright, warm lamp-lit field; electrons: a grey screen (dark
  // for atoms: the atom-seeing microscopes show them as bright spots)
  ctx.fillStyle = beam === 'light' ? '#f4efe2' : id === 'atoms' ? '#111827' : '#c7ccd3'
  ctx.fillRect(0, 0, S, S)
  drawSpecimen(ctx, id, S / 2, S / 2, k, 'picture', 0, S)
  const img = ctx.getImageData(0, 0, S, S)
  // the microscope's limit, as a blur: its smallest visible spot
  blurImage(img, Math.min(S, Math.round(0.45 * blurOfView(beam, view) * S)))
  if (beam === 'electrons') {
    // no color: electrons carry none
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const v = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]
      d[i] = d[i + 1] = d[i + 2] = v
    }
  }
  ctx.putImageData(img, 0, 0)
  pictures.set(key, c)
  if (pictures.size > 40) pictures.delete(pictures.keys().next().value!)
  return c
}

// ---------- the stage ----------

const freshState = (id: SpecimenId, beam: MicroscopeBeam) => ({
  id,
  beam,
  /** the zoom flight: from this view (m) to the current thing's, 0 → 1 */
  fromId: id,
  fromView: viewOf(id),
  flight: 1,
  flightLen: 1,
  /** the waves: from this wavelength to the current beam's, 0 → 1 */
  fromWave: WAVE_M[beam],
  waveMix: 1,
  /** the picture cross-fades from the old one */
  picFrom: { id, beam },
  picFade: 1,
  /** the packets in flight: `roll` decides, when one meets the thing,
   *  whether it is caught (roll < how strongly the thing stops the wave) */
  packets: [] as Array<{ x: number; y: number; roll: number; passed: boolean; atomX: number; big: boolean; fade: number }>,
  spawn: 0,
  /** where packets were caught: a warm shimmer (light), a pale ping
   *  (electrons) — the bone photo's two flashes */
  flashes: [] as Array<{ x: number; y: number; age: number; beam: MicroscopeBeam }>,
  /** seconds since everything settled */
  calm: 0,
  result: '',
  hover: null as SpecimenId | null,
})

export function MicroscopeStage({
  width: W,
  height: H,
  active,
  specimen,
  beam,
  onPick,
  onResult,
}: {
  width: number
  height: number
  active: boolean
  specimen: SpecimenId
  beam: MicroscopeBeam
  /** a picture on the ruler was tapped */
  onPick: (id: SpecimenId) => void
  /** the outcome is on screen ('microscope-blur', …) — the narrator explains */
  onResult?: (key: string) => void
}) {
  const st = useRef(freshState(specimen, beam))
  const props = useRef({ specimen, beam })
  props.current = { specimen, beam }

  // ---- layout ----
  const ruler = { x0: 46, x1: W - 46, y: 96 }
  const win = { x0: 92, x1: W - 16, y0: 146, y1: 146 + Math.round(Math.max(340, H * 0.44)) }
  const ww = win.x1 - win.x0
  const wh = win.y1 - win.y0
  // centred: the packets need room to arrive on the left and the shadow
  // (the missing packets) room to show on the right
  const thingX = win.x0 + ww * 0.5
  // centred between the headline and the bars strip
  const thingY = win.y0 + 40 + (wh - 40 - BARS_H) / 2
  const low = { y0: win.y1 + 70, y1: H - 14 }
  const picR = Math.max(70, Math.min((low.y1 - low.y0) / 2 - 22, W * 0.2))
  const pic = { x: W * 0.68, y: (low.y0 + low.y1) / 2 }
  const scope = { x: W * 0.24, y0: low.y0 + 4, y1: low.y1 - 4 }
  // the ladder: true log scale, 0.3 mm … 0.03 nm
  const LOG0 = -3.5
  const LOG1 = -10.5
  const rx = (m: number) => ruler.x0 + ((LOG0 - Math.log10(m)) / (LOG0 - LOG1)) * (ruler.x1 - ruler.x0)
  const iconY = ruler.y - 30

  const ref = useCanvas(W, H, active, (ctx, idle, dt) => {
    const s = st.current
    const want = props.current

    // ---- follow the controls ----
    const currentView = () =>
      Math.exp(lerp(Math.log(s.fromView), Math.log(viewOf(s.id)), easeInOut(clamp01(s.flight))))
    if (want.specimen !== s.id) {
      const v = currentView()
      s.fromId = s.flight < 0.5 ? s.fromId : s.id
      s.fromView = v
      s.picFrom = { id: s.id, beam: s.beam }
      s.id = want.specimen
      s.flight = 0
      // longer flights for longer journeys (decades of size)
      s.flightLen = Math.min(2.2, 0.8 + 0.25 * Math.abs(Math.log10(v / viewOf(s.id))))
      s.picFade = 0
      s.calm = 0
    }
    if (want.beam !== s.beam) {
      s.fromWave = Math.exp(lerp(Math.log(s.fromWave), Math.log(WAVE_M[s.beam]), easeInOut(s.waveMix)))
      s.picFrom = { id: s.id, beam: s.beam }
      s.beam = want.beam
      s.waveMix = 0
      s.picFade = 0
      s.calm = 0
    }
    s.flight = Math.min(1, s.flight + dt / s.flightLen)
    s.waveMix = Math.min(1, s.waveMix + dt / 1.1)
    s.picFade = Math.min(1, s.picFade + dt / (s.flight < 1 ? s.flightLen : 0.7))
    const settled = s.flight >= 1 && s.waveMix >= 1 && s.picFade >= 1
    s.calm = settled ? s.calm + dt : 0

    // 🗣️ the outcome, once it is clearly on screen
    if (s.calm > 0.6) {
      const r = microscopeResult(s.beam, s.id)
      if (r && r !== s.result) onResult?.(r)
      s.result = r
    }

    const view = currentView()
    const k = ww / (view * WINDOW_ZOOM_OUT) // px per metre in the window
    const wave = Math.exp(lerp(Math.log(s.fromWave), Math.log(WAVE_M[s.beam]), easeInOut(s.waveMix)))
    // the color changes half-way through the shrink / stretch
    const shown: MicroscopeBeam = s.waveMix > 0.5 ? s.beam : s.beam === 'light' ? 'electrons' : 'light'
    const lambdaPx = wave * k
    stepPackets(dt, k, wave, shown)

    // ---- the background ----
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#060b1a')
    bg.addColorStop(1, '#020617')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    drawLadder(ctx, view)
    drawWindow(ctx, idle, k, lambdaPx, shown)
    drawBars(ctx, k, wave, shown)
    drawScope(ctx, idle)
    drawPicture(ctx)
  })

  // ---------- the ladder ----------
  function drawLadder(ctx: CanvasRenderingContext2D, view: number) {
    const s = st.current
    const y = ruler.y
    // past the chosen microscope's limit: too small for it
    const lim = rx(SEE_LIMIT_M[s.beam])
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
    ctx.fillRect(lim, y - 52, ruler.x1 + 20 - lim, 84)
    ctx.save()
    ctx.beginPath()
    ctx.rect(lim, y - 52, ruler.x1 + 20 - lim, 84)
    ctx.clip()
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)'
    ctx.lineWidth = 2
    for (let x = lim - 80; x < ruler.x1 + 40; x += 12) {
      ctx.beginPath()
      ctx.moveTo(x, y + 32)
      ctx.lineTo(x + 84, y - 52)
      ctx.stroke()
    }
    ctx.restore()
    // the bar and its decades
    ctx.fillStyle = '#334155'
    ctx.fillRect(ruler.x0, y - 2, ruler.x1 - ruler.x0, 4)
    const marks: Array<[number, string]> = [
      [1e-4, '0.1 mm'],
      [1e-5, '10 µm'],
      [1e-6, '1 µm'],
      [1e-7, '100 nm'],
      [1e-8, '10 nm'],
      [1e-9, '1 nm'],
      [1e-10, '0.1 nm'],
    ]
    for (const [m, label] of marks) {
      const x = rx(m)
      ctx.fillStyle = '#64748b'
      ctx.fillRect(x - 1, y - 6, 2, 12)
      text(ctx, label, x, y + 25, 'rgba(148, 163, 184, 0.85)', 10)
    }
    text(ctx, 'bigger', ruler.x0 - 6, y + 25, 'rgba(148, 163, 184, 0.7)', 10, '', 'right')
    text(ctx, 'smaller', ruler.x1 + 6, y + 25, 'rgba(148, 163, 184, 0.7)', 10, '', 'left')
    // the limit line: "this microscope sees down to here"
    ctx.strokeStyle = beamSolid(s.beam)
    ctx.lineWidth = 2.5
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(lim, y - 50)
    ctx.lineTo(lim, y + 32)
    ctx.stroke()
    ctx.setLineDash([])
    // (the line's emoji: a 💡 or ⚡ at its top)
    emoji(ctx, s.beam === 'light' ? '💡' : '⚡', lim, y - 58, 16)
    // the things, at their sizes — tap one to fly there
    for (const id of SPECIMEN_ORDER) {
      const sp = SPECIMENS[id]
      const x = rx(sp.size)
      const on = id === s.id
      const big = on ? 30 : s.hover === id ? 27 : 23
      if (on) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.16)'
        ctx.beginPath()
        ctx.arc(x, iconY, 20, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = howSeen(s.beam, sp.size) === 'blur' ? 0.55 : 1
      emoji(ctx, sp.emoji, x, iconY, big)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(x - 0.5, iconY + 16, 1, y - iconY - 18)
    }
    // where the window is now: the amber marker rides the zoom
    const mx = rx(view / VIEW_PER_SIZE)
    ctx.fillStyle = AMBER
    ctx.beginPath()
    ctx.moveTo(mx, y + 4)
    ctx.lineTo(mx - 8, y + 16)
    ctx.lineTo(mx + 8, y + 16)
    ctx.closePath()
    ctx.fill()
  }

  // ---------- the window: the thing as it really is, and the packets ----------

  /** a packet's shape at the window's scale: its wiggle (drawnWiggle: true
   *  scale, squeezed only where too fine to draw), its length and height.
   *  Fine packets are all equally long — only how tightly they wiggle
   *  tells their waves apart */
  function packetShape(lambdaPx: number) {
    const lam = drawnWiggle(lambdaPx)
    const len = Math.min(Math.max(lam * 1.5, 44), ww * 1.1)
    const amp = lam <= 40 ? Math.min(19, Math.max(3, lam * 0.6)) : Math.min(wh * 0.12, 19 + lam * 0.02)
    // a fine wiggle needs a thin line and fine sampling to stay a wiggle
    const core = Math.min(3, Math.max(1.2, lam * 0.3))
    const step = Math.min(Math.max(1.5, Math.min(4, lam / 24)), lam / 8)
    return { lam, len, amp, core, step, big: lam > ww * 0.4 }
  }

  /** where a packet flying at height y first meets the thing (its left
   *  edge), or null when it misses it */
  function edgeAt(id: SpecimenId, y: number, k: number): number | null {
    const px = SPECIMENS[id].size * k
    const sil = SILHOUETTE[id]
    if (sil.hw === Infinity) return null
    const dy = Math.abs(y - thingY)
    if (sil.hh === Infinity) return thingX - sil.hw * px
    if (id === 'bacterium') {
      const L = px
      const T = sil.hh * 2 * px
      if (dy >= T / 2) return null
      return thingX - L / 2 + (T / 2 - Math.sqrt((T / 2) ** 2 - dy * dy))
    }
    const r = sil.hw * px
    return dy < r ? thingX - Math.sqrt(r * r - dy * dy) : null
  }

  function stepPackets(dt: number, k: number, wave: number, beam: MicroscopeBeam) {
    const s = st.current
    const shape = packetShape(wave * k)
    const top = win.y0 + 40 // under the headline
    const bottom = win.y1 - BARS_H - 12
    // new packets leave the bulb: small ones in a steady rain, a wave bigger
    // than the window one at a time, straight at the thing
    s.spawn -= dt
    while (s.spawn <= 0) {
      s.spawn += Math.max(0.05, (shape.len / PACKET_SPEED) * (shape.big ? 1.15 : 0.25))
      s.packets.push({
        x: win.x0 - shape.len * 0.45,
        y: shape.big ? thingY + (Math.random() - 0.5) * 30 : top + Math.random() * (bottom - top),
        roll: Math.random(),
        passed: false,
        atomX: win.x0 + ww * (0.15 + 0.8 * Math.random()),
        big: shape.big,
        fade: 1,
      })
    }
    const size = SPECIMENS[s.id].size
    const strength = shadowStrength(size, wave)
    const keep: typeof s.packets = []
    for (const p of s.packets) {
      // packets from before a zoom that changed their kind (rain ⇄ one big
      // wave) fade out instead of all turning into giant waves at once
      if (p.big !== shape.big) p.fade -= dt / 0.4
      if (p.fade <= 0) continue
      const front0 = p.x + shape.len * 0.45
      p.x += PACKET_SPEED * dt
      const front = p.x + shape.len * 0.45
      if (!p.passed) {
        // atoms fill the window: a packet may be caught by any of them
        const edge = SILHOUETTE[s.id].hw === Infinity ? (p.roll < 0.35 ? p.atomX : null) : edgeAt(s.id, p.y, k)
        if (edge !== null && front0 < edge && front >= edge) {
          const chance = SILHOUETTE[s.id].hw === Infinity ? 1 : strength
          if (p.roll < chance) {
            // caught whole: it never arrives behind the thing
            s.flashes.push({ x: edge, y: p.y, age: 0, beam })
            continue
          }
          p.passed = true
        }
      }
      if (p.x - shape.len * 0.45 < win.x1 + 10) keep.push(p)
    }
    s.packets = keep
    for (const f of s.flashes) f.age += dt
    s.flashes = s.flashes.filter((f) => f.age < 0.5)
  }

  function drawWindow(ctx: CanvasRenderingContext2D, idle: number, k: number, lambdaPx: number, beam: MicroscopeBeam) {
    const s = st.current
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(win.x0, win.y0, ww, wh, 14)
    ctx.fillStyle = BG
    ctx.fill()
    ctx.clip()

    // the bulb's (or the gun's) faint beam across the whole window
    const beamG = ctx.createLinearGradient(win.x0, 0, win.x1, 0)
    beamG.addColorStop(0, beam === 'light' ? 'rgba(253, 230, 170, 0.08)' : 'rgba(125, 211, 252, 0.06)')
    beamG.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = beamG
    ctx.fillRect(win.x0, win.y0, ww, wh)

    // the things: the one we fly from fades, the new one grows in
    const f = easeInOut(clamp01(s.flight))
    const things: Array<{ id: SpecimenId; a: number }> =
      s.fromId !== s.id && s.flight < 1 ? [{ id: s.fromId, a: 1 - f }, { id: s.id, a: f }] : [{ id: s.id, a: 1 }]
    for (const th of things) drawSpecimen(ctx, th.id, thingX, thingY, k, 'real', idle, Math.max(ww, wh), th.a)

    // the packets, on top: a wave bigger than the thing flows on over it
    const shape = packetShape(lambdaPx)
    const css = packetCss(beam)
    const crawl = Math.min(130 * (shape.lam / 40), 300)
    const e = electronSprite(true)
    for (const p of s.packets) {
      ctx.save()
      ctx.globalAlpha *= p.fade
      drawWavePacket(ctx, p.x, p.y, shape.lam, shape.len, shape.amp, idle * crawl, css, { core: shape.core, step: shape.step })
      // an electron is a wave too: each packet carries its electron
      if (beam === 'electrons') blit(ctx, e, p.x, p.y)
      ctx.restore()
    }

    // where packets were caught: the bone photo's flashes
    for (const fl of s.flashes) {
      const a = Math.max(0, (0.5 - fl.age) / 0.5)
      if (fl.beam === 'electrons') {
        ctx.strokeStyle = `rgba(226, 232, 240, ${0.85 * a})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(fl.x, fl.y, 4 + fl.age * 30, 0, Math.PI * 2)
        ctx.stroke()
      } else {
        const g = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, 22)
        g.addColorStop(0, `rgba(253, 186, 116, ${0.5 * a})`)
        g.addColorStop(1, 'rgba(253, 186, 116, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(fl.x, fl.y, 22, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
    // the frame
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(win.x0, win.y0, ww, wh, 14)
    ctx.stroke()

    // the source, at the window's left edge: the bone photo's light bulb
    // (lying on its side, shining right), or an electron gun
    const sy = (win.y0 + win.y1) / 2
    if (s.beam === 'light') {
      drawLightBulb(ctx, 62, sy, -Math.PI / 2, 70)
      text(ctx, 'light bulb', 52, sy + 42, 'rgba(148, 163, 184, 0.85)', 11)
    } else {
      ctx.fillStyle = '#1e293b'
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(18, sy - 34, 58, 68, 8)
      ctx.fill()
      ctx.stroke()
      // the hot wire the electrons boil off
      ctx.strokeStyle = `rgba(251, 146, 60, ${0.75 + 0.25 * Math.sin(idle * 9)})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(52, sy - 14)
      ctx.lineTo(62, sy - 6)
      ctx.lineTo(52, sy + 2)
      ctx.lineTo(62, sy + 10)
      ctx.stroke()
      blit(ctx, electronSprite(true), 70, sy - 4)
      text(ctx, 'electron gun', 47, sy + 48, 'rgba(148, 163, 184, 0.85)', 11)
    }

    // what is happening, on a dark pill
    if (s.flight >= 1) {
      const seen = howSeen(s.beam, SPECIMENS[s.id].size)
      const say =
        s.id === 'atoms' && s.beam === 'electrons'
          ? 'single atoms: the smallest things any microscope shows'
          : seen === 'blur'
            ? 'one wave is bigger than it: the wave flows round it, no shadow'
            : seen === 'fuzzy'
              ? 'its outline casts a shadow, its thin tails don\'t'
              : s.beam === 'electrons'
                ? 'electron waves are tiny: a crisp shadow'
                : 'the waves are much smaller than it: a crisp shadow'
      tag(ctx, say, (win.x0 + win.x1) / 2, win.y0 + 22, AMBER, 14, clamp01(s.calm * 3 + 0.01))
    }
  }

  // ---------- one thing vs one wave, on one scale ----------
  // a dark strip along the window's bottom: two bars, the thing's width and
  // ONE wave, at the window's own scale
  function drawBars(ctx: CanvasRenderingContext2D, k: number, wave: number, beam: MicroscopeBeam) {
    const s = st.current
    const sp = SPECIMENS[s.id]
    const x0 = win.x0 + 46
    const room = ww - 46 - 34
    ctx.fillStyle = 'rgba(2, 6, 23, 0.78)'
    ctx.beginPath()
    ctx.roundRect(win.x0 + 1, win.y1 - BARS_H, ww - 2, BARS_H - 1, [0, 0, 13, 13])
    ctx.fill()
    const ends = (y: number, L: number, col: string, clipped: boolean) => {
      ctx.fillStyle = col
      ctx.fillRect(x0, y - 9, 2.5, 18)
      if (!clipped) ctx.fillRect(x0 + L - 2.5, y - 9, 2.5, 18)
      else {
        // longer than all of this: it runs on, out of the window
        ctx.beginPath()
        ctx.moveTo(x0 + L, y - 11)
        ctx.lineTo(x0 + L + 14, y)
        ctx.lineTo(x0 + L, y + 11)
        ctx.closePath()
        ctx.fill()
      }
    }
    // the thing's width
    const yT = win.y1 - BARS_H + 22
    const thingL = Math.max(3, Math.min(room, sp.size * k))
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
    ctx.beginPath()
    ctx.roundRect(x0, yT - 4, thingL, 8, 4)
    ctx.fill()
    ends(yT, thingL, 'rgba(226, 232, 240, 0.85)', sp.size * k > room)
    emoji(ctx, sp.emoji, x0 - 22, yT, 17)
    text(ctx, `the ${sp.name}`, x0 + thingL + 10, yT + 1, 'rgba(203, 213, 225, 0.9)', 11, '', 'left')
    // ONE wave: one wiggle of the packets' wave, in the packets' color
    const yW = win.y1 - 22
    // the same wiggle the packets show (squeezed where too fine to draw)
    const wavePx = drawnWiggle(wave * k)
    const clipped = wavePx > room
    const L = Math.max(3, Math.min(room, wavePx))
    const col = beamSolid(beam)
    ctx.strokeStyle = col
    ctx.lineWidth = Math.min(3, Math.max(1.2, wavePx * 0.3))
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = 0; i <= 60; i++) {
      const x = x0 + (L * i) / 60
      const y = yW - Math.min(7, Math.max(2, wavePx * 0.3)) * Math.sin(((x - x0) / Math.max(wavePx, 1)) * Math.PI * 2)
      if (i) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
    }
    ctx.stroke()
    ends(yW, L, col, clipped)
    emoji(ctx, beam === 'light' ? '💡' : '⚡', x0 - 22, yW, 15)
    if (clipped) text(ctx, 'one wave: longer than this whole window', x0 + L - 10, yW - 13, 'rgba(203, 213, 225, 0.9)', 11, '', 'right')
    else text(ctx, 'one wave', x0 + L + 10, yW + 1, 'rgba(203, 213, 225, 0.9)', 11, '', 'left')
  }

  // ---------- we are here: the microscope, its slide, its picture ----------
  function drawScope(ctx: CanvasRenderingContext2D, idle: number) {
    const s = st.current
    const h = scope.y1 - scope.y0
    const cx = scope.x
    const y0 = scope.y0
    let slide: { x: number; y: number }
    let out: { x: number; y: number }
    ctx.save()
    ctx.lineJoin = 'round'
    if (s.beam === 'light') {
      // a classic microscope from the side: base, arm, stage, tube, eyepiece
      const u = h / 300
      const base = { y: y0 + 280 * u }
      ctx.fillStyle = '#475569'
      ctx.beginPath()
      ctx.roundRect(cx - 70 * u, base.y - 18 * u, 140 * u, 20 * u, 8 * u)
      ctx.fill()
      // the lamp in the base, shining up
      ctx.fillStyle = '#fef08a'
      ctx.beginPath()
      ctx.arc(cx - 10 * u, base.y - 26 * u, 9 * u, 0, Math.PI * 2)
      ctx.fill()
      // the arm
      ctx.strokeStyle = '#64748b'
      ctx.lineWidth = 18 * u
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(cx - 45 * u, base.y - 18 * u)
      ctx.quadraticCurveTo(cx - 75 * u, y0 + 130 * u, cx - 40 * u, y0 + 70 * u)
      ctx.stroke()
      // the stage, with the glass slide on it
      ctx.fillStyle = '#334155'
      ctx.fillRect(cx - 60 * u, y0 + 170 * u, 110 * u, 10 * u)
      ctx.fillStyle = 'rgba(186, 230, 253, 0.8)'
      ctx.fillRect(cx - 44 * u, y0 + 165 * u, 68 * u, 5 * u)
      slide = { x: cx - 10 * u, y: y0 + 167 * u }
      // the lens just above the slide, the tube up to the eyepiece
      ctx.save()
      ctx.translate(cx - 10 * u, y0 + 120 * u)
      ctx.rotate(0.35)
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(-12 * u, -90 * u, 24 * u, 120 * u)
      ctx.fillStyle = '#cbd5e1'
      ctx.fillRect(-9 * u, 30 * u, 18 * u, 18 * u)
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(-15 * u, -104 * u, 30 * u, 16 * u)
      ctx.restore()
      out = { x: cx - 10 * u + Math.sin(0.35) * 96 * u, y: y0 + 120 * u - Math.cos(0.35) * 96 * u }
      text(ctx, 'light microscope', cx, base.y + 14 * u, 'rgba(148, 163, 184, 0.85)', 11)
    } else {
      // an electron microscope: a tall column — gun on top, magnet lenses,
      // the sample inside — and a screen (eyes can't see electrons)
      const u = h / 300
      const colW = 56 * u
      ctx.fillStyle = '#334155'
      ctx.beginPath()
      ctx.roundRect(cx - colW / 2, y0 + 10 * u, colW, 250 * u, 10 * u)
      ctx.fill()
      for (const yy of [70, 120, 200, 230]) {
        ctx.fillStyle = '#475569'
        ctx.fillRect(cx - colW / 2 - 8 * u, y0 + yy * u, colW + 16 * u, 16 * u)
      }
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.roundRect(cx - colW / 2 - 6 * u, y0, colW + 12 * u, 30 * u, 8 * u)
      ctx.fill()
      // the beam running down inside (a window cut in the column)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)'
      ctx.fillRect(cx - 8 * u, y0 + 34 * u, 16 * u, 200 * u)
      for (let i = 0; i < 5; i++) {
        const q = frac(idle * 0.8 + i / 5)
        blit(ctx, electronSprite(false), cx, y0 + 36 * u + q * 196 * u)
      }
      ctx.fillStyle = 'rgba(186, 230, 253, 0.8)'
      ctx.fillRect(cx - 14 * u, y0 + 160 * u, 28 * u, 4 * u)
      slide = { x: cx, y: y0 + 162 * u }
      // the desk
      ctx.fillStyle = '#475569'
      ctx.fillRect(cx - 80 * u, y0 + 262 * u, 160 * u, 14 * u)
      out = { x: cx + colW / 2, y: y0 + 240 * u }
      text(ctx, 'electron microscope', cx, y0 + 292 * u, 'rgba(148, 163, 184, 0.85)', 11)
    }
    ctx.restore()

    // 🔍 we are here: an amber box on the slide, joined to the window
    const b = 13
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 2.5
    ctx.strokeRect(slide.x - b, slide.y - b, 2 * b, 2 * b)
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 1.5
    // one line up to the window (away from the tube and the eyepiece's
    // arrow, so nothing crosses)
    ctx.beginPath()
    ctx.moveTo(slide.x - b, slide.y - b)
    ctx.lineTo(win.x0 + 4, win.y1)
    ctx.stroke()
    ctx.setLineDash([])
    // (light: right of the slide, clear of the arm; electrons: left of the column)
    if (s.beam === 'light') text(ctx, '🔍 we are here', slide.x + b + 6, slide.y + b + 18, AMBER_SOFT, 11, '600', 'left')
    else text(ctx, '🔍 we are here', slide.x - 48, slide.y, AMBER_SOFT, 11, '600', 'right')

    // the picture leaves the microscope: through the eyepiece, or by cable
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    const end = { x: pic.x - picR - 14, y: pic.y }
    ctx.moveTo(out.x + 10, out.y)
    ctx.quadraticCurveTo((out.x + end.x) / 2, Math.min(out.y, end.y) - 30, end.x, end.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)'
    ctx.beginPath()
    ctx.moveTo(end.x + 10, end.y)
    ctx.lineTo(end.x - 2, end.y - 7)
    ctx.lineTo(end.x - 2, end.y + 7)
    ctx.closePath()
    ctx.fill()
  }

  // ---------- what you see ----------
  function drawPicture(ctx: CanvasRenderingContext2D) {
    const s = st.current
    const S = Math.round(picR * 2)
    const now = picture(s.id, s.beam, S)
    const before = s.picFade < 1 ? picture(s.picFrom.id, s.picFrom.beam, S) : null
    ctx.save()
    if (s.beam === 'light') {
      // the eyepiece: a round view in a black ring
      ctx.fillStyle = '#020617'
      ctx.beginPath()
      ctx.arc(pic.x, pic.y, picR + 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(pic.x, pic.y, picR, 0, Math.PI * 2)
      ctx.clip()
    } else {
      // a screen on a stand
      ctx.fillStyle = '#334155'
      ctx.fillRect(pic.x - 10, pic.y + picR + 10, 20, 14)
      ctx.fillRect(pic.x - 40, pic.y + picR + 22, 80, 6)
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.roundRect(pic.x - picR - 12, pic.y - picR - 12, 2 * picR + 24, 2 * picR + 24, 14)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(pic.x - picR, pic.y - picR, 2 * picR, 2 * picR, 6)
      ctx.clip()
    }
    if (before) ctx.drawImage(before, pic.x - picR, pic.y - picR, S, S)
    ctx.globalAlpha = before ? easeInOut(s.picFade) : 1
    ctx.drawImage(now, pic.x - picR, pic.y - picR, S, S)
    ctx.globalAlpha = 1
    // the eyepiece's soft dark rim
    if (s.beam === 'light') {
      const g = ctx.createRadialGradient(pic.x, pic.y, picR * 0.75, pic.x, pic.y, picR)
      g.addColorStop(0, 'rgba(2, 6, 23, 0)')
      g.addColorStop(1, 'rgba(2, 6, 23, 0.55)')
      ctx.fillStyle = g
      ctx.fillRect(pic.x - picR, pic.y - picR, 2 * picR, 2 * picR)
    }
    ctx.restore()
    // nothing to recognize: a big question mark
    const blur = s.picFade >= 1 && howSeen(s.beam, SPECIMENS[s.id].size) === 'blur'
    if (blur) {
      ctx.globalAlpha = clamp01(s.calm * 2)
      emoji(ctx, '❓', pic.x, pic.y, Math.round(picR * 0.6))
      ctx.globalAlpha = 1
    }
    if (s.beam === 'light') emoji(ctx, '👁️', pic.x + picR + 4, pic.y - picR - 4, 24)
    if (s.beam === 'light') text(ctx, 'what you see', pic.x, pic.y + picR + 26, 'rgba(148, 163, 184, 0.85)', 11)
  }

  // ---------- the pointer: tap a thing on the ladder ----------
  const thingAt = (q: { x: number; y: number }): SpecimenId | null => {
    if (Math.abs(q.y - iconY) > 22) return null
    let best: SpecimenId | null = null
    let d = 24
    for (const id of SPECIMEN_ORDER) {
      const dx = Math.abs(rx(SPECIMENS[id].size) - q.x)
      if (dx < d) {
        d = dx
        best = id
      }
    }
    return best
  }
  return (
    <canvas
      ref={ref}
      style={{ width: W, height: H, touchAction: 'none' }}
      onPointerDown={(e) => {
        const id = thingAt(canvasPoint(e, W, H))
        if (id) onPick(id)
      }}
      onPointerMove={(e) => {
        const id = thingAt(canvasPoint(e, W, H))
        if (id !== st.current.hover) {
          st.current.hover = id
          e.currentTarget.style.cursor = id ? 'pointer' : ''
        }
      }}
      onPointerLeave={(e) => {
        st.current.hover = null
        e.currentTarget.style.cursor = ''
      }}
    />
  )
}

function emoji(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number) {
  ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(s, x, y)
}
