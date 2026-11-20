import { ELEMENTS } from './elements'
import { BOND_SCENARIOS, type BondScenario } from './bonding'

// 🔊 What the speak buttons say — the single source of truth for the
// pre-rendered word clips (element names, the bonding lab's molecules).
// The clips are rendered with the stories' own voice (Kokoro af_heart, the
// same EN speed) by scripts/narration-audio (`npm run generate words`)
// into public/narration/words/en/<id>.m4a; there is no speech-synthesis
// fallback anywhere (docs/how-things-work/10-narration-strategy.md).
// English only: the buttons pronounce the English label next to them.
// A ' ... ' is a short pause (rendered as silence, like in the stories).
// Words the voice gets wrong are fixed in the GENERATOR (EN_PHONEMES),
// never by misspelling them here.

/** the audio folder: public/narration/<WORDS_KEY>/en/ */
export const WORDS_KEY = 'words'

/** an element's name clip */
export const elementWord = (z: number) => `element${z}`
/** a bonding-lab molecule clip: its formula, then its name */
export const bondWord = (id: string) => `bond-${id}`

const DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉'

/**
 * A formula read the way chemists say it: letter by letter, digits as
 * words — "H₂O" → "H two O". A lone "A" would be read as the article
 * ("uh"), so a formula with an A is spelled with commas: "N, A, C, L".
 */
export function spokenFormula(formula: string): string {
  const parts = [...formula].map((ch) => {
    const sub = SUBSCRIPTS.indexOf(ch)
    if (sub >= 0) return DIGITS[sub]
    if (/\d/.test(ch)) return DIGITS[Number(ch)]
    return ch.toUpperCase()
  })
  return parts.join(parts.includes('A') ? ', ' : ' ')
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "H two O. ... Water." */
export const bondLine = (s: BondScenario) => `${spokenFormula(s.formula)}. ... ${capital(s.name)}.`

/** every word clip: id → the line the voice says */
export const SPOKEN_WORDS: Record<string, string> = Object.fromEntries([
  ...ELEMENTS.map((e) => [elementWord(e.atomicNumber), `${e.name}.`]),
  ...BOND_SCENARIOS.map((s) => [bondWord(s.id), bondLine(s)]),
])
