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
