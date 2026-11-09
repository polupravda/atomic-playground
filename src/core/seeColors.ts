// 💡 Light lab — how your eye sees a color (L09/L11). Pure data and rules;
// the canvas lives in stage/WaveStage.tsx (the eye scene).
//
// The one idea: objects have NO light of their own. Light pours on them as a
// bundle of wavelengths; the object SWALLOWS some bands and bounces the
// rest — and your eye sees whatever bounced. An object can only bounce
// colors it is GIVEN (the trick lamp, L11).
//
// Honesty: real surfaces reflect broad BANDS, not single lines (bands below
// are rounded kid-level reflectance), and they scatter light in all
// directions — the canvas draws the one bundle that reaches the eye.

import { colorName, isVisible } from './emSpectrum'
import { wavelengthToRGB } from './spectra'

export type EyeObjectId = 'apple' | 'leaf' | 'cup' | 'paper' | 'stone'

export interface EyeObject {
  id: EyeObjectId
  name: string
  emoji: string
  /** reflected wavelength bands, nm [from, to] — everything else is swallowed */
  bands: Array<[number, number]>
}

export const EYE_OBJECTS: Record<EyeObjectId, EyeObject> = {
  apple: { id: 'apple', name: 'red apple', emoji: '🍎', bands: [[590, 750]] },
  leaf: { id: 'leaf', name: 'green leaf', emoji: '🍃', bands: [[490, 575]] },
  cup: { id: 'cup', name: 'blue cup', emoji: '🫙', bands: [[420, 500]] },
  paper: { id: 'paper', name: 'white paper', emoji: '📄', bands: [[380, 750]] },
  stone: { id: 'stone', name: 'black stone', emoji: '🪨', bands: [] },
}

export const EYE_OBJECT_ORDER: EyeObjectId[] = ['apple', 'leaf', 'cup', 'paper', 'stone']

/** white light drawn as a bundle of 7 waves across the rainbow (nm) */
export const WHITE_BUNDLE = [410, 460, 500, 540, 590, 640, 700]

/** the trick lamp's single colors (L11); sodium orange is R02's 589 nm */
export const EYE_LAMPS: Array<{ nm: number; name: string }> = [
  { nm: 670, name: 'red' },
  { nm: 589, name: 'sodium orange' },
  { nm: 530, name: 'green' },
  { nm: 460, name: 'blue' },
  { nm: 410, name: 'violet' },
]

/** does the object bounce this wavelength (nm), or swallow it? */
export function reflects(obj: EyeObject, nm: number): boolean {
  return obj.bands.some(([a, b]) => nm >= a && nm <= b)
}

/** the part of the lamp's bundle that bounces off toward the eye */
export function reflectedBundle(obj: EyeObject, lamp: number[]): number[] {
  return lamp.filter((nm) => reflects(obj, nm))
}

/**
 * What the eye reports for a bounced bundle: a CSS color (additive mix of
 * the bundle, normalized so single colors stay vivid and a full bundle
 * reads white) and a kid name ('black' for an empty bundle, 'white' when
 * the whole rainbow arrives, else the bundle's color family).
 */
export function eyeSees(reflected: number[]): { css: string; name: string } {
  const seen = reflected.filter((nm) => isVisible(nm * 1e-9))
  if (seen.length === 0) return { css: '#05070f', name: 'black' }
  let r = 0
  let g = 0
  let b = 0
  for (const nm of seen) {
    const c = wavelengthToRGB(nm)
    r += c.r
    g += c.g
    b += c.b
  }
  const max = Math.max(r, g, b)
  const scale = 255 / max
  const css = `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})`
  if (seen.length >= WHITE_BUNDLE.length) return { css, name: 'white' }
  const mean = seen.reduce((s, nm) => s + nm, 0) / seen.length
  return { css, name: seen.length === 1 ? colorName(seen[0]) : colorName(mean) }
}
