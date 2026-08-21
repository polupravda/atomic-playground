import { useViewStore, type AtomView } from '../state/viewStore'

const LABELS: Record<AtomView, string> = {
  shells: 'Shells',
  cloud: 'Cloud',
  orbitals: 'Orbitals',
}

export function ViewToggle() {
  const view = useViewStore((s) => s.view)
  const transition = useViewStore((s) => s.transition)
  const requestView = useViewStore((s) => s.requestView)
  // While morphing, highlight the destination so the toggle reads as "on
  // its way there".
  const active = transition?.to ?? view
  return (
    <div className="flex w-64 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm">
      {(Object.keys(LABELS) as AtomView[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => requestView(v)}
          disabled={transition !== null}
          className={`flex-1 rounded-lg px-2 py-1.5 transition ${
            active === v
              ? 'bg-sky-600 font-medium text-white'
              : 'text-slate-300 hover:bg-slate-700'
          } ${transition ? 'cursor-wait opacity-70' : ''}`}
        >
          {transition && active === v ? 'Morphing…' : LABELS[v]}
        </button>
      ))}
    </div>
  )
}
