import { create } from 'zustand'

// "What just happened" — a sticky story in the info panel so kids can read
// at their own pace. Rules (docs/how-things-work/03-architecture.md):
// a story persists until superseded by the next event (e.g. another decay)
// or cleared by a manual atom edit (the story would describe an atom that
// no longer exists). View changes never clear it.

export interface IconPara {
  icon: string
  text: string
}

export interface EventStory {
  title: string
  paragraphs: IconPara[]
}

interface EventState {
  story: EventStory | null
  setStory: (story: EventStory) => void
  clearStory: () => void
}

export const useEventStore = create<EventState>((set) => ({
  story: null,
  setStory: (story) => set({ story }),
  clearStory: () => set((s) => (s.story ? { story: null } : s)),
}))
