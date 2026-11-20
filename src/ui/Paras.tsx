import { useState, type ReactNode } from 'react'

// Shared info-panel building blocks of the "Atoms in action" examples
// (extracted from ExamplesPage in step 34 so every example uses one look).
// Info panels are for ADULTS and must scan at a glance: a typed section
// header (SECTION_TYPES icon), then one short sentence per item with its
// key phrase in <b> — read the bold words alone and you have it. A
// section shows at most SECTION_MAX items; the rest wait behind "＋ more".

/** `focus` = what is happening on the canvas RIGHT NOW: drawn in the amber
 *  caption style (amber border, dark fill) that captions used to have on
 *  the canvas itself. */
export type Para = { icon: string; text: ReactNode; focus?: boolean }

/** an info item that opens with its bold key phrase: para('🐢', 'Slow
 *  motion:', ' the real thing is a billion times faster.') */
export const para = (icon: string, key: ReactNode, rest: ReactNode = ''): Para => ({
  icon,
  text: (
    <>
      <b>{key}</b>
      {rest}
    </>
  ),
})

/** a section's items shown before "＋ more" (the most important first) */
export const SECTION_MAX = 3

export function Paras({
  items,
  className = '',
  max,
}: {
  items: Para[]
  className?: string
  /** show only the first `max` items, the rest behind a "＋ N more" toggle */
  max?: number
}) {
  const [open, setOpen] = useState(false)
  const hidden = max !== undefined && !open ? Math.max(0, items.length - max) : 0
  const shown = hidden ? items.slice(0, max) : items
  return (
    // bold key phrases stand out: scanning the bold words alone works
    <div className={`space-y-2 [&_b]:font-semibold [&_b]:text-slate-100 ${className}`}>
      {shown.map((p, i) => (
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
      {max !== undefined && items.length > max && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md px-1.5 py-0.5 text-xs text-sky-300 transition hover:bg-slate-700/60 hover:text-sky-200"
        >
          {open ? '− fewer' : `＋ ${hidden} more`}
        </button>
      )}
    </div>
  )
}

/**
 * The info panel's CONTENT TYPES — one small icon vocabulary app-wide, so
 * an adult can scan a panel by its icons alone (Elena, 2026-11-20). Every
 * section header names its type; `children` may override the
 * label (e.g. "Three ways to build one" is a ⚙️ how-it-works section).
 */
export const SECTION_TYPES = {
  /** the mechanism: what really happens */
  how: { icon: '⚙️', label: 'How it works' },
  /** what the picture simplifies, slows down or draws off-scale */
  honest: { icon: '⚖️', label: 'Honest notes' },
  /** history: real people, places and dates */
  true: { icon: '📜', label: 'A true story' },
  /** what the marks, dots and colors on the canvas stand for */
  legend: { icon: '🎨', label: 'What the dots mean' },
  /** numbers that change while the story runs */
  live: { icon: '📊', label: 'Live counts' },
  /** reference facts and data tables */
  facts: { icon: '🗂️', label: 'Facts' },
  /** the live state of what the kid built (playgrounds) */
  now: { icon: '📍', label: 'Right now' },
  /** the last event (a decay…), sticky until the next edit */
  event: { icon: '💬', label: 'What just happened' },
  /** what the current view / mode shows */
  seeing: { icon: '👀', label: 'What am I seeing?' },
  /** how to use the page — the only home for coaching */
  tips: { icon: '💡', label: 'Tips' },
} as const

export type SectionType = keyof typeof SECTION_TYPES

export function SectionHeader({
  children,
  first = false,
  type,
}: {
  children?: ReactNode
  first?: boolean
  /** the content type: shows its icon, and its label unless `children` */
  type?: SectionType
}) {
  const t = type ? SECTION_TYPES[type] : null
  return (
    <h3
      className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 ${
        first ? '' : 'mt-4 border-t border-slate-700 pt-3'
      }`}
    >
      {t && (
        <span aria-hidden className="text-sm normal-case">
          {t.icon}
        </span>
      )}
      <span>{children ?? t?.label}</span>
    </h3>
  )
}
