import { useAtomStore } from '../state/atomStore'
import { useViewStore, type AtomView } from '../state/viewStore'
import { elementForProtons } from '../core/elements'
import { charge, chargeLabel, isotopeLabel } from '../core/atom'
import { nuclideStability } from '../core/nuclides'
import { useEventStore } from '../state/eventStore'

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
  AtomView | 'morph-cloud' | 'morph-shells',
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
        text: "Electrons don't really ride on rails — the rings are a simple way to count and sort them. Protons and neutrons really do cluster in the nucleus, though!",
      },
      {
        icon: '🧲',
        text: 'Drag an electron around and watch the amber arrow: the nucleus pulls it electromagnetically — hard when close, gently when far.',
      },
    ],
  },
  cloud: {
    title: 'Cloud view',
    icon: '☁️',
    paragraphs: [
      {
        icon: '☁️',
        text: 'This soft glow is the electron cloud. Brighter spots are where an electron is easiest to find.',
      },
      {
        icon: '🎲',
        text: "It's a map of chances — not a real fog! The cloud has no sharp edge, and it's the picture physicists actually use.",
      },
      {
        icon: '🧩',
        text: "The cloud is what you get when you add all the orbitals together — the whole atom's electron blur. (The Orbitals view shows the separate parts.)",
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
  'morph-cloud': {
    title: 'Turning into a cloud…',
    icon: '🎬',
    paragraphs: [
      {
        icon: '💨',
        text: 'Watch! The electrons zoom around so fast that their paths blur into a cloud.',
      },
      { icon: '⚛️', text: 'Same electrons — just a new way to see them.' },
    ],
  },
  'morph-shells': {
    title: 'Back to shells…',
    icon: '🎬',
    paragraphs: [
      {
        icon: '🎯',
        text: 'The cloud gathers into neat shells. It was the same atom all along.',
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
    ? (`morph-${transition.to}` as 'morph-cloud' | 'morph-shells')
    : view
  const viewSection =
    key === 'orbitals' && watching ? WATCHING_EXPLANATION : VIEW_EXPLANATIONS[key]
  const situation = situationParagraphs(protons, neutrons, electrons)
  // Sticky event story: stays until the next event or a manual atom edit —
  // slow readers keep it as long as they need.
  const story = useEventStore((s) => s.story)

  return (
    <aside className="h-full w-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/40 p-3 text-sm leading-relaxed text-slate-300">
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
