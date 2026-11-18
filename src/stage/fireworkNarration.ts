// R02 ✨ "Light & color" — 🎆 Firework: the narration script, one spoken
// line per 📖 story beat (the keys are LightStage's lightStoryOrder).
// English only so far. Written to
// docs/how-things-work/10-narration-strategy.md: one thought per short
// sentence, terms named and taught slowly, ' ... ' for a real pause, the
// repeat without its article. A science-intense story: almost every line
// is split into information pieces (' | ') — SCIENCE PACING, the voice
// stops after each piece and the animation shows it.

export const FIREWORK_NARRATION: Record<string, string> = {
  scene:
    'Look at the night sky. A firework shell races up, and bursts into red and yellow sparks. | Every spark is a crowd of glowing hot atoms.',
  zoom: 'Let us dive into one red spark, all the way down to its atoms.',
  closeup0:
    'Inside the spark sits an atom called lithium. ... Lithium. | Heat from the burning powder washes over it.',
  closeup1:
    'The heat gives the outer electron a kick. It jumps up to a higher seat. | But this seat is not its home.',
  closeup2: 'The electron wobbles up there. It cannot stay for long.',
  closeup3:
    'It falls back home. And a flash of deep red light flies out. | This little piece of light is called a photon. ... Photon. | A small drop makes red light. A big drop makes blue light.',
  closeup4:
    'Next door sits a sodium atom. ... Sodium. ... It does the same dance. | But its step is taller. So its photon is yellow.',
  barcode:
    // show first: let the first photons land on the strips before explaining them
    '| Now many atoms flash at random. Every photon lands on its own line. | Slowly, a pattern of lines appears. | It is the element’s fingerprint. Every element has its own.',
  payoff:
    // show first, 4 s: the red shell bursts at 1.5 s, the yellow one at 2.8 s
    '|4| Back to the sky. The red sparks are lithium. The yellow sparks are sodium. | No other atom can make exactly these colors.',
}
