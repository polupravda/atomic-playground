import type { BombDesignId } from '../core/fission'
import { FLOW_MARK, RUN_MARK } from './narrationScript'

// R01 ☢️ "Atomic bomb" — the narration script: one spoken line per 📖 story
// beat, per bomb (the keys are FissionStage's storyOrder). English only so
// far. Written to docs/how-things-work/10-narration-strategy.md: one
// thought per short sentence, every on-screen term named and taught slowly
// ("This is called a chain reaction. ... Chain. Reaction."), ' ... ' for a
// real pause, the repeat without its article, ' | ' between the pieces of
// a science line (SCIENCE PACING: the voice stops, the animation shows
// it), '~ ' for the chain reaction (FLOW: never held, slowed instead). Tone: calm and factual — this demo is about how the physics works,
// never about the thrill of it. History is told briefly and kid-friendly:
// the cities were destroyed, the victims are not narrated (the info
// panel's true story covers them for grown-ups).

/** the bomb's fuel, as the close-up shows it */
const FUEL: Record<BombDesignId, { metal: string; split: [string, string] }> = {
  gun: { metal: 'uranium', split: ['barium', 'krypton'] },
  implosion: { metal: 'plutonium', split: ['xenon', 'zirconium'] },
  tsar: { metal: 'plutonium', split: ['xenon', 'zirconium'] },
}

/** who built it and when (core/fission.ts: BOMB_HISTORY). SHOW FIRST, one
 *  fact per piece: before each piece, its fact card pops onto the canvas
 *  (bombIntro.ts — name, country, year, team, leader with portrait). The
 *  zoom to the real-shape view follows in silence. No size, weight or
 *  "comes closer" here (Elena, 2026-11-18): the canvas shows them. */
const INTRO: Record<BombDesignId, string> = {
  gun: '| This is Little Boy. | It was built in the United States. | That was in nineteen forty five. | A team of scientists called the Manhattan Project built it. | Their leader was Robert Oppenheimer.',
  implosion:
    '| This is Fat Man. | It was built in the United States. | That was in nineteen forty five. | A team of scientists called the Manhattan Project built it. | Their leader was Robert Oppenheimer.',
  tsar: '| This is Tsar Bomba. | It was built in the Soviet Union. | That was in nineteen sixty one. | A team of Soviet scientists built it. | Their leaders were Yulii Khariton and Andrei Sakharov.',
}

/** what happened to it — the last thing the story says */
const FATE: Record<BombDesignId, string> = {
  gun: 'Bombs like this were used in war only twice. In August nineteen forty five, Little Boy was dropped on the city of Hiroshima, in Japan. The city was destroyed. Since then, no atomic bomb has been used in war.',
  implosion:
    'Bombs like this were used in war only twice. In August nineteen forty five, Fat Man was dropped on the city of Nagasaki, in Japan. The city was destroyed. Since then, no atomic bomb has been used in war.',
  tsar: 'Tsar Bomba was only ever tested, high above an empty island in the Arctic. It was never used on a city. It was so big that it was never turned into a weapon.',
}

const ARMED: Record<BombDesignId, string> = {
  gun: 'Inside the bomb, two pieces of uranium wait apart. | Each piece alone is too small. Its neutrons would simply escape.',
  implosion:
    'Inside the bomb sits a ball of plutonium. Explosive blocks surround it on every side. | The ball alone is too small. Its neutrons would simply escape.',
  tsar: 'This bomb has two parts. The first part is a small plutonium bomb. It is only the match. | The second part is hydrogen fuel.',
}

const ASSEMBLING: Record<BombDesignId, string> = {
  gun: 'The explosive fires one piece of uranium into the other.',
  implosion: 'All the explosive blocks fire at the same moment. They squeeze the plutonium ball.',
  tsar: 'The explosives around the trigger fire together. They squeeze its plutonium.',
}

/** the chain line's first piece: said as the chain starts in the lump */
const CRITICAL: Record<BombDesignId, string> = {
  gun: 'Together they make one lump, big enough for a chain to keep going. This is called a critical mass. ... Critical. Mass.',
  implosion:
    'Squeezed this tight, it is enough for a chain to keep going. This is called a critical mass. ... Critical. Mass.',
  tsar: 'Now it is enough for a chain to keep going. This is called a critical mass. ... Critical. Mass.',
}

/** FLOW pacing (narrationScript.ts): the chain reaction, from the moment
 *  the fuel comes together to the last split, never stops — it plays in
 *  slow motion, fitted to its narration */
const flow = (line: string) => `${FLOW_MARK}${line}`

export function bombNarration(mode: BombDesignId): Record<string, string> {
  const { metal, split } = FUEL[mode]
  const lines: Record<string, string> = {
    intro: INTRO[mode],
    armed: ARMED[mode],
    countdown: 'Now comes the countdown. Watch the numbers.',
    assembling: ASSEMBLING[mode],
    chain:
      `${CRITICAL[mode]} | ` +
      (mode === 'tsar' ? 'The trigger goes off like a small bomb. ' : '') +
      'One neutron hits a nucleus, and the nucleus splits. | It throws out two or three new neutrons. They split more nuclei. | This is called a chain reaction. ... Chain. Reaction.',
    closeup0:
      'Let us zoom in on the atoms. A neutron flies in. | It has no electric charge. So nothing pushes it away.',
    closeup1: `The ${metal} nucleus swallows the neutron. | Now it is far too wobbly. It stretches, like a peanut.`,
    closeup2: `And it splits! Two smaller atoms fly apart. | They are ${split[0]} and ${split[1]}. New neutrons fly out, with lots of energy. | Splitting a nucleus is called fission. ... Fission.`,
    closeup3: 'One of the new neutrons flies to the next atom. ... And it hits!',
    closeup4: 'The second atom splits too. | One of its neutrons flies on to a third atom.',
    closeup5: 'The third atom splits as well. | Every split frees more neutrons. So the chain keeps growing.',
    chainAfter: 'Back to the whole bomb. The chain reaction races through the rest of the metal.',
  }
  if (mode === 'tsar') {
    lines.xray =
      'The trigger blasts out invisible rays. They are called X-rays. ... X-rays. | They squeeze the hydrogen fuel, and heat it up enormously.'
    lines.fusion =
      'Now the hydrogen nuclei crash together and stick. They become helium. | Joining nuclei like this is called fusion. ... Fusion. ... The Sun shines the same way.'
  }
  lines.chainDone =
    mode === 'tsar'
      ? 'Most of the energy came from fusion. And all of it comes out at once, in a few millionths of a second.'
      : 'Every split released a little energy. And all of it comes out at once, in less than a millionth of a second.'
  // the chain reaction flows: from the fuel coming together to the last split
  for (const id of Object.keys(lines)) {
    if (id === 'chain' || id.startsWith('closeup') || ['chainAfter', 'xray', 'fusion', 'chainDone'].includes(id))
      lines[id] = flow(lines[id])
  }
  lines.explosion0 =
    'The energy becomes a ball of glowing air. It is hotter than the surface of the Sun. | This is called a fireball. ... Fireball.'
  lines.explosion1 =
    'A wall of squeezed air races out along the ground. This is called a shock wave. ... Shock. Wave. | The coloured rings show the damage it does.'
  lines.explosion2 = 'The hot fireball rises. It sucks a column of dust up behind it.'
  lines.explosion3 =
    'The fireball keeps rising, like a hot air balloon. | It spreads out into a giant cloud. This is called a mushroom cloud. ... Mushroom. Cloud.'
  // RUN pacing (Elena, 2026-11-18): the explosion plays at its own speed,
  // never held; the voice catches up while the mushroom cloud billows,
  // and only then comes the size comparison
  for (const id of ['explosion0', 'explosion1', 'explosion2', 'explosion3']) lines[id] = `${RUN_MARK}${lines[id]}`
  // show first: the size comparison zooms out (1.8 s) before it is explained
  lines.explosion4 = `| Here are all three explosions side by side, on the same scale. The red rings show where houses were flattened. | ${FATE[mode]}`
  return lines
}

export const BOMB_MODES: BombDesignId[] = ['gun', 'implosion', 'tsar']

/** the audio folder of one bomb's narration: public/narration/<key>/ */
export const bombStoryKey = (mode: BombDesignId) => `bomb-${mode}`
