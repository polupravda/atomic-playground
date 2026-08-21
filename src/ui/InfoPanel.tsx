import { useViewStore, type AtomView } from '../state/viewStore'

// The F01 model-explanation layer: a static, scrollable block beside the
// canvas. The top section follows what's currently on the stage; the tips
// below are always available. Terms are used, but one at a time.

const VIEW_EXPLANATIONS: Record<AtomView | 'morph-cloud' | 'morph-shells', {
  title: string
  paragraphs: string[]
}> = {
  shells: {
    title: 'Shell view',
    paragraphs: [
      'The rings are energy levels, called shells. Each shell has room for a set number of electrons: 2, then 8, then 18…',
      "Electrons don't really ride on rails — the rings are a simple way to count and sort them. Protons and neutrons really do cluster in the nucleus, though!",
    ],
  },
  cloud: {
    title: 'Cloud view',
    paragraphs: [
      'This soft glow is the electron cloud. Brighter spots are where an electron is easiest to find.',
      "It's a map of chances — not a real fog! The cloud has no sharp edge, and it's the picture physicists actually use.",
    ],
  },
  orbitals: {
    title: 'Orbitals view',
    paragraphs: [
      'Each color is one orbital group — a region where electrons are most likely to be. A round one is an s orbital; the lobed ones are p (and d, f) orbitals.',
      'The bright ball in the very middle is NOT the nucleus — it is the innermost orbital (1s). Electron probability really is highest right around the nucleus.',
      'The nucleus here is drawn at TRUE scale: about 10,000× smaller than the atom. Scroll to zoom in (thousands of times!) and find it — a glowing, wobbling cluster of protons and neutrons. They jiggle because nucleons are never still. An atom is almost entirely empty space.',
      'Zoom all the way in and look inside a proton or neutron: three tiny sparks — quarks! Two warm + one cool makes a proton; one warm + two cool makes a neutron. (The colors are just labels.)',
      'Orbitals overlap a lot, just like in a real atom — use the 👁 buttons to look at one at a time.',
      "We draw flat slices of 3D shapes, so some lobes that point out of the screen can't be shown.",
    ],
  },
  'morph-cloud': {
    title: 'Turning into a cloud…',
    paragraphs: [
      'Watch! The electrons zoom around so fast that their paths blur into a cloud.',
      'Same electrons — just a new way to see them.',
    ],
  },
  'morph-shells': {
    title: 'Back to shells…',
    paragraphs: [
      'The cloud gathers into neat shells. It was the same atom all along.',
    ],
  },
}

const TIPS = [
  'Drag particles from the buckets into the circle — and drag them back out to remove them.',
  'Type a number to build big atoms instantly: 79 protons makes gold!',
  'Protons choose the element, neutrons choose the isotope, electrons choose the charge.',
]

export function InfoPanel() {
  const view = useViewStore((s) => s.view)
  const transition = useViewStore((s) => s.transition)
  const key = transition
    ? (`morph-${transition.to}` as 'morph-cloud' | 'morph-shells')
    : view
  const section = VIEW_EXPLANATIONS[key]

  return (
    <aside className="min-h-0 w-64 flex-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-sm leading-relaxed text-slate-300">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        What am I seeing?
      </h2>
      <h3 className="mb-1 font-medium text-sky-300">{section.title}</h3>
      <div className="space-y-2">
        {section.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <h2 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Tips
      </h2>
      <ul className="list-disc space-y-1.5 pl-4 text-slate-400">
        {TIPS.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </aside>
  )
}
