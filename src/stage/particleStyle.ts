import type { ParticleKind } from '../state/atomStore'

// The default look of every subatomic particle: a 3D-shaded sphere
// (highlight → body → shadow) with a soft glow halo in its own color,
// implemented as ONE extended radial gradient — no canvas shadows, which
// would be too slow for a gold-sized atom.

export const GLOSSY_COLORS: Record<
  ParticleKind,
  { light: string; mid: string; dark: string; glow: string }
> = {
  protons: { light: '#ffd4d0', mid: '#f87171', dark: '#dc2626', glow: '248, 113, 113' },
  neutrons: { light: '#eef2f7', mid: '#94a3b8', dark: '#64748b', glow: '148, 163, 184' },
  electrons: { light: '#cdeeff', mid: '#38bdf8', dark: '#0369a1', glow: '56, 189, 248' },
}

/** react-konva fill props for a glossy particle of body radius `radius`
 *  (the node's radius must be radius * 1.5 to include the halo). */
export function glossyFillProps(kind: ParticleKind, radius: number) {
  const c = GLOSSY_COLORS[kind]
  return {
    fillRadialGradientStartPoint: { x: -radius * 0.35, y: -radius * 0.35 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndPoint: { x: 0, y: 0 },
    fillRadialGradientEndRadius: radius * 1.5,
    fillRadialGradientColorStops: [
      0,
      c.light,
      0.3,
      c.mid,
      0.6,
      c.dark,
      0.68,
      `rgba(${c.glow}, 0.45)`,
      1,
      `rgba(${c.glow}, 0)`,
    ],
  }
}

/** Same look for raw-canvas scene functions (transitions, sparks, decay). */
export function drawGlossyParticle(
  native: CanvasRenderingContext2D,
  kind: ParticleKind,
  x: number,
  y: number,
  radius: number,
  alpha = 1,
) {
  const c = GLOSSY_COLORS[kind]
  const grad = native.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.35,
    0,
    x,
    y,
    radius * 1.5,
  )
  grad.addColorStop(0, c.light)
  grad.addColorStop(0.3, c.mid)
  grad.addColorStop(0.6, c.dark)
  grad.addColorStop(0.68, `rgba(${c.glow}, 0.45)`)
  grad.addColorStop(1, `rgba(${c.glow}, 0)`)
  native.save()
  native.globalAlpha *= Math.max(0, alpha)
  native.fillStyle = grad
  native.beginPath()
  native.arc(x, y, radius * 1.5, 0, Math.PI * 2)
  native.fill()
  native.restore()
}
