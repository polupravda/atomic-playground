import {
  VISIBLE_MAX_NM,
  VISIBLE_MIN_NM,
  wavelengthToCss,
  type SpectralLine,
} from '../core/spectra'

// R02 — the spectrum strip: a real emission spectrum drawn as a "barcode".
// A black strip spanning the visible range (380–750 nm); each allowed drop
// is a thin colored line whose brightness ACCUMULATES photon by photon
// (same emergent philosophy as the flashbulb watch mode): counts come from
// the sim, the strip only draws them.

export interface StripRect {
  x: number
  y: number
  w: number
  h: number
}

/** x position of a wavelength inside the strip */
export function stripX(rect: StripRect, nm: number): number {
  const f = (nm - VISIBLE_MIN_NM) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)
  return rect.x + Math.min(1, Math.max(0, f)) * rect.w
}

/** photons needed for a line to reach full brightness */
export const STRIP_FULL = 6

/**
 * Draw one element's barcode strip. `counts[i]` = photons caught so far on
 * `lines[i]`; brightness = counts/STRIP_FULL (capped), scaled by the line's
 * real relative strength.
 */
export function drawSpectrumStrip(
  ctx: CanvasRenderingContext2D,
  rect: StripRect,
  lines: SpectralLine[],
  counts: number[],
  label: string,
  alpha = 1,
) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  // the strip
  ctx.fillStyle = '#05070f'
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6)
  ctx.fill()
  ctx.stroke()
  // the lines
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const bright = Math.min(1, (counts[i] ?? 0) / STRIP_FULL) * (0.35 + 0.65 * l.strength)
    if (bright <= 0) continue
    const x = stripX(rect, l.nm)
    const lw = l.strength >= 1 ? 3 : 2
    // a soft glow under the line, then the line itself
    ctx.strokeStyle = wavelengthToCss(l.nm, bright * 0.35)
    ctx.lineWidth = lw + 4
    ctx.beginPath()
    ctx.moveTo(x, rect.y + 2)
    ctx.lineTo(x, rect.y + rect.h - 2)
    ctx.stroke()
    ctx.strokeStyle = wavelengthToCss(l.nm, bright)
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(x, rect.y + 2)
    ctx.lineTo(x, rect.y + rect.h - 2)
    ctx.stroke()
  }
  // label above the strip
  ctx.fillStyle = 'rgba(203, 213, 225, 0.95)'
  ctx.font = '12px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillText(label, rect.x + 2, rect.y - 4)
  ctx.restore()
}
