import { SUN_SCENE_START, sunCloseupCamera } from './sunStory'

// R04 🧒 "You are star stuff" — the story script for the carbon atom's
// journey. The forge close-up shows the real triple-alpha process, honestly
// including the blink-of-an-eye beryllium-8 step:
//   ⁴He + ⁴He → ⁸Be (unstable — it survives a billionth of a billionth of a
//   second), and only if a third ⁴He hits RIGHT THEN: ⁸Be + ⁴He → ¹²C + γ.
// Nucleon count: 4 + 4 + 4 = 12. And 6 protons IS carbon (A03's lesson).

// the forge reuses the Sun story's dive-in camera (same pacing)
export { SUN_SCENE_START as FORGE_SCENE_START, sunCloseupCamera as forgeCamera }

/** forge close-up beats (scene time, s): f0 two stick · f1 the third hits */
export const FORGE_STEP_ENDS = [5.5, Infinity]
export const FORGE_STEP_COUNT = FORGE_STEP_ENDS.length
export const FORGE_SCENE_LEN = 12.5
export const FORGE_TOTAL = SUN_SCENE_START + FORGE_SCENE_LEN

export function forgeStep(t: number): number {
  const s = t - SUN_SCENE_START
  return Math.max(
    0,
    FORGE_STEP_ENDS.findIndex((end) => s < end),
  )
}

export interface ForgeStepText {
  icon: string
  title: string
  caption: string
  equation: string
  panel: Array<{ icon: string; text: string }>
}

export function forgeStory(): ForgeStepText[] {
  return [
    {
      icon: '🤝',
      title: 'Two heliums stick — barely',
      caption:
        'In the old star\'s core, two helium nuclei crash and stick — but the pair survives only a blink of an eye.',
      equation: '⁴He + ⁴He → ⁸Be (wobbly!)',
      panel: [
        {
          icon: '🔥',
          text: 'This core is far hotter than the Sun\'s — over 100 million degrees. Here the FUEL is helium: the ash of a lifetime of hydrogen burning.',
        },
        {
          icon: '🤝',
          text: 'Two helium nuclei stick into beryllium-8 — which is so wobbly it falls apart almost instantly. The whole recipe hangs on what happens in that blink.',
        },
      ],
    },
    {
      icon: '💎',
      title: 'The third one hits: carbon!',
      caption:
        'A third helium hits RIGHT THEN: carbon-12 — count it: 4 + 4 + 4 = 12, with 6 protons. Six protons IS carbon.',
      equation: '⁸Be + ⁴He → ¹²C + γ',
      panel: [
        {
          icon: '💎',
          text: 'A third helium arrives in time: carbon-12 holds together, and the spare energy leaves as a γ photon. Count the nucleons: 4 + 4 + 4 = 12. Count the protons: 2 + 2 + 2 = 6 — and six protons IS carbon (the builder\'s first lesson).',
        },
        {
          icon: '⭐',
          text: 'THIS atom — follow its amber ring from now on — is the hero of the story. Every carbon atom in you was born exactly like this, inside a star that died before the Sun existed.',
        },
      ],
    },
  ]
}
