import { memo, useCallback, useState } from 'react'
import { useSpaceToPause } from './useSpaceToPause'
import { PageNav } from './PageNav'
import {
  LightStage,
  lightStoryOrder,
  type LightReport,
  type LightStoryId,
} from '../stage/LightStage'
import { lightCloseupStory } from '../stage/lightCloseup'
import { LIGHT_PHOTO_GROUPS } from '../core/lightPhotos'
import { Paras, SectionHeader, type Para, SECTION_MAX } from './Paras'
import { TimelineColumn, type StoryBeat } from './TimelineColumn'
import { transcriptScript } from './storyChapters'
import type { StorySeek } from '../stage/flowPacing'
import { ColorsTable, LightParticleLegend, PhotonStats } from './LightLegend'
import { FIREWORK_SCRIPTS } from '../stage/fireworkNarration'
import { useVoiceStore, type NarrationLang } from '../state/voiceStore'
import { useDemoNarration } from './useNarration'
import { NarrationNotice } from './NarrationNotice'
import { BackToStories, INFO_PANEL, LiveOverlay, StoryTabs, backToMenu, type StoryTab } from './DemoControls'
import { KEY } from './surfaces'

/** each light story's narration scripts, per language */
const NARRATION: Partial<Record<LightStoryId, Partial<Record<NarrationLang, Record<string, string>>>>> = {
  firework: FIREWORK_SCRIPTS,
}

// R02 — ✨ Light & color: the second "Atoms in action" example. Same page
// anatomy as the bomb demo: info panel (left) — demo canvas with a chooser
// (middle) — story timeline / real photos (right). One story so far
// (🎆 Firework); neon, aurora and the star detective plug in as further
// chooser rows (steps 34b/34c).

const HOW_IT_WORKS: Para[] = [
  {
    icon: '⚡',
    text: (
      <>
        <b>Atoms swallow energy</b> — from heat (firework), electricity (neon sign) or a crash (aurora).
      </>
    ),
  },
  {
    icon: '⬆️',
    text: (
      <>
        The energy kicks an electron <b>UP a ladder of fixed seats</b> — nothing in between.
      </>
    ),
  },
  {
    icon: '⬇️',
    text: (
      <>
        It falls back home and the energy leaves as <b>a photon</b>, a little piece of light.
      </>
    ),
  },
  {
    icon: '🌈',
    text: (
      <>
        <b>Color = size of the drop:</b> small → red, bigger → blue; far bigger → invisible UV, X-rays, γ rays.
      </>
    ),
  },
  {
    icon: '🧬',
    text: (
      <>
        Fixed steps give <b>every element its own color barcode</b> — it colors fireworks and reveals what stars are made of.
      </>
    ),
  },
]

const HONEST: Para[] = [
  {
    icon: '🐢',
    text: (
      <>
        <b>Super slow motion:</b> a real jump-and-fall takes about a billionth of a second.
      </>
    ),
  },
  {
    icon: '🪜',
    text: (
      <>
        <b>Only a few energy steps shown</b>; the dashed ring is a helper picture — the real seats are subshells (builder's orbitals view).
      </>
    ),
  },
  {
    icon: '🌊',
    text: (
      <>
        <b>The wavy line is a symbol</b> for a photon (more wiggles = more energy) — the same as the bomb demo's γ rays.
      </>
    ),
  },
  {
    icon: '🎆',
    text: (
      <>
        <b>Lithium and sodium chosen on purpose:</b> their colors come from lone atoms; strontium, barium and copper colors mostly come from small molecules.
      </>
    ),
  },
  {
    icon: '📏',
    text: (
      <>
        <b>No shared scale</b> between atoms, photons and the barcode strips.
      </>
    ),
  },
]

const TRUE_STORY: Para[] = [
  {
    icon: '🔭',
    text: (
      <>
        <b>1814, Fraunhofer</b> found dark lines in the Sun's rainbow — the first light barcode ever read.
      </>
    ),
  },
  {
    icon: '☀️',
    text: (
      <>
        <b>1868, helium</b> — a solar line matching no known element, named after the Sun; found on Earth 27 years later.
      </>
    ),
  },
  {
    icon: '🌌',
    text: (
      <>
        <b>Every element in faraway stars</b> was identified this way — nobody has ever brought back a drop of a star.
      </>
    ),
  },
]

// 📖 the story column: each beat's chapter and icon — its words are the
// narration script itself (TimelineColumn)
const FIREWORK_BEATS: Record<string, StoryBeat> = {
  scene: { id: 'scene', group: '🎆 The firework', icon: '🎆' },
  zoom: { id: 'zoom', group: '🎆 The firework', icon: '🔍' },
  // 🔁 the drill-in after the close-up (playbook rule 25)
  closeupDrill: { id: 'closeupDrill', group: '🔁 Once more, closer', icon: '🔁' },
  barcode: { id: 'barcode', group: '🌈 The barcode', icon: '🌈' },
  payoff: { id: 'payoff', group: '🎇 The payoff', icon: '🎇' },
}

function storyBeats(story: LightStoryId): StoryBeat[] {
  const close = lightCloseupStory()
  return lightStoryOrder(story).map((id) =>
    FIREWORK_BEATS[id] ??
      { id, group: '🔍 Close-up: one atom making light', icon: close[Number(id.slice(7))].icon },
  )
}

const initialReport: LightReport = {
  phase: 'scene',
  storyId: 'scene',
  closeupStep: 0,
  liCaught: 0,
  naCaught: 0,
}

export function LightExample({ active, story }: { active: boolean; story: LightStoryId | null }) {
  const [paused, setPaused] = useState(false)
  // a new story (or none) starts unpaused
  const [prev, setPrev] = useState(story)
  if (prev !== story) {
    setPrev(story)
    setPaused(false)
  }
  const [seek, setSeek] = useState<StorySeek | null>(null)
  const [rightTab, setRightTab] = useState<StoryTab>('story')
  const [report, setReport] = useState<LightReport>(initialReport)
  const running = story !== null
  // ⎵ Space = ⏸ Pause / ▶ Resume while a story plays
  useSpaceToPause(active && running, () => setPaused((v) => !v))

  // 🔊 narration — listen first, then watch (10-narration-strategy.md)
  const narration = useDemoNarration({
    storyKey: story,
    beatId: report.storyId,
    scripts: story ? (NARRATION[story] ?? null) : null,
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
  const transcript = transcriptScript(story ? NARRATION[story] : null, voiceLang)

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: the menu + the voice card */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
      </div>

      {/* middle: the demo canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <LightStage
            story={story}
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
          {running && (report.phase === 'barcode' || report.phase === 'payoff') && (
            <LiveOverlay>
              <PhotonStats r={report} />
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
          {story !== null && (
            <TimelineColumn
              beats={storyBeats(story)}
              script={transcript.script}
              lang={transcript.lang}
              speakingPiece={narration.speakingPiece}
              speakingSentence={narration.speakingSentence}
              voiced={narration.voiced}
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
        {running && (
          <div className={`${INFO_PANEL} ${rightTab === 'notes' ? '' : 'hidden'}`}>
            {story !== null && (
              <>
                <SectionHeader type="legend" />
                <LightParticleLegend />
              </>
            )}
            <SectionHeader type="facts">The colors themselves</SectionHeader>
            <ColorsTable current={story === 'firework' ? ['li', 'na'] : undefined} />
            <SectionHeader type="how" />
            <Paras max={SECTION_MAX} items={HOW_IT_WORKS} />
            <SectionHeader type="honest" />
            <Paras max={SECTION_MAX} items={HONEST} className="text-slate-400" />
            <SectionHeader type="true" />
            <Paras max={SECTION_MAX} items={TRUE_STORY} />
          </div>
        )}
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
                className={`rounded-xl p-2 transition ${
                  ph.story === story ? 'border border-amber-500/60 bg-amber-500/10' : 'bg-slate-800/40'
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
