import { create } from 'zustand'

// Top-level page switching (no router: views stay MOUNTED and are merely
// hidden, so every canvas keeps its state between switches).
export type AppPage = 'builder' | 'charges' | 'bonding'

interface PageState {
  page: AppPage
  setPage: (page: AppPage) => void
}

export const usePageStore = create<PageState>((set) => ({
  page: 'builder',
  setPage: (page) => set({ page }),
}))
