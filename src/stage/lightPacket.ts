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
