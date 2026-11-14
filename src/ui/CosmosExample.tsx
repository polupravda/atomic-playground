import { memo, useCallback, useState, type ReactNode } from 'react'
import { PageNav } from './PageNav'
import {
  CosmosStage,
  cosmosChooserRows,
  cosmosStoryOrder,
  type CosmosJourneyId,
  type CosmosReport,
} from '../stage/CosmosStage'
import { sunCloseupStory } from '../stage/sunStory'
import {
  PHOTON_ESCAPE_YEARS,
  SUN_LIGHTER_TONNES_PER_S,
  SUN_RECIPE,
  sunMassDefectFraction,
} from '../core/cosmos'
import { COSMOS_PHOTO_GROUPS } from '../core/cosmosPhotos'
import { Paras, SectionHeader, type Para } from './Paras'
import { TimelineColumn, type TimelineItem } from './TimelineColumn'

// R04 — 🌟 Cosmic origins: the third "Atoms in action" example. Same page
// anatomy as the bomb and light demos. One journey so far: ☀️ Why the Sun
// shines (and WHAT it is made of — the recipe beat); star stuff and gold
// plug in as further chooser rows (steps 36b/36c, to be asked first).

const CHOOSER: Para[] = [
  {
    icon: '🌟',
    text: 'Where atoms COME from: the Sun turning hydrogen into helium and sunshine, the star dust you are made of, and the collisions that forged gold.',
  },
  {
    icon: '👆',
    text: 'Pick a journey. (Only the Sun\'s is ready so far — the others are on their way.)',
  },
]

const defectPct = (sunMassDefectFraction() * 100).toFixed(1)

function rightNow(r: CosmosReport): Para[] {
  const id = r.storyId
  if (id === 'sun')
    return [
      {
        icon: '☀️',
        text: 'Our star: a ball of glowing gas so big that 109 Earths would fit across it — see the little blue dot, drawn at the same scale.',
      },
      { icon: '⏳', text: 'First question: what is all that glowing stuff MADE of?' },
    ]
  if (id === 'recipe')
    return [
      {
        icon: '🥣',
        text: (
          <>
            The Sun&apos;s recipe, weighed: out of every 100 kg, about{' '}
            <strong className="text-red-300">{SUN_RECIPE[0].massPct} kg is hydrogen</strong> — the
            smallest, simplest atom — <strong className="text-amber-300">{SUN_RECIPE[1].massPct} kg
            helium</strong>, and only {SUN_RECIPE[2].massPct} kg of everything else together.
          </>
        ),
      },
      {
        icon: '🔎',
        text: 'How can anyone know that? Nobody has ever scooped up a spoonful of Sun. The answer is under the bar: the Sun\'s BARCODE. Its own outer gas eats exactly hydrogen\'s and helium\'s colors out of the sunlight — the dark lines are the ingredients\' signatures.',
      },
      {
        icon: '⏳',
        text: 'Counted by atoms instead of weighed, hydrogen is even more dominant: about 9 of every 10 atoms in the Sun are hydrogen. Next: what all that hydrogen is FOR.',
      },
    ]
  if (id === 'zoom')
    return [
      {
        icon: '🔍',
        text: 'Diving into the core: 15 million degrees, squeezed by the weight of the whole Sun. Gravity does here what the explosives did in the hydrogen bomb — only gently, and forever.',
      },
    ]
  if (id.startsWith('closeup')) {
    return sunCloseupStory()[Number(id.slice(7))]?.panel ?? []
  }
  if (id === 'scale')
    return [
      {
        icon: '⚖️',
        text: `Weigh the trade: the FOUR hydrogens that went in are heavier than the ONE helium that came out — about ${defectPct}% of the mass is missing. It didn't get lost: it left as light.`,
      },
      {
        icon: '🌞',
        text: `The Sun pays this toll everywhere in its core, all the time: it gets about ${(SUN_LIGHTER_TONNES_PER_S / 1e6).toLocaleString('en-US')} million tonnes lighter every second — and that missing weight IS the sunshine. (Scientists write this little fact as E = mc².)`,
      },
    ]
  if (id === 'walk')
    return [
      {
        icon: '🥾',
        text: `A newborn photon can't just leave: the core is so crowded that it bounces off something every tiny step. Getting OUT takes about ${PHOTON_ESCAPE_YEARS.toLocaleString('en-US')} years of zigzag.`,
      },
      {
        icon: '🚀',
        text: 'Then space is empty — the last 150 million kilometres to your face take just 8 minutes. Today\'s sunshine was made before the last ice age.',
      },
    ]
  return [
    {
      icon: '⛰️',
      text: 'The energy valley: every nucleus wants to roll downhill. Small ones roll down by JOINING — that is the Sun. Huge ones roll down by SPLITTING — that is the atomic-bomb demo. Both release energy, from opposite slopes of ONE hill.',
    },
    {
      icon: '🧲',
      text: 'Iron sits at the very bottom: joining it costs energy, splitting it costs energy. Iron is the ash of the universe — and why every star\'s furnace eventually goes out.',
    },
  ]
}

const HOW_IT_WORKS: Para[] = [
  {
    icon: '🥣',
    text: 'The Sun is mostly hydrogen (73 kg of every 100), some helium (25 kg), and a pinch of everything else. We read the recipe from its light — the dark-line barcode.',
  },
  {
    icon: '🔥',
    text: 'Its core is 15 million degrees and monstrously squeezed. Bare hydrogen nuclei crash all day; the rare PERFECT crash sticks.',
  },
  {
    icon: '🤝',
    text: 'In three steps, four hydrogens become one helium: p+p → deuterium (+ a positron and a neutrino), +p → helium-3 (+ γ), and two helium-3 → helium-4 + two protons back.',
  },
  {
    icon: '⚖️',
    text: 'The helium weighs 0.7% LESS than the hydrogens that made it. The missing mass leaves as light — that is why the Sun shines.',
  },
  {
    icon: '⛰️',
    text: 'Joining small nuclei releases energy (fusion); splitting huge ones does too (fission, the bomb demo). Iron is the bottom of the hill — the fire stops there.',
  },
]

const HONEST: Para[] = [
  {
    icon: '🐢',
    text: 'Slowed down beyond imagining: a single proton in the core waits, on average, BILLIONS of years for its lucky crash. We showed you the lucky one.',
  },
  {
    icon: '👻',
    text: 'The neutrino is real and drawn barely-there on purpose: trillions fly through your body every second and almost never touch an atom.',
  },
  {
    icon: '🪜',
    text: 'The Sun also uses helper recipes (bigger stars run a carbon-powered cycle); we show the main one, which makes most of the Sun\'s energy.',
  },
  {
    icon: '🥣',
    text: 'The recipe bar is by WEIGHT, rounded. Counted by atoms, hydrogen is ~92%. And the recipe is the whole Sun\'s: the core, after 4.6 billion years of burning, is already about half helium.',
  },
  {
    icon: '📏',
    text: 'The Sun, Earth, nuclei, the photon\'s zigzag and the valley chart are not on one shared scale — except where the picture says so (Earth next to the Sun really is to scale).',
  },
  {
    icon: '⚖️',
    text: 'The scale beat shows mass "turning into" light; really mass and energy are two faces of the same thing — that is all E = mc² says.',
  },
]

const TRUE_STORY: Para[] = [
  {
    icon: '🔭',
    text: 'In 1925 Cecilia Payne proved the Sun is mostly hydrogen — by reading its light barcode (the exact trick from the ✨ Light & color demo and the 💡 Light lab). Almost nobody believed her at first. She was right.',
  },
  {
    icon: '🎈',
    text: 'Helium is named after the Sun (helios): it was found in the Sun\'s barcode in 1868, 27 years before anyone found it on Earth. Today it fills party balloons.',
  },
  {
    icon: '🧒',
    text: '"We are made of star-stuff" — Carl Sagan. That journey is this demo\'s next story.',
  },
]

const JOURNEY_NAMES: Record<CosmosJourneyId, string> = {
  sun: 'Why the Sun shines',
  stardust: 'You are star stuff',
  gold: 'Where gold comes from',
}

function timelineItems(journey: CosmosJourneyId): TimelineItem[] {
  const close = sunCloseupStory()
  const eq = (s: string) => (
    <span className="mt-1 block font-mono text-[12px] text-slate-100">{s}</span>
  )
  const texts: Record<string, TimelineItem> = {
    sun: {
      id: 'sun',
      group: '☀️ Our star',
      icon: '☀️',
      title: 'The Sun',
      text: 'A ball of glowing gas, 109 Earths wide — see Earth beside it, drawn to scale.',
    },
    recipe: {
      id: 'recipe',
      group: '☀️ Our star',
      icon: '🥣',
      title: 'What it is made of',
      text: 'Out of every 100 kg: 73 kg hydrogen, 25 kg helium, 2 kg everything else. The proof: the dark lines in the Sun\'s own light.',
    },
    zoom: {
      id: 'zoom',
      group: '🔍 Into the core',
      icon: '🔍',
      title: 'Diving in',
      text: '15 million degrees, squeezed by the weight of the whole Sun.',
    },
    scale: {
      id: 'scale',
      group: '⚖️ The missing mass',
      icon: '⚖️',
      title: '4 in, 1 out — lighter!',
      text: `The helium weighs ${defectPct}% less than the four hydrogens. The missing bit left as LIGHT.`,
    },
    walk: {
      id: 'walk',
      group: '🥾 The long way out',
      icon: '🥾',
      title: '100,000 years, then 8 minutes',
      text: 'The newborn photon zigzags out of the crowded Sun for ages — then crosses empty space to Earth in 8 minutes.',
    },
    valley: {
      id: 'valley',
      group: '⛰️ The payoff',
      icon: '⛰️',
      title: 'The energy valley',
      text: 'Joining rolls down one slope (the Sun), splitting down the other (the bomb demo). Iron sits at the bottom.',
    },
  }
  return cosmosStoryOrder(journey).map((id) => {
    if (id.startsWith('closeup')) {
      const st = close[Number(id.slice(7))]
      return {
        id,
        group: '🔍 Into the core',
        icon: st.icon,
        title: st.title,
        text: (
          <>
            {st.caption}
            {eq(st.equation)}
          </>
        ),
      }
    }
    return texts[id]
  })
}

const initialReport: CosmosReport = { phase: 'sun', storyId: 'sun', closeupStep: 0 }

export function CosmosExample({ active, tabs }: { active: boolean; tabs: ReactNode }) {
  // null = the lineup chooser
  const [journey, setJourney] = useState<CosmosJourneyId | null>(null)
  const [paused, setPaused] = useState(false)
  const choose = (id: CosmosJourneyId | null) => {
    setJourney(id)
    setPaused(false)
  }
  const onFinished = useCallback(() => {
    setJourney(null)
    setPaused(false)
  }, [])
  const [seek, setSeek] = useState<{ id: string; n: number } | null>(null)
  const [rightTab, setRightTab] = useState<'story' | 'photos'>('story')
  const [report, setReport] = useState<CosmosReport>(initialReport)
  const onSeek = useCallback((id: string) => setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1 })), [])
  const running = journey !== null

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: nav + info panel */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300">
          <SectionHeader first>Right now</SectionHeader>
          {journey === null ? (
            <Paras items={CHOOSER} className="text-slate-200" />
          ) : (
            <Paras items={rightNow(report)} className="text-slate-200" />
          )}
          <SectionHeader>How it works</SectionHeader>
          <Paras items={HOW_IT_WORKS} />
          <SectionHeader>Honest notes</SectionHeader>
          <Paras items={HONEST} className="text-slate-400" />
          <SectionHeader>A true story</SectionHeader>
          <Paras items={TRUE_STORY} />
        </div>
      </div>

      {/* middle: example switcher + journey chooser button + demo canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          {tabs}
          <button
            type="button"
            onClick={() => choose(null)}
            disabled={!running}
            aria-current={running ? undefined : 'page'}
            title="Go to the journey selection screen"
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
              running
                ? 'border-sky-500/70 bg-slate-800/80 text-sky-100 hover:bg-sky-600 hover:text-white'
                : 'cursor-default border-slate-700 bg-sky-600 text-white'
            }`}
          >
            <span aria-hidden>🌟</span>
            {running ? 'Choose another journey' : 'Choose a journey'}
          </button>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <CosmosStage
            journey={journey}
            paused={paused}
            seek={seek}
            active={active}
            onReport={setReport}
            onFinished={onFinished}
          />
          {journey === null && <Chooser onChoose={choose} />}
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
          {journey === null ? (
            <p className="px-1 pt-2 text-sm text-slate-400">
              👈 Pick a journey — its story will appear here, step by step.
            </p>
          ) : (
            <TimelineColumn
              items={timelineItems(journey)}
              currentId={report.storyId}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
              restartIds={['sun']}
              resetKey={journey}
            />
          )}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}
        >
          <CosmosPhotoPanel />
        </div>
      </div>
    </div>
  )
}

const CosmosPhotoPanel = memo(function CosmosPhotoPanel() {
  return (
    <>
      {COSMOS_PHOTO_GROUPS.map((group, gi) => (
        <section key={group.title} className={gi === 0 ? '' : 'mt-4'}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.title}
          </h2>
          <div className="space-y-3">
            {group.photos.map((ph) => (
              <figure key={ph.file} className="rounded-xl border border-slate-700 bg-slate-800/40 p-2">
                <img
                  src={`${import.meta.env.BASE_URL}examples/${ph.file}`}
                  alt={ph.caption}
                  loading="lazy"
                  className="w-full rounded-lg border border-slate-700 bg-black"
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

/** Click targets over the canvas lineup: each ready journey is one big
 *  button ("▶ Watch it"); the rest are dimmed "coming soon" rows. */
function Chooser({ onChoose }: { onChoose: (id: CosmosJourneyId) => void }) {
  const rows = cosmosChooserRows()
  return (
    <>
      {rows.map((r) =>
        r.ready ? (
          <button
            key={r.id}
            type="button"
            onClick={() => onChoose(r.id)}
            aria-label={`Watch ${JOURNEY_NAMES[r.id]}`}
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
