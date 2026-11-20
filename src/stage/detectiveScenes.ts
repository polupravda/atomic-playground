import { clamp01, easeInOut, easeOut } from './canvasUtil'
import { SPECTRA, wavelengthToCss, type SpectrumElementId } from '../core/spectra'

// R04 — 🔭 Star detective (proposal 06 / step 34c, moved to 🌟 Star stuff
// 2026-11-18): how we know what a star is made of — by reading the dark
// lines in its rainbow. Seven beats, each a scene on the shared night sky:
//   star       a far-away star; a telescope catches its light
//   prism      a prism spreads the light into a rainbow (spectrum) — with
//              thin DARK lines in it
//   catch      why: the star's thin outer gas swallows exactly the colors
//              its atoms would glow with (the firework's jump, run upward)
//   hydrogen   detective work: hydrogen's barcode slides under the rainbow
//              — its lines sit exactly on dark lines ✓
//   oxygen     a suspect that does NOT fit ✗ (the method, not luck)
//   helium     helium explains the remaining dark lines ✓
//   discovery  the true story: helium was found in the Sun's light during
//              the 1868 eclipse, 27 years before anyone found it on Earth
// Honest: a hot blue-white star (like Spica) really shows hydrogen AND
// helium dark lines; the 1868 line was BRIGHT (glowing gas at the Sun's
// edge) — the same fingerprint, seen the other way round.

export const DETECTIVE_ORDER = ['star', 'prism', 'catch', 'hydrogen', 'oxygen', 'helium', 'discovery'] as const
export type DetectivePhase = (typeof DETECTIVE_ORDER)[number]

/** story seconds per beat (each science line holds its beat while spoken) */
export const DETECTIVE_T: Record<DetectivePhase, number> = {
  star: 5,
  prism: 6,
  catch: 10,
  hydrogen: 5,
  oxygen: 5,
  helium: 7.5,
  discovery: 10,
}

/** the elements whose dark lines the star shows */
const IN_STAR: SpectrumElementId[] = ['h', 'he']

const NM0 = 400
const NM1 = 700

// ---------- shared ----------

const frac = (v: number) => v - Math.floor(v)
const rnd = (i: number, salt: number) => frac(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453)

function sky(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(226, 232, 240, ${0.2 + 0.5 * rnd(i, 3)})`
    const s = rnd(i, 4) > 0.88 ? 2 : 1
    ctx.fillRect(rnd(i, 1) * W, rnd(i, 2) * H, s, s)
  }
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color = 'rgba(148, 163, 184, 0.9)',
  size = 12,
  weight = '',
  align: CanvasTextAlign = 'center',
) {
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.fillText(s, x, y)
}

function pill(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, size = 14) {
  ctx.font = `600 ${size}px ui-sans-serif, system-ui, sans-serif`
  const w = ctx.measureText(s).width + 18
  ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - 14, w, 28, 8)
  ctx.fill()
  ctx.stroke()
  text(ctx, s, x, y, color, size, '600')
}

/** the star: a hot blue-white point with twinkling spikes */
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, idle: number) {
  const tw = 0.85 + 0.15 * Math.sin(idle * 3.1)
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4)
  g.addColorStop(0, `rgba(219, 234, 254, ${0.9 * tw})`)
  g.addColorStop(0.25, `rgba(147, 197, 253, ${0.35 * tw})`)
  g.addColorStop(1, 'rgba(147, 197, 253, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r * 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = `rgba(226, 238, 255, ${0.7 * tw})`
  ctx.lineWidth = 1.2
  for (const a of [0, Math.PI / 2]) {
    const L = r * (3.2 + 0.6 * Math.sin(idle * 2.3 + a))
    ctx.beginPath()
    ctx.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L)
    ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L)
    ctx.stroke()
  }
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2)
  ctx.fill()
}

// ---------- the board: star → telescope → prism → rainbow ----------

interface Board {
  star: { x: number; y: number }
  scope: { x: number; y: number }
  prism: { x: number; y: number }
  /** the rainbow strip */
  sx: number
  sy: number
  sw: number
  sh: number
}

function board(W: number, UH: number): Board {
  const sx = W * 0.4
  return {
    star: { x: W * 0.12, y: UH * 0.2 },
    scope: { x: W * 0.17, y: UH * 0.46 },
    prism: { x: W * 0.31, y: UH * 0.46 },
    sx,
    sy: UH * 0.4,
    sw: W * 0.94 - sx,
    sh: 52,
  }
}

const xOf = (b: Board, nm: number) => b.sx + ((nm - NM0) / (NM1 - NM0)) * b.sw

/** every dark line of the star, by element */
const STAR_LINES = IN_STAR.flatMap((el) => SPECTRA[el].lines.map((l) => ({ el, nm: l.nm })))

function drawTelescope(ctx: CanvasRenderingContext2D, b: Board) {
  const { x, y } = b.scope
  ctx.save()
  ctx.translate(x, y)
  // aimed AT the star it observes: the wide end (the objective) faces it
  ctx.rotate(Math.atan2(b.star.y - y, b.star.x - x))
  ctx.fillStyle = '#334155'
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(-10, -9, 64, 18, 4)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.roundRect(48, -12, 14, 24, 3)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  // the tripod
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 2
  for (const dx of [-16, 0, 16]) {
    ctx.beginPath()
    ctx.moveTo(x, y + 4)
    ctx.lineTo(x + dx, y + 52)
    ctx.stroke()
  }
  text(ctx, 'telescope', x, y + 66)
}

function drawPrism(ctx: CanvasRenderingContext2D, b: Board, glow: number) {
  const { x, y } = b.prism
  const s = 30
  ctx.save()
  ctx.fillStyle = `rgba(186, 230, 253, ${0.18 + 0.2 * glow})`
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x, y - s)
  ctx.lineTo(x + s * 0.9, y + s * 0.6)
  ctx.lineTo(x - s * 0.9, y + s * 0.6)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  text(ctx, 'prism', x, y + s + 22)
}

/** the star's rainbow, `grow` 0→1 spreading out from the prism, its dark
 *  lines at `dark` 0→1 */
function drawRainbow(ctx: CanvasRenderingContext2D, b: Board, grow: number, dark: number, fan = true) {
  if (grow <= 0) return
  // the fan of light from the prism to the strip
  if (fan) {
  ctx.save()
  const beam = ctx.createLinearGradient(b.prism.x, 0, b.sx, 0)
  beam.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
  beam.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
  ctx.fillStyle = beam
  ctx.beginPath()
  ctx.moveTo(b.prism.x + 14, b.prism.y)
  ctx.lineTo(b.sx, b.sy)
  ctx.lineTo(b.sx, b.sy + b.sh)
  ctx.closePath()
  ctx.globalAlpha = grow
  ctx.fill()
  ctx.restore()
  }
  const w = b.sw * easeOut(grow)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(b.sx, b.sy, w, b.sh, 6)
  ctx.clip()
  const g = ctx.createLinearGradient(b.sx, 0, b.sx + b.sw, 0)
  for (let f = 0; f <= 1.0001; f += 0.05) g.addColorStop(Math.min(1, f), wavelengthToCss(NM0 + f * (NM1 - NM0), 0.95))
  ctx.fillStyle = g
  ctx.fillRect(b.sx, b.sy, b.sw, b.sh)
  if (dark > 0) {
    ctx.fillStyle = `rgba(2, 6, 23, ${0.93 * dark})`
    for (const l of STAR_LINES) ctx.fillRect(xOf(b, l.nm) - 1.6, b.sy, 3.2, b.sh)
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.8)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(b.sx, b.sy, b.sw, b.sh, 6)
  ctx.stroke()
}

function drawBoard(ctx: CanvasRenderingContext2D, W: number, UH: number, beam: number, grow: number, dark: number, idle: number) {
  const b = board(W, UH)
  drawStar(ctx, b.star.x, b.star.y, 9, idle)
  // starlight: star → telescope → prism (a soft beam with a travelling glint)
  if (beam > 0) {
    ctx.save()
    ctx.strokeStyle = 'rgba(226, 238, 255, 0.55)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.lineDashOffset = -idle * 30
    ctx.beginPath()
    const p1 = b.star
    const p2 = b.scope
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p1.x + (p2.x - p1.x) * beam, p1.y + (p2.y - p1.y) * beam)
    if (beam >= 1) ctx.lineTo(b.prism.x - 20, b.prism.y)
    ctx.stroke()
    ctx.restore()
  }
  drawTelescope(ctx, b)
  drawPrism(ctx, b, grow)
  drawRainbow(ctx, b, grow, dark)
  if (grow > 0.9) text(ctx, "the star's rainbow — its spectrum", b.sx + b.sw / 2, b.sy - 30)
  return b
}

// ---------- the detective cards: an element's barcode under the rainbow ----------

/** an element's own glow-barcode (bright lines on dark, as in the
 *  firework), sliding up into place under the rainbow at `slide` 0→1;
 *  `verdict` 0→1 draws the match lines and the ✓/✗ */
function drawSuspect(
  ctx: CanvasRenderingContext2D,
  b: Board,
  el: SpectrumElementId,
  row: number,
  slide: number,
  verdict: number,
  /** the verdict pill under the card (only for the suspect being tried) */
  showPill: boolean,
) {
  if (slide <= 0) return
  const e = SPECTRA[el]
  const y0 = b.sy + b.sh + 26 + row * 64
  const y = y0 + (1 - easeOut(slide)) * 160
  ctx.save()
  ctx.globalAlpha *= clamp01(slide * 1.5)
  ctx.fillStyle = '#0b1226'
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.9)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(b.sx, y, b.sw, 34, 5)
  ctx.fill()
  ctx.stroke()
  for (const l of e.lines) {
    if (l.nm < NM0 || l.nm > NM1) continue
    const x = xOf(b, l.nm)
    ctx.fillStyle = wavelengthToCss(l.nm, 0.45 + 0.55 * Math.max(0.5, l.strength))
    ctx.fillRect(x - 1.6, y + 3, 3.2, 28)
  }
  // the suspect's name, just above its card
  text(ctx, `${e.name}'s barcode`, b.sx + 2, y - 9, '#e2e8f0', 13, '600', 'left')
  ctx.restore()
  if (verdict <= 0) return
  const fits = IN_STAR.includes(el)
  ctx.save()
  ctx.globalAlpha *= verdict
  for (const l of e.lines) {
    if (l.nm < NM0 || l.nm > NM1) continue
    const x = xOf(b, l.nm)
    // a guide from the card's line up to the rainbow
    ctx.strokeStyle = fits ? 'rgba(74, 222, 128, 0.85)' : 'rgba(248, 113, 113, 0.75)'
    ctx.lineWidth = 1.2
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, b.sy + b.sh)
    ctx.stroke()
    ctx.setLineDash([])
    text(ctx, fits ? '✓' : '✗', x, b.sy - 10, fits ? '#4ade80' : '#f87171', 13, '700')
  }
  if (showPill)
    pill(
    ctx,
    fits ? `${e.name} ✓ — it is in the star!` : `${e.name} ✗ — not in this star`,
    b.sx + b.sw / 2,
    y + 54,
    fits ? '#4ade80' : '#f87171',
  )
  ctx.restore()
}

// ---------- the catch: why lines go dark ----------

/** photons stream from the star through its thin outer gas; atoms of
 *  hydrogen and helium catch exactly their own colors (their electron
 *  jumps UP — the firework's jump, the other way round) */
function drawCatch(ctx: CanvasRenderingContext2D, W: number, UH: number, t: number, idle: number) {
  sky(ctx, W, UH + 86)
  const cx = W * 0.12
  const cy = UH * 0.42
  const R = UH * 0.3
  // the star (a big bright ball, its edge at the left)
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
  g.addColorStop(0, '#f8fafc')
  g.addColorStop(0.7, '#bfdbfe')
  g.addColorStop(1, '#60a5fa')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fill()
  // its thin outer gas: a pale shell wrapped all around the ball,
  // overlapping its edge (no hard border where the star ends)
  const shell = clamp01(t / 1.2)
  const gx0 = cx + R
  const gx1 = gx0 + W * 0.2
  ctx.save()
  ctx.globalAlpha = shell
  const outer = gx1 - cx
  const sg = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, outer)
  sg.addColorStop(0, 'rgba(148, 163, 184, 0)')
  sg.addColorStop(((R * 1.02 - R * 0.82) / (outer - R * 0.82)), 'rgba(148, 163, 184, 0.3)')
  sg.addColorStop(0.7, 'rgba(148, 163, 184, 0.08)')
  sg.addColorStop(1, 'rgba(148, 163, 184, 0)')
  ctx.fillStyle = sg
  ctx.beginPath()
  ctx.arc(cx, cy, outer, 0, Math.PI * 2)
  ctx.fill()
  text(ctx, 'thin outer gas', (gx0 + gx1) / 2, cy - R * 0.9 - 14)
  ctx.restore()
  // the atoms in the gas: hydrogen (H) and helium (He)
  const atoms = [
    { el: 'h' as const, x: gx0 + 50, y: cy - R * 0.45 },
    { el: 'he' as const, x: gx0 + 110, y: cy + R * 0.05 },
    { el: 'h' as const, x: gx0 + 70, y: cy + R * 0.5 },
    { el: 'he' as const, x: gx0 + 140, y: cy - R * 0.7 },
  ]
  // the photons: one stream per lane, colors cycling through the rainbow;
  // a photon whose color is one of an atom's lines is caught by it
  const lanes = 9
  const speed = 150
  const lastCatch = new Map<number, number>()
  for (let lane = 0; lane < lanes; lane++) {
    const y = cy - R * 0.8 + (lane / (lanes - 1)) * R * 1.6
    for (let k = 0; k < 4; k++) {
      // each photon's own clock (story time: the stream belongs to the story)
      const born = k * 1.1 + lane * 0.37
      const age = (t - born) % 4.4
      if (t < born || age < 0) continue
      const id = lane * 4 + k
      const cycle = Math.floor((t - born) / 4.4)
      // which color: mostly ordinary rainbow light, sometimes a "line" color
      const pick = rnd(id + cycle * 97, 9)
      const lineColor = pick < 0.45
      const el: SpectrumElementId = rnd(id + cycle * 97, 10) < 0.55 ? 'h' : 'he'
      const nm = lineColor ? SPECTRA[el].lines[Math.floor(rnd(id + cycle * 97, 11) * 2)].nm : NM0 + rnd(id + cycle * 97, 12) * (NM1 - NM0)
      const x = cx + R * 0.9 + age * speed
      // the atom that catches it: the nearest atom of that element
      const catcher = lineColor ? atoms.filter((a) => a.el === el).sort((a, b2) => Math.abs(a.y - y) - Math.abs(b2.y - y))[0] : null
      if (catcher && x >= catcher.x) {
        lastCatch.set(atoms.indexOf(catcher), Math.max(lastCatch.get(atoms.indexOf(catcher)) ?? -9, born + (catcher.x - cx - R * 0.9) / speed + cycle * 4.4))
        continue // swallowed
      }
      if (x > W + 10) continue
      const cy2 = catcher ? y + (catcher.y - y) * clamp01((x - (catcher.x - 80)) / 80) : y
      ctx.fillStyle = wavelengthToCss(nm, 0.95)
      ctx.beginPath()
      ctx.arc(x, cy2 + Math.sin(x * 0.12) * 2, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  // draw the atoms; a fresh catch makes the electron jump up (bigger ring)
  for (const [i, a] of atoms.entries()) {
    const since = t - (lastCatch.get(i) ?? -9)
    const jump = since >= 0 && since < 0.9 ? Math.sin((since / 0.9) * Math.PI) : 0
    const r0 = 13
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(a.x, a.y, r0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(a.x, a.y, r0 * 1.8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#f87171'
    ctx.beginPath()
    ctx.arc(a.x, a.y, a.el === 'he' ? 5 : 4, 0, Math.PI * 2)
    ctx.fill()
    const er = r0 + (r0 * 0.8) * jump
    const ea = idle * 2.4 + i
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath()
    ctx.arc(a.x + Math.cos(ea) * er, a.y + Math.sin(ea) * er, 3, 0, Math.PI * 2)
    ctx.fill()
    if (jump > 0.2) {
      ctx.strokeStyle = `rgba(251, 191, 36, ${jump})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(a.x, a.y, er + 6, 0, Math.PI * 2)
      ctx.stroke()
    }
    text(ctx, a.el === 'h' ? 'hydrogen' : 'helium', a.x, a.y + 34, '#cbd5e1', 11)
  }
  // what reaches us: the rainbow with its dark lines, forming as atoms catch
  const b = board(W, UH)
  const strip = { ...b, sy: UH * 0.84, sh: 40, sx: W * 0.3, sw: W * 0.64 }
  const dark = clamp01((t - 3) / 5)
  drawRainbow(ctx, strip, 1, dark, false)
  text(ctx, 'what reaches us: the rainbow, with the caught colors missing', strip.sx + strip.sw / 2, strip.sy - 14)
}

// ---------- the discovery: helium, found in the Sun ----------

function drawDiscovery(ctx: CanvasRenderingContext2D, W: number, UH: number, t: number, idle: number) {
  sky(ctx, W, UH + 86)
  const sx = W * 0.26
  const sy = UH * 0.3
  const R = UH * 0.15
  // the eclipse: the Moon covers the Sun; its glowing edge and a prominence
  const cover = easeInOut(clamp01(t / 1.6))
  const cg = ctx.createRadialGradient(sx, sy, R * 0.9, sx, sy, R * 2.2)
  cg.addColorStop(0, `rgba(254, 243, 199, ${0.55 * cover})`)
  cg.addColorStop(1, 'rgba(254, 243, 199, 0)')
  ctx.fillStyle = cg
  ctx.beginPath()
  ctx.arc(sx, sy, R * 2.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(sx, sy, R, 0, Math.PI * 2)
  ctx.fill()
  // a prominence: a loop of glowing gas rising from the Sun's edge — only
  // visible when the Moon hides the bright disk. Its light is where the
  // 1868 yellow line was seen.
  const prom = cover > 0.6 ? clamp01((cover - 0.6) / 0.4) : 0
  const pa = -0.8 // where on the edge it stands (up and to the right)
  if (prom > 0) {
    const flick = 1 + 0.04 * Math.sin(idle * 2.1)
    const foot = (d: number) => ({ x: sx + Math.cos(pa + d) * R, y: sy + Math.sin(pa + d) * R })
    const f0 = foot(-0.2)
    const f1 = foot(0.2)
    const top = { x: sx + Math.cos(pa) * R * 1.42 * flick, y: sy + Math.sin(pa) * R * 1.42 * flick }
    ctx.save()
    ctx.globalAlpha = prom
    ctx.lineCap = 'round'
    for (const [w, c] of [[11, 'rgba(244, 114, 182, 0.25)'], [5, 'rgba(251, 113, 133, 0.9)']] as const) {
      ctx.strokeStyle = c
      ctx.lineWidth = w
      ctx.beginPath()
      ctx.moveTo(f0.x, f0.y)
      ctx.bezierCurveTo(
        f0.x + (top.x - sx) * 0.55, f0.y + (top.y - sy) * 0.55,
        f1.x + (top.x - sx) * 0.55, f1.y + (top.y - sy) * 0.55,
        f1.x, f1.y,
      )
      ctx.stroke()
    }
    ctx.restore()
  }
  // the Moon sliding in front
  ctx.fillStyle = '#020617'
  ctx.beginPath()
  ctx.arc(sx + (1 - cover) * R * 2.4, sy, R * 1.01, 0, Math.PI * 2)
  ctx.fill()
  text(ctx, 'the Sun, during an eclipse · 1868', sx, sy + R + 34, '#cbd5e1', 13)
  if (prom > 0) {
    ctx.save()
    ctx.globalAlpha = prom
    const lx = sx + Math.cos(pa) * R * 1.55
    const ly = sy + Math.sin(pa) * R * 1.55
    text(ctx, 'glowing gas at the edge', lx + 18, ly - 4, '#fda4af', 12, '', 'left')
    ctx.restore()
  }
  // the light of the glowing edge, through a prism: BRIGHT lines — one of
  // them, a yellow line, belonged to no element known on Earth
  const lx = W * 0.5
  const lw = W * 0.44
  const ly = sy - 22
  const show = clamp01((t - 1.2) / 0.8)
  if (show > 0) {
    ctx.save()
    ctx.globalAlpha = show
    ctx.fillStyle = '#0b1226'
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.9)'
    ctx.beginPath()
    ctx.roundRect(lx, ly, lw, 44, 6)
    ctx.fill()
    ctx.stroke()
    const x = (nm: number) => lx + ((nm - NM0) / (NM1 - NM0)) * lw
    for (const nm of [656.3, 486.1, 434.0]) {
      ctx.fillStyle = wavelengthToCss(nm, 0.75)
      ctx.fillRect(x(nm) - 1.5, ly + 4, 3, 36)
    }
    const yx = x(587.6)
    const pulse = 0.75 + 0.25 * Math.sin(idle * 4)
    ctx.fillStyle = wavelengthToCss(587.6, pulse)
    ctx.fillRect(yx - 2, ly + 2, 4, 40)
    text(ctx, 'light from the glowing edge', lx + lw / 2, ly - 14)
    ctx.restore()
    if (show >= 1) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(yx, ly + 22, 26, 0, Math.PI * 2)
      ctx.stroke()
      text(ctx, 'a new yellow line — no known element!', yx, ly + 66, '#fde68a', 13, '600')
    }
  }
  // the name: helios → helium
  const name = clamp01((t - 2.6) / 0.8)
  if (name > 0) {
    ctx.save()
    ctx.globalAlpha = name
    const ny = UH * 0.58
    text(ctx, 'ἥλιος · helios = the Sun', W * 0.5, ny, '#fbbf24', 22, '700')
    text(ctx, '→  helium', W * 0.5, ny + 34, '#fef3c7', 26, '700')
    ctx.restore()
  }
  // the dates: 1868 in the Sun … 1895 on Earth — then a balloon
  const dates = clamp01((t - 5.1) / 0.8)
  if (dates > 0) {
    ctx.save()
    ctx.globalAlpha = dates
    const ty = UH * 0.8
    const x0 = W * 0.22
    const x1 = W * 0.62
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x0, ty)
    ctx.lineTo(x0 + (x1 - x0) * easeOut(dates), ty)
    ctx.stroke()
    for (const [x, year, what] of [
      [x0, '1868', 'seen in the Sun'],
      [x1, '1895', 'found on Earth'],
    ] as const) {
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(x, ty, 5, 0, Math.PI * 2)
      ctx.fill()
      text(ctx, year, x, ty - 20, '#f8fafc', 16, '700')
      text(ctx, what, x, ty + 20, '#cbd5e1', 12)
    }
    text(ctx, '27 years later', (x0 + x1) / 2, ty - 20, '#94a3b8', 12)
    ctx.restore()
  }
  // today: party balloons
  const bal = clamp01((t - 6.2) / 1)
  if (bal > 0) {
    const bx = W * 0.82
    const by = UH * 0.78 - easeOut(bal) * 40 + Math.sin(idle * 1.4) * 4
    ctx.save()
    ctx.globalAlpha = bal
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(bx, by + 30)
    ctx.quadraticCurveTo(bx - 8 + Math.sin(idle * 2) * 4, by + 60, bx, by + 90)
    ctx.stroke()
    const g = ctx.createRadialGradient(bx - 8, by - 10, 2, bx, by, 32)
    g.addColorStop(0, '#fecaca')
    g.addColorStop(1, '#ef4444')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(bx, by, 24, 30, 0, 0, Math.PI * 2)
    ctx.fill()
    text(ctx, 'He', bx, by, '#fff1f2', 15, '700')
    text(ctx, 'today: party balloons', bx, by + 106, '#cbd5e1', 12)
    ctx.restore()
  }
}

// ---------- the beats ----------

/** draw one beat of the star detective at story time `t` */
export function drawDetective(
  ctx: CanvasRenderingContext2D,
  phase: DetectivePhase,
  t: number,
  W: number,
  UH: number,
  idle: number,
) {
  if (phase === 'catch') return drawCatch(ctx, W, UH, t, idle)
  if (phase === 'discovery') return drawDiscovery(ctx, W, UH, t, idle)
  sky(ctx, W, UH + 86)
  if (phase === 'star') {
    const b = drawBoard(ctx, W, UH, easeInOut(clamp01((t - 0.8) / 1.6)), 0, 0, idle)
    if (t > 2.6) text(ctx, 'a hot blue-white star, very far away', b.star.x + 30, b.star.y + 36, '#cbd5e1', 13, '', 'left')
    return
  }
  if (phase === 'prism') {
    drawBoard(ctx, W, UH, 1, clamp01(t / 2), clamp01((t - 3) / 0.9), idle)
    if (t > 3.6) {
      const b = board(W, UH)
      text(ctx, 'dark lines: colors that never arrived', b.sx + b.sw / 2, b.sy + b.sh + 20, '#fde68a', 13, '600')
    }
    return
  }
  // the detective work: suspects slide in under the rainbow, one by one
  const b = drawBoard(ctx, W, UH, 1, 1, 1, idle)
  const card = (el: SpectrumElementId, row: number, since: number) =>
    drawSuspect(ctx, b, el, row, clamp01(since / 1.2), clamp01((since - 1.4) / 0.6), since < 50)
  if (phase === 'hydrogen') card('h', 0, t)
  else if (phase === 'oxygen') {
    card('h', 0, 99)
    card('o', 1, t)
  } else {
    card('h', 0, 99)
    // the wrong suspect steps aside for helium
    const out = clamp01(t / 0.6)
    ctx.save()
    ctx.globalAlpha = 1 - out
    card('o', 1, 99)
    ctx.restore()
    card('he', 1, t - 0.7)
    if (t > 4.6) {
      const a = clamp01((t - 4.6) / 0.8)
      ctx.save()
      ctx.globalAlpha = a
      pill(ctx, 'every dark line explained: hydrogen + helium', b.sx + b.sw / 2, UH * 0.8, '#fbbf24', 15)
      ctx.restore()
    }
  }
}
