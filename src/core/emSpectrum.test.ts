import { describe, expect, it } from 'vitest'
import {
  DOORBELL_THRESHOLD_M,
  EM_BANDS,
  EM_MAX_M,
  EM_MIN_M,
  U_VIS0,
  U_VIS1,
  VIS_MAX_M,
  VIS_MIN_M,
  bandOf,
  colorName,
  ejectSpeedFactor,
  emBarPosition,
  formatWavelength,
  isVisible,
  photonPunch,
  ringsBell,
  uToWavelength,
  wavelengthToU,
} from './emSpectrum'

describe('EM bands', () => {
  it('tile the whole bar range with no gaps, shortest first', () => {
    expect(EM_BANDS[0].minM).toBe(EM_MIN_M)
    expect(EM_BANDS[EM_BANDS.length - 1].maxM).toBe(EM_MAX_M)
    for (let i = 1; i < EM_BANDS.length; i++) {
      expect(EM_BANDS[i].minM).toBe(EM_BANDS[i - 1].maxM)
    }
  })

  it('places textbook wavelengths in the right band', () => {
    expect(bandOf(1e-12).id).toBe('gamma')
    expect(bandOf(1e-10).id).toBe('xray') // 0.1 nm — dental X-ray territory
    expect(bandOf(300e-9).id).toBe('uv')
    expect(bandOf(550e-9).id).toBe('visible')
    expect(bandOf(10e-6).id).toBe('ir') // thermal infrared
    expect(bandOf(0.12).id).toBe('micro') // microwave-oven wavelength ~12 cm
    expect(bandOf(3).id).toBe('radio')
  })

  it('bar position is a monotonic log scale, visible a thin sliver', () => {
    expect(emBarPosition(EM_MIN_M)).toBe(0)
    expect(emBarPosition(EM_MAX_M)).toBe(1)
    const visWidth = emBarPosition(VIS_MAX_M) - emBarPosition(VIS_MIN_M)
    expect(visWidth).toBeGreaterThan(0)
    expect(visWidth).toBeLessThan(0.03) // the honest point of the bar
  })
})

describe('the wavelength slider mapping', () => {
  it('pins the anchor points', () => {
    expect(uToWavelength(0)).toBeCloseTo(EM_MIN_M, 20)
    expect(uToWavelength(U_VIS0)).toBeCloseTo(VIS_MIN_M, 12)
    expect(uToWavelength(U_VIS1)).toBeCloseTo(VIS_MAX_M, 12)
    expect(uToWavelength(1)).toBeCloseTo(EM_MAX_M, 8)
    // the middle of the slider is linear in nm
    expect(uToWavelength(0.5)).toBeCloseTo((VIS_MIN_M + VIS_MAX_M) / 2, 12)
  })

  it('round-trips u ↔ wavelength everywhere', () => {
    for (const u of [0, 0.05, 0.2, 0.33, 0.5, 0.8, 0.9, 1]) {
      expect(wavelengthToU(uToWavelength(u))).toBeCloseTo(u, 8)
    }
    for (const m of [1e-13, 5e-10, 380e-9, 589e-9, 750e-9, 1e-4, 50]) {
      expect(uToWavelength(wavelengthToU(m)) / m).toBeCloseTo(1, 6)
    }
  })

  it('is strictly monotonic', () => {
    let prev = 0
    for (let u = 0.01; u <= 1; u += 0.01) {
      const w = uToWavelength(u)
      expect(w).toBeGreaterThan(prev)
      prev = w
    }
  })
})

describe('readouts', () => {
  it('formats wavelengths kid-readably', () => {
    expect(formatWavelength(670e-9)).toBe('670 nm')
    expect(formatWavelength(1e-13)).toBe('0.0001 nm')
    expect(formatWavelength(5e-5)).toBe('0.05 mm')
    expect(formatWavelength(0.3)).toBe('30 cm')
    expect(formatWavelength(15)).toBe('15 m')
  })

  it('names the classic colors', () => {
    expect(colorName(410)).toBe('violet')
    expect(colorName(470)).toBe('blue')
    expect(colorName(530)).toBe('green')
    expect(colorName(589)).toBe('yellow')
    expect(colorName(610)).toBe('orange')
    expect(colorName(670)).toBe('red')
    expect(colorName(720)).toBe('deep red')
  })

  it('knows what eyes can catch', () => {
    expect(isVisible(550e-9)).toBe(true)
    expect(isVisible(300e-9)).toBe(false)
    expect(isVisible(1e-6)).toBe(false)
  })

  it('scales photon punch as 1/wavelength', () => {
    expect(photonPunch(670e-9)).toBeCloseTo(1)
    expect(photonPunch(335e-9)).toBeCloseTo(2)
    expect(photonPunch(670e-9 / 1000)).toBeCloseTo(1000)
  })
})

describe('the doorbell (photoelectric effect)', () => {
  it('rings for green and everything shorter, never for yellow or redder', () => {
    expect(ringsBell(530e-9)).toBe(true) // green
    expect(ringsBell(410e-9)).toBe(true) // violet
    expect(ringsBell(1e-10)).toBe(true) // X-ray
    expect(ringsBell(589e-9)).toBe(false) // sodium yellow
    expect(ringsBell(670e-9)).toBe(false) // deep red — at ANY brightness
    expect(ringsBell(0.12)).toBe(false) // microwaves
  })

  it('freed electrons fly faster the shorter the photon, from a slow pop', () => {
    expect(ejectSpeedFactor(670e-9)).toBe(0)
    const atThreshold = ejectSpeedFactor(DOORBELL_THRESHOLD_M)
    const violet = ejectSpeedFactor(400e-9)
    const xray = ejectSpeedFactor(1e-10)
    expect(atThreshold).toBeCloseTo(0.15)
    expect(violet).toBeGreaterThan(atThreshold)
    expect(xray).toBeGreaterThan(violet)
    expect(xray).toBeLessThanOrEqual(1)
  })
})
