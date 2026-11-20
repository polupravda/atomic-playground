import { create } from 'zustand'

// Top-level page switching (no router: views stay MOUNTED and are merely
// hidden, so every canvas keeps its state between switches).
export type AppPage = 'builder' | 'charges' | 'bonding' | 'crystal' | 'light' | 'examples'

/** the demos inside 🌍 Atoms in action — sub-items of the main menu */
/** the demos inside 🎬 Stories; atoms (candle + tree) · crystals are planned
 *  (ComingSoonExample: inactive thumbnails only) */
export type ExampleId = 'bomb' | 'light' | 'cosmos' | 'plant' | 'atoms' | 'crystals'

interface PageState {
  page: AppPage
  /** the demo shown inside Atoms in action (remembered while elsewhere) */
  example: ExampleId
  setPage: (page: AppPage) => void
  /** open a demo — also switches to the Atoms in action page */
  setExample: (example: ExampleId) => void
}

export const usePageStore = create<PageState>((set) => ({
  page: 'builder',
  example: 'bomb',
  setPage: (page) => set({ page }),
  setExample: (example) => set({ page: 'examples', example }),
}))
