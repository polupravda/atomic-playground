import { useState, type ReactNode } from 'react'
import { PageNav } from './PageNav'
import { SideDrawer } from './SideDrawer'
import { SegmentedSwitch } from './SegmentedSwitch'
import { Paras, SectionHeader, type Para } from './Paras'
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
      { icon: '⚛️', text: 'Every carbon atom here is drawn the way the 🧪 Bonding lab draws it: a tiny nucleus in the middle, its electrons on two rings.' },
      { icon: '⚪', text: 'Balls and sticks: every ball is one whole atom, every stick shows two atoms holding on to each other. The same block, easier to see who holds whom.' },
      { icon: '✏️', text: 'Graphite: inside a sheet the atoms hold tight; between the sheets they barely hold. So sheets slide off — that is how a pencil writes.' },
      { icon: '💎', text: 'Diamond: every atom holds four neighbours, up, down and sideways. Nothing can slide. That makes it the hardest natural material.' },
    ],
    tips: [
      { icon: '🔄', text: 'Drag the block to turn it. Look at graphite from the side: you see the gaps between the sheets.' },
      { icon: '🧰', text: 'Under the controls are five things to do to the block. Try each with graphite, then with diamond.' },
    ],
    honest: [{ icon: '🔢', text: 'The block shows 63 atoms. A real pencil tip holds more atoms than there are grains of sand on a beach.' }],
  },
  write: {
    seeing: [
      { icon: '✏️', text: 'The block is the very tip of a pencil, seen up close. Its carbon atoms lie in flat sheets.' },
      { icon: '📄', text: 'The sheets barely hold on to each other. Rub the tip on paper and atoms slide off the bottom sheet and stay on the paper. Those grey dots are your line!' },
      { icon: '⬇️', text: 'When the bottom sheet is used up, the sheets above move down, and the next one takes its turn.' },
      { icon: '💎', text: 'Graphite draws a line. Diamond does not: nothing comes off it, because every atom is held from four sides. Its hard tip only tears the paper.' },
    ],
    honest: [
      { icon: '🔍', text: 'Here a sheet is used up quickly and only a few atoms fall, so you can follow each one. A real pencil line is thousands of sheets thick.' },
      { icon: '🧩', text: 'Real graphite comes off in little flakes of sheets, not one atom at a time.' },
    ],
  },
  push: {
    seeing: [
      { icon: '👉', text: 'Push one sheet from the side: it slides, and the sheets above and below hardly notice. Inside a sheet the atoms hold tight; between the sheets they barely hold.' },
      { icon: '💎', text: 'Diamond: every atom holds four neighbours, up, down and sideways. There is nothing that could slide — your finger just bumps into it.' },
    ],
    tips: [{ icon: '↔️', text: 'Start left of the block to push to the right, start right of it to push to the left. Try the top, the middle and the bottom sheet.' }],
    honest: [{ icon: '🔨', text: '"Hardest" means hardest to scratch. A hammer can still shatter a diamond.' }],
  },
  light: {
    seeing: [
      { icon: '💡', text: 'Light flies out of the torch in tiny bits (photons, as in the 💡 Light lab).' },
      { icon: '⚫', text: 'Graphite has free electrons — the same ones that carry electricity. They catch light of every color and turn it into a little warmth. No light gets through, so graphite looks dark.' },
      { icon: '💎', text: 'Diamond holds every electron tight in a bond. The light cannot move them, so it flies on through. Inside, it bounces off the faces and comes out split into its colors: the sparkle.' },
      { icon: '🔗', text: 'Same atoms, opposite results. It all depends on whether the electrons are free or held.' },
    ],
    honest: [
      { icon: '⚡', text: 'An electron only catches light that brings exactly the push it needs. Graphite\'s free electrons take any color. Diamond\'s would need a much bigger push than any color of light has.' },
      { icon: '💍', text: 'A cut gem sparkles much more than a rough crystal: its faces are cut to send the light bouncing around inside.' },
    ],
  },
  power: {
    seeing: [
      { icon: '🔋', text: 'Electricity is electrons on the move. Close the switch and the battery pushes electrons out of its minus end, all the way round, back into its plus end.' },
      { icon: '✏️', text: 'In graphite every atom holds three neighbours and has one electron left over. Those free electrons can run along the sheets — the bulb lights up.' },
      { icon: '💎', text: 'In diamond every outer electron is busy holding a neighbour. None can run — the bulb stays dark.' },
    ],
    honest: [
      { icon: '🐌', text: 'Real electrons in a wire crawl slowly; the push goes round the circuit almost at once.' },
      { icon: '🏫', text: 'That is why pencil lead is used in school circuit experiments.' },
    ],
  },
  squeeze: {
    seeing: [
      { icon: '🗜️', text: 'Deep under the ground, rock squeezes and heats carbon. Squeezed hard AND hot enough, the sheets buckle and lock into the diamond grid.' },
      { icon: '🔢', text: 'Count them: the same 63 atoms before and after. Nothing is added — they only hold on to each other in a new way.' },
    ],
    tips: [{ icon: '🔥', text: 'Drag the fire up first, then hold the red PUSH button. Only one of the two is not enough.' }],
    honest: [
      { icon: '🕰️', text: 'In nature this took millions of years, about 150 km under the ground. A factory press does it in days.' },
      { icon: '💎', text: 'Let go of the squeeze and a diamond stays a diamond. It would turn back, but far too slowly to ever see.' },
    ],
    story: [{ icon: '🏭', text: 'The first factory-made diamonds came out of a giant press in 1954.' }],
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
  const [sheets, setSheets] = useState(0)
  const info = INFO[scene]

  const rightNow: Para[] = [
    {
      icon: material === 'diamond' ? '💎' : '✏️',
      text:
        material === 'diamond'
          ? 'Diamond: the same carbon atoms, locked into a grid.'
          : 'Graphite, the grey stuff inside a pencil: carbon atoms in flat sheets.',
    },
    ...(scene === 'write' && sheets > 0 && material === 'graphite'
      ? [{ icon: '📄', text: `Your line has used up ${sheets} ${sheets === 1 ? 'sheet' : 'sheets'} so far.` }]
      : []),
  ]
  const reset = () => {
    // squeeze and heat starts again from graphite: that is its point
    if (scene === 'squeeze') setMaterial('graphite')
    setSheets(0)
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
          <SectionHeader first>Right now</SectionHeader>
          <Paras items={rightNow} className="text-slate-200" />
          <SectionHeader>What am I seeing?</SectionHeader>
          <Paras items={info.seeing} />
          {info.tips && (
            <>
              <SectionHeader>Tips</SectionHeader>
              <Paras items={info.tips} className="text-slate-400" />
            </>
          )}
          <SectionHeader>Honest notes</SectionHeader>
          <Paras items={info.honest} className="text-slate-400" />
          {info.story && (
            <>
              <SectionHeader>A true story</SectionHeader>
              <Paras items={info.story} />
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
          onSheets={setSheets}
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
