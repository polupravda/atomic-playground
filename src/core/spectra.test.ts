import { describe, expect, it } from 'vitest'
import {
  SPECTRA,
  VISIBLE_MAX_NM,
  VISIBLE_MIN_NM,
  dropHeight,
  randomLineIndex,
  wavelengthToRGB,
} from './spectra'

describe('wavelengthToRGB', () => {
  it('maps known anchors to the right color families', () => {
    // hydrogen Hα 656 nm — red
    const red = wavelengthToRGB(656.3)
    expect(red.r).toBeGreaterThan(200)
    expect(red.g).toBeLessThan(60)
    expect(red.b).toBe(0)
    // sodium 589 nm — yellow (red + green, no blue)
    const yellow = wavelengthToRGB(589.3)
    expect(yellow.r).toBeGreaterThan(200)
    expect(yellow.g).toBeGreaterThan(150)
    expect(yellow.b).toBe(0)
    // oxygen 557.7 nm — green
    const green = wavelengthToRGB(557.7)
    expect(green.g).toBeGreaterThan(200)
    expect(green.g).toBeGreaterThan(green.r)
    expect(green.b).toBe(0)
    // hydrogen Hβ 486 nm — blue-green (teal)
    const teal = wavelengthToRGB(486.1)
    expect(teal.b).toBeGreaterThan(200)
    expect(teal.g).toBeGreaterThan(150)
    expect(teal.r).toBe(0)
    // hydrogen Hγ 434 nm — violet-blue
    const violet = wavelengthToRGB(434.0)
    expect(violet.b).toBeGreaterThan(200)
    expect(violet.g).toBe(0)
  })

  it('dims toward the edges of the visible range and clamps outside it', () => {
    expect(wavelengthToRGB(380).r).toBeLessThan(wavelengthToRGB(420).r)
    expect(wavelengthToRGB(750).r).toBeLessThan(wavelengthToRGB(690).r)
    expect(wavelengthToRGB(100)).toEqual(wavelengthToRGB(VISIBLE_MIN_NM))
    expect(wavelengthToRGB(2000)).toEqual(wavelengthToRGB(VISIBLE_MAX_NM))
  })
})

describe('SPECTRA', () => {
  it('keeps every line in the visible range with a sane strength', () => {
    for (const el of Object.values(SPECTRA)) {
      expect(el.lines.length).toBeGreaterThan(0)
      for (const l of el.lines) {
        expect(l.nm).toBeGreaterThanOrEqual(VISIBLE_MIN_NM)
        expect(l.nm).toBeLessThanOrEqual(VISIBLE_MAX_NM)
        expect(l.strength).toBeGreaterThan(0)
        expect(l.strength).toBeLessThanOrEqual(1)
      }
      // exactly one strongest line anchors the barcode
      expect(el.lines.filter((l) => l.strength === 1)).toHaveLength(1)
    }
  })

  it('gives the story elements their signature lines', () => {
    expect(SPECTRA.li.lines[0].nm).toBeCloseTo(670.8) // lithium red
    expect(SPECTRA.na.lines[0].nm).toBeCloseTo(589.3) // sodium yellow
    expect(SPECTRA.h.lines.map((l) => l.nm)).toEqual([656.3, 486.1, 434.0, 410.2])
    expect(SPECTRA.o.lines[0].nm).toBeCloseTo(557.7) // aurora green
    // all of neon's visible lines sit in the orange-red
    for (const l of SPECTRA.ne.lines) expect(l.nm).toBeGreaterThan(580)
  })
})

describe('randomLineIndex', () => {
  const lines = [
    { nm: 600, strength: 1 },
    { nm: 500, strength: 0.5 },
    { nm: 400, strength: 0.5 },
  ]

  it('is weighted by strength', () => {
    // total weight 2: [0, 0.5) → 0, [0.5, 0.75) → 1, [0.75, 1) → 2
    expect(randomLineIndex(lines, 0)).toBe(0)
    expect(randomLineIndex(lines, 0.49)).toBe(0)
    expect(randomLineIndex(lines, 0.55)).toBe(1)
    expect(randomLineIndex(lines, 0.8)).toBe(2)
    expect(randomLineIndex(lines, 0.999)).toBe(2)
  })

  it('always returns a valid index for every element', () => {
    for (const el of Object.values(SPECTRA)) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
        const i = randomLineIndex(el.lines, r)
        expect(i).toBeGreaterThanOrEqual(0)
        expect(i).toBeLessThan(el.lines.length)
      }
    }
  })
})

describe('dropHeight', () => {
  it('makes bluer photons taller drops', () => {
    expect(dropHeight(400)).toBeGreaterThan(dropHeight(589.3))
    expect(dropHeight(589.3)).toBeGreaterThan(dropHeight(670.8))
    expect(dropHeight(VISIBLE_MIN_NM)).toBe(1)
  })
})
