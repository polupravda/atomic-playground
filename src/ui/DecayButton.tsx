import { useAtomStore } from '../state/atomStore'
import { useViewStore } from '../state/viewStore'
import { useDecayStore } from '../state/decayStore'
import { useEventStore, type EventStory } from '../state/eventStore'
import { decayMode, nuclideStability, type DecayMode } from '../core/nuclides'
import { elementForProtons } from '../core/elements'
import { isotopeLabel } from '../core/atom'
import { FLAT } from './surfaces'

/** Where the nucleus ends up after one decay of the given mode. */
function daughterOf(mode: DecayMode, p: number, n: number): { p: number; n: number } {
  switch (mode) {
    case 'alpha':
      return { p: p - 2, n: n - 2 }
    case 'beta-minus':
      return { p: p + 1, n: n - 1 }
    case 'proton':
      return { p: p - 1, n }
    case 'neutron':
      return { p, n: n - 1 }
    default: // β⁺, electron capture (fission isn't played)
      return { p: p - 1, n: n + 1 }
  }
}

/** The sticky "what just happened" narrative, written when the decay starts
 *  so the kid can read along while the animation plays — and long after. */
function decayStory(mode: DecayMode, protons: number, neutrons: number): EventStory {
  const daughter = daughterOf(mode, protons, neutrons)
  const parentName = elementForProtons(protons)?.name ?? 'The bare nucleus'
  const parentIso = isotopeLabel(protons, neutrons) ?? 'the free neutron'
  const daughterName = elementForProtons(daughter.p)?.name ?? 'nothing'
  const daughterIso = isotopeLabel(daughter.p, daughter.n) ?? '—'
  // Not every decay sends out γ (C-14 and tritium don't), but many do.
  const gamma = {
    icon: '🌟',
    text: 'Often, the new nucleus then sends out a γ photon to get rid of leftover energy — a flash of invisible light. A γ changes nothing about what the atom is.',
  }
  const sameMass = `Same mass number, one proton ${daughter.p > protons ? 'more' : 'fewer'}: ${parentName} became ${daughterName} (${daughterIso}).`
  switch (mode) {
    case 'alpha':
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
    case 'beta-minus':
      return {
        title: `β⁻ decay: ${parentIso} → ${daughterIso}`,
        paragraphs: [
          {
            icon: '☢️',
            text: `Inside ${parentIso}, one neutron transformed into a proton — and a fast electron (the β⁻ particle) shot out of the nucleus.`,
          },
          { icon: '⚛️', text: sameMass },
          gamma,
        ],
      }
    case 'electron-capture':
      return {
        title: `Electron capture: ${parentIso} → ${daughterIso}`,
        paragraphs: [
          {
            icon: '🧲',
            text: `The nucleus of ${parentIso} swallowed one of its OWN electrons, from the shell closest to it. That electron and a proton became a neutron.`,
          },
          {
            icon: '👻',
            text: 'Only a neutrino flew away — a ghostly particle that passes through whole planets. An outer electron drops down to fill the empty seat.',
          },
          { icon: '⚛️', text: sameMass },
        ],
      }
    case 'proton':
      return {
        title: `Proton emission: ${parentIso} → ${daughterIso}`,
        paragraphs: [
          {
            icon: '☢️',
            text: `${parentIso} has far too many protons for its neutrons — it can't even hold on to them. One proton simply fell out.`,
          },
          {
            icon: '⚛️',
            text: `One proton fewer changes the element: ${parentName} became ${daughterName} (${daughterIso}).`,
          },
        ],
      }
    case 'neutron':
      return {
        title: `Neutron emission: ${parentIso} → ${daughterIso}`,
        paragraphs: [
          {
            icon: '☢️',
            text: `${parentIso} has far too many neutrons — one simply fell out of the nucleus.`,
          },
          {
            icon: '⚛️',
            text: `Same element, lighter isotope: it is still ${daughterName}, now ${daughterIso}.`,
          },
        ],
      }
    default:
      return {
        title: `β⁺ decay: ${parentIso} → ${daughterIso}`,
        paragraphs: [
          {
            icon: '☢️',
            text: `Inside ${parentIso}, one proton transformed into a neutron — and a positron (the electron's antimatter twin, β⁺) shot out.`,
          },
          { icon: '⚛️', text: sameMass },
          gamma,
        ],
      }
  }
}

const HINTS: Record<DecayMode, string> = {
  alpha: 'α decay: the nucleus will throw out 2 protons + 2 neutrons.',
  'beta-minus': 'β⁻ decay: a neutron will turn into a proton and shoot out an electron.',
  'beta-plus':
    'β⁺ decay: a proton will turn into a neutron and shoot out a positron (an anti-electron!).',
  'electron-capture':
    'Electron capture: the nucleus will swallow one of its own electrons, turning a proton into a neutron.',
  proton: 'Proton emission: this nucleus is so overfull of protons that one will just fall out.',
  neutron: 'Neutron emission: this nucleus is so overfull of neutrons that one will just fall out.',
  fission:
    'This nucleus splits in two all by itself (spontaneous fission) — too big a mess to show here.',
}

/** A07: appears whenever the nucleus is radioactive, and plays its main
 *  measured decay mode (from the chart of nuclides). */
export function DecayButton() {
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const electrons = useAtomStore((s) => s.electrons)
  const view = useViewStore((s) => s.view)
  const morphing = useViewStore((s) => s.transition) !== null
  const active = useDecayStore((s) => s.active)
  const start = useDecayStore((s) => s.start)
  const setStory = useEventStore((s) => s.setStory)

  const info = nuclideStability(protons, neutrons)
  if (!info || info.stability !== 'unstable') return null

  const mode = decayMode(protons, neutrons)
  const inOrbitals = view === 'orbitals'
  // a real effect: a nucleus stripped of all its electrons can't decay by
  // capture — fully ionized Be-7 lives forever
  const nothingToCapture = mode === 'electron-capture' && electrons === 0
  const disabled =
    active !== null || !mode || mode === 'fission' || nothingToCapture || inOrbitals || morphing

  return (
    <div className={`w-64 p-3 ${FLAT}`}>
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
            ? 'Switch to the Shells view to watch.'
            : nothingToCapture
              ? 'This nucleus decays by swallowing one of its own electrons — but it has none! Add an electron and it can decay.'
              : mode
                ? HINTS[mode]
                : ''}
      </p>
    </div>
  )
}
