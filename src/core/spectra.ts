// R02 — ✨ Light & color (electron jumps → photons → element barcodes).
// Pure data and rules for the "Atoms in action" example; the canvas lives in
// stage/LightStage.tsx.
//
// Curated, not a general simulation (spec philosophy): we model ONE idea —
// an electron kicked to a higher-energy seat falls back home and emits a
// photon whose color IS the size of the drop; the allowed drops are fixed
// per element, so every element has its own color fingerprint (barcode).
// Every wavelength below is a real, rounded textbook emission line of the
// neutral atom (N₂⁺ band heads for the aurora fringe); relative strengths
// are rounded by-eye brightnesses, good enough for a kid's barcode.

export type SpectrumElementId = 'li' | 'na' | 'h' | 'ne' | 'o' | 'he' | 'n2'

export interface SpectralLine {
  /** wavelength, nm (visible: ~380–750) */
  nm: number
  /** relative brightness 0–1 (1 = the element's strongest visible line) */
  strength: number
}

export interface SpectrumElement {
  id: SpectrumElementId
  name: string
  symbol: string
  protons: number
  lines: SpectralLine[]
  /** where a kid meets this element's light */
  seenIn: string
}

export const SPECTRA: Record<SpectrumElementId, SpectrumElement> = {
  li: {
    id: 'li',
    name: 'lithium',
    symbol: 'Li',
    protons: 3,
    // 670.8 nm is THE lithium red (a true lone-atom line, used in fireworks)
    lines: [
      { nm: 670.8, strength: 1 },
      { nm: 610.4, strength: 0.25 },
    ],
    seenIn: 'deep-red fireworks',
  },
  na: {
    id: 'na',
    name: 'sodium',
    symbol: 'Na',
    protons: 11,
    // the famous sodium yellow is really two lines 0.6 nm apart (589.0 +
    // 589.6) — far too close to draw separately: one fat line at 589.3
    lines: [
      { nm: 589.3, strength: 1 },
      { nm: 568.8, strength: 0.2 },
      { nm: 615.4, strength: 0.15 },
    ],
    seenIn: 'yellow fireworks & street lamps',
  },
  h: {
    id: 'h',
    name: 'hydrogen',
    symbol: 'H',
    protons: 1,
    // the visible Balmer series (drops to the 2nd level)
    lines: [
      { nm: 656.3, strength: 1 },
      { nm: 486.1, strength: 0.5 },
      { nm: 434.0, strength: 0.25 },
      { nm: 410.2, strength: 0.12 },
    ],
    seenIn: 'stars — most of every star is hydrogen',
  },
  ne: {
    id: 'ne',
    name: 'neon',
    symbol: 'Ne',
    protons: 10,
    // a curated handful of neon's strongest visible lines: all in the
    // orange–red, which is why real neon tubes glow red-orange
    lines: [
      { nm: 585.2, strength: 0.5 },
      { nm: 594.5, strength: 0.3 },
      { nm: 614.3, strength: 0.6 },
      { nm: 621.7, strength: 0.3 },
      { nm: 640.2, strength: 1 },
      { nm: 650.7, strength: 0.6 },
      { nm: 667.8, strength: 0.5 },
      { nm: 703.2, strength: 0.3 },
    ],
    seenIn: 'red-orange neon signs',
  },
  o: {
    id: 'o',
    name: 'oxygen',
    symbol: 'O',
    protons: 8,
    // the aurora lines: green 557.7 (lower sky), red 630.0 (higher up)
    lines: [
      { nm: 557.7, strength: 1 },
      { nm: 630.0, strength: 0.6 },
      { nm: 636.4, strength: 0.2 },
    ],
    seenIn: 'the green and red of auroras',
  },
  he: {
    id: 'he',
    name: 'helium',
    symbol: 'He',
    protons: 2,
    lines: [
      { nm: 587.6, strength: 1 },
      { nm: 667.8, strength: 0.3 },
      { nm: 501.6, strength: 0.25 },
      { nm: 447.1, strength: 0.2 },
    ],
    seenIn: 'the Sun — found there before it was found on Earth',
  },
  // molecular nitrogen ions, not single atoms (honest note in the aurora
  // story): the blue-purple fringe at the bottom edge of an aurora
  n2: {
    id: 'n2',
    name: 'nitrogen',
    symbol: 'N₂⁺',
    protons: 7,
    lines: [
      { nm: 391.4, strength: 0.6 },
      { nm: 427.8, strength: 1 },
    ],
    seenIn: 'the purple fringe of auroras',
  },
}

/** visible range drawn on every spectrum strip, nm */
export const VISIBLE_MIN_NM = 380
export const VISIBLE_MAX_NM = 750

/**
 * Wavelength (nm) → sRGB, the standard piecewise approximation (Bruton),
 * with intensity falloff toward both ends of the visible range and a mild
 * gamma. Returns 0–255 channels.
 */
export function wavelengthToRGB(nm: number): { r: number; g: number; b: number } {
  const w = Math.min(VISIBLE_MAX_NM, Math.max(VISIBLE_MIN_NM, nm))
  let r = 0
  let g = 0
  let b = 0
  if (w < 440) {
    r = (440 - w) / (440 - 380)
    b = 1
  } else if (w < 490) {
    g = (w - 440) / (490 - 440)
    b = 1
  } else if (w < 510) {
    g = 1
    b = (510 - w) / (510 - 490)
  } else if (w < 580) {
    r = (w - 510) / (580 - 510)
    g = 1
  } else if (w < 645) {
    r = 1
    g = (645 - w) / (645 - 580)
  } else {
    r = 1
  }
  // dim toward the edges of the visible range
  let f = 1
  if (w < 420) f = 0.3 + (0.7 * (w - 380)) / (420 - 380)
  else if (w > 700) f = 0.3 + (0.7 * (750 - w)) / (750 - 700)
  const gamma = 0.8
  const ch = (v: number) => Math.round(255 * Math.pow(v * f, gamma))
  return { r: ch(r), g: ch(g), b: ch(b) }
}

/** Wavelength → CSS color string (optionally translucent). */
export function wavelengthToCss(nm: number, alpha = 1): string {
  const { r, g, b } = wavelengthToRGB(nm)
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Pick one of the element's allowed drops at random, weighted by line
 * strength (a stronger line = a more common drop). `rand` is a uniform
 * [0,1) sample so the rule stays testable. Returns the line's index.
 */
export function randomLineIndex(lines: SpectralLine[], rand: number): number {
  const total = lines.reduce((s, l) => s + l.strength, 0)
  let acc = 0
  for (let i = 0; i < lines.length; i++) {
    acc += lines[i].strength
    if (rand * total < acc) return i
  }
  return lines.length - 1
}

/**
 * The energy of a photon is proportional to 1/wavelength. Normalized drop
 * height for the energy-staircase ladder: 1 for a violet 380 nm photon,
 * smaller for redder light — "the color IS the size of the drop".
 */
export function dropHeight(nm: number): number {
  return VISIBLE_MIN_NM / Math.min(VISIBLE_MAX_NM, Math.max(VISIBLE_MIN_NM, nm))
}

/** A real jump-and-fall takes ~a billionth of a second (honest note). */
export const REAL_JUMP_TIME_S = 1e-9
