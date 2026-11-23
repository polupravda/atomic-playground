// R09 📺 How a screen works — the real numbers the story shows (proposal:
// docs/how-things-work/18-proposal-digital-information.md, story 4). Pure
// functions, no drawing.

import { SUN_RGB } from './digital'

/** the drawing's paper: a blue-white — all three lamps nearly full */
export const PAPER_RGB = [241, 245, 249] as const
export { SUN_RGB }

/** a phone screen's pixels (e.g. 2556 × 1179 ≈ 3.0 million), and its
 *  tiny lamps: three per pixel */
export const PHONE_PIXELS = 3_000_000
export const PHONE_LAMPS = PHONE_PIXELS * 3

/** how often a screen paints a new picture, per second (some: 120) */
export const REFRESH_HZ = 60

/** the screen lamps' light, nm (typical red, green and blue LEDs) and the
 *  one-wave yellow (sodium's, 589 nm) the eye cannot tell from red + green */
export const LED_NM = { red: 630, green: 530, blue: 460 } as const
export const YELLOW_NM = 589

/** a photon's energy in electronvolts from its wavelength: E = hc / λ —
 *  the size of the electron's step down */
export const stepEv = (nm: number) => 1239.84 / nm

/** how strongly a lamp shines for its number (0 … 255) */
export const lampLevel = (v: number) => Math.max(0, Math.min(1, v / 255))
