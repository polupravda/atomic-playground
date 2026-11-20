import { useCallback, useRef, useState, type ReactNode } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { PageNav } from './PageNav'
import { usePageStore } from '../state/pageStore'
import {
  DEFAULT_PRISM,
  PRISM_CENTER_FRAC,
  WAVE_H,
  WAVE_W,
  WaveStage,
  dropRadius,
  type PrismSetup,
  type EyeLampSetting,
  type LampLevels,
  type WaveScene,
  type WaveView,
} from '../stage/WaveStage'
import {
  EYE_LAMPS,
  EYE_OBJECTS,
  EYE_OBJECT_ORDER,
  WHITE_BUNDLE,
  eyeSees,
  reflectedBundle,
  type EyeObjectId,
} from '../core/seeColors'
import {
  EM_BANDS,
  bandOf,
  colorName,
  isVisible,
  photonPunch,
  ringsBell,
  uToWavelength,
  wavelengthToU,
  type EmBandId,
} from '../core/emSpectrum'
import { wavelengthToCss } from '../core/spectra'
import {
  DOORBELL_PHOTOS,
  EYE_PHOTOS,
  LAMPS_PHOTOS,
  PRISM_PHOTOS,
  WAVE_PHOTOS,
  XRAY_SCENE_PHOTOS,
  type WavePhoto,
} from '../core/wavePhotos'
import {
  XRAY_OBJECTS,
  XRAY_OBJECT_ORDER,
  type XrayLamp,
  type XrayObjectId,
} from '../core/xray'
import { Paras, SECTION_MAX, SectionHeader, para, type Para } from './Paras'
import { SideDrawer } from './SideDrawer'
import { SegmentedSwitch } from './SegmentedSwitch'
import { CHIP_KEY, FLAT, KEY, TRAY } from './surfaces'

// 💡 Light lab (proposal 09, Milestone 10) — a BUILDER like the atom
// builder, not a demo: the kid drives every knob. Step 37+37b scene: the
// wave machine (L01 wave + drag, L02 color readout, L03 beyond the rainbow
// with the EM bar, L04 brightness). The wave machine is the MAIN view; the
// other scenes (doorbell, lamps, the eye, prism, bone photo) each open in a
// drawer over it — the atom builder's 🌡️ States of matter pattern (Elena,
// 2026-11-19).

const SCENES = [
  { id: 'wave', label: '🌊 Wave machine', ready: true },
  { id: 'doorbell', label: '🔔 The doorbell', ready: true },
  { id: 'lamps', label: '🔦 Mixing lamps', ready: true },
  { id: 'eye', label: '👁️ The eye', ready: true },
  { id: 'prism', label: '🔼 Prism', ready: true },
  { id: 'xray', label: '🩻 Bone photo', ready: true },
] as const

/** quick-jump chips: one stop per band + the rainbow's classics */
const PRESETS: Array<{ label: string; m: number }> = [
  { label: 'γ', m: 1e-12 },
  { label: 'X-ray', m: 1e-10 },
  { label: 'UV', m: 150e-9 },
  { label: 'violet', m: 410e-9 },
  { label: 'green', m: 530e-9 },
  { label: 'red', m: 670e-9 },
  { label: 'infrared', m: 10e-6 },
  { label: 'microwave', m: 0.12 },
  { label: 'radio', m: 3 },
]

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`w-64 p-3 ${FLAT}`}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  )
}

/** the lamp's color choices (the eye and prism scenes): the shared
 *  switch, every option with its color as a dot — most kids read the dot
 *  before the word. No "The lamp" heading (Elena, 2026-11-20: no heading
 *  over choices that name themselves); the lamp on the canvas changes
 *  color as you pick. */
function LampSwitch({ value, onChange }: { value: EyeLampSetting; onChange: (v: EyeLampSetting) => void }) {
  const options = [
    { id: 'white', label: 'white', dot: '#f1f5f9' },
    // "sodium orange" doesn't fit half a tray: the dot shows the color, the
    // hover text keeps the full name
    ...EYE_LAMPS.map((l) => ({ id: String(l.nm), label: l.name.replace(/^sodium /, ''), title: l.name, dot: wavelengthToCss(l.nm) })),
  ]
  return (
    <SegmentedSwitch
      ariaLabel="Lamp color"
      columns={2}
      options={options}
      value={String(value)}
      onChange={(id) => onChange(id === 'white' ? 'white' : Number(id))}
    />
  )
}

function LabSlider({
  value,
  onChange,
  max,
  label,
  rangeClass,
}: {
  value: number
  onChange: (v: number) => void
  max: number
  label: string
  rangeClass: string
}) {
  return (
    <Slider.Root
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={0}
      max={max}
      step={1}
      className="relative flex h-5 w-full touch-none select-none items-center"
    >
      <Slider.Track className="relative h-1.5 grow rounded-full bg-slate-700">
        <Slider.Range className={`absolute h-full rounded-full ${rangeClass}`} />
      </Slider.Track>
      <Slider.Thumb
        aria-label={label}
        className="block h-4 w-4 rounded-full bg-slate-100 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </Slider.Root>
  )
}

/** Light lab DRAWER scenes designed in proposal 11 (L14–L16), not built
 *  yet: listed with the other scene buttons, switched off, "🔜 soon" */
const PLANNED_SCENES: Array<{ label: string; about: string }> = [
  { label: '🔬 Microscopes', about: 'why light can only see so small' },
  { label: '🌅 Blue sky, red sunset', about: 'air bounces blue light around' },
  { label: '🔦 Lasers', about: 'light that marches in step' },
]

/** the scenes that open in a drawer over the wave machine (the main view),
 *  like the atom builder's 🌡️ States of matter */
const DRAWER_SCENES = SCENES.filter((s) => s.id !== 'wave')

// The drawer leaves a strip of the page visible on the left (like the
// periodic table's), so it reads as a drawer over the lab, not a new
// screen. Its lab view is built for the full page width (the canvas size
// is fixed per page, WAVE_W × WAVE_H), so it is scaled down to fit.
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

export function LightLab() {
  const page = usePageStore((s) => s.page)
  const [open, setOpen] = useState<WaveScene | null>(null)
  const openScene = DRAWER_SCENES.find((s) => s.id === open)
  return (
    <>
      <LightLabView
        scene="wave"
        // the main view rests while a drawer covers it
        active={page === 'light' && open === null}
        bottom={
          <div className="flex flex-col gap-2">
            {DRAWER_SCENES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpen(s.id)}
                className={`w-64 px-4 py-2.5 text-left text-sm text-slate-200 ${KEY}`}
              >
                {s.label}
              </button>
            ))}
            {/* designed, not built yet: the same scene buttons, switched off */}
            {PLANNED_SCENES.map((p) => (
              <button
                key={p.label}
                type="button"
                disabled
                title={`${p.about} — coming soon`}
                className={`flex w-64 items-center justify-between px-4 py-2.5 text-left text-sm text-slate-200 ${KEY}`}
              >
                <span>{p.label}</span>
                <span className="text-xs text-slate-400">🔜 soon</span>
              </button>
            ))}
          </div>
        }
      />
      <SideDrawer
        open={open !== null}
        onClose={() => setOpen(null)}
        ariaLabel={openScene ? `${openScene.label.slice(openScene.label.indexOf(' ') + 1)} — Light lab scene` : 'Light lab scene'}
        // = DRAWER_GAP_PX / DRAWER_MAX_PX (Tailwind needs the literal class)
        widthClassName="w-[min(calc(100vw_-_96px),1376px)]"
        flushBottom
      >
        {openScene && (
          // a fresh lab for the scene: its own knobs, its own canvas —
          // scaled to the drawer
          <div
            className="overflow-hidden"
            style={{ width: LAB_W * drawerFit().k, height: window.innerHeight - 20 }}
          >
          <div
            style={{
              width: LAB_W,
              height: drawerFit().height,
              transform: `scale(${drawerFit().k})`,
              transformOrigin: 'top left',
            }}
          >
            <LightLabView
              key={openScene.id}
              scene={openScene.id}
              active={page === 'light'}
              inDrawer
              // the drawer has more height than width: the canvas uses it
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

/** one Light lab view: the 📷/ℹ️ column, the canvas and the control cards
 *  for ONE scene — the main page shows the wave machine, each other scene
 *  opens in its own drawer */
function LightLabView({
  scene,
  active,
  inDrawer = false,
  canvasHeight,
  top,
  bottom,
}: {
  scene: WaveScene
  active: boolean
  /** inside a drawer: no main menu in the left column */
  inDrawer?: boolean
  /** the canvas height (default: the page's WAVE_H) */
  canvasHeight?: number
  /** first block of the right column: the scene's title (drawer) */
  top?: ReactNode
  /** last block of the right column, under the controls: the scene drawer
   *  buttons (main view) — like the atom builder's 🧪 / 🌡️ under its
   *  controls */
  bottom?: ReactNode
}) {
  // the light being built: wavelength as slider-u (see core/emSpectrum), 0–1
  const [u, setU] = useState(wavelengthToU(670e-9)) // start on lithium red
  const [brightness, setBrightness] = useState(0.75)
  const [view, setView] = useState<WaveView>('wave')
  // all three lamps start on: the white-is-a-mixture surprise comes first
  const [lamps, setLamps] = useState<LampLevels>({ r: 0.85, g: 0.85, b: 0.85 })
  // the eye scene: a red apple under white light is the classic opening
  const [eyeObject, setEyeObject] = useState<EyeObjectId>('apple')
  const [eyeLamp, setEyeLamp] = useState<EyeLampSetting>('white')
  const [prismLamp, setPrismLamp] = useState<EyeLampSetting>('white')
  const [prism, setPrism] = useState<PrismSetup>(DEFAULT_PRISM)
  // the bone photo: a hand under the X-ray tube is the classic opening
  const [xrayObject, setXrayObject] = useState<XrayObjectId>('hand')
  const [xrayLamp, setXrayLamp] = useState<XrayLamp>('xray')
  const [xraySpeed, setXraySpeed] = useState(0.5)
  const [leftTab, setLeftTab] = useState<'photo' | 'info'>('photo')

  // L01: dragging the wave stretches it (right = longer)
  const drag = useRef<{ x: number; u: number } | null>(null)
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      drag.current = { x: e.clientX, u }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [u],
  )
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const du = (e.clientX - drag.current.x) / 1500
    setU(Math.min(1, Math.max(0, drag.current.u + du)))
  }, [])
  // the lamps scene has no single wavelength — nothing to stretch there
  const onPointerUp = useCallback(() => {
    drag.current = null
    prismDrag.current = null
  }, [])

  // 🔼 prism: drag around the prism to turn it; raindrop: drag up/down to
  // move where the beam meets the drop. Pointer → canvas px (the drawer
  // scales the lab, so measure the box).
  const prismDrag = useRef<{ a0: number; angle: number; y0: number; impact: number } | null>(null)
  const canvasH = canvasHeight ?? WAVE_H
  const toCanvas = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * WAVE_W) / r.width, y: ((e.clientY - r.top) * canvasH) / r.height }
  }
  const pointerAngle = (q: { x: number; y: number }) =>
    Math.atan2(q.y - canvasH * PRISM_CENTER_FRAC.y, q.x - WAVE_W * PRISM_CENTER_FRAC.x)
  const onPrismDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const q = toCanvas(e)
    prismDrag.current = { a0: pointerAngle(q), angle: prism.angle, y0: q.y, impact: prism.impact }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPrismMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = prismDrag.current
    if (!d) return
    const q = toCanvas(e)
    if (prism.shape === 'drop') {
      const impact = Math.max(-0.98, Math.min(0.98, d.impact - (q.y - d.y0) / dropRadius()))
      setPrism((p) => ({ ...p, impact }))
    } else setPrism((p) => ({ ...p, angle: d.angle + pointerAngle(q) - d.a0 }))
  }

  const m = uToWavelength(u)
  const nm = m * 1e9
  const visible = isVisible(m)
  const band = bandOf(m)
  const punch = photonPunch(m)
  const punchText =
    punch >= 1
      ? `about ${punch >= 10 ? Math.round(punch).toLocaleString('en-US') : punch.toFixed(1)}× harder than`
      : `about ${Number((1 / punch).toPrecision(2)).toLocaleString('en-US')}× softer than`
  const colorWord = visible ? colorName(nm) : band.label

  // ---- ℹ️ the info panel: for grown-ups, scannable by its bold words.
  // 📍 Right now is live (never sticky), the rest follows the scene.

  // 📍 Right now says only what the screen does NOT (Elena, 2026-11-20:
  // "ok thanks cap, I am not blind") — never the color, length, count or
  // label already on the canvas or the controls; only what it MEANS. When
  // there is nothing to add, the section is not shown.
  const rightNowWave: Para[] = visible
    ? []
    : [
        para('🥷', 'Invisible to eyes,', ' but as real as red light.'),
        para('📡', 'In daily life:', ` ${band.anchor}.`),
        para('🥊', `One packet hits ${punchText}`, ' a deep-red one.'),
      ]
  const rightNowPhotons: Para[] = [
    para('🥊', `Each hits ${punchText}`, ' a deep-red packet — only the color sets the punch.'),
    ...(visible ? [para('💡', 'Brightness = how many', ' photons per second, never how hard each hits.')] : []),
  ]
  const rightNowDoorbell: Para[] = ringsBell(m)
    ? [
        para('🔔', 'One packet frees one electron:', <> a {colorWord} packet pays the metal&apos;s price alone.</>),
        para('🏃', 'Shorter waves pay extra:', ' the spare energy becomes the electron’s speed.'),
      ]
    : [
        para('🔕', <>One {colorWord} packet is too weak,</>, ' and packets never team up.'),
        para('🔥', 'The energy only warms the plate', ' — even at full brightness.'),
      ]
  // which lamps are meaningfully on, and what their overlap makes
  const lampsOn = (['r', 'g', 'b'] as const).filter((id) => lamps[id] > 0.15)
  const LAMP_NAMES = { r: 'red', g: 'green', b: 'blue' } as const
  const MIX2: Record<string, string> = { rg: 'yellow', rb: 'magenta', gb: 'cyan (turquoise)' }
  const mixKey = lampsOn.join('')
  const rightNowLamps: Para[] =
    lampsOn.length === 0
      ? [para('⚫', 'Black is no light arriving', ' at all — not a color of its own.')]
      : lampsOn.length === 1
        ? []
        : lampsOn.length === 2
          ? [
              para('✨', `No ${MIX2[mixKey]} lamp exists:`, ` your eye adds ${LAMP_NAMES[lampsOn[0]]} and ${LAMP_NAMES[lampsOn[1]]}.`),
              ...(mixKey === 'rb' ? [para('💗', 'Magenta is not in the rainbow:', ' no single wavelength makes it, only a mix.')] : []),
            ]
          : [para('⚪', 'White is every lamp arriving together,', ' not a color of its own.')]
  // the eye scene's live outcome
  const eyeObj = EYE_OBJECTS[eyeObject]
  const eyeBundle = eyeLamp === 'white' ? WHITE_BUNDLE : [eyeLamp]
  const eyeReflected = reflectedBundle(eyeObj, eyeBundle)
  const seen = eyeSees(eyeReflected)
  const lampWord =
    eyeLamp === 'white' ? 'White light' : `Pure ${EYE_LAMPS.find((l) => l.nm === eyeLamp)?.name ?? colorName(eyeLamp)} light`
  const rightNowEye: Para[] =
    seen.name === 'black'
      ? [
          para('⚫', 'Nothing bounces back:', <> it swallows all the {lampWord.toLowerCase()}.</>),
          para('🔥', 'Swallowed light warms it', ' (the shimmer) — why dark things get hot in the sun.'),
        ]
      : [
          para(
            '🪞',
            eyeReflected.length === eyeBundle.length ? 'It bounces everything back:' : 'It bounces only its own band:',
            ' its color is what it refuses to swallow.',
          ),
        ]
  const rightNowPrism: Para[] =
    prismLamp === 'white'
      ? [
          para('🌈', 'The colors were already inside the beam:', ' the prism only sorts them.'),
          para('🔽', 'Red bends least, violet most:', ' glass slows shorter waves a little more.'),
        ]
      : [
          para('🔦', 'Only bent, not split:', ' a pure color has nothing hidden inside.'),
          para('🏆', 'Newton’s proof:', ' if glass painted the colors, it would paint a pure color too.'),
        ]
  const rightNowXray: Para[] =
    xrayLamp === 'ordinary'
      ? [para('🔦', 'Ordinary light stops at the surface:', ' its packets are far too weak to get inside.')]
      : [para('🩻', 'X-rays pass soft parts like fog;', ' bones and metal swallow them — white on the photo.')]
  const rightNow =
    scene === 'doorbell'
      ? rightNowDoorbell
      : scene === 'lamps'
        ? rightNowLamps
        : scene === 'eye'
          ? rightNowEye
          : scene === 'prism'
            ? rightNowPrism
            : scene === 'xray'
              ? rightNowXray
              : view === 'photons'
                ? rightNowPhotons
                : rightNowWave

  // 👀 what the scene shows (most important first)
  const seeing: Para[] =
    scene === 'doorbell'
      ? [
          para('🔔', 'One packet must pay alone:', ' green and shorter can free our plate’s electrons; yellow and longer never can.'),
          para('💡', 'Brightness only means more packets,', ' never a stronger one — so red never rings it.'),
          para('🏆', 'Proof light comes in packets:', ' a pure wave would slowly add up and ring.'),
          para('🥈', 'Our plate is like potassium', ' (limit ≈ 540 nm, green); zinc, iron or copper need ultraviolet.'),
        ]
      : scene === 'lamps'
        ? [
            para('➕', 'Light adds up,', ' paint eats colors: lamp mixes get brighter, toward white; paint mixes darker.'),
            para('📺', 'Your screen does exactly this:', ' every pixel is three tiny lamps (see the corner zoom).'),
          ]
        : scene === 'eye'
          ? [
              para('🍎', 'Objects shine no light of their own:', ' they swallow some colors and bounce the rest to your eye.'),
              para('💡', 'Only colors it is given:', ' under pure blue light a red apple is truly black.'),
            ]
          : scene === 'prism'
            ? [
                para('⚪', 'White is all wavelengths together,', ' looking white because they arrive at once.'),
                para('🔼', 'Glass slows shorter waves more:', ' each color turns by its own amount — sorting, not painting.'),
                para('🌦️', 'A rainbow = raindrops as prisms:', ' one bounce inside, out at about 42° — always opposite the Sun.'),
                para('💎', 'Diamond bends much more:', ' light bounces around inside — that trapped light is its glitter.'),
              ]
            : scene === 'xray'
              ? [
                  para('🌑', 'An X-ray photo is a shadow:', ' film darkens where packets pass — bones stay white.'),
                  para('🦴', 'Bones are full of calcium,', ' a big atom (20 electrons) that catches packets; flesh’s small atoms barely do.'),
                  para('⚪', 'Packets, not one long wave:', ' each one is caught whole or flies on — all or nothing.'),
                  para('👁️', 'The eye scene’s opposite:', ' eyes see bounced light, the photo shows light that got through.'),
                  para('↩️', 'A few packets scatter sideways', ' (the sparks) — why staff step behind a shielded wall.'),
                ]
              : view === 'photons'
                ? [
                    para('⚪', 'Two true pictures of one light:', ' wave and photons are both right, for different questions.'),
                    para('🥊', 'A photon’s punch depends only on its color:', ' shorter wave, harder punch — never brightness.'),
                  ]
                : [
                    para('🌊', 'Wavelength IS color:', ' the distance from crest to crest; stretch it and the color changes.'),
                    para('📊', 'The bar is the whole light family,', ' γ rays to radio on a log scale; the rainbow is the sliver under 👁.'),
                    para('💡', 'Brightness = wave height,', ' never color: dim red is still red.'),
                  ]

  // ⚖️ what the picture simplifies (never dropped, only shortened)
  const honest: Para[] =
    scene === 'lamps'
      ? [para('🤫', 'Screen yellow is a trick:', ' red + green together; true yellow (sodium’s 589 nm) is one wave — eyes can’t tell.')]
      : scene === 'eye'
        ? [
            para('🌈', 'Surfaces bounce whole bands:', ' a few waves stand for each band (single lines belong to lone atoms).'),
            para('↔️', 'Real surfaces scatter everywhere;', ' we draw only the bundle that reaches the eye.'),
            para('👁️', 'The eye is drawn huge', ' and cartoon-simple.'),
          ]
        : scene === 'prism'
          ? [
              para('↕️', 'Colors fan out about six times wider', ' than real glass (≈ 1°); their order and which material spreads more are true.'),
              para('🪞', 'Every surface also reflects a little;', ' we leave that out.'),
              para('💧', 'The raindrop is hugely enlarged.'),
            ]
          : scene === 'xray'
            ? [para('⚠️', 'Packets that pass through you can break molecules', ' — why real X-ray photos are quick and rare.')]
            : scene === 'doorbell'
              ? []
              : [
                  ...(view === 'photons'
                    ? [para('🚫', 'Photons are not little balls:', ' the packet drawing is a symbol, like the wavy line.')]
                    : []),
                  para('📏', 'The wave is drawn a million times too big:', ' about a hundred red waves fit across a hair.'),
                ]

  // 💡 how to play with the scene — the only home for coaching
  const tips: Para[] =
    scene === 'doorbell'
      ? [
          para('🔴', 'Deep red at full brightness:', ' a storm of packets, no ring — then dim violet: RING.'),
          para('⚖️', 'Find the edge:', ' slide slowly through green (≈ 540 nm) until the bell starts.'),
          para('🏃', 'Compare electron speeds', ' for violet and X-rays.'),
        ]
      : scene === 'lamps'
        ? [
            para('🟡', 'Make yellow without yellow:', ' red up, green up, blue off.'),
            para('💗', 'Make magenta', ' (red + blue) — a color the rainbow lacks.'),
            para('⚪', 'All three up for white,', ' then pull one away.'),
            para('🎨', 'Try real paints some day:', ' brown, not white.'),
          ]
        : scene === 'eye'
          ? [
              para('🔵', 'Red apple under the blue lamp,', ' then back to white.'),
              para('🟠', 'Sodium-orange lamp on the blue cup:', ' why cars lose their colors under old street lamps.'),
              para('📄', 'White paper shows exactly', ' what the lamp gives.'),
              para('🪨', 'The black stone eats every lamp', ' and warms the most.'),
            ]
          : scene === 'prism'
            ? [
                para('🔴', 'Pure red, then pure violet:', ' different bends, neither splits.'),
                para('↻', 'Drag to turn the prism', ' — find where light stops coming out.'),
                para('💎', 'Try diamond:', ' wider colors, more bouncing inside.'),
                para('💧', 'In the raindrop, drag the beam:', ' near one spot the colors exit together.'),
                para('💿', 'At home:', ' a CD, or garden-hose spray with the sun behind you.'),
              ]
            : scene === 'xray'
              ? [
                  para('✨', 'Watch the flashes', ' — their hidden spots become the picture.'),
                  para('🔦', 'Switch to ordinary light:', ' even blinding, it shows only a silhouette.'),
                  para('🐕', 'Photograph the dog,', ' then compare the real vet X-ray (📷).'),
                  para('💍', 'Find the ring on the hand', ' — like the first X-ray ever (📷).'),
                ]
              : [
                  para('🖱️', 'Drag the wave', ' to squeeze or stretch it.'),
                  para('⚪', 'Flip 🌊 wave ⇄ ⚪ photons', ' and watch the wave pinch into packets.'),
                  para('🌓', 'Photons, brightness down:', ' fewer packets, same punch each.'),
                  para('🟡', 'Find 589 nm:', ' sodium’s yellow, as in old street lamps.'),
                  para('🥷', 'Slide past the rainbow’s ends:', ' the wave goes on; eyes just stop seeing it.'),
                ]

  // 📜 history: the scene's own story first
  const trueStory: Para[] = [
    ...(scene === 'xray'
      ? [
          para('🩻', 'Röntgen, 1895:', ' a screen glowed through black cardboard — then he photographed his wife’s ringed hand.'),
          para('🏅', 'No patent, first physics Nobel (1901):', ' Röntgen let every hospital use X-rays.'),
          para('👟', 'Shoe shops once X-rayed kids’ feet', ' — banned once the risk was understood.'),
        ]
      : []),
    ...(scene === 'prism'
      ? [para('🪟', 'Newton, 1666:', ' one sunbeam through a prism made a rainbow; a second prism could not split a pure color.')]
      : []),
    ...(scene === 'doorbell'
      ? [
          para('🧪', 'A school-lab classic:', ' UV light on a charged zinc plate makes the electroscope leaves sink; glass blocks it.'),
          para('⚠️', 'Not a kitchen experiment:', ' zinc needs harmful UV, potassium burns in air — solar calculators use the same effect.'),
        ]
      : []),
    para('🏅', 'Einstein, 1905:', ' explained why red can never ring the bell — what his Nobel Prize names.'),
    para('💡', 'Wave or particles?', ' 200 years of argument — the doorbell said both.'),
    para('🌡️', 'Herschel, 1800:', ' a thermometer past the rainbow’s red end got warmer — infrared.'),
  ]

  return (
    // the page never scrolls: both side columns scroll INSIDE their blocks,
    // the row keeps the wrapper's fixed height
    <div className="flex h-full min-h-0 items-start gap-6">
      {/* left: nav + 📷 photos / ℹ️ info (photos default; both stay mounted) */}
      <div className="flex h-full w-64 shrink-0 flex-col gap-3">
        {!inDrawer && <PageNav />}
        <div className={`flex gap-1 p-1 text-sm ${TRAY}`}>
          {(
            [
              ['photo', '📷 Photos'],
              ['info', 'ℹ️ Info'],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              type="button"
              onClick={() => setLeftTab(id)}
              aria-pressed={leftTab === id}
              className={`flex-1 rounded-lg px-3 py-1 transition ${
                leftTab === id
                  ? 'bg-sky-600 font-medium text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
        <div className="relative min-h-0 flex-1">
          <div
            className={`absolute inset-0 overflow-y-auto pr-1 ${leftTab === 'photo' ? '' : 'hidden'}`}
          >
            <PhotoColumn current={band.id} scene={scene} />
          </div>
          <div
            className={`absolute inset-0 overflow-y-auto p-3 text-sm leading-relaxed text-slate-300 ${FLAT} ${
              leftTab === 'info' ? '' : 'hidden'
            }`}
          >
            {rightNow.length > 0 && (
              <>
                <SectionHeader first type="now" />
                <Paras items={rightNow} className="text-slate-200" />
              </>
            )}
            <SectionHeader type="seeing" first={rightNow.length === 0} />
            <Paras items={seeing} max={SECTION_MAX} />
            {honest.length > 0 && (
              <>
                <SectionHeader type="honest" />
                <Paras items={honest} max={SECTION_MAX} className="text-slate-400" />
              </>
            )}
            <SectionHeader type="tips" />
            <Paras items={tips} max={SECTION_MAX} className="text-slate-400" />
            <SectionHeader type="true" />
            <Paras items={trueStory} max={SECTION_MAX} />
          </div>
        </div>
      </div>

      {/* middle: the canvas. Drag-to-stretch only where a wavelength slider
          rules the scene (wave machine + doorbell) */}
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 ${
          scene === 'wave' || scene === 'doorbell'
            ? 'cursor-ew-resize'
            : scene === 'prism'
              ? prism.shape === 'drop'
                ? 'cursor-ns-resize'
                : 'cursor-grab active:cursor-grabbing'
              : ''
        }`}
        onPointerDown={scene === 'wave' || scene === 'doorbell' ? onPointerDown : scene === 'prism' ? onPrismDown : undefined}
        onPointerMove={scene === 'wave' || scene === 'doorbell' ? onPointerMove : scene === 'prism' ? onPrismMove : undefined}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* 🩻 the lamp switch lives ON the canvas, right over the tube */}
        {scene === 'xray' && (
          <div
            className="absolute z-10 flex -translate-x-1/2 gap-1 rounded-full border border-slate-600 bg-slate-900/90 p-0.5 text-xs"
            style={{ left: '50%', top: 8 }}
          >
            {(
              [
                ['xray', '🩻 X-rays'],
                ['ordinary', '💡 ordinary light'],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                type="button"
                onClick={() => setXrayLamp(id)}
                aria-pressed={xrayLamp === id}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 transition ${
                  xrayLamp === id
                    ? 'bg-sky-600 font-medium text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        )}
        <WaveStage
          u={u}
          brightness={brightness}
          view={view}
          scene={scene}
          lamps={lamps}
          eyeObject={eyeObject}
          eyeLamp={eyeLamp}
          prismLamp={prismLamp}
          prism={prism}
          xrayObject={xrayObject}
          xrayLamp={xrayLamp}
          xraySpeed={xraySpeed}
          active={active}
          height={canvasHeight}
        />
      </div>

      {/* right: control cards (scrolls inside the block) */}
      <div className="flex h-full min-h-0 w-[16.5rem] shrink-0 flex-col gap-4 overflow-y-auto pr-1">
        {top}

        {scene === 'wave' && (
          <SegmentedSwitch
            ariaLabel="Wave or photons"
            options={[
              { id: 'wave', label: '🌊 Wave' },
              { id: 'photons', label: '⚪ Photons' },
            ]}
            value={view}
            onChange={setView}
          />
        )}

        {scene === 'xray' ? (
          <>
            <SegmentedSwitch
              ariaLabel="What lies on the film"
              options={XRAY_OBJECT_ORDER.map((id) => ({
                id,
                label: `${XRAY_OBJECTS[id].emoji} ${XRAY_OBJECTS[id].name.replace(/^an? /, '')}`,
              }))}
              value={xrayObject}
              onChange={setXrayObject}
            />

            <Card title="🐢 Ray speed">
              <LabSlider
                value={Math.round(xraySpeed * 100)}
                onChange={(v) => setXraySpeed(v / 100)}
                max={100}
                label="Ray speed"
                rangeClass="bg-gradient-to-r from-slate-500 to-sky-400"
              />
            </Card>
          </>
        ) : scene === 'prism' ? (
          <>
            <SegmentedSwitch
              ariaLabel="Prism or raindrop"
              options={[
                { id: 'prism', label: '🔼 Prism' },
                { id: 'drop', label: '💧 Raindrop' },
              ]}
              value={prism.shape}
              onChange={(shape) => setPrism((p) => ({ ...p, shape }))}
            />
            {prism.shape === 'prism' && (
              <>
                <SegmentedSwitch
                  ariaLabel="What the prism is made of"
                  options={[
                    // plain words: three emoji labels don't fit one row
                    { id: 'glass', label: 'glass' },
                    { id: 'water', label: 'water' },
                    { id: 'diamond', label: 'diamond' },
                  ]}
                  value={prism.material}
                  onChange={(material) => setPrism((p) => ({ ...p, material }))}
                />
                <button
                  type="button"
                  onClick={() => setPrism((p) => ({ ...p, angle: 0 }))}
                  className={`w-64 px-3 py-1.5 text-sm text-slate-200 ${KEY}`}
                >
                  ↺ Straighten the prism
                </button>
              </>
            )}
            {prism.shape === 'drop' && (
              <button
                type="button"
                onClick={() => setPrism((p) => ({ ...p, impact: DEFAULT_PRISM.impact }))}
                className={`w-64 px-3 py-1.5 text-sm text-slate-200 ${KEY}`}
              >
                🌈 Aim at the rainbow spot
              </button>
            )}
            <LampSwitch value={prismLamp} onChange={setPrismLamp} />
          </>
        ) : scene === 'eye' ? (
          <>
            <SegmentedSwitch
              ariaLabel="What the lamp shines on"
              columns={2}
              options={EYE_OBJECT_ORDER.map((id) => ({ id, label: `${EYE_OBJECTS[id].emoji} ${EYE_OBJECTS[id].name}` }))}
              value={eyeObject}
              onChange={setEyeObject}
            />

            <LampSwitch value={eyeLamp} onChange={setEyeLamp} />
          </>
        ) : scene === 'lamps' ? (
          <>
            <Card title="🔦 The three lamps">
              {(
                [
                  ['r', 'Red lamp', 'bg-gradient-to-r from-slate-600 to-red-500'],
                  ['g', 'Green lamp', 'bg-gradient-to-r from-slate-600 to-green-500'],
                  ['b', 'Blue lamp', 'bg-gradient-to-r from-slate-600 to-blue-500'],
                ] as const
              ).map(([id, name, cls]) => (
                <div key={id} className="mb-2 last:mb-0">
                  <div className="mb-0.5 text-xs text-slate-400">{name}</div>
                  <LabSlider
                    value={Math.round(lamps[id] * 100)}
                    onChange={(v) => setLamps((prev) => ({ ...prev, [id]: v / 100 }))}
                    max={100}
                    label={name}
                    rangeClass={cls}
                  />
                </div>
              ))}
            </Card>
          </>
        ) : (
          <>
            <Card title="🌈 Wavelength">
              <LabSlider
                value={Math.round(u * 1000)}
                onChange={(v) => setU(v / 1000)}
                max={1000}
                label="Wavelength"
                rangeClass="bg-gradient-to-r from-violet-500 via-green-500 to-red-500"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setU(wavelengthToU(p.m))}
                    className={`px-2 py-0.5 text-xs text-slate-300 hover:text-white ${CHIP_KEY}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="💡 Brightness">
              <LabSlider
                value={Math.round(brightness * 100)}
                onChange={(v) => setBrightness(Math.max(0.1, v / 100))}
                max={100}
                label="Brightness"
                rangeClass="bg-gradient-to-r from-slate-500 to-amber-300"
              />
            </Card>
          </>
        )}
        {bottom}
      </div>
    </div>
  )
}

/** The generic Wi-Fi arcs symbol (plain geometry, no brand logo). */
function WifiSymbol() {
  return (
    <svg viewBox="0 0 24 18" className="h-4 w-5 shrink-0" aria-label="Wi-Fi" fill="none">
      <path d="M2 7 a14 14 0 0 1 20 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.5 10.5 a9 9 0 0 1 13 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 14 a4.5 4.5 0 0 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

/** Left-column photos: what the canvas is showing RIGHT NOW — the current
 *  band's usage photos (wave machine / doorbell wavelength), the real
 *  experiment's hardware (doorbell), or the screen pixels (lamps). Images at
 *  natural height — never cropped. */
function PhotoColumn({ current, scene }: { current: EmBandId; scene: WaveScene }) {
  const band = EM_BANDS.find((b) => b.id === current)!
  const photos: Array<{ title: string; ph: WavePhoto }> =
    scene === 'doorbell'
      ? DOORBELL_PHOTOS.map((ph) => ({ title: 'the real experiment', ph }))
      : scene === 'lamps'
        ? LAMPS_PHOTOS.map((ph) => ({ title: 'your screen, up close', ph }))
        : scene === 'eye'
          ? EYE_PHOTOS.map((ph) => ({ title: 'seeing, in real life', ph }))
          : scene === 'prism'
            ? PRISM_PHOTOS.map((ph) => ({ title: 'the real thing', ph }))
            : scene === 'xray'
              ? XRAY_SCENE_PHOTOS.map((ph) => ({ title: 'real X-ray photos', ph }))
              : WAVE_PHOTOS[current].map((ph) => ({ title: `${band.label}, in real life`, ph }))
  return (
    <div className="space-y-3">
      {/* no "slide to see more" coaching line here — guidance lives ONLY in
          the info panel's Tips section (03-architecture.md, rule 5) */}
      {photos.map(({ title, ph }) => (
        <figure key={ph.file} className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-200">
            {title}
            {ph.wifi && <WifiSymbol />}
          </div>
          <img
            src={`${import.meta.env.BASE_URL}examples/${ph.file}`}
            alt={ph.caption}
            className="w-full rounded-lg border border-slate-700"
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
  )
}
