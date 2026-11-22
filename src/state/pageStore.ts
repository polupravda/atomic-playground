import { create } from 'zustand'

// Top-level page switching (no router: views stay MOUNTED and are merely
// hidden, so every canvas keeps its state between switches).
export type AppPage = 'builder' | 'charges' | 'bonding' | 'crystal' | 'light' | 'examples'

/** the story topics inside 🎬 Stories; atoms (candle + tree) · crystals are
 *  planned (dimmed cards on the stories menu, nothing plays); signals
 *  (📶 digital information) has its first story built */
export type ExampleId = 'bomb' | 'light' | 'cosmos' | 'plant' | 'atoms' | 'crystals' | 'lasers' | 'signals'

/** one story: its topic and the topic's own story id ('gun', 'sun', 'cut'…) */
export interface StoryRef {
  example: ExampleId
  id: string
}

interface PageState {
  page: AppPage
  /** the story playing on 🎬 Stories; null = the stories menu.
   *  Stories never wait in the background: leaving one resets it. */
  story: StoryRef | null
  /** open a page. Every menu press — 🎬 Stories included, even while it is
   *  the current page — drops the playing story, so 🎬 Stories always
   *  lands on the stories menu (docs/how-things-work/17-stories-menu.md) */
  setPage: (page: AppPage) => void
  /** start a story from its first beat (from the stories menu) */
  startStory: (example: ExampleId, id: string) => void
  /** back to the stories menu (the canvas ← button, or a story's end) */
  storiesHome: () => void
}

export const usePageStore = create<PageState>((set) => ({
  page: 'builder',
  story: null,
  setPage: (page) => set({ page, story: null }),
  startStory: (example, id) => set({ page: 'examples', story: { example, id } }),
  storiesHome: () => set({ story: null }),
}))
