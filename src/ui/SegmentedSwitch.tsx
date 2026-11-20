import { TRAY } from './surfaces'

// The app's ONE way to pick one of a few things (Elena, 2026-11-20): a
// sunken tray with the choices side by side and the current one filled
// sky blue — the look of the atom builder's Shells · Cloud · Orbitals
// switch (ViewToggle). No headline above it: the options say what they
// are ("✏️ Graphite · 💎 Diamond", not a card titled "On the table").
// More options than fit in a row wrap into a grid (`columns`).

export interface SegmentOption<T extends string> {
  id: T
  label: string
  /** hover text, when the label alone is short */
  title?: string
  /** a color dot before the label (lamp colors: kids read the dot first) */
  dot?: string
}

export function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
  columns = options.length,
  ariaLabel,
  className = 'w-64',
}: {
  options: Array<SegmentOption<T>>
  value: T
  onChange: (v: T) => void
  /** choices per row (default: all in one row) */
  columns?: number
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid gap-1 p-1 text-sm ${TRAY} ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          title={o.title}
          onClick={() => onChange(o.id)}
          className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-1.5 py-1.5 transition ${
            value === o.id ? 'bg-sky-600 font-medium text-white' : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          {o.dot && (
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/40"
              style={{ background: o.dot }}
            />
          )}
          <span className="truncate">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
