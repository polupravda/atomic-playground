// R01 — the atomic bomb (nuclear fission chain reaction). Pure data and
// rules for the "Atoms in action" example; the canvas lives in
// stage/FissionStage.tsx.
//
// Curated, not a general simulation (spec philosophy): we model ONE idea —
// a neutron splits a heavy nucleus, the split releases 2–3 new neutrons,
// and whether the chain grows depends on how many neutrons hit another
// nucleus before escaping (critical mass). Every number below is a real,
// rounded textbook value; the simplifications are listed in the info panel.

export type BombDesignId = 'gun' | 'implosion' | 'tsar'

export interface BombDesign {
  id: BombDesignId
  label: string
  /** short fuel name used on the canvas legend */
  fuel: 'uranium-235' | 'plutonium-239'
  /** average neutrons freed per fission (U-235 ≈ 2.4, Pu-239 ≈ 2.9) */
  neutronsMean: number
  /** nuclei drawn in the demo (a real bomb has trillions of trillions) */
  nucleusCount: number
  /** hydrogen bomb only: deuterium + tritium pairs in the fusion stage */
  fusionPairs?: number
  /** explosive yield in kilotons of TNT (real bombs only) */
  yieldKt?: number
}

export const BOMB_DESIGNS: Record<BombDesignId, BombDesign> = {
  gun: {
    id: 'gun',
    label: '🔫 Little Boy',
    fuel: 'uranium-235',
    neutronsMean: 2.4,
    nucleusCount: 100,
    yieldKt: 15,
  },
  implosion: {
    id: 'implosion',
    label: '💣 Fat Man',
    fuel: 'plutonium-239',
    neutronsMean: 2.9,
    nucleusCount: 100,
    yieldKt: 21,
  },
  // A HYDROGEN (thermonuclear) bomb, not a plain fission bomb: a small
  // plutonium fission bomb is only the trigger; its X-rays squeeze and heat
  // hydrogen fuel until the nuclei FUSE. ~97% of Tsar Bomba's energy came
  // from fusion. (The real bomb had three stages; we show two.)
  tsar: {
    id: 'tsar',
    label: '☀️ Tsar Bomba',
    fuel: 'plutonium-239',
    neutronsMean: 2.9,
    nucleusCount: 40,
    fusionPairs: 30,
    yieldKt: 50_000,
  },
}

export const BOMB_DESIGN_ORDER: BombDesignId[] = ['gun', 'implosion', 'tsar']

/** Neutrons freed by one split: 2 or 3, averaging `mean` (2 ≤ mean ≤ 3).
 *  `rand` is a uniform [0,1) sample so the rule stays testable. */
export function neutronsFromSplit(mean: number, rand: number): 2 | 3 {
  return rand < mean - 2 ? 3 : 2
}

/** One generation of a fast-neutron chain takes ~10 billionths of a second
 *  (a "shake"). A real bomb runs ~80 generations — under a microsecond. */
export const GENERATION_TIME_S = 1e-8

/** Energy of one U-235 fission vs burning one carbon atom (C + O₂ → CO₂). */
export const FISSION_ENERGY_EV = 200e6
export const CARBON_BURN_ENERGY_EV = 4
export const FISSION_VS_BURNING = FISSION_ENERGY_EV / CARBON_BURN_ENERGY_EV
/** One deuterium + tritium fusion → helium-4 + neutron. Less per reaction
 *  than fission, but hydrogen fuel has NO critical mass — you can keep adding
 *  fuel, which is why hydrogen bombs can be thousands of times bigger. */
export const FUSION_ENERGY_EV = 17.6e6

/** How many Hiroshima (Little Boy) bombs a design equals. */
export function hiroshimas(id: BombDesignId): number {
  const y = BOMB_DESIGNS[id].yieldKt ?? 0
  return Math.round(y / (BOMB_DESIGNS.gun.yieldKt ?? 15))
}

// ---------- damage on the ground (R01 aftermath map) ----------
// Rounded textbook values for a ~15 kt AIRBURST over flat ground (Hiroshima
// was 15 kt at ~600 m). Other yields scale by the classic laws: blast
// radius ∝ yield^(1/3), heat (burn) radius ∝ yield^0.41. Real cities differ
// (Nagasaki's hills sheltered whole districts) — the info panel says so.

export type DamageZoneId = 'heavy' | 'houses' | 'burns' | 'windows'

export interface DamageZone {
  id: DamageZoneId
  /** radius from the point under the explosion, km */
  km: number
  label: string
}

const REF_YIELD_KT = 15
const REF_ZONES: Array<{ id: DamageZoneId; km: number; heat: boolean; label: string }> = [
  { id: 'heavy', km: 0.6, heat: false, label: 'even concrete buildings destroyed' },
  { id: 'houses', km: 1.7, heat: false, label: 'houses flattened' },
  { id: 'burns', km: 1.9, heat: true, label: 'bad burns on bare skin' },
  { id: 'windows', km: 4.7, heat: false, label: 'windows shattered' },
]

/** Damage radii for a design, innermost first (empty for non-bombs). */
export function damageZones(id: BombDesignId): DamageZone[] {
  const y = BOMB_DESIGNS[id].yieldKt
  if (!y) return []
  const blast = Math.cbrt(y / REF_YIELD_KT)
  const heat = Math.pow(y / REF_YIELD_KT, 0.41)
  return REF_ZONES.map((z) => ({
    id: z.id,
    km: z.km * (z.heat ? heat : blast),
    label: z.label,
  }))
}

/** Height of the mushroom cloud's top, km (approximate, as photographed). */
export const CLOUD_TOP_KM: Partial<Record<BombDesignId, number>> = {
  gun: 16,
  implosion: 18,
  tsar: 65,
}

/** "15,000 tonnes of TNT" style power text. */
export function tntText(id: BombDesignId): string {
  const kt = BOMB_DESIGNS[id].yieldKt ?? 0
  return `${(kt * 1000).toLocaleString('en-US')} tonnes of TNT`
}

/** Kid-readable tiny durations: "30 billionths of a second". */
export function formatTinySeconds(seconds: number): string {
  if (seconds <= 0) return 'no time at all'
  if (seconds < 1e-6) {
    const n = Math.round(seconds * 1e9)
    return `${n} billionth${n === 1 ? '' : 's'} of a second`
  }
  if (seconds < 1e-3) {
    const n = Math.round(seconds * 1e6)
    return `${n} millionth${n === 1 ? '' : 's'} of a second`
  }
  return `${seconds.toFixed(3)} seconds`
}

/** Real-world duration of `generations` chain-reaction generations. */
export function realChainTime(generations: number): string {
  return formatTinySeconds(generations * GENERATION_TIME_S)
}
