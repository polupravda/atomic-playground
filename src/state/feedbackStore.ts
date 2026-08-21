import { create } from 'zustand'
import type { ParticleKind } from './atomStore'

// Educational feedback: when an input is corrected by physics (too many
// electrons, protons beyond 118, electrons shed by a proton drop), the kid
// sees WHY — a speech-bubble message, plus an optional red countdown "flash"
// on the affected particle field instead of a silent jump.

/** Messages are segments so the bubble can color-code particle words and
 *  render numbers big and bold: color follows the particle (protons red,
 *  electrons blue, neutrons grey). */
export interface FeedbackSegment {
  text: string
  color?: ParticleKind
  big?: boolean
}

interface FeedbackState {
  seq: number
  message: FeedbackSegment[] | null
  flash: { kind: ParticleKind; from: number; seq: number } | null
  notify: (
    message: FeedbackSegment[],
    flash?: { kind: ParticleKind; from: number },
  ) => void
  clear: () => void
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  seq: 0,
  message: null,
  flash: null,
  notify: (message, flash) =>
    set((s) => ({
      message,
      seq: s.seq + 1,
      flash: flash ? { ...flash, seq: s.seq + 1 } : s.flash,
    })),
  clear: () => set({ message: null }),
}))
