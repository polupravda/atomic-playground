import { create } from 'zustand'

// The atom has three representations: shell rings (schematic), the
// probability cloud, and the orbitals view (closest to true proportions).
// Shells⇄cloud switches run the A13/A14 morph animation; switches involving
// the orbitals view are instant.
export type AtomView = 'shells' | 'cloud' | 'orbitals'

// Deep zoom: the orbitals view draws the nucleus at TRUE scale (~1/10,000
// of the atom), so it only becomes visible around ×40 and is a clear ball in
// the thousands — finding it is the point.
export const MIN_ORBITAL_ZOOM = 0.5
export const MAX_ORBITAL_ZOOM = 20000

interface ViewState {
  view: AtomView
  transition: { from: AtomView; to: AtomView } | null
  /** Orbitals view: zoom factor (wheel / buttons) and per-subshell
   *  visibility — orbitals overlap heavily, just like in a real atom, so
   *  each can be hidden by its label (e.g. '2p'). */
  orbitalZoom: number
  hiddenSubshells: string[]
  /** "Watch an electron" (flashbulb mode): the label of the subshell being
   *  watched, or null. Each flash is one position measurement sampled from
   *  the orbital's probability density — there is no path between flashes. */
  watching: string | null
  watchFast: boolean
  requestView: (view: AtomView) => void
  completeTransition: () => void
  setOrbitalZoom: (zoom: number) => void
  toggleSubshell: (label: string) => void
  setWatching: (label: string | null) => void
  toggleWatchFast: () => void
}

export const useViewStore = create<ViewState>((set) => ({
  view: 'shells',
  transition: null,
  orbitalZoom: 1,
  hiddenSubshells: [],
  watching: null,
  watchFast: false,
  requestView: (target) =>
    set((s) => {
      if (s.transition || target === s.view) return s
      if (target === 'orbitals' || s.view === 'orbitals') {
        return { view: target, transition: null, watching: null, watchFast: false }
      }
      return { transition: { from: s.view, to: target } }
    }),
  completeTransition: () =>
    set((s) => (s.transition ? { view: s.transition.to, transition: null } : s)),
  setOrbitalZoom: (zoom) =>
    set({
      orbitalZoom: Math.min(MAX_ORBITAL_ZOOM, Math.max(MIN_ORBITAL_ZOOM, zoom)),
    }),
  toggleSubshell: (label) =>
    set((s) => ({
      hiddenSubshells: s.hiddenSubshells.includes(label)
        ? s.hiddenSubshells.filter((l) => l !== label)
        : [...s.hiddenSubshells, label],
    })),
  setWatching: (label) => set({ watching: label, watchFast: false }),
  toggleWatchFast: () => set((s) => ({ watchFast: !s.watchFast })),
}))
