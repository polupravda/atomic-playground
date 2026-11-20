// "Press or read?" — option A, Raised vs flat (Elena, 2026-11-19; strategy
// artifact https://claude.ai/artifact/6zEhrSLr9Kr7j6TetmipCG). ONE rule
// for every page: things you can press stand up from the page like keys;
// things you read lie flat on it. No new colors: sky blue still means only
// "your current choice", amber only "look here, happening now", and the
// chooser's ▶ Watch it stays the one solid call to action.

/** a pressable button: lit top edge, a short shadow under it, a 1 px lift
 *  on hover and a 1 px press — visible at rest, so it works on a tablet */
export const KEY =
  'rounded-xl border border-slate-600/80 border-t-slate-500 bg-gradient-to-b from-slate-700/90 to-slate-800 ' +
  'shadow-[0_2px_0_#070d1b,0_6px_14px_-8px_rgba(0,0,0,0.8)] transition ' +
  'hover:-translate-y-px hover:from-slate-600/90 hover:shadow-[0_3px_0_#070d1b,0_10px_18px_-8px_rgba(0,0,0,0.85)] ' +
  'active:translate-y-px active:shadow-[0_1px_0_#070d1b] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ' +
  'disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none'

/** a small pressable chip (lamp colors, quick jumps): the same key, smaller */
export const CHIP_KEY =
  'rounded-full border border-slate-600/80 border-t-slate-500 bg-gradient-to-b from-slate-700/90 to-slate-800 ' +
  'shadow-[0_1px_0_#070d1b] transition hover:-translate-y-px hover:from-slate-600/90 active:translate-y-px active:shadow-none'

/** a panel you read (info, readouts, photos) or a control's home card:
 *  flat — no border, no shadow, only a faint fill */
export const FLAT = 'rounded-xl bg-slate-800/40'

/** a sunken tray holding a set of choices (tabs, view toggles, languages):
 *  the chosen one is the sky-blue fill inside it */
export const TRAY = 'rounded-xl bg-slate-950/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]'
