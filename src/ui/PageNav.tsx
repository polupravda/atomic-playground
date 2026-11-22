import { usePageStore, type AppPage } from '../state/pageStore'
import { cancelNarration } from './useNarration'
import { NarrationLangSwitch, VoiceSwitch } from './VoiceSwitch'
import { FLAT } from './surfaces'

// The top-left menu of top-level destinations, and right under it the
// storyteller voice + language card — on EVERY page, the same place. The
// atom builder, the playgrounds, the labs and 🎬 Stories are SIBLING
// full-screen views; the stories themselves are picked on the stories
// menu (StoriesHome), not here (docs/how-things-work/17-stories-menu.md).
const ITEMS: Array<{ id: AppPage; label: string }> = [
  { id: 'builder', label: '⚛️ Atom builder' },
  { id: 'charges', label: '⚡ Charge playground' },
  { id: 'bonding', label: '🧪 Bonding lab' },
  { id: 'crystal', label: '🧊 Crystal lab' },
  { id: 'light', label: '💡 Light lab' },
  { id: 'examples', label: '🎬 Stories' },
]

export function PageNav() {
  const page = usePageStore((s) => s.page)
  const setPage = usePageStore((s) => s.setPage)
  // Styled like the app's segmented controls (cf. ViewToggle): one compact
  // bordered group, solid sky = active. Deliberately NOT the info-panel
  // look — this is an action control, not a content block.
  return (
    <>
      <nav aria-label="Views" className={`flex w-64 shrink-0 flex-col gap-1 p-1 text-sm ${FLAT}`}>
        {ITEMS.map((it) => (
          <button
            key={it.id}
            type="button"
            // every press counts — also on the current page: 🎬 Stories
            // mid-story goes back to the stories menu (the story resets)
            onClick={() => {
              cancelNarration() // navigating is a deliberate interruption
              setPage(it.id)
            }}
            aria-current={page === it.id ? 'page' : undefined}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-left transition ${
              page === it.id ? 'bg-sky-600 font-medium text-white hover:bg-sky-500' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            {it.label}
          </button>
        ))}
      </nav>
      {/* the storyteller voice and its language: one global setting */}
      <div className={`flex w-64 shrink-0 flex-col gap-1.5 p-1.5 ${FLAT}`}>
        <VoiceSwitch />
        <NarrationLangSwitch />
      </div>
    </>
  )
}
