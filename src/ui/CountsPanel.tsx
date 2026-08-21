import { useEffect, useRef, useState } from 'react'
import {
  limitFor,
  maxElectronsFor,
  useAtomStore,
  type ParticleKind,
} from '../state/atomStore'
import { useFeedbackStore, type FeedbackSegment } from '../state/feedbackStore'
import { useEventStore } from '../state/eventStore'
import { FeedbackToast } from './FeedbackToast'

const ROWS: Array<{ kind: ParticleKind; label: string; dotClass: string }> = [
  { kind: 'protons', label: 'Protons', dotClass: 'bg-red-400' },
  { kind: 'neutrons', label: 'Neutrons', dotClass: 'bg-slate-400' },
  { kind: 'electrons', label: 'Electrons', dotClass: 'bg-sky-400' },
]

function overLimitMessage(
  kind: ParticleKind,
  limit: number,
  protons: number,
): FeedbackSegment[] {
  if (kind === 'protons') {
    return [
      { text: 'Maximum ' },
      { text: '118', color: 'protons', big: true },
      { text: ' protons', color: 'protons' },
      { text: ' — no bigger element exists!' },
    ]
  }
  if (kind === 'neutrons') {
    return [
      { text: 'Maximum ' },
      { text: String(limit), color: 'neutrons', big: true },
      { text: ' neutrons', color: 'neutrons' },
      { text: ' for ' },
      { text: String(protons), color: 'protons', big: true },
      { text: ` proton${protons === 1 ? '' : 's'}`, color: 'protons' },
      { text: ' — extra neutrons just fall off the nucleus!' },
    ]
  }
  return [
    { text: 'Maximum ' },
    { text: String(limit), color: 'electrons', big: true },
    { text: ' electrons', color: 'electrons' },
    { text: ' for ' },
    { text: String(protons), color: 'protons', big: true },
    { text: ` proton${protons === 1 ? '' : 's'}`, color: 'protons' },
    { text: '!' },
  ]
}

/** One particle row: −/+ buttons and a numeric input. When physics corrects
 *  a typed value, the field turns red and visibly counts down to the allowed
 *  number instead of jumping, so the correction is understandable. */
function NumberRow({ kind, label, dotClass }: (typeof ROWS)[number]) {
  const value = useAtomStore((s) => s[kind])
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const electrons = useAtomStore((s) => s.electrons)
  const setCount = useAtomStore((s) => s.setCount)
  const addParticle = useAtomStore((s) => s.addParticle)
  const notify = useFeedbackStore((s) => s.notify)
  const flash = useFeedbackStore((s) => s.flash)
  // manual edits supersede any lingering event story (it described an atom
  // that no longer exists)
  const clearStory = useEventStore((s) => s.clearStory)

  // While non-null, the input shows this animated value in red.
  const [display, setDisplay] = useState<number | null>(null)
  const animFrame = useRef<number | null>(null)

  const cancelAnim = () => {
    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current)
    animFrame.current = null
    setDisplay(null)
  }

  const animateCorrection = (from: number, to: number) => {
    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current)
    const start = performance.now()
    const duration = 1300
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      if (t < 1) {
        setDisplay(Math.round(from + (to - from) * eased))
        animFrame.current = requestAnimationFrame(tick)
      } else {
        animFrame.current = null
        setDisplay(null)
      }
    }
    setDisplay(from)
    animFrame.current = requestAnimationFrame(tick)
  }

  // External correction flash (e.g. electrons shed by a proton decrease).
  useEffect(() => {
    if (flash && flash.kind === kind) {
      animateCorrection(flash.from, useAtomStore.getState()[kind])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash?.seq])

  useEffect(() => cancelAnim, [])

  const applyProtonValue = (next: number) => {
    const clamped = Math.min(limitFor('protons', 0), Math.max(0, Math.round(next)))
    const shed = electrons - maxElectronsFor(clamped)
    const shedNeutrons = neutrons - limitFor('neutrons', clamped)
    setCount('protons', next)
    if (next > limitFor('protons', 0)) {
      notify(overLimitMessage('protons', limitFor('protons', 0), protons))
      animateCorrection(next, limitFor('protons', 0))
    } else if (shedNeutrons > 0) {
      notify(
        [
          { text: String(shedNeutrons), color: 'neutrons', big: true },
          { text: ` neutron${shedNeutrons === 1 ? '' : 's'}`, color: 'neutrons' },
          { text: ' fell off — a nucleus with only ' },
          { text: String(clamped), color: 'protons', big: true },
          { text: ` proton${clamped === 1 ? '' : 's'}`, color: 'protons' },
          { text: " can't hold that many!" },
        ],
        { kind: 'neutrons', from: neutrons },
      )
    } else if (shed > 0) {
      notify(
        [
          { text: String(shed), color: 'electrons', big: true },
          { text: ` electron${shed === 1 ? '' : 's'}`, color: 'electrons' },
          { text: ' flew away — only ' },
          { text: String(clamped), color: 'protons', big: true },
          { text: ` proton${clamped === 1 ? '' : 's'}`, color: 'protons' },
          { text: ' left!' },
        ],
        { kind: 'electrons', from: electrons },
      )
    }
  }

  const handleInput = (raw: number) => {
    clearStory()
    if (Number.isNaN(raw)) {
      cancelAnim()
      setCount(kind, 0)
      return
    }
    if (kind === 'protons') {
      applyProtonValue(raw)
      return
    }
    const limit = limitFor(kind, protons)
    if (raw > limit) {
      setCount(kind, raw) // store clamps to the limit
      notify(overLimitMessage(kind, limit, protons))
      animateCorrection(raw, limit)
    } else {
      cancelAnim()
      setCount(kind, raw)
    }
  }

  const atLimit =
    (kind === 'electrons' && electrons >= maxElectronsFor(protons)) ||
    (kind === 'neutrons' && neutrons >= limitFor('neutrons', protons))

  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={`h-3 w-3 shrink-0 rounded-full ${dotClass}`} />
      <span className="w-[4.5rem] text-slate-300">{label}</span>
      <button
        type="button"
        aria-label={`Remove one of ${label}`}
        onClick={() => {
          cancelAnim()
          clearStory()
          if (kind === 'protons') applyProtonValue(value - 1)
          else addParticle(kind, -1)
        }}
        disabled={value === 0}
        className="h-7 w-7 rounded-md bg-slate-700 font-mono text-slate-100 transition hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        aria-label={`${label} count`}
        value={display ?? value}
        onChange={(e) => handleInput(e.target.valueAsNumber)}
        className={`h-7 w-14 rounded-md border bg-slate-900 text-center font-mono outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          display !== null
            ? 'border-red-500 text-red-400'
            : 'border-slate-600 text-slate-100 focus:border-sky-500'
        }`}
      />
      <button
        type="button"
        aria-label={`Add one of ${label}`}
        onClick={() => {
          cancelAnim()
          clearStory()
          if (kind === 'protons') applyProtonValue(value + 1)
          else addParticle(kind, 1)
        }}
        disabled={atLimit}
        title={
          atLimit
            ? kind === 'electrons'
              ? 'An atom can only bind about one electron more than its protons — add protons first'
              : 'The neutron drip line: this nucleus cannot hold any more neutrons'
            : undefined
        }
        className="h-7 w-7 rounded-md bg-slate-700 font-mono text-slate-100 transition hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700"
      >
        +
      </button>
    </li>
  )
}

export function CountsPanel() {
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const electrons = useAtomStore((s) => s.electrons)
  const reset = useAtomStore((s) => s.reset)
  const clearStory = useEventStore((s) => s.clearStory)

  return (
    <aside className="relative w-64 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      {/* The correction bubble anchors to this panel — right next to the
          inputs it talks about. */}
      <FeedbackToast />
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Particles
      </h2>
      <ul className="space-y-3">
        {ROWS.map((row) => (
          <NumberRow key={row.kind} {...row} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          clearStory()
          reset()
        }}
        disabled={protons + neutrons + electrons === 0}
        className="mt-4 w-full rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-700"
      >
        Reset atom
      </button>
    </aside>
  )
}
