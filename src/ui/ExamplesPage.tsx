import { useState, type ReactNode } from 'react'
import { PageNav } from './PageNav'
import { usePageStore } from '../state/pageStore'
import { FissionStage, type FissionReport } from '../stage/FissionStage'
import {
  BOMB_DESIGNS,
  BOMB_DESIGN_ORDER,
  hiroshimas,
  realChainTime,
  type BombDesignId,
} from '../core/fission'
import { BOMB_PHOTO_GROUPS } from '../core/examplePhotos'
import { ChainStats, CompareTable, DamageLegend, ParticleLegend } from './BombLegend'
import { StoryTimeline } from './StoryTimeline'

// R00 — "Atoms in action": a top-level sibling view of practical examples
// where the atom ideas from the builder show up in the real world. Each
// example = info panel (left) + demo canvas (middle) + real photos (right).
// The example strip above the canvas is the switcher; more examples (power
// plant, the Sun, smoke detector…) plug in as further tabs.

type ExampleId = 'bomb'
const EXAMPLES: Array<{ id: ExampleId; label: string }> = [
  { id: 'bomb', label: '☢️ Atomic bomb' },
]

/** `focus` = what is happening on the canvas RIGHT NOW: drawn in the amber
 *  caption style (amber border, dark fill) that captions used to have on
 *  the canvas itself. */
type Para = { icon: string; text: ReactNode; focus?: boolean }

function Paras({ items, className = '' }: { items: Para[]; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((p, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 ${
            p.focus
              ? 'rounded-lg border border-amber-500/70 bg-slate-900/80 px-2 py-1.5 text-amber-100'
              : ''
          }`}
        >
          <span aria-hidden className="shrink-0 leading-snug">
            {p.icon}
          </span>
          <div>{p.text}</div>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ children, first = false }: { children: ReactNode; first?: boolean }) {
  return (
    <h3
      className={`mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 ${
        first ? '' : 'mt-4 border-t border-slate-700 pt-3'
      }`}
    >
      {children}
    </h3>
  )
}

const ARMED: Record<BombDesignId, Para[]> = {
  gun: [
    {
      icon: '🔫',
      text: 'Little Boy (gun type): two pieces of uranium-235 wait apart inside a gun barrel. Each piece alone is too small — its neutrons would escape before finding another nucleus.',
    },
    { icon: '👇', text: 'Press DETONATE to fire one piece into the other.' },
  ],
  implosion: [
    {
      icon: '💣',
      text: 'Fat Man (implosion): a ball of plutonium-239 sits inside a shell of explosives. Its atoms are as close as in any metal — just like Little Boy’s uranium — but the ball is too small: most neutrons would escape.',
    },
    { icon: '👇', text: 'Press DETONATE to squeeze it.' },
  ],
  tsar: [
    {
      icon: '☀️',
      text: 'Tsar Bomba is a HYDROGEN bomb — a different kind. Stage 1 (left) is a small plutonium implosion bomb, wrapped in explosives like Fat Man, used only as a trigger. Stage 2 (right) is hydrogen fuel: deuterium and tritium.',
    },
    { icon: '👇', text: 'Press DETONATE to fire the trigger.' },
  ],
}

/** Left-panel explanation of the current moment. The short ACTION captions
 *  live in the story timeline (right column), highlighted there. */
function rightNow(mode: BombDesignId, r: FissionReport): Para[] {
  if (r.phase === 'explosion' && r.explosionStep === 4) return []
  return rightNowRaw(mode, r)
}

function rightNowRaw(mode: BombDesignId, r: FissionReport): Para[] {
  switch (r.phase) {
    case 'armed':
      return ARMED[mode]
    case 'countdown':
      return [{ icon: '⏳', text: `Counting down… ${r.countdown}` }]
    case 'assembling':
      return mode === 'gun'
        ? [
            {
              icon: '💥',
              text: 'The explosive goes off and fires the uranium "bullet" down the barrel into the target. Together they make one lump big enough for a chain reaction: a critical mass!',
            },
          ]
        : mode === 'tsar'
          ? [
              {
                icon: '💥',
                text: 'Stage 1 fires: every explosive block around the plutonium trigger goes off at the same instant. The blocks squeeze it smaller and denser than normal metal — critical!',
              },
            ]
          : [
            {
              icon: '💥',
              text: 'Every explosive block goes off at the same instant. They squeeze the plutonium ball smaller and denser than any normal metal — the nuclei are pushed closer together than Little Boy’s ever get: critical!',
            },
          ]
    case 'chain': {
      const g = Math.max(1, r.generation)
      return [
        {
          icon: '🎯',
          text:
            mode === 'tsar'
              ? 'Stage 1: the trigger goes off like a small Fat Man — a fission chain reaction. Each hit nucleus splits and throws out 2 or 3 neutrons…'
              : 'One neutron starts it all. Each hit nucleus wobbles, splits in two and throws out 2 or 3 new neutrons — which split more nuclei…',
        },
        {
          icon: '📈',
          text: `Splits so far: ${r.splits} of ${r.total} · generation ${r.generation}`,
        },
        {
          icon: '⏱',
          text: `In a real bomb, ${g} generation${g === 1 ? ' takes' : 's take'} only about ${realChainTime(g)}.`,
        },
      ]
    }
    case 'closeup':
      return [
        [
          {
            icon: '🔍',
            text: 'Zooming in on uranium atoms being hit, one after another. A neutron flies in — it has no electric charge, so neither the electrons nor the protons push it away. It slips straight into the nucleus.',
          },
        ],
        [
          {
            icon: '〰️',
            text: 'The nucleus swallows the neutron and becomes uranium-236. It is far too wobbly: it stretches like a peanut…',
          },
        ],
        [
          {
            icon: '💥',
            text: 'SPLIT! Two smaller atoms fly apart — barium and krypton — plus 3 new neutrons. The energy comes out as heat (the speed of the halves) and violet γ rays, the same rays you saw in the atom builder.',
          },
          {
            icon: '🧮',
            text: 'Count it: 1 + 235 = 236 = 141 + 92 + 3. No nucleon is lost — they are just shared out differently.',
          },
        ],
        [
          {
            icon: '🎯',
            text: 'Follow the neutron heading up-right: it reaches the next uranium atom and hits its nucleus. Atom 2 starts to wobble.',
          },
        ],
        [
          {
            icon: '🔁',
            text: 'Atom 2 splits the same way, and one of ITS neutrons flies on to atom 3. The other neutrons fly off to hit atoms we can\'t see.',
          },
        ],
        [
          {
            icon: '🎲',
            text: 'Atom 3 splits differently: into xenon + strontium + 2 neutrons (1 + 235 = 140 + 94 + 2). Uranium can break into many different pairs.',
          },
          {
            icon: '📈',
            text: 'Every split frees 2 or 3 neutrons, so 1 hit becomes 2–3, then 4–9, then more: the chain reaction grows by itself.',
          },
        ],
      ][r.closeupStep]
    case 'xray':
      return [
        {
          icon: '💜',
          text: 'The trigger blasts out X-rays (violet). They race to the hydrogen fuel faster than anything else and squeeze and heat it — to millions of degrees, hotter than the middle of the Sun.',
        },
      ]
    case 'fusion':
      return [
        {
          icon: '☀️',
          text: 'Stage 2: FUSION! The hydrogen nuclei are so hot and squeezed that they crash together and stick: deuterium + tritium → helium + a very fast neutron. The Sun shines the same way.',
        },
        { icon: '📈', text: `Fusions so far: ${r.fusions} of ${r.fuelTotal}` },
      ]
    case 'chainDone':
      return mode === 'tsar'
        ? [
            {
              icon: '⚡',
              text: `${r.splits} splits in the trigger, then ${r.fusions} fusions. About 97% of Tsar Bomba's energy came from fusion.`,
            },
            {
              icon: '♾️',
              text: 'Fusion fuel has no critical mass — you can keep adding more. That is why hydrogen bombs can be thousands of times stronger.',
            },
          ]
        : [
            {
              icon: '⚡',
              text: `${r.splits} splits in ${r.generation} generations. Every split released energy — and it all comes out at once.`,
            },
            {
              icon: '⏱',
              text: 'A real bomb runs about 80 generations and splits trillions of trillions of nuclei — in less than a millionth of a second.',
            },
          ]
    case 'explosion':
      return [
        {
          icon: '🔥',
          text:
            mode === 'tsar'
              ? 'The energy becomes a fireball about 8 km wide, a shock wave that broke windows 900 km away, and dangerous radiation.'
              : 'The energy becomes a fireball hotter than the surface of the Sun, a crushing shock wave of air, and dangerous radiation.',
        },
        ...(r.aftermath
          ? [
              {
                icon: '🍄',
                text:
                  mode === 'tsar'
                    ? `The mushroom cloud rose about 65 km — 7 times higher than Mount Everest. Tsar Bomba was as strong as about ${(Math.round(hiroshimas('tsar') / 100) * 100).toLocaleString('en-US')} Hiroshima bombs.`
                    : 'The hot fireball rises like a hot-air balloon and pulls a column of dust up behind it — the mushroom cloud.',
              },
            ]
          : []),
      ]
  }
}

const HOW_IT_WORKS: Para[] = [
  {
    icon: '⚛️',
    text: 'Uranium-235 has a huge, wobbly nucleus: 92 protons all pushing each other apart, held together just barely.',
  },
  {
    icon: '🎯',
    text: 'When a neutron hits it, the nucleus stretches and SPLITS into two smaller nuclei. That is called fission. It also throws out 2 or 3 new neutrons.',
  },
  {
    icon: '🔥',
    text: 'The two halves fly apart incredibly fast — that speed becomes heat. One split gives about 50 million times more energy than burning one carbon atom.',
  },
  {
    icon: '🔁',
    text: 'The new neutrons split more nuclei, which free more neutrons: 1 → 2 → 4 → 8 → … That is a chain reaction.',
  },
  {
    icon: '⚖️',
    text: 'Critical mass: in a small lump most neutrons escape through the surface and the chain dies. With enough fuel packed together, the chain grows by itself.',
  },
]

const DESIGN_INFO: Record<'gun' | 'implosion' | 'tsar', Para> = {
  gun: {
    icon: '🔫',
    text: 'Gun type (Little Boy, uranium): fire one too-small piece into another so together they are critical. Simple — the scientists were so sure it would work they never tested it.',
  },
  implosion: {
    icon: '💣',
    text: 'Implosion (Fat Man, plutonium): squeeze a small ball until it is about twice as dense as normal metal. Squeezed this hard, only about 6 kg of plutonium was enough — Little Boy, never squeezed, needed 64 kg of uranium. Plutonium needs this: it starts splitting on its own so quickly that a slow gun would blow the pieces apart too early — a fizzle. It is much harder to build: every block must go off within a millionth of a second of the others — if one side goes off late, the ball squirts out sideways instead of being squeezed.',
  },
  tsar: {
    icon: '☀️',
    text: 'Hydrogen bomb (Tsar Bomba): a small fission bomb is only the match. Its heat makes hydrogen nuclei FUSE — join together — like inside the Sun. Fusion fuel has no critical mass, so these bombs can be made enormous.',
  },
}

const HONEST_NOTES: Para[] = [
  {
    icon: '📐',
    text: 'The dashed casings show the parts inside, not the real shape of each bomb. Little Boy was a tube about 3 m long, Fat Man an egg about 3 m long, and Tsar Bomba a giant tube about 8 m long and 2 m wide.',
  },
  {
    icon: '🐢',
    text: 'Super slow motion: the real chain reaction is about a billion times faster.',
  },
  {
    icon: '🔢',
    text: 'We draw 100 nuclei. A real bomb has trillions of trillions — and only a small part of them split. In Little Boy only about 1 kg of its 64 kg of uranium split before the bomb blew itself apart.',
  },
  {
    icon: '🔭',
    text: 'Nuclei are drawn huge and close together. Really each nucleus is about 100,000 times smaller than its atom, so many neutrons fly past without hitting anything.',
  },
  {
    icon: '🔍',
    text: 'In the close-up the nucleus is drawn thousands of times too big — really it is 100,000 times smaller than its atom. Each nucleus shows ~30 particles instead of 235, and uranium can also split into other pairs than barium + krypton. The real halves fly off as charged ions that lose many electrons.',
  },
  {
    icon: '🧪',
    text: 'Tsar Bomba really had three stages, and its hydrogen fuel was a solid (lithium deuteride) that makes tritium during the blast. We show two stages and ready-made deuterium + tritium.',
  },
  {
    icon: '🧨',
    text: 'The firing unit is drawn as a plunger box for every bomb. Real bombs fired themselves: a radar measured their height as they fell. Little Boy fired bags of gun powder; Fat Man really had 32 explosive blocks (we draw 16). We draw every explosive the same way so you can compare the bombs.',
  },
  {
    icon: '📏',
    text: 'In the explosion picture the cloud height and the damage rings ARE to scale (see the km ruler and the scale bar). The early fireball is drawn much bigger. At this scale a house would be smaller than one pixel — so the rings are the town map.',
  },
  {
    icon: '⛰️',
    text: 'The damage distances are typical textbook values for a bomb exploding high above flat ground. Real cities differ: in Nagasaki, hills sheltered whole districts.',
  },
]

const TRUE_STORY: Para[] = [
  {
    icon: '🕊️',
    text: 'Atomic bombs have been used in war only twice: on Hiroshima (6 August 1945) and Nagasaki (9 August 1945), in Japan. Well over 100,000 people died, and both cities were left in ruins — see the photos.',
  },
  {
    icon: '🧊',
    text: 'Tsar Bomba was only a test, over an empty Arctic island on 30 October 1961. It was so big it was never turned into a weapon.',
  },
  {
    icon: '🤝',
    text: 'Since then, countries have signed treaties to stop testing these bombs and to stop them spreading. The same physics, controlled gently, runs nuclear power plants.',
  },
]

const initialReport: FissionReport = {
  phase: 'armed',
  splits: 0,
  total: 0,
  escaped: 0,
  generation: 0,
  countdown: 0,
  fusions: 0,
  fuelTotal: 0,
  closeupStep: 0,
  explosionStep: 0,
  storyId: 'armed',
  aftermath: false,
}

export function ExamplesPage() {
  const page = usePageStore((s) => s.page)
  const [example, setExample] = useState<ExampleId>('bomb')
  const [mode, setMode] = useState<BombDesignId>('gun')
  const [detonateSignal, setDetonateSignal] = useState(0)
  const [resetSignal, setResetSignal] = useState(0)
  const [paused, setPaused] = useState(false)
  const [seek, setSeek] = useState<{ id: string; n: number } | null>(null)
  const [rightTab, setRightTab] = useState<'story' | 'photos'>('story')
  const [report, setReport] = useState<FissionReport>(initialReport)

    report.phase === 'chainDone'

  const designOrder: Array<'gun' | 'implosion' | 'tsar'> =
    mode === 'tsar'
      ? ['tsar', 'gun', 'implosion']
      : mode === 'implosion'
        ? ['implosion', 'gun', 'tsar']
        : ['gun', 'implosion', 'tsar']

  return (
    <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)_18rem] grid-rows-[minmax(0,1fr)] gap-x-6">
      {/* left: nav + info panel */}
      <div className="col-start-1 row-start-1 flex min-h-0 flex-col gap-3">
        <PageNav />
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300">
          <SectionHeader first>Right now</SectionHeader>
          <Paras items={rightNow(mode, report)} className="text-slate-200" />
          <ChainStats mode={mode} r={report} />
          {report.phase === 'explosion' && report.explosionStep < 4 && (
            <>
              <SectionHeader>Damage on the ground (to scale)</SectionHeader>
              <DamageLegend mode={mode} />
            </>
          )}
          {report.phase === 'explosion' && report.explosionStep === 4 && (
            <>
              <SectionHeader>The three bombs compared</SectionHeader>
              <CompareTable mode={mode} />
            </>
          )}
          <SectionHeader>What the dots mean</SectionHeader>
          <ParticleLegend mode={mode} />
          <SectionHeader>How it works</SectionHeader>
          <Paras items={HOW_IT_WORKS} />
          <SectionHeader>Three ways to build one</SectionHeader>
          <Paras items={designOrder.map((d) => DESIGN_INFO[d])} />
          <SectionHeader>Honest notes</SectionHeader>
          <Paras items={HONEST_NOTES} className="text-slate-400" />
          <SectionHeader>A true story</SectionHeader>
          <Paras items={TRUE_STORY} />
        </div>
      </div>

      {/* middle: example switcher + design picker + demo canvas */}
      <div className="col-start-2 row-start-1 flex min-h-0 flex-col items-center gap-2">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setExample(ex.id)}
                aria-current={example === ex.id ? 'page' : undefined}
                className={`rounded-lg px-3 py-1 transition ${
                  example === ex.id
                    ? 'bg-sky-600 font-medium text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>
          <div
            role="radiogroup"
            aria-label="Bomb design"
            className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm"
          >
            {BOMB_DESIGN_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => {
                  setMode(id)
                  setPaused(false)
                  setResetSignal((n) => n + 1)
                }}
                className={`rounded-lg px-3 py-1 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  mode === id
                    ? 'bg-sky-600 font-medium text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {BOMB_DESIGNS[id].label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <FissionStage
            mode={mode}
            detonateSignal={detonateSignal}
            resetSignal={resetSignal}
            paused={paused}
            seek={seek}
            active={page === 'examples'}
            onReport={setReport}
          />
          {report.phase === 'armed' && (
            <button
              type="button"
              onClick={() => {
                setPaused(false)
                setDetonateSignal((n) => n + 1)
              }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-2xl border-2 border-red-400 bg-red-600 px-8 py-3 text-lg font-bold uppercase tracking-widest text-white shadow-lg shadow-red-900/50 transition hover:bg-red-500 active:scale-95"
            >
              💥 Detonate
            </button>
          )}
          {report.phase !== 'armed' && (
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border px-4 py-2 text-sm transition ${
                paused
                  ? 'border-sky-400 bg-sky-600 text-white hover:bg-sky-500'
                  : 'border-slate-600 bg-slate-800/85 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
          {report.phase === 'explosion' && (
            <button
              type="button"
              onClick={() => {
                setPaused(false)
                setResetSignal((n) => n + 1)
              }}
              className="absolute bottom-4 right-4 rounded-xl border border-slate-600 bg-slate-800/85 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
            >
              ↺ Build the bomb again
            </button>
          )}
        </div>
      </div>

      {/* right: the story timeline, or the real photos */}
      <div className="col-start-3 row-start-1 flex min-h-0 flex-col gap-2">
        <div className="flex gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm">
          {(
            [
              ['story', '📖 Story'],
              ['photos', '📷 Photos'],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRightTab(id)}
              aria-pressed={rightTab === id}
              className={`flex-1 rounded-lg px-3 py-1 transition ${
                rightTab === id
                  ? 'bg-sky-600 font-medium text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
        {/* both stay mounted (scroll positions survive tab switches) */}
        <div
          data-story-scroll
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'story' ? '' : 'hidden'}`}
        >
          <StoryTimeline
            mode={mode}
            currentId={report.storyId}
            onSeek={(id) => setSeek((prev) => ({ id, n: (prev?.n ?? 0) + 1 }))}
          />
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto pr-1 ${rightTab === 'photos' ? '' : 'hidden'}`}
        >
          {BOMB_PHOTO_GROUPS.map((group, gi) => (
            <section key={group.title} className={gi === 0 ? '' : 'mt-4'}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </h2>
              <div className="space-y-3">
                {group.photos.map((ph) => (
                  <figure
                    key={ph.file}
                    className={`rounded-xl border p-2 transition ${
                      ph.design === mode
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    <img
                      src={`${import.meta.env.BASE_URL}examples/${ph.file}`}
                      alt={ph.caption}
                      loading="lazy"
                      className={`w-full rounded-lg border border-slate-700 ${
                        ph.tall ? 'h-72 bg-black object-contain' : 'h-36 object-cover'
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
        </div>
      </div>
    </div>
  )
}
