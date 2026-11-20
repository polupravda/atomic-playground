import { blit, makeCanvasSprite, type Sprite } from './canvasUtil'
import { drawGlossyParticle } from './particleStyle'
import { shellConfiguration } from '../core/atom'

// Small drawing kit for the story scene modules (⚡ power plant first):
// captions, the amber hero ring, and the app's particles as cached sprites
// — an atom is always drawn WITH its electrons (the bomb demo's look:
// nucleus, one ring per shell, the electrons circling on the idle clock).

export const AMBER = 'rgba(251, 191, 36, 0.95)'
export const AMBER_SOFT = 'rgba(253, 230, 138, 0.95)'
export const GREY = 'rgba(203, 213, 225, 0.95)'

export const frac = (v: number) => v - Math.floor(v)
export const rnd = (i: number, salt: number) => frac(Math.sin(i * 127.1 + salt * 311.7) * 43758.5453)
export const lerp = (a: number, b: number, q: number) => a + (b - a) * q

export function text(
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

/** a caption on a dark pill (read, never pressed: no border) */
export function tag(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, size = 13, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `${size}px ui-sans-serif, system-ui, sans-serif`
  const w = ctx.measureText(s).width + 14
  ctx.fillStyle = 'rgba(2, 6, 23, 0.75)'
  ctx.beginPath()
  ctx.roundRect(x - w / 2, y - 12, w, 24, 7)
  ctx.fill()
  text(ctx, s, x, y, color, size)
  ctx.restore()
}

/** the amber ring that marks the story's hero, pulsing on the idle clock */
export function marker(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, idle: number, alpha = 1) {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha * (0.75 + 0.25 * Math.sin(idle * 5))
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

let electronSprites: { inner: Sprite; outer: Sprite } | null = null
export function electronSprite(outer = false): Sprite {
  if (!electronSprites) {
    const make = (r: number) =>
      makeCanvasSprite(Math.ceil(r * 3.2), (c) => drawGlossyParticle(c, 'electrons', r * 1.6, r * 1.6, r))
    electronSprites = { inner: make(1.6), outer: make(2.6) }
  }
  return outer ? electronSprites.outer : electronSprites.inner
}

let neutronSpr: Sprite | null = null
export function neutronSprite(): Sprite {
  if (!neutronSpr) neutronSpr = makeCanvasSprite(18, (c) => drawGlossyParticle(c, 'neutrons', 9, 9, 5))
  return neutronSpr
}

/** a nucleus as a phyllotaxis cluster of `n` nucleons, `p` of them protons
 *  (fixed ranks: growing `p` turns neutrons red in place). Cached. */
const nucleusCache = new Map<string, Sprite>()
export function nucleusSprite(n: number, p: number, pr: number): Sprite {
  const key = `${n}:${p}:${pr}`
  let s = nucleusCache.get(key)
  if (s) return s
  const golden = Math.PI * (3 - Math.sqrt(5))
  const R = pr * 1.08 * Math.sqrt(n) + pr * 2
  const ranks = Array.from({ length: n }, (_, j) => ({ j, r: rnd(j, 61) })).sort((a, b) => a.r - b.r)
  const isP = new Set(ranks.slice(0, p).map((x) => x.j))
  s = makeCanvasSprite(Math.ceil(R * 2), (c) => {
    for (let j = n - 1; j >= 0; j--) {
      const r = pr * 1.08 * Math.sqrt(j)
      const a = j * golden
      drawGlossyParticle(c, isP.has(j) ? 'protons' : 'neutrons', R + r * Math.cos(a), R + r * Math.sin(a), pr)
    }
  })
  nucleusCache.set(key, s)
  if (nucleusCache.size > 32) nucleusCache.delete(nucleusCache.keys().next().value!)
  return s
}

/** a whole atom: nucleus, a ring per shell, every electron circling */
export function shellAtom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  k: number,
  protons: number,
  nucleons: number,
  idle: number,
  alpha = 1,
  /** 0 = whole; >0 = the electron rings fade (a split atom) */
  ringFade = 0,
) {
  if (alpha <= 0) return
  const shells = shellConfiguration(protons, protons)
  const r0 = 16 * k
  const gap = 7.5 * k
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.save()
  // (clamped: a negative alpha is ignored by the canvas, not treated as 0)
  ctx.globalAlpha *= Math.max(0, 1 - ringFade)
  for (let i = 0; i < shells.length; i++) {
    ctx.strokeStyle = i === shells.length - 1 ? '#4a6b91' : '#3b5a7d'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, r0 + gap * i, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let i = 0; i < shells.length; i++) {
    const r = r0 + gap * i
    const outer = i === shells.length - 1
    const a0 = (idle * 1.1 * (i % 2 === 0 ? 1 : -0.7)) / (1 + i * 0.25) + i * 1.3
    for (let j = 0; j < shells[i]; j++) {
      const a = a0 + (j * 2 * Math.PI) / shells[i]
      blit(ctx, electronSprite(outer), x + r * Math.cos(a), y + r * Math.sin(a))
    }
  }
  ctx.restore()
  if (ringFade < 1) {
    const nuc = nucleusSprite(nucleons, protons, 0.75)
    ctx.drawImage(nuc.canvas, x - (nuc.size / 2) * k, y - (nuc.size / 2) * k, nuc.size * k, nuc.size * k)
  }
  ctx.restore()
}

export const shellAtomR = (protons: number, k: number) => (16 + 7.5 * (shellConfiguration(protons, protons).length - 1)) * k

// ---------- a mini atom: one atom as a chart mark ----------
// Charts of a chain reaction count ATOMS, so each mark is a tiny atom in
// the app's atom look (a nucleus, blue electron rings, electrons) — never a
// bare dot that could be anything (Elena, 2026-11-20). One sprite, scaled.

let miniSprite: Sprite | null = null
function miniAtomSprite(): Sprite {
  if (!miniSprite) {
    miniSprite = makeCanvasSprite(64, (c) => {
      for (const [r, n] of [
        [19, 2],
        [28, 4],
      ] as const) {
        c.strokeStyle = r === 28 ? '#5b80aa' : '#4a6b91'
        c.lineWidth = 2
        c.beginPath()
        c.arc(32, 32, r, 0, Math.PI * 2)
        c.stroke()
        for (let j = 0; j < n; j++) {
          const a = 0.6 + (j * 2 * Math.PI) / n + r * 0.1
          drawGlossyParticle(c, 'electrons', 32 + r * Math.cos(a), 32 + r * Math.sin(a), 3.2)
        }
      }
      const nuc = nucleusSprite(28, 12, 1.9)
      c.drawImage(nuc.canvas, 32 - nuc.size / 2, 32 - nuc.size / 2, nuc.size, nuc.size)
    })
  }
  return miniSprite
}

/** one atom as a chart mark, outer ring radius r — exactly the app's atom
 *  look, no extra glow (Elena, 2026-11-20: no signal other atoms lack) */
export function miniAtom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha = 1) {
  if (r <= 0 || alpha <= 0) return
  ctx.save()
  ctx.globalAlpha *= alpha
  const s = miniAtomSprite()
  const size = (r / 28) * 64 // the sprite's outer ring is 28 of its 64 px
  ctx.drawImage(s.canvas, x - size / 2, y - size / 2, size, size)
  ctx.restore()
}
