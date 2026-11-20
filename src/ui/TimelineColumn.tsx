import { memo, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { displayPiece, parseNarrationLine, splitSentences } from '../stage/narrationScript'
import type { NarrationLang } from '../state/voiceStore'
import { chapterHeading, type ChapterHeading } from './storyChapters'

// The 📖 story column shared by every 🎬 story: the TRANSCRIPT of its
// narration — word for word what the voice says (the script is the single
// source: stage/*Narration.ts), in the language the voice speaks, grouped
// under chapter headings, one block per story beat with its icon.
//
// Every SENTENCE is its own target, in every story (splitSentences — a
// taught-term repeat stays with its sentence). Tracking: the beat on
// screen is framed in amber and pinned to the top of the scrolling
// column; inside it, the sentence being said lights up, sentences already
// said stay bright, sentences still to come are softer. Beats not yet
// reached are dimmed — and, like everything else here, clickable.
//
// Clicking a sentence rewinds (or fast-forwards) to it: the voice
// restarts at that sentence (its start time in the piece's audio comes
// from sentences.json) and the picture lands where it is said
// (narrationScript.ts pieceLanding). Auto-following pauses as soon as the
// kid scrolls the column by hand and resumes via the 📍 pill.
//
// Kids don't read the text: everything it says is also obvious from the
// animation. The text is for reading along, for grown-ups, and for
// following without sound; the icons are the kids' anchors.

/** one story beat in the transcript (its words come from the script) */
export interface StoryBeat {
  id: string
  /** the chapter heading (icon + English text, translated for display) */
  group: ChapterHeading
  /** the beat's picture-anchor */
  icon: string
  /** what the picture shows but the voice does not say (an equation),
   *  shown under the beat's words */
  extra?: ReactNode
}

export const TimelineColumn = memo(function TimelineColumn({
  beats,
  script,
  lang,
  currentId,
  speakingPiece,
  speakingSentence,
  voiced,
  visible,
  onSeek,
  restartIds,
  resetKey,
}: {
  beats: StoryBeat[]
  /** the narration script shown (the voice's language, or English) */
  script: Record<string, string>
  /** the language of `script` (for the chapter headings) */
  lang: NarrationLang
  currentId: string
  /** the piece of the current beat being said (null = none right now) */
  speakingPiece: number | null
  /** the sentence of that piece being said (null = not known) */
  speakingSentence: number | null
  /** the voice is telling this story: pieces are tracked one by one */
  voiced: boolean
  /** the column is on screen (page shown, Story tab picked) */
  visible: boolean
  /** jump to sentence `sentence` of piece `piece` of beat `id` */
  onSeek: (id: string, piece: number, sentence: number) => void
  /** reaching one of these beats means a fresh run — follow again */
  restartIds: string[]
  /** any change (e.g. another story picked) also follows again */
  resetKey: string
}) {
  const curI = Math.max(
    0,
    beats.findIndex((b) => b.id === currentId),
  )
  const refs = useRef(new Map<string, HTMLDivElement>())
  const rootRef = useRef<HTMLDivElement | null>(null)
  // auto-follow the current beat until the kid scrolls the column by hand
  const [following, setFollowing] = useState(true)
  // the last sentence of the current beat the voice has reached, as
  // piece * 1000 + sentence (so "before" is a plain comparison)
  const [reached, setReached] = useState<{ beat: string; at: number } | null>(null)
  useEffect(() => {
    if (speakingPiece !== null) setReached({ beat: currentId, at: speakingPiece * 1000 + (speakingSentence ?? 0) })
  }, [speakingPiece, speakingSentence, currentId])
  const reachedAt = reached?.beat === currentId ? reached.at : -1

  // a new run (back to the start, or another story) follows again
  useEffect(() => {
    if (restartIds.includes(currentId)) setFollowing(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, resetKey])

  // only REAL user scrolling (wheel, touch, scroll keys, scrollbar drag)
  // pauses following — our own scrollTo calls must not
  useEffect(() => {
    const box = rootRef.current?.closest('[data-story-scroll]') as HTMLElement | null
    if (!box) return
    const stop = () => setFollowing(false)
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) stop()
    }
    const onDown = (e: PointerEvent) => {
      if (e.target === box) stop() // the scrollbar itself
    }
    box.addEventListener('wheel', stop, { passive: true })
    box.addEventListener('touchmove', stop, { passive: true })
    box.addEventListener('keydown', onKey)
    box.addEventListener('pointerdown', onDown)
    return () => {
      box.removeEventListener('wheel', stop)
      box.removeEventListener('touchmove', stop)
      box.removeEventListener('keydown', onKey)
      box.removeEventListener('pointerdown', onDown)
    }
  }, [])

  // pin the current beat to the TOP of the scrolling column (scrolls only
  // that column, never the page). While hidden the layout is all zeros, so
  // wait — and catch up as soon as the column is shown again.
  useEffect(() => {
    if (!following || !visible) return
    const el = refs.current.get(currentId)
    const box = el?.closest('[data-story-scroll]') as HTMLElement | null
    if (!el || !box) return
    const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 4
    // glide between neighbouring beats; snap on big jumps (clicks)
    const far = Math.abs(top - box.scrollTop) > 400
    box.scrollTo({ top, behavior: far ? 'auto' : 'smooth' })
  }, [currentId, following, visible])

  const seek = (id: string, k: number, j: number) => {
    setFollowing(true)
    setReached({ beat: id, at: k * 1000 + j - 1 })
    onSeek(id, k, j)
  }
  const onKey = (e: KeyboardEvent, id: string, k: number, j: number) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    seek(id, k, j)
  }

  let lastGroup = ''
  return (
    <div ref={rootRef}>
      <div className="space-y-1.5 pb-[100vh]">
        <p className="text-xs text-slate-400">Click any sentence to jump there.</p>
        {beats.map((b, i) => {
          const header = b.group !== lastGroup ? chapterHeading(b.group, lang) : null
          lastGroup = b.group
          const state = i < curI ? 'past' : i === curI ? 'now' : 'future'
          const line = script[b.id]
          // per piece, its sentences as shown
          const pieces = line
            ? parseNarrationLine(line).pieces.map((p) => splitSentences(p).map(displayPiece))
            : []
          return (
            <div key={b.id}>
              {header && (
                <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {header}
                </h3>
              )}
              <div
                ref={(el) => {
                  if (el) refs.current.set(b.id, el)
                  else refs.current.delete(b.id)
                }}
                aria-current={state === 'now' ? 'step' : undefined}
                className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 text-sm leading-relaxed transition ${
                  state === 'now'
                    ? 'border-amber-500/70 bg-slate-900/80'
                    : 'border-transparent hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => seek(b.id, 0, 0)}
                  title="Jump to the start of this part"
                  className={`shrink-0 rounded transition hover:scale-110 ${state === 'future' ? 'opacity-50' : ''}`}
                >
                  <span aria-hidden>{b.icon}</span>
                </button>
                <div className="min-w-0">
                  <p>
                    {pieces.flatMap((sentences, k) =>
                      sentences.map((text, j) => {
                        const at = k * 1000 + j
                        const speakingNow =
                          k === speakingPiece && (speakingSentence === null || speakingSentence === j)
                        const look =
                          state === 'past'
                            ? 'text-slate-300'
                            : state === 'future'
                              ? 'text-slate-500'
                              : !voiced
                                ? 'text-amber-100'
                                : speakingNow
                                  ? 'bg-amber-400/20 text-amber-50 shadow-[0_0_0_2px_rgba(251,191,36,0.35)]'
                                  : at <= reachedAt
                                    ? 'text-amber-100'
                                    : 'text-slate-400'
                        return (
                          <span key={at}>
                            {at > 0 && ' '}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => seek(b.id, k, j)}
                              onKeyDown={(e) => onKey(e, b.id, k, j)}
                              className={`cursor-pointer rounded px-0.5 transition-colors hover:bg-slate-700/70 hover:text-slate-100 ${look}`}
                            >
                              {text}
                            </span>
                          </span>
                        )
                      }),
                    )}
                  </p>
                  {b.extra && (
                    <div className={state === 'future' ? 'opacity-50' : state === 'past' ? 'opacity-80' : ''}>
                      {b.extra}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {!following && (
        <button
          type="button"
          onClick={() => setFollowing(true)}
          className="sticky bottom-2 left-0 mx-auto block rounded-full border border-amber-500/70 bg-slate-900/95 px-3 py-1.5 text-sm text-amber-100 shadow-lg shadow-black/40 transition hover:bg-slate-800"
        >
          📍 Back to the current step
        </button>
      )}
    </div>
  )
})

/** a non-spoken equation under a beat's words */
export function Eq({ children }: { children: ReactNode }) {
  return <span className="mt-1 block font-mono text-[12px] text-slate-100">{children}</span>
}
