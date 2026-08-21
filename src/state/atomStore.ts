import { create } from 'zustand'
import { MAX_ATOMIC_NUMBER } from '../core/elements'
import { maxNeutronsFor } from '../core/nuclides'

// Raw user-controlled particle counts only. Everything else (element, charge,
// isotope, shells) is derived in components via core/ functions — derived
// values are never stored (see docs/how-things-work/03-architecture.md).

export type ParticleKind = 'protons' | 'neutrons' | 'electrons'

export const MAX_NEUTRONS = 200

/** Physics limit: an isolated atom binds at most ~one electron beyond its
 *  proton count — no stable gas-phase atomic dianion exists (Lieb's bound
 *  N < 2Z + 1 is the theoretical ceiling; Z + 1 is what's observed). */
export function maxElectronsFor(protons: number): number {
  return protons + 1
}

/** Upper bound for a particle kind given the current proton count. */
export function limitFor(kind: ParticleKind, protons: number): number {
  if (kind === 'protons') return MAX_ATOMIC_NUMBER
  if (kind === 'neutrons') return maxNeutronsFor(protons)
  return maxElectronsFor(protons)
}

function clampInt(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(max, Math.max(0, Math.round(value)))
}

interface Counts {
  protons: number
  neutrons: number
  electrons: number
}

/** A02 clamping: protons 0–118 (the periodic table); neutrons capped by the
 *  neutron drip line for the current proton count (extra neutrons simply
 *  fall off a real nucleus); electrons capped by protons + 1. Lowering
 *  protons sheds now-unbindable neutrons and electrons. */
function clampCounts(raw: Counts): Counts {
  const protons = clampInt(raw.protons, MAX_ATOMIC_NUMBER)
  const neutrons = Math.min(
    clampInt(raw.neutrons, MAX_NEUTRONS),
    maxNeutronsFor(protons),
  )
  const electrons = Math.min(
    clampInt(raw.electrons, MAX_NEUTRONS),
    maxElectronsFor(protons),
  )
  return { protons, neutrons, electrons }
}

interface AtomState extends Counts {
  setCount: (kind: ParticleKind, value: number) => void
  addParticle: (kind: ParticleKind, delta?: number) => void
  reset: () => void
}

export const useAtomStore = create<AtomState>((set) => ({
  protons: 0,
  neutrons: 0,
  electrons: 0,
  setCount: (kind, value) => set((s) => clampCounts({ ...s, [kind]: value })),
  addParticle: (kind, delta = 1) =>
    set((s) => clampCounts({ ...s, [kind]: s[kind] + delta })),
  reset: () => set({ protons: 0, neutrons: 0, electrons: 0 }),
}))
