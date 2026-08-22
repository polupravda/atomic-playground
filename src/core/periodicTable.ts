// P01: standard 18-column periodic-table layout. Rows 1–7 are the main
// table; lanthanides (57–71) and actinides (89–103) sit in rows 9 and 10,
// marked by placeholder cells in the main table.

export interface TablePosition {
  row: number
  col: number
}

// P04: the classic element families — the visual proof that elements
// aren't random. Simplified where chemistry is genuinely fuzzy (Ts counted
// with the halogens, superheavy chemistry unknown).
export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition-metal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'

const METALLOIDS = new Set([5, 14, 32, 33, 51, 52])
const OTHER_NONMETALS = new Set([1, 6, 7, 8, 15, 16, 34])

export function elementCategory(z: number): ElementCategory {
  if (z >= 57 && z <= 71) return 'lanthanide'
  if (z >= 89 && z <= 103) return 'actinide'
  if (METALLOIDS.has(z)) return 'metalloid'
  if (OTHER_NONMETALS.has(z)) return 'nonmetal'
  const { col } = tablePosition(z)
  if (col === 18) return 'noble-gas'
  if (col === 17) return 'halogen'
  if (z !== 1 && col === 1) return 'alkali-metal'
  if (col === 2) return 'alkaline-earth'
  if (col >= 3 && col <= 12) return 'transition-metal'
  return 'post-transition-metal'
}

export function tablePosition(z: number): TablePosition {
  if (z === 1) return { row: 1, col: 1 }
  if (z === 2) return { row: 1, col: 18 }
  if (z <= 4) return { row: 2, col: z - 2 }
  if (z <= 10) return { row: 2, col: z + 8 }
  if (z <= 12) return { row: 3, col: z - 10 }
  if (z <= 18) return { row: 3, col: z }
  if (z <= 36) return { row: 4, col: z - 18 }
  if (z <= 54) return { row: 5, col: z - 36 }
  if (z <= 56) return { row: 6, col: z - 54 }
  if (z <= 71) return { row: 9, col: z - 57 + 3 } // lanthanides
  if (z <= 86) return { row: 6, col: z - 68 }
  if (z <= 88) return { row: 7, col: z - 86 }
  if (z <= 103) return { row: 10, col: z - 89 + 3 } // actinides
  return { row: 7, col: z - 100 }
}
