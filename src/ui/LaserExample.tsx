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
import { LASER_ORDER, LASER_T, drawLaserBeat } from '../stage/laserScenes'
import { LASER_SCRIPTS, LASER_STORY_KEY } from '../stage/laserNarration'
import { LASER_PHOTO_GROUPS } from '../core/laserPhotos'

// R08 — 🔦 Lasers: a 🎬 story demo with the page anatomy of the others
// (16rem info · canvas · 18rem story/photos). Three stories (proposal 16):
// 🔦 How a laser makes its light (built 2026-11-20), ✂️ Light that cuts
// and 🌕 Lasers to the Moon (coming soon).

const STORY: SequenceStory = { order: LASER_ORDER, durations: LASER_T, draw: drawLaserBeat }
const BUTTON_ZONE = 86

type LaserJourney = 'how'

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
  para('⚛️', 'In ruby the red light comes from chromium\'s inner electrons', ' (an atom that lost three), drawn here as its one outer electron on a higher step.'),
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

// 📖 the story column: each beat's chapter and icon — its words are the
// narration script itself (TimelineColumn)
const BEATS: Record<string, StoryBeat> = {
  question: { id: 'question', group: '❓ A question', icon: '❓' },
  inside: { id: 'inside', group: '🔦 Inside a laser', icon: '🔦' },
  zoom: { id: 'zoom', group: '🔍 Close-up: one atom', icon: '🔍' },
  flash: { id: 'flash', group: '🔍 Close-up: one atom', icon: '⚡' },
  fall: { id: 'fall', group: '🔍 Close-up: one atom', icon: '🎲' },
  twin: { id: 'twin', group: '👯 Twins', icon: '👯' },
  mirrors: { id: 'mirrors', group: '🪞 The mirrors', icon: '🪞' },
  beam: { id: 'beam', group: '🎈 The payoff', icon: '🔴' },
}

const ROW_M = 18
const ROW_GAP = 14
const ROW_H = 190

export function LaserExample({ active }: { active: boolean }) {
  // null = the chooser
  const [journey, setJourney] = useState<LaserJourney | null>(null)
  const [paused, setPaused] = useState(false)
  const [beat, setBeat] = useState<string>(LASER_ORDER[0])
  const [seek, setSeek] = useState<StorySeek | null>(null)
  const [rightTab, setRightTab] = useState<'story' | 'photos'>('story')
  const choose = (j: LaserJourney | null) => {
    cancelNarration() // navigating is a deliberate interruption
    setJourney(j)
    setPaused(false)
    setBeat(LASER_ORDER[0])
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
    storyKey: journey ? LASER_STORY_KEY : null,
    beatId: beat,
    scripts: journey ? LASER_SCRIPTS : null,
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
  const transcript = transcriptScript(LASER_SCRIPTS, voiceLang)

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
              <span aria-hidden>🔦</span>
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
                  { id: 'how', thumb: 'laser-how', label: '🔦 How a laser makes its light', subtitle: 'light that copies itself between two mirrors', ready: true },
                  { id: 'cut', thumb: 'laser-cut', label: '✂️ Light that cuts', subtitle: 'from a tiny pointer to a laser that cuts steel', ready: false },
                  { id: 'moon', thumb: 'laser-moon', label: '🌕 Lasers to the Moon', subtitle: 'a flash, a mirror on the Moon, and back', ready: false },
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
                      onClick={() => choose('how')}
                      aria-label="Watch How a laser makes its light"
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
              beats={LASER_ORDER.map((id) => BEATS[id])}
              script={transcript.script}
              lang={transcript.lang}
              speakingPiece={narration.speakingPiece}
              speakingSentence={narration.speakingSentence}
              voiced={narration.voiced}
              currentId={beat}
              visible={active && rightTab === 'story'}
              onSeek={onSeek}
              restartIds={[LASER_ORDER[0]]}
              resetKey={journey}
            />
          )}
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}>
          <LaserPhotos />
        </div>
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
