import { create } from 'zustand'

// P02: elements the user has built (by reaching that proton count) light up
// in the periodic table. Session-only — the playground has no persistence.

interface DiscoveryState {
  discovered: number[]
  /** The most recently discovered element (drives the "new!" pulse). */
  lastDiscovered: number | null
  /** Bumped when an element is loaded FROM the table (P03) so the stage can
   *  play an arrival pulse. */
  loadPulse: number
  markDiscovered: (z: number) => void
  bumpLoadPulse: () => void
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  discovered: [],
  lastDiscovered: null,
  loadPulse: 0,
  markDiscovered: (z) =>
    set((s) =>
      z < 1 || z > 118 || s.discovered.includes(z)
        ? s
        : { discovered: [...s.discovered, z], lastDiscovered: z },
    ),
  bumpLoadPulse: () => set((s) => ({ loadPulse: s.loadPulse + 1 })),
}))
