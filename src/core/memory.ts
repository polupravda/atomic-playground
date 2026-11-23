// R09 💾 Where a photo is stored — the real numbers and rules the story
// shows (proposal: docs/how-things-work/18-proposal-digital-information.md,
// story 5). Pure functions, no drawing.

import { SUN_RGB, toBits } from './digital'

/** flash memory: a box FULL of electrons blocks the test current — it is
 *  read as 0; an EMPTY box lets it through — 1 */
export const bitOfBox = (full: boolean) => (full ? '0' : '1')
/** the boxes that keep a byte: full where the bit is 0 */
export const boxesFor = (bits: string) => [...bits].map((b) => b === '0')
/** read a row of boxes back */
export const readBoxes = (full: readonly boolean[]) => full.map(bitOfBox).join('')

/** the byte the story stores: the sun pixel's red number */
export const STORED_VALUE = SUN_RGB[0]
export const STORED_BITS = toBits(STORED_VALUE)

/** a phone's memory, bytes (128 GB), and in bits — about a trillion */
export const PHONE_BYTES = 128e9
export const PHONE_BITS = PHONE_BYTES * 8
/** today's chips stack their boxes in more than 200 floors, and most boxes
 *  keep 3 bits (by how full they are) */
export const CHIP_FLOORS = 200
export const BITS_PER_BOX = 3
/** so the boxes in a 128 GB phone: hundreds of billions */
export const phoneBoxes = () => PHONE_BITS / BITS_PER_BOX

/** the glass wall around a box, nanometres (the electrons tunnel through) */
export const GLASS_NM = 10
/** how long the locked-in electrons stay without power, years (at least) */
export const KEEPS_YEARS = 10
/** the fast working memory (RAM) leaks: it is refilled this often, ms */
export const RAM_REFRESH_MS = 64
