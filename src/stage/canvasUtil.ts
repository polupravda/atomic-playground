// Small canvas helpers shared by the atomic-bomb stage (FissionStage), its
// close-up (fissionCloseup) and the explosive blasts (realBlast).

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const easeIn = (p: number) => p * p
export const easeOut = (p: number) => 1 - (1 - p) * (1 - p)
export const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p))

/** A pre-rendered image (drawn once, blitted every frame). `size` is in CSS
 *  pixels; the backing canvas is sharp on high-DPI screens. */
export interface Sprite {
  canvas: HTMLCanvasElement
  size: number
}

/** Create a `size`×`size` sprite and paint it with `paint` (CSS-pixel
 *  coordinates, origin at the top-left corner). */
export function makeCanvasSprite(size: number, paint: (ctx: CanvasRenderingContext2D) => void): Sprite {
  const dpr = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = size * dpr
  canvas.height = size * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  paint(ctx)
  return { canvas, size }
}

/** Draw a sprite centred on (x, y). `alpha` multiplies the current alpha. */
export function blit(ctx: CanvasRenderingContext2D, s: Sprite, x: number, y: number, alpha = 1) {
  if (alpha <= 0) return
  const prev = ctx.globalAlpha
  ctx.globalAlpha = prev * alpha
  ctx.drawImage(s.canvas, x - s.size / 2, y - s.size / 2, s.size, s.size)
  ctx.globalAlpha = prev
}
