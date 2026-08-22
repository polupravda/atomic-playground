import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useFeedbackStore, type FeedbackSegment } from '../state/feedbackStore'
import type { ParticleKind } from '../state/atomStore'

const COLOR: Record<ParticleKind, string> = {
  protons: 'text-red-400',
  neutrons: 'text-slate-300',
  electrons: 'text-sky-400',
}

function Segment({ seg }: { seg: FeedbackSegment }) {
  return (
    <span
      className={`${seg.color ? COLOR[seg.color] : 'text-amber-100'} ${
        seg.big ? 'text-xl font-extrabold' : ''
      }`}
    >
      {seg.text}
    </span>
  )
}

/** Kid-friendly speech bubble explaining why the playground corrected an
 *  input. Anchored beside the particle panel (where the mistake happened),
 *  glowing softly; closes on outside click or after a few seconds. */
export function FeedbackToast() {
  const message = useFeedbackStore((s) => s.message)
  const seq = useFeedbackStore((s) => s.seq)
  const clear = useFeedbackStore((s) => s.clear)
  const bubbleRef = useRef<HTMLDivElement | null>(null)

  // No auto-dismiss — slow readers keep the bubble as long as they need.
  // It closes only on an outside click or the ✕ button. Capture-phase
  // pointerdown so no component can swallow the event before we see it.
  useEffect(() => {
    if (!message) return
    const onOutside = (e: Event) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        clear()
      }
    }
    // pointerdown dismisses immediately; the capture-phase click runs AFTER
    // any blur-triggered change echo, killing a bubble the echo re-opened —
    // and BEFORE the clicked element's own handlers, so a genuinely new
    // violation raised by this same click still shows its bubble.
    document.addEventListener('pointerdown', onOutside, true)
    document.addEventListener('click', onOutside, true)
    return () => {
      document.removeEventListener('pointerdown', onOutside, true)
      document.removeEventListener('click', onOutside, true)
    }
  }, [seq, message, clear])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={seq}
          ref={bubbleRef}
          initial={{ opacity: 0, scale: 0.6, x: 16 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.6, x: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          style={{ transformOrigin: 'right center' }}
          className="absolute right-full top-2 z-50 mr-5 w-64 rounded-3xl border-2 border-amber-300/70 bg-slate-800 px-4 py-3 pr-8 text-sm leading-relaxed"
        >
          {/* glow pulse as pure CSS: an infinite Motion animation here would
              block AnimatePresence's exit and make the bubble undismissable */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-pulse rounded-3xl"
            style={{ boxShadow: '0 0 22px rgba(251, 191, 36, 0.45)' }}
          />
          {/* speech-bubble tail pointing at the particle panel */}
          <div className="absolute -right-[9px] top-9 h-4 w-4 rotate-45 border-r-2 border-t-2 border-amber-300/70 bg-slate-800" />
          <button
            type="button"
            onClick={clear}
            aria-label="Close"
            className="absolute right-2.5 top-2 text-slate-400 transition hover:text-slate-200"
          >
            ✕
          </button>
          <div className="flex items-start gap-2.5">
            <span aria-hidden className="shrink-0 text-xl">
              💡
            </span>
            <p className="text-left">
              {message.map((seg, i) => (
                <Segment key={i} seg={seg} />
              ))}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
