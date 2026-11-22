// The Light lab's pictures of light, shared by every scene and story that
// shows light (playbook rule 3b: the same thing looks the same everywhere):
// the photon packet, the ordinary light bulb, ordinary light's warm white.
// No window or layout dependencies, so story scenes and tests can import it.

/** THE photon packet look, shared by every Light lab scene (the doorbell's
 *  stream, the 🩻 bone photo's rain, the 🔬 microscope's beam): a short
 *  wave `lambda` px long per wiggle, pinched by a Gaussian envelope over
 *  `len` px, `amp` px high, its wiggle crawling with `phase` (px). `css`
 *  gets the pass's alpha: 0.2 = the soft halo, 0.95 = the bright core
 *  (return transparent for 0.2 to draw the core only, as the bone photo
 *  does). A very fine wiggle (the microscope's electrons) passes a thinner
 *  `core` line and a finer sampling `step`, so it stays a wiggle. */
export function drawWavePacket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  lambda: number,
  len: number,
  amp: number,
  phase: number,
  css: (a: number) => string,
  opts: { core?: number; step?: number } = {},
) {
  const sigma = len / 2.4
  for (const [lw, alpha] of [
    [8, 0.2],
    [opts.core ?? 3, 0.95],
  ] as const) {
    ctx.strokeStyle = css(alpha)
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.beginPath()
    const step = opts.step ?? Math.max(1.5, Math.min(4, lambda / 24))
    for (let dx = -len * 0.9; dx <= len * 0.9; dx += step) {
      const env = Math.exp(-((dx / sigma) ** 2))
      const y = cy - amp * env * Math.sin((2 * Math.PI * (cx + dx - phase)) / lambda)
      if (dx === -len * 0.9) ctx.moveTo(cx + dx, y)
      else ctx.lineTo(cx + dx, y)
    }
    ctx.stroke()
  }
}

/** an everyday light bulb, its glass centred on (cx, cy): cord and base
 *  above it (turned by `angle`: −π/2 puts the base on the left, shining
 *  right), filament, and its warm pool of light (`pool` px) — the 🩻 bone
 *  photo's "ordinary light", also the 🔬 microscope's lamp */
export function drawLightBulb(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle = 0, pool = 150) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -42)
  ctx.lineTo(0, -34)
  ctx.stroke()
  ctx.fillStyle = '#64748b'
  ctx.beginPath()
  ctx.roundRect(-8, -34, 16, 14, 3)
  ctx.fill()
  const bg = ctx.createRadialGradient(-6, -6, 2, 0, 0, 24)
  bg.addColorStop(0, 'rgba(255, 251, 235, 0.95)')
  bg.addColorStop(0.6, 'rgba(253, 230, 138, 0.55)')
  bg.addColorStop(1, 'rgba(217, 180, 80, 0.35)')
  ctx.fillStyle = bg
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // the filament
  ctx.strokeStyle = '#fbbf24'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-8, 4)
  ctx.lineTo(-4, -4)
  ctx.lineTo(0, 4)
  ctx.lineTo(4, -4)
  ctx.lineTo(8, 4)
  ctx.stroke()
  // its warm pool of light
  const wg = ctx.createRadialGradient(0, 0, 0, 0, 0, pool)
  wg.addColorStop(0, 'rgba(253, 240, 200, 0.4)')
  wg.addColorStop(1, 'rgba(253, 240, 200, 0)')
  ctx.fillStyle = wg
  ctx.beginPath()
  ctx.arc(0, 0, pool, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** ordinary light: the bone photo's warm white (core only, no halo) */
export const ordinaryCss = (a: number) =>
  a < 0.5 ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 246, 214, 0.95)'

/** invisible light (X-rays, infrared, ultraviolet): the bone photo's ghost
 *  grey-white, core only — "light we draw so you can follow it" */
export const ghostCss = (a: number) => (a < 0.5 ? 'rgba(0, 0, 0, 0)' : 'rgba(232, 238, 245, 0.95)')

/**
 * THE eye (the Light lab's 👁️ eye scene; rule 3b): a friendly side-view
 * cross-section, pupil on the left, retina at the back on the right —
 * schematic inside, the things a young kid recognizes an eye by outside
 * (eyelids hugging the eyeball, lashes, a brow). `r` = the eyeball's
 * radius (the eye scene's is 74); `inside` draws between the retina and
 * the eyelids (what lands on the retina). Returns where things are.
 */
export function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, inside?: () => void) {
  const s = r / 74
  ctx.save()
  ctx.fillStyle = 'rgba(148, 163, 184, 0.07)'
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // cornea bulge at the left
  ctx.beginPath()
  ctx.arc(x - r + 4 * s, y, 22 * s, Math.PI * 0.6, Math.PI * 1.4)
  ctx.stroke()
  // the pupil: the hole the light flies into
  ctx.fillStyle = '#05070f'
  ctx.beginPath()
  ctx.ellipse(x - r + 14 * s, y, 7 * s, 20 * s, 0, 0, Math.PI * 2)
  ctx.fill()
  // the retina: the catching wall at the back
  ctx.strokeStyle = '#64748b'
  ctx.lineWidth = 5 * s
  ctx.beginPath()
  ctx.arc(x, y, r - 7 * s, -Math.PI * 0.32, Math.PI * 0.32)
  ctx.stroke()
  inside?.()
  // upper eyelid: a warm band over the top of the eyeball. It starts ABOVE
  // the pupil — a real open eye's lid never hangs in front of it (Elena,
  // 2026-11-21: it used to start at 1.04π and cover the pupil's top)
  const SKIN = '#e0a97f'
  const SKIN_DARK = '#c08552'
  ctx.strokeStyle = SKIN
  ctx.lineCap = 'round'
  ctx.lineWidth = 11 * s
  ctx.beginPath()
  ctx.arc(x, y, r + 7 * s, Math.PI * 1.13, Math.PI * 1.62)
  ctx.stroke()
  // lower eyelid, shorter — the eye reads as OPEN toward the front
  ctx.lineWidth = 8 * s
  ctx.beginPath()
  ctx.arc(x, y, r + 6 * s, Math.PI * 0.52, Math.PI * 0.72)
  ctx.stroke()
  // lashes: three curved strokes off the upper lid's front edge
  ctx.strokeStyle = SKIN_DARK
  ctx.lineWidth = 3 * s
  for (const [i, a] of [Math.PI * 1.15, Math.PI * 1.21, Math.PI * 1.27].entries()) {
    const bx = x + Math.cos(a) * (r + 12 * s)
    const by = y + Math.sin(a) * (r + 12 * s)
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.quadraticCurveTo(bx - 14 * s, by - (8 + i * 2) * s, bx + (-20 + i * 3) * s, by - (18 + i * 2) * s)
    ctx.stroke()
  }
  // a calm eyebrow
  ctx.lineWidth = 7 * s
  ctx.beginPath()
  ctx.arc(x + 6 * s, y + 8 * s, r + 32 * s, Math.PI * 1.14, Math.PI * 1.42)
  ctx.stroke()
  ctx.restore()
  return { pupilX: x - r + 14 * s, lensX: x - r + 22 * s, retinaX: x + r - 7 * s }
}

