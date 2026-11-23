import { SPOKEN_WORDS_BY_LANG, WORDS_KEY } from '../core/spokenWords'
import type { NarrationLang } from '../state/voiceStore'

// 🔊 Plays pre-rendered word clips (core/spokenWords.ts) — the speak
// buttons' voice, the same one that tells the stories. A tap is an
// explicit request, so it plays even with the global Voice switch off.
// Its own <audio> element (never the narration's shared one); a new word
// cuts the previous one (and its queue) off. A clip that fails stays
// silent: there is deliberately no robotic fallback voice. A language
// without that clip falls back to English.

let el: HTMLAudioElement | null = null
let queue: Array<{ id: string; lang: NarrationLang }> = []

/** the clip's url: public/narration/words/<lang>/<id>.m4a */
export const wordUrl = (id: string, lang: NarrationLang = 'en') => `${import.meta.env.BASE_URL}narration/${WORDS_KEY}/${lang}/${id}.m4a`

const has = (id: string, lang: NarrationLang) => id in SPOKEN_WORDS_BY_LANG[lang]

function playNext() {
  const next = queue.shift()
  if (!next || !el) return
  el.src = wordUrl(next.id, next.lang)
  el.play().catch(() => {}) // silent on failure (or when cut off by the next word)
}

/** say these clips one after another, in `lang` where it has them */
export function sayWords(ids: string[], lang: NarrationLang = 'en') {
  if (!el) {
    el = new Audio()
    el.preload = 'auto'
    el.addEventListener('ended', () => setTimeout(playNext, 350))
  }
  el.pause()
  queue = ids.filter((id) => has(id, 'en') || has(id, lang)).map((id) => ({ id, lang: has(id, lang) ? lang : 'en' }))
  playNext()
}

export const sayWord = (id: string, lang: NarrationLang = 'en') => sayWords([id], lang)
