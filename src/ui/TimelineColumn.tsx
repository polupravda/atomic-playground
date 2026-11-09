import { memo, useEffect, useRef, useState, type ReactNode } from 'react'

// The story-timeline column shared by the "Atoms in action" examples
// (extracted from the R01 StoryTimeline in step 34): every step of one run,
// top to bottom. The current step is highlighted in the amber caption style
// and kept pinned to the top of the scrolling column; clicking a step asks
// the stage to rewind / fast-forward to it. Auto-following pauses as soon as
// the kid scrolls the column by hand and resumes via the 📍 pill.

export interface TimelineItem {
  id: string
  group: string
  icon: string
  title: string
  text: ReactNode
}

export const TimelineColumn = memo(function TimelineColumn({
  items,
  currentId,
  visible,
  onSeek,
  /** reaching one of these steps means a fresh run — follow again */
  restartIds,
  /** any change (e.g. another bomb/story picked) also follows again */
  resetKey,
}: {
  items: TimelineItem[]
  currentId: string
  /** the column is on screen (page shown, Story tab picked) */
  visible: boolean
  onSeek: (id: string) => void
  restartIds: string[]
  resetKey: string
}) {
  const curI = Math.max(
    0,
    items.findIndex((it) => it.id === currentId),
  )
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const rootRef = useRef<HTMLDivElement | null>(null)
  // auto-follow the current step until the kid scrolls the column by hand
  const [following, setFollowing] = useState(true)

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
    const onKey = (e: KeyboardEvent) => {
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

  // pin the current step to the TOP of the scrolling column (scrolls only
  // that column, never the page). While hidden the layout is all zeros, so
  // wait — and catch up as soon as the column is shown again.
  useEffect(() => {
    if (!following || !visible) return
    const el = refs.current.get(currentId)
    const box = el?.closest('[data-story-scroll]') as HTMLElement | null
    if (!el || !box) return
    const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 4
    // glide between neighbouring steps; snap on big jumps (timeline clicks)
    const far = Math.abs(top - box.scrollTop) > 400
    box.scrollTo({ top, behavior: far ? 'auto' : 'smooth' })
  }, [currentId, following, visible])

  let lastGroup = ''
  return (
    <div ref={rootRef}>
      <div className="space-y-1.5 pb-[100vh]">
        <p className="text-xs text-slate-400">Click any step to jump there.</p>
        {items.map((it, i) => {
          const header = it.group !== lastGroup ? it.group : null
          lastGroup = it.group
          const state = i < curI ? 'past' : i === curI ? 'now' : 'future'
          return (
            <div key={it.id}>
              {header && (
                <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {header}
                </h3>
              )}
              <button
                ref={(el) => {
                  if (el) refs.current.set(it.id, el)
                  else refs.current.delete(it.id)
                }}
                type="button"
                onClick={() => {
                  setFollowing(true)
                  onSeek(it.id)
                }}
                aria-current={state === 'now' ? 'step' : undefined}
                className={`flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left text-sm leading-snug transition ${
                  state === 'now'
                    ? 'border-amber-500/70 bg-slate-900/80 text-amber-100'
                    : state === 'past'
                      ? 'border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800/60'
                      : 'border-transparent text-slate-500 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-300'
                }`}
              >
                <span aria-hidden className="shrink-0">
                  {it.icon}
                </span>
                <span>
                  <span className="block font-medium">{it.title}</span>
                  <span className="block text-[13px]">{it.text}</span>
                </span>
              </button>
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
