import { useCallback, useEffect, useRef, useState } from 'react'
import { usePageStore, type ExampleId } from '../state/pageStore'
import { FISSION_H, FISSION_W } from '../stage/FissionStage'
import { LINEUP, drawBombThumb } from '../stage/bombShapes'
import { LIGHT_STORIES, drawMiniScene } from '../stage/LightStage'
import { COSMOS_JOURNEYS, drawCosmosMini } from '../stage/CosmosStage'
import { BOMB_NAMES } from '../core/fission'
import { PLANNED, SIGNALS_STORIES, Thumb, drawThumb, type ThumbId } from './storyThumbs'
import { PageNav } from './PageNav'
import { cancelNarration } from './useNarration'

// 🎬 The stories menu (docs/how-things-work/17-stories-menu.md): every
// story of every topic on ONE canvas-sized screen, as its original chooser
// picture — topic title above each row, one card per story. A card starts
// its story from the first beat; planned stories are dimmed 🔜 cards. The
// way back here: the canvas ← of a story, the 🎬 Stories menu item, or the
// story's end. No right column here: the canvas takes its place.
// A topic's cards wrap onto more rows (five per row from md screens up);
// while more topics are below, the bottom blurs and a ⌄ arrow points down.

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void

interface StoryCard {
  id: string
  label: string
  ready: boolean
  draw: Draw
}

interface Topic {
  example: ExampleId
  title: string
  stories: StoryCard[]
}

/** a card shows a story's name without its icon — the picture is the icon
 *  (the labels keep theirs for the story pages) */
const plainName = (label: string) => label.replace(/^[^\p{L}\p{N}"'«„]+/u, '')

const thumb = (id: ThumbId): Draw => (ctx, w, h) => drawThumb(ctx, id, w, h)

// built topics first, then the planned ones; the drawings are made once
// here, so the cards' canvases never redraw
const TOPICS: Topic[] = [
  {
    example: 'bomb',
    title: '☢️ Atomic bomb',
    stories: LINEUP.map((m) => ({
      id: m,
      label: BOMB_NAMES[m],
      ready: true,
      draw: (ctx, w, h) => drawBombThumb(ctx, m, w, h),
    })),
  },
  {
    example: 'light',
    title: '✨ Light & color',
    stories: LIGHT_STORIES.map((s) => ({
      id: s.id,
      label: s.label,
      ready: s.ready,
      draw: (ctx, w, h) => drawMiniScene(ctx, s.id, 0, 0, w, h, 0),
    })),
  },
  {
    example: 'cosmos',
    title: '🌟 Star stuff',
    stories: COSMOS_JOURNEYS.map((j) => ({
      id: j.id,
      label: j.label,
      ready: j.ready,
      draw: (ctx, w, h) => drawCosmosMini(ctx, j.id, w / 2, h / 2, Math.min(h, w / 1.8)),
    })),
  },
  {
    example: 'plant',
    title: '⚡ Power plant',
    stories: [
      { id: 'story', label: '📖 How a power plant works', ready: true, draw: thumb('plant') },
      { id: 'operator', label: '🕹️ You are the operator', ready: false, draw: thumb('operator') },
    ],
  },
  {
    example: 'lasers',
    title: '🔦 Lasers',
    stories: [
      { id: 'how', label: '🔦 How a laser makes its light', ready: true, draw: thumb('laser-how') },
      { id: 'cut', label: '✂️ Light that cuts', ready: true, draw: thumb('laser-cut') },
      { id: 'moon', label: '🌕 Lasers to the Moon', ready: true, draw: thumb('laser-moon') },
    ],
  },
  {
    example: 'atoms',
    title: '♻️ Atoms never vanish',
    stories: PLANNED.atoms.map((s) => ({ id: s.thumb, label: s.label, ready: false, draw: thumb(s.thumb) })),
  },
  {
    example: 'crystals',
    title: '💎 Crystals',
    stories: PLANNED.crystals.map((s) => ({ id: s.thumb, label: s.label, ready: false, draw: thumb(s.thumb) })),
  },
  {
    example: 'signals',
    title: '📶 Digital information: Wi-Fi, internet, screens',
    stories: SIGNALS_STORIES.map((s) => ({ id: s.id, label: s.label, ready: s.ready, draw: thumb(s.thumb) })),
  },
]

// ---- the grid: a topic's cards wrap onto more rows — five per row on md
// screens and larger (Tailwind's md, 768 px), three below. The card height
// shrinks to fit every card row down to a minimum; below it the menu
// scrolls down (the bottom blur + ⌄ arrow say so) ----
const PAD = 16
const GAP = 10 // between cards
const HEAD_H = 22 // a topic's title line
const ROW_GAP = 10 // between topics
const LABEL_H = 26 // the card's name strip under its picture
// room above each card row for the cards' 1 px hover lift
const LIFT = 2
// the story pages' canvas + the right column it replaces (18rem + the 1.5rem gap)
const HOME_W = FISSION_W + 288 + 24
const COLS = window.matchMedia('(min-width: 768px)').matches ? 5 : 3
// inside: the 1 px border each side, the padding, and room for a classic
// (non-overlay) vertical scrollbar, so the fifth card never wraps
const SCROLLBAR = 16
const CARD_W = Math.floor((HOME_W - 2 - 2 * PAD - SCROLLBAR - (COLS - 1) * GAP) / COLS)
const CARD_ROWS = TOPICS.reduce((n, t) => n + Math.ceil(t.stories.length / COLS), 0)
const CARD_H = Math.max(
  76,
  Math.min(
    170,
    Math.floor(
      (FISSION_H - 2 * PAD - TOPICS.length * HEAD_H - CARD_ROWS * LIFT - (TOPICS.length - 1) * ROW_GAP - (CARD_ROWS - TOPICS.length) * GAP) /
        CARD_ROWS,
    ),
  ),
)
const PIC_H = CARD_H - LABEL_H
const BG = '2, 6, 23' // slate-950, the menu's background

export function StoriesHome() {
  const startStory = usePageStore((s) => s.startStory)
  const scroller = useRef<HTMLDivElement | null>(null)
  const [moreBelow, setMoreBelow] = useState(false)
  const measure = useCallback(() => {
    const el = scroller.current
    if (el) setMoreBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
  }, [])
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])
  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-x-6">
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
      </div>

      {/* every story, one row per topic — the canvas runs to the right edge */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col gap-2">
        <div
          className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
          style={{ width: HOME_W, height: FISSION_H }}
        >
          <div
            ref={scroller}
            onScroll={measure}
            className="h-full overflow-y-auto"
            style={{ padding: PAD }}
          >
            <div className="flex flex-col" style={{ gap: ROW_GAP }}>
              {TOPICS.map((t) => (
                <TopicRow key={t.example} topic={t} startStory={startStory} />
              ))}
            </div>
          </div>
          {/* more topics below: the content blurs and fades out at the
              bottom, and the arrow scrolls down */}
          <div
            aria-hidden={!moreBelow}
            className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-2 transition-opacity duration-300 ${moreBelow ? 'opacity-100' : 'opacity-0'}`}
            style={{
              height: 72,
              background: `linear-gradient(to bottom, rgba(${BG}, 0), rgba(${BG}, 0.92))`,
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              maskImage: 'linear-gradient(to bottom, transparent, black 60%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 60%)',
            }}
          />
          {moreBelow && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
              <button
                type="button"
                aria-label="More stories below"
                onClick={() => scroller.current?.scrollBy({ top: scroller.current.clientHeight * 0.75, behavior: 'smooth' })}
                className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 bg-slate-800/90 text-slate-200 shadow-lg shadow-black/50 transition-colors hover:border-sky-400/70 hover:text-white motion-safe:animate-bounce"
              >
                <Chevron />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** one topic: its title, then its cards, wrapping onto more rows */
function TopicRow({ topic: t, startStory }: { topic: Topic; startStory: (example: ExampleId, id: string) => void }) {
  return (
    <section aria-label={t.title}>
      <h2
        className="flex items-center text-xs font-semibold uppercase tracking-wide text-slate-400"
        style={{ height: HEAD_H }}
      >
        {t.title}
      </h2>
      <div className="flex flex-wrap" style={{ columnGap: GAP, rowGap: GAP + LIFT, paddingTop: LIFT }}>
        {t.stories.map((s) => (
          <Card
            key={s.id}
            story={s}
            onStart={
              s.ready
                ? () => {
                    cancelNarration() // a finished story's last line stops too
                    startStory(t.example, s.id)
                  }
                : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Card({ story, onStart }: { story: StoryCard; onStart?: () => void }) {
  const name = plainName(story.label)
  const body = (
    <>
      <Thumb draw={story.draw} w={CARD_W} h={PIC_H} />
      <span
        className="block truncate px-1.5 text-[13px] font-semibold leading-[26px] text-slate-100"
        style={{ height: LABEL_H }}
      >
        {name}
      </span>
    </>
  )
  if (!onStart)
    return (
      <div
        aria-label={`${name} — coming soon`}
        title={name}
        className="relative shrink-0 overflow-hidden rounded-xl border border-slate-700/90 bg-[#0b1226] opacity-45"
        style={{ width: CARD_W, height: CARD_H }}
      >
        {body}
        <span className="absolute right-2 top-2 rounded-full bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">🔜</span>
      </div>
    )
  return (
    <button
      type="button"
      onClick={onStart}
      aria-label={`Watch ${name}`}
      title={name}
      className="group relative shrink-0 overflow-hidden rounded-xl border border-slate-700/90 bg-[#0b1226] text-left transition hover:-translate-y-px hover:border-sky-400/70 hover:bg-[#0e1a33] focus-visible:border-sky-400 focus-visible:outline-none"
      style={{ width: CARD_W, height: CARD_H }}
    >
      {body}
      <span className="absolute right-2 top-2 rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-md shadow-black/40 transition group-hover:scale-105 group-hover:bg-sky-500">
        ▶
      </span>
    </button>
  )
}
