import { useCallback, useRef, useState, type ReactNode } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { PageNav } from './PageNav'
import { usePageStore } from '../state/pageStore'
import {
  WaveStage,
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
  WAVE_PHOTOS,
  type WavePhoto,
} from '../core/wavePhotos'
import { Paras, SectionHeader, type Para } from './Paras'

// 💡 Light lab (proposal 09, Milestone 10) — a BUILDER like the atom
// builder, not a demo: the kid drives every knob. Step 37+37b scene: the
// wave machine (L01 wave + drag, L02 color readout, L03 beyond the rainbow
// with the EM bar, L04 brightness). Later scenes (wave⇄photons, doorbell,
// lamps, the eye, prism) plug into the scene picker.

const SCENES = [
  { id: 'wave', label: '🌊 Wave machine', ready: true },
  { id: 'doorbell', label: '🔔 The doorbell', ready: true },
  { id: 'lamps', label: '🔦 Mixing lamps', ready: true },
  { id: 'eye', label: '👁️ The eye', ready: true },
  { id: 'prism', label: '🔼 Prism', ready: false },
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
    <div className="w-64 rounded-xl border border-slate-700 bg-slate-800/60 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
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

export function LightLab() {
  const page = usePageStore((s) => s.page)
  // the light being built: wavelength as slider-u (see core/emSpectrum), 0–1
  const [u, setU] = useState(wavelengthToU(670e-9)) // start on lithium red
  const [brightness, setBrightness] = useState(0.75)
  const [view, setView] = useState<WaveView>('wave')
  const [scene, setScene] = useState<WaveScene>('wave')
  const [rings, setRings] = useState(0)
  // all three lamps start on: the white-is-a-mixture surprise comes first
  const [lamps, setLamps] = useState<LampLevels>({ r: 0.85, g: 0.85, b: 0.85 })
  // the eye scene: a red apple under white light is the classic opening
  const [eyeObject, setEyeObject] = useState<EyeObjectId>('apple')
  const [eyeLamp, setEyeLamp] = useState<EyeLampSetting>('white')
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
  }, [])

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

  const rightNow =
    scene === 'doorbell'
      ? rightNowDoorbell
      : scene === 'lamps'
        ? rightNowLamps
        : scene === 'eye'
          ? rightNowEye
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

  const seeing: Para[] =
    scene === 'doorbell'
      ? seeingDoorbell
      : scene === 'lamps'
      ? seeingLamps
      : scene === 'eye'
      ? seeingEye
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

  const tips =
    scene === 'doorbell'
      ? tipsDoorbell
      : scene === 'lamps'
        ? tipsLamps
        : scene === 'eye'
          ? tipsEye
          : tipsWave

  const trueStory: Para[] = [
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
        <PageNav />
        <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm">
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
            className={`absolute inset-0 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300 ${
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

      {/* middle: the canvas (drag = stretch the wave; lamps/eye: no wavelength) */}
      <div
        className={`overflow-hidden rounded-xl border border-slate-700 bg-slate-950 ${
          scene === 'lamps' || scene === 'eye' ? '' : 'cursor-ew-resize'
        }`}
        onPointerDown={scene === 'lamps' || scene === 'eye' ? undefined : onPointerDown}
        onPointerMove={scene === 'lamps' || scene === 'eye' ? undefined : onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <WaveStage
          u={u}
          brightness={brightness}
          view={view}
          scene={scene}
          lamps={lamps}
          eyeObject={eyeObject}
          eyeLamp={eyeLamp}
          active={page === 'light'}
          onBell={setRings}
        />
      </div>

      {/* right: control cards (scrolls inside the block) */}
      <div className="flex h-full min-h-0 w-[16.5rem] shrink-0 flex-col gap-4 overflow-y-auto pr-1">
        <Card title="Scenes">
          <div className="grid grid-cols-2 gap-1">
            {SCENES.map((s) =>
              s.ready ? (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScene(s.id as WaveScene)}
                  aria-current={scene === s.id ? 'page' : undefined}
                  className={`truncate rounded-lg px-2 py-1 text-left text-xs transition ${
                    scene === s.id
                      ? 'bg-sky-600 font-medium text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {s.label}
                </button>
              ) : (
                <div
                  key={s.id}
                  title="coming soon"
                  className="truncate rounded-lg px-2 py-1 text-xs text-slate-500"
                >
                  {s.label} 🔜
                </div>
              ),
            )}
          </div>
        </Card>

        {scene === 'wave' && (
        <Card title="Two pictures of the same light">
          <div className="flex gap-1 rounded-lg bg-slate-900/60 p-1 text-sm">
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

        {scene === 'eye' ? (
          <>
            <Card title="What the eye sees">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-10 w-10 shrink-0 rounded-lg border border-slate-600"
                  style={{ background: seen.css }}
                />
                <div className="text-sm leading-snug">
                  <div className="font-medium text-slate-100">{seen.name}</div>
                  <div className="text-xs text-slate-400">
                    {seen.name === 'black' ? 'nothing bounced back' : 'the bounced band\'s mix'}
                  </div>
                </div>
              </div>
            </Card>

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
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setEyeLamp('white')}
                  aria-current={eyeLamp === 'white' ? 'page' : undefined}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    eyeLamp === 'white'
                      ? 'border-slate-200 bg-slate-100 font-medium text-slate-900'
                      : 'border-slate-600 bg-slate-900/60 text-slate-300 hover:border-slate-400'
                  }`}
                >
                  ⚪ white
                </button>
                {EYE_LAMPS.map((l) => (
                  <button
                    key={l.nm}
                    type="button"
                    onClick={() => setEyeLamp(l.nm)}
                    aria-current={eyeLamp === l.nm ? 'page' : undefined}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      eyeLamp === l.nm
                        ? 'border-slate-200 font-medium text-white'
                        : 'border-slate-600 bg-slate-900/60 text-slate-300 hover:border-slate-400'
                    }`}
                    style={eyeLamp === l.nm ? { background: wavelengthToCss(l.nm) } : undefined}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
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
                    className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-xs text-slate-300 transition hover:border-sky-500 hover:text-white"
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
