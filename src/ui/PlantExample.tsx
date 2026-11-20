import { memo, useCallback, useState } from 'react'
import { PageNav } from './PageNav'
import { DemoControls, INFO_PANEL } from './DemoControls'
import { NarrationNotice } from './NarrationNotice'
import { Paras, SectionHeader, type Para } from './Paras'
import { TimelineColumn, type TimelineItem } from './TimelineColumn'
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

const HOW: Para[] = [
  { icon: '⚛️', text: 'The same uranium and the same splits as the bomb. The only difference is control: here every split may cause just ONE more split.' },
  { icon: '🦯', text: 'Control rods are made of materials that swallow neutrons (boron, cadmium). Push them in: fewer splits. Pull them out: more.' },
  { icon: '💧', text: 'The water does two jobs: it carries the heat away, and it slows the neutrons down, which helps them split uranium.' },
  { icon: '🌀', text: 'Heat boils water, the steam spins the turbine, the turbine turns the generator, the generator makes electricity. Coal and gas plants work the same way; only the fire is different.' },
  { icon: '🥄', text: `One fuel pellet, the size of a fingertip, gives about as much energy as ${PELLET_COAL_TONNES} tonne of coal.` },
]

const HONEST: Para[] = [
  { icon: '🐢', text: 'Slowed down and simplified: a real core holds trillions of trillions of atoms and keeps splitting them for years. Our atoms and rods are storybook-sized.' },
  { icon: '⏱️', text: 'Steering works because a few neutrons come out late — about 1 in 150, up to a minute later. Those late ones give the rods time to act.' },
  { icon: '🔀', text: 'A split turns one uranium atom into two smaller ones — often barium and krypton. Its 92 electrons are shared between them (56 + 36), never lost. For a moment the fast pieces are missing a few electrons; they pick them up again as they slow down. These new atoms stay in the fuel, and they are part of why used fuel is radioactive.' },
  { icon: '🛑', text: 'The automatic drop of the rods is called a scram. After it, the plant is shut down, and people start it again later, slowly.' },
  { icon: '💥', text: `Power-plant fuel holds only about ${FUEL_SPLITTABLE_PER_100} splitting uranium atoms in 100 (bomb fuel about 90). It cannot explode like a bomb. A plant CAN overheat badly — that is what the big accidents were.` },
  { icon: '🔁', text: 'Most plants keep two separate loops of water, so the water that touches the fuel never reaches the turbine. We draw one loop.' },
  { icon: '🗄️', text: 'Used fuel stays radioactive for many thousands of years. Today it first cools in a pool for about five to ten years, then moves into dry steel-and-concrete casks, usually at the plant. Finland is building the first deep underground store (Onkalo), meant to keep it safe for 100,000 years. The rays are drawn like the Sun story\'s γ rays; they are really invisible.' },
  { icon: '🔵', text: 'In real photos the water around the fuel glows blue. That glow is called Cherenkov light.' },
]

const TRUE: Para[] = [
  { icon: '🏟️', text: 'On 2 December 1942, Enrico Fermi\'s team ran the first reactor, Chicago Pile-1, under the stands of a university sports field. It had one control rod on a rope, and a man stood ready with an axe to cut the rope if needed.' },
  { icon: '💡', text: 'Today about 400 reactors make about a tenth of the world\'s electricity, with no smoke while they run.' },
  { icon: '🕊️', text: 'Two accidents changed how reactors are built. In Chernobyl (1986) a badly designed reactor was pushed too far during a test and overheated. In Fukushima (2011) a giant earthquake and tsunami knocked out the cooling. Neither was a bomb-like explosion, but many people had to leave their homes, and some places are still empty today. Newer plants are designed to cool down and shut down by themselves.' },
]

const STEPS: Record<string, TimelineItem> = {
  remember: { id: 'remember', group: '💥 Remember', icon: '💥', title: 'The bomb\'s chain', text: 'One split makes two, two make four … 128 in a blink. Can the same atoms light a city instead?' },
  rods: { id: 'rods', group: '🦯 The trick', icon: '🦯', title: 'Control rods', text: 'Fuel rods (uranium atoms inside) stand in water; grey control rods hang between them. Of a split\'s two new neutrons, one is swallowed by a control rod; the other crosses the water and splits just one atom in the next fuel rod.' },
  steady: { id: 'steady', group: '🦯 The trick', icon: '➖', title: 'One, then one, then one', text: 'The bomb doubles and doubles. The power plant: every split makes exactly one more. Steady.' },
  heat: { id: 'heat', group: '♨️ A very big kettle', icon: '🔥', title: 'How splits make heat', text: 'One fuel rod, very close, standing in water. The two pieces of a split atom crash into the atoms next to them, which shake harder and harder: that shaking is heat. The hot rod bumps the water around it; the water shakes faster and boils.' },
  kettle: { id: 'kettle', group: '♨️ A very big kettle', icon: '🌀', title: 'Steam spins a turbine', text: 'The steady splits make heat, the heat boils water, the steam spins a big fan: the turbine.' },
  lights: { id: 'lights', group: '♨️ A very big kettle', icon: '💡', title: 'The generator lights a town', text: 'The turbine turns a generator. Electricity runs along wires and reaches every house at the same moment: lights, fridges and TVs work.' },
  safe: { id: 'safe', group: '🛡️ Safety', icon: '🛑', title: 'Safe by itself', text: 'Rods pulled too far: the splits branch. The rods drop back by themselves and it dies down. And the fuel cannot explode like a bomb.' },
  waste: { id: 'waste', group: '🗄️ The honest part', icon: '☢️', title: 'The used fuel', text: 'The used fuel is radioactive: it sends out invisible, harmful rays. It cools for years in a deep pool (water stops the rays), then goes into thick steel-and-concrete casks under guard. It stays radioactive for a very long time; that problem is not solved yet.' },
}

const ROW_M = 18
const ROW_GAP = 14
const ROW_H = 200

export function PlantExample({ active }: { active: boolean }) {
  // null = the chooser
  const [journey, setJourney] = useState<PlantJourney | null>(null)
  const [paused, setPaused] = useState(false)
  const [beat, setBeat] = useState<string>(PLANT_ORDER[0])
  const [seek, setSeek] = useState<{ id: string; n: number } | null>(null)
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
  const onSeek = useCallback((id: string) => {
    cancelNarration()
    setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1 }))
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
        <div className={INFO_PANEL}>
          <SectionHeader>How it works</SectionHeader>
          <Paras items={HOW} />
          <SectionHeader>Honest notes</SectionHeader>
          <Paras items={HONEST} className="text-slate-400" />
          <SectionHeader>A true story</SectionHeader>
          <Paras items={TRUE} />
        </div>
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
              items={PLANT_ORDER.map((id) => STEPS[id])}
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
