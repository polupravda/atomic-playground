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
  lampMixCss,
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
  formatWavelength,
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
import { Paras, SectionHeader, type Para } from './Paras'
import { SideDrawer } from './SideDrawer'
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

/** the lamp's color choices (the eye and prism scenes): every chip shows
 *  its color as a dot — most kids read the dot before the word */
function LampChips({ value, onChange }: { value: EyeLampSetting; onChange: (v: EyeLampSetting) => void }) {
  const chip = (id: EyeLampSetting, name: string, css: string) => {
    const on = value === id
    return (
      <button
        key={String(id)}
        type="button"
        onClick={() => onChange(id)}
        aria-current={on ? 'page' : undefined}
        className={`flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2.5 text-xs transition ${
          on
            ? `border-slate-200 font-medium ${id === 'white' ? 'text-slate-900' : 'text-white'}`
            : `${CHIP_KEY} text-slate-300`
        }`}
        style={on ? { background: css } : undefined}
      >
        <span
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 rounded-full ${on ? 'ring-2 ring-white/80' : 'ring-1 ring-slate-500/60'}`}
          style={{ background: css }}
        />
        {name}
      </button>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {chip('white', 'white', '#f1f5f9')}
      {EYE_LAMPS.map((l) => chip(l.nm, l.name, wavelengthToCss(l.nm)))}
    </div>
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
  return { k, height: (window.innerHeight - 40) / k }
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
          </div>
        }
      />
      <SideDrawer
        open={open !== null}
        onClose={() => setOpen(null)}
        ariaLabel={openScene ? `${openScene.label.slice(openScene.label.indexOf(' ') + 1)} — Light lab scene` : 'Light lab scene'}
        // = DRAWER_GAP_PX / DRAWER_MAX_PX (Tailwind needs the literal class)
        widthClassName="w-[min(calc(100vw_-_96px),1376px)]"
      >
        {openScene && (
          // a fresh lab for the scene: its own knobs, its own canvas —
          // scaled to the drawer
          <div
            className="overflow-hidden"
            style={{ width: LAB_W * drawerFit().k, height: window.innerHeight - 40 }}
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
  const [rings, setRings] = useState(0)
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
  const brightWord = brightness < 0.35 ? 'a soft glow' : brightness < 0.7 ? 'nicely bright' : 'very bright'
  const punch = photonPunch(m)
  const punchText =
    punch >= 1
      ? `about ${punch >= 10 ? Math.round(punch).toLocaleString('en-US') : punch.toFixed(1)}× harder than`
      : `about ${Number((1 / punch).toPrecision(2)).toLocaleString('en-US')}× softer than`
  const colorWord = visible ? colorName(nm) : band.label

  const rightNowWave: Para[] = visible
    ? [
        {
          icon: '🌈',
          text: (
            <>
              You are making <strong style={{ color: wavelengthToCss(nm) }}>{colorName(nm)}</strong>{' '}
              light: one wave is <strong>{formatWavelength(m)}</strong> long, and it is {brightWord}.
            </>
          ),
        },
        {
          icon: '👁️',
          text: 'This wave is inside the rainbow sliver on the bar — one of the few your eyes can catch.',
        },
      ]
    : [
        {
          icon: '🥷',
          text: (
            <>
              You are making <strong>{band.label}</strong> — one wave is{' '}
              <strong>{formatWavelength(m)}</strong> long. Your eyes catch NOTHING, but the wave is
              just as real as red or blue.
            </>
          ),
        },
        { icon: '📡', text: `${band.anchor[0].toUpperCase()}${band.anchor.slice(1)}.` },
        {
          icon: '🥊',
          text: `One packet of this light hits ${punchText} a packet of deep-red light.`,
        },
      ]

  const rightNowPhotons: Para[] = [
    {
      icon: '⚪',
      text: (
        <>
          Same light, the other true picture: a stream of <strong>{colorWord}</strong> PHOTONS —
          little packets of light, every one of them identical.
        </>
      ),
    },
    {
      icon: '🥊',
      text: `Each packet hits ${punchText} a deep-red packet — the little meter on every photon shows it. The COLOR decides the punch; nothing else can.`,
    },
    {
      icon: '💡',
      text: 'The brightness slider now means HOW MANY photons fly by each second — never how hard each one hits.',
    },
    ...(visible
      ? []
      : [
          {
            icon: '🥷',
            text: `These are ${band.label} photons — invisible to eyes. ${band.anchor[0].toUpperCase()}${band.anchor.slice(1)}.`,
          },
        ]),
  ]

  const rightNowDoorbell: Para[] = ringsBell(m)
    ? [
        {
          icon: '🔔',
          text: (
            <>
              RING! Every <strong>{colorWord}</strong> packet that lands pays the metal&apos;s whole
              price by itself and knocks one electron off — <strong>{rings}</strong> ring
              {rings === 1 ? '' : 's'} so far.
            </>
          ),
        },
        {
          icon: '🏃',
          text: 'Shorter waves pay MORE than the price — the spare energy becomes the electron\'s speed. Watch how fast they fly off.',
        },
      ]
    : [
        {
          icon: '🔕',
          text: (
            <>
              <strong>{colorWord}</strong> packets land… and NOTHING. Each packet alone is too weak
              for this metal — and packets can never team up. ({rings} ring
              {rings === 1 ? '' : 's'} so far, none of them from this light.)
            </>
          ),
        },
        {
          icon: '🔥',
          text: 'Their energy does not vanish: it only warms the plate. Turn the brightness all the way up — the plate warms faster, the bell stays silent.',
        },
      ]

  // which lamps are meaningfully on, and what their overlap makes
  const lampsOn = (['r', 'g', 'b'] as const).filter((id) => lamps[id] > 0.15)
  const LAMP_NAMES = { r: 'red', g: 'green', b: 'blue' } as const
  const MIX2: Record<string, string> = { rg: 'YELLOW', rb: 'MAGENTA', gb: 'CYAN (turquoise)' }
  const mixKey = lampsOn.join('')
  const rightNowLamps: Para[] =
    lampsOn.length === 0
      ? [
          {
            icon: '⚫',
            text: 'All three lamps are off. The wall is black — black is simply NO light arriving at all.',
          },
        ]
      : lampsOn.length === 1
        ? [
            {
              icon: '🔦',
              text: `Only the ${LAMP_NAMES[lampsOn[0]]} lamp shines, so the wall can only be ${LAMP_NAMES[lampsOn[0]]} — a wall never adds colors of its own.`,
            },
          ]
        : lampsOn.length === 2
          ? [
              {
                icon: '✨',
                text: `${LAMP_NAMES[lampsOn[0]]} and ${LAMP_NAMES[lampsOn[1]]} light overlap — and the overlap is ${MIX2[mixKey]}! There is no ${MIX2[mixKey].toLowerCase().split(' ')[0]} lamp anywhere: your eye ADDS the two.`,
              },
              ...(mixKey === 'rb'
                ? [
                    {
                      icon: '💗',
                      text: 'Magenta is special: it is not in the rainbow at all. No single wavelength makes it — it exists ONLY as a mixture.',
                    },
                  ]
                : []),
            ]
          : [
              {
                icon: '⚪',
                text: 'All three overlap in the middle: WHITE. White is not a color of its own — it is every lamp arriving together.',
              },
              {
                icon: '🌈',
                text: 'Around the white middle you can see every pair: red+green = yellow, green+blue = cyan, red+blue = magenta.',
              },
            ]

  // the eye scene's live outcome
  const eyeObj = EYE_OBJECTS[eyeObject]
  const eyeBundle = eyeLamp === 'white' ? WHITE_BUNDLE : [eyeLamp]
  const eyeReflected = reflectedBundle(eyeObj, eyeBundle)
  const seen = eyeSees(eyeReflected)
  const lampWord =
    eyeLamp === 'white'
      ? 'White light — the whole bundle of waves —'
      : `Pure ${EYE_LAMPS.find((l) => l.nm === eyeLamp)?.name ?? colorName(eyeLamp)} light`
  const rightNowEye: Para[] =
    seen.name === 'black'
      ? [
          {
            icon: '⚫',
            text: (
              <>
                {lampWord} pours onto the {eyeObj.name} — and it swallows ALL of it. Nothing
                bounces, nothing reaches the eye: the {eyeObj.name} looks{' '}
                <strong>BLACK</strong>. Black is no light at all.
              </>
            ),
          },
          {
            icon: '🔥',
            text: 'The swallowed light does not vanish — it warms the object (watch the shimmer). That is why dark things get hot in the sun.',
          },
        ]
      : [
          {
            icon: '👁️',
            text: (
              <>
                {lampWord} pours onto the {eyeObj.name}. It swallows{' '}
                {eyeReflected.length === eyeBundle.length ? 'nothing' : 'most of the bundle'} and
                bounces {eyeReflected.length === eyeBundle.length ? 'everything' : 'only its band'}{' '}
                — and that bounce flies into the pupil: the eye sees{' '}
                <strong style={{ color: seen.css }}>{seen.name}</strong>.
              </>
            ),
          },
          {
            icon: '🪞',
            text: 'The object adds NO light of its own. Its color is simply what it refuses to swallow.',
          },
        ]

  const rightNowPrism: Para[] =
    prismLamp === 'white'
      ? [
          {
            icon: '🌈',
            text: 'WHITE goes in — and the whole rainbow comes out onto the screen. The prism added nothing: all those colors were already travelling together inside the white beam. The prism only SORTS them.',
          },
          {
            icon: '🔽',
            text: 'Look at the order on the screen: red bends least, violet bends most. The glass slows shorter waves a little more, so they turn a little harder.',
          },
        ]
      : [
          {
            icon: '🔦',
            text: (
              <>
                Pure{' '}
                <strong style={{ color: wavelengthToCss(prismLamp) }}>
                  {EYE_LAMPS.find((l) => l.nm === prismLamp)?.name ?? colorName(prismLamp)}
                </strong>{' '}
                goes in — and only {EYE_LAMPS.find((l) => l.nm === prismLamp)?.name ?? 'that color'}{' '}
                comes out, just BENT. Nothing fans out: a pure color has no other colors hiding
                inside it.
              </>
            ),
          },
          {
            icon: '🏆',
            text: 'This is exactly how Newton proved the colors come from the LIGHT, not from the glass: if the prism were painting the light, it would paint a pure color too.',
          },
        ]

  // the bone-photo scene's live narration
  const xrayObj = XRAY_OBJECTS[xrayObject]
  const XRAY_FINDS: Record<XrayObjectId, string> = {
    hand: 'the bones stay pale — and the ring stays PURE white: metal swallows every single packet',
    dog: 'the dog\'s whole skeleton appears — skull, spine, ribs, legs and the tail\'s little chain — and the metal tag on its collar glows white',
    case: 'the keys and scissors glow white, the teddy is a faint ghost — the bag never had to be opened',
  }
  const rightNowXray: Para[] =
    xrayLamp === 'ordinary'
      ? [
          {
            icon: '🔦',
            text: (
              <>
                Ordinary light pours onto {xrayObj.name} — and EVERY packet stops dead at the first
                surface it meets. Nothing gets inside; the film only learns the outline.
              </>
            ),
          },
          {
            icon: '⬜',
            text: 'Watch the photo: a plain white silhouette on black. No bones, no secrets — ordinary packets are far too weak to punch through anything.',
          },
        ]
      : [
          {
            icon: '🩻',
            text: (
              <>
                X-ray packets (drawn ghost-pale — eyes catch nothing of them) rain straight THROUGH
                the soft parts of {xrayObj.name} as if they were fog — but watch the little flashes:
                something hidden inside keeps swallowing them, always in the same places.
              </>
            ),
          },
          {
            icon: '📸',
            text: (
              <>
                The film darkens wherever packets land — and on the developing photo{' '}
                {XRAY_FINDS[xrayObject]}.
              </>
            ),
          },
        ]

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

  const seeingDoorbell: Para[] = [
    {
      icon: '🔔',
      text: 'Every metal asks a fixed price to set one electron free. ONE packet must pay it alone — green light and everything shorter can pay OUR plate\'s price; yellow and everything longer cannot, ever.',
    },
    {
      icon: '🥈',
      text: 'Our plate behaves like POTASSIUM, a soft silvery metal with a low price (its real limit is ≈ 540 nm — green). Everyday metals like zinc, iron or copper ask much more: only ultraviolet can free THEIR electrons.',
    },
    {
      icon: '💡',
      text: 'Brightness only changes how OFTEN packets arrive — never what one packet can pay. That is why no amount of red light ever rings the bell.',
    },
    {
      icon: '🏆',
      text: 'If light were ONLY a wave, enough red would slowly add up and ring it. It never does. This little doorbell is how we know light really comes in packets.',
    },
  ]

  const seeingLamps: Para[] = [
    {
      icon: '➕',
      text: 'Mixing LIGHT adds up: red + green = yellow, all three = white. Mixing paint does the opposite — paint EATS colors, so paint mixtures get darker, never white.',
    },
    {
      icon: '📺',
      text: 'Your screen does exactly this. Every pixel is three tiny lamps — see the magnified pixel in the corner, and the real photo in the 📷 panel.',
    },
    {
      icon: '🤫',
      text: 'Honest note: screen yellow is a trick — really red + green arriving together. TRUE yellow light (like sodium\'s 589 nm) is one single wave. Your eye just cannot tell the two apart.',
    },
  ]

  const seeingEye: Para[] = [
    {
      icon: '🍎',
      text: 'Objects have no light of their own. Light pours on them as a bundle of waves; each object SWALLOWS some and bounces the rest — your eye sees whatever bounced.',
    },
    {
      icon: '💡',
      text: 'An object can only bounce colors it is GIVEN. Under pure blue light a red apple has nothing to bounce — so it is black, honestly black, not "dark red".',
    },
    {
      icon: '🌈',
      text: 'Honest notes: real surfaces bounce BANDS (we draw a few waves as the band\'s symbol, not single lines — those belong to lone atoms and their barcodes); the eye is drawn huge and cartoon-simple; and real surfaces scatter light in ALL directions — we draw the one bundle that happens to reach the eye.',
    },
  ]

  const seeingPrism: Para[] = [
    {
      icon: '⚪',
      text: 'White light is not a color — it is ALL the wavelengths travelling together. They only look white because they arrive at once.',
    },
    {
      icon: '🔼',
      text: 'Glass slows light down a little, and it slows shorter waves a little MORE — so every wavelength turns by its own amount, and the bundle fans apart. Sorting, not painting.',
    },
    {
      icon: '🌦️',
      text: 'A rainbow in the sky is millions of raindrops doing the prism\'s job to sunlight. Switch to 💧 Raindrop: the light goes in, bounces once off the back of the drop and comes back out, fanned into colors — about 42° from where the sunlight was heading. That is why a rainbow always stands opposite the Sun.',
    },
    {
      icon: '💎',
      text: 'Diamond bends light much more than glass or water. Turn a diamond prism and the light often cannot get out: it bounces around inside (the little sparkles). That trapped, bouncing light is what makes a cut diamond glitter.',
    },
    {
      icon: '🧾',
      text: 'Honest notes: the colors here fan out about six times wider than in a real prism, so you can see them (real glass spreads white light by only about one degree — the ORDER of the colors and which material spreads more are true). Every surface also bounces back a little light; we leave that out. The raindrop is drawn hugely enlarged.',
    },
  ]

  const seeingXray: Para[] = [
    {
      icon: '🌑',
      text: 'An X-ray photo is a SHADOW picture. The film goes dark wherever packets get THROUGH — the bones look white because they swallowed their packets and their patch of film was never hit.',
    },
    {
      icon: '⚪',
      text: 'Why draw packets and not one long wave? Because the swallowing happens one packet at a time: each packet meets an atom and is either caught WHOLE or flies on untouched — all or nothing, never half. That game of chance is what the little flashes are playing. It is the wave machine\'s ⚪ photons picture — and each dash still carries its little wave inside.',
    },
    {
      icon: '🦴',
      text: 'Why bones? They are full of calcium — atoms with 20 electrons each (count them in the atom builder!). Big atoms with many electrons are great catchers; the little hydrogen, carbon and oxygen atoms flesh is made of barely slow a packet down.',
    },
    {
      icon: '👁️',
      text: 'It is the eye scene\'s exact opposite: your eye makes its picture from the light an object BOUNCES back — the doctor\'s photo is made from the light that got THROUGH.',
    },
    {
      icon: '↩️',
      text: 'A small share of the packets really does bounce away — in all directions (the sideways sparks). That stray light is why the radiographer steps behind a shielded wall and drapes you in the heavy lead apron.',
    },
    {
      icon: '⚠️',
      text: 'Honest note: packets strong enough to fly through you (thousands of times a red packet\'s punch — the doorbell\'s heavyweights) can also break molecules on the way. That is why real X-ray photos are quick and rare.',
    },
  ]

  const seeing: Para[] =
    scene === 'doorbell'
      ? seeingDoorbell
      : scene === 'lamps'
      ? seeingLamps
      : scene === 'eye'
      ? seeingEye
      : scene === 'prism'
      ? seeingPrism
      : scene === 'xray'
      ? seeingXray
      : view === 'photons'
      ? [
          {
            icon: '⚪',
            text: 'Same light — two true pictures. Looked at closely enough, light arrives in packets called photons. The wave picture and the packet picture are BOTH right; each answers different questions.',
          },
          {
            icon: '🥊',
            text: 'One photon\'s punch depends ONLY on its color (its wavelength) — never on brightness. Shorter wave → harder punch: that is why the meters fill toward violet and max out past it.',
          },
          {
            icon: '🚫',
            text: 'Photons are not little balls — the packet drawing is our symbol, just like the wavy line. Real photons have no edges you could draw.',
          },
        ]
      : [
          {
            icon: '🌊',
            text: 'Light is a travelling wave. The distance from one crest to the next — one wavelength — IS its color. Stretch it and the color changes; nothing else about it does.',
          },
          {
            icon: '📊',
            text: 'The bar on top is the whole light family on one line, from γ rays to radio. It is a LOG scale: every step to the right makes the waves ten times longer. The rainbow — everything eyes can see — is the thin sliver under the 👁.',
          },
          {
            icon: '💡',
            text: 'The brightness slider changes the wave\'s HEIGHT, never its color. Dim red is still red; blinding red is still red.',
          },
        ]

  const tipsDoorbell: Para[] = [
    {
      icon: '🔴',
      text: 'Try deep red at FULL brightness: a storm of packets, zero rings. Then one notch of dim violet: RING.',
    },
    {
      icon: '⚖️',
      text: 'Find the edge: slide slowly through green (around 540 nm) and catch the exact color where the bell starts ringing.',
    },
    {
      icon: '🏃',
      text: 'Compare how fast the electrons fly for violet vs X-rays — the leftover energy is theirs to keep.',
    },
  ]

  const tipsWave: Para[] = [
    { icon: '🖱️', text: 'Drag the wave itself left or right to squeeze or stretch it.' },
    {
      icon: '⚪',
      text: 'Flip between 🌊 wave and ⚪ photons and watch the wave pinch into packets — then blur back into one wave.',
    },
    {
      icon: '🌓',
      text: 'In the ⚪ picture, turn the brightness down: FEWER packets, same punch each. A million red photons still can\'t do what one violet photon can — the doorbell scene will prove it.',
    },
    {
      icon: '🟡',
      text: 'Find 589 nm — that exact yellow is sodium\'s famous line from the ✨ Light & color demo (and old street lamps).',
    },
    {
      icon: '🥷',
      text: 'Slide past either end of the rainbow: the wave is still there, your eyes just stop catching it. Warmth from a fire and sunburn are both light you cannot see.',
    },
    {
      icon: '📏',
      text: 'Honest note: the wave is drawn about a MILLION times too big. About a hundred real red-light waves fit across one of your hairs.',
    },
  ]

  const tipsLamps: Para[] = [
    { icon: '🟡', text: 'Make yellow — without touching a single yellow thing: red up, green up, blue off.' },
    { icon: '💗', text: 'Make magenta (red + blue): a color the rainbow does not have.' },
    { icon: '⚪', text: 'All three to the top: white. Then pull one away and watch what white is made of.' },
    {
      icon: '🎨',
      text: 'Try the same with real paints some day — you get brown, not white. Paint eats light; lamps add it.',
    },
  ]

  const tipsEye: Para[] = [
    { icon: '🔵', text: 'The trick: put the red apple under the blue lamp. Then snap back to white.' },
    {
      icon: '🟠',
      text: 'Try the sodium-orange lamp (589 nm — the Light & color demo\'s line) on the blue cup: that is why cars lose their colors under old street lamps at night.',
    },
    { icon: '📄', text: 'The white paper is a mirror for colors: it always shows exactly what the lamp gives.' },
    { icon: '🪨', text: 'The black stone eats every lamp — and warms up the most. Feel a dark car in summer.' },
  ]

  const tipsPrism: Para[] = [
    { icon: '🔴', text: 'Send pure red through, then pure violet: same prism, different bend — and neither one splits.' },
    { icon: '🌈', text: 'Back to white: count the stripes on the screen and check the order, red at the top to violet at the bottom.' },
    { icon: '↻', text: 'Drag around the prism to turn it. Watch the rainbow slide up and down the screen — and find the angle where the light stops coming out of the far side.' },
    { icon: '💎', text: 'Try diamond: the colors spread wider, and the light bounces inside far more often.' },
    { icon: '💧', text: 'In the raindrop, drag the beam up and down. Only near one spot do the colors come back out together — that spot paints the rainbow.' },
    { icon: '💿', text: 'At home: the rainbow flashes on a CD, or in the fine spray of a garden hose with the sun behind you — same unpacking.' },
  ]

  const tipsXray: Para[] = [
    {
      icon: '✨',
      text: 'Watch the flashes before the photo develops: they keep landing in the same hidden places — the stopping spots ARE the picture.',
    },
    {
      icon: '🔦',
      text: 'Switch the tube to ordinary light: even blindingly bright, nothing gets past the skin — the photo is only a silhouette. Only X-ray packets punch through.',
    },
    {
      icon: '🐕',
      text: 'Photograph the dog, then compare with the REAL vet X-ray in the 📷 panel — pets get their bone photos exactly like we do.',
    },
    {
      icon: '💍',
      text: 'Find the ring on the hand\'s photo. The first X-ray picture ever made (📷 panel) was a hand with a ring too.',
    },
  ]

  const tips =
    scene === 'doorbell'
      ? tipsDoorbell
      : scene === 'lamps'
        ? tipsLamps
        : scene === 'eye'
          ? tipsEye
          : scene === 'prism'
            ? tipsPrism
            : scene === 'xray'
              ? tipsXray
              : tipsWave

  const trueStory: Para[] = [
    ...(scene === 'xray'
      ? ([
          {
            icon: '🩻',
            text: 'Wilhelm Röntgen found X-rays by ACCIDENT in 1895: a screen across his dark lab glowed although his tube was wrapped in black cardboard — something invisible was flying right through it. Weeks later he photographed his wife\'s hand, bones and ring through the skin. He refused to patent the discovery so every hospital could use it — and won the first Nobel Prize in physics ever given (1901).',
          },
          {
            icon: '👟',
            text: 'For a while X-rays were treated as a toy: shoe shops had machines where kids wiggled their toes and watched their own foot bones while shoes were fitted. They were banned once we understood the hard-punching packets\' price — today\'s quick, rare photos behind shielded walls are the lesson learned.',
          },
        ] as Para[])
      : []),
    ...(scene === 'prism'
      ? ([
          {
            icon: '🪟',
            text: 'In 1666 young Isaac Newton bought a glass prism at a market fair, darkened his room, and let one sunbeam through a hole in the shutter. The wall showed a rainbow — and with a SECOND prism he proved each pure color refuses to split further. The colors were in the sunlight all along.',
          },
        ] as Para[])
      : []),
    ...(scene === 'doorbell'
      ? ([
          {
            icon: '🧪',
            text: 'This is a real experiment you can watch in a school physics lab: a freshly sanded ZINC plate on an electroscope, charged so its foil leaves spread apart. Blinding visible light — nothing. A UV lamp — the leaves sink in seconds: light is kicking electrons out. Slide a sheet of glass into the beam (glass eats UV) and it stops at once.',
          },
          {
            icon: '⚠️',
            text: 'Not quite a kitchen experiment: zinc needs strong UV light that hurts eyes and skin, and metals that would ring with visible light — like potassium — catch fire in air. The closest thing at home is a solar-powered calculator or garden light: sunlight\'s packets knocking electrons loose to make electricity.',
          },
        ] as Para[])
      : []),
    {
      icon: '💡',
      text: 'For 200 years scientists argued: is light a wave, or a stream of particles? Newton said particles; experiment after experiment said wave — until the doorbell experiment said BOTH.',
    },
    {
      icon: '🏅',
      text: 'Albert Einstein explained the doorbell (why red can never ring it) in 1905. That — not relativity — is what his Nobel Prize names.',
    },
    {
      icon: '🌡️',
      text: 'William Herschel found invisible light in 1800 with a thermometer: he measured just PAST the red end of a rainbow — and it got warmer. Infrared, discovered where nothing visible existed.',
    },
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
            <SectionHeader first>Right now</SectionHeader>
            <Paras items={rightNow} className="text-slate-200" />
            <SectionHeader>What am I seeing?</SectionHeader>
            <Paras items={seeing} />
            <SectionHeader>Tips</SectionHeader>
            <Paras items={tips} className="text-slate-400" />
            <SectionHeader>A true story</SectionHeader>
            <Paras items={trueStory} />
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
          onBell={setRings}
        />
      </div>

      {/* right: control cards (scrolls inside the block) */}
      <div className="flex h-full min-h-0 w-[16.5rem] shrink-0 flex-col gap-4 overflow-y-auto pr-1">
        {top}

        {scene === 'wave' && (
        <Card title="Two pictures of the same light">
          <div className={`flex gap-1 p-1 text-sm ${TRAY}`}>
            {(
              [
                ['wave', '🌊 Wave'],
                ['photons', '⚪ Photons'],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-pressed={view === id}
                className={`flex-1 rounded-md px-2 py-1 transition ${
                  view === id
                    ? 'bg-sky-600 font-medium text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </Card>
        )}

        {scene === 'xray' ? (
          <>
            <Card title="🩻 On the film">
              <div className="grid grid-cols-1 gap-1">
                {XRAY_OBJECT_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setXrayObject(id)}
                    aria-current={xrayObject === id ? 'page' : undefined}
                    className={`rounded-lg px-2 py-1 text-left text-sm transition ${
                      xrayObject === id
                        ? 'bg-sky-600 font-medium text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {XRAY_OBJECTS[id].emoji} {XRAY_OBJECTS[id].name}
                  </button>
                ))}
              </div>
            </Card>

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
            <Card title="🔍 What the light goes through">
              <div className={`flex gap-1 p-1 text-sm ${TRAY}`}>
                {(
                  [
                    ['prism', '🔼 Prism'],
                    ['drop', '💧 Raindrop'],
                  ] as const
                ).map(([id, text]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPrism((p) => ({ ...p, shape: id }))}
                    aria-pressed={prism.shape === id}
                    className={`flex-1 rounded-lg px-2 py-1 transition ${
                      prism.shape === id ? 'bg-sky-600 font-medium text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
              {prism.shape === 'prism' && (
                <>
                  <div className="mb-1 mt-3 text-xs text-slate-400">made of</div>
                  <div className={`flex gap-1 p-1 text-sm ${TRAY}`}>
                    {(
                      [
                        ['glass', '🪟 glass'],
                        ['water', '💧 water'],
                        ['diamond', '💎 diamond'],
                      ] as const
                    ).map(([id, text]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPrism((p) => ({ ...p, material: id }))}
                        aria-pressed={prism.material === id}
                        className={`flex-1 rounded-lg px-1 py-1 text-xs transition ${
                          prism.material === id ? 'bg-sky-600 font-medium text-white' : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrism((p) => ({ ...p, angle: 0 }))}
                    className={`mt-3 w-full px-3 py-1.5 text-sm text-slate-200 ${KEY}`}
                  >
                    ↺ Straighten the prism
                  </button>
                </>
              )}
              {prism.shape === 'drop' && (
                <button
                  type="button"
                  onClick={() => setPrism((p) => ({ ...p, impact: DEFAULT_PRISM.impact }))}
                  className={`mt-3 w-full px-3 py-1.5 text-sm text-slate-200 ${KEY}`}
                >
                  🌈 Aim at the rainbow spot
                </button>
              )}
            </Card>
            <Card title="💡 The lamp">
              <LampChips value={prismLamp} onChange={setPrismLamp} />
            </Card>
          </>
        ) : scene === 'eye' ? (
          <>
            <Card title="🍎 On the table">
              <div className="grid grid-cols-1 gap-1">
                {EYE_OBJECT_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEyeObject(id)}
                    aria-current={eyeObject === id ? 'page' : undefined}
                    className={`rounded-lg px-2 py-1 text-left text-sm transition ${
                      eyeObject === id
                        ? 'bg-sky-600 font-medium text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {EYE_OBJECTS[id].emoji} {EYE_OBJECTS[id].name}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="💡 The lamp">
              <LampChips value={eyeLamp} onChange={setEyeLamp} />
            </Card>
          </>
        ) : scene === 'lamps' ? (
          <>
            <Card title="The light you built">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-lg border border-slate-600"
                  style={{ background: lampMixCss(lamps) }}
                />
                <div className="text-sm leading-snug">
                  <div className="font-medium text-slate-100">the middle of the wall</div>
                  <div className="text-xs text-slate-400">where all the lamps overlap</div>
                </div>
              </div>
            </Card>

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
            <Card title="The light you built">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-lg border border-slate-600"
                  style={{
                    background: visible ? wavelengthToCss(nm) : '#1e293b',
                    opacity: visible ? 0.35 + 0.65 * brightness : 1,
                  }}
                />
                <div className="text-sm leading-snug">
                  <div className="font-medium text-slate-100">
                    {visible ? `${colorName(nm)} light` : band.label}
                  </div>
                  <div className="text-xs text-slate-400">
                    1 wave = {formatWavelength(m)}
                    {visible ? '' : ' · invisible'}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="🌈 Wavelength — stretch the wave">
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

            <Card title="💡 Brightness — the other knob">
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
              : WAVE_PHOTOS[current].map((ph) => ({ title: `${band.label} — in real life`, ph }))
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
