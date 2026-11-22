// R09 📶 How Wi-Fi works — the real numbers and the real code the story
// shows (proposal: docs/how-things-work/18-proposal-digital-information.md,
// story 2). Pure functions, no drawing.

/** the speed of light, m/s (exact: it defines the metre) */
export const LIGHT_SPEED = 299_792_458

/** Wi-Fi's older, farther-reaching band, GHz (the newer is 5 GHz) */
export const WIFI_GHZ = 2.4

/** a wave's length in cm from its frequency in GHz: c / f */
export const wavelengthCm = (ghz: number) => (LIGHT_SPEED / (ghz * 1e9)) * 100

/** a child's hand, wrist to fingertip, cm — the story's "about as long as
 *  your hand" (a 2.4 GHz wave is 12.5 cm) */
export const CHILD_HAND_CM = 13

/** what a home router usually sends (the EU limit at 2.4 GHz) and what a
 *  microwave oven uses, watts */
export const ROUTER_W = 0.1
export const OVEN_W = 1000

/** one Wi-Fi wave of the story's code: tall or small (its size), flipped
 *  or not (its timing) — two bits per wave. Real Wi-Fi uses the same two
 *  handles (amplitude and phase), only with many more steps. */
export interface WaveSymbol {
  tall: boolean
  flipped: boolean
}

/** a row of bits as pairs, '01001000' → ['01', '00', '10', '00'] */
export function pairsOf(bits: string): string[] {
  if (bits.length % 2) throw new RangeError('an odd number of bits')
  return bits.match(/../g) ?? []
}

/** two bits → one wave: the first says tall (1) or small (0), the second
 *  flipped (1) or not (0) */
export const symbolOf = (pair: string): WaveSymbol => ({ tall: pair[0] === '1', flipped: pair[1] === '1' })
export const pairOf = (s: WaveSymbol) => `${s.tall ? 1 : 0}${s.flipped ? 1 : 0}`

/** the bits as waves, two per wave, and back — what the tablet and the
 *  router do */
export const encodeWaves = (bits: string) => pairsOf(bits).map(symbolOf)
export const decodeWaves = (waves: readonly WaveSymbol[]) => waves.map(pairOf).join('')

/** the four kinds of wave, in the order the story shows them */
export const FOUR_KINDS: readonly WaveSymbol[] = [
  { tall: false, flipped: false },
  { tall: false, flipped: true },
  { tall: true, flipped: false },
  { tall: true, flipped: true },
]

/** Grandma's answer */
export const ANSWER = 'HI!'

/** the house numbers the router gives (the story's "addresses") */
export const ADDRESSES = { tablet: 1, laptop: 2, tv: 3 } as const
