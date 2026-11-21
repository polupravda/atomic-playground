import { describe, expect, it } from 'vitest'
import {
  CC_BOND_M,
  SEE_LIMIT_M,
  SPECIMENS,
  SPECIMEN_ORDER,
  VIEW_PER_SIZE,
  WAVE_M,
  drawnWiggle,
  honeycomb,
  howSeen,
  microscopeResult,
  shadowStrength,
} from './microscope'

describe('the microscope ladder', () => {
  it('runs from big to small', () => {
    const sizes = SPECIMEN_ORDER.map((id) => SPECIMENS[id].size)
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThan(sizes[i - 1])
  })

  it('light sees down to bacteria, never viruses', () => {
    expect(howSeen('light', SPECIMENS.hair.size)).toBe('sharp')
    expect(howSeen('light', SPECIMENS.blood.size)).toBe('sharp')
    // a bacterium: its outline yes, its thin tails no
    expect(howSeen('light', SPECIMENS.bacterium.size)).toBe('fuzzy')
    for (const id of ['virus', 'dna', 'atoms'] as const) expect(howSeen('light', SPECIMENS[id].size)).toBe('blur')
  })

  it('electrons see everything on the ladder, atoms only just', () => {
    for (const id of ['hair', 'pollen', 'blood', 'bacterium', 'virus', 'dna'] as const)
      expect(howSeen('electrons', SPECIMENS[id].size)).toBe('sharp')
    expect(howSeen('electrons', SPECIMENS.atoms.size)).toBe('fuzzy')
    // the atoms are further apart than the smallest visible spot
    expect(CC_BOND_M).toBeGreaterThan(SEE_LIMIT_M.electrons)
  })

  it('light\'s limit is about half its wave; electron waves are far shorter', () => {
    expect(SEE_LIMIT_M.light / WAVE_M.light).toBeGreaterThan(0.3)
    expect(SEE_LIMIT_M.light / WAVE_M.light).toBeLessThan(0.5)
    expect(WAVE_M.light / WAVE_M.electrons).toBeGreaterThan(1e5)
  })

  it('a thing smaller than half a wave casts no shadow; a wide one a full one', () => {
    expect(shadowStrength(0.4, 1)).toBe(0)
    expect(shadowStrength(3, 1)).toBe(1)
    let last = -1
    for (let s = 0; s <= 4; s += 0.25) {
      const v = shadowStrength(s, 1)
      expect(v).toBeGreaterThanOrEqual(last)
      last = v
    }
  })

  it('squeezes waves too fine to draw without ever changing their order', () => {
    // the window's px per metre for each thing (zoomed out ×1.6, ~684 px wide)
    const k = (size: number) => 684 / (size * VIEW_PER_SIZE * 1.6)
    let lastE = 0
    for (const id of SPECIMEN_ORDER) {
      const s = SPECIMENS[id].size
      const light = drawnWiggle(WAVE_M.light * k(s))
      const e = drawnWiggle(WAVE_M.electrons * k(s))
      // in one window, electron waves always look finer than light's
      expect(e, id).toBeLessThan(light)
      // a smaller thing makes the same wave look bigger
      expect(e, id).toBeGreaterThan(lastE)
      lastE = e
    }
    // big enough waves are drawn at true scale
    expect(drawnWiggle(49)).toBe(49)
    for (let p = 5e-6; p < 30; p *= 1.7) expect(drawnWiggle(p * 1.7)).toBeGreaterThan(drawnWiggle(p))
  })

  it('explains the right result', () => {
    expect(microscopeResult('light', 'pollen')).toBe('')
    expect(microscopeResult('light', 'virus')).toBe('microscope-blur')
    expect(microscopeResult('electrons', 'virus')).toBe('microscope-electrons')
    expect(microscopeResult('electrons', 'atoms')).toBe('microscope-atoms')
    expect(microscopeResult('electrons', 'hair')).toBe('')
  })

  it('lays carbon atoms in a honeycomb, 0.142 nm apart', () => {
    const atoms = honeycomb(0.5e-9)
    expect(atoms.length).toBeGreaterThan(20)
    // every atom's nearest neighbour sits one bond away
    for (const p of atoms.slice(0, 10)) {
      const d = Math.min(...atoms.filter((q) => q !== p).map((q) => Math.hypot(q.x - p.x, q.y - p.y)))
      expect(d / CC_BOND_M).toBeCloseTo(1, 5)
    }
  })
})
