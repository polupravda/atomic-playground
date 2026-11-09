import { useEffect, useRef, useState, type ReactNode } from 'react'
import { storyOrder } from '../stage/FissionStage'
import { CLOSEUP_CAPTIONS, CLOSEUP_EQUATIONS } from '../stage/fissionCloseup'
import { CLOUD_TOP_KM, type BombDesignId } from '../core/fission'

// R01 story timeline (right column): every step of one run, top to bottom.
// The current step is highlighted in the amber caption style and kept in
// view; clicking a step asks the stage to rewind / fast-forward to it.

interface StoryItem {
  group: string
  icon: string
  title: string
  text: ReactNode
}

const eq = (s: string) => (
  <span className="mt-1 block font-mono text-[12px] text-slate-100">{s}</span>
)

const CLOSEUP_TITLES = [
  'A neutron flies in',
  'Uranium-236 wobbles',
  'Split!',
  'Atom 2 is hit',
  'Atom 2 splits',
  'Atom 3 splits',
]
const CLOSEUP_ICONS = ['🎯', '〰️', '💥', '🎯', '🔁', '🎲']

function storyItem(mode: BombDesignId, id: string): StoryItem {
  if (id.startsWith('closeup')) {
    const i = Number(id.slice(7))
    return {
      group: '🔍 Close-up: atoms being hit',
      icon: CLOSEUP_ICONS[i],
      title: CLOSEUP_TITLES[i],
      text: (
        <>
          {CLOSEUP_CAPTIONS[i]}
          {eq(CLOSEUP_EQUATIONS[i])}
        </>
      ),
    }
  }
  if (id.startsWith('explosion')) {
    const i = Number(id.slice(9))
    const steps: Array<[string, string, string]> = [
      ['🔥', 'Flash and fireball', 'A ball of glowing air, hotter than the surface of the Sun.'],
      [
        '💨',
        'Shock wave',
        'A wall of squeezed air races out along the ground. The coloured rings appear as it passes — that is the damage.',
      ],
      ['🌪️', 'Dust stem', 'The rising fireball sucks a column of dust up behind it.'],
      [
        '🍄',
        'Mushroom cloud',
        `The hot fireball rises like a hot-air balloon, up to about ${CLOUD_TOP_KM[mode]} km.`,
      ],
      [
        '📏',
        'Size comparison',
        'All three bombs side by side, on the same scale. The red rings show where houses were flattened.',
      ],
    ]
    const [icon, title, text] = steps[i]
    return { group: '💥 The explosion', icon, title, text }
  }
  const setup = '🧨 Getting ready'
  const chain = '⚛️ Chain reaction'
  switch (id) {
    case 'armed':
      return {
        group: setup,
        icon: '🧰',
        title: 'Ready',
        text: {
          gun: 'Two pieces of uranium-235 wait apart in the gun barrel. Each piece alone is too small for a chain reaction.',
          implosion: 'A ball of plutonium-239 sits inside 16 explosive blocks all around it. Its atoms are as close as in any metal — like Little Boy\'s uranium — but the ball is too small for a chain reaction.',
          tsar: 'Stage 1 is the trigger: a small plutonium implosion bomb. Stage 2 is hydrogen fuel: deuterium + tritium.',
        }[mode],
      }
    case 'countdown':
      return {
        group: setup,
        icon: '⏳',
        title: 'Countdown',
        text: mode === 'gun'
            ? '3… 2… 1… the firing unit\'s plunger goes down and a spark runs along the wire to the explosive.'
            : '3… 2… 1… the firing unit\'s plunger goes down and a spark runs round the ring to every block at once.',
      }
    case 'assembling':
      return {
        group: setup,
        icon: '💥',
        title: 'The explosive fires',
        text: {
          gun: 'The explosive fires the uranium "bullet" into the target: one lump, big enough — critical!',
          implosion: 'Every explosive block fires at the same instant and squeezes the plutonium ball. Its atoms are pushed closer than in normal metal — critical!',
          tsar: "The trigger's explosives fire together and squeeze its plutonium closer than in normal metal — critical!",
        }[mode],
      }
    case 'chain':
      return {
        group: chain,
        icon: '⚛️',
        title: 'The chain reaction starts',
        text:
          mode === 'tsar'
            ? 'Stage 1 explodes like a small Fat Man: each split nucleus frees 2–3 neutrons, which split more nuclei…'
            : 'One neutron splits a nucleus, which frees 2–3 neutrons, which split more nuclei…',
      }
    case 'chainAfter':
      return {
        group: chain,
        icon: '📈',
        title: 'The chain races on',
        text: 'Back to the whole bomb: the chain reaction races through the rest of the metal.',
      }
    case 'xray':
      return {
        group: '☀️ The hydrogen stage',
        icon: '💜',
        title: 'X-rays',
        text: 'The trigger blasts out X-rays (violet). They squeeze and heat the hydrogen fuel.',
      }
    case 'fusion':
      return {
        group: '☀️ The hydrogen stage',
        icon: '☀️',
        title: 'Fusion',
        text: 'Hydrogen nuclei crash together into helium — like inside the Sun.',
      }
    case 'chainDone':
      return {
        group: chain,
        icon: '⚡',
        title: 'All the energy at once',
        text:
          mode === 'tsar'
            ? 'Fusion made about 97% of the energy — all in a few millionths of a second.'
            : 'Every split released energy, and it all comes out in less than a millionth of a second.',
      }
    default:
      return { group: '', icon: '', title: id, text: '' }
  }
}

export function StoryTimeline({
  mode,
  currentId,
  onSeek,
}: {
  mode: BombDesignId
  currentId: string
  onSeek: (id: string) => void
}) {
  const order = storyOrder(mode)
  const curI = Math.max(0, order.indexOf(currentId))
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const rootRef = useRef<HTMLDivElement | null>(null)
  // auto-follow the current step until the kid scrolls the column by hand
  const [following, setFollowing] = useState(true)

  // a new run (back to "Ready", or another bomb) follows again
  useEffect(() => {
    if (currentId === 'armed') setFollowing(true)
  }, [currentId, mode])

  // only REAL user scrolling (wheel, touch, scroll keys, scrollbar drag)
  // pauses following — our own scrollTo calls must not
  useEffect(() => {
    const box = rootRef.current?.closest('[data-story-scroll]') as HTMLElement | null
    if (!box) return
    const stop = () => setFollowing(false)
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) stop()
    }
    const onDown = (e: PointerEvent) => {
      if (e.target === box) stop() // the scrollbar itself
    }
    box.addEventListener('wheel', stop, { passive: true })
    box.addEventListener('touchmove', stop, { passive: true })
    box.addEventListener('keydown', onKey)
    box.addEventListener('pointerdown', onDown)
    return () => {
      box.removeEventListener('wheel', stop)
      box.removeEventListener('touchmove', stop)
      box.removeEventListener('keydown', onKey)
      box.removeEventListener('pointerdown', onDown)
    }
  }, [])

  // pin the current step to the TOP of the scrolling column (scrolls only
  // that column, never the page)
  useEffect(() => {
    if (!following) return
    const el = refs.current.get(currentId)
    const box = el?.closest('[data-story-scroll]') as HTMLElement | null
    if (!el || !box) return
    const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 4
    // glide between neighbouring steps; snap on big jumps (timeline clicks)
    const far = Math.abs(top - box.scrollTop) > 400
    box.scrollTo({ top, behavior: far ? 'auto' : 'smooth' })
  }, [currentId, following])

  let lastGroup = ''
  return (
    <div ref={rootRef}>
    <div className="space-y-1.5 pb-[100vh]">
      <p className="text-xs text-slate-400">Click any step to jump there.</p>
      {order.map((id, i) => {
        const it = storyItem(mode, id)
        const header = it.group !== lastGroup ? it.group : null
        lastGroup = it.group
        const state = i < curI ? 'past' : i === curI ? 'now' : 'future'
        return (
          <div key={id}>
            {header && (
              <h3 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {header}
              </h3>
            )}
            <button
              ref={(el) => {
                if (el) refs.current.set(id, el)
                else refs.current.delete(id)
              }}
              type="button"
              onClick={() => {
                setFollowing(true)
                onSeek(id)
              }}
              aria-current={state === 'now' ? 'step' : undefined}
              className={`flex w-full items-start gap-2 rounded-lg border px-2 py-1.5 text-left text-sm leading-snug transition ${
                state === 'now'
                  ? 'border-amber-500/70 bg-slate-900/80 text-amber-100'
                  : state === 'past'
                    ? 'border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800/60'
                    : 'border-transparent text-slate-500 hover:border-slate-600 hover:bg-slate-800/60 hover:text-slate-300'
              }`}
            >
              <span aria-hidden className="shrink-0">
                {it.icon}
              </span>
              <span>
                <span className="block font-medium">{it.title}</span>
                <span className="block text-[13px]">{it.text}</span>
              </span>
            </button>
          </div>
        )
      })}
    </div>
    {!following && (
      <button
        type="button"
        onClick={() => setFollowing(true)}
        className="sticky bottom-2 left-0 mx-auto block rounded-full border border-amber-500/70 bg-slate-900/95 px-3 py-1.5 text-sm text-amber-100 shadow-lg shadow-black/40 transition hover:bg-slate-800"
      >
        📍 Back to the current step
      </button>
    )}
    </div>
  )
}
