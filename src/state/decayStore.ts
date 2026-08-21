import { create } from 'zustand'
import type { DecayMode } from '../core/nuclides'

// A07: a running "Watch decay" animation. One at a time; `seq` keys each
// run so the stage overlay remounts fresh.

interface DecayState {
  active: { mode: DecayMode; seq: number } | null
  counter: number
  start: (mode: DecayMode) => void
  finish: () => void
}

export const useDecayStore = create<DecayState>((set) => ({
  active: null,
  counter: 0,
  start: (mode) =>
    set((s) =>
      s.active
        ? s
        : { active: { mode, seq: s.counter + 1 }, counter: s.counter + 1 },
    ),
  finish: () => set({ active: null }),
}))
