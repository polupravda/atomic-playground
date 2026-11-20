import { useAtomStore } from '../state/atomStore'
import { useViewStore, type AtomView } from '../state/viewStore'
import { elementForProtons } from '../core/elements'
import { charge } from '../core/atom'
import { nuclideStability } from '../core/nuclides'
import { useEventStore } from '../state/eventStore'
import { FLAT } from './surfaces'
import { Paras, SECTION_MAX, SectionHeader, para, type Para } from './Paras'

// The F01 explanation layer: a live panel beside the canvas that describes
// whatever is currently going on. Every item carries an icon that matches
// the corresponding on-canvas label (⚡ charge, ☢️ radioactive, ⚖️ mass...),
// and opens with its key phrase in bold — an adult scans the bold words
// (03-architecture.md, "Info panel state rules"; the typed headers and
// item style are Paras.tsx's).

/** 📍 Right now: only what the atom's state MEANS — never the name,
 *  counts, mass number or charge already on the badge and the canvas
 *  (Elena, 2026-11-20: "ok thanks cap, I am not blind"). Empty = the
 *  section is not shown. */
function situationParagraphs(p: number, n: number, e: number): Para[] {
  if (p + n + e === 0) return []
  const element = elementForProtons(p)
  if (!element) return [para('❓', 'No element yet:', ' an atom needs at least one proton.')]
  const parts: Para[] = []
  const q = charge(p, e)
  if (q > 0) parts.push(para('⚡', 'More protons than electrons:', ' a passing electron would be caught (the red ring).'))
  else if (q < 0) parts.push(para('⚡', 'Extra electrons:', ' it pushes electrons away and sticks to positive things (the blue ring).'))
  const nucleus = nuclideStability(p, n)
  if (nucleus) {
    if (nucleus.stability !== 'stable')
      parts.push(para('☢️', 'One day it will transform:', ' the little rays escaping are the nucleus giving off energy.'))
    else if (q === 0 && e > 0)
      parts.push(para('🌟', 'Stable and balanced:', ' a complete atom, like most atoms around you — it stays like this forever.'))
    else parts.push(para('✅', 'Left alone,', ' the nucleus would stay like this forever.'))
  }
  return parts
}

const VIEW_EXPLANATIONS: Record<
  AtomView | 'morph-orbitals' | 'morph-shells',
  { title: string; icon: string; paragraphs: Para[] }
> = {
  shells: {
    title: 'Shell view',
    icon: '🎯',
    paragraphs: [
      para('🎯', 'Shells are energy levels:', ' each has room for a set number of electrons — 2, then 8, then 18…'),
      para('💡', 'A counting picture:', " electrons don't really ride on rings. The nucleus cluster is real, though."),
      para('🧲', 'The amber arrow is the pull', ' of the nucleus on an electron: hard when close, gentle when far.'),
    ],
  },
  orbitals: {
    title: 'Orbitals view',
    icon: '🌈',
    paragraphs: [
      para('🌈', 'Each color is an orbital:', ' where electrons are most likely to be. Round = s; lobed = p, d, f.'),
      para('🎲', 'A map of chances, not a fog:', ' brighter = more likely. No sharp edge — the picture physicists use.'),
      para('🔍', 'The nucleus is at TRUE scale:', ' about 10,000× smaller than the atom. An atom is almost all empty space.'),
      para('💡', 'The bright middle is NOT the nucleus:', ' it is the innermost orbital, 1s — probability peaks right around the nucleus.'),
      para('✨', 'Quarks inside:', ' two warm + one cool spark make a proton, one warm + two cool a neutron. Colors are just labels.'),
      para('✂️', 'Flat slices of 3D shapes:', " lobes pointing out of the screen can't be shown. Orbitals overlap, as in a real atom."),
    ],
  },
  'morph-orbitals': {
    title: 'From shells to orbitals…',
    icon: '🎬',
    paragraphs: [
      para('🎨', 'Each shell splits into orbitals:', ' shell 2 becomes a 2s and a 2p, in the colors you are about to see.'),
      para('🔍', 'The nucleus shrinks to its true size', ' — far too tiny to see from here.'),
      para('📸', 'Electrons leave their rings:', ' the specks are places a look might find one. Between looks, no path.'),
      para('⚛️', 'Two pictures:', ' shells COUNT electrons by energy; orbitals show WHERE they might be.'),
    ],
  },
  'morph-shells': {
    title: 'Back to shells…',
    icon: '🎬',
    paragraphs: [
      para('🎯', 'The same electrons, counted again:', " each orbital's electrons go back to their shell."),
      para('💡', 'Shells are easier for counting;', ' orbitals are closer to how an atom really is.'),
    ],
  },
}

const WATCHING_EXPLANATION = {
  title: 'Watching an electron',
  icon: '📸',
  paragraphs: [
    para('📸', 'Each flash is one look:', ' where we would find the electron. Between flashes it has NO path.'),
    para('🎨', 'Many looks paint the orbital:', ' the flashes never land where the orbital is dark.'),
    para('🐢', 'Extreme slow motion:', ' a real electron would give about 10,000,000,000,000,000 looks every second.'),
  ],
}

const HOW: Para[] = [
  para('🧬', 'Protons choose the element,', ' neutrons the isotope, electrons the charge.'),
  para('⚡', 'Charge ≠ radioactivity:', ' electrons make ions; only the nucleus decides stable or radioactive.'),
]

const TIPS: Para[] = [
  para('👆', 'Drag particles', ' from the buckets into the circle — and back out to remove them.'),
  para('⌨️', 'Type a number', ' to build big atoms instantly: 79 protons makes gold!'),
  para('🔍', 'Scroll to zoom', ' in the Orbitals view: find the nucleus, then the quarks inside it.'),
  para('👁', 'The 👁 buttons', ' show one orbital at a time.'),
]

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
      {situation.length > 0 && (
        <>
          <SectionHeader type="now" first />
          <Paras items={situation} className="text-slate-200" />
        </>
      )}
      {story && (
        <>
          <SectionHeader type="event" first={situation.length === 0} />
          <h4 className="mb-1.5 text-sm font-medium text-amber-300">{story.title}</h4>
          <Paras items={story.paragraphs} />
        </>
      )}
      <SectionHeader type="seeing" first={situation.length === 0 && !story} />
      {/* keyed by the mode: a new view starts collapsed again */}
      <Paras key={key + (watching ? '-watch' : '')} items={viewSection.paragraphs} max={SECTION_MAX} />
      <SectionHeader type="how" />
      <Paras items={HOW} max={SECTION_MAX} />
      <SectionHeader type="tips" />
      <Paras items={TIPS} max={SECTION_MAX} className="text-slate-400" />
    </aside>
  )
}
