// R08 🔦 Lasers (docs/how-things-work/16-proposal-laser-stories.md) — the
// numbers the laser stories draw with. A photon passing an atom whose
// electron is UP makes it fall and send out an exact twin (stimulated
// emission, Einstein 1917); two mirrors send the twins back through the
// ruby, so every trip makes more.

/** ruby's laser line: deep red, 694 nm (Maiman, 16 May 1960) */
export const RUBY_NM = 694.3
/** the flash lamp's light the chromium atoms swallow: green (ruby's big
 *  absorption band is around 550 nm — which is why ruby looks red) */
export const PUMP_NM = 550
/** the atom that glows in ruby: chromium (24 electrons: 2 · 8 · 13 · 1) */
export const CHROMIUM = { protons: 24, nucleons: 52 }

/** the marching column after `trips` passes along the rod: two twins at
 *  the start, doubling every trip (a story's cap; a real flash holds
 *  billions of billions) */
export const COLUMN_CAP = 48
export function columnSize(trips: number): number {
  return Math.min(COLUMN_CAP, Math.round(2 * 2 ** Math.max(0, trips)))
}

// ---------- ✂️ Light that cuts (story 2) ----------

/** the laser family on story 2's lineup, weakest first. `watts` = a
 *  typical output (the biggest: its peak, for a few billionths of a
 *  second); `nm` = its light's wave. Rounded, for a log-scale gauge. */
export interface LaserKind {
  id: 'scanner' | 'pointer' | 'disc' | 'eye' | 'cutter' | 'biggest'
  icon: string
  name: string
  nm: number
  watts: number
}
export const LASER_FAMILY: readonly LaserKind[] = [
  { id: 'scanner', icon: '🛒', name: 'shop scanner', nm: 650, watts: 0.5e-3 },
  { id: 'pointer', icon: '🔴', name: 'laser pointer', nm: 650, watts: 1e-3 },
  { id: 'disc', icon: '💿', name: 'disc player', nm: 780, watts: 5e-3 },
  { id: 'eye', icon: '👁️', name: 'eye-doctor laser', nm: 193, watts: 1 },
  { id: 'cutter', icon: '🏭', name: 'cutting laser', nm: 1070, watts: 4000 },
  { id: 'biggest', icon: '🏟️', name: 'the biggest laser', nm: 351, watts: 5e14 },
]

/** can our eyes see this light? (roughly 400–700 nm) */
export const isVisible = (nm: number) => nm >= 400 && nm <= 700

/** the power gauge: 0 … 1 on a log scale, each step ten times stronger
 *  (0.1 mW at the bottom, a thousand million million watts at the top) */
export const POWER_MIN_W = 1e-4
export const POWER_MAX_W = 1e15
export function powerLevel(watts: number): number {
  const q = Math.log10(watts / POWER_MIN_W) / Math.log10(POWER_MAX_W / POWER_MIN_W)
  return Math.min(1, Math.max(0, q))
}

/** iron, the atom of steel: 26 electrons (2 · 8 · 14 · 2) */
export const IRON = { protons: 26, nucleons: 56 }

// ---------- 🌕 Lasers to the Moon (story 3) ----------

/** light's speed in empty space, km per second */
export const LIGHT_KM_S = 299_792.458
/** the Moon: its average distance (the path is an oval: about ±20,000 km
 *  over a month) and how fast it drifts away (Earth's tides tug it ahead) */
export const MOON = { distanceKm: 384_400, driftCmPerYear: 3.8 }
/** the time light needs up to the Moon and back: about 2.6 s */
export const moonRoundTripS = (km: number = MOON.distanceKm) => (2 * km) / LIGHT_KM_S
/** today's ranging stations fire green flashes (frequency-doubled
 *  Nd:YAG, 532 nm); the first, in 1969, used ruby lasers (story 1's red) */
export const RANGING_NM = 532
/** of the photons in one flash, about one in a hundred million billion
 *  comes home (a rough figure) */
export const RETURN_ODDS = 1e17
/** how fast fingernails grow: about 3 mm a month */
export const FINGERNAIL_CM_PER_YEAR = 3.6
/** where the five reflectors sit on the Moon's near side (selenographic
 *  latitude / longitude in degrees, east = right as seen from Earth) */
export const REFLECTORS = [
  { id: 'apollo11', name: 'Apollo 11', lat: 0.67, lon: 23.47 },
  { id: 'apollo14', name: 'Apollo 14', lat: -3.64, lon: -17.48 },
  { id: 'apollo15', name: 'Apollo 15', lat: 26.13, lon: 3.63 },
  { id: 'lunokhod1', name: 'Lunokhod 1', lat: 38.32, lon: -35.0 },
  { id: 'lunokhod2', name: 'Lunokhod 2', lat: 25.83, lon: 30.92 },
] as const
/** a place on the near side → the Moon's disc (x right, y down, radius 1) */
export function onMoonDisc(lat: number, lon: number): { x: number; y: number } {
  const r = Math.PI / 180
  return { x: Math.cos(lat * r) * Math.sin(lon * r), y: -Math.sin(lat * r) }
}
