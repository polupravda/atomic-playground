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
    const onPointerDown = (e: PointerEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        clear()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [seq, message, clear])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={seq}
          ref={bubbleRef}
          initial={{ opacity: 0, scale: 0.6, x: 16 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            boxShadow: [
              '0 0 10px rgba(251, 191, 36, 0.25)',
              '0 0 26px rgba(251, 191, 36, 0.55)',
              '0 0 10px rgba(251, 191, 36, 0.25)',
            ],
          }}
          exit={{ opacity: 0, scale: 0.6, x: 16 }}
          transition={{
            default: { type: 'spring', stiffness: 320, damping: 22 },
            boxShadow: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: 'right center' }}
          className="absolute right-full top-2 z-50 mr-5 w-64 rounded-3xl border-2 border-amber-300/70 bg-slate-800 px-4 py-3 pr-8 text-sm leading-relaxed"
        >
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
