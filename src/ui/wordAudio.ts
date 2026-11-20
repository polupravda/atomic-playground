import { SPOKEN_WORDS, WORDS_KEY } from '../core/spokenWords'

// 🔊 Plays one pre-rendered word clip (core/spokenWords.ts) — the speak
// buttons' voice, the same one that tells the stories. A tap is an
// explicit request, so it plays even with the global Voice switch off.
// Its own <audio> element (never the narration's shared one); a new tap
// cuts the previous word off. A clip that fails stays silent: there is
// deliberately no robotic fallback voice.

let el: HTMLAudioElement | null = null

/** the clip's url: public/narration/words/en/<id>.m4a */
export const wordUrl = (id: string) => `${import.meta.env.BASE_URL}narration/${WORDS_KEY}/en/${id}.m4a`

export function sayWord(id: string) {
  if (!(id in SPOKEN_WORDS)) return
  if (!el) {
    el = new Audio()
    el.preload = 'auto'
  }
  el.pause()
  el.src = wordUrl(id)
  el.play().catch(() => {}) // silent on failure (or when cut off by the next tap)
}
