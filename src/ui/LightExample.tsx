import { memo, useCallback, useState, type ReactNode } from 'react'
import { PageNav } from './PageNav'
import {
  LightStage,
  lightChooserRows,
  lightStoryOrder,
  type LightReport,
  type LightStoryId,
} from '../stage/LightStage'
import { lightCloseupStory } from '../stage/lightCloseup'
import { LIGHT_PHOTO_GROUPS } from '../core/lightPhotos'
import { Paras, SectionHeader, type Para } from './Paras'
import { TimelineColumn, type TimelineItem } from './TimelineColumn'
import { ColorsTable, LightParticleLegend, PhotonStats } from './LightLegend'
import { LightIcon } from './LightIcon'

// R02 — ✨ Light & color: the second "Atoms in action" example. Same page
// anatomy as the bomb demo: info panel (left) — demo canvas with a chooser
// (middle) — story timeline / real photos (right). One story so far
// (🎆 Firework); neon, aurora and the star detective plug in as further
// chooser rows (steps 34b/34c).

const CHOOSER: Para[] = [
  {
    icon: '✨',
    text: 'Fireworks, neon signs, auroras, and the stars themselves — four completely different lights, all made the SAME way: by electrons jumping inside atoms.',
  },
  {
    icon: '👆',
    text: 'Pick a light to watch its story. (Only the firework is ready so far — the others are on their way.)',
  },
]

function rightNow(r: LightReport): Para[] {
  const id = r.storyId
  if (id === 'scene')
    return [
      {
        icon: '🎆',
        text: 'A firework shell races up and bursts. The sparks glow RED and YELLOW — but why exactly these colors? Nobody painted them…',
      },
      { icon: '⏳', text: 'In a moment we dive into one red spark, down to its atoms.' },
    ]
  if (id === 'zoom')
    return [{ icon: '🔍', text: 'Here it comes: zooming into one glowing spark — down to its atoms.' }]
  if (id.startsWith('closeup')) {
    return lightCloseupStory()[Number(id.slice(7))]?.panel ?? []
  }
  if (id === 'barcode')
    return [
      {
        icon: '🌈',
        text: 'Now MANY atoms do the dance at random. Watch the strips below: every photon lands on its own line, and each element\'s fingerprint — its BARCODE — appears all by itself, photon by photon.',
      },
      {
        icon: '🔎',
        text: 'Lithium\'s lines and sodium\'s lines never mix up: an atom can only use its own fixed drops.',
      },
    ]
  return [
    {
      icon: '🎇',
      text: 'Back at the sky: the red stars are lithium atoms, the yellow ones sodium. The colors of a firework were decided inside atoms, long before the fuse was lit.',
    },
    {
      icon: '🧬',
      text: 'And because every element keeps its own barcode, light can tell us what things are made of — even things nobody can touch. That is the star detective\'s trick (coming soon).',
    },
  ]
}

const HOW_IT_WORKS: Para[] = [
  {
    icon: '⚡',
    text: 'Atoms can swallow energy — from heat (a firework), from electricity (a neon sign), or from a crash (an aurora).',
  },
  {
    icon: '⬆️',
    text: 'The energy kicks an electron UP, onto a higher-energy seat. Every atom has its own FIXED seats, like rungs of a ladder — there is nothing in between.',
  },
  {
    icon: '⬇️',
    text: 'The electron cannot stay up there. It falls back home, and the energy leaves as a PHOTON — a little piece of light.',
  },
  {
    icon: '🌈',
    text: 'The photon\'s color IS the size of the drop: small drop → red, bigger drop → blue. (A far bigger drop makes invisible light: ultraviolet, X-rays, γ rays.)',
  },
  {
    icon: '🧬',
    text: 'Fixed steps → fixed colors → every element has its own color fingerprint, a barcode. That colors fireworks — and lets us read what faraway stars are made of.',
  },
]

const HONEST: Para[] = [
  {
    icon: '🐢',
    text: 'Super slow motion: a real jump-and-fall takes about a billionth of a second.',
  },
  {
    icon: '🪜',
    text: 'The ladder shows only a few of the atom\'s many energy steps, and the dashed ring is a helper picture — the real seats are subshells, which you can meet in the builder\'s orbitals view.',
  },
  {
    icon: '🌊',
    text: 'A photon is not really a wavy line — the wiggle is our symbol for light (more wiggles = more energy). It is the same symbol as the bomb demo\'s violet γ rays: those are photons too, just from a MUCH bigger drop.',
  },
  {
    icon: '🎆',
    text: 'We chose lithium and sodium because their firework colors really do come from lone atoms. Strontium red, barium green and copper blue mostly come from small MOLECULES glowing in the flame — same idea, but it would be cheating to draw them as single atoms.',
  },
  {
    icon: '📏',
    text: 'Atoms, photons and the barcode strips are not drawn to one shared scale.',
  },
]

const TRUE_STORY: Para[] = [
  {
    icon: '🔭',
    text: 'In 1814 Joseph Fraunhofer found dark lines in the Sun\'s rainbow — the first light barcode anyone ever read.',
  },
  {
    icon: '☀️',
    text: 'In 1868 a line in the Sun\'s light matched NO known element. The new element was named helium, after the Sun — and was found on Earth only 27 years later. Today it fills party balloons.',
  },
  {
    icon: '🌌',
    text: 'Every element we list for faraway stars and galaxies was identified exactly this way. Nobody has ever brought back a single drop of a star.',
  },
]

const STORY_NAMES: Record<LightStoryId, string> = {
  firework: 'Firework',
  neon: 'Neon sign',
  aurora: 'Aurora',
  star: 'Star detective',
}

function timelineItems(story: LightStoryId): TimelineItem[] {
  const fire = '🎆 The firework'
  const close = lightCloseupStory()
  const texts: Record<string, TimelineItem> = {
    scene: {
      id: 'scene',
      group: fire,
      icon: '🎆',
      title: 'The night sky',
      text: 'A shell races up and bursts into red and yellow sparks. Every spark is a crowd of glowing-hot atoms.',
    },
    zoom: {
      id: 'zoom',
      group: fire,
      icon: '🔍',
      title: 'Into one spark',
      text: 'We dive into one red spark, down to its atoms.',
    },
    barcode: {
      id: 'barcode',
      group: '🌈 The barcode',
      icon: '🌈',
      title: 'Every photon counts',
      text: 'Many atoms flash at random. Each photon lands on its own line — the element\'s fingerprint appears by itself.',
    },
    payoff: {
      id: 'payoff',
      group: '🎇 The payoff',
      icon: '🎇',
      title: 'Colors decided inside atoms',
      text: 'Back at the sky: the red stars are lithium, the yellow ones sodium. No other atom can make exactly these colors.',
    },
  }
  return lightStoryOrder(story).map((id) => {
    if (id.startsWith('closeup')) {
      const st = close[Number(id.slice(7))]
      return {
        id,
        group: '🔍 Close-up: one atom making light',
        icon: st.icon,
        title: st.title,
        text: st.caption,
      }
    }
    return texts[id]
  })
}

const initialReport: LightReport = {
  phase: 'scene',
  storyId: 'scene',
  closeupStep: 0,
  liCaught: 0,
  naCaught: 0,
}

export function LightExample({ active, tabs }: { active: boolean; tabs: ReactNode }) {
  // null = the lineup chooser
  const [story, setStory] = useState<LightStoryId | null>(null)
  const [paused, setPaused] = useState(false)
  const choose = (id: LightStoryId | null) => {
    setStory(id)
    setPaused(false)
  }
  const onFinished = useCallback(() => {
    setStory(null)
    setPaused(false)
  }, [])
  const [seek, setSeek] = useState<{ id: string; n: number } | null>(null)
  const [rightTab, setRightTab] = useState<'story' | 'photos'>('story')
  const [report, setReport] = useState<LightReport>(initialReport)
  const onSeek = useCallback((id: string) => setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1 })), [])
  const running = story !== null

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: nav + info panel */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300">
          <SectionHeader first>Right now</SectionHeader>
          {story === null ? (
            <Paras items={CHOOSER} className="text-slate-200" />
          ) : (
            <>
              <Paras items={rightNow(report)} className="text-slate-200" />
              <PhotonStats r={report} />
              <SectionHeader>What the dots mean</SectionHeader>
              <LightParticleLegend />
            </>
          )}
          <SectionHeader>The colors themselves</SectionHeader>
          <ColorsTable current={story === 'firework' ? ['li', 'na'] : undefined} />
          <SectionHeader>How it works</SectionHeader>
          <Paras items={HOW_IT_WORKS} />
          <SectionHeader>Honest notes</SectionHeader>
          <Paras items={HONEST} className="text-slate-400" />
          <SectionHeader>A true story</SectionHeader>
          <Paras items={TRUE_STORY} />
        </div>
      </div>

      {/* middle: example switcher + chooser button + demo canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {tabs}
          <button
            type="button"
            onClick={() => choose(null)}
            disabled={!running}
            aria-current={running ? undefined : 'page'}
            title="Go to the light selection screen"
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
              running
                ? 'border-sky-500/70 bg-slate-800/80 text-sky-100 hover:bg-sky-600 hover:text-white'
                : 'cursor-default border-slate-700 bg-sky-600 text-white'
            }`}
          >
            <LightIcon className="h-7 w-11 shrink-0" />
            {running ? 'Choose another light' : 'Choose a light'}
          </button>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <LightStage
            story={story}
            paused={paused}
            seek={seek}
            active={active}
            onReport={setReport}
            onFinished={onFinished}
          />
          {story === null && <Chooser onChoose={choose} />}
          {running && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm transition ${
                paused
                  ? 'border-sky-400 bg-sky-600 text-white hover:bg-sky-500'
                  : 'border-slate-600 bg-slate-800/85 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
        </div>
      </div>

      {/* right: the story timeline, or the real photos */}
      <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-2">
        <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm">
          {(
            [
              ['story', '📖 Story'],
              ['photos', '📷 Photos'],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRightTab(id)}
              aria-pressed={rightTab === id}
              className={`flex-1 rounded-lg px-3 py-1 transition ${
                rightTab === id
                  ? 'bg-sky-600 font-medium text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
        {/* both stay mounted (scroll positions survive tab switches) */}
        <div
          data-story-scroll
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'story' ? '' : 'hidden'}`}
        >
          {story === null ? (
            <p className="px-1 pt-2 text-sm text-slate-400">
              👈 Pick a light — its story will appear here, step by step.
            </p>
          ) : (
            <TimelineColumn
              items={timelineItems(story)}
              currentId={report.storyId}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
              restartIds={['scene']}
              resetKey={story}
            />
          )}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}
        >
          <LightPhotoPanel story={story} />
        </div>
      </div>
    </div>
  )
}

/** The real photos (right column, Photos tab); the current story's are
 *  highlighted. Memoised: it only changes when the story does. */
const LightPhotoPanel = memo(function LightPhotoPanel({ story }: { story: LightStoryId | null }) {
  return (
    <>
      {LIGHT_PHOTO_GROUPS.map((group, gi) => (
        <section key={group.title} className={gi === 0 ? '' : 'mt-4'}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.title}
          </h2>
          <div className="space-y-3">
            {group.photos.map((ph) => (
              <figure
                key={ph.file}
                className={`rounded-xl border p-2 transition ${
                  ph.story === story
                    ? 'border-amber-500/60 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800/40'
                }`}
              >
                <img
                  src={`${import.meta.env.BASE_URL}examples/${ph.file}`}
                  alt={ph.caption}
                  loading="lazy"
                  className={`w-full rounded-lg border border-slate-700 ${
                    ph.tall ? 'h-72 bg-black object-contain' : 'bg-black object-contain'
                  }`}
                />
                <figcaption className="mt-1">
                  <div className="text-sm leading-snug text-slate-200">{ph.caption}</div>
                  <div className="text-[9px] text-slate-500">
                    <a
                      href={ph.source}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-slate-300"
                    >
                      {ph.creator}
                    </a>{' '}
                    ({ph.license})
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </>
  )
})

/** Click targets over the canvas lineup: each ready story is one big button
 *  ("▶ Watch it"); the rest are dimmed "coming soon" rows. */
function Chooser({ onChoose }: { onChoose: (id: LightStoryId) => void }) {
  const rows = lightChooserRows()
  return (
    <>
      {rows.map((r) =>
        r.ready ? (
          <button
            key={r.id}
            type="button"
            onClick={() => onChoose(r.id)}
            aria-label={`Watch ${STORY_NAMES[r.id]}`}
            className="group absolute rounded-xl border border-slate-700/0 transition hover:border-sky-400/70 hover:bg-sky-400/10 focus-visible:border-sky-400 focus-visible:outline-none"
            style={{ left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top }}
          >
            <span className="absolute right-3 top-1.5 rounded-full bg-sky-600 px-3 py-1 text-sm font-semibold text-white shadow-md shadow-black/40 transition group-hover:scale-105 group-hover:bg-sky-500">
              ▶ Watch it
            </span>
          </button>
        ) : (
          <div
            key={r.id}
            aria-hidden
            className="absolute rounded-xl"
            style={{ left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top }}
          >
            <span className="absolute right-3 top-1.5 rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1 text-sm text-slate-400">
              🔜 coming soon
            </span>
          </div>
        ),
      )}
    </>
  )
}
