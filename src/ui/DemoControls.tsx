import type { ReactNode } from 'react'
import { usePageStore } from '../state/pageStore'
import { cancelNarration } from './useNarration'
import { FLAT, KEY, TRAY } from './surfaces'

// The pieces every story page shares (docs/how-things-work/17-stories-menu.md):
// the right column's 📖 Story · 📷 Photos · 📝 Notes tabs, the ← back to the
// stories menu in the canvas corner, and the 📊 live counts laid over the
// canvas. The voice + language card lives under the main menu (PageNav).

/** a story's 📝 Notes tab (the old left info panel: for grown-ups);
 *  its first heading drops the divider above it */
export const INFO_PANEL =
  `min-h-0 flex-1 overflow-y-auto p-3 text-sm leading-relaxed text-slate-300 ${FLAT} [&>h3:first-child]:mt-0 [&>h3:first-child]:border-t-0 [&>h3:first-child]:pt-0`

export type StoryTab = 'story' | 'photos' | 'notes'

const TABS: Array<[StoryTab, string]> = [
  ['story', '📖 Story'],
  ['photos', '📷 Photos'],
  ['notes', '📝 Notes'],
]

/** the right column's tab tray: 📖 Story · 📷 Photos · 📝 Notes */
export function StoryTabs({ tab, onTab }: { tab: StoryTab; onTab: (tab: StoryTab) => void }) {
  return (
    <div className={`flex gap-1 p-1 text-sm ${TRAY}`}>
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          aria-pressed={tab === id}
          className={`flex-1 whitespace-nowrap rounded-lg px-2 py-1 transition ${
            tab === id ? 'bg-sky-600 font-medium text-white' : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

/** the story is over: back to the stories menu. Does NOT cancel the
 *  narration — the last line may finish over the menu. */
export const backToMenu = () => usePageStore.getState().storiesHome()

/** ← in the canvas's top-left corner: back to the stories menu (the story
 *  resets — stories never wait in the background) */
export function BackToStories() {
  const storiesHome = usePageStore((s) => s.storiesHome)
  return (
    <button
      type="button"
      onClick={() => {
        cancelNarration() // navigating is a deliberate interruption
        storiesHome()
      }}
      aria-label="Back to all stories"
      title="Back to all stories"
      className={`absolute left-2 top-2 z-10 grid h-9 w-9 place-items-center text-lg leading-none text-slate-100 ${KEY}`}
    >
      ←
    </button>
  )
}

/** 📊 live counts over the canvas's top-right corner — kid-facing numbers
 *  stay in sight whatever tab the right column shows */
export function LiveOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-10 w-60 rounded-xl border border-amber-500/50 bg-slate-950/85 px-3 py-2 text-sm text-slate-300 shadow-lg shadow-black/40">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-200">
        <span aria-hidden className="text-sm normal-case">📊</span>
        Live counts
      </div>
      {children}
    </div>
  )
}
