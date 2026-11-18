// R04 🌟 "Star stuff" — ☀️ Why the Sun shines: the narration script, one
// spoken line per 📖 story beat (the keys are cosmosStoryOrder('sun')).
// English only so far. Written to
// docs/how-things-work/10-narration-strategy.md: one thought per short
// sentence, terms named and taught slowly, ' ... ' for a real pause, the
// repeat without its article, numbers written as words for the voice.
// A science-intense story: its lines are split into information pieces
// (' | ') — SCIENCE PACING, the voice stops after each piece and the
// animation shows it.

export const SUN_NARRATION: Record<string, string> = {
  sun: 'This is our star, the Sun. It is a giant ball of glowing gas. | The tiny blue dot is the Earth, drawn to the same scale.',
  recipe:
    // show first: the ingredient bar grows (1.6 s) before the numbers are read
    '| What is the Sun made of? Out of every hundred kilograms, seventy three are hydrogen. ... Hydrogen. ... Twenty five are helium. ... Helium. | We can tell from the dark lines in sunlight.',
  zoom: 'Let us dive into the core of the Sun. | It is fifteen million degrees hot. The weight of the whole Sun squeezes it.',
  closeup0:
    'The core is crowded with bare protons. | They crash into each other all day long. But almost always, they just bounce apart.',
  closeup1:
    'Sometimes two protons crash hard enough to stick. Together they make heavy hydrogen. It is called deuterium. ... Deuterium. | Two tiny particles fly away. One of them is like a ghost. It is called a neutrino. ... Neutrino.',
  closeup2:
    'Then another proton joins in. | Now the nucleus is a light kind of helium. A flash of energy flies out.',
  closeup3:
    'Two of these light heliums crash together. They make one real helium nucleus. | Two protons are set free, to try again. | Joining nuclei like this is called fusion. ... Fusion.',
  scale:
    'Now let us weigh it. Four hydrogens go in. One helium comes out. | And the helium is a little lighter! | The missing bit has turned into light. That is why the Sun shines.',
  walk: 'The newborn light is trapped. It bounces around inside the Sun for about a hundred thousand years. | Then it reaches the surface. From there, it flies to Earth in just eight minutes.',
  valley:
    'This is the energy valley. | Small nuclei roll down by joining together. That is the Sun. | Huge nuclei roll down by splitting apart. That is the bomb. | Iron sits at the very bottom.',
}
