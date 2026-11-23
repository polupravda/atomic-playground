import { describe, expect, it } from 'vitest'
import { BOMB_MODES, bombScripts } from './bombNarration'
import { FIREWORK_SCRIPTS } from './fireworkNarration'
import { SUN_SCRIPTS } from './sunNarration'
import { DETECTIVE_SCRIPTS } from './detectiveNarration'
import { GOLD_SCRIPTS } from './goldNarration'
import { PLANT_SCRIPTS } from './plantNarration'
import { LASER_SCRIPTS, LASER_STORY_KEY } from './laserNarration'
import { CUT_SCRIPTS, CUT_STORY_KEY } from './laserCutNarration'
import { MOON_SCRIPTS, MOON_STORY_KEY } from './laserMoonNarration'
import { DIGITAL_SCRIPTS, DIGITAL_STORY_KEY } from './digitalNarration'
import { WIFI_SCRIPTS, WIFI_STORY_KEY } from './wifiNarration'
import { INTERNET_SCRIPTS, INTERNET_STORY_KEY } from './internetNarration'
import { SCREEN_SCRIPTS, SCREEN_STORY_KEY } from './screenNarration'
import { MEMORY_SCRIPTS, MEMORY_STORY_KEY } from './memoryNarration'
import { SECRET_SCRIPTS, SECRET_STORY_KEY } from './secretNarration'
import { STARDUST_SCRIPTS } from './stardustNarration'
import { BOMB_MODES as MODES, bombStoryKey } from './bombNarration'
import { LINE_GAP_S, WATCH_BREAK_S, displayPiece, parseNarrationLine, pieceLanding, splitSentences } from './narrationScript'
import { chapterHeading } from '../ui/storyChapters'

// The 📖 story transcript: word for word what the voice says, minus what
// only the voice needs; and where a click on a sentence lands.

const ALL = [
  ...BOMB_MODES.map(bombScripts),
  FIREWORK_SCRIPTS,
  SUN_SCRIPTS,
  DETECTIVE_SCRIPTS,
  GOLD_SCRIPTS,
  PLANT_SCRIPTS,
  STARDUST_SCRIPTS,
]

describe('displayPiece', () => {
  it('drops the voice-only pause marks and keeps every word', () => {
    expect(displayPiece('Look! ... Two small dead stars circle each other.')).toBe('Look! Two small dead stars circle each other.')
    expect(displayPiece('It is called a neutron star. ... Neutron. Star.')).toBe('It is called a neutron star. Neutron. Star.')
    expect(displayPiece('... Beryllium. ...')).toBe('Beryllium.')
    // a written ellipsis (no space before it) is text, not a pause mark
    expect(displayPiece('And then... nothing happens.')).toBe('And then... nothing happens.')
  })

  it('never shows a Russian stress mark (Elena, 2026-11-20)', () => {
    expect(displayPiece('Нейтро́нная звезда́.')).toBe('Нейтронная звезда.')
    for (const scripts of ALL) {
      for (const line of Object.values(scripts.ru ?? {})) {
        for (const piece of parseNarrationLine(line).pieces) {
          const shown = displayPiece(piece)
          expect(shown).not.toMatch(/́/)
          expect(shown).not.toMatch(/(^|\s)\.\.\.(\s|$)/)
          // ё is a letter, not a stress mark: it stays
          if (piece.includes('ё')) expect(shown).toContain('ё')
        }
      }
    }
  })
})

describe('pieceLanding', () => {
  const secs = [3, 4, 5]
  it('lands at the beat start for the first piece', () => {
    expect(pieceLanding(parseNarrationLine('A. | B. | C.'), secs, 0)).toEqual({ offset: 0, frac: 0 })
  })

  it('science and show-first lines: the story moves only in watch breaks', () => {
    expect(pieceLanding(parseNarrationLine('A. | B. | C.'), secs, 2)).toEqual({ offset: WATCH_BREAK_S, frac: 0 })
    expect(pieceLanding(parseNarrationLine('|4| A. | B. | C.'), secs, 1)).toEqual({ offset: 4, frac: 0 })
    expect(pieceLanding(parseNarrationLine('| A. | B. | C.'), secs, 2)).toEqual({ offset: 2 * WATCH_BREAK_S, frac: 0 })
  })

  it('flow lines: the share of the line told before the piece', () => {
    const { offset, frac } = pieceLanding(parseNarrationLine('~ A. | B. | C.'), secs, 1)
    expect(offset).toBe(0)
    expect(frac).toBeCloseTo(3 / (12 + 2 * WATCH_BREAK_S))
  })

  it('run lines: the audio and the breaths before the piece', () => {
    expect(pieceLanding(parseNarrationLine('> A. | B. | C.'), secs, 2)).toEqual({ offset: 3 + 4 + 2 * LINE_GAP_S, frac: 0 })
  })

  it('a later sentence, 2 s into its piece: where the story stands while it is said', () => {
    // science: frozen while the piece is said, the break before it over
    expect(pieceLanding(parseNarrationLine('A. | B. | C.'), secs, 1, 2)).toEqual({ offset: WATCH_BREAK_S, frac: 0 })
    expect(pieceLanding(parseNarrationLine('| A. B.'), [5], 0, 2)).toEqual({ offset: WATCH_BREAK_S, frac: 0 })
    // a plain one-piece line creeps on in slow motion while it is said
    expect(pieceLanding(parseNarrationLine('A. B. C.'), [6], 0, 2, 0.15).offset).toBeCloseTo(0.3)
    // run: the audio before it, and 2 s more
    expect(pieceLanding(parseNarrationLine('> A. | B.'), secs, 1, 2)).toEqual({ offset: 3 + LINE_GAP_S + 2, frac: 0 })
    // flow: the share of the line told before it
    const { frac } = pieceLanding(parseNarrationLine('~ A. | B. | C.'), secs, 1, 2)
    expect(frac).toBeCloseTo((3 + WATCH_BREAK_S + 2) / (12 + 2 * WATCH_BREAK_S))
  })
})

describe('splitSentences', () => {
  it('splits every piece into sentences; short repeats and openers stay with one', () => {
    expect(splitSentences('In here, two helium nuclei crash and stick. They make a wobbly pair called beryllium. ... Beryllium. ... But it holds together only for a blink.')).toEqual([
      'In here, two helium nuclei crash and stick.',
      'They make a wobbly pair called beryllium. ... Beryllium.',
      'But it holds together only for a blink.',
    ])
    expect(splitSentences('Look! ... Two small dead stars circle each other.')).toEqual(['Look! ... Two small dead stars circle each other.'])
    expect(splitSentences('Come. Let us dive into its heart.')).toEqual(['Come. Let us dive into its heart.'])
    // a written ellipsis before a small letter is no sentence end
    expect(splitSentences('And then... nothing happens. For millions of years, it drifts.')).toEqual([
      'And then... nothing happens.',
      'For millions of years, it drifts.',
    ])
    expect(splitSentences('This explosion is called a supernova. Super. Nova. ... Supernova.')).toHaveLength(1)
  })
})

/** every story's audio folder and scripts */
const STORIES: Array<[string, Partial<Record<'en' | 'de' | 'ru', Record<string, string>>>]> = [
  ...MODES.map((m) => [bombStoryKey(m), bombScripts(m)] as [string, ReturnType<typeof bombScripts>]),
  ['firework', FIREWORK_SCRIPTS],
  ['sun', SUN_SCRIPTS],
  ['detective', DETECTIVE_SCRIPTS],
  ['gold', GOLD_SCRIPTS],
  ['plant', PLANT_SCRIPTS],
  [LASER_STORY_KEY, LASER_SCRIPTS],
  [CUT_STORY_KEY, CUT_SCRIPTS],
  [MOON_STORY_KEY, MOON_SCRIPTS],
  [DIGITAL_STORY_KEY, DIGITAL_SCRIPTS],
  [WIFI_STORY_KEY, WIFI_SCRIPTS],
  [INTERNET_STORY_KEY, INTERNET_SCRIPTS],
  [SCREEN_STORY_KEY, SCREEN_SCRIPTS],
  [MEMORY_STORY_KEY, MEMORY_SCRIPTS],
  [SECRET_STORY_KEY, SECRET_SCRIPTS],
  ['stardust', STARDUST_SCRIPTS],
]

/** every sentences.json, by "<story>/<lang>" */
const TIMINGS: Record<string, Record<string, number[][]>> = Object.fromEntries(
  Object.entries(import.meta.glob('../../public/narration/*/*/sentences.json', { eager: true, import: 'default' })).map(
    ([path, json]) => [path.split('/').slice(-3, -1).join('/'), json as Record<string, number[][]>],
  ),
)

describe('sentences.json (where each sentence starts in its audio)', () => {
  it('exists for every story and language, one rising start per sentence', () => {
    for (const [key, scripts] of STORIES) {
      for (const [lang, lines] of Object.entries(scripts)) {
        const t = TIMINGS[`${key}/${lang}`]
        expect(t, `${key}/${lang}: run npm run timings`).toBeDefined()
        for (const [beat, line] of Object.entries(lines!)) {
          parseNarrationLine(line).pieces.forEach((piece, k) => {
            const starts = t[beat]?.[k]
            expect(starts, `${key}/${lang}/${beat}#${k}`).toHaveLength(splitSentences(piece).length)
            expect(starts[0]).toBe(0)
            for (let i = 1; i < starts.length; i++) expect(starts[i]).toBeGreaterThan(starts[i - 1])
          })
        }
      }
    }
  })
})

describe('chapter headings', () => {
  it('keep their icon and translate their text', () => {
    expect(chapterHeading('💍 A question', 'en')).toBe('💍 A question')
    expect(chapterHeading('💍 A question', 'de')).toBe('💍 Eine Frage')
    expect(chapterHeading('🎈 The payoff', 'ru')).toBe('🎈 Разгадка')
    expect(chapterHeading('🔍 Close-up: atoms being hit', 'de')).toBe('🔍 Ganz nah: Atome werden getroffen')
  })
})
