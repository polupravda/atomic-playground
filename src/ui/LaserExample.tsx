import { memo, useCallback, useState } from 'react'
import { PageNav } from './PageNav'
import { BackToStories, INFO_PANEL, StoryTabs, backToMenu, type StoryTab } from './DemoControls'
import { NarrationNotice } from './NarrationNotice'
import { Paras, SectionHeader, para, type Para, SECTION_MAX } from './Paras'
import { TimelineColumn, type StoryBeat } from './TimelineColumn'
import { transcriptScript } from './storyChapters'
import { useVoiceStore } from '../state/voiceStore'
import type { StorySeek } from '../stage/flowPacing'
import { FLAT, KEY } from './surfaces'
import { useDemoNarration } from './useNarration'
import { useSpaceToPause } from './useSpaceToPause'
import { SequenceStage, type SequenceStory } from '../stage/SequenceStage'
import { FISSION_H, FISSION_W } from '../stage/FissionStage'
import { LASER_ORDER, LASER_T, drawLaserBeat } from '../stage/laserScenes'
import { LASER_SCRIPTS, LASER_STORY_KEY } from '../stage/laserNarration'
import { CUT_ORDER, CUT_T, drawCutBeat } from '../stage/laserCutScenes'
import { CUT_SCRIPTS, CUT_STORY_KEY } from '../stage/laserCutNarration'
import { MOON_ORDER, MOON_T, drawMoonBeat } from '../stage/laserMoonScenes'
import { MOON_SCRIPTS, MOON_STORY_KEY } from '../stage/laserMoonNarration'
import { LASER_PHOTO_GROUPS } from '../core/laserPhotos'

// R08 — 🔦 Lasers: a 🎬 story demo with the page anatomy of the others
// (16rem info · canvas · 18rem story/photos). Three stories (proposal 16):
// 🔦 How a laser makes its light (built 2026-11-20), ✂️ Light that cuts
// and 🌕 Lasers to the Moon (built 2026-11-21).

const BUTTON_ZONE = 86

export type LaserJourney = 'how' | 'cut' | 'moon'

// the info panel, for adults: one scannable sentence per item, key phrase
// in bold (Paras.tsx)
const HOW: Para[] = [
  para('🔤', '"LASER" spells its own recipe:', ' Light Amplification by Stimulated Emission of Radiation.'),
  para('👯', 'A photon passing a lifted electron makes it fall and send out an exact twin', ' — same color, direction and rhythm (stimulated emission, Einstein 1917).'),
  para('🪞', 'Two mirrors send the twins back through the ruby again and again,', ' so every trip makes more; the partly-silver one lets a few out: the beam.'),
  para('🎯', 'All its photons go the same way,', ' so a laser beam spreads very little — the dot stays small far away.'),
  para('🟢', 'Green in, red out:', ' the lamp\'s green photons carry more energy than the red ones the atoms give back.'),
]

const HONEST: Para[] = [
  para('🔢', 'A real flash holds billions of billions of photons;', ' a handful stand for them, and the column\'s doubling is capped.'),
  para('⚛️', 'In ruby the red light comes from chromium\'s inner electrons', ' (an atom that lost three), drawn here as its one outer electron moving out to a bigger ring.'),
  para('🪞', 'The partly-silver mirror lets only a few photons in a hundred through,', ' not as many as drawn.'),
  para('🐢', 'Slowed hugely:', ' a photon crosses the ruby in less than a billionth of a second.'),
  para('⚡', 'Ruby lasers flash rather than shine steadily;', ' pointers use tiny chips instead of ruby.'),
  para('👁️', 'From the side a laser beam is invisible in clean air;', ' it is drawn so you can follow it.'),
]

const TRUE: Para[] = [
  para('🔦', 'Theodore Maiman, 16 May 1960:', ' the first laser — a finger-sized ruby inside a coiled flash lamp (📷).'),
  para('💡', 'Einstein, 1917:', ' worked out on paper that light can make atoms copy it — 43 years before anyone built a laser.'),
  para('🤷', '"A solution looking for a problem"', ' — today lasers read barcodes, carry the internet through glass fibres and play music discs.'),
]

// ✂️ Light that cuts
const CUT_HOW: Para[] = [
  para('🔎', 'A lens squeezes the whole beam into a spot thinner than a hair,', ' so thousands of watts land on a speck: the iron atoms there shake until the steel melts.'),
  para('💨', 'A jet of gas blows the melt out of the cut', ' as the spot moves along the drawing.'),
  para('🌈', 'Lasers and their light:', ' pointers and shop scanners (red, green or blue chips), CDs infrared, DVDs red, Blu-ray blue-violet (the "Blu" is its laser), internet fibres infrared, eye surgery ultraviolet, cutters infrared.'),
  para('👁️', 'The eye\'s lens concentrates a laser beam about 100,000 times on the retina,', ' which has no pain sense — it cannot warn you.'),
  para('😉', 'A weak visible beam (under 1 mW) is usually stopped by the blink,', ' a quarter of a second; invisible infrared gives no blink at all — and cheap green pointers can leak it.'),
  para('⚠️', 'Pointers sold to the public should be under 1 mW in Europe (5 mW in the US);', ' strong lasers are dangerous even when reflected.'),
]

const CUT_HONEST: Para[] = [
  para('📏', 'The power gauge is a log scale:', ' each step is ten times stronger; the powers are rounded, typical values.'),
  para('🏟️', 'The biggest laser\'s bar is its peak,', ' held for a few billionths of a second.'),
  para('👻', 'Infrared and ultraviolet are invisible:', ' they are drawn ghost-pale so you can follow them.'),
  para('🐢', 'The cut is sped up,', ' the star is huge, and real cutters work behind closed covers.'),
  para('⚛️', 'Steel is mostly iron;', ' its atoms shake a little even when cold, and a handful stand for countless billions.'),
]

const CUT_TRUE: Para[] = [
  para('☀️', '5 December 2022:', ' the biggest laser (192 beams, in a building three football fields long) made a tiny star burn on Earth for an instant — fusion ignition, the 🌟 Sun story\'s fusion, made by light.'),
  para('💿', 'Blu-ray is named after its blue laser:', ' a shorter wave makes smaller dots, so more fits on the disc.'),
]

// 🌕 Lasers to the Moon
const MOON_HOW: Para[] = [
  para('📐', 'The reflector is a "corner cube":', ' three mirrors at right angles send light straight back where it came from, from any direction — bike reflectors and road signs use the same shape.'),
  para('🌕', 'Five reflectors work today:', ' Apollo 11 left 100 corners (1969), Apollo 14 another 100, Apollo 15 three hundred; the Soviet robot cars Lunokhod 1 and 2 carry 14 each.'),
  para('🟢', 'Today\'s stations fire green flashes (532 nm)', ' through big telescopes, many each second; the first, in 1969, used ruby lasers — the red of the 🔦 first story.'),
  para('⏱️', 'Up and back takes about 2.6 seconds:', ' half that time times the speed of light is the distance — about 384,400 km on average. The Moon\'s path is an oval, so it changes by some 40,000 km every month.'),
  para('🚦', 'Light in empty space always flies at the same speed', ' — 299,792.458 km every second, never faster or slower; that is why a time can be turned into a distance (the metre itself is defined by it).'),
  para('🎯', 'Timing the trip to a few trillionths of a second', ' measures the distance to a few millimetres.'),
]
const MOON_HONEST: Para[] = [
  para('🐢', 'Light is drawn hugely slowed:', ' it really takes about 1.3 s each way; the stopwatch shows the real time.'),
  para('📏', 'Earth and Moon are drawn far closer than they are', ' — the real gap is about 30 Earths wide — and the drift is enlarged millions of times.'),
  para('🌫️', 'The spot is about two kilometres wide;', ' "a town" is rounded, and the town is drawn only for size.'),
  para('🔢', 'One photon home per hundred million billion is a rough figure;', ' stations collect a few per second from thousands of flashes.'),
  para('🪞', 'The panel is drawn with 40 round corners', ' (Apollo 11\'s has 100, in a 46 cm square).'),
]
const MOON_TRUE: Para[] = [
  para('🧑‍🚀', '21 July 1969:', ' Buzz Aldrin set up Apollo 11\'s reflector; days later, the Lick Observatory caught the first echo.'),
  para('🌊', 'The Moon drifts away about 3.8 cm a year', ' because Earth\'s tides tug it forward — the same tug slowly makes Earth\'s day longer.'),
  para('🌫️', 'From the side a laser beam is invisible in clean air;', ' light shows use fog so each droplet bounces a little light to you.'),
]

// 📖 the story column: each beat's chapter and icon — its words are the
// narration script itself (TimelineColumn)
const HOW_BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  inside: { id: 'inside', group: '🔦 Inside a laser', icon: '🔦' },
  zoom: { id: 'zoom', group: '🔍 Close-up: one atom', icon: '🔍' },
  flash: { id: 'flash', group: '🔍 Close-up: one atom', icon: '⚡' },
  flashDrill: { id: 'flashDrill', group: '🔁 Once more, closer', icon: '🔁' },
  fall: { id: 'fall', group: '🔍 Close-up: one atom', icon: '🎲' },
  twin: { id: 'twin', group: '👯 Twins', icon: '👯' },
  twinDrill: { id: 'twinDrill', group: '🔁 Once more, closer', icon: '🔁' },
  mirrors: { id: 'mirrors', group: '🪞 The mirrors', icon: '🪞' },
  beam: { id: 'beam', group: '🎈 The payoff', icon: '🔴' },
}

const CUT_BEATS: Record<string, StoryBeat> = {
  family: { id: 'family', group: '🔦 The laser family', icon: '🔦' },
  squeeze: { id: 'squeeze', group: '🔎 Squeeze it', icon: '🔎' },
  heat: { id: 'heat', group: '🔍 Close-up: the steel', icon: '🔥' },
  drill: { id: 'drill', group: '🔁 Once more, closer', icon: '🔁' },
  cut: { id: 'cut', group: '✂️ The cut', icon: '⭐' },
  invisible: { id: 'invisible', group: '👻 Invisible light', icon: '👻' },
  eye: { id: 'eye', group: '👁️ Your eye', icon: '👁️' },
  safe: { id: 'safe', group: '🛡️ Safety', icon: '🛡️' },
}

const MOON_BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  mirrors: { id: 'mirrors', group: '🪞 The mirrors', icon: '🧑‍🚀' },
  trick: { id: 'trick', group: '📐 The trick', icon: '📐' },
  flash: { id: 'flash', group: '🔭 The flash', icon: '🔭' },
  back: { id: 'back', group: '↩️ The way back', icon: '↩️' },
  timing: { id: 'timing', group: '⏱️ The timing', icon: '⏱️' },
  drill: { id: 'drill', group: '🔁 Once more, closer', icon: '🔁' },
  drift: { id: 'drift', group: '🎈 The payoff', icon: '🌙' },
}

/** everything that differs between the stories */
const JOURNEYS: Record<
  LaserJourney,
  {
    story: SequenceStory
    order: readonly string[]
    beats: Record<string, StoryBeat>
    scripts: typeof LASER_SCRIPTS
    storyKey: string
    how: Para[]
    honest: Para[]
    trueStory: Para[]
  }
> = {
  how: {
    story: { order: LASER_ORDER, durations: LASER_T, draw: drawLaserBeat },
    order: LASER_ORDER,
    beats: HOW_BEATS,
    scripts: LASER_SCRIPTS,
    storyKey: LASER_STORY_KEY,
    how: HOW,
    honest: HONEST,
    trueStory: TRUE,
  },
  cut: {
    story: { order: CUT_ORDER, durations: CUT_T, draw: drawCutBeat },
    order: CUT_ORDER,
    beats: CUT_BEATS,
    scripts: CUT_SCRIPTS,
    storyKey: CUT_STORY_KEY,
    how: CUT_HOW,
    honest: CUT_HONEST,
    trueStory: CUT_TRUE,
  },
  moon: {
    story: { order: MOON_ORDER, durations: MOON_T, draw: drawMoonBeat },
    order: MOON_ORDER,
    beats: MOON_BEATS,
    scripts: MOON_SCRIPTS,
    storyKey: MOON_STORY_KEY,
    how: MOON_HOW,
    honest: MOON_HONEST,
    trueStory: MOON_TRUE,
  },
}


export function LaserExample({ active, journey }: { active: boolean; journey: LaserJourney | null }) {
  const [paused, setPaused] = useState(false)
  const [beat, setBeat] = useState<string>(LASER_ORDER[0])
  // a new story (or none) starts unpaused, at its first beat
  const [prev, setPrev] = useState(journey)
  if (prev !== journey) {
    setPrev(journey)
    setPaused(false)
    setBeat(journey ? JOURNEYS[journey].order[0] : LASER_ORDER[0])
  }
  const J = journey ? JOURNEYS[journey] : null
  const [seek, setSeek] = useState<StorySeek | null>(null)
  const [rightTab, setRightTab] = useState<StoryTab>('story')
  const running = journey !== null
  // ⎵ Space = ⏸ Pause / ▶ Resume while the story plays
  useSpaceToPause(active && running, () => setPaused((v) => !v))

  const narration = useDemoNarration({
    storyKey: J ? J.storyKey : null,
    beatId: beat,
    scripts: J ? J.scripts : null,
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
  const transcript = transcriptScript(J ? J.scripts : LASER_SCRIPTS, voiceLang)

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: the menu + the voice card */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
      </div>

      {/* middle: the canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <SequenceStage
            width={FISSION_W}
            height={FISSION_H}
            buttonZone={BUTTON_ZONE}
            story={J ? J.story : null}
            storyKey={journey}
            paused={paused}
            seek={seek}
            active={active}
            timeScale={narration.timeScale}
            holdBeat={narration.holdBeat}
            fit={narration.fit}
            onReport={setBeat}
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
        <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'story' ? '' : 'hidden'}`}>
          {J !== null && (
            <TimelineColumn
              beats={J.order.map((id) => J.beats[id])}
              script={transcript.script}
              lang={transcript.lang}
              speakingPiece={narration.speakingPiece}
              speakingSentence={narration.speakingSentence}
              voiced={narration.voiced}
              currentId={beat}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
              restartIds={[J.order[0]]}
              resetKey={J.storyKey}
            />
          )}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}>
          <LaserPhotos />
        </div>
        {J && (
          <div className={`${INFO_PANEL} ${rightTab === 'notes' ? '' : 'hidden'}`}>
            <SectionHeader type="how" />
            <Paras max={SECTION_MAX} items={J.how} />
            <SectionHeader type="honest" />
            <Paras max={SECTION_MAX} items={J.honest} className="text-slate-400" />
            <SectionHeader type="true" />
            <Paras max={SECTION_MAX} items={J.trueStory} />
          </div>
        )}
      </div>
    </div>
  )
}

const LaserPhotos = memo(function LaserPhotos() {
  return (
    <>
      {LASER_PHOTO_GROUPS.map((group, gi) => (
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
