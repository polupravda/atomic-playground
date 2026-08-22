// P01: standard 18-column periodic-table layout. Rows 1–7 are the main
// table; lanthanides (57–71) and actinides (89–103) sit in rows 9 and 10,
// marked by placeholder cells in the main table.

export interface TablePosition {
  row: number
  col: number
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
