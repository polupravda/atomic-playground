import { clamp01, easeInOut } from './canvasUtil'
import { PP_STEPS } from '../core/cosmos'

// R04 ☀️ "Why the Sun shines" — the story script: ONE source for the canvas
// timings, the story timeline and the info panel (the fissionCloseup /
// lightCloseup pattern). The close-up shows the REAL pp-I chain in three
// steps, with the builder's own particle language (β⁺ positron, ghost
// neutrino, violet γ).

// ---- the zoom into the core (R01 pacing) ----
const HOLD_IN = 0.6
const ZOOM_T = 1.2
export const SUN_SCENE_START = HOLD_IN + ZOOM_T + 0.6
export const SUN_CLOSEUP_MAX_ZOOM = 9

/** camera while diving into the core (no zoom out — the story moves on) */
export function sunCloseupCamera(t: number): { zoom: number; sceneAlpha: number; marker: number } {
  const zIn = clamp01((t - HOLD_IN) / ZOOM_T)
  const zoom = 1 + (SUN_CLOSEUP_MAX_ZOOM - 1) * easeInOut(zIn)
  const sceneAlpha = clamp01((t - (HOLD_IN + ZOOM_T - 0.35)) / 0.35)
  const pulse = 0.8 + 0.2 * Math.sin(t * 6)
  const marker = t < HOLD_IN + 0.3 ? pulse * (1 - clamp01((t - HOLD_IN) / 0.3)) : 0
  return { zoom, sceneAlpha, marker }
}

// ---- the close-up beats (scene time, s) ----
// c0 the crowded core · c1 p+p → ²H + e⁺ + ν · c2 ²H+p → ³He + γ ·
// c3 ³He+³He → ⁴He + 2p
export const SUN_STEP_ENDS = [3.0, 7.5, 11.5, Infinity]
export const SUN_CLOSEUP_STEP_COUNT = SUN_STEP_ENDS.length
export const SUN_SCENE_LEN = 16.5
export const SUN_CLOSEUP_TOTAL = SUN_SCENE_START + SUN_SCENE_LEN

/** which close-up step is showing for a close-up clock `t` */
export function sunCloseupStep(t: number): number {
  const s = t - SUN_SCENE_START
  return Math.max(
    0,
    SUN_STEP_ENDS.findIndex((end) => s < end),
  )
}

export interface SunStepText {
  icon: string
  title: string
  caption: string
  equation: string
  panel: Array<{ icon: string; text: string }>
}

export function sunCloseupStory(): SunStepText[] {
  return [
    {
      icon: '🔥',
      title: 'The crowded core',
      caption:
        '15 million degrees, squeezed by the weight of the whole Sun: bare protons everywhere, crashing all day.',
      equation: 'p … p … p …',
      panel: [
        {
          icon: '🔍',
          text: 'We are in the Sun\'s core. The electrons were stripped away long ago — only bare hydrogen nuclei (protons) remain, rushing and crashing. Like charges push each other apart (remember the ⚡ charge playground), so almost every crash is a bounce.',
        },
        {
          icon: '🍀',
          text: 'Only a PERFECT head-on crash sticks. One proton waits billions of years for its lucky hit — the Sun shines anyway, because it has so unimaginably many protons.',
        },
      ],
    },
    {
      icon: '🤝',
      title: 'Two protons stick',
      caption:
        'The lucky crash! One proton turns into a neutron — out fly a positron and a ghostly neutrino.',
      equation: PP_STEPS[0].equation,
      panel: [
        {
          icon: '🤝',
          text: 'Two protons hit head-on and STICK. The pair can only hold together if one proton turns into a neutron — throwing out a positron (the red β⁺ you know from the decay animations) and a neutrino. The stuck pair is deuterium: heavy hydrogen.',
        },
        {
          icon: '👻',
          text: 'The neutrino is drawn barely-there on purpose: trillions fly through your body every second and almost never touch an atom.',
        },
      ],
    },
    {
      icon: '➕',
      title: 'A third proton joins',
      caption: 'Deuterium catches another proton: helium-3 — and a flash of γ light.',
      equation: PP_STEPS[1].equation,
      panel: [
        {
          icon: '➕',
          text: 'The deuterium quickly catches a third proton and becomes helium-3 (2 protons + 1 neutron). The leftover energy flies out as a γ photon — the same violet wavy symbol as everywhere in the playground.',
        },
      ],
    },
    {
      icon: '☀️',
      title: 'Helium is born',
      caption:
        'Two helium-3 crash: helium-4 holds together, two protons go back to the crowd. Four hydrogens became one helium.',
      equation: PP_STEPS[2].equation,
      panel: [
        {
          icon: '☀️',
          text: 'Two helium-3 nuclei crash together: a helium-4 nucleus (2p + 2n) holds together and two protons fly back to the crowd to try again. Count the whole journey: FOUR hydrogens went in, ONE helium came out.',
        },
        {
          icon: '🥣',
          text: 'That is why the Sun\'s recipe slowly changes: its core keeps turning hydrogen into helium — the Sun\'s ash. It has enough hydrogen left for about 5 billion more years.',
        },
      ],
    },
  ]
}
