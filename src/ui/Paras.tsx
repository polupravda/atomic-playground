import type { ReactNode } from 'react'

// Shared info-panel building blocks of the "Atoms in action" examples
// (extracted from ExamplesPage in step 34 so every example uses one look).

/** `focus` = what is happening on the canvas RIGHT NOW: drawn in the amber
 *  caption style (amber border, dark fill) that captions used to have on
 *  the canvas itself. */
export type Para = { icon: string; text: ReactNode; focus?: boolean }

export function Paras({ items, className = '' }: { items: Para[]; className?: string }) {
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

export function SectionHeader({ children, first = false }: { children: ReactNode; first?: boolean }) {
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
