import { memo, useCallback, useState } from 'react'
import { PageNav } from './PageNav'
import { DemoControls, INFO_PANEL } from './DemoControls'
import { NarrationNotice } from './NarrationNotice'
import { Paras, SectionHeader, para, type Para, SECTION_MAX } from './Paras'
import { TimelineColumn, type StoryBeat } from './TimelineColumn'
import { transcriptScript } from './storyChapters'
import { useVoiceStore } from '../state/voiceStore'
import type { StorySeek } from '../stage/flowPacing'
import { Thumb } from './ComingSoonExample'
import { FLAT, KEY, TRAY } from './surfaces'
import { cancelNarration, useDemoNarration } from './useNarration'
import { useSpaceToPause } from './useSpaceToPause'
import { SequenceStage, type SequenceStory } from '../stage/SequenceStage'
import { FISSION_H, FISSION_W } from '../stage/FissionStage'
import { PLANT_ORDER, PLANT_T, drawPlantBeat } from '../stage/plantScenes'
import { PLANT_SCRIPTS } from '../stage/plantNarration'
import { PLANT_PHOTO_GROUPS } from '../core/plantPhotos'
import { FUEL_SPLITTABLE_PER_100, PELLET_COAL_TONNES } from '../core/plant'

// R03 — ⚡ Power plant: the fourth 🎬 story demo, same page anatomy as the
// others (16rem info · canvas · 18rem story/photos). Two ways in, as
// proposal 07 planned: 📖 How a power plant works (built 2026-11-20, to the
// kid-first design of doc 12) and 🕹️ You are the operator (coming soon).

const STORY: SequenceStory = { order: PLANT_ORDER, durations: PLANT_T, draw: drawPlantBeat }
const BUTTON_ZONE = 86

type PlantJourney = 'story'

// the info panel, for adults: one scannable sentence per item, key phrase
// in bold (Paras.tsx)
const HOW: Para[] = [
  para('⚛️', 'Same uranium, same splits as the bomb;', ' the difference is control — each split may cause just ONE more.'),
  para('🦯', 'Control rods swallow neutrons', ' (boron, cadmium): in → fewer splits, out → more.'),
  para('💧', 'The water does two jobs:', ' it carries the heat away and slows the neutrons, which helps them split uranium.'),
  para('🌀', 'Heat → steam → turbine → generator → electricity;', ' coal and gas plants work the same, only the fire differs.'),
  para('🥄', 'One fingertip-sized pellet', ` gives about as much energy as ${PELLET_COAL_TONNES} tonne of coal.`),
]

const HONEST: Para[] = [
  para('🐢', 'Slowed and simplified:', ' a real core holds trillions of trillions of atoms and splits them for years; atoms and rods are storybook-sized.'),
  para('💥', 'It cannot explode like a bomb:', ` only ~${FUEL_SPLITTABLE_PER_100} splitting atoms in 100 (bomb fuel ~90) — but it CAN overheat badly, as in the big accidents.`),
  para('🗄️', 'Used fuel stays radioactive for many thousands of years:', ' 5–10 years in a pool, then steel-and-concrete casks; Finland\'s Onkalo is the first deep store, built for 100,000 years.'),
  para('⏱️', 'Late neutrons make steering possible:', ' about 1 in 150 comes out up to a minute later, giving the rods time to act.'),
  para('🔀', 'A split makes two smaller atoms', ' (often barium + krypton) sharing its 92 electrons (56 + 36; the fast pieces briefly lack a few) — they stay in the fuel, part of why it is radioactive.'),
  para('🛑', 'The automatic rod drop is a scram:', ' the plant is then shut down, and restarted later, slowly.'),
  para('🔁', 'One water loop drawn:', ' most plants keep two, so the water touching the fuel never reaches the turbine.'),
  para('👁️', 'The rays are drawn', ' like the Sun story\'s γ rays; really they are invisible.'),
  para('🔵', 'Real photos show the water glowing blue:', ' Cherenkov light.'),
]

const TRUE: Para[] = [
  para('🏟️', '2 December 1942, Chicago Pile-1:', ' Enrico Fermi\'s team ran the first reactor under a sports-field stand — one control rod on a rope, a man with an axe ready to cut it.'),
  para('🕊️', 'Chernobyl (1986) and Fukushima (2011):', ' a badly designed reactor pushed too far in a test, and a quake and tsunami that knocked out cooling.'),
  para('🏚️', 'Neither was a bomb-like explosion,', ' but many people had to leave home, some places are still empty, and newer plants cool and shut down by themselves.'),
  para('💡', 'About 400 reactors', ' make about a tenth of the world\'s electricity, with no smoke while they run.'),
]

// 📖 the story column: each beat's chapter and icon — its words are the
// narration script itself (TimelineColumn)
const BEATS: Record<string, StoryBeat> = {
  remember: { id: 'remember', group: '💥 Remember', icon: '💥' },
  rods: { id: 'rods', group: '🦯 The trick', icon: '🦯' },
  steady: { id: 'steady', group: '🦯 The trick', icon: '➖' },
  heat: { id: 'heat', group: '♨️ A very big kettle', icon: '🔥' },
  kettle: { id: 'kettle', group: '♨️ A very big kettle', icon: '🌀' },
  lights: { id: 'lights', group: '♨️ A very big kettle', icon: '💡' },
  safe: { id: 'safe', group: '🛡️ Safety', icon: '🛑' },
  waste: { id: 'waste', group: '🗄️ The honest part', icon: '☢️' },
}

const ROW_M = 18
const ROW_GAP = 14
const ROW_H = 200

export function PlantExample({ active }: { active: boolean }) {
  // null = the chooser
  const [journey, setJourney] = useState<PlantJourney | null>(null)
  const [paused, setPaused] = useState(false)
  const [beat, setBeat] = useState<string>(PLANT_ORDER[0])
  const [seek, setSeek] = useState<StorySeek | null>(null)
  const [rightTab, setRightTab] = useState<'story' | 'photos'>('story')
  const choose = (j: PlantJourney | null) => {
    cancelNarration() // navigating is a deliberate interruption
    setJourney(j)
    setPaused(false)
    setBeat(PLANT_ORDER[0])
  }
  // the auto-return to the chooser does NOT cancel: the last line may finish
  const onFinished = useCallback(() => {
    setJourney(null)
    setPaused(false)
  }, [])
  const running = journey !== null
  // ⎵ Space = ⏸ Pause / ▶ Resume while the story plays
  useSpaceToPause(active && running, () => setPaused((v) => !v))

  const narration = useDemoNarration({
    storyKey: journey ? 'plant' : null,
    beatId: beat,
    scripts: journey ? PLANT_SCRIPTS : null,
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
  const transcript = transcriptScript(PLANT_SCRIPTS, voiceLang)

  const rowW = FISSION_W - 2 * ROW_M
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
              title="Go to the story selection screen"
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-medium ${
                running ? `text-slate-100 ${KEY}` : 'cursor-default rounded-lg bg-sky-600 text-white'
              }`}
            >
              <span aria-hidden>⚡</span>
              {running ? 'Choose another story' : 'Choose a story'}
            </button>
          }
        />
        {/* the info panel belongs to a story: none on the chooser */}
        {running && (
          <div className={INFO_PANEL}>
            <SectionHeader type="how" />
            <Paras max={SECTION_MAX} items={HOW} />
            <SectionHeader type="honest" />
            <Paras max={SECTION_MAX} items={HONEST} className="text-slate-400" />
            <SectionHeader type="true" />
            <Paras max={SECTION_MAX} items={TRUE} />
          </div>
        )}
      </div>

      {/* middle: the canvas, with the chooser over it */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <SequenceStage
            width={FISSION_W}
            height={FISSION_H}
            buttonZone={BUTTON_ZONE}
            story={journey ? STORY : null}
            storyKey={journey}
            paused={paused}
            seek={seek}
            active={active}
            timeScale={narration.timeScale}
            holdBeat={narration.holdBeat}
            fit={narration.fit}
            onReport={setBeat}
            onFinished={onFinished}
          />
          {journey === null && (
            <>
              {(
                [
                  { id: 'story', thumb: 'plant', label: '📖 How a power plant works', subtitle: 'the same chain, kept steady: a very big kettle', ready: true },
                  { id: 'operator', thumb: 'operator', label: '🕹️ You are the operator', subtitle: 'the control rods are yours', ready: false },
                ] as const
              ).map((r, i) => (
                <div
                  key={r.id}
                  className={`absolute flex items-center overflow-hidden rounded-[14px] border border-slate-700/90 bg-[#0b1226] ${r.ready ? '' : 'opacity-45'}`}
                  style={{ left: ROW_M, top: ROW_M + i * (ROW_H + ROW_GAP), width: rowW, height: ROW_H }}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1 pl-[18px]">
                    <span className="text-[17px] font-semibold text-slate-200">{r.label}</span>
                    <span className="text-[13px] text-slate-400">{r.subtitle}</span>
                  </div>
                  <Thumb id={r.thumb} w={Math.round(rowW * 0.45)} h={ROW_H} />
                  {r.ready ? (
                    <button
                      type="button"
                      onClick={() => choose('story')}
                      aria-label="Watch How a power plant works"
                      className="group absolute inset-0 rounded-[14px] border border-slate-700/0 transition hover:border-sky-400/70 hover:bg-sky-400/10 focus-visible:border-sky-400 focus-visible:outline-none"
                    >
                      <span className="absolute right-3 top-1.5 rounded-full bg-sky-600 px-3 py-1 text-sm font-semibold text-white shadow-md shadow-black/40 transition group-hover:scale-105 group-hover:bg-sky-500">
                        ▶ Watch it
                      </span>
                    </button>
                  ) : (
                    <span className="absolute right-3 top-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-sm text-slate-400">
                      🔜 coming soon
                    </span>
                  )}
                </div>
              ))}
            </>
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

      {/* right: the story timeline, or the real photos */}
      <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-2">
        <div className={`flex gap-1 p-1 text-sm ${TRAY}`}>
          {(
            [
              ['story', '📖 Story'],
              ['photos', '📷 Photos'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRightTab(id)}
              aria-pressed={rightTab === id}
              className={`flex-1 rounded-lg px-3 py-1 transition ${
                rightTab === id ? 'bg-sky-600 font-medium text-white' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'story' ? '' : 'hidden'}`}>
          {journey === null ? (
            <p className="px-1 pt-2 text-sm text-slate-400">👈 Pick a story — it will appear here, step by step.</p>
          ) : (
            <TimelineColumn
              beats={PLANT_ORDER.map((id) => BEATS[id])}
              script={transcript.script}
              lang={transcript.lang}
              speakingPiece={narration.speakingPiece}
              speakingSentence={narration.speakingSentence}
              voiced={narration.voiced}
              currentId={beat}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
              restartIds={[PLANT_ORDER[0]]}
              resetKey={journey}
            />
          )}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}>
          <PlantPhotos />
        </div>
      </div>
    </div>
  )
}

const PlantPhotos = memo(function PlantPhotos() {
  return (
    <>
      {PLANT_PHOTO_GROUPS.map((group, gi) => (
        <section key={group.title} className={gi === 0 ? '' : 'mt-4'}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</h2>
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
                    <a href={ph.source} target="_blank" rel="noreferrer" className="underline hover:text-slate-300">
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
