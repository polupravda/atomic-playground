import { usePageStore, type AppPage, type ExampleId } from '../state/pageStore'

// The top-left menu of top-level destinations. The atom builder and the two
// playgrounds are SIBLING full-screen views — the periodic table and matter
// lab stay as drawers inside the builder, because they depend on the
// current atom. The demos of 🌍 Atoms in action are its SUB-ITEMS: nested
// under it (indented on a guide line), expanded while it is open.
const ITEMS: Array<{ id: AppPage; label: string }> = [
  { id: 'builder', label: '⚛️ Atom builder' },
  { id: 'charges', label: '⚡ Charge playground' },
  { id: 'bonding', label: '🧪 Bonding lab' },
  { id: 'light', label: '💡 Light lab' },
  { id: 'examples', label: '🌍 Atoms in action' },
]

export const EXAMPLE_ITEMS: Array<{ id: ExampleId; label: string }> = [
  { id: 'bomb', label: '☢️ Atomic bomb' },
  { id: 'light', label: '✨ Light & color' },
  { id: 'cosmos', label: '🌟 Star stuff' },
]

export function PageNav() {
  const page = usePageStore((s) => s.page)
  const example = usePageStore((s) => s.example)
  const setPage = usePageStore((s) => s.setPage)
  const setExample = usePageStore((s) => s.setExample)
  // Styled like the app's segmented controls (cf. ViewToggle): one compact
  // bordered group, solid sky = active. Deliberately NOT the info-panel
  // look — this is an action control, not a content block.
  return (
    <nav
      aria-label="Views"
      className="flex w-64 shrink-0 flex-col gap-1 rounded-xl border border-slate-700 bg-slate-800/60 p-1 text-sm"
    >
      {ITEMS.map((it) => {
        const parent = it.id === 'examples'
        const open = parent && page === 'examples'
        return (
          <div key={it.id}>
            <button
              type="button"
              onClick={() => setPage(it.id)}
              aria-current={page === it.id && !parent ? 'page' : undefined}
              aria-expanded={parent ? open : undefined}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-left transition ${
                open
                  ? // the section is open; its active demo below is the solid one
                    'bg-sky-600/25 font-medium text-white'
                  : page === it.id
                    ? 'bg-sky-600 font-medium text-white'
                    : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="flex-1">{it.label}</span>
              {parent && (
                <span aria-hidden className={`text-sm leading-none text-slate-400 transition ${open ? 'rotate-90' : ''}`}>
                  ▸
                </span>
              )}
            </button>
            {open && (
              <ul aria-label="Demos" className="ml-5 mt-1 flex flex-col gap-1 border-l border-slate-600 pl-2">
                {EXAMPLE_ITEMS.map((ex) => (
                  <li key={ex.id}>
                    <button
                      type="button"
                      onClick={() => setExample(ex.id)}
                      aria-current={example === ex.id ? 'page' : undefined}
                      className={`w-full rounded-lg px-3 py-1.5 text-left text-[13px] transition ${
                        example === ex.id
                          ? 'bg-sky-600 font-medium text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {ex.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}
