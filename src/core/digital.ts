// R09 📶 Digital information — the real codes and numbers the 🔢 What
// "digital" means story shows (proposal: docs/how-things-work/18-proposal-
// digital-information.md). Pure functions, no drawing: the story's lamps,
// hands and tables read their values from here, so what the canvas shows
// is the real arithmetic, not an illustration of it.

/** a byte's lamp worths, left to right (the place values of binary) */
export const WORTHS8 = [128, 64, 32, 16, 8, 4, 2, 1] as const

/** one hand counting in bits, little finger → thumb (left to right on
 *  the back of a left hand): each finger is worth double the next */
export const FINGER_WORTHS = [16, 8, 4, 2, 1] as const

/** `n` as a row of bits, most significant first ('1' = lamp on) */
export function toBits(n: number, width = 8): string {
  if (!Number.isInteger(n) || n < 0 || n >= 2 ** width) throw new RangeError(`${n} does not fit ${width} bits`)
  return n.toString(2).padStart(width, '0')
}

/** a row of bits back to its number: add up the worths of the lit lamps */
export function fromBits(bits: string): number {
  let n = 0
  for (const b of bits) n = n * 2 + (b === '1' ? 1 : 0)
  return n
}

/** the worths of the lit lamps in a row (what the decode beat adds up) */
export function litWorths(bits: string): number[] {
  return [...bits].flatMap((b, i) => (b === '1' ? [2 ** (bits.length - 1 - i)] : []))
}

/** fingers up (little → thumb) → the number the hand shows */
export const handValue = (up: readonly boolean[]) => up.reduce((n, u, i) => n + (u ? FINGER_WORTHS[i] : 0), 0)

/** the code table: ASCII (1963), the first 128 characters of today's
 *  Unicode — H = 72, I = 73 */
export const asciiCode = (ch: string) => {
  const c = ch.codePointAt(0)!
  if (c > 127) throw new RangeError(`${ch} is not ASCII`)
  return c
}
export const asciiChar = (code: number) => String.fromCodePoint(code)

/** the story's message and its code numbers */
export const MESSAGE = 'HI'

/** the drawing's sun yellow (Tailwind yellow-400, #facc15): the hero
 *  pixel's three numbers — lots of red, lots of green, almost no blue */
export const SUN_RGB = [250, 204, 21] as const

/** how often a phone measures sound, per second (music CDs: 44,100) */
export const SAMPLE_RATE = 48000
/** bits per sound measurement (−32,768 … 32,767) */
export const SAMPLE_BITS = 16
/** the highest pitch we hear, wiggles per second: to catch a wiggle it must
 *  be measured at least twice, so SAMPLE_RATE > 2 × HEARING_MAX */
export const HEARING_MAX = 20000

/** a measurement of the air push p (−1 … 1) as a signed 16-bit number */
export function sample16(p: number): number {
  const q = Math.max(-1, Math.min(1, p))
  return Math.round(q * 32767)
}

/** a signed 16-bit number as its 16 bits (two's complement, as stored) */
export const bits16 = (s: number) => toBits(s < 0 ? s + 65536 : s, 16)

/** the song's air push at time τ (seconds of the story's slowed-down
 *  song, −1 … 1): two notes and a soft overtone — a wiggle, not a sine */
export const songPush = (tau: number) =>
  0.62 * Math.sin(2 * Math.PI * 0.9 * tau) + 0.26 * Math.sin(2 * Math.PI * 2.1 * tau + 0.8) + 0.1 * Math.sin(2 * Math.PI * 4.3 * tau)
