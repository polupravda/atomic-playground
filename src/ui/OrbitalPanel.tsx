import { useEffect } from 'react'
import { useAtomStore } from '../state/atomStore'
import {
  MAX_ORBITAL_ZOOM,
  MIN_ORBITAL_ZOOM,
  useViewStore,
} from '../state/viewStore'
import { subshellConfiguration, subshellLabel } from '../core/atom'
import { subshellColor } from '../stage/orbitalPalette'

/** Legend + controls for the orbitals view: one row per occupied subshell
 *  (color chip, name, electron count, show/hide) and zoom controls. */
export function OrbitalPanel() {
  const view = useViewStore((s) => s.view)
  const zoom = useViewStore((s) => s.orbitalZoom)
  const setZoom = useViewStore((s) => s.setOrbitalZoom)
  const hidden = useViewStore((s) => s.hiddenSubshells)
  const toggleSubshell = useViewStore((s) => s.toggleSubshell)
  const watching = useViewStore((s) => s.watching)
  const setWatching = useViewStore((s) => s.setWatching)
  const watchFast = useViewStore((s) => s.watchFast)
  const toggleWatchFast = useViewStore((s) => s.toggleWatchFast)
  const electrons = useAtomStore((s) => s.electrons)

  const subshells = subshellConfiguration(electrons)

  // Stop watching if the watched subshell no longer exists.
  const watchedExists = subshells.some(
    (sub) => subshellLabel(sub.n, sub.l) === watching,
  )
  useEffect(() => {
    if (watching && !watchedExists) setWatching(null)
  }, [watching, watchedExists, setWatching])

  if (view !== 'orbitals') return null

  return (
    <div className="w-64 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">Orbitals</span>
        <span className="flex items-center gap-1">
          <span className="mr-1 font-mono text-xs text-slate-400">
            ×{zoom >= 100 ? Math.round(zoom).toLocaleString('en-US') : zoom.toFixed(1)}
          </span>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom(zoom / 2)}
            disabled={zoom <= MIN_ORBITAL_ZOOM}
            className="h-6 w-6 rounded-md bg-slate-700 font-mono text-slate-100 transition hover:bg-slate-600 disabled:opacity-30"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom(zoom * 2)}
            disabled={zoom >= MAX_ORBITAL_ZOOM}
            className="h-6 w-6 rounded-md bg-slate-700 font-mono text-slate-100 transition hover:bg-slate-600 disabled:opacity-30"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="h-6 rounded-md bg-slate-700 px-1.5 text-xs text-slate-200 transition hover:bg-slate-600"
          >
            fit
          </button>
        </span>
      </div>
      {subshells.length === 0 ? (
        <p className="text-xs text-slate-500">Add electrons to see orbitals.</p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto pr-1 text-sm">
          {subshells.map((sub, i) => {
            const label = subshellLabel(sub.n, sub.l)
            const isHidden = hidden.includes(label)
            const isWatched = watching === label
            return (
              <li
                key={label}
                className={`flex items-center gap-2 rounded px-1 ${
                  isWatched ? 'bg-slate-700/60 ring-1 ring-sky-700' : ''
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: subshellColor(i, 1) }}
                />
                <span className="w-8 font-mono text-slate-200">{label}</span>
                <span className="flex-1 text-xs text-slate-400">
                  {sub.electrons} e⁻
                </span>
                <button
                  type="button"
                  onClick={() => setWatching(isWatched ? null : label)}
                  aria-label={`${isWatched ? 'Stop watching' : 'Watch'} an electron in ${label}`}
                  title="Watch an electron: each flash is one look"
                  className={`rounded px-1 text-xs transition ${
                    isWatched ? 'opacity-100' : 'opacity-50 hover:opacity-90'
                  }`}
                >
                  📸
                </button>
                <button
                  type="button"
                  onClick={() => toggleSubshell(label)}
                  aria-label={`${isHidden ? 'Show' : 'Hide'} ${label}`}
                  className={`rounded px-1.5 text-xs transition ${
                    isHidden
                      ? 'text-slate-600 hover:text-slate-400'
                      : 'text-sky-400 hover:text-sky-300'
                  }`}
                >
                  {isHidden ? '🚫' : '👁'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {watching && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-700 pt-2 text-xs">
          <button
            type="button"
            onClick={toggleWatchFast}
            className="rounded-md bg-slate-700 px-2 py-1 text-slate-200 transition hover:bg-slate-600"
          >
            {watchFast ? '🐢 slower' : '⚡ faster'}
          </button>
          <button
            type="button"
            onClick={() => setWatching(null)}
            className="rounded-md bg-slate-700 px-2 py-1 text-slate-200 transition hover:bg-slate-600"
          >
            stop watching
          </button>
        </div>
      )}
    </div>
  )
}
