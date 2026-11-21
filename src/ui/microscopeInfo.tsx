import { para, type Para } from './Paras'
import { SPECIMENS, howSeen, type MicroscopeBeam, type SpecimenId } from '../core/microscope'

// 🔬 Microscopes — the info panel (grown-ups' layer, 03-architecture
// "Info panels are for grown-ups"): one bold-led sentence per item, most
// important first, never restating what the canvas shows.

export function microscopeInfo(id: SpecimenId, beam: MicroscopeBeam) {
  const thing = SPECIMENS[id]
  const seen = howSeen(beam, thing.size)

  // 📍 only what the picture MEANS
  const rightNow: Para[] =
    beam === 'electrons'
      ? id === 'atoms'
        ? [
            para('⚛️', 'Each soft spot is one carbon atom,', ` ${thing.sizeText} — about the finest detail any microscope resolves.`),
            para('🎨', 'No colors:', ' electrons carry none; colors in famous pictures are painted on afterwards.'),
          ]
        : [
            para('⚡', 'Electron waves are ~100,000× shorter than light’s,', ' so even this casts a crisp shadow.'),
            para('🎨', 'No colors:', ' electrons carry none; colors in famous pictures are painted on afterwards.'),
          ]
      : seen === 'blur'
        ? [
            para('🌊', 'One light wave is bigger than it:', ' the wave closes round it and leaves no shadow — no lens can bring a shape back.'),
          ]
        : seen === 'fuzzy'
          ? [para('🌫️', 'Outline yes, details no:', ' the tails are thinner than half a wave, so they vanish in the blur.')]
          : []

  // 👀 the rule, then the two microscopes
  const seeing: Para[] = [
    para('🔍', 'You only see details bigger than about half the wave', ' you look with — smaller ones leave no shadow to see.'),
    para('💡', 'Light’s waves are ~0.5 µm long:', ' bacteria are the smallest things it shows; viruses never.'),
    para('⚡', 'Electrons are waves too, far shorter:', ' an electron microscope shows viruses, molecules, even atoms.'),
    para('📏', 'The ruler is a log scale:', ' each step is ten times smaller; hair to atom is six steps.'),
  ]

  // ⚖️ every simplification, biggest first
  const honest: Para[] = [
    para('🔬', 'A shadow stands in for the lens’s picture:', ' real resolution comes from how lenses gather the bent waves.'),
    para('📏', 'Waves too fine to draw are squeezed:', ' ten times finer draws only a little finer (about 150 light waves really fit across a hair) — their order stays true.'),
    para('🫙', 'Electron microscopes need a vacuum:', ' samples are dried, frozen or coated — nothing alive can be watched.'),
    para('⚛️', 'Atoms need the very best ones:', ' most electron microscopes stop at about a nanometre.'),
    para('🖥️', 'Electron pictures go to a screen or camera,', ' not your eye; both microscopes really stand upright.'),
  ]

  const tips: Para[] = [
    para('🪜', 'Step down the ruler one thing at a time', ' with light — the bacterium’s tails vanish first.'),
    para('⚡', 'At the virus, switch to electrons', ' and watch the waves shrink.'),
    para('👆', 'Tap a picture on the ruler', ' to fly straight to it.'),
  ]

  const story: Para[] = [
    para('🔭', 'Van Leeuwenhoek, 1670s:', ' with one tiny glass-bead lens he was the first to see bacteria.'),
    para('📐', 'Abbe, 1873:', ' worked out that light can never show details below about half a wave.'),
    para('⚡', 'Ruska, 1931:', ' built the first electron microscope; the Nobel Prize came 55 years later, in 1986.'),
  ]

  return { rightNow, seeing, honest, tips, story }
}
