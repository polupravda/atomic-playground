import { shellCapacity, shellConfiguration } from '../core/atom'
import type { ParticleKind } from '../state/atomStore'

// The stage fills the viewport height (measured once at load); 46 px covers
// the page padding (py-5 → 40 px) and container borders. All layout derives
// from it.
export const STAGE_W = 820
export const STAGE_H = Math.max(
  640,
  (typeof window !== 'undefined' ? window.innerHeight : 640) - 46,
)
export const BUCKET_Y = STAGE_H - 68
export const CENTER = { x: STAGE_W / 2, y: (BUCKET_Y - 26) / 2 }
export const ATOM_ZONE_R = Math.min(265, CENTER.y - 35)
export const NUCLEON_R = 12
export const ELECTRON_R = 8
export const INNER_SHELL_R = 90
export const MAX_SHELL_R = ATOM_ZONE_R - 12
export const CLOUD_R = MAX_SHELL_R + 26
export const GOLDEN_ANGLE = 2.399963

export const COLORS: Record<ParticleKind, string> = {
  protons: '#f87171',
  neutrons: '#94a3b8',
  electrons: '#38bdf8',
}

export const BUCKETS: Array<{ kind: ParticleKind; label: string; x: number }> = [
  { kind: 'protons', label: 'Protons', x: 200 },
  { kind: 'neutrons', label: 'Neutrons', x: 410 },
  { kind: 'electrons', label: 'Electrons', x: 620 },
]

// Slow, readable motion (kids should clearly see where a particle goes).
export const ENTER_DURATION = 0.9
export const REARRANGE_DURATION = 0.4
export const EXIT_DURATION = 0.7

export interface Pt {
  x: number
  y: number
}

export function bucketHome(kind: ParticleKind): Pt {
  const bucket = BUCKETS.find((b) => b.kind === kind)!
  return { x: bucket.x, y: BUCKET_Y - 12 }
}

export function distToCenter(x: number, y: number): number {
  return Math.hypot(x - CENTER.x, y - CENTER.y)
}

export interface ElectronSlotMeta {
  si: number
  angle: number
}

/** Shell rings + fixed capacity slots for the atom/ion's electron
 *  configuration (see core shellConfiguration: cations lose outermost
 *  electrons first). Electrons occupy slots in order, so existing electrons
 *  keep their place when new ones are added. */
export function electronLayout(
  protonCount: number,
  electronCount: number,
): {
  shells: number[]
  shellRadii: number[]
  filled: Pt[]
  filledMeta: ElectronSlotMeta[]
  empty: Pt[]
} {
  const shells = shellConfiguration(protonCount, electronCount)
  const ringStep =
    shells.length > 1
      ? Math.min(42, (MAX_SHELL_R - INNER_SHELL_R) / (shells.length - 1))
      : 0
  const shellRadii = shells.map((_, si) => INNER_SHELL_R + si * ringStep)
  const filled: Pt[] = []
  const filledMeta: ElectronSlotMeta[] = []
  const empty: Pt[] = []
  shells.forEach((count, si) => {
    const r = shellRadii[si]
    const capacity = shellCapacity(si + 1)
    for (let slot = 0; slot < capacity; slot++) {
      const a = -Math.PI / 2 + si * 0.35 + (slot * 2 * Math.PI) / capacity
      const pos = { x: CENTER.x + r * Math.cos(a), y: CENTER.y + r * Math.sin(a) }
      if (slot < count) {
        filled.push(pos)
        filledMeta.push({ si, angle: a })
      } else {
        empty.push(pos)
      }
    }
  })
  return { shells, shellRadii, filled, filledMeta, empty }
}

/** Shell index (0-based) that a given electron slot index belongs to. */
export function shellIndexOfSlot(shells: number[], slot: number): number {
  let cumulative = 0
  for (let si = 0; si < shells.length; si++) {
    cumulative += shells[si]
    if (slot < cumulative) return si
  }
  return shells.length - 1
}

export interface Nucleon extends Pt {
  kind: ParticleKind
  kindIdx: number
}

/** Nucleons packed in a phyllotaxis spiral, protons/neutrons interleaved so
 *  the nucleus looks mixed rather than segregated. The spiral compresses for
 *  heavy nuclei so the nucleus stays inside the innermost electron shell. */
export function nucleonLayout(protons: number, neutrons: number): Nucleon[] {
  const nucleons: Nucleon[] = []
  const total = protons + neutrons
  const spread = Math.min(
    0.95,
    (INNER_SHELL_R - NUCLEON_R * 2) / (NUCLEON_R * Math.sqrt(Math.max(total, 1))),
  )
  let placedProtons = 0
  let placedNeutrons = 0
  for (let i = 0; i < total; i++) {
    const takeProton =
      placedNeutrons >= neutrons || (i % 2 === 0 && placedProtons < protons)
    if (takeProton) placedProtons++
    else placedNeutrons++
    const r = i === 0 ? 0 : NUCLEON_R * spread * Math.sqrt(i)
    const a = i * GOLDEN_ANGLE
    nucleons.push({
      kind: takeProton ? 'protons' : 'neutrons',
      kindIdx: (takeProton ? placedProtons : placedNeutrons) - 1,
      x: CENTER.x + r * Math.cos(a),
      y: CENTER.y + r * Math.sin(a),
    })
  }
  return nucleons
}

/** Radial-gradient color stops for the probability cloud: a density band per
 *  occupied shell, brighter with more electrons. `bandWidthPx` lets the
 *  cloud⇄shells transition narrow the bands until they look like rings. */
export function cloudGradientStops(
  shells: number[],
  shellRadii: number[],
  bandWidthPx?: number,
): Array<number | string> {
  const ringGap =
    shellRadii.length > 1 ? shellRadii[1] - shellRadii[0] : INNER_SHELL_R * 0.45
  const bw = (bandWidthPx ?? ringGap * 0.42) / CLOUD_R
  const stops: Array<number | string> = [0, 'rgba(56, 189, 248, 0)']
  shells.forEach((count, si) => {
    if (count === 0) return
    const pos = shellRadii[si] / CLOUD_R
    const alpha = Math.min(0.5, 0.1 + count * 0.022)
    stops.push(Math.max(0, pos - bw), 'rgba(56, 189, 248, 0.02)')
    stops.push(pos, `rgba(56, 189, 248, ${alpha})`)
    stops.push(Math.min(1, pos + bw), 'rgba(56, 189, 248, 0.02)')
  })
  stops.push(1, 'rgba(56, 189, 248, 0)')
  return stops
}
