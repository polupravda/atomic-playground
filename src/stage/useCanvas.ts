import { useEffect, useRef } from 'react'

/** A plain <canvas> with its own animation loop (the Crystal lab's
 *  scenes): `draw(ctx, t, dt)` runs every frame while `active`; t is the
 *  scene's own clock in seconds. Sized in CSS px, sharp on any screen. */
export function useCanvas(
  w: number,
  h: number,
  active: boolean,
  draw: (ctx: CanvasRenderingContext2D, t: number, dt: number) => void,
) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const t = useRef(0)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    const ctx = c.getContext('2d')!
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t.current += dt
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawRef.current(ctx, t.current, dt)
      if (active) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [w, h, active])
  return ref
}

/** pointer position in the canvas's own px (the drawer may scale it) */
export function canvasPoint(e: React.PointerEvent<HTMLCanvasElement>, w: number, h: number) {
  const r = e.currentTarget.getBoundingClientRect()
  return { x: ((e.clientX - r.left) * w) / r.width, y: ((e.clientY - r.top) * h) / r.height }
}

export function canvasLabel(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color = 'rgba(148, 163, 184, 0.95)',
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
