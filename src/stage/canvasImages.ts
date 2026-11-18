// Pictures drawn on a canvas (public/examples/: the bomb leaders'
// portraits, the country flags). Loaded once on first use; until a file has
// arrived the caller draws a placeholder (the stages redraw every frame).

const cache = new Map<string, HTMLImageElement>()

/** the image, or null while it is still loading */
export function exampleImage(file: string): HTMLImageElement | null {
  let im = cache.get(file)
  if (!im) {
    im = new Image()
    im.src = `${import.meta.env.BASE_URL}examples/${file}`
    cache.set(file, im)
  }
  return im.complete && im.naturalWidth > 0 ? im : null
}

/** a flag `h` px tall with its left edge at x, centred on y (thin frame,
 *  so white stripes read against the dark canvas); returns its width */
export function drawFlag(ctx: CanvasRenderingContext2D, file: string, x: number, y: number, h: number): number {
  const im = exampleImage(file)
  const w = im ? (h * im.naturalWidth) / im.naturalHeight : h * 1.9
  if (!im) return w
  ctx.save()
  ctx.drawImage(im, x, y - h / 2, w, h)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y - h / 2 + 0.5, w - 1, h - 1)
  ctx.restore()
  return w
}
