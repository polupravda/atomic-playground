import { describe, expect, it } from 'vitest'
import {
  STARDUST_NARRATION,
  STARDUST_NARRATION_DE,
  STARDUST_NARRATION_ORDER,
  STARDUST_NARRATION_RU,
} from './stardustNarration'

const LANGS = { en: STARDUST_NARRATION, de: STARDUST_NARRATION_DE, ru: STARDUST_NARRATION_RU }

/** the RU script with its stress marks (U+0301) removed */
const plainRu = (id: string) => STARDUST_NARRATION_RU[id].replace(/́/g, '')

describe('the 🧒 narration script', () => {
  it('covers every story beat, in play order', () => {
    // mirrors cosmosStoryOrder('stardust') — kept literal here so the test
    // never has to import the (konva-backed) stage
    expect([...STARDUST_NARRATION_ORDER]).toEqual([
      'giant',
      'zoom',
      'forge0',
      'forge1',
      'boom',
      'drift',
      'earth',
      'alive',
      'you',
    ])
    for (const lines of Object.values(LANGS)) {
      expect(Object.keys(lines)).toEqual([...STARDUST_NARRATION_ORDER])
    }
  })

  it('keeps every line speakable: short, complete, written for the ear', () => {
    for (const [lang, lines] of Object.entries(LANGS)) {
      for (const id of STARDUST_NARRATION_ORDER) {
        const line = lines[id]
        const words = line.split(/\s+/).filter((w) => /\p{L}/u.test(w))
        expect(words.length, `${lang}:${id}`).toBeGreaterThanOrEqual(5)
        // term-teaching ("Super. Nova. ... Supernova.") earns extra words,
        // but a line past ~40 is a sign the beat is trying to say too much
        expect(words.length, `${lang}:${id}`).toBeLessThanOrEqual(40)
        expect(line, `${lang}:${id}`).toMatch(/[.!?]$/)
        // nothing a voice would stumble on: no parentheses, no equations
        expect(line, `${lang}:${id}`).not.toMatch(/[()=+→×]/)
      }
    }
  })

  it('lands the payoff', () => {
    expect(STARDUST_NARRATION.you).toContain('star stuff')
    expect(STARDUST_NARRATION_DE.you).toContain('Sternenstaub')
    expect(STARDUST_NARRATION_RU.you).toContain('звёздной пыли')
  })

  it('RU: marks the taught terms, avoids homographs, writes ё out', () => {
    // the bare dictionary-form repeats, each with exactly one stress mark
    const marked = ['Бери́ллий', 'Углеро́д', 'Сверхно́вая', 'Тума́нность', 'Си́нтез']
    const all = Object.values(STARDUST_NARRATION_RU).join(' ')
    for (const term of marked) expect(all, term).toContain(term)
    // homographs the voice misreads are rephrased away, not marked
    for (const id of STARDUST_NARRATION_ORDER) {
      expect(plainRu(id), id).not.toMatch(/(?<!\p{L})(ядра|звезды)(?!\p{L})/u)
    }
    // ё is never flattened to е in words that need it
    for (const word of ['звёздной', 'плывёт', 'нырнём', 'её']) expect(all, word).toContain(word)
  })

  it('teaches the key terms the screen shows', () => {
    expect(STARDUST_NARRATION.forge0).toContain('beryllium')
    expect(STARDUST_NARRATION.forge1.toLowerCase()).toContain('carbon')
    expect(STARDUST_NARRATION.boom.toLowerCase()).toContain('supernova')
    expect(STARDUST_NARRATION.drift).toContain('nebula')
    expect(STARDUST_NARRATION.alive).toContain('photosynthesis')
    expect(STARDUST_NARRATION_DE.forge0).toContain('Beryllium')
    expect(STARDUST_NARRATION_DE.forge1).toContain('Kohlenstoff')
    expect(STARDUST_NARRATION_DE.boom).toContain('Supernova')
    expect(STARDUST_NARRATION_DE.drift).toContain('Nebel')
    expect(STARDUST_NARRATION_DE.alive).toContain('Photosynthese')
    expect(plainRu('forge0')).toContain('Бериллий')
    expect(plainRu('forge1')).toContain('Углерод')
    expect(plainRu('boom')).toContain('Сверхновая')
    expect(plainRu('drift')).toContain('Туманность')
    expect(plainRu('alive')).toContain('фотосинтез')
  })

  it('has a pre-rendered audio file per beat and language (regenerate: scripts/narration-audio)', () => {
    const files = Object.keys(
      import.meta.glob('../../public/narration/stardust/*/*.m4a', { query: '?url' }),
    )
    for (const lang of Object.keys(LANGS)) {
      for (const id of STARDUST_NARRATION_ORDER) {
        expect(files.some((f) => f.endsWith(`/${lang}/${id}.m4a`)), `${lang}:${id}`).toBe(true)
      }
    }
  })
})
