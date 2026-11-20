// R03 ⚡ How a power plant works — the story's numbers, kept out of the
// drawing code so they can be tested.

/** of every 100 uranium atoms, how many are the kind that splits (U-235):
 *  bomb fuel is enriched to about 90 (Little Boy: about 80), power-plant
 *  fuel to only 3–5 — far too few for a bomb-like explosion */
export const BOMB_SPLITTABLE_PER_100 = 90
export const FUEL_SPLITTABLE_PER_100 = 4

/** one fuel pellet (the size of a fingertip, ~7 g) gives about as much
 *  energy as a tonne of coal (textbook value) */
export const PELLET_COAL_TONNES = 1

/** splits in generation g of a chain where every split causes `k` new
 *  ones: the bomb doubles (k = 2), the power plant holds steady (k = 1) */
export const splitsInGeneration = (g: number, k: number) => Math.round(k ** g)

/** total splits after `gens` generations */
export const splitsAfter = (gens: number, k: number) =>
  Array.from({ length: gens }, (_, g) => splitsInGeneration(g, k)).reduce((a, b) => a + b, 0)
