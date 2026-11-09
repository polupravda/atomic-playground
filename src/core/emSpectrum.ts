// 💡 Light lab — the electromagnetic spectrum as pure data and rules
// (proposal 09, L01–L04). The canvas lives in stage/WaveStage.tsx.
//
// Everything here is real, rounded physics: band edges are the usual
// textbook boundaries, and the whole family is ONE thing — a travelling
// wave — differing only in wavelength. Kid anchors keep each band concrete.

import { VISIBLE_MAX_NM, VISIBLE_MIN_NM } from './spectra'

export type EmBandId = 'gamma' | 'xray' | 'uv' | 'visible' | 'ir' | 'micro' | 'radio'

export interface EmBand {
  id: EmBandId
  /** short name for the canvas bar */
  label: string
  /** kid-level one-liner for the info panel */
  anchor: string
  /** wavelength range in meters [min, max) */
  minM: number
  maxM: number
}

/** the whole journey drawn on the bar: 0.0001 nm … 100 m (15 decades) */
export const EM_MIN_M = 1e-13
export const EM_MAX_M = 1e2

export const VIS_MIN_M = VISIBLE_MIN_NM * 1e-9
export const VIS_MAX_M = VISIBLE_MAX_NM * 1e-9

/** shortest wavelength first — matching the barcode strips (violet left) */
export const EM_BANDS: EmBand[] = [
  {
    id: 'gamma',
    label: 'γ rays',
    anchor: 'the rays from the atomic-bomb demo — made by atomic nuclei',
    minM: EM_MIN_M,
    maxM: 1e-11,
  },
  {
    id: 'xray',
    label: 'X-rays',
    anchor: 'they fly straight through your skin — how a doctor sees bones',
    minM: 1e-11,
    maxM: 1e-8,
  },
  {
    id: 'uv',
    label: 'UV',
    anchor: 'ultraviolet — the invisible part of sunlight that causes sunburn',
    minM: 1e-8,
    maxM: VIS_MIN_M,
  },
  {
    id: 'visible',
    label: 'visible',
    anchor: 'the rainbow — the only slice human eyes can catch',
    minM: VIS_MIN_M,
    maxM: VIS_MAX_M,
  },
  {
    id: 'ir',
    label: 'infrared',
    anchor: 'you FEEL it as warmth from a fire; TV remotes blink in it',
    minM: VIS_MAX_M,
    maxM: 1e-3,
  },
  {
    id: 'micro',
    label: 'microwaves',
    anchor: 'a microwave oven shakes water with them; phones and Wi-Fi use them too',
    minM: 1e-3,
    maxM: 1,
  },
  {
    id: 'radio',
    label: 'radio',
    anchor: 'waves as long as a bus or a football field, carrying music through walls',
    minM: 1,
    maxM: EM_MAX_M,
  },
]

/** which band a wavelength (meters) belongs to */
export function bandOf(m: number): EmBand {
  const w = Math.min(EM_MAX_M, Math.max(EM_MIN_M, m))
  return EM_BANDS.find((b) => w < b.maxM) ?? EM_BANDS[EM_BANDS.length - 1]
}

/** position (0–1) on the TRUE log-scale bar, shortest waves left */
export function emBarPosition(m: number): number {
  const w = Math.min(EM_MAX_M, Math.max(EM_MIN_M, m))
  return (Math.log10(w) - Math.log10(EM_MIN_M)) / (Math.log10(EM_MAX_M) - Math.log10(EM_MIN_M))
}

// ---------- the wavelength slider ----------
// The TRUE scale is the bar; the slider is a control. On a pure log slider
// the whole rainbow would be ~2% of the travel, so the slider gives the
// visible band the middle 60% (linear in nm — tuning colors feels right)
// and log-compressed tails reach γ on the left and radio on the right.

export const U_VIS0 = 0.2
export const U_VIS1 = 0.8

/** slider value u (0–1) → wavelength in meters */
export function uToWavelength(u: number): number {
  const v = Math.min(1, Math.max(0, u))
  if (v < U_VIS0) {
    const f = v / U_VIS0
    return Math.pow(10, Math.log10(EM_MIN_M) + (Math.log10(VIS_MIN_M) - Math.log10(EM_MIN_M)) * f)
  }
  if (v > U_VIS1) {
    const f = (v - U_VIS1) / (1 - U_VIS1)
    return Math.pow(10, Math.log10(VIS_MAX_M) + (Math.log10(EM_MAX_M) - Math.log10(VIS_MAX_M)) * f)
  }
  return VIS_MIN_M + ((VIS_MAX_M - VIS_MIN_M) * (v - U_VIS0)) / (U_VIS1 - U_VIS0)
}

/** wavelength in meters → slider value u (0–1); inverse of uToWavelength */
export function wavelengthToU(m: number): number {
  const w = Math.min(EM_MAX_M, Math.max(EM_MIN_M, m))
  if (w < VIS_MIN_M) {
    const f = (Math.log10(w) - Math.log10(EM_MIN_M)) / (Math.log10(VIS_MIN_M) - Math.log10(EM_MIN_M))
    return f * U_VIS0
  }
  if (w > VIS_MAX_M) {
    const f = (Math.log10(w) - Math.log10(VIS_MAX_M)) / (Math.log10(EM_MAX_M) - Math.log10(VIS_MAX_M))
    return U_VIS1 + f * (1 - U_VIS1)
  }
  return U_VIS0 + ((w - VIS_MIN_M) / (VIS_MAX_M - VIS_MIN_M)) * (U_VIS1 - U_VIS0)
}

// ---------- readouts ----------

/** kid-readable wavelength: "670 nm", "0.05 mm", "30 cm", "15 m" */
export function formatWavelength(m: number): string {
  const w = Math.min(EM_MAX_M, Math.max(EM_MIN_M, m))
  if (w < 1e-5) {
    const nm = w * 1e9
    if (nm >= 1) return `${Math.round(nm)} nm`
    return `${Number(nm.toPrecision(1))} nm`
  }
  if (w < 1e-2) {
    const mm = w * 1e3
    return `${Number(mm.toPrecision(2))} mm`
  }
  if (w < 1) return `${Number((w * 100).toPrecision(2))} cm`
  return `${Number(w.toPrecision(2))} m`
}

/** fuzzy human color names across the visible band (nm) */
export function colorName(nm: number): string {
  if (nm < 450) return 'violet'
  if (nm < 485) return 'blue'
  if (nm < 500) return 'turquoise'
  if (nm < 565) return 'green'
  if (nm < 590) return 'yellow'
  if (nm < 625) return 'orange'
  if (nm < 700) return 'red'
  return 'deep red'
}

/** is the wavelength (meters) inside the visible band? */
export function isVisible(m: number): boolean {
  return m >= VIS_MIN_M && m <= VIS_MAX_M
}

/** one photon's punch relative to a deep-red (670 nm) photon: energy ∝ 1/λ */
export function photonPunch(m: number): number {
  return 670e-9 / Math.min(EM_MAX_M, Math.max(EM_MIN_M, m))
}

// ---------- the doorbell (photoelectric effect, L07) ----------
// A real experiment at kid level: a metal plate frees one electron only if
// ONE arriving photon can pay the metal's fixed price (work function) —
// photons never team up. Our plate is POTASSIUM: work function ≈ 2.29 eV →
// threshold ≈ 541 nm, rounded to 540 — chosen because its edge sits INSIDE
// the rainbow, findable with the slider. (The school-lab demo metal, zinc,
// asks ~4.3 eV: only UV-C rings it — nothing visible ever would.)

export const DOORBELL_THRESHOLD_M = 540e-9

/** does one photon of this wavelength free an electron from our metal? */
export function ringsBell(m: number): boolean {
  return m <= DOORBELL_THRESHOLD_M
}

/**
 * How fast the freed electron flies off, 0–1: the photon's energy ABOVE the
 * threshold becomes the electron's speed (the real photoelectric relation,
 * clamped for drawing). 0 below the threshold; a slow pop right at it.
 */
export function ejectSpeedFactor(m: number): number {
  if (!ringsBell(m)) return 0
  const excess = DOORBELL_THRESHOLD_M / Math.max(m, EM_MIN_M) - 1
  return Math.min(1, 0.15 + excess * 0.8)
}
