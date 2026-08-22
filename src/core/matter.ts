// P08/P09: states of matter. Melting/boiling points in °C at standard
// pressure (rounded; carbon's sublimation simplified into melt/boil).
// Curated for the elements kids are likely to explore; others report null
// and the matter lab explains the gap.

export interface MatterPoints {
  melt: number
  boil: number
}

export const MATTER_DATA: Record<number, MatterPoints> = {
  1: { melt: -259, boil: -253 },
  2: { melt: -272, boil: -269 },
  3: { melt: 181, boil: 1342 },
  6: { melt: 3550, boil: 4027 },
  7: { melt: -210, boil: -196 },
  8: { melt: -219, boil: -183 },
  9: { melt: -220, boil: -188 },
  10: { melt: -249, boil: -246 },
  11: { melt: 98, boil: 883 },
  12: { melt: 650, boil: 1090 },
  13: { melt: 660, boil: 2470 },
  14: { melt: 1414, boil: 3265 },
  15: { melt: 44, boil: 281 },
  16: { melt: 115, boil: 445 },
  17: { melt: -101, boil: -34 },
  18: { melt: -189, boil: -186 },
  19: { melt: 64, boil: 759 },
  20: { melt: 842, boil: 1484 },
  22: { melt: 1668, boil: 3287 },
  24: { melt: 1907, boil: 2671 },
  26: { melt: 1538, boil: 2862 },
  28: { melt: 1455, boil: 2913 },
  29: { melt: 1085, boil: 2562 },
  30: { melt: 420, boil: 907 },
  35: { melt: -7, boil: 59 },
  36: { melt: -157, boil: -153 },
  47: { melt: 962, boil: 2162 },
  50: { melt: 232, boil: 2602 },
  53: { melt: 114, boil: 184 },
  54: { melt: -112, boil: -108 },
  74: { melt: 3422, boil: 5555 },
  78: { melt: 1768, boil: 3825 },
  79: { melt: 1064, boil: 2856 },
  80: { melt: -39, boil: 357 },
  82: { melt: 327, boil: 1749 },
  92: { melt: 1135, boil: 4131 },
}

export function matterData(z: number): MatterPoints | null {
  return MATTER_DATA[z] ?? null
}

export type MatterPhase = 'solid' | 'liquid' | 'gas'

export function phaseAt(tempC: number, points: MatterPoints): MatterPhase {
  if (tempC < points.melt) return 'solid'
  if (tempC < points.boil) return 'liquid'
  return 'gas'
}

export function matterPhaseAt(z: number, tempC: number): MatterPhase | null {
  const points = matterData(z)
  return points ? phaseAt(tempC, points) : null
}
