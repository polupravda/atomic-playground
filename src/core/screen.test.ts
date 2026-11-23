import { describe, expect, it } from 'vitest'
import { LED_NM, PAPER_RGB, PHONE_LAMPS, PHONE_PIXELS, REFRESH_HZ, SUN_RGB, YELLOW_NM, lampLevel, stepEv } from './screen'

// What 📺 How a screen works shows and says must be the real thing.

describe('the screen', () => {
  it('a phone has about three million pixels, nine million lamps', () => {
    expect(PHONE_PIXELS).toBe(3_000_000)
    expect(PHONE_LAMPS).toBe(9_000_000)
    expect(REFRESH_HZ).toBe(60)
  })

  it('the sun pixel: red and green lamps bright, blue almost dark; the paper: all three', () => {
    const [r, g, b] = SUN_RGB.map(lampLevel)
    expect(r).toBeGreaterThan(0.9)
    expect(g).toBeGreaterThan(0.75)
    expect(b).toBeLessThan(0.1)
    expect(PAPER_RGB.every((v) => lampLevel(v) > 0.9)).toBe(true)
  })

  it('a bigger step down makes green, the biggest blue', () => {
    expect(stepEv(LED_NM.green)).toBeGreaterThan(stepEv(LED_NM.red))
    expect(stepEv(LED_NM.blue)).toBeGreaterThan(stepEv(LED_NM.green))
    expect(stepEv(LED_NM.red)).toBeCloseTo(1.97, 1)
  })

  it('yellow light lies between the red and the green lamps', () => {
    expect(YELLOW_NM).toBeGreaterThan(LED_NM.green)
    expect(YELLOW_NM).toBeLessThan(LED_NM.red)
  })
})
