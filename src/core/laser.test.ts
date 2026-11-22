import { describe, expect, it } from 'vitest'
import { COLUMN_CAP, FINGERNAIL_CM_PER_YEAR, IRON, LASER_FAMILY, MOON, PUMP_NM, RETURN_ODDS, RUBY_NM, columnSize, isVisible, moonRoundTripS, onMoonDisc, powerLevel, REFLECTORS } from './laser'
import { shellConfiguration } from './atom'

describe('the laser story numbers', () => {
  it('the lamp light is a shorter wave (more energy) than the red it makes', () => {
    expect(PUMP_NM).toBeLessThan(RUBY_NM)
  })

  it('chromium has one lone outer electron — the one that jumps', () => {
    expect(shellConfiguration(24, 24)).toEqual([2, 8, 13, 1])
  })

  it('the column starts as a pair and doubles every trip, up to its cap', () => {
    expect(columnSize(0)).toBe(2)
    expect(columnSize(1)).toBe(4)
    expect(columnSize(2)).toBe(8)
    expect(columnSize(10)).toBe(COLUMN_CAP)
    for (let t = 0; t < 6; t += 0.25) expect(columnSize(t + 0.25)).toBeGreaterThanOrEqual(columnSize(t))
  })

  it('✂️ the lineup goes weakest to strongest, on a log gauge', () => {
    for (let i = 1; i < LASER_FAMILY.length; i++) {
      expect(LASER_FAMILY[i].watts).toBeGreaterThanOrEqual(LASER_FAMILY[i - 1].watts)
      expect(powerLevel(LASER_FAMILY[i].watts)).toBeGreaterThanOrEqual(powerLevel(LASER_FAMILY[i - 1].watts))
    }
    // each step of the gauge is ten times stronger
    expect(powerLevel(1) - powerLevel(0.1)).toBeCloseTo(powerLevel(10) - powerLevel(1))
    expect(powerLevel(1e20)).toBe(1)
    expect(powerLevel(1e-9)).toBe(0)
  })

  it('✂️ what the voice says is true', () => {
    const w = (id: string) => LASER_FAMILY.find((l) => l.id === id)!
    // "millions of times stronger than a pointer"
    expect(w('cutter').watts / w('pointer').watts).toBeGreaterThanOrEqual(1e6)
    // the cutter's light is infrared: our eyes cannot see it
    expect(w('cutter').nm).toBeGreaterThan(700)
    expect(isVisible(w('cutter').nm)).toBe(false)
    expect(isVisible(w('pointer').nm)).toBe(true)
    // the scanner is weaker than a pointer ("a tiny one", "a small one")
    expect(w('scanner').watts).toBeLessThan(w('pointer').watts)
  })

  it('✂️ steel is iron: 26 electrons, 2 · 8 · 14 · 2', () => {
    expect(shellConfiguration(IRON.protons, IRON.protons)).toEqual([2, 8, 14, 2])
  })
})

describe('🌕 the Moon story numbers', () => {
  it('up to the Moon and back takes "about two and a half seconds"', () => {
    expect(moonRoundTripS()).toBeGreaterThan(2.4)
    expect(moonRoundTripS()).toBeLessThan(2.7)
    expect(moonRoundTripS(MOON.distanceKm + 1)).toBeGreaterThan(moonRoundTripS())
  })

  it('the Moon drifts away about as fast as fingernails grow', () => {
    expect(Math.abs(MOON.driftCmPerYear - FINGERNAIL_CM_PER_YEAR) / MOON.driftCmPerYear).toBeLessThan(0.2)
  })

  it('"a hundred million billion" is 10^17', () => {
    expect(RETURN_ODDS).toBe(100e6 * 1e9)
  })

  it('the five reflectors sit on the near side, inside the disc', () => {
    expect(REFLECTORS).toHaveLength(5)
    for (const r of REFLECTORS) {
      const p = onMoonDisc(r.lat, r.lon)
      expect(Math.hypot(p.x, p.y)).toBeLessThan(1)
    }
    // Apollo 11 is east of the middle (right), Apollo 15 north (up)
    expect(onMoonDisc(0.67, 23.47).x).toBeGreaterThan(0)
    expect(onMoonDisc(26.13, 3.63).y).toBeLessThan(0)
  })
})
