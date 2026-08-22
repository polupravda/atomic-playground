import { usePageStore, type AppPage } from '../state/pageStore'

// The top-left menu of top-level destinations. The atom builder and the two
// playgrounds are SIBLING full-screen views — the periodic table and matter
// lab stay as drawers inside the builder, because they depend on the
// current atom.
const ITEMS: Array<{ id: AppPage; label: string }> = [
  { id: 'builder', label: '⚛️ Atom builder' },
  { id: 'charges', label: '⚡ Charge playground' },
  { id: 'bonding', label: '🧪 Bonding lab' },
]

export function PageNav() {
  const page = usePageStore((s) => s.page)
  const setPage = usePageStore((s) => s.setPage)
  // Styled like the app's segmented controls (cf. ViewToggle): one compact
  // bordered group, solid sky = active. Deliberately NOT the info-panel
  // look — this is an action control, not a content block.
  return (
    <nav
      aria-label="Views"
      className="flex w-64 shrink-0 flex-col gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm"
    >
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => setPage(it.id)}
          aria-current={page === it.id ? 'page' : undefined}
          className={`w-full rounded-lg px-3 py-2 text-left transition ${
            page === it.id
              ? 'bg-sky-600 font-medium text-white'
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          {it.label}
        </button>
      ))}
    </nav>
  )
}
