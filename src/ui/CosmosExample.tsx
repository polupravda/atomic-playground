import { memo, useCallback, useState } from 'react'
import { PageNav } from './PageNav'
import {
  CosmosStage,
  cosmosChooserRows,
  cosmosStoryOrder,
  type CosmosJourneyId,
  type CosmosReport,
} from '../stage/CosmosStage'
import { sunCloseupStory } from '../stage/sunStory'
import { forgeStory } from '../stage/stardustStory'
import { STARDUST_SCRIPTS } from '../stage/stardustNarration'
import { SUN_SCRIPTS } from '../stage/sunNarration'
import { DETECTIVE_SCRIPTS } from '../stage/detectiveNarration'
import { cancelNarration, useDemoNarration } from './useNarration'
import { NarrationNotice } from './NarrationNotice'
import { DemoControls, INFO_PANEL } from './DemoControls'
import type { NarrationLang } from '../state/voiceStore'
import { sunMassDefectFraction } from '../core/cosmos'
import {
  COSMOS_PHOTO_GROUPS,
  STARDUST_PHOTO_GROUPS,
  type CosmosPhotoGroup,
} from '../core/cosmosPhotos'
import { Paras, SectionHeader, type Para } from './Paras'
import { TimelineColumn, type TimelineItem } from './TimelineColumn'
import { FLAT, KEY, TRAY } from './surfaces'

// R04 — 🌟 Cosmic origins: the third "Atoms in action" example. Same page
// anatomy as the bomb and light demos. One journey so far: ☀️ Why the Sun
// shines (and WHAT it is made of — the recipe beat); star stuff and gold
// plug in as further chooser rows (steps 36b/36c, to be asked first).

const defectPct = (sunMassDefectFraction() * 100).toFixed(1)

/** each journey's narration scripts, per language (gold: not yet) */
const NARRATION: Partial<
  Record<CosmosJourneyId, Partial<Record<NarrationLang, Record<string, string>>>>
> = {
  detective: DETECTIVE_SCRIPTS,
  stardust: STARDUST_SCRIPTS,
  sun: SUN_SCRIPTS,
}

// 🔭 star detective — the info panel
const HOW_DETECTIVE: Para[] = [
  {
    icon: '🌈',
    text: 'A prism (or a fine grating) spreads light into its colors — a spectrum. Starlight makes a rainbow with thin DARK lines in it.',
  },
  {
    icon: '🫧',
    text: 'The dark lines come from the thin gas around the star: its atoms catch exactly the colors their electrons can jump UP with — the firework\'s jump, run the other way.',
  },
  {
    icon: '🔍',
    text: 'Every element catches its own set of colors — its barcode. Hold an element\'s barcode under the star\'s rainbow: if its lines sit on dark lines, the star contains it.',
  },
  {
    icon: '🧪',
    text: 'A suspect that doesn\'t fit is ruled out. That is how we know what stars are made of without ever going there.',
  },
]

const HONEST_DETECTIVE: Para[] = [
  {
    icon: '⭐',
    text: 'The star is a hot blue-white one, like Spica: those really show strong hydrogen AND helium lines. A star like our Sun shows thousands of lines (iron, sodium, calcium…); we keep just two elements.',
  },
  {
    icon: '🌈',
    text: 'Real dark lines differ in strength and width; ours are all drawn the same, and only visible light is shown.',
  },
  {
    icon: '☀️',
    text: 'In 1868 the yellow helium line was seen BRIGHT, in the glowing gas at the Sun\'s edge during an eclipse — the same fingerprint, seen glowing instead of missing.',
  },
  {
    icon: '🫧',
    text: 'The atoms and photons in the "why" scene are storybook-sized; a caught photon\'s energy is soon sent out again — but in any direction, so very little of that color reaches us.',
  },
]

const TRUE_DETECTIVE: Para[] = [
  {
    icon: '🌑',
    text: 'On 18 August 1868, during a total eclipse seen from India, Jules Janssen saw a bright yellow line in the Sun\'s light. Norman Lockyer realised no known element made it and named it helium, after helios — the Sun.',
  },
  {
    icon: '🎈',
    text: 'Helium was only found on Earth in 1895, by William Ramsay, 27 years later. Today it fills party balloons — an element discovered in the sky first.',
  },
  {
    icon: '📐',
    text: 'In 1814 Joseph von Fraunhofer mapped hundreds of dark lines in sunlight. The photo panel shows them — the Sun\'s barcode.',
  },
]

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

const HOW_STARDUST: Para[] = [
  {
    icon: '🏭',
    text: 'Stars are element factories. When a big star\'s hydrogen is spent, its core gets hot enough to burn the ash: helium fuses into carbon (and later oxygen and more).',
  },
  {
    icon: '💎',
    text: 'Three heliums → one carbon: 4 + 4 + 4 = 12 nucleons, 2 + 2 + 2 = 6 protons — and six protons IS carbon, the builder\'s first lesson.',
  },
  {
    icon: '💥',
    text: 'When the star dies — explosively or gently — its atoms are sown into space as a glowing cloud.',
  },
  {
    icon: '🌍',
    text: 'New stars and planets curdle out of old stars\' dust. The Sun and Earth are second-hand.',
  },
  {
    icon: '♻️',
    text: 'On a living planet the atoms keep moving: volcano → air → leaf → food → you. Your body borrows star-made atoms and passes them on.',
  },
]

const HONEST_STARDUST: Para[] = [
  {
    icon: '🎯',
    text: 'The marked atom\'s path is a STORY, not a record — no one can trace one real atom. But every carbon atom in you really did travel some road like this.',
  },
  {
    icon: '🌬️',
    text: 'Much of the universe\'s carbon leaves smaller stars gently (a puffed-off glowing shell), not in a supernova. We show the dramatic road; both are real.',
  },
  {
    icon: '⏱️',
    text: 'The journey squeezes billions of years into a minute — the drift alone took longer than the Earth has existed.',
  },
  {
    icon: '🤏',
    text: 'Beryllium-8\'s "blink of an eye" is real physics: it survives about a billionth of a billionth of a second, and the universe\'s whole carbon supply squeezes through that blink.',
  },
  {
    icon: '📏',
    text: 'Stars, nebulas, planets, molecules and the kid are drawn at storybook scale, not a shared one.',
  },
]

const TRUE_STARDUST: Para[] = [
  {
    icon: '🧒',
    text: '"We are made of star-stuff" — Carl Sagan\'s famous line. This story is that line, checked and drawn.',
  },
  {
    icon: '🔮',
    text: 'In 1953 Fred Hoyle PREDICTED that carbon must have a special energy state — otherwise the triple-helium trick could never work and we could not exist. The state was found that same year, exactly where he said.',
  },
  {
    icon: '👀',
    text: 'In 1054, people in China and Japan watched a "guest star" blaze for weeks. Its wreck is the Crab Nebula in the 📷 panel — a star\'s atoms, still flying.',
  },
]

const JOURNEY_NAMES: Record<CosmosJourneyId, string> = {
  detective: 'Star detective',
  sun: 'Why the Sun shines',
  stardust: 'You are star stuff',
  gold: 'Where gold comes from',
}

const DETECTIVE_STEPS: Record<string, TimelineItem> = {
  star: { id: 'star', group: '🔭 Looking up', icon: '⭐', title: 'A far-away star', text: 'Too far to ever visit. But its light comes to us — a telescope catches it.' },
  prism: { id: 'prism', group: '🔭 Looking up', icon: '🌈', title: 'A rainbow with gaps', text: 'A prism spreads the light into a spectrum. Some colors are missing: thin dark lines.' },
  catch: { id: 'catch', group: '🫧 Why the gaps', icon: '🫧', title: 'Atoms catch their colors', text: 'The star\'s thin outer gas swallows exactly the colors its atoms glow with. Those never reach us.' },
  hydrogen: { id: 'hydrogen', group: '🔍 Detective work', icon: '✅', title: 'Hydrogen? It fits!', text: 'Hydrogen\'s barcode lines up with dark lines: the star contains hydrogen.' },
  oxygen: { id: 'oxygen', group: '🔍 Detective work', icon: '❌', title: 'Oxygen? No match', text: 'Its lines land where the rainbow is bright: ruled out.' },
  helium: { id: 'helium', group: '🔍 Detective work', icon: '✅', title: 'Helium! Case closed', text: 'Helium explains the last dark lines. Light told us what the star is made of.' },
  discovery: { id: 'discovery', group: '🎈 The payoff', icon: '🎈', title: 'Found in the Sun first', text: 'In 1868 a new yellow line in the Sun\'s light: helium, named after helios, the Sun — found on Earth only in 1895.' },
}

function timelineItems(journey: CosmosJourneyId): TimelineItem[] {
  if (journey === 'detective') return cosmosStoryOrder(journey).map((id) => DETECTIVE_STEPS[id])
  const eq = (s: string) => (
    <span className="mt-1 block font-mono text-[12px] text-slate-100">{s}</span>
  )
  if (journey === 'stardust') {
    const forge = forgeStory()
    const texts: Record<string, TimelineItem> = {
      giant: {
        id: 'giant',
        group: '🔴 An old star',
        icon: '🔴',
        title: 'Long before the Sun',
        text: 'A giant star, its hydrogen already spent. Its core burns helium now.',
      },
      zoom: {
        id: 'zoom',
        group: '🔥 The forge',
        icon: '🔍',
        title: 'Into its core',
        text: 'Over 100 million degrees — hot enough to fuse helium itself.',
      },
      boom: {
        id: 'boom',
        group: '💥 Set free',
        icon: '💥',
        title: 'Supernova',
        text: 'The star explodes and sows its atoms into space. Our carbon rides the blast wave.',
      },
      drift: {
        id: 'drift',
        group: '🌫️ Adrift',
        icon: '🌫️',
        title: 'Millions of years pass',
        text: 'The atoms drift as a glowing nebula. Nothing happens, beautifully, for ages.',
      },
      earth: {
        id: 'earth',
        group: '🌍 A new world',
        icon: '🌍',
        title: 'The Sun and Earth are born',
        text: 'The cloud curdles: a new star lights up, dust clumps into planets — our atom lands in the third one.',
      },
      alive: {
        id: 'alive',
        group: '♻️ Alive',
        icon: '🌋',
        title: 'Volcano → leaf → kid',
        text: 'A volcano breathes the carbon out as CO₂, a leaf keeps it, an apple grows — and gets eaten.',
      },
      you: {
        id: 'you',
        group: '🧒 The payoff',
        icon: '🧒',
        title: 'You are star stuff',
        text: 'Almost every atom in you was made inside a star. The hydrogen is from the Big Bang itself.',
      },
    }
    return cosmosStoryOrder(journey).map((id) => {
      if (id.startsWith('forge')) {
        const st = forge[Number(id.slice(5))]
        return {
          id,
          group: '🔥 The forge',
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
  const close = sunCloseupStory()
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

export function CosmosExample({ active }: { active: boolean }) {
  // null = the lineup chooser
  const [journey, setJourney] = useState<CosmosJourneyId | null>(null)
  const [paused, setPaused] = useState(false)
  const choose = (id: CosmosJourneyId | null) => {
    cancelNarration() // navigating is a deliberate interruption
    setJourney(id)
    setPaused(false)
  }
  // the auto-return to the chooser does NOT cancel: the payoff line may finish
  const onFinished = useCallback(() => {
    setJourney(null)
    setPaused(false)
  }, [])
  const [seek, setSeek] = useState<{ id: string; n: number } | null>(null)
  const [rightTab, setRightTab] = useState<'story' | 'photos'>('story')
  const [report, setReport] = useState<CosmosReport>(initialReport)
  const onSeek = useCallback((id: string) => {
    cancelNarration()
    setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1 }))
  }, [])
  const running = journey !== null

  // 🔊 narration: the storyteller voice follows the on-screen beats; while
  // it talks the animation holds in slow motion — listen first, then watch
  // (docs/how-things-work/10-narration-strategy.md)
  const narration = useDemoNarration({
    storyKey: journey,
    beatId: report.storyId,
    scripts: journey ? (NARRATION[journey] ?? null) : null,
    active,
    paused,
  })

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: nav + info panel */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
        <DemoControls
          chooser={
            <button
              type="button"
              onClick={() => choose(null)}
              disabled={!running}
              aria-current={running ? undefined : 'page'}
              title="Go to the journey selection screen"
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-medium ${
                running ? `text-slate-100 ${KEY}` : 'cursor-default rounded-lg bg-sky-600 text-white'
              }`}
            >
              <span aria-hidden>🌟</span>
              {running ? 'Choose another journey' : 'Choose a journey'}
            </button>
          }
        />
        <div className={INFO_PANEL}>
          <SectionHeader>How it works</SectionHeader>
          <Paras items={journey === 'stardust' ? HOW_STARDUST : journey === 'detective' ? HOW_DETECTIVE : HOW_IT_WORKS} />
          <SectionHeader>Honest notes</SectionHeader>
          <Paras
            items={journey === 'stardust' ? HONEST_STARDUST : journey === 'detective' ? HONEST_DETECTIVE : HONEST}
            className="text-slate-400"
          />
          <SectionHeader>A true story</SectionHeader>
          <Paras items={journey === 'stardust' ? TRUE_STARDUST : journey === 'detective' ? TRUE_DETECTIVE : TRUE_STORY} />
        </div>
      </div>

      {/* middle: the demo canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <CosmosStage
            journey={journey}
            paused={paused}
            seek={seek}
            active={active}
            timeScale={narration.timeScale}
            holdBeat={narration.holdBeat}
            fit={narration.fit}
            onReport={setReport}
            onFinished={onFinished}
          />
          {journey === null && <Chooser onChoose={choose} />}
          <NarrationNotice failed={narration.failed} missingLang={narration.missingLang} />
          {running && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 text-sm ${
                paused
                  ? 'rounded-xl border border-sky-400 bg-sky-600 text-white transition hover:bg-sky-500'
                  : `text-slate-200 ${KEY}`
              }`}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
        </div>
      </div>

      {/* right: the story timeline, or the real photos */}
      <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-2">
        <div className={`flex gap-1 p-1 text-sm ${TRAY}`}>
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
              restartIds={['sun', 'giant', 'star']}
              resetKey={journey}
            />
          )}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}
        >
          <CosmosPhotoPanel journey={journey} />
        </div>
      </div>
    </div>
  )
}

/** the selected journey's photos; on the chooser, everything */
const CosmosPhotoPanel = memo(function CosmosPhotoPanel({
  journey,
}: {
  journey: CosmosJourneyId | null
}) {
  const groups: CosmosPhotoGroup[] =
    journey === 'stardust'
      ? STARDUST_PHOTO_GROUPS
      : journey === 'detective'
        ? COSMOS_PHOTO_GROUPS.filter((g) => g.title === 'How we know the recipe' || g.title === 'The Sun itself')
        : journey === 'sun'
        ? COSMOS_PHOTO_GROUPS
        : [...COSMOS_PHOTO_GROUPS, ...STARDUST_PHOTO_GROUPS]
  return (
    <>
      {groups.map((group, gi) => (
        <section key={group.title} className={gi === 0 ? '' : 'mt-4'}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.title}
          </h2>
          <div className="space-y-3">
            {group.photos.map((ph) => (
              <figure key={ph.file} className={`p-2 ${FLAT}`}>
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
            <span className="absolute right-3 top-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-sm text-slate-400">
              🔜 coming soon
            </span>
          </div>
        ),
      )}
    </>
  )
}
