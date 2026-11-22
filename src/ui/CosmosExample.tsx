import { memo, useCallback, useState } from 'react'
import { useSpaceToPause } from './useSpaceToPause'
import { PageNav } from './PageNav'
import {
  CosmosStage,
  cosmosStoryOrder,
  type CosmosJourneyId,
  type CosmosReport,
} from '../stage/CosmosStage'
import { sunCloseupStory } from '../stage/sunStory'
import { forgeStory } from '../stage/stardustStory'
import { STARDUST_SCRIPTS } from '../stage/stardustNarration'
import { SUN_SCRIPTS } from '../stage/sunNarration'
import { DETECTIVE_SCRIPTS } from '../stage/detectiveNarration'
import { GOLD_SCRIPTS } from '../stage/goldNarration'
import { useDemoNarration } from './useNarration'
import { NarrationNotice } from './NarrationNotice'
import { BackToStories, INFO_PANEL, StoryTabs, backToMenu, type StoryTab } from './DemoControls'
import { useVoiceStore, type NarrationLang } from '../state/voiceStore'
import { sunMassDefectFraction } from '../core/cosmos'
import {
  COSMOS_PHOTO_GROUPS,
  GOLD_PHOTO_GROUPS,
  STARDUST_PHOTO_GROUPS,
  type CosmosPhotoGroup,
} from '../core/cosmosPhotos'
import { Paras, SectionHeader, para, type Para, SECTION_MAX } from './Paras'
import { Eq, TimelineColumn, type StoryBeat } from './TimelineColumn'
import { transcriptScript } from './storyChapters'
import type { StorySeek } from '../stage/flowPacing'
import { FLAT, KEY } from './surfaces'

// R04 — 🌟 Cosmic origins: the third "Atoms in action" example. Same page
// anatomy as the bomb and light demos. Four journeys: 🔭 Star detective,
// ☀️ Why the Sun shines (and WHAT it is made of — the recipe beat),
// 🧒 You are star stuff and 💍 Where gold comes from.

const defectPct = (sunMassDefectFraction() * 100).toFixed(1)

/** each journey's narration scripts, per language */
const NARRATION: Partial<
  Record<CosmosJourneyId, Partial<Record<NarrationLang, Record<string, string>>>>
> = {
  detective: DETECTIVE_SCRIPTS,
  gold: GOLD_SCRIPTS,
  stardust: STARDUST_SCRIPTS,
  sun: SUN_SCRIPTS,
}

// 🔭 star detective — the info panel (for adults: one scannable sentence
// per item, key phrase in bold — see Paras.tsx)
const HOW_DETECTIVE: Para[] = [
  para('🌈', 'A prism spreads starlight', ' into a rainbow with thin dark lines in it.'),
  para('🫧', 'Dark lines = colors caught', ' by the star\'s thin outer gas: electrons jumping UP — the firework run backwards.'),
  para('🔍', 'Every element catches its own barcode;', ' if its lines sit on dark lines, the star contains it.'),
  para('🧪', 'A suspect that doesn\'t fit is ruled out', ' — so we learn a star\'s recipe without ever going there.'),
]

const HONEST_DETECTIVE: Para[] = [
  para('⭐', 'A hot blue-white star', ' (like Spica) really shows strong hydrogen and helium lines; Sun-like stars show thousands — we keep two elements.'),
  para('🌈', 'All dark lines drawn alike', ' (real ones differ in strength and width); visible light only.'),
  para('☀️', 'In 1868 the helium line was seen BRIGHT', ', glowing at the Sun\'s edge in an eclipse — the same fingerprint, glowing instead of missing.'),
  para('🫧', 'Storybook-sized atoms and photons;', ' a caught photon is soon sent out again, but in any direction — so little of that color reaches us.'),
]

const TRUE_DETECTIVE: Para[] = [
  para('🌑', '18 August 1868:', ' in an eclipse seen from India, Jules Janssen saw a new yellow solar line; Norman Lockyer named its element helium, after helios, the Sun.'),
  para('🎈', 'Found on Earth only in 1895', ' (William Ramsay): the party-balloon gas was discovered in the sky first.'),
  para('📐', '1814, Joseph von Fraunhofer', ' mapped hundreds of dark lines in sunlight — the Sun\'s barcode (📷 panel).'),
]

// 💍 where gold comes from — the info panel
const HOW_GOLD: Para[] = [
  para('🔥', 'Fire, acids and factories only move atoms;', ' what an atom IS depends on its protons — 79 is gold.'),
  para('⚫', 'Neutron star:', ' a giant star\'s crushed core — more than the Sun\'s mass in a ball ~20 km across, almost all neutrons.'),
  para('🌀', 'Two neutron stars spiral in,', ' losing energy as ripples in space itself, faster and faster, until they crash.'),
  para('💥', 'The crash sprays free neutrons:', ' atoms swallow them, neutrons turn into protons, and atoms climb to gold, platinum and uranium.'),
  para('🌍', 'Older than the Earth:', ' that gold joined the cloud that formed the Sun and the Earth, 4.6 billion years ago.'),
]

const HONEST_GOLD: Para[] = [
  para('🧪', 'Accelerators and reactors CAN make gold', ' — a handful of atoms, far too few to see, costing far more than gold; no fire, chemistry or factory can.'),
  para('❓', 'Still debated:', ' how much of our gold comes from neutron-star crashes and how much from rare exploding stars.'),
  para('⚛️', 'Bare nuclei on purpose:', ' at billions of degrees electrons fly loose; they settle into shells days later, so the ring\'s gold has all 79.'),
  para('🥄', '"A mountain" ≈ a billion tonnes:', ' a hill about half a kilometre high, not Everest; a neutron star is ~20 km across, a big city.'),
  para('⚡', 'r-process timing squeezed:', ' atoms swallow neutrons in under a second, and most neutrons turn into protons just after; we show both at once, slowed.'),
  para('🌋', 'Most early gold sank into Earth\'s core;', ' surface gold may have come later in meteorites — from the same kind of crash.'),
  para('⏱️', 'The year counter is real only at the Earth and the Sun\'s cloud', ' (4.5 and 4.6 billion years); a nugget\'s own years vary, so there it just spins.'),
  para('🎯', 'The hero\'s path is a story,', ' not a record; stars, atoms, the scale and the city are drawn at storybook scale.'),
]

const TRUE_GOLD: Para[] = [
  para('📡', '17 August 2017:', ' LIGO and Virgo felt two neutron stars crash 130 million light-years away; telescopes read fresh heavy elements in the glow.'),
  para('💰', 'That one crash', ' probably made more gold than the whole Earth weighs.'),
  para('⚗️', 'Alchemists failed for centuries:', ' lead into gold must happen inside the nucleus, out of reach of fire and potions.'),
]

// ☀️ why the Sun shines — the info panel
const HOW_IT_WORKS: Para[] = [
  para('🥣', 'Recipe by weight:', ' 73 kg hydrogen, 25 kg helium, 2 kg the rest in every 100 — read from the Sun\'s dark-line barcode.'),
  para('🔥', 'Core: 15 million degrees,', ' crushed; bare hydrogen nuclei crash all day, and the rare perfect crash sticks.'),
  para('🤝', 'Four hydrogens → one helium', ' in three steps: p+p → deuterium (+ positron, neutrino); +p → helium-3 (+ γ); 2 helium-3 → helium-4 + 2 p.'),
  para('⚖️', `Helium weighs ${defectPct}% less`, ' than the hydrogens that made it; the missing mass leaves as light — why the Sun shines.'),
  para('⛰️', 'Energy valley:', ' joining small nuclei (fusion) and splitting huge ones (fission) both release energy; iron sits at the bottom.'),
]

const HONEST: Para[] = [
  para('🐢', 'Slowed beyond imagining:', ' a core proton waits, on average, BILLIONS of years for its lucky crash — we show the lucky one.'),
  para('⚖️', '"Mass turns into light" is simplified:', ' mass and energy are two faces of one thing — all E = mc² says.'),
  para('🥣', 'Recipe by weight, rounded, for the whole Sun:', ' by atoms hydrogen is ~92%, and the core is already about half helium.'),
  para('📏', 'No shared scale', ' — except Earth beside the Sun, which is to scale.'),
  para('👻', 'The neutrino is drawn faint on purpose:', ' trillions pass through you every second and almost never touch an atom.'),
  para('🪜', 'Main recipe only:', ' the Sun has helper recipes too (bigger stars run a carbon cycle).'),
]

const TRUE_STORY: Para[] = [
  para('🔭', '1925, Cecilia Payne', ' proved the Sun is mostly hydrogen by reading its light barcode; almost nobody believed her at first.'),
  para('🎈', 'Helium is named after the Sun', ' (helios): seen in its barcode in 1868, found on Earth 27 years later.'),
]

// 🧒 you are star stuff — the info panel
const HOW_STARDUST: Para[] = [
  para('🏭', 'Stars are element factories:', ' once its hydrogen is spent, a big star\'s core fuses helium into carbon (later oxygen and more).'),
  para('💎', 'Three heliums → one carbon:', ' 4+4+4 = 12 nucleons, 2+2+2 = 6 protons — and 6 protons IS carbon.'),
  para('💥', 'A dying star', ' — explosively or gently — sows its atoms into space as a glowing cloud.'),
  para('🌍', 'The Sun and Earth are second-hand:', ' new stars and planets form from old stars\' dust.'),
  para('♻️', 'Atoms keep moving:', ' volcano → air → leaf → food → you, borrowed and passed on.'),
]

const HONEST_STARDUST: Para[] = [
  para('🎯', 'The hero\'s path is a story,', ' not a record — but every carbon atom in you travelled some road like it.'),
  para('🌬️', 'Much carbon leaves smaller stars gently', ' (a puffed-off glowing shell), not in a supernova; both roads are real.'),
  para('⏱️', 'Billions of years squeezed into a minute', ' — the drift alone took longer than the Earth has existed.'),
  para('🤏', 'Beryllium-8\'s "blink" is real:', ' it lasts about a billionth of a billionth of a second, and all carbon squeezes through it.'),
  para('📏', 'Storybook scale', ' for stars, nebulas, planets, molecules and the kid — not a shared one.'),
]

const TRUE_STARDUST: Para[] = [
  para('🧒', '"We are made of star-stuff"', ' — Carl Sagan\'s famous line, checked and drawn.'),
  para('🔮', '1953, Fred Hoyle predicted', ' a special energy state of carbon, without which we could not exist; it was found that same year.'),
  para('👀', '1054, a "guest star"', ' blazed for weeks over China and Japan; its wreck is the Crab Nebula (📷 panel).'),
]

// 📖 the story column: each beat's chapter, icon and non-spoken extras —
// its words are the narration script itself (TimelineColumn)
const DETECTIVE_BEATS: Record<string, StoryBeat> = {
  star: { id: 'star', group: '🔭 Looking up', icon: '⭐' },
  prism: { id: 'prism', group: '🔭 Looking up', icon: '🌈' },
  catch: { id: 'catch', group: '🫧 Why the gaps', icon: '🫧' },
  catchDrill: { id: 'catchDrill', group: '🔁 Once more, closer', icon: '🔁' },
  hydrogen: { id: 'hydrogen', group: '🔍 Detective work', icon: '✅' },
  oxygen: { id: 'oxygen', group: '🔍 Detective work', icon: '❌' },
  helium: { id: 'helium', group: '🔍 Detective work', icon: '✅' },
  discovery: { id: 'discovery', group: '🎈 The payoff', icon: '🎈' },
}

const GOLD_BEATS: Record<string, StoryBeat> = {
  ring: { id: 'ring', group: '💍 A question', icon: '💍' },
  zoom: { id: 'zoom', group: '💍 A question', icon: '🔍' },
  rewind: { id: 'rewind', group: '⏪ Back in time', icon: '⏪' },
  stars: { id: 'stars', group: '⚫ Two dead stars', icon: '⚫' },
  teaspoon: { id: 'teaspoon', group: '⚫ Two dead stars', icon: '🥄' },
  crash: { id: 'crash', group: '💥 The crash', icon: '💥' },
  stuff: { id: 'stuff', group: '💥 The crash', icon: '⚛️', extra: <Eq>iron (26 protons) → gold (79 protons)</Eq> },
  stuffDrill: { id: 'stuffDrill', group: '🔁 Once more, closer', icon: '🔁' },
  forward: { id: 'forward', group: '⏩ Forward again', icon: '⏩' },
  older: { id: 'older', group: '💍 The payoff', icon: '🌟' },
}

const STARDUST_BEATS: Record<string, StoryBeat> = {
  giant: { id: 'giant', group: '🔴 An old star', icon: '🔴' },
  zoom: { id: 'zoom', group: '🔥 The forge', icon: '🔍' },
  boom: { id: 'boom', group: '💥 Set free', icon: '💥' },
  drift: { id: 'drift', group: '🌫️ Adrift', icon: '🌫️' },
  earth: { id: 'earth', group: '🌍 A new world', icon: '🌍' },
  alive: { id: 'alive', group: '♻️ Alive', icon: '🌋' },
  you: { id: 'you', group: '🧒 The payoff', icon: '🧒' },
}

const SUN_BEATS: Record<string, StoryBeat> = {
  sun: { id: 'sun', group: '☀️ Our star', icon: '☀️' },
  recipe: { id: 'recipe', group: '☀️ Our star', icon: '🥣' },
  zoom: { id: 'zoom', group: '🔍 Into the core', icon: '🔍' },
  fusionDrill: { id: 'fusionDrill', group: '🔁 Once more, closer', icon: '🔁' },
  scale: { id: 'scale', group: '⚖️ The missing mass', icon: '⚖️' },
  walk: { id: 'walk', group: '🥾 The long way out', icon: '🥾' },
  valley: { id: 'valley', group: '⛰️ The payoff', icon: '⛰️' },
}

function storyBeats(journey: CosmosJourneyId): StoryBeat[] {
  const order = cosmosStoryOrder(journey)
  if (journey === 'detective') return order.map((id) => DETECTIVE_BEATS[id])
  if (journey === 'gold') return order.map((id) => GOLD_BEATS[id])
  if (journey === 'stardust') {
    const forge = forgeStory()
    return order.map((id) => {
      if (!id.startsWith('forge')) return STARDUST_BEATS[id]
      const st = forge[Number(id.slice(5))]
      return { id, group: '🔥 The forge', icon: st.icon, extra: <Eq>{st.equation}</Eq> }
    })
  }
  const close = sunCloseupStory()
  return order.map((id) => {
    if (!id.startsWith('closeup')) return SUN_BEATS[id]
    const st = close[Number(id.slice(7))]
    return { id, group: '🔍 Into the core', icon: st.icon, extra: <Eq>{st.equation}</Eq> }
  })
}

const initialReport: CosmosReport = { phase: 'sun', storyId: 'sun', closeupStep: 0 }

export function CosmosExample({ active, journey }: { active: boolean; journey: CosmosJourneyId | null }) {
  const [paused, setPaused] = useState(false)
  // a new story (or none) starts unpaused
  const [prev, setPrev] = useState(journey)
  if (prev !== journey) {
    setPrev(journey)
    setPaused(false)
  }
  const [seek, setSeek] = useState<StorySeek | null>(null)
  const [rightTab, setRightTab] = useState<StoryTab>('story')
  const [report, setReport] = useState<CosmosReport>(initialReport)
  const running = journey !== null
  // ⎵ Space = ⏸ Pause / ▶ Resume while a story plays
  useSpaceToPause(active && running, () => setPaused((v) => !v))

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
  // 📖 a clicked sentence: the voice restarts at it, the story
  // lands where that piece comes up
  const { seekTo } = narration
  const onSeek = useCallback(
    (id: string, piece: number, sentence: number) => {
      const land = seekTo(id, piece, sentence)
      setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1, ...land }))
    },
    [seekTo],
  )
  const voiceLang = useVoiceStore((s) => s.lang)
  const transcript = transcriptScript(journey ? NARRATION[journey] : null, voiceLang)

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: the menu + the voice card */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
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
            onFinished={backToMenu}
          />
          {running && <BackToStories />}
          <NarrationNotice failed={narration.failed} missingLang={narration.missingLang} />
          {running && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              title="Pause or resume the story (Space)"
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

      {/* right: the story timeline, the real photos, or the notes */}
      <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-2">
        <StoryTabs tab={rightTab} onTab={setRightTab} />
        {/* all stay mounted (scroll positions survive tab switches) */}
        <div
          data-story-scroll
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'story' ? '' : 'hidden'}`}
        >
          {journey !== null && (
            <TimelineColumn
              beats={storyBeats(journey)}
              script={transcript.script}
              lang={transcript.lang}
              speakingPiece={narration.speakingPiece}
              speakingSentence={narration.speakingSentence}
              voiced={narration.voiced}
              currentId={report.storyId}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
              restartIds={['sun', 'giant', 'star', 'ring']}
              resetKey={journey}
            />
          )}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}
        >
          <CosmosPhotoPanel journey={journey} />
        </div>
        {running && (
          <div className={`${INFO_PANEL} ${rightTab === 'notes' ? '' : 'hidden'}`}>
            <SectionHeader type="how" />
            <Paras max={SECTION_MAX} key={`how-${journey}`} items={journey === 'stardust' ? HOW_STARDUST : journey === 'detective' ? HOW_DETECTIVE : journey === 'gold' ? HOW_GOLD : HOW_IT_WORKS} />
            <SectionHeader type="honest" />
            <Paras max={SECTION_MAX} key={`honest-${journey}`}
              items={
                journey === 'stardust' ? HONEST_STARDUST : journey === 'detective' ? HONEST_DETECTIVE : journey === 'gold' ? HONEST_GOLD : HONEST
              }
              className="text-slate-400"
            />
            <SectionHeader type="true" />
            <Paras max={SECTION_MAX} key={`true-${journey}`} items={journey === 'stardust' ? TRUE_STARDUST : journey === 'detective' ? TRUE_DETECTIVE : journey === 'gold' ? TRUE_GOLD : TRUE_STORY} />
          </div>
        )}
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
        : journey === 'gold'
          ? GOLD_PHOTO_GROUPS
          : [...COSMOS_PHOTO_GROUPS, ...STARDUST_PHOTO_GROUPS, ...GOLD_PHOTO_GROUPS]
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
