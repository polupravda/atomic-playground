import { useAtomStore } from '../state/atomStore'
import { useViewStore, type AtomView } from '../state/viewStore'
import { elementForProtons } from '../core/elements'
import { charge, chargeLabel, isotopeLabel } from '../core/atom'
import { nuclideStability } from '../core/nuclides'
import { useEventStore } from '../state/eventStore'
import { FLAT } from './surfaces'

// The F01 explanation layer: a live "tip giver" beside the canvas that
// describes whatever is currently going on. Every paragraph carries an icon
// that matches the corresponding on-canvas label (⚡ charge, ☢️ radioactive,
// ⚖️ mass...), so kids can connect the two at a glance.

interface IconPara {
  icon: string
  text: string
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** Describes the current atom in plain words, one icon-led fact at a time. */
function situationParagraphs(p: number, n: number, e: number): IconPara[] {
  if (p + n + e === 0) {
    return [
      {
        icon: '✨',
        text: 'Nothing here yet — drag particles from the buckets into the circle to start building!',
      },
    ]
  }
  const element = elementForProtons(p)
  if (!element) {
    return [
      {
        icon: '❓',
        text: `No element yet: an atom needs at least one proton. So far there ${
          n + e === 1 ? 'is' : 'are'
        } ${plural(n, 'neutron')} and ${plural(e, 'electron')}.`,
      },
    ]
  }
  const parts: IconPara[] = []
  parts.push({
    icon: '⚛️',
    text: `This is ${element.name}: ${plural(p, 'proton')}, ${plural(
      n,
      'neutron',
    )} and ${plural(e, 'electron')}.`,
  })
  parts.push({
    icon: '⚖️',
    text: `Its mass number is ${p + n} (protons + neutrons) — that's the isotope ${isotopeLabel(p, n)}.`,
  })
  const q = charge(p, e)
  if (q === 0) {
    parts.push({
      icon: '⚡',
      text: 'The charge is 0: protons and electrons balance out, so it neither pulls nor pushes other charges.',
    })
  } else if (q > 0) {
    parts.push({
      icon: '⚡',
      text: `The charge is +${q}: ${q === 1 ? 'one more proton' : `${q} more protons`} than electrons. That makes it a positive ion (${element.symbol}${chargeLabel(p, e)}) — it pulls on electrons and would happily grab a spare one! The red ring shining around the atom is its charge.`,
    })
  } else {
    parts.push({
      icon: '⚡',
      text: `The charge is −${-q}: ${-q === 1 ? 'one extra electron' : `${-q} extra electrons`}. That makes it a negative ion (${element.symbol}${chargeLabel(p, e)}) — it pushes other electrons away and sticks to positive things. The blue ring shining around the atom is its charge.`,
    })
  }
  const nucleus = nuclideStability(p, n)
  if (nucleus) {
    parts.push(
      nucleus.stability === 'stable'
        ? {
            icon: '✅',
            text: 'The nucleus is stable — left alone, it would stay like this forever.',
          }
        : {
            icon: '☢️',
            text: 'The nucleus is radioactive — watch the little rays escaping! One day it will transform.',
          },
    )
    if (nucleus.stability === 'stable' && q === 0 && e > 0) {
      parts.push({
        icon: '🌟',
        text: 'A complete, peaceful atom — balanced and stable. This is how most atoms around you live. Beautiful work!',
      })
    }
  }
  return parts
}

const VIEW_EXPLANATIONS: Record<
  AtomView | 'morph-orbitals' | 'morph-shells',
  { title: string; icon: string; paragraphs: IconPara[] }
> = {
  shells: {
    title: 'Shell view',
    icon: '🎯',
    paragraphs: [
      {
        icon: '🎯',
        text: 'The rings are energy levels, called shells. Each shell has room for a set number of electrons: 2, then 8, then 18…',
      },
      {
        icon: '💡',
        text: "This is a counting picture. Electrons don't really ride on rings — the rings just sort them by energy. Protons and neutrons really do cluster in the nucleus, though!",
      },
      {
        icon: '🌈',
        text: 'Want to see where electrons might really be? Switch to Orbitals and watch each shell split up.',
      },
      {
        icon: '🧲',
        text: 'Drag an electron around and watch the amber arrow: the nucleus pulls it electromagnetically — hard when close, gently when far.',
      },
    ],
  },
  orbitals: {
    title: 'Orbitals view',
    icon: '🌈',
    paragraphs: [
      {
        icon: '🌈',
        text: 'Each color is one orbital group — a region where electrons are most likely to be. A round one is an s orbital; the lobed ones are p (and d, f) orbitals.',
      },
      {
        icon: '🎲',
        text: "It's a map of chances, not a real fog: brighter means an electron is more likely there. Orbitals have no sharp edge — this is the picture physicists actually use.",
      },
      {
        icon: '💡',
        text: 'The bright ball in the very middle is NOT the nucleus — it is the innermost orbital (1s). Electron probability really is highest right around the nucleus.',
      },
      {
        icon: '🔍',
        text: 'The nucleus here is drawn at TRUE scale: about 10,000× smaller than the atom. Scroll to zoom in (thousands of times!) and find it — a glowing, wobbling cluster of protons and neutrons. An atom is almost entirely empty space.',
      },
      {
        icon: '✨',
        text: 'Zoom all the way in and look inside a proton or neutron: three tiny sparks — quarks! Two warm + one cool makes a proton; one warm + two cool makes a neutron. (The colors are just labels.)',
      },
      {
        icon: '👁',
        text: 'Orbitals overlap a lot, just like in a real atom — use the 👁 buttons to look at one at a time.',
      },
      {
        icon: '✂️',
        text: "We draw flat slices of 3D shapes, so some lobes that point out of the screen can't be shown.",
      },
    ],
  },
  'morph-orbitals': {
    title: 'From shells to orbitals…',
    icon: '🎬',
    paragraphs: [
      {
        icon: '🎨',
        text: 'Each shell splits into orbitals: shell 2 is a 2s and a 2p orbital. The colors match the orbitals you are about to see.',
      },
      {
        icon: '🔍',
        text: 'The nucleus shrinks to its true size — far too tiny to see from here.',
      },
      {
        icon: '📸',
        text: 'Then each electron is gone from its ring. The specks show places we might find it if we looked. Between looks it has no path at all.',
      },
      {
        icon: '⚛️',
        text: 'Two different pictures: shells COUNT electrons by energy, orbitals show WHERE they might be.',
      },
    ],
  },
  'morph-shells': {
    title: 'Back to shells…',
    icon: '🎬',
    paragraphs: [
      {
        icon: '🎯',
        text: "The same electrons, counted again on simple rings. Each orbital's electrons go back to their shell.",
      },
      {
        icon: '💡',
        text: 'Shells are easier for counting and sorting; orbitals are closer to how an atom really is.',
      },
    ],
  },
}

const WATCHING_EXPLANATION = {
  title: 'Watching an electron',
  icon: '📸',
  paragraphs: [
    {
      icon: '📸',
      text: 'Flash! Each flash shows where we would find the electron if we looked. Between flashes it has NO path — that is the strange truth of quantum physics.',
    },
    {
      icon: '🎨',
      text: 'Watch the flecks pile up: many looks together paint the orbital. Notice the flashes never land where the orbital is dark.',
    },
    {
      icon: '🐢',
      text: 'This is extreme slow motion — a real electron would give about 10,000,000,000,000,000 looks every second!',
    },
  ],
}

const TIPS: IconPara[] = [
  {
    icon: '👆',
    text: 'Drag particles from the buckets into the circle — and drag them back out to remove them.',
  },
  {
    icon: '⌨️',
    text: 'Type a number to build big atoms instantly: 79 protons makes gold!',
  },
  {
    icon: '🧬',
    text: 'Protons choose the element, neutrons choose the isotope, electrons choose the charge.',
  },
  {
    icon: '⚡',
    text: 'Charge and radioactivity are different things: electrons make ions, but only the nucleus decides stable or radioactive.',
  },
]

// Styling matches the charge playground's info block (the house style for
// info panels): p-3 container, text-xs uppercase headers with border-t
// separators, text-sm body.
function Para({ icon, text }: IconPara) {
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden className="shrink-0 leading-snug">
        {icon}
      </span>
      <p>{text}</p>
    </div>
  )
}

export function InfoPanel() {
  const protons = useAtomStore((s) => s.protons)
  const neutrons = useAtomStore((s) => s.neutrons)
  const electrons = useAtomStore((s) => s.electrons)
  const view = useViewStore((s) => s.view)
  const transition = useViewStore((s) => s.transition)
  const watching = useViewStore((s) => s.watching)
  const key = transition
    ? (`morph-${transition.to}` as 'morph-orbitals' | 'morph-shells')
    : view
  const viewSection =
    key === 'orbitals' && watching ? WATCHING_EXPLANATION : VIEW_EXPLANATIONS[key]
  const situation = situationParagraphs(protons, neutrons, electrons)
  // Sticky event story: stays until the next event or a manual atom edit —
  // slow readers keep it as long as they need.
  const story = useEventStore((s) => s.story)

  return (
    <aside className={`h-full w-64 overflow-y-auto p-3 text-sm leading-relaxed text-slate-300 ${FLAT}`}>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Right now
      </h2>
      <div className="space-y-2 text-slate-200">
        {situation.map((p, i) => (
          <Para key={i} {...p} />
        ))}
      </div>
      {story && (
        <>
          <h2 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            What just happened
          </h2>
          <h3 className="mb-1.5 text-sm font-medium text-amber-300">{story.title}</h3>
          <div className="space-y-2">
            {story.paragraphs.map((p, i) => (
              <Para key={i} {...p} />
            ))}
          </div>
        </>
      )}
      <h2 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        What am I seeing?
      </h2>
      <h3 className="mb-1.5 text-sm font-medium text-sky-300">
        {viewSection.icon} {viewSection.title}
      </h3>
      <div className="space-y-2">
        {viewSection.paragraphs.map((p, i) => (
          <Para key={i} {...p} />
        ))}
      </div>
      <h2 className="mb-2 mt-4 border-t border-slate-700 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Tips
      </h2>
      <div className="space-y-2 text-slate-400">
        {TIPS.map((tip, i) => (
          <Para key={i} {...tip} />
        ))}
      </div>
    </aside>
  )
}
