// A realistic explosion drawn as vector layers (after the user's reference
// photo): white-hot core, orange fire lobes, long thin light streaks, sparks
// and dark debris flying out, and beige smoke wisps that linger. It GROWS
// into view (ease-out over ~0.35 s), burns, then fades, smoke last.
// Everything random is seeded once, so the blast looks the same every time
// and doesn't flicker frame to frame.

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (p: number) => 1 - (1 - p) * (1 - p)

/** total lifetime of the blast (s) */
export const BLAST_LIFE = 1.9

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
const rnd = seeded(20251108)
const range = (a: number, b: number) => a + (b - a) * rnd()

// the reference is wider than tall: smoke favours the horizontal
const SMOKE = Array.from({ length: 11 }, () => {
  const side = rnd() < 0.5 ? 0 : Math.PI
  return {
    a: side + range(-0.7, 0.7),
    d: range(0.3, 0.85),
    rx: range(0.3, 0.55),
    ry: range(0.1, 0.22),
    tone: range(0, 1),
  }
})
const LOBES = Array.from({ length: 16 }, () => ({
  a: range(0, Math.PI * 2),
  d: range(0.05, 0.42),
  s: range(0.22, 0.42),
  hot: range(0, 1),
}))
const RAYS = Array.from({ length: 52 }, () => ({
  a: range(0, Math.PI * 2),
  len: range(0.45, 1.35),
  w: range(0.008, 0.03),
}))
const SPARKS = Array.from({ length: 44 }, () => ({
  a: range(0, Math.PI * 2),
  v: range(0.7, 1.7),
  r: range(0.8, 2.2),
}))
const DEBRIS = Array.from({ length: 16 }, () => ({
  a: range(0, Math.PI * 2),
  v: range(0.5, 1.2),
  s: range(2, 5),
  spin: range(-9, 9),
  shape: [range(0.6, 1), range(0.6, 1), range(0.6, 1), range(0.6, 1)],
  dark: rnd() < 0.5,
}))

/** Draw the blast centred on (x, y), `R` = full radius, `t` = seconds since
 *  ignition. Nothing is drawn after BLAST_LIFE. `lite` thins every layer
 *  (for many small blasts at once, e.g. an implosion shell); `rot` turns the
 *  pattern so neighbouring blasts don't look identical. */
export function drawRealBlast(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  R: number,
  t: number,
  opts: { lite?: boolean; rot?: number } = {},
) {
  if (t < 0 || t >= BLAST_LIFE) return
  const lite = opts.lite ?? false
  const keep = (i: number, every: number) => !lite || i % every === 0
  ctx.save()
  ctx.translate(x0, y0)
  ctx.rotate(opts.rot ?? 0)
  const x = 0
  const y = 0
  const g = easeOut(clamp01(t / 0.35)) // growth
  const fire = 1 - clamp01((t - 0.45) / 0.9) // fire + light fade
  const smokeA = clamp01(t / 0.3) * (1 - clamp01((t - 0.9) / (BLAST_LIFE - 0.9)))
  const r = R * g

  ctx.save()
  // --- smoke wisps (normal blending, drift outward slowly) ---
  for (const [i, sm] of SMOKE.entries()) {
    if (!keep(i, 2)) continue
    const drift = 1 + 0.35 * t
    const cx = x + Math.cos(sm.a) * sm.d * r * drift
    const cy = y + Math.sin(sm.a) * sm.d * r * 0.7 * drift
    const rx = sm.rx * r * (0.8 + 0.3 * t)
    const ry = sm.ry * r * (0.8 + 0.3 * t)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(sm.a)
    ctx.scale(1, ry / rx)
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
    const c = sm.tone < 0.5 ? '196, 160, 128' : '168, 132, 104'
    gr.addColorStop(0, `rgba(${c}, ${0.42 * smokeA})`)
    gr.addColorStop(0.6, `rgba(${c}, ${0.22 * smokeA})`)
    gr.addColorStop(1, `rgba(${c}, 0)`)
    ctx.fillStyle = gr
    ctx.beginPath()
    ctx.arc(0, 0, rx, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // everything that GLOWS adds light on top
  ctx.globalCompositeOperation = 'lighter'

  // --- fire lobes: an irregular orange body ---
  if (fire > 0) {
    for (const [i, lb] of LOBES.entries()) {
      if (!keep(i, 2)) continue
      const cx = x + Math.cos(lb.a) * lb.d * r
      const cy = y + Math.sin(lb.a) * lb.d * r * 0.8
      const rr = lb.s * r
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr)
      const core = lb.hot > 0.5 ? '255, 196, 90' : '255, 140, 50'
      gr.addColorStop(0, `rgba(${core}, ${0.75 * fire})`)
      gr.addColorStop(0.55, `rgba(234, 88, 12, ${0.45 * fire})`)
      gr.addColorStop(1, 'rgba(185, 28, 28, 0)')
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.arc(cx, cy, rr, 0, Math.PI * 2)
      ctx.fill()
    }

    // --- light streaks: long thin tapering rays ---
    for (const [i, ray] of RAYS.entries()) {
      if (!keep(i, 3)) continue
      const len = ray.len * r * (0.9 + 0.2 * Math.sin(t * 13 + ray.a * 7))
      const w = ray.w * R
      const ca = Math.cos(ray.a)
      const sa = Math.sin(ray.a)
      const gr = ctx.createLinearGradient(x, y, x + ca * len, y + sa * len)
      gr.addColorStop(0, `rgba(255, 248, 225, ${0.75 * fire})`)
      gr.addColorStop(0.5, `rgba(255, 200, 120, ${0.35 * fire})`)
      gr.addColorStop(1, 'rgba(255, 160, 80, 0)')
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.moveTo(x - sa * w, y + ca * w)
      ctx.lineTo(x + ca * len, y + sa * len)
      ctx.lineTo(x + sa * w, y - ca * w)
      ctx.closePath()
      ctx.fill()
    }

    // --- white-hot core ---
    const cr = r * 0.48
    const core = ctx.createRadialGradient(x, y, 0, x, y, cr)
    core.addColorStop(0, `rgba(255, 255, 255, ${fire})`)
    core.addColorStop(0.35, `rgba(255, 244, 200, ${0.95 * fire})`)
    core.addColorStop(0.7, `rgba(255, 190, 90, ${0.5 * fire})`)
    core.addColorStop(1, 'rgba(255, 150, 60, 0)')
    ctx.fillStyle = core
    ctx.beginPath()
    ctx.arc(x, y, cr, 0, Math.PI * 2)
    ctx.fill()
  }

  // --- sparks: bright dots with short trails ---
  const sparkA = 1 - clamp01((t - 0.7) / 0.9)
  if (sparkA > 0) {
    ctx.lineCap = 'round'
    for (const [i, sp] of SPARKS.entries()) {
      if (!keep(i, 4)) continue
      const d = R * (0.15 + sp.v * t * 1.1)
      const ca = Math.cos(sp.a)
      const sa = Math.sin(sp.a)
      const px = x + ca * d
      const py = y + sa * d * 0.85
      ctx.strokeStyle = `rgba(255, 210, 120, ${0.8 * sparkA})`
      ctx.lineWidth = sp.r
      ctx.beginPath()
      ctx.moveTo(px - ca * R * 0.08, py - sa * R * 0.07)
      ctx.lineTo(px, py)
      ctx.stroke()
    }
  }
  ctx.globalCompositeOperation = 'source-over'

  // --- debris: small dark chunks tumbling outward ---
  const debA = 1 - clamp01((t - 1.0) / 0.8)
  if (debA > 0) {
    for (const [i, db] of DEBRIS.entries()) {
      if (!keep(i, 3)) continue
      const d = R * (0.1 + db.v * t * 1.0)
      const px = x + Math.cos(db.a) * d
      const py = y + Math.sin(db.a) * d * 0.85 + 30 * t * t // a little gravity
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(db.spin * t)
      ctx.globalAlpha = debA
      ctx.fillStyle = db.dark ? '#7c2d12' : '#c2410c'
      ctx.beginPath()
      ctx.moveTo(-db.s * db.shape[0], -db.s * 0.4)
      ctx.lineTo(db.s * 0.3, -db.s * db.shape[1])
      ctx.lineTo(db.s * db.shape[2], db.s * 0.5)
      ctx.lineTo(-db.s * 0.2, db.s * db.shape[3])
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  }
  ctx.restore()
  ctx.restore()
}

/** A small burning spark (the fuse travelling along the wire). */
export function drawFuseSpark(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const gr = ctx.createRadialGradient(x, y, 0, x, y, 12)
  gr.addColorStop(0, 'rgba(255, 255, 240, 1)')
  gr.addColorStop(0.35, 'rgba(255, 210, 120, 0.85)')
  gr.addColorStop(1, 'rgba(255, 140, 50, 0)')
  ctx.fillStyle = gr
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 220, 150, 0.9)'
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  for (let i = 0; i < 10; i++) {
    const a = i * 2.39996 + t * 3
    const len = 6 + 9 * Math.abs(Math.sin(t * 37 + i * 1.7))
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3)
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    ctx.stroke()
  }
  ctx.restore()
}
