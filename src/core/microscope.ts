// L14 🔬 Microscopes (docs/how-things-work/11-proposal-new-demos.md) — the
// rule behind the scene: you can only see details bigger than about half
// the wave you look with. Light's waves are ~0.5 µm long, so a light
// microscope stops at about 200 nm; electrons are waves too, a hundred
// thousand times shorter, and the best electron microscopes show single
// atoms.

export type MicroscopeBeam = 'light' | 'electrons'

/** the wave each microscope looks with (m): green light; electrons from a
 *  100 kV electron gun (≈ 3.7 pm) */
export const WAVE_M: Record<MicroscopeBeam, number> = {
  light: 550e-9,
  electrons: 3.7e-12,
}

/** the finest detail each one can show (m). Light: Abbe's limit, about
 *  half a wave (with the best lenses ≈ 200 nm). Electrons: limited by the
 *  lenses, not the wave — the very best reach below 0.1 nm (atoms). */
export const SEE_LIMIT_M: Record<MicroscopeBeam, number> = {
  light: 200e-9,
  electrons: 0.08e-9,
}

export type SpecimenId = 'hair' | 'pollen' | 'blood' | 'bacterium' | 'virus' | 'dna' | 'atoms'

export interface Specimen {
  id: SpecimenId
  emoji: string
  /** short name for the switch */
  name: string
  /** how wide the thing is (m) — what the close-up frames */
  size: number
  /** its size in words (grown-ups' panel) */
  sizeText: string
}

export const SPECIMENS: Record<SpecimenId, Specimen> = {
  hair: { id: 'hair', emoji: '💇', name: 'hair', size: 80e-6, sizeText: '0.08 mm' },
  pollen: { id: 'pollen', emoji: '🌼', name: 'pollen', size: 30e-6, sizeText: '0.03 mm' },
  blood: { id: 'blood', emoji: '🩸', name: 'blood cell', size: 8e-6, sizeText: '8 µm' },
  bacterium: { id: 'bacterium', emoji: '🧫', name: 'bacterium', size: 2e-6, sizeText: '2 µm' },
  virus: { id: 'virus', emoji: '🦠', name: 'virus', size: 120e-9, sizeText: '120 nm' },
  dna: { id: 'dna', emoji: '🧬', name: 'DNA', size: 2e-9, sizeText: '2 nm' },
  atoms: { id: 'atoms', emoji: '⚛️', name: 'atoms', size: 0.6e-9, sizeText: '0.14 nm apart' },
}

/** big → small: the zoom ladder */
export const SPECIMEN_ORDER: SpecimenId[] = ['hair', 'pollen', 'blood', 'bacterium', 'virus', 'dna', 'atoms']

/** the close-up and the picture frame this much around the thing */
export const VIEW_PER_SIZE = 2.4
export const viewOf = (id: SpecimenId) => SPECIMENS[id].size * VIEW_PER_SIZE

/** how well a microscope shows a thing: how many smallest-visible spots
 *  fit across it. ≥ 25 sharp · 3–25 its outline but not its details ·
 *  < 3 a blur, nothing to recognize */
export type Seen = 'sharp' | 'fuzzy' | 'blur'
export function spotsAcross(beam: MicroscopeBeam, size: number): number {
  return size / SEE_LIMIT_M[beam]
}
export function howSeen(beam: MicroscopeBeam, size: number): Seen {
  const n = spotsAcross(beam, size)
  return n >= 25 ? 'sharp' : n >= 3 ? 'fuzzy' : 'blur'
}

/** one wave ÷ the thing: > 1 means the wave is bigger than what it meets */
export const waveVsThing = (beam: MicroscopeBeam, size: number) => WAVE_M[beam] / size

/** how strongly a thing stops the wave behind it, 0…1 — none while it is
 *  smaller than half a wave (the wave flows round it), full from about
 *  2.5 waves wide (a crisp shadow) */
export function shadowStrength(size: number, wave: number): number {
  return Math.min(1, Math.max(0, (size / wave - 0.5) / 2))
}

/** how far the shadow reaches behind the thing, in thing-widths: a wide
 *  thing's shadow goes on and on, a thing about one wave wide casts only a
 *  short one before the wave closes again behind it (≈ size² / wave) */
export function shadowLength(size: number, wave: number): number {
  return Math.max(0, size / wave)
}

/** the picture's blur: the smallest visible spot as a share of the view */
export function blurOfView(beam: MicroscopeBeam, view: number): number {
  return SEE_LIMIT_M[beam] / view
}

/** what the narrator explains once the picture is on screen ('' = none):
 *  light meets something too small; electrons show what light couldn't;
 *  electrons show single atoms */
export function microscopeResult(beam: MicroscopeBeam, id: SpecimenId): string {
  const tooSmallForLight = howSeen('light', SPECIMENS[id].size) === 'blur'
  if (!tooSmallForLight) return ''
  if (beam === 'light') return 'microscope-blur'
  return id === 'atoms' ? 'microscope-atoms' : 'microscope-electrons'
}

/** A wave's wiggle on screen. From WIGGLE_T px up it is drawn at TRUE scale.
 *  Finer waves can't be drawn (an electron's wave beside a hair is a
 *  hundred-thousandth of a pixel), so below WIGGLE_T they are squeezed the
 *  wave machine's way: every ten times finer draws a little finer, down to
 *  WIGGLE_MIN at the finest wave on the ladder. The squeeze only depends
 *  on the true size, so ORDER is kept everywhere: in one window electron
 *  waves always look finer than light's, a bigger thing always makes the
 *  same wave look finer, and two waves with the same wave-to-thing ratio
 *  look the same (light by a hair ≈ electrons by the atoms). */
const WIGGLE_T = 24
const WIGGLE_MIN = 3
/** the finest true wiggle on the ladder: electrons beside the hair (px) */
const LOG_FINEST = Math.log10(4e-6)
export function drawnWiggle(truePx: number): number {
  if (truePx >= WIGGLE_T) return truePx
  const q = (Math.log10(Math.max(truePx, 1e-12)) - LOG_FINEST) / (Math.log10(WIGGLE_T) - LOG_FINEST)
  return WIGGLE_MIN + (WIGGLE_T - WIGGLE_MIN) * Math.min(1, Math.max(0, q))
}

/** graphene's honeycomb: carbon atoms 0.142 nm apart (the pencil's sheets,
 *  the 🧊 Crystal lab's graphite), every atom within `reach` m of the
 *  centre */
export const CC_BOND_M = 0.142e-9
export function honeycomb(reach: number): Array<{ x: number; y: number }> {
  const a = CC_BOND_M
  const out: Array<{ x: number; y: number }> = []
  // two atoms per cell of the hexagonal lattice
  const a1 = { x: 1.5 * a, y: (Math.sqrt(3) / 2) * a }
  const a2 = { x: 1.5 * a, y: (-Math.sqrt(3) / 2) * a }
  const n = Math.ceil(reach / a) + 2
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      for (const off of [0, a]) {
        const x = i * a1.x + j * a2.x + off - a / 2
        const y = i * a1.y + j * a2.y
        if (Math.abs(x) <= reach && Math.abs(y) <= reach) out.push({ x, y })
      }
    }
  }
  return out
}
