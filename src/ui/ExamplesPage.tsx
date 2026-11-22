import { memo, useCallback, useState } from 'react'
import { useSpaceToPause } from './useSpaceToPause'
import { PageNav } from './PageNav'
import { usePageStore, type ExampleId } from '../state/pageStore'
import { FissionStage, type FissionReport } from '../stage/FissionStage'
import { closeupFuelInfo } from '../stage/fissionCloseup'
import { BOMB_DESIGNS, type BombDesignId } from '../core/fission'
import { BOMB_PHOTO_GROUPS } from '../core/examplePhotos'
import { BombsTable, ChainStats, CompareTable, DamageLegend, ParticleLegend } from './BombLegend'
import { StoryTimeline } from './StoryTimeline'
import { StoriesHome } from './StoriesHome'
import { LaserExample, type LaserJourney } from './LaserExample'
import { PlantExample } from './PlantExample'
import { SignalsExample, type SignalsJourney } from './SignalsExample'
import { LightExample } from './LightExample'
import type { LightStoryId } from '../stage/LightStage'
import type { CosmosJourneyId } from '../stage/CosmosStage'
import { CosmosExample } from './CosmosExample'
import { Paras, SectionHeader, type Para, SECTION_MAX } from './Paras'
import { BackToStories, INFO_PANEL, LiveOverlay, StoryTabs, backToMenu, type StoryTab } from './DemoControls'
import { bombScripts, bombStoryKey } from '../stage/bombNarration'
import { useDemoNarration } from './useNarration'
import { useVoiceStore } from '../state/voiceStore'
import { transcriptScript } from './storyChapters'
import type { StorySeek } from '../stage/flowPacing'
import { NarrationNotice } from './NarrationNotice'
import { KEY } from './surfaces'

/** each bomb's narration scripts, per language */
const BOMB_NARRATION: Record<BombDesignId, ReturnType<typeof bombScripts>> = {
  gun: bombScripts('gun'),
  implosion: bombScripts('implosion'),
  tsar: bombScripts('tsar'),
}

// R00 — 🎬 Stories: the stories menu (StoriesHome) or one playing story.
// A story page = left column (main menu + voice card) · demo canvas with
// ← back (middle) · 📖 Story / 📷 Photos / 📝 Notes (right). Every topic
// page stays mounted (the hidden ones' animations pause) and gets its story
// id from pageStore.story — null when not playing, which resets it
// (docs/how-things-work/17-stories-menu.md).

/** the live counters exist once the chain reaction runs */
const counting = (r: FissionReport) =>
  r.phase !== 'armed' && r.phase !== 'countdown' && r.phase !== 'assembling'

const howItWorks = (mode: BombDesignId): Para[] => [
  {
    icon: '⚛️',
    text:
      BOMB_DESIGNS[mode].fuel === 'uranium-235' ? (
        <>
          <b>Uranium-235</b> has a huge, wobbly nucleus: 92 protons pushing apart, barely held together.
        </>
      ) : (
        <>
          <b>Plutonium-239</b> has a huge, wobbly nucleus: 94 protons pushing apart, barely held together.
        </>
      ),
  },
  {
    icon: '🎯',
    text: (
      <>
        A neutron hit <b>splits the nucleus in two</b> (fission) and frees 2 or 3 new neutrons.
      </>
    ),
  },
  {
    icon: '🔥',
    text: (
      <>
        The halves fly apart fast: <b>one split gives ~50 million times</b> the energy of burning one carbon atom.
      </>
    ),
  },
  {
    icon: '🔁',
    text: (
      <>
        New neutrons split more nuclei, 1 → 2 → 4 → 8 …: a <b>chain reaction</b>.
      </>
    ),
  },
  {
    icon: '⚖️',
    text: (
      <>
        <b>Critical mass:</b> a small lump loses its neutrons through the surface; enough fuel packed together keeps the chain growing.
      </>
    ),
  },
]

const DESIGN_INFO: Record<'gun' | 'implosion' | 'tsar', Para> = {
  gun: {
    icon: '🔫',
    text: (
      <>
        <b>Gun type</b> (Little Boy, uranium) fires one too-small piece into another — so simple it was never tested.
      </>
    ),
  },
  implosion: {
    icon: '💣',
    text: (
      <>
        <b>Implosion</b> (Fat Man, plutonium) squeezes a ball to about twice normal density: ~6 kg was enough (Little Boy needed 64 kg of uranium).
      </>
    ),
  },
  tsar: {
    icon: '☀️',
    text: (
      <>
        <b>Hydrogen bomb</b> (Tsar Bomba): a small fission bomb lights hydrogen <b>fusion</b>, which has no critical mass — so no size limit.
      </>
    ),
  },
}

const honestNotes = (mode: BombDesignId): Para[] => [
  {
    icon: '📐',
    text: (
      <>
        <b>Outlines to scale, insides not:</b> the lineup and the grown-up are true size; the parts inside (and the dashed casing after DETONATE) are a diagram.
      </>
    ),
  },
  {
    icon: '🐢',
    text: (
      <>
        <b>Super slow motion:</b> the real chain reaction is about a billion times faster.
      </>
    ),
  },
  {
    icon: '🔢',
    text: (
      <>
        <b>
          {BOMB_DESIGNS[mode].nucleusCount} nuclei{mode === 'tsar' ? ' in the trigger' : ''}
        </b>
        , not trillions of trillions — and in Little Boy only ~1 kg of its 64 kg of uranium split.
      </>
    ),
  },
  {
    icon: '🔭',
    text: (
      <>
        <b>Nuclei drawn huge and close:</b> each is ~100,000 times smaller than its atom, so many neutrons miss.
      </>
    ),
  },
  {
    icon: '🔍',
    text: closeupNote(mode),
  },
  {
    icon: '🧪',
    text: (
      <>
        <b>Tsar Bomba simplified:</b> really three stages and solid lithium deuteride (it makes tritium in the blast); we show two stages and ready-made deuterium + tritium.
      </>
    ),
  },
  {
    icon: '🧨',
    text: (
      <>
        <b>Firing drawn alike</b> for comparison: real bombs fired by radar height, Little Boy with bags of gunpowder, Fat Man with 32 explosive blocks (we draw 16).
      </>
    ),
  },
  {
    icon: '📏',
    text: (
      <>
        <b>Cloud height and damage rings are to scale</b>; the early fireball is drawn much bigger (a house would be under one pixel).
      </>
    ),
  },
  {
    icon: '⛰️',
    text: (
      <>
        <b>Damage distances are textbook values</b> for a high burst over flat ground; in Nagasaki, hills sheltered whole districts.
      </>
    ),
  },
]

function closeupNote(mode: BombDesignId) {
  const f = closeupFuelInfo(BOMB_DESIGNS[mode].fuel)
  return (
    <>
      <b>Close-up nucleus thousands of times too big</b>, with ~30 particles instead of {f.mass}; {f.name} also splits into other pairs than {f.firstPair[0]} + {f.firstPair[1]}, and the real halves fly off as charged ions.
    </>
  )
}

const TRUE_STORY: Para[] = [
  {
    icon: '🕊️',
    text: (
      <>
        <b>Used in war only twice:</b> Hiroshima (6 August 1945) and Nagasaki (9 August 1945) — well over 100,000 died, both cities ruined.
      </>
    ),
  },
  {
    icon: '🧊',
    text: (
      <>
        <b>Tsar Bomba was only a test</b>, over an empty Arctic island on 30 October 1961 — too big ever to become a weapon.
      </>
    ),
  },
  {
    icon: '🤝',
    text: (
      <>
        <b>Treaties</b> now limit testing and spreading; the same physics, controlled gently, runs nuclear power plants.
      </>
    ),
  },
]

const initialReport: FissionReport = {
  phase: 'armed',
  splits: 0,
  total: 0,
  escaped: 0,
  generation: 0,
  countdown: 0,
  fusions: 0,
  fuelTotal: 0,
  closeupStep: 0,
  explosionStep: 0,
  storyId: 'intro',
  aftermath: false,
  intro: true,
}

export function ExamplesPage() {
  const page = usePageStore((s) => s.page)
  const story = usePageStore((s) => s.story)
  // each topic's story id while it plays (null = not this topic). Every
  // topic stays mounted; a story that is left falls back to null — reset.
  const idOf = (ex: ExampleId) => (story?.example === ex ? story.id : null)
  const shown = (ex: ExampleId) => (story?.example === ex ? 'h-full' : 'hidden')
  const active = (ex: ExampleId) => page === 'examples' && story?.example === ex
  return (
    <>
      <div className={story === null ? 'h-full' : 'hidden'}>
        <StoriesHome />
      </div>
      <div className={shown('bomb')}>
        <BombExample active={active('bomb')} mode={idOf('bomb') as BombDesignId | null} />
      </div>
      <div className={shown('light')}>
        <LightExample active={active('light')} story={idOf('light') as LightStoryId | null} />
      </div>
      <div className={shown('cosmos')}>
        <CosmosExample active={active('cosmos')} journey={idOf('cosmos') as CosmosJourneyId | null} />
      </div>
      <div className={shown('plant')}>
        <PlantExample active={active('plant')} journey={idOf('plant') as 'story' | null} />
      </div>
      <div className={shown('lasers')}>
        <LaserExample active={active('lasers')} journey={idOf('lasers') as LaserJourney | null} />
      </div>
      <div className={shown('signals')}>
        <SignalsExample active={active('signals')} journey={idOf('signals') as SignalsJourney | null} />
      </div>
    </>
  )
}

function BombExample({ active, mode }: { active: boolean; mode: BombDesignId | null }) {
  const [paused, setPaused] = useState(false)
  // a new story (or none) starts unpaused
  const [prevMode, setPrevMode] = useState(mode)
  if (prevMode !== mode) {
    setPrevMode(mode)
    setPaused(false)
  }
  const [seek, setSeek] = useState<StorySeek | null>(null)
  const [rightTab, setRightTab] = useState<StoryTab>('story')
  const [report, setReport] = useState<FissionReport>(initialReport)

  // 🔊 narration — listen first, then watch (10-narration-strategy.md)
  const narration = useDemoNarration({
    storyKey: mode ? bombStoryKey(mode) : null,
    beatId: report.storyId,
    scripts: mode ? BOMB_NARRATION[mode] : null,
    active,
    paused,
  })
  // 📖 a clicked sentence: the voice restarts at it, the bomb lands
  // where that piece comes up
  const { seekTo } = narration
  const onSeek = useCallback(
    (id: string, piece: number, sentence: number) => {
      const land = seekTo(id, piece, sentence)
      setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1, ...land }))
    },
    [seekTo],
  )
  const voiceLang = useVoiceStore((s) => s.lang)
  const transcript = transcriptScript(mode ? BOMB_NARRATION[mode] : null, voiceLang)

  const designOrder: Array<'gun' | 'implosion' | 'tsar'> =
    mode === 'tsar'
      ? ['tsar', 'gun', 'implosion']
      : mode === 'implosion'
        ? ['implosion', 'gun', 'tsar']
        : ['gun', 'implosion', 'tsar']
  // texts that need a fuel fall back to Little Boy's while hidden
  const m = mode ?? 'gun'
  const running = mode !== null
  // ⎵ Space = ⏸ Pause / ▶ Resume while a story plays
  useSpaceToPause(active && running, () => setPaused((v) => !v))

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: the menu + the voice card */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
      </div>

      {/* middle: the demo canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <FissionStage
            mode={mode}
            paused={paused}
            seek={seek}
            active={active}
            timeScale={narration.timeScale}
            holdBeat={narration.holdBeat}
            fit={narration.fit}
            speakingPiece={narration.speakingPiece}
            onReport={setReport}
            onFinished={backToMenu}
          />
          {running && <BackToStories />}
          {mode !== null && counting(report) && (
            <LiveOverlay>
              <ChainStats mode={mode} r={report} />
            </LiveOverlay>
          )}
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
          {mode !== null && (
            <StoryTimeline
              mode={mode}
              script={transcript.script}
              lang={transcript.lang}
              currentId={report.storyId}
              speakingPiece={narration.speakingPiece}
              speakingSentence={narration.speakingSentence}
              voiced={narration.voiced}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
            />
          )}
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}
        >
          <PhotoPanel mode={mode} />
        </div>
        {mode !== null && (
          <div className={`${INFO_PANEL} ${rightTab === 'notes' ? '' : 'hidden'}`}>
            {report.phase === 'explosion' && report.explosionStep < 4 && (
              <>
                <SectionHeader type="legend">Damage on the ground (to scale)</SectionHeader>
                <DamageLegend mode={mode} />
              </>
            )}
            {report.phase === 'explosion' && report.explosionStep === 4 && (
              <>
                <SectionHeader type="facts">The three bombs compared</SectionHeader>
                <CompareTable mode={mode} />
              </>
            )}
            {report.intro && (
              <>
                <SectionHeader type="facts">The bombs themselves</SectionHeader>
                <BombsTable mode={mode} />
              </>
            )}
            <SectionHeader type="legend" />
            <ParticleLegend mode={mode} />
            <SectionHeader type="how" />
            <Paras max={SECTION_MAX} key={`how-${m}`} items={howItWorks(m)} />
            <SectionHeader type="how">Three ways to build one</SectionHeader>
            <Paras max={SECTION_MAX} key={`designs-${m}`} items={designOrder.map((d) => DESIGN_INFO[d])} />
            <SectionHeader type="honest" />
            <Paras max={SECTION_MAX} key={`honest-${m}`} items={honestNotes(m)} className="text-slate-400" />
            <SectionHeader type="true" />
            <Paras max={SECTION_MAX} key={`true-${m}`} items={TRUE_STORY} />
          </div>
        )}
      </div>
    </div>
  )
}

/** The real photos (right column, Photos tab); the current design's are
 *  highlighted. Memoised: it only changes when the design does. */
const PhotoPanel = memo(function PhotoPanel({ mode }: { mode: BombDesignId | null }) {
  return (
    <>
      {BOMB_PHOTO_GROUPS.map((group, gi) => (
        <section key={group.title} className={gi === 0 ? '' : 'mt-4'}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.title}
          </h2>
          <div className="space-y-3">
            {group.photos.map((ph) => (
              <figure
                key={ph.file}
                className={`rounded-xl p-2 transition ${
                  ph.design === mode ? 'border border-amber-500/60 bg-amber-500/10' : 'bg-slate-800/40'
                }`}
              >
                <img
                  src={`${import.meta.env.BASE_URL}examples/${ph.file}`}
                  alt={ph.caption}
                  loading="lazy"
                  className={`w-full rounded-lg border border-slate-700 ${
                    ph.tall ? 'h-72 bg-black object-contain' : 'h-36 object-cover'
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
