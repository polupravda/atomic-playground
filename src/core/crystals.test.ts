import { describe, expect, it } from 'vitest'
import { CARBON_COUNT, bonds, diamondFor, diamondLattice, graphiteLattice, inDiamondZone, sheetOf } from './crystals'

describe('crystal lab rules', () => {
  it('builds graphite and diamond from the same number of atoms', () => {
    expect(graphiteLattice()).toHaveLength(CARBON_COUNT)
    expect(diamondLattice()).toHaveLength(CARBON_COUNT)
  })

  it('graphite: three neighbours at most, never between sheets', () => {
    const g = graphiteLattice()
    const n = new Array(g.length).fill(0)
    for (const [a, b] of bonds(g)) {
      expect(sheetOf(g[a])).toBe(sheetOf(g[b]))
      n[a]++
      n[b]++
    }
    expect(Math.max(...n)).toBe(3)
  })

  it('diamond: four neighbours inside the block', () => {
    const d = diamondLattice()
    const n = new Array(d.length).fill(0)
    for (const [a, b] of bonds(d)) {
      n[a]++
      n[b]++
    }
    expect(Math.max(...n)).toBe(4)
  })

  it('needs BOTH squeeze and heat to make diamond', () => {
    expect(inDiamondZone(1, 0.1)).toBe(false)
    expect(inDiamondZone(0.2, 1)).toBe(false)
    expect(inDiamondZone(0.9, 0.8)).toBe(true)
  })

  it('turns every graphite atom into one diamond atom, by short trips', () => {
    const g = graphiteLattice()
    const d = diamondLattice()
    const m = diamondFor(g, d)
    // a one-to-one match: the same 63 atoms, none added, none lost
    expect(new Set(m).size).toBe(CARBON_COUNT)
    for (const p of m) expect(d).toContain(p)
    const travel = (to: typeof d) => to.reduce((s, p, i) => s + Math.hypot(p.x - g[i].x, p.y - g[i].y, p.z - g[i].z), 0)
    expect(travel(m)).toBeLessThan(travel(d))
  })
})
