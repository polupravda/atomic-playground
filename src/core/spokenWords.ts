import { ELEMENTS } from './elements'
import { ELEMENT_NAMES_DE, ELEMENT_NAMES_RU } from './elementNames'
import { BOND_SCENARIOS, type BondScenario } from './bonding'

// 🔊 What the speak buttons say — the single source of truth for the
// pre-rendered word clips (element names, the bonding lab's molecules).
// The clips are rendered with the stories' own voice (Kokoro af_heart, the
// same EN speed) by scripts/narration-audio (`npm run generate words`)
// into public/narration/words/en/<id>.m4a; there is no speech-synthesis
// fallback anywhere (docs/how-things-work/10-narration-strategy.md).
// English for every element and molecule; the 🧪 bonding lab also speaks
// in the voice's language (DE · RU, Edge voices like the stories): its
// molecules' names, a one-sentence description of each (what it looks like
// and what it is used for, said when a molecule is first built), and the
// five tray elements' names (Elena, 2026-11-22).
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

/** a bonding-lab molecule's description clip: what it looks like, what it
 *  is used for in real life */
export const bondInfoWord = (id: string) => `bond-info-${id}`

/** the bonding lab's tray elements (their names are spoken in DE · RU too) */
export const BONDING_ELEMENTS = [1, 6, 8, 11, 17] as const

/** one sentence each: what the stuff looks like, and where we meet it */
export const BOND_INFO: Record<'en' | 'de' | 'ru', Record<string, string>> = {
  en: {
    h2: 'Hydrogen is a gas you cannot see. It is the lightest of all, and it can power cars and rockets.',
    o2: 'Oxygen is a gas you cannot see or smell. You breathe it in with every breath.',
    cl2: 'Chlorine is a yellow-green gas, poisonous to breathe. A tiny bit keeps swimming pools clean.',
    hcl: 'Hydrogen chloride is a gas with a sharp smell. In water it becomes an acid, and your stomach uses it to digest food.',
    nacl: 'Table salt is made of tiny white crystal cubes. We sprinkle it on our food.',
    h2o: 'Water is clear, with no color, taste or smell. Every living thing needs it.',
    h2o2: 'Hydrogen peroxide looks just like water. It fizzes on a scrape and cleans it.',
    co: 'Carbon monoxide is a dangerous gas you cannot see or smell. Alarms in our homes warn us about it.',
    co2: 'Carbon dioxide is a gas you cannot see. You breathe it out, and it makes the bubbles in soda.',
    ch4: 'Methane is a gas you cannot see or smell. In a gas stove it burns with a blue flame.',
  },
  de: {
    h2: 'Wasserstoff ist ein unsichtbares Gas. Es ist das leichteste von allen und kann Autos und Raketen antreiben.',
    o2: 'Sauerstoff ist ein Gas, das man weder sehen noch riechen kann. Du atmest es mit jedem Atemzug ein.',
    cl2: 'Chlor ist ein gelbgrünes, giftiges Gas. Ein winziges bisschen hält Schwimmbäder sauber.',
    hcl: 'Chlorwasserstoff ist ein Gas mit stechendem Geruch. In Wasser wird es zur Säure, und dein Magen verdaut damit das Essen.',
    nacl: 'Kochsalz besteht aus winzigen weißen Kristallwürfeln. Wir streuen es auf unser Essen.',
    h2o: 'Wasser ist klar, ohne Farbe, Geschmack und Geruch. Alles Lebendige braucht es.',
    h2o2: 'Wasserstoffperoxid sieht genauso aus wie Wasser. Auf einer Schürfwunde schäumt es und macht sie sauber.',
    co: 'Kohlenmonoxid ist ein gefährliches Gas, das man weder sehen noch riechen kann. Melder in unseren Wohnungen warnen davor.',
    co2: 'Kohlendioxid ist ein unsichtbares Gas. Du atmest es aus, und es macht die Bläschen in der Limonade.',
    ch4: 'Methan ist ein Gas, das man weder sehen noch riechen kann. Im Gasherd brennt es mit blauer Flamme.',
  },
  ru: {
    h2: 'Водород невидим, это самый лёгкий газ. На нём могут ездить машины и летать ракеты.',
    o2: 'Кислород нельзя ни увидеть, ни почуять. Ты вдыхаешь его с каждым вдохом.',
    cl2: 'Хлор это жёлто-зелёный ядовитый газ. Капелька хлора делает воду в бассейне чистой.',
    hcl: 'Хлороводород резко пахнет. В воде он становится кислотой, и твой желудок переваривает ею еду.',
    nacl: 'Поваренная соль состоит из крошечных белых кристалликов-кубиков. Мы солим ею еду.',
    h2o: 'Вода прозрачная, у неё нет цвета, вкуса и запаха. Она нужна всему живому.',
    h2o2: 'Перекись водорода выглядит точно как вода. На ссадине она шипит и очищает её.',
    co: 'Угарный газ опасен, его нельзя ни увидеть, ни почуять. Датчики в квартирах предупреждают о нём.',
    co2: 'Углекислый газ невидим. Ты выдыхаешь его, и он делает пузырьки в газировке.',
    ch4: 'Метан нельзя ни увидеть, ни почуять. В газовой плите он горит синим пламенем.',
  },
}

const DIGITS_DE = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun']

/** a formula read the German way: letter by letter, digits as words */
export function spokenFormulaDe(formula: string): string {
  return [...formula]
    .map((ch) => {
      const sub = SUBSCRIPTS.indexOf(ch)
      if (sub >= 0) return DIGITS_DE[sub]
      return ch.toUpperCase()
    })
    .join(' ')
}

/** the molecules' names in German, and how Russian chemists read the
 *  formula (letter names, Cl and Na as element names) with the name */
export const BOND_NAMES_DE: Record<string, string> = {
  h2: 'Wasserstoffmolekül',
  o2: 'Sauerstoffmolekül',
  cl2: 'Chlormolekül',
  hcl: 'Chlorwasserstoff',
  nacl: 'Kochsalz',
  h2o: 'Wasser',
  h2o2: 'Wasserstoffperoxid',
  co: 'Kohlenmonoxid',
  co2: 'Kohlendioxid',
  ch4: 'Methan',
}
export const BOND_LINES_RU: Record<string, string> = {
  h2: 'Аш два. ... Молекула водорода.',
  o2: 'О два. ... Молекула кислорода.',
  cl2: 'Хлор два. ... Молекула хлора.',
  hcl: 'Аш хлор. ... Хлороводород.',
  nacl: 'Натрий хлор. ... Поваренная соль.',
  h2o: 'Аш два О. ... Вода.',
  h2o2: 'Аш два О два. ... Перекись водорода.',
  co: 'Цэ О. ... Угарный газ.',
  co2: 'Цэ О два. ... Углекислый газ.',
  ch4: 'Цэ аш четыре. ... Метан.',
}

/** every word clip: id → the line the voice says */
export const SPOKEN_WORDS: Record<string, string> = Object.fromEntries([
  ...ELEMENTS.map((e) => [elementWord(e.atomicNumber), `${e.name}.`]),
  ...BOND_SCENARIOS.map((s) => [bondWord(s.id), bondLine(s)]),
  ...BOND_SCENARIOS.map((s) => [bondInfoWord(s.id), BOND_INFO.en[s.id]]),
])

/** 🇩🇪 the bonding lab's clips in German */
export const SPOKEN_WORDS_DE: Record<string, string> = Object.fromEntries([
  ...BONDING_ELEMENTS.map((z) => [elementWord(z), `${ELEMENT_NAMES_DE[z - 1]}.`]),
  ...BOND_SCENARIOS.map((s) => [bondWord(s.id), `${spokenFormulaDe(s.formula)}. ... ${BOND_NAMES_DE[s.id]}.`]),
  ...BOND_SCENARIOS.map((s) => [bondInfoWord(s.id), BOND_INFO.de[s.id]]),
])

/** 🇷🇺 the bonding lab's clips in Russian */
export const SPOKEN_WORDS_RU: Record<string, string> = Object.fromEntries([
  ...BONDING_ELEMENTS.map((z) => [elementWord(z), `${ELEMENT_NAMES_RU[z - 1]}.`]),
  ...BOND_SCENARIOS.map((s) => [bondWord(s.id), BOND_LINES_RU[s.id]]),
  ...BOND_SCENARIOS.map((s) => [bondInfoWord(s.id), BOND_INFO.ru[s.id]]),
])

/** every language's word clips */
export const SPOKEN_WORDS_BY_LANG = { en: SPOKEN_WORDS, de: SPOKEN_WORDS_DE, ru: SPOKEN_WORDS_RU }
