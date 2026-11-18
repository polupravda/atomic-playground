import type { NarrationLang } from '../state/voiceStore'
import { LANG_NAMES } from './useNarration'

// The one narration message a demo canvas can show (top centre): the voice
// failed to play, or the chosen language has no script for this story yet.

export function NarrationNotice({
  failed,
  missingLang,
}: {
  failed: boolean
  missingLang: NarrationLang | null
}) {
  const text = failed
    ? "🔇 The storyteller's voice isn't available right now — the story plays on without it. Reloading the page may bring it back."
    : missingLang
      ? `🔇 This story isn't narrated in ${LANG_NAMES[missingLang]} yet — it plays on without the voice.`
      : null
  if (!text) return null
  return (
    <p className="pointer-events-none absolute left-1/2 top-3 w-max max-w-[80%] -translate-x-1/2 rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-2 text-center text-sm text-slate-200">
      {text}
    </p>
  )
}
