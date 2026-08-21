import { useAtomStore } from '../state/atomStore'
import { useViewStore } from '../state/viewStore'
import { useDecayStore } from '../state/decayStore'
import { useEventStore, type EventStory } from '../state/eventStore'
import { decayMode, nuclideStability, type DecayMode } from '../core/nuclides'
import { elementForProtons } from '../core/elements'
import { isotopeLabel } from '../core/atom'

/** The sticky "what just happened" narrative, written when the decay starts
 *  so the kid can read along while the animation plays — and long after. */
function decayStory(mode: DecayMode, protons: number, neutrons: number): EventStory {
  const daughter =
    mode === 'alpha'
      ? { p: protons - 2, n: neutrons - 2 }
      : mode === 'beta-minus'
        ? { p: protons + 1, n: neutrons - 1 }
        : { p: protons - 1, n: neutrons + 1 }
  const parentName = elementForProtons(protons)?.name ?? 'The bare nucleus'
  const parentIso = isotopeLabel(protons, neutrons) ?? 'the free neutron'
  const daughterName = elementForProtons(daughter.p)?.name ?? 'nothing'
  const daughterIso = isotopeLabel(daughter.p, daughter.n) ?? '—'
  const gamma = {
    icon: '🌟',
    text: 'At the end, a γ photon carried away leftover energy — a flash of invisible light. The γ changed nothing about what the atom is.',
  }
  if (mode === 'alpha') {
    return {
      title: `α decay: ${parentIso} → ${daughterIso}`,
      paragraphs: [
        {
          icon: '☢️',
          text: `${parentIso} threw a whole piece of its nucleus out: 2 protons + 2 neutrons together — that little cluster is a helium nucleus!`,
        },
        {
          icon: '⚛️',
          text: `Losing 2 protons changed the element: ${parentName} became ${daughterName} (${daughterIso}).`,
        },
        gamma,
      ],
    }
  }
  if (mode === 'beta-minus') {
    return {
      title: `β⁻ decay: ${parentIso} → ${daughterIso}`,
      paragraphs: [
        {
          icon: '☢️',
          text: `Inside ${parentIso}, one neutron transformed into a proton — and a fast electron (the β⁻ particle) shot out of the nucleus.`,
        },
        {
          icon: '⚛️',
          text: `Same mass number, one more proton: ${parentName} became ${daughterName} (${daughterIso}).`,
        },
        gamma,
      ],
    }
  }
  return {
    title: `β⁺ decay: ${parentIso} → ${daughterIso}`,
    paragraphs: [
      {
        icon: '☢️',
        text: `Inside ${parentIso}, one proton transformed into a neutron — and a positron (the electron's antimatter twin, β⁺) shot out.`,
      },
      {
        icon: '⚛️',
        text: `Same mass number, one proton fewer: ${parentName} became ${daughterName} (${daughterIso}).`,
      },
      gamma,
    ],
  }
}

/** A07: appears whenever the nucleus is radioactive. For α-decaying
 *  nuclides it plays the decay; β modes arrive in the next step. */
export function DecayButton() {
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const view = useViewStore((s) => s.view)
  const active = useDecayStore((s) => s.active)
  const start = useDecayStore((s) => s.start)
  const setStory = useEventStore((s) => s.setStory)

  const info = nuclideStability(protons, neutrons)
  if (!info || info.stability !== 'unstable') return null

  const mode = decayMode(protons, neutrons)
  const inOrbitals = view === 'orbitals'
  const disabled = active !== null || !mode || inOrbitals

  return (
    <div className="w-64 rounded-xl border border-amber-500/30 bg-slate-800/60 p-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!mode) return
          setStory(decayStory(mode, protons, neutrons))
          start(mode)
        }}
        className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600"
      >
        ☢ Watch decay
      </button>
      <p className="mt-1.5 text-xs text-slate-400">
        {active
          ? 'decaying…'
          : inOrbitals
            ? 'Switch to Shells or Cloud view to watch.'
            : mode === 'alpha'
              ? 'α decay: the nucleus will throw out 2 protons + 2 neutrons.'
              : mode === 'beta-minus'
                ? 'β⁻ decay: a neutron will turn into a proton and shoot out an electron.'
                : 'β⁺ decay: a proton will turn into a neutron and shoot out a positron (an anti-electron!).'}
      </p>
    </div>
  )
}
