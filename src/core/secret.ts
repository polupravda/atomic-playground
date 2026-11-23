// R09 🔐 Keeping messages secret — the real steps the story shows
// (proposal: docs/how-things-work/18-proposal-digital-information.md,
// story 6). Pure functions, no drawing.

import { asciiChar, asciiCode, toBits } from './digital'

/** flip the bits where the key has a one ("exclusive or"); the same key
 *  flips them back */
export function mixBits(bits: string, key: string): string {
  if (bits.length !== key.length) throw new RangeError('the key must be as long as the bits')
  return [...bits].map((b, i) => (key[i] === '1' ? (b === '1' ? '0' : '1') : b)).join('')
}

/** the story's message, and one key byte per letter (a key as long as the
 *  message, used once: it cannot be broken at all) */
export const SECRET_MESSAGE = 'HI'
export const SECRET_KEY = ['00011010', '00001110'] as const

/** the message's bits, the jumble that flies, and what the jumble reads as */
export const MESSAGE_BITS = [...SECRET_MESSAGE].map((c) => toBits(asciiCode(c)))
export const JUMBLE_BITS = MESSAGE_BITS.map((b, i) => mixBits(b, SECRET_KEY[i]))
export const JUMBLE_TEXT = JUMBLE_BITS.map((b) => asciiChar(parseInt(b, 2))).join('')

/** the funny example: a real message, the jumble it becomes, and the key
 *  that does it (with the right key ANY jumble of the same length is
 *  possible — this one was picked so that it can be read aloud; real
 *  encrypted messages look like random symbols) */
export const FUNNY_MESSAGE = 'I MISS YOU'
export const FUNNY_JUMBLE = 'BLOB ZONKY'
export const FUNNY_KEY = [...FUNNY_MESSAGE].map((c, i) => toBits(asciiCode(c) ^ asciiCode(FUNNY_JUMBLE[i])))
export const funnyMixed = () =>
  [...FUNNY_MESSAGE].map((c, i) => asciiChar(parseInt(mixBits(toBits(asciiCode(c)), FUNNY_KEY[i]), 2))).join('')

/** a real key's length, bits (AES-128), and how many different keys that
 *  makes: 2¹²⁸ */
export const REAL_KEY_BITS = 128
export const realKeyCount = () => 2n ** BigInt(REAL_KEY_BITS)

/** the paint trick (a picture of the Diffie–Hellman key exchange, 1976):
 *  the public paint, each side's secret, the mixes that are sent, the
 *  shared result */
export const PAINT = {
  shared: { name: 'yellow', css: '#facc15' },
  boySecret: { name: 'red', css: '#dc2626' },
  granSecret: { name: 'blue', css: '#2563eb' },
  boyMix: { name: 'orange', css: '#f97316' }, // yellow + red
  granMix: { name: 'green', css: '#16a34a' }, // yellow + blue
  both: { name: 'brown', css: '#7c4a1e' }, // yellow + red + blue
} as const
