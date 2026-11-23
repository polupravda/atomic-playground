import { sayWord } from './wordAudio'
import type { NarrationLang } from '../state/voiceStore'

// 🔊 pronunciation button, styled like the amber 💡 affordance. Plays a
// pre-rendered clip in the stories' voice (core/spokenWords.ts, ui/
// wordAudio.ts) — never the browser's robotic speech synthesis.
// Rendered as a span[role=button] so it can live inside other buttons
// (e.g. the element badge) without invalid nesting.

/** Bright amber vector speaker — same glyph as the bonding lab's canvas
 *  badge (the 🔊 emoji is natively dark gray and looked dull). */
export function SpeakerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-9 -9 18 18" aria-hidden>
      <path
        d="M -5.5 -2 L -2.5 -2 L 0.5 -4.5 L 0.5 4.5 L -2.5 2 L -5.5 2 Z"
        fill="#fcd34d"
      />
      <path
        d="M 2.916 -1.953 A 2.6 2.6 0 0 1 2.916 1.953"
        fill="none"
        stroke="#fcd34d"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 4.236 -3.456 A 4.6 4.6 0 0 1 4.236 3.456"
        fill="none"
        stroke="#fcd34d"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function SpeakButton({
  word,
  text,
  className,
  lang = 'en',
}: {
  /** the clip to play (core/spokenWords.ts: elementWord(z), bondWord(id)) */
  word: string
  /** what it says, for the tooltip and screen readers */
  text: string
  className?: string
  /** the language to say it in (a clip it lacks falls back to English) */
  lang?: NarrationLang
}) {
  const speak = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    e.preventDefault()
    sayWord(word, lang)
  }
  return (
    <span
      role="button"
      tabIndex={0}
      title={`Hear "${text}"`}
      aria-label={`Pronounce ${text}`}
      onClick={speak}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') speak(e)
      }}
      className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber-400/60 bg-amber-500/20 text-sm shadow-md shadow-amber-900/40 transition hover:bg-amber-500/35 ${
        className ?? ''
      }`}
    >
      <SpeakerIcon />
    </span>
  )
}
