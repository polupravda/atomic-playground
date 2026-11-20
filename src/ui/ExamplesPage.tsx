import { memo, useCallback, useState } from 'react'
import { PageNav } from './PageNav'
import { usePageStore } from '../state/pageStore'
import { FissionStage, chooserRows, type FissionReport } from '../stage/FissionStage'
import { closeupFuelInfo } from '../stage/fissionCloseup'
import { BOMB_DESIGNS, BOMB_NAMES, type BombDesignId } from '../core/fission'
import { BOMB_PHOTO_GROUPS } from '../core/examplePhotos'
import { BombsTable, ChainStats, CompareTable, DamageLegend, ParticleLegend } from './BombLegend'
import { StoryTimeline } from './StoryTimeline'
import { BombsIcon } from './BombsIcon'
import { ComingSoonExample } from './ComingSoonExample'
import { LightExample } from './LightExample'
import { CosmosExample } from './CosmosExample'
import { Paras, SectionHeader, type Para } from './Paras'
import { DemoControls, INFO_PANEL } from './DemoControls'
import { bombScripts, bombStoryKey } from '../stage/bombNarration'
import { cancelNarration, useDemoNarration } from './useNarration'
import { NarrationNotice } from './NarrationNotice'
import { KEY, TRAY } from './surfaces'

/** each bomb's narration scripts, per language */
const BOMB_NARRATION: Record<BombDesignId, ReturnType<typeof bombScripts>> = {
  gun: bombScripts('gun'),
  implosion: bombScripts('implosion'),
  tsar: bombScripts('tsar'),
}

// R00 — "Atoms in action": a top-level sibling view of practical examples
// where the atom ideas from the builder show up in the real world. Each
// example = left column (main menu, where the demos are SUB-ITEMS of Atoms
// in action · the demo's controls · info panel) + demo canvas (middle) +
// story timeline / real photos (right). All demos stay mounted (the hidden
// ones' animations pause); the shown one is pageStore.example.

/** the live counters exist once the chain reaction runs */
const counting = (r: FissionReport) =>
  r.phase !== 'armed' && r.phase !== 'countdown' && r.phase !== 'assembling'

const howItWorks = (mode: BombDesignId): Para[] => [
  {
    icon: '⚛️',
    text:
      BOMB_DESIGNS[mode].fuel === 'uranium-235'
        ? 'Uranium-235 has a huge, wobbly nucleus: 92 protons all pushing each other apart, held together just barely.'
        : 'Plutonium-239 has a huge, wobbly nucleus: 94 protons all pushing each other apart, held together just barely.',
  },
  {
    icon: '🎯',
    text: 'When a neutron hits it, the nucleus stretches and SPLITS into two smaller nuclei. That is called fission. It also throws out 2 or 3 new neutrons.',
  },
  {
    icon: '🔥',
    text: 'The two halves fly apart incredibly fast — that speed becomes heat. One split gives about 50 million times more energy than burning one carbon atom.',
  },
  {
    icon: '🔁',
    text: 'The new neutrons split more nuclei, which free more neutrons: 1 → 2 → 4 → 8 → … That is a chain reaction.',
  },
  {
    icon: '⚖️',
    text: 'Critical mass: in a small lump most neutrons escape through the surface and the chain dies. With enough fuel packed together, the chain grows by itself.',
  },
]

const DESIGN_INFO: Record<'gun' | 'implosion' | 'tsar', Para> = {
  gun: {
    icon: '🔫',
    text: 'Gun type (Little Boy, uranium): fire one too-small piece into another so together they are critical. Simple — the scientists were so sure it would work they never tested it.',
  },
  implosion: {
    icon: '💣',
    text: 'Implosion (Fat Man, plutonium): squeeze a small ball until it is about twice as dense as normal metal. Squeezed this hard, only about 6 kg of plutonium was enough — Little Boy, never squeezed, needed 64 kg of uranium. Plutonium needs this: it starts splitting on its own so quickly that a slow gun would blow the pieces apart too early — a fizzle. It is much harder to build: every block must go off within a millionth of a second of the others — if one side goes off late, the ball squirts out sideways instead of being squeezed.',
  },
  tsar: {
    icon: '☀️',
    text: 'Hydrogen bomb (Tsar Bomba): a small fission bomb is only the match. Its heat makes hydrogen nuclei FUSE — join together — like inside the Sun. Fusion fuel has no critical mass, so these bombs can be made enormous.',
  },
}

const honestNotes = (mode: BombDesignId): Para[] => [
  {
    icon: '📐',
    text: 'Every run starts with the three real outlines on one scale, then zooms to your bomb next to a grown-up; the parts inside it are a diagram, shrunk to fit. After DETONATE we zoom in: there the dashed casing shows the parts, not the real shape of the bomb.',
  },
  {
    icon: '🐢',
    text: 'Super slow motion: the real chain reaction is about a billion times faster.',
  },
  {
    icon: '🔢',
    text: `We draw ${BOMB_DESIGNS[mode].nucleusCount} nuclei${mode === 'tsar' ? ' in the trigger' : ''}. A real bomb has trillions of trillions — and only a small part of them split. In Little Boy only about 1 kg of its 64 kg of uranium split before the bomb blew itself apart.`,
  },
  {
    icon: '🔭',
    text: 'Nuclei are drawn huge and close together. Really each nucleus is about 100,000 times smaller than its atom, so many neutrons fly past without hitting anything.',
  },
  {
    icon: '🔍',
    text: closeupNote(mode),
  },
  {
    icon: '🧪',
    text: 'Tsar Bomba really had three stages, and its hydrogen fuel was a solid (lithium deuteride) that makes tritium during the blast. We show two stages and ready-made deuterium + tritium.',
  },
  {
    icon: '🧨',
    text: 'The firing unit is drawn as a plunger box for every bomb. Real bombs fired themselves: a radar measured their height as they fell. Little Boy fired bags of gun powder; Fat Man really had 32 explosive blocks (we draw 16). We draw every explosive the same way so you can compare the bombs.',
  },
  {
    icon: '📏',
    text: 'In the explosion picture the cloud height and the damage rings ARE to scale (see the km ruler and the scale bar). The early fireball is drawn much bigger. At this scale a house would be smaller than one pixel — so the rings are the town map.',
  },
  {
    icon: '⛰️',
    text: 'The damage distances are typical textbook values for a bomb exploding high above flat ground. Real cities differ: in Nagasaki, hills sheltered whole districts.',
  },
]

function closeupNote(mode: BombDesignId): string {
  const f = closeupFuelInfo(BOMB_DESIGNS[mode].fuel)
  return `In the close-up the nucleus is drawn thousands of times too big — really it is 100,000 times smaller than its atom. Each nucleus shows ~30 particles instead of ${f.mass}, and ${f.name} can also split into other pairs than ${f.firstPair[0]} + ${f.firstPair[1]}. The real halves fly off as charged ions that lose many electrons.`
}

const TRUE_STORY: Para[] = [
  {
    icon: '🕊️',
    text: 'Atomic bombs have been used in war only twice: on Hiroshima (6 August 1945) and Nagasaki (9 August 1945), in Japan. Well over 100,000 people died, and both cities were left in ruins — see the photos.',
  },
  {
    icon: '🧊',
    text: 'Tsar Bomba was only a test, over an empty Arctic island on 30 October 1961. It was so big it was never turned into a weapon.',
  },
  {
    icon: '🤝',
    text: 'Since then, countries have signed treaties to stop testing these bombs and to stop them spreading. The same physics, controlled gently, runs nuclear power plants.',
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
  const example = usePageStore((s) => s.example)
  return (
    <>
      <div className={example === 'bomb' ? 'h-full' : 'hidden'}>
        <BombExample active={page === 'examples' && example === 'bomb'} />
      </div>
      <div className={example === 'light' ? 'h-full' : 'hidden'}>
        <LightExample active={page === 'examples' && example === 'light'} />
      </div>
      <div className={example === 'cosmos' ? 'h-full' : 'hidden'}>
        <CosmosExample active={page === 'examples' && example === 'cosmos'} />
      </div>
      {(['plant', 'atoms', 'crystals'] as const).map((id) => (
        <div key={id} className={example === id ? 'h-full' : 'hidden'}>
          <ComingSoonExample id={id} />
        </div>
      ))}
    </>
  )
}

function BombExample({ active }: { active: boolean }) {
  // null = the lineup chooser
  const [mode, setMode] = useState<BombDesignId | null>(null)
  const [paused, setPaused] = useState(false)
  const choose = (id: BombDesignId | null) => {
    cancelNarration() // navigating is a deliberate interruption
    setMode(id)
    setPaused(false)
  }
  // the auto-return to the chooser does NOT cancel: the last line may finish
  const onFinished = useCallback(() => {
    setMode(null)
    setPaused(false)
  }, [])
  const [seek, setSeek] = useState<{ id: string; n: number } | null>(null)
  const [rightTab, setRightTab] = useState<'story' | 'photos'>('story')
  const [report, setReport] = useState<FissionReport>(initialReport)
  const onSeek = useCallback((id: string) => {
    cancelNarration()
    setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1 }))
  }, [])

  // 🔊 narration — listen first, then watch (10-narration-strategy.md)
  const narration = useDemoNarration({
    storyKey: mode ? bombStoryKey(mode) : null,
    beatId: report.storyId,
    scripts: mode ? BOMB_NARRATION[mode] : null,
    active,
    paused,
  })

  const designOrder: Array<'gun' | 'implosion' | 'tsar'> =
    mode === 'tsar'
      ? ['tsar', 'gun', 'implosion']
      : mode === 'implosion'
        ? ['implosion', 'gun', 'tsar']
        : ['gun', 'implosion', 'tsar']
  // texts that need a fuel fall back to Little Boy's on the chooser
  const m = mode ?? 'gun'
  const running = mode !== null

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
              title="Go to the bomb selection screen"
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-medium ${
                running ? `text-slate-100 ${KEY}` : 'cursor-default rounded-lg bg-sky-600 text-white'
              }`}
            >
              <BombsIcon className="h-6 w-9 shrink-0" />
              {running ? 'Choose another bomb' : 'Choose a bomb'}
            </button>
          }
        />
        <div className={INFO_PANEL}>
          {mode === null ? (
            <>
              <SectionHeader>The bombs themselves</SectionHeader>
              <BombsTable />
            </>
          ) : (
            <>
              {counting(report) && (
                <>
                  <SectionHeader>Live counts</SectionHeader>
                  <ChainStats mode={mode} r={report} />
                </>
              )}
              {report.phase === 'explosion' && report.explosionStep < 4 && (
                <>
                  <SectionHeader>Damage on the ground (to scale)</SectionHeader>
                  <DamageLegend mode={mode} />
                </>
              )}
              {report.phase === 'explosion' && report.explosionStep === 4 && (
                <>
                  <SectionHeader>The three bombs compared</SectionHeader>
                  <CompareTable mode={mode} />
                </>
              )}
              {report.intro && (
                <>
                  <SectionHeader>The bombs themselves</SectionHeader>
                  <BombsTable mode={mode} />
                </>
              )}
              <SectionHeader>What the dots mean</SectionHeader>
              <ParticleLegend mode={mode} />
            </>
          )}
          <SectionHeader>How it works</SectionHeader>
          <Paras items={howItWorks(m)} />
          <SectionHeader>Three ways to build one</SectionHeader>
          <Paras items={designOrder.map((d) => DESIGN_INFO[d])} />
          <SectionHeader>Honest notes</SectionHeader>
          <Paras items={honestNotes(m)} className="text-slate-400" />
          <SectionHeader>A true story</SectionHeader>
          <Paras items={TRUE_STORY} />
        </div>
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
            onFinished={onFinished}
          />
          {mode === null && <Chooser onChoose={choose} />}
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
          {mode === null ? (
            <p className="px-1 pt-2 text-sm text-slate-400">
              👈 Pick a bomb — its story will appear here, step by step.
            </p>
          ) : (
          <StoryTimeline
            mode={mode}
            currentId={report.storyId}
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


/** Click targets over the canvas lineup: each bomb row is one big button
 *  ("▶ Watch it"); picking one starts its whole story (auto-play). */
function Chooser({ onChoose }: { onChoose: (id: BombDesignId) => void }) {
  const rows = chooserRows()
  return (
    <>
      {rows.map((r) => (
        <button
          key={r.mode}
          type="button"
          onClick={() => onChoose(r.mode)}
          aria-label={`Watch ${BOMB_NAMES[r.mode]}`}
          className="group absolute rounded-xl border border-slate-700/0 transition hover:border-sky-400/70 hover:bg-sky-400/10 focus-visible:border-sky-400 focus-visible:outline-none"
          style={{ left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top }}
        >
          <span className="absolute right-3 top-1.5 rounded-full bg-sky-600 px-3 py-1 text-sm font-semibold text-white shadow-md shadow-black/40 transition group-hover:scale-105 group-hover:bg-sky-500">
            ▶ Watch it
          </span>
        </button>
      ))}
    </>
  )
}
