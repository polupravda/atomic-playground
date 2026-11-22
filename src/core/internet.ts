// R09 🌊 Internet under the ocean — the real numbers and the real steps the
// story shows (proposal: docs/how-things-work/18-proposal-digital-
// information.md, story 3). Pure functions, no drawing.

import { SUN_RGB, toBits } from './digital'

/** light in glass, km per second (about two thirds of its speed in empty
 *  space: glass slows it by its refractive index, ~1.47) */
export const FIBRE_KM_S = 200_000
/** across the Atlantic, km (a sea cable from Europe to America) */
export const OCEAN_KM = 6000
/** a blink, seconds (blinks take a tenth to a third of a second) */
export const BLINK_S = 0.3
/** how long the light takes across the ocean, seconds */
export const oceanTripS = (km = OCEAN_KM) => km / FIBRE_KM_S

/** a real packet's size, bytes (an Ethernet packet's payload) */
export const PACKET_BYTES = 1500

/** the story's packets: the first bytes of the drawing, one byte each —
 *  three of the paper's white (241, 245, 249 is its blue-white) and the
 *  sun pixel's three numbers. A real photo needs thousands of packets. */
export const PACKET_BYTES_SHOWN = [241, 245, 249, ...SUN_RGB] as const
export const PACKETS = PACKET_BYTES_SHOWN.map((v, i) => ({ n: i + 1, bits: toBits(v) }))

/** the story's check number: how many lamps are on. A real packet's check
 *  number (a CRC) is cleverer, but works the same way: worked out from
 *  every bit, so one wrong bit changes it. */
export const checkNumber = (bits: string) => [...bits].filter((b) => b === '1').length

/** flip one bit (noise on the way) */
export const flipBit = (bits: string, i: number) => bits.slice(0, i) + (bits[i] === '1' ? '0' : '1') + bits.slice(i + 1)

/** the packet that breaks on the way, and the lamp that flips */
export const BROKEN = { n: 4, lamp: 7 } as const

/** the order the packets arrive in (packet 3 takes a longer road) */
export const ARRIVAL = [1, 2, 4, 5, 3, 6] as const

/** put packets back in order by their numbers */
export const inOrder = (ns: readonly number[]) => [...ns].sort((a, b) => a - b)
