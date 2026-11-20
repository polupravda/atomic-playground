import { useState, type ReactNode } from 'react'
import { PageNav } from './PageNav'
import { SideDrawer } from './SideDrawer'
import { SegmentedSwitch } from './SegmentedSwitch'
import { Paras, SECTION_MAX, SectionHeader, para, type Para } from './Paras'
import { NarrationLangSwitch, VoiceSwitch } from './VoiceSwitch'
import { interruptNarration, useDemoNarration } from './useNarration'
import { FLAT, KEY } from './surfaces'
import { usePageStore } from '../state/pageStore'
import { WAVE_H, WAVE_W } from '../stage/WaveStage'
import { CarbonStage, type CarbonLook, type CarbonMaterial, type CarbonScene } from '../stage/CarbonStage'
import { CRYSTAL_INTRO_KEY, CRYSTAL_INTRO_SCRIPTS } from '../stage/crystalIntros'
import type { WavePhoto } from '../core/wavePhotos'

// 🧊 Crystal lab (docs/how-things-work/13-proposal-crystal-lab.md) — one
// block of carbon, graphite or diamond. The Light lab's anatomy: the main
// view is 🔄 look around (turn the block, ⚛️ atoms or ⚪ balls and
// sticks); every other scene opens in a drawer from the buttons under the
// controls. Every change follows the child's hand; nothing plays by
// itself. Each scene has a short spoken intro.

const SCENES: Array<{ id: CarbonScene; label: string }> = [
  { id: 'look', label: '🔄 Look around' },
  { id: 'write', label: '✏️ Write' },
  { id: 'push', label: '👉 Push' },
  { id: 'light', label: '🔦 Shine a light' },
  { id: 'power', label: '🔋 Electricity' },
  { id: 'squeeze', label: '🗜️ Squeeze & heat' },
]
const DRAWER_SCENES = SCENES.filter((s) => s.id !== 'look')

// The drawer leaves a strip of the lab visible on the left (like the
// periodic table's); the lab view inside is built at full page width and
// scaled down to fit — the Light lab's drawers, exactly.
const DRAWER_GAP_PX = 96
const DRAWER_MAX_PX = 86 * 16
const DRAWER_PAD_PX = 2 * 20 + 1 // p-5 + the drawer's left border
/** the lab view's natural width: 16rem + gap + canvas (+ border) + gap + 16.5rem */
const LAB_W = 256 + 24 + WAVE_W + 2 + 24 + 264
function drawerFit() {
  const room = Math.min(window.innerWidth - DRAWER_GAP_PX, DRAWER_MAX_PX) - DRAWER_PAD_PX
  const k = Math.min(1, room / LAB_W)
  return { k, height: (window.innerHeight - 20) / k }
}

// ---------- 📷 the real things, under the drawer buttons ----------

const PHOTOS: Array<{ title: string; ph: WavePhoto }> = [
  {
    title: '✏️ graphite',
    ph: {
      file: 'crystal-graphite.jpg',
      caption: 'Graphite sticks for drawing: pencil lead with no wood around it. Dark grey and dull.',
      creator: 'mechnine, Flickr',
      license: 'CC BY 2.0',
      source: 'https://www.flickr.com/photos/45582840@N05/5121375788',
    },
  },
  {
    title: '💎 diamond',
    ph: {
      file: 'crystal-diamond.jpg',
      caption: 'A cut diamond: clear and full of sparkles. The same carbon atoms!',
      creator: 'Paul Gian, Wikimedia Commons',
      license: 'CC BY 3.0',
      source: 'https://commons.wikimedia.org/w/index.php?curid=23279115',
    },
  },
]

/** the Light lab's photo cards (amber frame, caption, credit) */
function Photos() {
  return (
    // only the photos scroll; the controls above them stay put
    <div className="flex min-h-0 w-[16.5rem] flex-1 flex-col gap-3 overflow-y-auto pr-1">
      {PHOTOS.map(({ title, ph }) => (
        <figure key={ph.file} className="w-64 shrink-0 rounded-xl border border-amber-500/60 bg-amber-500/10 p-2">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-200">{title}</div>
          <img src={`${import.meta.env.BASE_URL}examples/${ph.file}`} alt={ph.caption} className="w-full rounded-lg border border-slate-700" />
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
  )
}

// ---------- what each scene's info panel says ----------

interface SceneInfo {
  seeing: Para[]
  tips?: Para[]
  honest: Para[]
  story?: Para[]
}
const INFO: Record<CarbonScene, SceneInfo> = {
  look: {
    seeing: [
      para('✏️', 'Graphite:', ' tight inside a sheet, loose between sheets — sheets slide off, so a pencil writes.'),
      para('💎', 'Diamond:', ' every atom holds four neighbours, so nothing slides — the hardest natural material.'),
      para('⚛️', 'Atoms or balls and sticks:', ' a nucleus with two electron rings, or one ball per atom and a stick per hold.'),
    ],
    tips: [
      para('🔄', 'Drag the block to turn it', ' — from the side you see the gaps between graphite\'s sheets.'),
      para('🧰', 'Five things to try', ' under the controls: each with graphite, then with diamond.'),
    ],
    honest: [para('🔢', 'Only 63 atoms:', ' a real pencil tip holds more than a beach has grains of sand.')],
  },
  write: {
    seeing: [
      para('📄', 'Atoms slide off the bottom sheet', ' onto the paper — those grey dots are your line.'),
      para('⬇️', 'A sheet used up?', ' The sheets above move down and the next one takes its turn.'),
      para('💎', 'Diamond draws nothing:', ' every atom is held from four sides; its tip only tears the paper.'),
    ],
    honest: [
      para('🔍', 'Sped up and thinned out:', ' a real pencil line is thousands of sheets thick.'),
      para('🧩', 'Really flakes, not atoms:', ' graphite comes off in little flakes of sheets.'),
    ],
  },
  push: {
    seeing: [
      para('👉', 'A pushed sheet slides', ' — the sheets above and below hardly notice: they barely hold each other.'),
      para('💎', 'Diamond has nothing to slide:', ' four neighbours hold every atom; your finger just bumps into it.'),
    ],
    tips: [para('↔️', 'Start left to push right,', ' start right to push left; try top, middle and bottom sheets.')],
    honest: [para('🔨', '"Hardest" means hardest to scratch:', ' a hammer can still shatter a diamond.')],
  },
  light: {
    seeing: [
      para('⚫', 'Graphite looks dark:', ' its free electrons catch light of every color and turn it into warmth.'),
      para('💎', 'Diamond lets light through:', ' bonded electrons can\'t take it; faces split it into colors — the sparkle.'),
      para('🔗', 'Same atoms, opposite results:', ' it depends on free or held electrons.'),
    ],
    honest: [
      para('⚡', 'Exact pushes only:', ' diamond\'s electrons would need a bigger push than any color of light has.'),
      para('💍', 'Cut gems sparkle most:', ' their faces are cut to bounce the light around inside.'),
    ],
  },
  power: {
    seeing: [
      para('🔋', 'Electricity is electrons on the move,', ' pushed out of the battery\'s minus end, round, back into plus.'),
      para('✏️', 'Graphite conducts:', ' each atom has one electron left over, free to run along the sheets.'),
      para('💎', 'Diamond doesn\'t:', ' every outer electron is busy holding a neighbour — the bulb stays dark.'),
    ],
    honest: [
      para('🐌', 'Electrons crawl:', ' in a real wire they drift slowly; the push goes round almost at once.'),
      para('🏫', 'Pencil lead conducts,', ' which is why schools use it in circuit experiments.'),
    ],
  },
  squeeze: {
    seeing: [
      para('🗜️', 'Squeezed hard AND hot,', ' the sheets buckle and lock into the diamond grid — as deep underground.'),
      para('🔢', 'The same 63 atoms', ' before and after: nothing added, they only hold on in a new way.'),
    ],
    tips: [para('🔥', 'Fire first, then hold PUSH:', ' one of the two alone is not enough.')],
    honest: [
      para('🕰️', 'Millions of years, ~150 km down,', ' in nature; a factory press does it in days.'),
      para('💎', 'A diamond stays a diamond:', ' it would turn back, but far too slowly to ever see.'),
    ],
    story: [para('🏭', '1954:', ' the first factory-made diamonds came out of a giant press.')],
  },
}

export function CrystalLab() {
  const page = usePageStore((s) => s.page)
  const active = page === 'crystal'
  const [open, setOpen] = useState<CarbonScene | null>(null)
  const [look, setLook] = useState<CarbonLook>('sticks')
  const openScene = DRAWER_SCENES.find((s) => s.id === open)

  // 🔊 one short intro per scene, then each RESULT explained as it shows
  // (the bulb lights, the sheet slides… — CarbonStage reports it)
  const [result, setResult] = useState<string | null>(null)
  useDemoNarration({
    storyKey: CRYSTAL_INTRO_KEY,
    beatId: result ?? open ?? 'look',
    scripts: CRYSTAL_INTRO_SCRIPTS,
    active,
    paused: false,
  })
  const show = (scene: CarbonScene | null) => {
    interruptNarration() // the next scene's intro starts at once
    setResult(null)
    setOpen(scene)
  }

  return (
    <>
      <CrystalView
        scene="look"
        active={active && open === null}
        look={look}
        onLook={setLook}
        onResult={setResult}
        bottom={
          <>
            <div className="flex flex-col gap-2">
              {DRAWER_SCENES.map((s) => (
                <button key={s.id} type="button" onClick={() => show(s.id)} className={`w-64 px-4 py-2.5 text-left text-sm text-slate-200 ${KEY}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <Photos />
          </>
        }
      />
      <SideDrawer
        open={open !== null}
        onClose={() => show(null)}
        ariaLabel={openScene ? `${openScene.label.slice(openScene.label.indexOf(' ') + 1)} — Crystal lab scene` : 'Crystal lab scene'}
        // = DRAWER_GAP_PX / DRAWER_MAX_PX (Tailwind needs the literal class)
        widthClassName="w-[min(calc(100vw_-_96px),1376px)]"
        flushBottom
      >
        {openScene && (
          <div className="overflow-hidden" style={{ width: LAB_W * drawerFit().k, height: window.innerHeight - 20 }}>
            <div style={{ width: LAB_W, height: drawerFit().height, transform: `scale(${drawerFit().k})`, transformOrigin: 'top left' }}>
              <CrystalView
                key={openScene.id}
                scene={openScene.id}
                active={active}
                inDrawer
                look={look}
                onResult={setResult}
                canvasHeight={Math.floor(drawerFit().height) - 2}
                top={<h2 className="pr-8 text-lg font-semibold text-slate-100">{openScene.label}</h2>}
              />
            </div>
          </div>
        )}
      </SideDrawer>
    </>
  )
}

/** one Crystal lab view: info column, the block's canvas, control cards —
 *  the main page shows 🔄 look around, each other scene opens in a drawer */
function CrystalView({
  scene,
  active,
  inDrawer = false,
  look,
  onLook,
  onResult,
  canvasHeight = WAVE_H,
  top,
  bottom,
}: {
  scene: CarbonScene
  active: boolean
  inDrawer?: boolean
  /** ⚛️ atoms or ⚪ balls and sticks — chosen on the main view only */
  look: CarbonLook
  onLook?: (l: CarbonLook) => void
  /** a result is on screen: the narrator explains it */
  onResult?: (key: string) => void
  canvasHeight?: number
  top?: ReactNode
  bottom?: ReactNode
}) {
  const [material, setMaterial] = useState<CarbonMaterial>('graphite')
  const [resetKey, setResetKey] = useState(0)
  const info = INFO[scene]

  const reset = () => {
    // squeeze and heat starts again from graphite: that is its point
    if (scene === 'squeeze') setMaterial('graphite')
    setResetKey((n) => n + 1)
  }

  return (
    <div className="flex h-full min-h-0 items-start gap-6">
      {/* left: nav, voice, info */}
      <div className="flex h-full w-64 shrink-0 flex-col gap-3">
        {!inDrawer && (
          <>
            <PageNav />
            <div className={`flex w-64 shrink-0 flex-col gap-1.5 p-1.5 ${FLAT}`}>
              <VoiceSwitch />
              <NarrationLangSwitch />
            </div>
          </>
        )}
        <div className={`min-h-0 flex-1 overflow-y-auto p-3 text-sm leading-relaxed text-slate-300 ${FLAT}`}>
          {/* no 📍 Right now: the material and the sheets used are on the canvas */}
          <SectionHeader first type="seeing" />
          <Paras items={info.seeing} max={SECTION_MAX} />
          {info.tips && (
            <>
              <SectionHeader type="tips" />
              <Paras items={info.tips} max={SECTION_MAX} className="text-slate-400" />
            </>
          )}
          <SectionHeader type="honest" />
          <Paras items={info.honest} max={SECTION_MAX} className="text-slate-400" />
          {info.story && (
            <>
              <SectionHeader type="true" />
              <Paras items={info.story} max={SECTION_MAX} />
            </>
          )}
        </div>
      </div>

      {/* middle: the block of carbon */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
        <CarbonStage
          width={WAVE_W}
          height={canvasHeight}
          active={active}
          scene={scene}
          material={material}
          look={look}
          resetKey={resetKey}
          onBecameDiamond={() => setMaterial('diamond')}
          onResult={onResult}
        />
        {/* the view switch lives ON the canvas — the 🩻 X-ray scene's pill */}
        {scene === 'look' && onLook && (
          <div
            className="absolute z-10 flex -translate-x-1/2 gap-1 rounded-full border border-slate-600 bg-slate-900/90 p-0.5 text-xs"
            style={{ left: '50%', top: 8 }}
          >
            {(
              [
                ['atoms', '⚛️ Atoms'],
                ['sticks', '⚪ Balls & sticks'],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                type="button"
                onClick={() => onLook(id)}
                aria-pressed={look === id}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 transition ${
                  look === id ? 'bg-sky-600 font-medium text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={reset} className={`absolute bottom-3 right-3 px-3 py-1.5 text-sm text-slate-300 ${KEY}`}>
          ↺ Reset
        </button>
      </div>

      {/* right: the scene's title (drawer), which carbon, the drawers */}
      <div className="flex h-full min-h-0 w-[16.5rem] shrink-0 flex-col gap-4">
        {top}
        <SegmentedSwitch
          ariaLabel="Which carbon"
          options={[
            { id: 'graphite', label: '✏️ Graphite' },
            { id: 'diamond', label: '💎 Diamond' },
          ]}
          value={material}
          onChange={setMaterial}
        />
        {bottom}
      </div>
    </div>
  )
}
