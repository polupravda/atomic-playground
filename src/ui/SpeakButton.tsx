// 🔊 pronunciation button, styled like the amber 💡 affordance. Uses the
// browser's built-in speech synthesis — no downloads, works offline.
// Rendered as a span[role=button] so it can live inside other buttons
// (e.g. the element badge) without invalid nesting.
export function SpeakButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const speak = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85 // a touch slower, for young ears
    window.speechSynthesis.speak(utterance)
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
      🔊
    </span>
  )
}
