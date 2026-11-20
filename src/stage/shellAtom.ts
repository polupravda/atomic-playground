import { drawGlossyParticle } from './particleStyle'

// A whole atom in the 🧪 Bonding lab's shell-view language: a small
// nucleus, one ring per shell, spinning electrons — the outer-shell
// (valence) electrons drawn larger, because they do the bonding. Shared
// by the Bonding lab and the 🧊 Crystal lab, so an atom looks the same
// everywhere.

/** ring radii at scale 1: RING_BASE, RING_BASE + RING_GAP, … */
export const RING_BASE = 13
export const RING_GAP = 10
/** the outermost ring's radius at scale 1 */
export const outerRing = (shellCount: number) => RING_BASE + RING_GAP * (shellCount - 1)

export function drawShellAtom(
  native: CanvasRenderingContext2D,
  shells: number[],
  protons: number,
  x: number,
  y: number,
  scale: number,
  spin: number,
  // bonded atoms hand their valence electrons to the bond animation
  skipValence = false,
) {
  for (let i = 0; i < shells.length; i++) {
    const r = (RING_BASE + RING_GAP * i) * scale
    native.strokeStyle = i === shells.length - 1 ? '#4a6b91' : '#3b5a7d'
    native.lineWidth = 1
    native.beginPath()
    native.arc(x, y, r, 0, Math.PI * 2)
    native.stroke()
  }
  if (protons === 1) {
    // hydrogen's whole nucleus really is a single proton
    drawGlossyParticle(native, 'protons', x, y, 3.4 * scale)
  } else {
    const nR = 2.7 * scale
    drawGlossyParticle(native, 'protons', x - nR * 0.9, y - nR * 0.6, nR)
    drawGlossyParticle(native, 'neutrons', x + nR * 0.9, y - nR * 0.6, nR)
    drawGlossyParticle(native, 'protons', x + nR * 0.1, y + nR * 0.95, nR)
    drawGlossyParticle(native, 'neutrons', x - nR * 1.1, y + nR * 0.7, nR)
  }
  for (let i = 0; i < shells.length; i++) {
    const isValence = i === shells.length - 1
    if (skipValence && isValence) continue
    const r = (RING_BASE + RING_GAP * i) * scale
    const eR = (isValence ? 3.1 : 2.4) * scale
    // alternate spin direction per ring so the atom feels alive
    const a0 = spin * (i % 2 === 0 ? 1 : -0.7) + i * 1.3
    for (let k = 0; k < shells[i]; k++) {
      const a = a0 + (k * 2 * Math.PI) / shells[i]
      drawGlossyParticle(native, 'electrons', x + r * Math.cos(a), y + r * Math.sin(a), eR)
    }
  }
}
