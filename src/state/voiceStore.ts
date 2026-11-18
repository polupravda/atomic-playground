import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 🔊 the storyteller voice — ONE global setting for every demo's narration
// (shown as a switch next to the example tabs). On by default; the choice
// is remembered across visits (localStorage). The narration language is a
// pilot: it switches the voice only — UI and story text stay English.

export type NarrationLang = 'en' | 'de' | 'ru'

interface VoiceState {
  voiceOn: boolean
  lang: NarrationLang
  setVoiceOn: (on: boolean) => void
  setLang: (lang: NarrationLang) => void
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      voiceOn: true,
      lang: 'en',
      setVoiceOn: (voiceOn) => set({ voiceOn }),
      setLang: (lang) => set({ lang }),
    }),
    { name: 'atomic-playground-voice' },
  ),
)
