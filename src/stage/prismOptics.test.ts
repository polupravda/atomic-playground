import { describe, expect, it } from 'vitest'
import { refractiveIndex, traceDrop, tracePolygon, turnDeg, turnedPolygon } from './prismOptics'

const TRI = [
  { x: 0, y: -95 },
  { x: 78, y: 71 },
  { x: -78, y: 71 },
]
const C = { x: 400, y: 300 }

describe('prism optics', () => {
  it('uses textbook indices: diamond > glass > water, violet > red', () => {
    for (const m of ['glass', 'water', 'diamond'] as const) {
      expect(refractiveIndex(m, 410, 1)).toBeGreaterThan(refractiveIndex(m, 700, 1))
    }
    expect(refractiveIndex('glass', 589, 1)).toBeCloseTo(1.517, 2)
    expect(refractiveIndex('water', 589, 1)).toBeCloseTo(1.333, 2)
    expect(refractiveIndex('diamond', 589, 1)).toBeCloseTo(2.417, 2)
  })

  it('bends violet more than red through a glass prism', () => {
    const poly = turnedPolygon(TRI, C, 0)
    const start = { x: 100, y: C.y - 10 }
    const dir = { x: 1, y: 0 }
    const red = tracePolygon(start, dir, poly, refractiveIndex('glass', 700))
    const violet = tracePolygon(start, dir, poly, refractiveIndex('glass', 410))
    expect(red.pts.length).toBe(3) // in, out
    expect(turnDeg(dir, violet.dir)).toBeGreaterThan(turnDeg(dir, red.dir))
  })

  it('traps light inside diamond far more often than inside glass (the sparkle)', () => {
    let glass = 0
    let diamond = 0
    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      const poly = turnedPolygon(TRI, C, a)
      const start = { x: 100, y: C.y - 10 }
      glass += tracePolygon(start, { x: 1, y: 0 }, poly, refractiveIndex('glass', 589)).bounces.length
      diamond += tracePolygon(start, { x: 1, y: 0 }, poly, refractiveIndex('diamond', 589)).bounces.length
    }
    expect(diamond).toBeGreaterThan(glass * 2)
  })

  it('turns red light by about 138° in a raindrop: the rainbow at 42°', () => {
    const R = 100
    let best = 180
    for (let b = 0.5; b < 0.99; b += 0.002) {
      const path = traceDrop({ x: 0, y: C.y - b * R }, { x: 1, y: 0 }, C, R, refractiveIndex('water', 700, 1))
      if (path) best = Math.min(best, turnDeg({ x: 1, y: 0 }, path.dir))
    }
    expect(180 - best).toBeGreaterThan(41.5)
    expect(180 - best).toBeLessThan(43.5) // 700 nm: the deepest red
  })
})
