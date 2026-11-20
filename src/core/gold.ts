// R04 💍 Where gold comes from — the story's numbers, kept out of the
// drawing code so they can be tested.
//
// The "stuffing" beat (rapid neutron capture, the r-process): three small
// seed atoms in the spray of a neutron-star crash swallow neutrons, and
// some of their neutrons turn into protons (β⁻ decay: an electron flies
// off). Each climbs to a real, stable heavy atom:
//   our hero   iron-56 → gold-197      (26 → 79 protons, 56 → 197 nucleons)
//   left       iron-56 → platinum-195  (26 → 78)
//   right      iron-56 → uranium-238   (26 → 92)
// Honest simplification (in the info panel): really the atoms first
// swallow neutrons in under a second, and most of the neutron → proton
// turning happens just after, as the new atoms settle.

export interface GoldSeed {
  protonsStart: number
  protonsEnd: number
  nucleonsStart: number
  nucleonsEnd: number
  /** the neutrons swallowed, evenly over story seconds [from, to] */
  capture: { from: number; to: number; count: number }
  /** the neutrons that turn into protons, evenly over [from, to] */
  decay: { from: number; to: number }
}

const seed = (pEnd: number, aEnd: number, capture: [number, number], decay: [number, number]): GoldSeed => ({
  protonsStart: 26,
  protonsEnd: pEnd,
  nucleonsStart: 56,
  nucleonsEnd: aEnd,
  capture: { from: capture[0], to: capture[1], count: aEnd - 56 },
  decay: { from: decay[0], to: decay[1] },
})

/** [0] our hero (gold) · [1] platinum · [2] uranium */
export const GOLD_SEEDS: GoldSeed[] = [
  seed(79, 197, [0.5, 9.5], [1.2, 10]),
  seed(78, 195, [0.6, 8.2], [1.3, 8.6]),
  seed(92, 238, [0.5, 8.2], [1.2, 8.6]),
]

const steps = (t: number, from: number, to: number, n: number) =>
  Math.max(0, Math.min(n, Math.floor((n * (t - from)) / (to - from) + 1e-9)))

/** a seed atom at story time t: how many protons and nucleons it has */
export function nucleusAt(s: GoldSeed, t: number) {
  return {
    protons: s.protonsStart + steps(t, s.decay.from, s.decay.to, s.protonsEnd - s.protonsStart),
    nucleons: s.nucleonsStart + steps(t, s.capture.from, s.capture.to, s.capture.count),
  }
}

/** The ⏪/⏩ year counter's anchors (story s → years ago), one per journey
 *  station. Only two are real: the Earth (4.5 billion) and the dust cloud
 *  of the young Sun (4.6 billion). How long one nugget's gold sat in rock
 *  or rode a river differs for every nugget — there the counter only
 *  spins (said in the info panel's honest notes). */
const ANCHORS: Record<'rewind' | 'forward', Array<[number, number]>> = {
  rewind: [
    [0, 0],
    [1.6, 50],
    [4.2, 2e4],
    [6.8, 3e8],
    [9.4, 4.5e9],
    [12, 4.6e9],
  ],
  forward: [
    [2.4, 4.6e9],
    [4.8, 4.5e9],
    [7.2, 3e8],
    [9.6, 2e4],
    [12, 50],
    [13.5, 0],
  ],
}

export const EARTH_AGE_YEARS = 4.5e9
export const SUN_AGE_YEARS = 4.6e9

/** years ago shown by the counter at story time t (log-spaced between
 *  anchors, so it spins faster and faster through the big numbers) */
export function goldYearsAgo(kind: 'rewind' | 'forward', t: number): number {
  const a = ANCHORS[kind]
  if (t <= a[0][0]) return a[0][1]
  for (let i = 1; i < a.length; i++) {
    const [t1, y1] = a[i]
    if (t > t1) continue
    const [t0, y0] = a[i - 1]
    const q = (t - t0) / (t1 - t0)
    if (y0 <= 0 || y1 <= 0) return y0 + (y1 - y0) * q
    return Math.exp(Math.log(y0) + (Math.log(y1) - Math.log(y0)) * q)
  }
  return a[a.length - 1][1]
}
